
function transformData(data) {
  const customers = data.customers.map((customer) => ({
    ...customer,
    full_name: String(customer.full_name || "").trim(),
    email: customer.email
      ? String(customer.email).trim().toLowerCase()
      : null,
  }));

  const products = data.products.map((product) => ({
    ...product,
    product_name: String(product.product_name || "").trim(),
    price: Number(product.price),
  }));

  const validCustomers = new Set(
    customers.map((customer) => customer.customer_id)
  );

  const validProducts = new Set(
    products.map((product) => product.product_id)
  );

  const orders = data.orders.filter(
    (order) =>
      validCustomers.has(order.customer_id) &&
      !Number.isNaN(new Date(order.order_date).getTime())
  );

  const validOrders = new Set(
    orders.map((order) => order.order_id)
  );

  const items = data.items
    .filter(
      (item) =>
        validOrders.has(item.order_id) &&
        validProducts.has(item.product_id) &&
        Number.isInteger(Number(item.quantity)) &&
        Number(item.quantity) > 0 &&
        Number.isFinite(Number(item.unit_price)) &&
        Number(item.unit_price) >= 0
    )
    .map((item) => ({
      ...item,
      quantity: Number(item.quantity),
      unit_price: Number(item.unit_price),
      total_amount:
        Number(item.quantity) * Number(item.unit_price),
    }));

  return {
    customers,
    products,
    orders,
    items,
  };
}

module.exports = transformData;
