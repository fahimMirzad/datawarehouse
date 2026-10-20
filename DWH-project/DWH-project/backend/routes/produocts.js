
const express = require("express");
const router = express.Router();
const db = require("../config/warehouse");

// GET all products from Data Warehouse
router.get("/", async (req, res) => {
  try {
    const [products] = await db.query(`
      SELECT
        product_key AS product_id,
        source_product_id,
        product_name,
        current_price AS price
      FROM dim_product
      ORDER BY product_key DESC
    `);

    res.json(products);
  } catch (error) {
    console.error("Data Warehouse products error:", error.message);

    res.status(500).json({
      message: "Failed to fetch products from Data Warehouse",
    });
  }
});

// GET product by ID from Data Warehouse
router.get("/:id", async (req, res) => {
  try {
    const [products] = await db.execute(
      `SELECT
         product_key AS product_id,
         source_product_id,
         product_name,
         current_price AS price
       FROM dim_product
       WHERE product_key = ?`,
      [req.params.id]
    );

    if (products.length === 0) {
      return res.status(404).json({
        message: "Product not found in Data Warehouse",
      });
    }

    res.json(products[0]);
  } catch (error) {
    console.error("Data Warehouse product error:", error.message);

    res.status(500).json({
      message: "Failed to fetch product",
    });
  }
});

module.exports = router;
