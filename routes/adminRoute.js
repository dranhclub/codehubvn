var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken')

router.get('/', (req, res) => {
    console.log(`req admin user: ${req.adminUser}`);
    if (!req.adminUser) {
        res.redirect('/admin/login');
    } else {
        res.render('admin/manage', {title: 'Quản trị viên'});
    }
});

router.get('/login', (req, res) => {
    if (req.adminUser) {
        res.redirect('/admin');
    } else {
        res.render('admin/login', {title: 'Đăng nhập quản trị viên'});
    }
});

router.post('/login', (req, res) => {
    const {username, password} = req.body;
    const remember = req.body.remember;
    console.log({username, password, remember});

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

module.exports = router;