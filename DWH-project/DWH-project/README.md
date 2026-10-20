# Sales Data Warehouse System

A university project demonstrating a source database, an ETL pipeline, a MySQL data warehouse using a simple star schema, and a React dashboard.

## Technologies
- Source database and warehouse: MySQL
- ETL and API: Node.js, Express, mysql2
- Frontend: React, Vite, Tailwind CSS, Recharts

## Setup
1. Install Node.js and MySQL.
2. In MySQL, execute `database/schema.sql` to create the `sales_source` database and tables.
3. Execute `database/seed.sql` to insert demonstration data.
4. Execute `database/warehouse.sql` to create the `sales_warehouse` database and its dimension/fact tables.
5. In `backend/`, copy `.env.example` to `.env`, then set `DB_HOST`, `DB_USER`, `DB_PASSWORD`, and `DB_NAME` to match your MySQL installation. Keep `.env` private and do not commit it.
6. Run `npm install` once in the project root (the ETL scripts use the root dependencies), then run `npm install` in both `backend/` and `frontend/`.
7. Run the ETL from the project root with `node etl/run-etl.js`. It extracts from `sales_source` and loads dimensions and facts into `sales_warehouse`.
8. Start the backend: `cd backend` then `npm run dev` (or `npm start`, depending on the scripts in package.json).
9. Start the frontend in another terminal: `cd frontend` then `npm run dev`.
10. Open the local URL printed by Vite. The API defaults to `http://localhost:5000/api`.

## Main pages
- Dashboard: sales KPIs and monthly sales trend.
- Products: searchable list of products in `dim_product`.
- Data Warehouse: dimension/fact table row counts and recent `fact_sales` records.
- Reports: monthly sales and top-selling products.

## API endpoints
- `GET /api/health`
- `GET /api/dashboard/summary`
- `GET /api/products`
- `GET /api/warehouse/overview`
- `GET /api/warehouse/recent-sales`
- `GET /api/reports/sales`

## Notes
- The ETL is designed to be rerun: source identifiers are used to upsert dimension and fact records.
- Reports and total sales count only orders whose status is `completed`; total orders include all order statuses represented in `fact_sales`.
- This project is a learning/demo system, not a production deployment. Add authentication, validation, migration management, and secure deployment settings before production use.


## ETL Pipeline page

The React sidebar now includes a separate **ETL Pipeline** page. With the backend running, the page can start the real `etl/run-etl.js` child process, poll the live status, show stage logs and record counts, and persist the most recent run status in `etl/etl-status.json`. The API endpoints are `GET /api/etl/status` and `POST /api/etl/run`. The run requires reachable MySQL source and warehouse databases and valid `backend/.env` settings (copy `.env.example` to `.env` and fill in local credentials).
