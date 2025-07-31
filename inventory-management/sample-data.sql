-- Sample data for testing the inventory management system
-- Run this after setting up the main database schema

-- Insert sample products
INSERT INTO public.products (name, sku, quantity, price, category, low_stock_threshold, image_url) VALUES
('Wireless Bluetooth Headphones', 'WBH-001', 25, 79.99, 'Electronics', 5, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400'),
('USB-C Cable 6ft', 'USB-C-6', 150, 12.99, 'Electronics', 20, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'),
('Laptop Stand Adjustable', 'LS-ADJ-01', 8, 45.99, 'Accessories', 3, 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400'),
('Coffee Mug Set (4 pieces)', 'MUG-SET-4', 12, 24.99, 'Kitchen', 5, 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400'),
('Organic Green Tea (50 bags)', 'TEA-GRN-50', 30, 15.99, 'Beverages', 10, 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400'),
('Notebook Leather Bound', 'NB-LTH-A5', 45, 18.99, 'Stationery', 8, 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400'),
('Phone Case iPhone 13', 'PC-IP13-BLK', 2, 29.99, 'Electronics', 5, 'https://images.unsplash.com/photo-1601593346740-925612772716?w=400'),
('Desk Lamp LED', 'DL-LED-WHT', 15, 34.99, 'Home & Office', 3, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400'),
('Water Bottle Stainless Steel', 'WB-SS-500', 20, 22.99, 'Sports', 6, 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400'),
('Bluetooth Speaker Portable', 'BS-PORT-01', 18, 59.99, 'Electronics', 4, 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400');

-- Insert sample orders (you'll need to update customer info and dates as needed)
INSERT INTO public.orders (customer_name, customer_contact, status, total_amount, order_date) VALUES
('John Smith', 'john.smith@email.com', 'completed', 104.98, '2024-01-15'),
('Sarah Johnson', '+1-555-0123', 'pending', 67.98, '2024-01-16'),
('Mike Chen', 'mike.chen@email.com', 'completed', 139.97, '2024-01-16'),
('Lisa Williams', '+1-555-0456', 'cancelled', 29.99, '2024-01-17'),
('David Brown', 'david.brown@email.com', 'pending', 82.97, '2024-01-17');

-- Note: After inserting orders, you'll need to add order_items manually
-- Here's an example of how to add order items (replace order_id with actual UUIDs from the orders table):

-- Sample order items for the first order (John Smith - $104.98)
-- You'll need to get the actual order ID and product IDs from your database
/*
INSERT INTO public.order_items (order_id, product_id, quantity, unit_price, subtotal) VALUES
('your-order-id-here', 'your-product-id-here', 1, 79.99, 79.99),
('your-order-id-here', 'your-product-id-here', 1, 24.99, 24.99);
*/

-- To get the actual IDs for creating order items, run these queries:
-- SELECT id, customer_name FROM public.orders ORDER BY created_at;
-- SELECT id, name, price FROM public.products ORDER BY name;

-- Sample inventory transactions (these will be created automatically by triggers, but here are examples)
-- INSERT INTO public.inventory_transactions (product_id, transaction_type, quantity, notes) VALUES
-- ('your-product-id', 'in', 100, 'Initial stock'),
-- ('your-product-id', 'out', 5, 'Customer order');

-- First user will automatically become admin through the trigger
-- Additional users can be updated to admin role with:
-- UPDATE public.users SET role = 'admin' WHERE email = 'your-admin-email@example.com';