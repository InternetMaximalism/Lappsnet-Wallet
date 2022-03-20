const { Pool } = require('pg')
require('dotenv').config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
})

;(async () => {
  try {
    console.log('Initializing DB...')
    await pool.connect()
    await pool.query({
      text: `
        CREATE TABLE IF NOT EXISTS public."Users"(
          "username" VARCHAR(100) UNIQUE NOT NULL,
          "credId" VARCHAR(1000) UNIQUE NOT NULL,
          "pubKeyBytes" VARCHAR(256) NOT NULL,
          "pubKeyPem" VARCHAR(256) NOT NULL,
          "counter" INTEGER NOT NULL,
          PRIMARY KEY ("username")
        );
      `,
      values: []
    })
    console.log('User table created if not exists')
    await pool.query({
      text: `
      CREATE TABLE IF NOT EXISTS public."Challenges"(
        "username" VARCHAR(100) NOT NULL,
        "challenge" VARCHAR(100) NOT NULL,
        "exipration" VARCHAR(30) NOT NULL,
        PRIMARY KEY ("challenge")
      );`
    })
    console.log('Challenge table created if not exists')
    pool.release()
  } catch (err) {
    console.error(err)
  }
})();

module.exports = {
  query: (text, params) => pool.query(text, params)
}