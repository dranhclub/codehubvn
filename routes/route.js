const e = require('express');
var express = require('express');
var router = express.Router();
var admin = require('firebase-admin');
var firebase = require("firebase/app");
var jwt = require('jsonwebtoken');
const { user } = require('../config/auth.config');
// const { pass, user } = require('../config/auth.config');
var nodemailer = require('../config/nodemailer.config');
var compareStr = require('../helper/compareStr');

const db = admin.firestore();

/**************** */
/*     Home page  */

router.get('/', async function (req, res, next) {
  res.render('other/index', { 
    title: 'Codehubvn - Trang chủ', 
    user: req.user, 
  });
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

router.post('/init-user', (req, res) => {
  const user = req.body.user;
  var metaRef = db.collection("metadata").doc("users");
      metaRef.get().then(doc => {
        const lastId = doc.data().lastId;
        const newId = lastId + 1;
        metaRef.set({lastId: newId});

        var userRef = db.collection("users").doc(user.email);
        userRef.set({
          id: newId,
          name: user.displayName,
          current: {
            normal: 0,
            hard: 0
          },
          answer: {
            normal: [],
            hard: []
          },
          paid: {
            normal: false,
            hard: false
          }
        }).then(() => {
          console.log("Init user ", newId)
          res.send({
            code: "OK",
            message: "Init user successfully"
          });
        }).catch(error => {
          res.send({
            code: "ERROR",
            message: error
          })
        });
      });
});

router.get('/register', (req, res) => {
  res.render('account/register', {
    title: "Tạo tài khoản"
  });
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
        url: `http://${req.get('host')}/myaccount`,
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
/*   My account  */

router.get('/myaccount', async function (req, res, next) {
  if (req.user) {
    const userRef = db.collection("users").doc(req.user.email);
    const userData = (await userRef.get()).data();
    req.user.id = userData.id;
    req.user.current = userData.current;
    req.user.answer = userData.answer;

    const questionMetadataRef = db.collection("metadata").doc("questions");
    const questionMetadata = (await questionMetadataRef.get()).data();
    res.render('account/myaccount', { title: 'Thông tin tài khoản', user: req.user, questionMetadata });
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

router.get('/chooselevel', async function (req, res, next) {
  if (req.user) {
    const userRef = db.collection("users").doc(req.user.email);
    const current = (await userRef.get()).data().current;
    const playRule = (await db.collection("metadata").doc("others").get()).data().playRule;

    res.render('play/chooselevel', { 
      title: 'Chọn cấp độ', 
      user: req.user,
      current: current,
      playRule: playRule
    });
  } else {
    res.redirect('/login');
  }
});

router.get('/play/:level/:id', async (req, res) => {
  if (!req.user) { 
    res.redirect('/login');
    return;
  }
  
  const level = req.params.level;
  const id = parseInt(req.params.id);

  // Validate param
  if (level !== 'normal' && level !== 'hard') {
    res.status(404).end();
    return;
  }

  // Validate param
  if (isNaN(id) || id < 0) {
    res.status(404).end();
    return;
  }

  // Check email verification
  if (!req.user.emailVerified) {
    res.render('account/request-verify-email.ejs', {
      title: 'Xác thực email',
      user: req.user
    });
    return;
  }
  
  // Get current question
  const userRef = db.collection("users").doc(req.user.email);
  const userDoc = await userRef.get();
  const userData = userDoc.data();
  const current = userData.current[level];

  // Get questions order
  const questionsMetaRef = db.collection("metadata").doc("questions");
  const questionsMetaDoc = await questionsMetaRef.get();
  const questionMeta = questionsMetaDoc.data();
  const questionOrder = questionMeta.questionOrder[level];
  const numQuestion = questionOrder.length;

  // If not have any question
  if (numQuestion == 0) {
    res.send("Hiện tại không có câu hỏi");
    return;
  }

  // Id must < numQuestion
  if (id >= numQuestion) {
    res.status(404).end();
    return;
  }

  // Is user paid?
  const isPaid = userData.paid[level];
  const payQuestionIdx = (await db.collection("metadata").doc("questions").get()).data().payQuestion[level];

  // Get question
  const questionId = questionOrder[id];
  const question = (await db.collection("questions").doc(questionId).get()).data();

  // Define send object
  sendObj = {
    title: `Câu hỏi ${id + 1} cấp độ ${level === 'normal' ? 'thường' : 'khó'}`,
    // type: 'show-answer' or 'show-question' or 'request-payment' or 'notification'
    message: '',
    id,
    user: req.user,
    numQuestion,
    question,
    questionId,
  }

  if (id > current) {
    sendObj.type = 'notification';
    sendObj.message = `Bạn phải trả lời câu hỏi ${current + 1} trước khi xem được các câu hỏi tiếp theo`;
  } else if (id < current) {
    sendObj.type = 'show-answer';
  } else { // id == curent
    if (id == payQuestionIdx - 1 && !isPaid) {
      sendObj.type = 'request-payment';
    } else {
      sendObj.type = 'show-question';
    }
  }

  res.render('play/play', sendObj);
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
    return;
  } 

  const questionData = questionDoc.data();

  const userRef = db.collection("users").doc(req.user.email);
  const userData = (await userRef.get()).data();
  
  const level = questionData.level;
  const current = userData.current[level];
  const currentQuestionId = (await db.collection("metadata").doc("questions").get()).data().questionOrder[level][current];

  if (questionId !== currentQuestionId) {
    res.send({
      code: 'INVALID_QUESTION_ID',
      message: 'Cannot answer this question right now'
    });
    return;
  }

  if (compareStr.compare(questionData.answer, userAnswer)) {
    
    // Save answer time
    const answerObj = userData.answer;
    answerObj[level].push({
      questionId: questionId,
      time: Date.now()
    });
    userRef.update({
      answer: answerObj
    }).then(()=>{
      console.log(`${req.user.email} answer ${questionId} correctly`);
    });
    
    // Update current question of user
    var key = "current." + level;
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
});

/*******************/
/*    Payment     */
router.get('/payment', (req, res) => {
  if (!req.user) {
    res.send(404);
    return;
  }
  
  res.render('other/payment', {
    title: 'Thanh toán',
    user: req.user
  });
});

/*******************/
/*    Rankings         */

async function updateRankings() {
  const normalRankingRef = db.collection("rankings").doc("normal");
  const hardRankingRef = db.collection("rankings").doc("hard");
  
  const userRef = db.collection("users");
  const querySnapshot = await userRef.get();
  const users = [];
  querySnapshot.forEach((doc) => {
    let user = doc.data();
    user.email = doc.id;
    users.push(user);
  });
  users.sort((userA, userB) => {
    let diffirent = userB.current.normal - userA.current.normal;
    if (diffirent != 0) {
      return diffirent;
    }
    if (userA.current.normal == 0) {
      return 1;
    }
    let tA = userA.answer.normal[userA.current.normal - 1];
    let tB = userB.answer.normal[userB.current.normal - 1];
    return tA - tB;
  });

  await normalRankingRef.set({
    users: users.map((user, index) => {
      user.rank = index + 1;
      return user;
    })
  });

  users.sort((userA, userB) => {
    let diffirent = userB.current.hard - userA.current.hard;
    if (diffirent != 0) {
      return diffirent;
    }
    if (userA.current.hard == 0) {
      return 1;
    }
    let tA = userA.answer.hard[userA.current.hard - 1];
    let tB = userB.answer.hard[userB.current.hard - 1];
    return tA - tB;
  });

  hardRankingRef.set({
    users: users.map((user, index) => {
      user.rank = index + 1;
      return user;
    })
  })
}

router.get('/rank', async function (req, res, next) {
  await updateRankings();
  const normalRankingRef = db.collection("rankings").doc("normal");
  const hardRankingRef = db.collection("rankings").doc("hard");

  let normalRankingData = (await normalRankingRef.get()).data();
  let hardRankingData = (await hardRankingRef.get()).data();

  const metaQuestionData = (await db.collection("metadata").doc("questions").get()).data();

  res.render('other/rank', { 
    title: 'Bảng xếp hạng', 
    user: req.user,
    normalRankings: normalRankingData.users,
    hardRankings: hardRankingData.users,
    numNormalQuestion: metaQuestionData.questionOrder.normal.length,
    numHardQuestion: metaQuestionData.questionOrder.hard.length
  });
});

router.get('/recruiment', (req, res) => {
  res.render("other/recruitment", {
    title: 'Tuyển dụng',
    user: req.user
  });
});

module.exports = router;
