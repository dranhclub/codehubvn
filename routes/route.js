var express = require('express');
var router = express.Router();
var admin = require('firebase-admin');
var jwt = require('jsonwebtoken');

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

router.get('/register', (req, res) => {
  res.render('account/register', {title: "Đăng ký"});
});

router.post('/register', async (req, res) => {
  console.log("New register request");
  let {name, email, password} = req.body;
  console.log(name);

  let docRef = db.collection("users").doc(email);
  if ((await docRef.get()).exists) {
    res.send(JSON.stringify({
      code: "EMAIL_EXISTED", 
      message: "Email đã được đăng ký cho một tài khoản khác"
    }));
  } else {
    docRef.set({
      name, email, password
    }).then(()=>{
      res.send(JSON.stringify({
        code: "OK",
        message: "Đăng ký thành công"
      }));
    }).catch(error=>{
      res.send({error});
    });
  }
});

router.get('/login', function (req, res, next) {
  if (req.user) {
    res.redirect('/');
  } else {
    res.render('account/login', { title: 'Đăng nhập' });
  }
});

router.post('/login', (req, res)=>{
  let email = req.body.email;
  let password = req.body.password;

  const docRef = db.collection("users").doc(email);
  docRef.get()
    .then((user) => {
      if (!user.exists) {
        res.send({
          code: "EMAIL_NOT_EXIST",
          message: "Đăng nhập không thành công, email không tồn tại"
        });
      } else {
        if (password === user.data().password) {
          res.send({
            code: "OK",
            message: "Đăng nhập thành công"
          });
        } else {
          res.send({
            code: "WRONG_PASSWORD",
            message: "Sai mật khẩu"
          });
        }
      }
    })
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
  res.render('account/checkemail', { title: 'Check email'})
});

router.get('/emailverified', function (req, res, next) {
  res.render('account/emailverified', { title: 'Xác thực email thành công', user: req.user });
});

router.get('/myaccount', function (req, res, next) {
  if (req.user) {
    res.render('account/myaccount', { title: 'Thông tin tài khoản', user: req.user });
  } else {
    res.send(404);
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
