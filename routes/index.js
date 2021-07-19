var express = require('express');
var router = express.Router();
var admin = require('firebase-admin');


router.get('/', function (req, res, next) {
  res.render('index', { title: 'Codehubvn', user: req.user });
});

router.get('/project', function (req, res, next) {
  res.render('project', { title: 'Project', user: req.user });
});

router.get('/components', function (req, res, next) {
  res.render('components', { title: 'Components', user: req.user });
});

router.post('/sessionLogin', (req, res, next) => {
  const idToken = req.body.idToken.toString();

  const expiresIn = 60 * 60 * 24 * 5 * 1000;

  admin
    .auth()
    .createSessionCookie(idToken, { expiresIn })
    .then(
      (sessionCookie) => {
        const options = { maxAge: expiresIn, httpOnly: true };
        res.cookie("session", sessionCookie, options);
        res.end(JSON.stringify({ status: "success" }));
      },
      (error) => {
        res.status(401).send("UNAUTHORIZED REQUEST!");
      }
    );
});

router.get('/login', function (req, res, next) {
  if (req.user) {
    res.redirect('/');
  } else {
    res.render('account/login', { title: 'Đăng nhập' });
  }
});

router.get('/logout', function (req, res, next) {
  res.clearCookie("session");
  res.redirect("/login");
});

router.get('/checkemail', function (req, res, next) {
  res.render('account/checkemail', { title: 'Check email', user: req.user })
});

router.get('/emailverified', function (req, res, next) {
  res.render('account/emailverified', { title: 'Xác thực email thành công', user: req.user });
});

router.get('/myaccount', function (req, res, next) {
  res.render('account/myaccount', { title: 'Thông tin tài khoản', user: req.user });
});

router.get('/instruction', function (req, res, next) {
  res.render('play/instruction', { title: 'Hướng dẫn luật chơi', user: req.user });
});

router.get('/chooselevel', function (req, res, next) {
  res.render('play/chooselevel', { title: 'Chọn cấp độ', user: req.user });
});

router.get('/play', function (req, res, next) {
  res.render('play/play', { title: 'Chơi!', user: req.user });
});

router.get('/rank', function (req, res, next) {
  res.render('other/rank', { title: 'Bảng xếp hạng', user: req.user });
});

module.exports = router;
