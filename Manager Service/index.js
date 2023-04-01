const { GetObjectCommand } = require("@aws-sdk/client-s3");
const qs = require("querystring");
const fs = require("fs");
const createChannel = require("./amqp");
const s3 = require("./s3");
const pool = require("./db");
const { stringifySafe } = require("./utils");

// Function to handle incoming messages
async function handleMessage(message) {
  const id = message.content.toString();
  console.log("ID " + id + " received from queue");
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
      console.log(fileData);
    });
  });

  // pool.query(
  //   `SELECT inputs, language FROM uploads WHERE id = $1`,
  //   [id],
  //   (err, res) => {
  //     if (err) {
  //       console.error(err);
  //     } else {
  //       const { language, inputs } = res.rows[0];
  //       const queryString = qs.stringify({
  //         code: fileContent,
  //         language,
  //         inputs,
  //       });
  //       const dbQuery = `INSERT INTO jobs (upload_id, job, status) VALUES ('${id}', '${queryString}', 'none')`;
  //       pool.query(dbQuery);
  //       // console.log(dbQuery);
  //       console.log(
  //         "File content has been successfully stored in the database"
  //       );
  //     }
  //   }
  // );
}

async function startConsuming() {
  console.log("Consuming started ...");
  const channel = await createChannel();
  channel.consume("jobs", handleMessage, { noAck: true });
}

startConsuming();
