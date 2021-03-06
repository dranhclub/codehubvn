var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken')
var admin = require('firebase-admin');
const { user } = require('../config/auth.config');
const { route } = require('./route');
const { normalize } = require('../helper/compareStr');
const { auth } = require('firebase-admin');
const db = admin.firestore();



/************************ */
/*         Auth           */
router.get('/login', (req, res) => {
  if (req.adminUser) {
    res.redirect('/admin');
  } else {
    res.render('admin/login', { title: 'Đăng nhập quản trị viên' });
  }
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const remember = req.body.remember;
  console.log({ username, password, remember });

  const expiresIn = 60 * 60 * 24 * 5 * 1000;

  if (username == "1" && password == "1") {
    var sessionCookie = "kcjaiai0as89c89asd0a90das9d0ad";
    if (remember) {
      var options = { maxAge: expiresIn, httpOnly: true };
    } else {
      var options = { httpOnly: true };
    }
    res.cookie("adminSession", sessionCookie, options);
    res.send({
      code: "OK",
      message: "Đăng nhập thành công"
    });
  } else {
    res.send({
      code: "ERROR",
      message: "Tên đăng nhập hoặc mật khẩu không đúng"
    });
  }
});

router.get('/logout', (req, res) => {
  res.clearCookie("adminSession");
  res.redirect('/admin/login');
});

/******************** */
/*      Index         */
router.get('/', async (req, res) => {
  if (!req.adminUser) {
    res.redirect('/admin/login');
    return;
  }

  res.render('admin/admin-index', { title: 'Trang chủ quản trị' });
});

/******************** */
/*      Question         */

router.get('/manage-question', async (req, res) => {
  if (!req.adminUser) {
    res.redirect('/admin/login');
    return;
  }
  let querySnapshot = await db.collection("questions").get();
  let questions = [];
  querySnapshot.forEach(doc => {
    questions.push({ id: doc.id, data: doc.data() });
  });
  res.render('admin/manage-question', { title: 'Quản lý câu hỏi', questions: questions });
});

router.get('/add-question', (req, res) => {
  if (!req.adminUser) {
    res.redirect('/admin/login');
    return;
  }

  res.render('admin/add-question', {title: 'Thêm câu hỏi'});
});

router.get('/manage-question/:question_id', async (req, res) => {
  const questionId = req.params.question_id;
  const questionRef = db.collection("questions").doc(questionId);
  const questionDoc = await questionRef.get();
  const question = questionDoc.data();

  res.render('admin/single-question.ejs', {title: questionId, questionId, question});
});

router.get('/group-question',async (req, res) => {
  const questionRef = db.collection("metadata").doc("questions");
  const questionDoc = await questionRef.get();
  const questionOrder = questionDoc.data().questionOrder;
  const payQuestion = questionDoc.data().payQuestion;

  const questionCollectionRef = db.collection("questions");
  const questionsQuerysnapshot = await questionCollectionRef.get();
  const questions = [];
  questionsQuerysnapshot.forEach(doc => {
    let question = doc.data();
    question.id = doc.id;
    questions.push(question);
  })
  res.render('admin/group-question', {title: 'Quản lý bộ câu hỏi', questions, questionOrder, payQuestion});
});

/******************** */
/*      Users         */
router.get('/manage-user', async (req, res) => {
  if (!req.adminUser) {
    res.redirect('/admin/login');
    return;
  }

  admin
  .auth()
  .listUsers(1000)
  .then((listUsersResult) => {
    var users = [];
    listUsersResult.users.forEach((userRecord) => {
      users.push(userRecord.toJSON());
      // console.log('user', userRecord.toJSON());
    });
    if (listUsersResult.pageToken) {
      // List next batch of users.
      // console.log("next page token:", listUsersResult.pageToken)
      // listAllUsers(listUsersResult.pageToken);
    }
    return users
  })
  .then(async (users) => {
    for (let i = 0; i < users.length; i++) {
      let userInfo = await db.collection("users").doc(users[i].email).get();
      if (userInfo.exists) {
        users[i].id = userInfo.data().id;
      }
    }

    if (req.query.id) {
      users = users.filter(user => user.id == req.query.id);
    }

    if (req.query.email) {
      users = users.filter(user => {
        let str = normalize(user.email);
        let str2 = normalize(req.query.email);
        return str.search(str2) >= 0;
      });
    }

    if (req.query.name) {
      users = users.filter(user => {
        let str = normalize(user.displayName);
        let str2 = normalize(req.query.name);
        return str.search(str2) >= 0;
      });
    }


    res.render('admin/manage-user', { 
      title: 'Quản lý người dùng' , 
      users: users,
      req
    });
  })
  .catch((error) => {
    console.log('Error listing users:', error);
    res.send(error);
  });

});


/******************** */
/*      Single user   */
router.get('/manage-user/:id', async (req, res) => {
  let id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.send("id invalid");
    return;
  }
  const querySnapshot = await db.collection("users").where("id", "==", id).get();
  if (querySnapshot.docs.length == 0) {
    res.send("khong co user id tuong ung");
    return;
  }
  const email = querySnapshot.docs[0].id;
  const userRecord = await admin.auth().getUserByEmail(email);
  const questionMetadata = (await db.collection("metadata").doc("questions").get()).data();

  res.render('admin/single-user', {
    title: 'Thông tin người dùng' + id,
    id: id,
    userRecord: userRecord,
    user: querySnapshot.docs[0].data(),
    questionMetadata
  });
});

/******************** */
/*      Play rule     */

router.get("/playrule", async (req, res) => {
  const otherMetaRef = db.collection("metadata").doc("others");
  const otherMetaDoc = await otherMetaRef.get();
  var otherMeta = otherMetaDoc.data();
  var playRule = otherMeta.playRule;

  res.render('admin/playrule', {title: 'Thay đổi luật chơi', playRule});
});
module.exports = router;