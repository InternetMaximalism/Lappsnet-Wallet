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
  res.render('wallet', { title: 'Lappsnet Wallet'});
});

router.get('/wallet', function(req, res, next) {
  res.render('wallet', { title: 'Lappsnet Wallet'});
});

router.get('/redeem', function(req, res, next) {
  res.render('redeem', { title: 'Lappsnet Wallet: Redeem satoshis'})
})

module.exports = router;
