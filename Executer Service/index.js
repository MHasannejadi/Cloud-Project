const axios = require("axios");
const pool = require("./db");
const mailgunConfig = require("./mailgun");

const codeXUrl = "https://api.codex.jaagrav.in";
const fromText = "Mohammad Hassannejadi <hasannejadi80@gmail.com>";
const inProgressJobs = [];

async function codeRunner(data) {
  // console.log(data);
  const jobId = data.id;
  let uploadId = null;
  let user = null;
  pool.query(
    "SELECT upload_id FROM jobs WHERE id = $1",
    [jobId],
    (err, result) => {
      if (err) {
        console.error(err);
        return;
      } else {
        uploadId = result.rows[0].upload_id;
        pool.query(
          "SELECT email FROM uploads WHERE id = $1",
          [uploadId],
          (err, result) => {
            if (err) {
              console.error(err);
              return;
            } else {
              user = result.rows[0].email;
            }
          }
        );
      }
    }
  );
  const codexConfig = {
    method: "post",
    url: codeXUrl,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    data: data.job,
  };
  axios(codexConfig)
    .then(function (response) {
      const resp = response.data;
      // console.log(resp);
      if (resp.error === "") {
        const mailData = {
          from: fromText,
          to: user,
          subject: "Result of running your code by id: " + uploadId,
          text:
            "Your code has been executed successfully and the result is: " +
            resp.output,
        };
        mailgunConfig.messages().send(mailData);
        pool
          .query("UPDATE results SET status = $1, output = $2 WHERE job = $3", [
            "done",
            resp.output,
            jobId,
          ])
          .then(() => {
            console.log("Result has been successfully updated");
            pool.query(
              "UPDATE jobs SET status = $1 WHERE id = $2",
              ["executed", jobId],
              (err, res) => {
                if (err) {
                  console.error(err);
                  return;
                } else {
                  const index = inProgressJobs.indexOf(jobId);
                  if (index > -1) {
                    inProgressJobs.splice(index, 1);
                  }
                  console.log("Job has been successfully updated");
                }
              }
            );
          });
      } else {
        const mailData = {
          from: fromText,
          to: user,
          subject: "Result of running your code by id: " + uploadId,
          text:
            "Your code has been executed with error and the error is: " +
            resp.error,
        };
        mailgunConfig.messages().send(mailData);
        if (uploadId) {
          pool.query(
            "UPDATE uploads SET enable = $1 WHERE id = $2",
            [true, uploadId],
            (err, result) => {
              if (err) {
                console.error(err);
                return;
              } else {
                console.log("Upload has been enabled");
                pool.query(
                  "UPDATE jobs SET status = $1 WHERE id = $2",
                  ["executed", jobId],
                  (err, res) => {
                    if (err) {
                      console.error(err);
                      return;
                    } else {
                      const index = inProgressJobs.indexOf(jobId);
                      if (index > -1) {
                        inProgressJobs.splice(index, 1);
                      }
                      console.log("Job has been successfully updated");
                      pool
                        .query(
                          "UPDATE results SET status = $1, output = $2 WHERE job = $3",
                          ["done", resp.output, jobId]
                        )
                        .then(() => {
                          console.log("Result has been successfully updated");
                        });
                    }
                  }
                );
              }
            }
          );
        }
      }
    })
    .catch(function (error) {
      console.log(error);
    });
}

function main() {
  console.log("Searching for status none jobs ...");
  setInterval(() => {
    pool.query(
      "SELECT * FROM jobs WHERE status = $1",
      ["none"],
      (err, result) => {
        if (err) {
          console.error(err);
          return;
        }
        result.rows.forEach((row) => {
          if (!inProgressJobs.includes(row.id)) {
            inProgressJobs.push(row.id);
            codeRunner(row);
          }
        });
      }
    );
  }, 5000);
}

main();
