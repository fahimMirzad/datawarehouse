
CREATE DATABASE IF NOT EXISTS sales_warehouse;

USE sales_warehouse;

CREATE TABLE IF NOT EXISTS dim_customer (
    customer_key INT AUTO_INCREMENT PRIMARY KEY,
    source_customer_id INT UNIQUE,
    full_name VARCHAR(100),
    email VARCHAR(150)
);

CREATE TABLE IF NOT EXISTS dim_product (
    product_key INT AUTO_INCREMENT PRIMARY KEY,
    source_product_id INT UNIQUE,
    product_name VARCHAR(150),
    current_price DECIMAL(10, 2)
);

CREATE TABLE IF NOT EXISTS dim_date (
    date_key INT PRIMARY KEY,
    full_date DATE NOT NULL,
    year INT NOT NULL,
    month INT NOT NULL,
    day INT NOT NULL
);

CREATE TABLE IF NOT EXISTS fact_sales (
    sales_key BIGINT AUTO_INCREMENT PRIMARY KEY,
    source_order_id INT NOT NULL,
    source_item_id INT NOT NULL,
    customer_key INT NOT NULL,
    product_key INT NOT NULL,
    date_key INT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_amount DECIMAL(12, 2) NOT NULL,
    order_status VARCHAR(30) NULL,

    UNIQUE KEY unique_source_item (source_item_id),

    FOREIGN KEY (customer_key)
        REFERENCES dim_customer(customer_key),

    FOREIGN KEY (product_key)
        REFERENCES dim_product(product_key),

    FOREIGN KEY (date_key)
        REFERENCES dim_date(date_key)
);
