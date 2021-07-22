var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var admin = require('firebase-admin');
var csrf = require('csurf');
var firebase = require("firebase/app");
require("firebase/analytics");
require("firebase/auth");
require("firebase/firestore");

var firebaseConfig = {
  apiKey: "AIzaSyCDfxUnzndLfCGAZfSfBQ4kFGYxetEsz2c",
  authDomain: "codehubvn.firebaseapp.com",
  projectId: "codehubvn",
  storageBucket: "codehubvn.appspot.com",
  messagingSenderId: "383165045388",
  appId: "1:383165045388:web:9cb01c6c15830a5402f9a9",
  measurementId: "G-JMWQXQ0LNB"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);


var serviceAccount = require("./codehubvn-firebase-adminsdk-gy7iq-c6cb57b8a7.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});


const csrfMiddleware = csrf({ cookie: true });


var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(csrfMiddleware);

app.all("*", (req, res, next) => {
  res.cookie("XSRF-TOKEN", req.csrfToken());
  next();
});

app.all("*", async (req, res, next) => {
  console.log("path:", req.path);

  if (req.path.startsWith("/admin")) {
    const sessionCookie = req.cookies.adminSession || "";
    console.log("session cookie:", sessionCookie);
    if (sessionCookie !== "") {
      req.adminUser = {username: '1'}
    }
  } else {
    const sessionCookie = req.cookies.session || "";
    try {
      let decodedIdToken = await admin.auth().verifySessionCookie(sessionCookie, true);
      req.user = await (await admin.auth().getUser(decodedIdToken.uid));
  
    } catch(error) {
      // console.log(error);
      // req.user = null
    }
  }

  next();
});


var indexRouter = require('./routes/route');
var adminRouter = require('./routes/adminRoute');
const { JsonWebTokenError } = require('jsonwebtoken');
app.use('/', indexRouter);
app.use('/admin', adminRouter);

// catch 404 and forward to error handler
// app.use(function(req, res, next) {
//   next(createError(404));
// });

// // error handler
// app.use(function(err, req, res, next) {
//   // set locals, only providing error in development
//   res.locals.message = err.message;
//   res.locals.error = req.app.get('env') === 'development' ? err : {};

//   // render the error page
//   res.status(err.status || 500);
//   res.render('error');
// });

module.exports = app;
