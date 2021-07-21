var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var admin = require('firebase-admin');
// var csrf = require('csurf');
var nodemailer = require('./config/nodemailer.config')

// nodemailer.sendConfirmationEmail(
//   "Nguyen Huy Hoang",
//   "dranh.club@gmail.com",
//   "x878987x7x8x9xx0"
// );

var serviceAccount = require("./codehubvn-firebase-adminsdk-gy7iq-c6cb57b8a7.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});


// const csrfMiddleware = csrf({ cookie: true });


var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
// app.use(csrfMiddleware);

// app.all("*", (req, res, next) => {
//   res.cookie("XSRF-TOKEN", req.csrfToken());
//   next();
// });

// app.all("*", async (req, res, next) => {
//   const sessionCookie = req.cookies.session || "";
//   try {
//     req.user = await admin.auth().verifySessionCookie(sessionCookie, true /** checkRevoked */)
//   } catch(error) {
//     // console.log(error);
//     // req.user = null
//   }
//   next();
// });

var indexRouter = require('./routes/route');
app.use('/', indexRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

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
