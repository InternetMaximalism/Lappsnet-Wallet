const { Pool } = require('pg')
require('dotenv').config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
})

;(async () => {
  const client = await pool.connect()
  await client.query({
    text: `
      CREATE TABLE IF NOT EXISTS public."Users"(
        "username" VARCHAR(100) UNIQUE NOT NULL,
        "credId" VARCHAR(1000),
        "pubKeyBytes" VARCHAR(256),
        PRIMARY KEY ("username")
      );
    `,
    values: []
  })
  await client.query({
    text: `
    CREATE TABLE IF NOT EXISTS public."Challenges"(
      "username" VARCHAR(100) NOT NULL,
      "challenge" VARCHAR(100) NOT NULL,
      "exipration" VARCHAR(30) NOT NULL,
      PRIMARY KEY ("challenge")
    );`
  })
  client.release()
})

module.exports = {
  query: (text, params) => pool.query(text, params)
}