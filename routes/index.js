var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'IntMedium Identity' });
});

router.get('/auth', function(req, res, next) {
  res.render('auth/auth');
});

module.exports = router;
