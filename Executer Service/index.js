const axios = require("axios");
const pool = require("./db");

const codeXUrl = "https://api.codex.jaagrav.in";

function codeRunner(data) {
  console.log(data);
  const config = {
    method: "post",
    url: codeXUrl,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    data: data,
  };
  axios(config)
    .then(function (response) {
      console.log(JSON.stringify(response.data));
      pool.query(
        "UPDATE results SET status = $1, output = $2 WHERE job = $3",
        ["done", response.data, data.id],
        (err, result) => {
          if (err) {
            console.error(err);
            return;
          }
        }
      );
      // pool.query(
      //   "UPDATE jobs SET status = $1, output = $2 WHERE job = $3",
      //   ["done", response.data, data.id],
      //   (err, result) => {
      //     if (err) {
      //       console.error(err);
      //       return;
      //     }
      //   }
      // );
      // pool.query(
      //   "UPDATE uploads SET enable = $1 WHERE id = $2",
      //   [true, data.id],
      //   (err, result) => {
      //     if (err) {
      //       console.error(err);
      //       return;
      //     }
      //   }
      // );
    })
    .catch(function (error) {
      console.log(error);
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
          pool.query("UPDATE jobs SET status = $1 WHERE id = $2", [
            "in progress",
            row.id,
          ]);
          codeRunner(row.job);
        });
      }
    );
  }, 2000);
}

main();
