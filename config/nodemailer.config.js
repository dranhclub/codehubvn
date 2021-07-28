const nodemailer = require("nodemailer");
const config = require("./auth.config");

const user = config.user;
const pass = config.pass;

const transport = nodemailer.createTransport({
    service: "Gmail",
    auth: {
        user: user,
        pass: pass,
    },
});

module.exports.sendConfirmationEmail = (name, email, link) => {
    console.log(`Sending email to ${name}, ${email}`);
    transport.sendMail({
        from: user,
        to: email,
        subject: "Please confirm your account",
        html: `<h1>Email Confirmation</h1>
          <h2>Hello ${name}</h2>
          <p>Vui lòng bấm vào link dưới đây để xác thực email</p>
          <a href=${link}> Click here</a>
          </div>`,
    })
    .then(()=>{
        console.log("Email sent");
    })
    .catch(err => console.log(err));
};