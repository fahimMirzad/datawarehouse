const express = require("express");
const cors = require("cors");
const db = require("./config/db");
require("dotenv").config();

const productsRouter = require("./routes/produocts");
const dashboardRouter = require("./routes/dashboard");
const warehouseRouter = require("./routes/warehouse");
const reportsRouter = require("./routes/reports");
const etlRouter = require("./routes/etl");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "Sales Data Warehouse API is running",
  });
});

app.get("/api/health", async (req, res) => {
  try {
    await db.query("SELECT 1");

    res.json({
      status: "ok",
      database: "connected",
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      database: "disconnected",
    });
  }
});

app.use("/api/products", productsRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/warehouse", warehouseRouter);
app.use("/api/reports", reportsRouter);
app.use("/api/etl", etlRouter);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
