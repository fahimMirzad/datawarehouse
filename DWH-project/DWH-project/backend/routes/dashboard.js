
const express = require("express");
const router = express.Router();
const db = require("../config/warehouse");

// GET dashboard summary from Data Warehouse
router.get("/summary", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        COUNT(DISTINCT fs.source_order_id) AS total_orders,

        COUNT(DISTINCT CASE
          WHEN fs.order_status = 'completed'
          THEN fs.source_order_id
        END) AS completed_orders,

        COALESCE(SUM(CASE WHEN fs.order_status = 'completed' THEN fs.total_amount ELSE 0 END), 0) AS total_sales,

        (
          SELECT COUNT(*)
          FROM dim_customer
        ) AS total_customers

      FROM fact_sales fs
    `);

    const summary = rows[0];

    res.json({
      total_orders: Number(summary.total_orders),
      completed_orders: Number(summary.completed_orders),
      total_sales: Number(summary.total_sales),
      total_customers: Number(summary.total_customers),
    });
  } catch (error) {
    console.error("Data Warehouse dashboard error:", error);

    res.status(500).json({
      message: "Failed to fetch Data Warehouse summary",
    });
  }
});

module.exports = router;
