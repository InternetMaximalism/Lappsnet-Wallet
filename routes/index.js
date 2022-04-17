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
  // Note: this redirect will not work if port must be specified (e.g. localhost:3000)
  let URL = require('url').URL
  let newUrl = new URL(`${req.protocol}://${req.hostname}${req.originalUrl}`)
  newUrl.pathname = 'wallet'
  res.redirect(newUrl.href)
});

router.get('/wallet', function(req, res, next) {
  res.render('wallet', { title: 'Lappsnet Wallet'});
});

router.get('/redeem', function(req, res, next) {
  res.render('redeem', { title: 'Lappsnet Wallet: Redeem satoshis'})
})

/*
router.get('/test', function(req, res, next) {
  let URL = require('url').URL
  let newUrl = new URL(`${req.protocol}://${req.hostname}${req.originalUrl}`)
  newUrl.pathname = 'wallet'
  res.redirect(newUrl.href)
})
*/

module.exports = router;
