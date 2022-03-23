var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Lappsnet Wallet' });
});

router.get('/docs', function(req, res, next) {
  res.render('docs');
});

router.get('/auth', function(req, res, next) {
  res.render('auth/auth', { title: 'Lappsnet Wallet'});
});

module.exports = router;
