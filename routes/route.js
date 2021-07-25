const e = require('express');
var express = require('express');
var router = express.Router();
var admin = require('firebase-admin');
var firebase = require("firebase/app");
var jwt = require('jsonwebtoken');
const { user } = require('../config/auth.config');
// const { pass, user } = require('../config/auth.config');
var nodemailer = require('../config/nodemailer.config')

const db = admin.firestore();

router.get('/', async function (req, res, next) {
  const playRule = (await db.collection("metadata").doc("others").get()).data().playRule;
  res.render('other/index', { title: 'Codehubvn', user: req.user, playRule });
});

router.get('/project', function (req, res, next) {
  res.render('project', { title: 'Project', user: req.user });
});

router.get('/components', function (req, res, next) {
  res.render('components', { title: 'Components', user: req.user });
});

/**************** */
/* Authentication */

router.post('/login', (req, res, next) => {
  const idToken = req.body.idToken.toString();
  const remember = req.body.remember;
  
  const expiresIn = 60 * 60 * 24 * 5 * 1000;

  admin
    .auth()
    .createSessionCookie(idToken, {expiresIn})
    .then(
      (sessionCookie) => {
        if (remember) {
          var options = { maxAge: expiresIn, httpOnly: true };
        } else {
          var options = { httpOnly: true };
        }
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
        url: window.location.orgin + '/myaccount',
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

router.get('/forgot', (req, res) => {
  res.render('account/forgotpassword', {title: 'Quên mật khẩu'});
});

/**************** */
/* My account  */

router.get('/myaccount', function (req, res, next) {
  if (req.user) {
    res.render('account/myaccount', { title: 'Thông tin tài khoản', user: req.user });
  } else {
    res.redirect('/login');
  }
});

router.post('/change-password', (req, res) => {
  if (!req.user) {
    res.status(400).send("Bad request");
  }

  let {oldPassword, newPassword} = req.body;
  
  firebase.auth().signInWithEmailAndPassword(req.user.email, oldPassword)
    .then((userCredential) => {
      admin.auth().updateUser(req.user.uid, {
        password: newPassword
      }).then((userRecord)=>{
        console.log('Successfully updated user', userRecord);
        res.send({
          code: "OK",
          message: "Đổi mật khẩu thành công"
        });
      }).catch((error)=>{
        console.log(error);
        res.send(error);
      });
    })
    .catch(error => {
      if (error.code == "auth/wrong-password") {
        res.send({
          code: "WRONG_PASSWORD",
          message: "Mật khẩu cũ không đúng"
        });
      } else {
        console.log(error);
        res.send(error);
      }
    });
});

/********************** */
/*      Play            */

router.get('/instruction', function (req, res, next) {
  res.render('play/instruction', { title: 'Hướng dẫn luật chơi', user: req.user });
});

router.get('/chooselevel', function (req, res, next) {
  if (req.user) {
    res.render('play/chooselevel', { title: 'Chọn cấp độ', user: req.user });
  } else {
    res.redirect('/login');
  }
});

router.get('/play/:level/:id', async (req, res) => {
  if (req.user) {
    const level = req.params.level;
    const id = req.params.id;

    if (level !== 'normal' && level !== 'hard') {
      res.status(404).end();
      return;
    }

    if (isNaN(id) || id < 0) {
      res.status(404).end();
      return;
    }
  
    const userRef = db.collection("users").doc(req.user.email);
    const userDoc = await userRef.get();
    const userData = userDoc.data();
    const current = userData.current[level];

    const questionsMetaRef = db.collection("metadata").doc("questions");
    const questionsMetaDoc = await questionsMetaRef.get();
    const questionMeta = questionsMetaDoc.data();
    const questionOrder = questionMeta.questionOrder[level];

    if (id > current + 1) {
      res.status(404).end();
    } else if (id > current) {
      res.send(`Bạn phải trả lời câu hỏi ${current + 1} trước khi xem được câu tiếp theo`);
    } else if (id < current) {
      const questionId = questionOrder[id];
      const question = (await db.collection("questions").doc(questionId).get()).data();
      res.render('play/play-answered', { 
        title: `Câu hỏi ${id + 1} cấp độ ${level === 'normal' ? 'thường' : 'khó'}`, 
        questionOrder: id,
        questionOrderLength: questionOrder.length,
        user: req.user, 
        question, 
        questionId
      });
    } else {
      if (current >= questionOrder.length) {
        res.send("Bạn đã trả lời hết câu hỏi");
      } else {
        const questionId = questionOrder[id];
        const question = (await db.collection("questions").doc(questionId).get()).data();
        
        res.render('play/play', { 
          title: `Câu hỏi ${current + 1} cấp độ ${level === 'normal' ? 'thường' : 'khó'}`, 
          questionOrder: id, 
          questionOrderLength: questionOrder.length,
          user: req.user, 
          question, 
          questionId
        });
      }
    }
  } else {
    res.redirect('/login');
  }
});

/****************/
/******Answer***** */
router.post('/answer', async (req, res) => {
  if (!req.user) {
    res.status(400).end();
  }

  const {questionId, userAnswer} = req.body;

  const questionRef = db.collection("questions").doc(questionId);
  const questionDoc = await questionRef.get();
  if (!questionDoc.exists) {
    res.send({
      code: 'INVALID_QUESTION_ID',
      message: 'invalid question id'
    });
  } else {
    // TODO: Need other validate
    if (questionDoc.data().answer === userAnswer) {
      
      // Save answer time
      const level = questionDoc.data().level;
      const userRef = db.collection("users").doc(req.user.email);
      const answerObj = (await userRef.get()).data().answer;
      answerObj[level].push(Date.now());

      userRef.update({
        answer: answerObj
      }).then(()=>{
        console.log(`${req.user.email} answer ${questionId} correctly`);
      });
      
      // Update current question of user
      const current = (await userRef.get()).data().current[level];
      
      key = "current." + level;
      userRef.update({
        [key]: current + 1
      });
      
      res.send({
        code: 'CORRECT',
        message: 'Câu trả lời đúng'
      });
    } else {
      res.send({
        code: 'WRONG',
        message: 'Câu trả lời sai'
      });
    }
  }
});

// router.get('/play/:id', async function (req, res, next) {
//   if (req.user) {
//     const questionDocRef = db.collection("questions").doc(`question_${req.params.id}`);
//     let question = await questionDocRef.get();
//     if (question.exists) {
//       res.render('play/play', { title: 'Chơi!', user: req.user, question: question.data() });
//     } else {
//       res.send("Question id not exist");
//     }
//   } else {
//     res.redirect('/login');
//   }
// });

router.get('/rank', function (req, res, next) {
  res.render('other/rank', { title: 'Bảng xếp hạng', user: req.user });
});

module.exports = router;
