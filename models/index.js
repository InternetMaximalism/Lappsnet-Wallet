const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
})

;(async () => {
  const client = await pool.connect()
  await client.query({
    text: `
      CREATE TABLE IF NOT EXISTS "users" (
        "username" VARCHAR(100) UNIQUE NOT NULL,
        "credId" VARCHAR(1000),
        PRIMARY KEY ("username")
      )
    `,
    values: []
  })
  await client.query({
    text: `
    CREATE TABLE IF NOT EXISTS "challenges" (
      "username" VARCHAR(100) NOT NULL,
      "challenge" VARCHAR(64) NOT NULL,
      "exipration" VARCHAR(30) NOT NULL,
      PRIMARY KEY ("challenge"),
      FOREIGN KEY ("username") REFERENCES "users" [ "username" ]
    )`
  })
  client.release()
})

module.exports = {
  query: (text, params) => pool.query(text, params)
}