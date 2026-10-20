
const mysql = require("mysql2/promise");
const path = require("path");

require("dotenv").config({
  path: path.join(__dirname, "../backend/.env"),
});

async function loadData(data) {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: "sales_warehouse",
  });

  try {
    await connection.beginTransaction();

    // 1. Load customers into dim_customer
    for (const customer of data.customers) {
      await connection.execute(
        `INSERT INTO dim_customer
          (source_customer_id, full_name, email)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE
          full_name = VALUES(full_name),
          email = VALUES(email)`,
        [
          customer.customer_id,
          customer.full_name,
          customer.email,
        ]
      );
    }

    // 2. Load products into dim_product
    for (const product of data.products) {
      await connection.execute(
        `INSERT INTO dim_product
          (source_product_id, product_name, current_price)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE
          product_name = VALUES(product_name),
          current_price = VALUES(current_price)`,
        [
          product.product_id,
          product.product_name,
          product.price,
        ]
      );
    }

    // 3. Load dates into dim_date
    for (const order of data.orders) {
      const date = new Date(order.order_date);

      if (Number.isNaN(date.getTime())) {
        throw new Error(
          `Invalid order date for order ${order.order_id}`
        );
      }

      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();

      const dateKey = year * 10000 + month * 100 + day;

      const fullDate = [
        year,
        String(month).padStart(2, "0"),
        String(day).padStart(2, "0"),
      ].join("-");

      await connection.execute(
        `INSERT INTO dim_date
          (date_key, full_date, year, month, day)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
          full_date = VALUES(full_date),
          year = VALUES(year),
          month = VALUES(month),
          day = VALUES(day)`,
        [dateKey, fullDate, year, month, day]
      );
    }

    // 4. Load sales facts into fact_sales
    for (const item of data.items) {
      const order = data.orders.find(
        (entry) => entry.order_id === item.order_id
      );

      if (!order) {
        throw new Error(
          `Order not found for item ${item.item_id}`
        );
      }

      const date = new Date(order.order_date);

      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();

      const dateKey = year * 10000 + month * 100 + day;

      const [[customer]] = await connection.execute(
        `SELECT customer_key
         FROM dim_customer
         WHERE source_customer_id = ?`,
        [order.customer_id]
      );

      const [[product]] = await connection.execute(
        `SELECT product_key
         FROM dim_product
         WHERE source_product_id = ?`,
        [item.product_id]
      );

      if (!customer || !product) {
        throw new Error(
          `Missing customer or product dimension for item ${item.item_id}`
        );
      }

      const totalAmount =
        item.total_amount != null
          ? item.total_amount
          : Number(item.quantity) * Number(item.unit_price);

      await connection.execute(
        `INSERT INTO fact_sales
          (
            source_order_id,
            source_item_id,
            customer_key,
            product_key,
            date_key,
            quantity,
            unit_price,
            total_amount,
            order_status
          )
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
          source_order_id = VALUES(source_order_id),
          customer_key = VALUES(customer_key),
          product_key = VALUES(product_key),
          date_key = VALUES(date_key),
          quantity = VALUES(quantity),
          unit_price = VALUES(unit_price),
          total_amount = VALUES(total_amount),
          order_status = VALUES(order_status)`,
        [
          order.order_id,
          item.item_id,
          customer.customer_key,
          product.product_key,
          dateKey,
          item.quantity,
          item.unit_price,
          totalAmount,
          order.status ?? null,
        ]
      );
    }

    await connection.commit();

    console.log("Load completed successfully.");
  } catch (error) {
    await connection.rollback();
    console.error("ETL load failed:", error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

module.exports = loadData;
