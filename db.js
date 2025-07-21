const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // set to { rejectUnauthorized: false } if using a remote DB
  },
});

module.exports = pool;
