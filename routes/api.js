var express = require('express');
var router = express.Router();

var crypto = require('crypto')
var db = require('../models').client;

/* POST check for username availability */
router.post('/checkUsername', async (req, res, next) => {
  try {

    const { rows } = await db.query(
      'SELECT * FROM users WHERE username = $1',
      [ req.body.username ]
    )

    if (typeof rows[0] === undefined) {
      // No user with requested name, all OK
      return res.status(200).send()
    }
    // User already exists, 409 conflict error
    return res.status(409).send()

  } catch (err) {
    console.error(err)
    return res.status(500).send()
  }
})

/* POST user registration request */
router.get('/registerUsername', async (req, res, next) => {
  try {
    // Store a random challenge, unique username
    const timeout = 5*60000
    const challenge = crypto.randomBytes(64)
    const now = new Date()
    const expiration = new Date(now.getTime() + timeout) // 5 minutes from now
    await db.query(
      'INSERT INTO challenges(username, challenge, expiration) VALUES ($1, $2, $3)',
      [ req.body.username, challenge, expiration ]
    )
    // Return the random challenge, unique username
    return res.status(200).json({ username: req.body.username, challenge, timeout });

  } catch (err) {
    console.error(err)
    return res.status(500).send()
  }
});

/* POST attestationObject (credId registration) */
router.post('/postAttestation', async (req, res, next) => {
  try {

    // Look up challenge, username
    const { rows } = await db.query(
      'SELECT * FROM challenges WHERE (username, challenge) = ($1, $2)',
      [ req.body.username, req.body.challenge ]
    )

    // If expired or DNE, return error message
    if (typeof result.rows[0] === undefined) {
      return res.status(404).send()
    }

    const now = new Date()
    const expiry = new Date(result.rows[0].expiration)
    if (now.getTime() > expiry.getTime()) {
      return res.status(404).send()
    }

    // register user and credId
    await db.query(
      'INSERT INTO users(username, credId) VALUES ($1, $2)',
      [ req.body.username, req.body.credId ]
    )
    return res.status(200).send();

  } catch (err) {
    console.error(err)
    return res.status(500).send()
  }
});

/* User then generates master privkey using same device,
 * signing this credId. User also backs up this credId.
 */

/* If user's browser forgets credId used to create privkey,
 * they can always attempt to recover it through this server.
 * Worst case, they can manually recover from backup.
 */

/* POST request dummy challenge: used to get credId */
router.post('/requestCredId', async (req, res, next) => {
  try {

    // Return the credId for specified user.
    const { rows } = await db.query(
      'SELECT credId FROM users where username = $2',
      [ req.body.username ]
    )
    // If DNE, return error
    if (typeof result.rows[0] === undefined) {
      return res.status(404).send()
    }
    
    // Return credId
    return res.status(200).send(result.rows[0].credId)

  } catch (err) {
    console.error(err)
    res.status(500).send()
  }
})

module.exports = router;
