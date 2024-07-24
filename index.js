import express from "express";
import mysql from "mysql";
import registerRoute from "./routes/registerRoute.js";
import session from "express-session";
import asyncHandler from "express-async-handler";
import bcrypt from "bcrypt";
import bodyParser from "body-parser";
import jwt from "jsonwebtoken";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
const port = 3000;

app.use(cors());

app.use(session({ secret: "secret", resave: true, saveUninitialized: true }));

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Ismail121",
  database: "invoicesys",
});

const jwt_secret = "thisisthejwttokensecret";

db.connect((err) => {
  if (err) {
    console.error("Error connecting to MySQL:", err);
  } else {
    console.log("Connected to MySQL database");
  }
});

app.get("/", async (req, res) => {
  res.send("welcome to the invoice system API");
});

app.get("/api/users", async (req, res) => {
  const fetchUsersQuery = "SELECT * FROM users";

  db.query(fetchUsersQuery, async (err, results) => {
    if (err) console.error("error fetching users:", err);
    else {
      if (results.length > 0) {
        results.length > 1
          ? res.status(200).json({
              users: +results[results.length - 1].user_id.split("R")[1] + 1,
            })
          : res
              .status(200)
              .json({ users: +results[0].user_id.split("R")[1] + 1 });
        console.log(results);
      } else {
        res.status(404).json({ error: "no users found in the database" });
      }
    }
  });
});

app.post(
  "/api/registerUser",
  asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    const registerUserQuery =
      "INSERT INTO users (name, email, password) VALUES (?, ?, ?)";

    const checkEmailExistenceQuery = "SELECT * FROM users WHERE email = ?";

    const saltRounds = 10;
    const encryptedPass = await bcrypt.hash(password, saltRounds);

    db.query(checkEmailExistenceQuery, [email], (checkErr, results) => {
      if (checkErr) {
        console.error("Error checking email existence: ", checkErr);
        res
          .status(500)
          .json({ success: false, error: "Internal Server Error", checkErr });
        return;
      }

      if (results.length > 0) {
        res.status(400).json({ success: false, error: "Email already exists" });
        return;
      }

      db.query(
        registerUserQuery,
        [name, email, encryptedPass],
        (err, results) => {
          if (err) {
            console.error("Error Registering User: ", err);
            res
              .status(500)
              .json({ success: false, error: "Internal Server Error", err });
          } else {
            res
              .status(201)
              .json({ success: true, message: "User register successfully" });
          }
        }
      );
    });
  })
);

// Registration endpoint
app.post("/api/registerBusiness", (req, res) => {
  const {
    businessName,
    businessLogo,
    businessEmail,
    businessContactNo,
    companyRegNo,
    taxRefNo,
    streetAddress,
    suburb,
    city,
    postalCode,
    buildingName,
    officeNo,
    bankName,
    accountType,
    accountNumber,
  } = req.body;

  // Start a MySQL transaction to ensure data consistency
  db.beginTransaction((err) => {
    if (err) {
      console.error("Error starting transaction:", err);
      res.status(500).json({ error: "Internal Server Error" });
      return;
    }

    // Insert into BusinessDetails
    db.query(
      "INSERT INTO BusinessDetails (BusinessName, BusinessLogo, BusinessEmail, BusinessContactNo, CompanyRegNo, TaxRefNo) VALUES (?, ?, ?, ?, ?, ?)",
      [
        businessName,
        businessLogo,
        businessEmail,
        businessContactNo,
        companyRegNo,
        taxRefNo,
      ],
      (err, results) => {
        if (err) {
          return db.rollback(() => {
            console.error("Error inserting into BusinessDetails:", err);
            res.status(500).json({ error: "Internal Server Error" });
          });
        }

        const businessID = results.insertId; // Obtain the auto-generated BusinessID

        // Insert into BusinessAddress
        db.query(
          "INSERT INTO BusinessAddress (BusinessID, StreetAddress, Suburb, City, PostalCode, BuildingName, OfficeNo) VALUES (?, ?, ?, ?, ?, ?, ?)",
          [
            businessID,
            streetAddress,
            suburb,
            city,
            postalCode,
            buildingName,
            officeNo,
          ],
          (err, results) => {
            if (err) {
              return db.rollback(() => {
                console.error("Error inserting into BusinessAddress:", err);
                res.status(500).json({ error: "Internal Server Error" });
              });
            }

            const addressID = results.insertId;

            // Insert into BankDetails
            db.query(
              "INSERT INTO BankDetails (BusinessID, BankName, AccountType, AccountNumber) VALUES (?, ?, ?, ?)",
              [businessID, bankName, accountType, accountNumber],
              (err, results) => {
                if (err) {
                  return db.rollback(() => {
                    console.error("Error inserting into BankDetails:", err);
                    res.status(500).json({ error: "Internal Server Error" });
                  });
                }

                const bankID = results.insertId;

                // Update BusinessDetails with addressID and bankID
                db.query(
                  "UPDATE BusinessDetails SET AddressID = ?, BankID = ? WHERE BusinessID = ?",
                  [addressID, bankID, businessID],
                  (err) => {
                    if (err) {
                      return db.rollback(() => {
                        console.error("Error updating BusinessDetails:", err);
                        res
                          .status(500)
                          .json({ error: "Internal Server Error" });
                      });
                    }

                    // Commit the transaction
                    db.commit((err) => {
                      if (err) {
                        return db.rollback(() => {
                          console.error("Error committing transaction:", err);
                          res
                            .status(500)
                            .json({ error: "Internal Server Error" });
                        });
                      }

                      console.log("Transaction successfully committed");
                      res
                        .status(201)
                        .json({ message: "Business registered successfully" });
                    });
                  }
                );
              }
            );
          }
        );
      }
    );
  });
});

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  if (email && password) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    db.query(
      "SELECT * FROM users WHERE email = ?",
      [email],
      async (err, results) => {
        if (err) {
          console.error("Error querying the database:", err);
          res
            .status(500)
            .json({ success: false, error: "Internal Server Error" });
          return;
        }

        console.log(results);

        if (results.length > 0) {
          const storedHashedPassword = results[0].Password;
          const passwordMatch = await bcrypt.compare(
            password,
            storedHashedPassword
          );

          console.log("Password Match:", passwordMatch);

          if (passwordMatch) {
            const token = jwt.sign({ id: results[0].userID }, jwt_secret, {
              expiresIn: "1h",
            });

            res.cookie("jwt", token, {
              httpOnly: true,
              secure: false,
              sameSite: "None",
              maxAge: 3600000,
            });

            res.status(200).json({
              success: true,
              message: "Login was successful",
              token: token,
            });
          } else {
            res
              .status(401)
              .json({ success: false, error: "Incorrect email or password" });
          }
        } else {
          res
            .status(401)
            .json({ success: false, error: "Incorrect email or password" });
        }
      }
    );
  } else {
    res
      .status(400)
      .json({ success: false, error: "Please enter email and password" });
  }
});

app.listen(port, console.log("connected to the server"));
