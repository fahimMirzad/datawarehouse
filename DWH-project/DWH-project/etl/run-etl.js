const extractData = require("./extract");
const transformData = require("./transform");
const loadData = require("./load");

async function runETL() {
  const started = Date.now();
  try {
    console.log("[ETL] STAGE Extracting source data from sales_source");
    const extractedData = await extractData();
    for (const [key, value] of Object.entries(extractedData)) {
      console.log(`[ETL] EXTRACTED ${key}=${value.length}`);
    }

    console.log("[ETL] STAGE Validating and transforming extracted records");
    const transformedData = transformData(extractedData);
    for (const key of Object.keys(transformedData)) {
      console.log(`[ETL] TRANSFORMED ${key}=${transformedData[key].length}`);
    }
    const dropped = {};
    for (const key of Object.keys(extractedData)) {
      dropped[`${key}_rejected`] = extractedData[key].length - transformedData[key].length;
    }
    console.log(`[ETL] SUMMARY ${JSON.stringify({ ...dropped, durationMsBeforeLoad: Date.now() - started })}`);

    console.log("[ETL] STAGE Loading dimensions and fact records into sales_warehouse");
    await loadData(transformedData);
    console.log(`[ETL] LOADED customers=${transformedData.customers.length}`);
    console.log(`[ETL] LOADED products=${transformedData.products.length}`);
    console.log(`[ETL] LOADED dates=${transformedData.orders.length}`);
    console.log(`[ETL] LOADED sales_items=${transformedData.items.length}`);
    console.log("[ETL] STAGE Completed");
    console.log(`[ETL] SUMMARY ${JSON.stringify({ durationMs: Date.now() - started, sourceCustomers: extractedData.customers.length, sourceProducts: extractedData.products.length, sourceOrders: extractedData.orders.length, sourceItems: extractedData.items.length, loadedCustomers: transformedData.customers.length, loadedProducts: transformedData.products.length, loadedOrders: transformedData.orders.length, loadedItems: transformedData.items.length, ...dropped })}`);
  } catch (error) {
    console.error("[ETL] STAGE Failed");
    console.error("ETL failed:", error.message);
    process.exitCode = 1;
  }
}

if (require.main === module) runETL();
module.exports = runETL;
