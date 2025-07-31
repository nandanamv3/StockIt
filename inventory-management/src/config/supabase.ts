import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database Types
export interface Product {
  id: string;
  name: string;
  sku?: string;
  quantity: number;
  price: number;
  category?: string;
  image_url?: string;
  low_stock_threshold: number;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  customer_name?: string;
  customer_contact?: string;
  status: 'pending' | 'completed' | 'cancelled';
  total_amount: number;
  order_date: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  product?: Product;
}

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'staff';
  created_at: string;
}