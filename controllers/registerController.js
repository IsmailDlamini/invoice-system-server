import asyncHandler from "express-async-handler";
import mysql from "mysql";
import bcrypt from "bcrypt";
import session from 'express-session';
// import { express } from "express";

// const app = express()

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Ismail121",
  database: "invoicesys",
});



// db.connect((err) => {
//   if (err) {
//     console.error("Error connecting to MySQL:", err);
//   } else {
//     console.log("Connected to MySQL database");
//   }
// });

export const register = asyncHandler(async (req, res) => {
  const { user_id, name, email, password } = req.body;

  const query =
    "INSERT INTO users (user_id ,name, email, password) VALUES (?, ?, ?, ?)";

  const saltRounds = 10;
  const encryptedPass = await bcrypt.hash(password, saltRounds);

  db.query(query, [user_id, name, email, encryptedPass], (err, results) => {
    if (err) {
      console.error("Error Registering User: ", err);
      res.status(500).json({ error: "Internal Server Error" });
    } else {
      res.status(201).json({ message: "User register successfully" });
    }
  });
});

export const addBusinessDetails = asyncHandler(async (req, res) => {
  const {
    business_name,
    business_logo,
    business_email,
    business_contact_no,
    company_reg_no,
    tax_ref_no,
  } = req.body;

  const query =
    "INSERT INTO users (business_name, business_logo, business_email, business_contact_no, company_reg_no ,tax_ref_no) VALUES (?, ?, ?, ?, ?, ?)";

  const saltRounds = 10;
  const encryptedPass = await bcrypt.hash(password, saltRounds);

  db.query(query, [user_id, name, email, encryptedPass], (err, results) => {
    if (err) {
      console.error("Error Registering User: ", err);
      res.status(500).json({ error: "Internal Server Error" });
    } else {
      res.status(201).json({ message: "User register successfully" });
    }
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const query = "SELECT * FROM users WHERE username = ? AND password = ?";

  if (email && password) {
    db.query(query, [username, password], (err, results) => {
      if (err) {
        console.error("Error Querying database:", err);
        res.status(500);
        return;
      }



    });
  } else {
    res.send("please enter your email and password");
  }
});
