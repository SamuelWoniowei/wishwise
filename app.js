const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const fs = require("fs");
const nodemailer = require("nodemailer");
const cron = require("node-cron");
const { v4: uuidv4 } = require("uuid");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

const DB_FILE = path.join(__dirname, "db.json");
let users = [];

if (fs.existsSync(DB_FILE)) {
  users = JSON.parse(fs.readFileSync(DB_FILE));
}

// Routes
app.get("/", (req, res) => {
  res.render("index");
});

app.post("/submit", (req, res) => {
  const { username, email, dob } = req.body;
  const newUser = {
    id: uuidv4(),
    username,
    email,
    dob,
  };

  users.push(newUser);
  fs.writeFileSync(DB_FILE, JSON.stringify(users, null, 2));
  res.render("success", { name: username });
});

app.get("/success", (req, res) => {
  res.render("success");
});

const sendBirthdayWishes = () => {
  const today = new Date().toISOString().slice(5, 10);

  users.forEach((user) => {
    if (user.dob.slice(5, 10) === today) {
      let transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_PASS,
        },
      });

      const mailOptions = {
        from: `WishWise <${process.env.GMAIL_USER}>`,
        to: user.email,
        subject: "🎉 Happy Birthday from WishWise!",
        html: `<h2 style="color:#22c55e">Happy Birthday, ${user.username}!</h2>
               <p>Wishing you a day filled with joy, laughter, and all the things you love most. 🎂</p>
               <p>– Your friends at WishWise</p>`,
      };

      transporter.sendMail(mailOptions, (err, info) => {
        if (err) console.error(err);
        else console.log(`Email sent to ${user.email}`);
      });
    }
  });
};

cron.schedule("0 7 * * *", sendBirthdayWishes); // Runs daily at 7:00 AM

app.listen(PORT, () => {
  console.log(`WishWise app is running at http://localhost:${PORT}`);
});