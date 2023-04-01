const { Pool } = require("pg");

// Set up Postgres database connection pool
const postgresqlUri =
  "postgresql://root:zuKbiszDkDrxydXLE1TndxiV@grace.iran.liara.ir:34022/postgres";
const conn = new URL(postgresqlUri);
conn.search = "";

const pool = new Pool({
  connectionString: conn.href,
});

module.exports = pool;