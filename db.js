// db.js
const mysql = require("mysql2/promise");

const db = mysql.createPool({
  host: process.env.MYSQLHOST,
  port: process.env.MYSQLPORT,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  ssl: {
    rejectUnauthorized: false
  } // ⭐ VERY IMPORTANT for Railway MySQL
});

module.exports = db;