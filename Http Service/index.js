const { PutObjectCommand } = require("@aws-sdk/client-s3");
const express = require("express");
const multer = require("multer");
const { s3, pool, arvanBucketEndpoint, arvanBucket } = require("./config");
const { sendIdToQueue } = require("./amqp");
const { GetObjectCommand } = require("@aws-sdk/client-s3");
const { S3RequestPresigner } = require("@aws-sdk/s3-request-presigner");
const { createRequest } = require("@aws-sdk/util-create-request");
const { formatUrl } = require("@aws-sdk/util-format-url");

const app = express();
const port = 3030;

// Configure multer middleware to handle file upload
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Define API endpoint to receive file, language, input, and email from user
app.post("/api/add", upload.single("file"), async (req, res) => {
  try {
    const file = req.file?.buffer;
    const language = req.body?.language;
    const inputs = req.body?.inputs;
    const email = req.body?.email;

    if (!file || !language || !inputs || !email) {
      res.send("All fields must be sent");
      res.end();
    } else {
      // Insert data into Postgres database
      const enable = false;
      const query =
        "INSERT INTO uploads(email, inputs, language, enable) VALUES($1, $2, $3, $4) RETURNING id;";
      const values = [email, inputs, language, enable];
      const pgRes = await pool.query(query, values);
      const id = pgRes.rows[0].id;
      if (id) {
        // Save file to S3 bucket
        const s3Params = {
          Bucket: arvanBucket,
          Key: String(id),
          Body: file,
          ACL: "private",
        };
        await s3.send(new PutObjectCommand(s3Params));
      }

      res.send("Request received successfully");
      res.end();
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/api/execute/:id", (req, res) => {
  const id = req.params.id;
  pool.query("SELECT * FROM uploads WHERE id = $1", [id], async (err, res) => {
    if (err) {
      console.error(err);
    } else {
      const row = res.rows[0];
      if (!row.enable) {
        sendIdToQueue(id);
      }
    }
  });

  res.send(`You requested ID: ${id}`);
});

app.get("/api/results/:user", (req, res) => {
  const user = req.params.user;
  const query = `SELECT u.id, r.output, r.status, r.execute_date
               FROM uploads u
               INNER JOIN jobs j ON u.id = j.upload_id
               INNER JOIN results r ON j.id = r.job
               WHERE u.email = $1`;
  pool.query(query, [user], (error, results) => {
    if (error) throw error;
    const data = results.rows.map((row) => {
      // const clientParams = {
      //   Bucket: arvanBucket,
      //   Key: row.id.toString(),
      // };
      // const request = createRequest(
      //   s3,
      //   new GetObjectCommand(clientParams)
      // ).then((res) => {
      //   console.log(res);
      // });
      // const signedRequest = new S3RequestPresigner(s3.config);
      // const signedUrl = formatUrl(
      //   signedRequest.presign(request, {
      //     expiresIn: 60 * 60 * 24,
      //   })
      // );
      return {
        upload_id: row.id,
        output: row.output,
        status: row.status,
        execute_date: row.execute_date,
        download_url:
          "https://mohasan-cc-project.s3.ir-thr-at1.arvanstorage.ir/" + row.id,
      };
    });
    res.status(200).json(data);
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
