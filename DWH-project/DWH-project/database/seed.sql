USE sales_source;

INSERT IGNORE INTO customers (customer_id, full_name, email) VALUES
(1, 'Ahmad Rahimi', 'ahmad.rahimi@example.com'),
(2, 'Laila Sediqi', 'laila.sediqi@example.com'),
(3, 'Farid Noori', 'farid.noori@example.com'),
(4, 'Maryam Azimi', 'maryam.azimi@example.com'),
(5, 'Omid Safi', 'omid.safi@example.com');

INSERT IGNORE INTO products (product_id, product_name, price, stock) VALUES
(1, 'Laptop', 650.00, 12),
(2, 'Wireless Mouse', 18.50, 80),
(3, 'Keyboard', 32.00, 45),
(4, 'Monitor', 175.00, 20),
(5, 'USB Flash Drive 64GB', 12.00, 100),
(6, 'Headphones', 45.00, 30);

INSERT IGNORE INTO orders (order_id, customer_id, order_date, status) VALUES
(1, 1, '2026-01-05 10:15:00', 'completed'),
(2, 2, '2026-01-18 14:30:00', 'completed'),
(3, 3, '2026-02-03 09:20:00', 'completed'),
(4, 1, '2026-02-21 16:45:00', 'cancelled'),
(5, 4, '2026-03-02 11:05:00', 'completed'),
(6, 5, '2026-03-15 13:10:00', 'completed'),
(7, 2, '2026-04-04 15:25:00', 'pending'),
(8, 3, '2026-04-12 12:00:00', 'completed');

INSERT IGNORE INTO order_items (item_id, order_id, product_id, quantity, unit_price) VALUES
(1, 1, 1, 1, 650.00),
(2, 1, 2, 2, 18.50),
(3, 2, 4, 1, 175.00),
(4, 2, 5, 3, 12.00),
(5, 3, 3, 2, 32.00),
(6, 3, 6, 1, 45.00),
(7, 4, 2, 1, 18.50),
(8, 5, 1, 1, 640.00),
(9, 5, 3, 1, 32.00),
(10, 6, 6, 2, 45.00),
(11, 7, 5, 2, 12.00),
(12, 8, 4, 2, 170.00),
(13, 8, 2, 1, 18.50);
