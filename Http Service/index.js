const { PutObjectCommand } = require("@aws-sdk/client-s3");
const express = require("express");
const multer = require("multer");
const { s3, pool, channel } = require("./config");

const app = express();
const port = 3030;

// Configure multer middleware to handle file upload
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Define API endpoint to receive file, language, input, and email from user
app.post("/add", upload.single("file"), async (req, res) => {
  const file = req.file.buffer;
  const fileName = req.file.originalname;
  const language = req.body.language;
  const input = req.body.input;
  const email = req.body.email;

  // Save file to S3 bucket
  const s3Params = {
    Bucket: "mohasan-cc-project",
    Key: fileName,
    Body: file,
    ACL: 'private',
  };
  s3.send(new PutObjectCommand(s3Params))

  // Insert data into Postgres database
  const enable = 1; // default value for enable column
  const query =
    "INSERT INTO requests(email, inputs, language, enable) VALUES($1, $2, $3, $4) RETURNING *";
  const values = [email, input, language, enable];
  try {
    const res = await pool.query(query, values);
    console.log("Data saved to Postgres");
  } catch (err) {
    console.error(err.stack);
  }

  // Send message to RabbitMQ queue
  const queue = "request_queue";
  const msg = "New request received";
  channel.sendToQueue(queue, Buffer.from(msg));
  console.log("Message sent to RabbitMQ");

  res.send("Request received successfully");
});

// Start the server
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
