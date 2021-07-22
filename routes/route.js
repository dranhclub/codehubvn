const e = require('express');
var express = require('express');
var router = express.Router();
var admin = require('firebase-admin');
var firebase = require("firebase/app");
var jwt = require('jsonwebtoken');
// const { pass, user } = require('../config/auth.config');
var nodemailer = require('../config/nodemailer.config')

const db = admin.firestore();

router.get('/test_create_question', async (req, res) => {
  for (let i = 0; i < 5; i++) {
    const docRef = db.collection("questions").doc(`question_${i}`);
    docRef.set({
      title: `Câu hỏi ${i}`,
      text: 'Ullamco aute in esse irure. Id tempor cillum fugiat irure sunt sunt consequat aliqua cillum. Veniam deserunt ea occaecat adipisicing anim ipsum. Aliqua labore aute duis magna eiusmod magna amet pariatur dolore in aliqua elit non aliquip.',
      image: `https://picsum.photos/seed/question_${i}/200/300`,
      video: `[url]`,
    });
  }

  res.send("OK");
});

router.get('/', function (req, res, next) {
  res.render('other/index', { title: 'Codehubvn', user: req.user });
});

router.get('/project', function (req, res, next) {
  res.render('project', { title: 'Project', user: req.user });
});

router.get('/components', function (req, res, next) {
  res.render('components', { title: 'Components', user: req.user });
});

router.post('/login', (req, res, next) => {
  const idToken = req.body.idToken.toString();

  const expiresIn = 60 * 60 * 24 * 5 * 1000;

  admin
    .auth()
    .createSessionCookie(idToken, { expiresIn })
    .then(
      (sessionCookie) => {
        const options = { maxAge: expiresIn, httpOnly: true };
        res.cookie("session", sessionCookie, options);
        res.send({ code: "OK", message: "Tạo phiên đăng nhập thành công" });
      },
      (error) => {
        res.send(error);
      }
    );
});

router.get('/register', (req, res) => {
  res.render('account/register', {title: "Đăng ký"});
});

router.get('/login', function (req, res, next) {
  if (req.user) {
    res.redirect('/');
  } else {
    res.render('account/login', { title: 'Đăng nhập' });
  }
});

router.get('/logout', function (req, res, next) {
  if (req.user) {
    res.clearCookie("session");
    res.redirect("/login");
  } else {
    res.redirect('/');
  }
});

router.get('/checkemail', function (req, res, next) {
  if (req.user) {
    if (!req.user.emailVerified) {
      var actionCodeSettings = {
        url: 'http://localhost:3000/myaccount',
        handleCodeInApp: true,
      };
      admin.auth()
        .generateEmailVerificationLink(req.user.email, actionCodeSettings)
        .then(function (link) {
          res.render('account/checkemail', { title: 'Check email', user: req.user});
          nodemailer.sendConfirmationEmail(
            req.user.displayName,
            req.user.email,
            link
          );
        })
        .catch(function (error) {
          res.send(error)
        });
    } else {
      res.send("Email đã được xác thực rồi");
    }
  } else {
    res.status(400).send("Bad request");
  }
});

router.get('/emailverified', function (req, res, next) {
  res.render('account/emailverified', { title: 'Xác thực email thành công', user: req.user });
});

router.get('/myaccount', function (req, res, next) {
  if (req.user) {
    res.render('account/myaccount', { title: 'Thông tin tài khoản', user: req.user });
  } else {
    res.redirect('/login');
  }
});

router.get('/instruction', function (req, res, next) {
  res.render('play/instruction', { title: 'Hướng dẫn luật chơi', user: req.user });
});

router.get('/chooselevel', function (req, res, next) {
  res.render('play/chooselevel', { title: 'Chọn cấp độ', user: req.user });
});

router.get('/play', (req, res) => {
  res.redirect('/play/1');
});

router.get('/play/:id', async function (req, res, next) {
  if (req.user) {
    const questionDocRef = db.collection("questions").doc(`question_${req.params.id}`);
    let question = await questionDocRef.get();
    if (question.exists) {
      res.render('play/play', { title: 'Chơi!', user: req.user, question: question.data() });
    } else {
      res.send("Question id not exist");
    }
  } else {
    res.redirect('/login');
  }
});

router.get('/rank', function (req, res, next) {
  res.render('other/rank', { title: 'Bảng xếp hạng', user: req.user });
});

module.exports = router;
