
const mysql = require("mysql2/promise");
require("dotenv").config({
  path: require("path").join(__dirname, "../backend/.env"),
});

async function extractData() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: "sales_source",
  });

  try {
    const [customers] = await connection.query(
      "SELECT * FROM customers"
    );

    const [products] = await connection.query(
      "SELECT * FROM products"
    );

    const [orders] = await connection.query(
      "SELECT * FROM orders"
    );

    const [items] = await connection.query(
      "SELECT * FROM order_items"
    );

    console.log("Extract completed:", {
      customers: customers.length,
      products: products.length,
      orders: orders.length,
      items: items.length,
    });

    return { customers, products, orders, items };
  } finally {
    await connection.end();
  }
}

module.exports = extractData;
