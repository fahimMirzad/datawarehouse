const express = require("express");
const router = express.Router();
const db = require("../config/warehouse");

router.get("/sales", async (_req, res) => {
  try {
    const [monthly] = await db.query(`
      SELECT CONCAT(dd.year, '-', LPAD(dd.month, 2, '0')) AS month,
             ROUND(SUM(fs.total_amount), 2) AS sales,
             COUNT(DISTINCT fs.source_order_id) AS orders
      FROM fact_sales fs
      JOIN dim_date dd ON dd.date_key = fs.date_key
      WHERE fs.order_status = 'completed'
      GROUP BY dd.year, dd.month
      ORDER BY dd.year, dd.month
    `);
    const [topProducts] = await db.query(`
      SELECT dp.product_name,
             ROUND(SUM(fs.total_amount), 2) AS sales,
             SUM(fs.quantity) AS quantity
      FROM fact_sales fs
      JOIN dim_product dp ON dp.product_key = fs.product_key
      WHERE fs.order_status = 'completed'
      GROUP BY dp.product_key, dp.product_name
      ORDER BY sales DESC
      LIMIT 10
    `);
    res.json({
      monthly: monthly.map((row) => ({ ...row, sales: Number(row.sales || 0), orders: Number(row.orders || 0) })),
      topProducts: topProducts.map((row) => ({ ...row, sales: Number(row.sales || 0), quantity: Number(row.quantity || 0) })),
    });
  } catch (error) {
    console.error("Sales reports error:", error.message);
    res.status(500).json({ message: "Failed to build sales reports" });
  }
});

module.exports = router;
