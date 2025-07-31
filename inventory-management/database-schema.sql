-- Enable Row Level Security
ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

-- Create custom types
CREATE TYPE order_status AS ENUM ('pending', 'completed', 'cancelled');
CREATE TYPE user_role AS ENUM ('admin', 'staff');

-- Users table (extends auth.users)
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT NOT NULL,
    role user_role DEFAULT 'staff',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products table
CREATE TABLE public.products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    sku TEXT UNIQUE,
    quantity INTEGER NOT NULL DEFAULT 0,
    price DECIMAL(10,2) NOT NULL,
    category TEXT,
    image_url TEXT,
    low_stock_threshold INTEGER DEFAULT 10,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders table
CREATE TABLE public.orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_name TEXT,
    customer_contact TEXT,
    status order_status DEFAULT 'pending',
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    order_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order items table
CREATE TABLE public.order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    UNIQUE(order_id, product_id)
);

-- Inventory transactions table (for tracking stock movements)
CREATE TABLE public.inventory_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    transaction_type TEXT NOT NULL, -- 'in', 'out', 'adjustment'
    quantity INTEGER NOT NULL,
    reference_id UUID, -- Could be order_id or other reference
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_products_category ON public.products(category);
CREATE INDEX idx_products_sku ON public.products(sku);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_date ON public.orders(order_date);
CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX idx_order_items_product_id ON public.order_items(product_id);
CREATE INDEX idx_inventory_transactions_product_id ON public.inventory_transactions(product_id);

-- Functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update product quantity when order items change
CREATE OR REPLACE FUNCTION update_product_quantity()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Decrease quantity when order item is added
        UPDATE public.products 
        SET quantity = quantity - NEW.quantity 
        WHERE id = NEW.product_id;
        
        -- Log inventory transaction
        INSERT INTO public.inventory_transactions (product_id, transaction_type, quantity, reference_id, notes)
        VALUES (NEW.product_id, 'out', NEW.quantity, NEW.order_id, 'Order item added');
        
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Adjust quantity based on difference
        UPDATE public.products 
        SET quantity = quantity + OLD.quantity - NEW.quantity 
        WHERE id = NEW.product_id;
        
        -- Log inventory transaction
        INSERT INTO public.inventory_transactions (product_id, transaction_type, quantity, reference_id, notes)
        VALUES (NEW.product_id, 'adjustment', NEW.quantity - OLD.quantity, NEW.order_id, 'Order item updated');
        
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Increase quantity when order item is deleted
        UPDATE public.products 
        SET quantity = quantity + OLD.quantity 
        WHERE id = OLD.product_id;
        
        -- Log inventory transaction
        INSERT INTO public.inventory_transactions (product_id, transaction_type, quantity, reference_id, notes)
        VALUES (OLD.product_id, 'in', OLD.quantity, OLD.order_id, 'Order item removed');
        
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Trigger for order items
CREATE TRIGGER update_product_quantity_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.order_items
    FOR EACH ROW EXECUTE FUNCTION update_product_quantity();

-- Row Level Security Policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own record
CREATE POLICY "Users can view own record" ON public.users
    FOR SELECT USING (auth.uid() = id);

-- Authenticated users can view products
CREATE POLICY "Authenticated users can view products" ON public.products
    FOR SELECT TO authenticated USING (true);

-- Only admins can modify products
CREATE POLICY "Admins can modify products" ON public.products
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Authenticated users can view orders
CREATE POLICY "Authenticated users can view orders" ON public.orders
    FOR SELECT TO authenticated USING (true);

-- Authenticated users can create orders
CREATE POLICY "Authenticated users can create orders" ON public.orders
    FOR INSERT TO authenticated WITH CHECK (true);

-- Only admins can update/delete orders
CREATE POLICY "Admins can modify orders" ON public.orders
    FOR UPDATE TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Similar policies for order_items
CREATE POLICY "Authenticated users can view order items" ON public.order_items
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create order items" ON public.order_items
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Admins can modify order items" ON public.order_items
    FOR UPDATE TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Inventory transactions - read-only for staff, full access for admins
CREATE POLICY "Authenticated users can view inventory transactions" ON public.inventory_transactions
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can modify inventory transactions" ON public.inventory_transactions
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, role)
    VALUES (NEW.id, NEW.email, 'staff');
    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Trigger for new user registration
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();