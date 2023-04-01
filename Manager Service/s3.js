const { S3Client } = require("@aws-sdk/client-s3");

const s3 = new S3Client({
  region: "default",
  endpoint: "https://s3.ir-thr-at1.arvanstorage.ir",
  credentials: {
    accessKeyId: "afce1979-6165-4a29-bf2d-23814154a6f6",
    secretAccessKey: "9a8ae67c7b325c37fb8921e56366c04044330f1a",
  },
});

module.exports = s3;
