const { PutObjectCommand } = require("@aws-sdk/client-s3");
const express = require("express");
const multer = require("multer");
const { s3, pool, arvanBucketEndpoint } = require("./config");
const { sendIdToQueue } = require("./amqp");

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
          Bucket: "mohasan-cc-project",
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
        const downloadLink = arvanBucketEndpoint + "/" + id;
      }
    }
  });

  res.send(`You requested ID: ${id}`);
});

app.get("/api/job/:user", (req, res) => {
  const query = `SELECT r.id, r.output, r.status, r.execute_date
               FROM uploads u
               INNER JOIN jobs j ON u.id = j.upload
               INNER JOIN results r ON j.id = r.job
               WHERE u.email = $1`;

  const user = req.params.user;
  // execute the query with the user email as a parameter
  pool.query(query, [user], (error, results) => {
    if (error) throw error;
    const s3Params = {
      Bucket: "cc-project",
      Key: String(results.rows[0].id),
    };
    console.log(results.rows);
  });

  res.send("You requested jobs");
});

// Start the server
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
