import mysql from 'mysql'

const connectToDatabase = () => {
    const db = mysql.createConnection({
        host: "localhost",
        user: "root",
        password: "Ismail121",
        database: "invoicesys",
      });
      
      db.connect((err) => {
        if (err) {
          console.error("Error connecting to MySQL:", err);
        } else {
          console.log("Connected to MySQL database");
        }
      });
}

export default connectToDatabase

