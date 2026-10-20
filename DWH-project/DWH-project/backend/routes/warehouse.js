const express = require("express");
const router = express.Router();
const db = require("../config/warehouse");

// Counts for the warehouse overview page.
router.get("/overview", async (_req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 'dim_customer' AS table_name, COUNT(*) AS row_count FROM dim_customer
      UNION ALL SELECT 'dim_product', COUNT(*) FROM dim_product
      UNION ALL SELECT 'dim_date', COUNT(*) FROM dim_date
      UNION ALL SELECT 'fact_sales', COUNT(*) FROM fact_sales
    `);
    res.json({ tables: rows.map((row) => ({
      table_name: row.table_name,
      row_count: Number(row.row_count),
    })) });
  } catch (error) {
    console.error("Warehouse overview error:", error.message);
    res.status(500).json({ message: "Failed to read warehouse overview" });
  }
});

router.get("/recent-sales", async (_req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT fs.sales_key, fs.source_order_id, fs.source_item_id,
             dc.full_name AS customer_name, dp.product_name,
             dd.full_date, fs.quantity, fs.unit_price, fs.total_amount,
             fs.order_status
      FROM fact_sales fs
      LEFT JOIN dim_customer dc ON dc.customer_key = fs.customer_key
      LEFT JOIN dim_product dp ON dp.product_key = fs.product_key
      LEFT JOIN dim_date dd ON dd.date_key = fs.date_key
      ORDER BY fs.date_key DESC, fs.sales_key DESC
      LIMIT 100
    `);
    res.json(rows);
  } catch (error) {
    console.error("Warehouse recent sales error:", error.message);
    res.status(500).json({ message: "Failed to read warehouse fact data" });
  }
});

module.exports = router;
