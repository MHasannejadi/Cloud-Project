const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { Pool } = require("pg");
const fs = require("fs");
const pg = require("pg");
const url = require("url");

const s3 = new S3Client({
  region: "default",
  endpoint: "https://s3.ir-thr-at1.arvanstorage.ir",
  credentials: {
    accessKeyId: "afce1979-6165-4a29-bf2d-23814154a6f6",
    secretAccessKey: "9a8ae67c7b325c37fb8921e56366c04044330f1a",
  },
});

// Set up Postgres database connection pool
const postgresqlUri =
  "postgresql://root:zuKbiszDkDrxydXLE1TndxiV@grace.iran.liara.ir:34022/postgres";
const conn = new URL(postgresqlUri);
conn.search = "";
const pool = new Pool({
  connectionString: conn.href,
});

// Set up RabbitMQ connection
const amqpUrl =
  "amqps://edafwaiw:nTSF2E9L5Pdl4SJGkAtgM-r7pLznYvWm@hummingbird.rmq.cloudamqp.com/edafwaiw";

module.exports = {
  s3,
  pool,
  amqpUrl,
};
