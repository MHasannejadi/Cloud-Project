const { Pool } = require("pg");

// Set up Postgres database connection pool
const postgresqlUri =
  "postgresql://root:zuKbiszDkDrxydXLE1TndxiV@grace.iran.liara.ir:34022/postgres";
const conn = new URL(postgresqlUri);
conn.search = "";

const pool = new Pool({
  connectionString: conn.href,
});

const uploadsQuery = `
  CREATE TABLE IF NOT EXISTS uploads (
    id SERIAL PRIMARY KEY,
    email TEXT NOT NULL,
    language TEXT NOT NULL,
    inputs TEXT NOT NULL,
    enable BOOLEAN NOT NULL
  );
`;
const jobsQuery = `
  CREATE TABLE IF NOT EXISTS jobs (
    id SERIAL PRIMARY KEY,
    upload_id INTEGER REFERENCES uploads(id) NOT NULL,
    job TEXT,
    status VARCHAR(20)
  );
`;
const resultsQuery = `
  CREATE TABLE IF NOT EXISTS results (
    id SERIAL PRIMARY KEY,
    job INTEGER REFERENCES jobs(id) NOT NULL,
    output TEXT,
    status VARCHAR(20),
    execute_date TIMESTAMP
  );
`;

// client.query(uploadsQuery);
// client.query(jobsQuery);
// client.query(resultsQuery);
pool.end();
