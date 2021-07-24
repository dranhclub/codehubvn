var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken')
var admin = require('firebase-admin');
const { user } = require('../config/auth.config');
const { route } = require('./route');

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
      console.log("next page token:", listUsersResult.pageToken)
      // listAllUsers(listUsersResult.pageToken);
    }
    return users
  })
  .then(async (users) => {
    for (let i = 0; i < users.length; i++) {
      let userInfo = await db.collection("users").doc(users[i].email).get();
      users[i].id = userInfo.data().id;
    }
    res.render('admin/manage-user', { title: 'Quản lý người dùng' , users: users});
  })
  .catch((error) => {
    console.log('Error listing users:', error);
    res.send(error);
  });

});
module.exports = router;