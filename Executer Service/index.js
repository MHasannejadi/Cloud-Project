const axios = require("axios");
const pool = require("./db");

const codeXUrl = "https://api.codex.jaagrav.in";

function codeRunner(data) {
  // console.log(data);
  const id = data.id;
  const config = {
    method: "post",
    url: codeXUrl,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    data: data.job,
  };
  axios(config)
    .then(function (response) {
      console.log(JSON.stringify(response.data));
      pool
        .query("UPDATE results SET status = $1, output = $2 WHERE job = $3", [
          "done",
          response.data.output,
          id,
        ])
        .then(() => {
          console.log("Result has been successfully updated");
          pool.query(
            "UPDATE jobs SET status = $1 WHERE id = $2",
            ["executed", id],
            (err, res) => {
              if (err) {
                console.error(err);
                return;
              } else {
                console.log("Job has been successfully updated");
              }
            }
          );
        });
    })
    .catch(function (error) {
      console.log(error);
      pool.query(
        "SELECT upload_id FROM jobs WHERE id = $1",
        [id],
        (err, result) => {
          console.log(result);
          if (err) {
            console.error(err);
            return;
          } else {
            if (result.rowCount > 0) {
              pool.query(
                "UPDATE uploads SET enable = $1 WHERE id = $2",
                [true, result.rows[0].upload_id],
                (err, result) => {
                  if (err) {
                    console.error(err);
                    return;
                  } else {
                    console.log("Upload has been enabled");
                  }
                }
              );
            }
          }
        }
      );
    });
}

function main() {
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
          codeRunner(row);
        });
      }
    );
  }, 5000);
}

main();
