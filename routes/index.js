var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Codehubvn' });
});

router.get('/project', function(req, res, next) {
  res.render('project', {title: 'project'});
});

router.get('/components', function(req, res, next) {
  res.render('components', {title: 'Components'});
});

router.get('/login', function(req, res, next) {
  res.render('account/login', { title: 'Đăng nhập' })
});

router.get('/checkemail', function(req, res, next) {
  res.render('account/checkemail', {title: 'Check email'})
});

router.get('/emailverified', function(req, res, next) {
  res.render('account/emailverified', {title: 'Xác thực email thành công'})
});

router.get('/myaccount', function(req, res, next) {
  res.render('account/myaccount', {title: 'Thông tin tài khoản'})
});

router.get('/instruction', function(req, res, next) {
  res.render('play/instruction', {title: 'Hướng dẫn luật chơi'});
});

router.get('/chooselevel', function(req, res, next) {
  res.render('play/chooselevel', {title: 'Chọn cấp độ'});
});

router.get('/play', function(req, res, next) {
  res.render('play/play', {title: 'Chơi!'});
});

router.get('/rank', function(req, res, next) {
  res.render('other/rank', {title: 'Bảng xếp hạng'});
});
module.exports = router;
