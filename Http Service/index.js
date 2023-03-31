const { PutObjectCommand } = require("@aws-sdk/client-s3");
const express = require("express");
const multer = require("multer");
const { s3, pool } = require("./config");

const app = express();
const port = 3030;

// Configure multer middleware to handle file upload
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Define API endpoint to receive file, language, input, and email from user
app.post("/add", upload.single("file"), async (req, res) => {
  try {
    const file = req.file?.buffer;
    const language = req.body?.language;
    const inputs = req.body?.inputs;
    const email = req.body?.email;

    if (!file || !language || !inputs || !email) {
      res.send("All fields must be sent");
      res.end();
      return;
    } else {
      // Insert data into Postgres database
      const enable = 1; // default value for enable column
      const query =
        "INSERT INTO uploads(email, inputs, language, enable) VALUES($1, $2, $3, $4) RETURNING id;";
      const values = [email, inputs, language, enable];
      const pgRes = await pool.query(query, values);
      const id = pgRes.rows[0].id;

      if (id) {
        // Save file to S3 bucket
        const s3Params = {
          Bucket: "mohasan-cc-project",
          Key: id,
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
  res.send(`You requested ID: ${id}`);
});

// Start the server
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
