const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { Pool } = require("pg");
const amqp = require("amqplib/callback_api");

const s3 = new S3Client({
  region: "default",
  endpoint: "s3.ir-thr-at1.arvanstorage.ir",
  credentials: {
    accessKeyId: "afce1979-6165-4a29-bf2d-23814154a6f6",
    secretAccessKey: "9a8ae67c7b325c37fb8921e56366c04044330f1a",
  },
});

// Set up Postgres database connection pool
const pool = new Pool({
  user: "YOUR_PG_USER",
  host: "YOUR_PG_HOST",
  database: "YOUR_PG_DB",
  password: "YOUR_PG_PASSWORD",
  port: "YOUR_PG_PORT",
});

// Set up RabbitMQ connection
let channel;
amqp.connect(
  "amqps://edafwaiw:nTSF2E9L5Pdl4SJGkAtgM-r7pLznYvWm@hummingbird.rmq.cloudamqp.com/edafwaiw",
  (err, conn) => {
    if (err) throw err;
    conn.createChannel((err1, ch) => {
      if (err1) throw err1;
      const queue = "request_queue";
      ch.assertQueue(queue, { durable: false });
      channel = ch;
    });
  }
);

module.exports = {
  s3,
  pool,
  channel,
};
