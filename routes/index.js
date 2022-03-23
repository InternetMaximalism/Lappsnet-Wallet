var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Lappsnet Wallet' });
<<<<<<< HEAD
=======
});

router.get('/docs', function(req, res, next) {
  res.render('docs');
>>>>>>> dda440cc6bcd5d9ae98211f8692116eb98d30f36
});

router.get('/auth', function(req, res, next) {
  res.render('auth/auth', { title: 'Lappsnet Wallet'});
});

module.exports = router;
