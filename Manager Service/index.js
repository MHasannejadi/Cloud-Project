const { GetObjectCommand } = require("@aws-sdk/client-s3");
const qs = require("querystring");
const fs = require("fs");
const createChannel = require("./amqp");
const s3 = require("./s3");
const pool = require("./db");

// Function to handle incoming messages
async function handleMessage(message) {
  const id = message.content.toString();
  console.log("Received id from queue: " + id);
  fs.access(__dirname + "/cache/" + id, function (err) {
    if (err) {
      // Retrieve file from S3 bucket
      const s3Params = {
        Bucket: "mohasan-cc-project",
        Key: id,
      };
      const data = s3.send(new GetObjectCommand(s3Params));
      const ws = fs.createWriteStream(__dirname + "/cache/" + id);
      data.Body.pipe(ws);
    }
    fs.readFile(__dirname + "/cache/" + id, "utf8", (err, data) => {
      if (err) throw err;
      const fileData = data;
      pool.query(
        `SELECT inputs, language FROM uploads WHERE id = $1`,
        [id],
        (err, res) => {
          if (err) {
            console.error(err);
          } else {
            const { language, inputs } = res.rows[0];
            const queryString = qs.stringify({
              code: fileData,
              language,
              input: inputs,
            });
            const date = new Date().toISOString();
            pool
              .query(
                `INSERT INTO jobs (upload_id, job, status) VALUES ('${id}', '${queryString}', 'none')`
              )
              .then(() => {
                console.log("Job has been successfully stored in the database");
                pool.query(
                  `INSERT INTO results (job, output, status, execute_date) VALUES ('${id}', '${null}', 'in progress', '${date}')`
                );
              })
              .catch((err) => {
                console.error(err);
              });
          }
        }
      );
    });
  });
}

async function startConsuming() {
  console.log("Consuming started ...");
  const channel = await createChannel();
  channel.consume("jobs", handleMessage, { noAck: true });
}

startConsuming();
