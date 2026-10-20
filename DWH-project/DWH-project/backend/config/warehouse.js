
const mysql = require("mysql2/promise");

const warehouse = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: "sales_warehouse",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

module.exports = warehouse;
