import { createClient } from '@supabase/supabase-js'

// Replace these with your actual Supabase URL and anon key
const supabaseUrl = 'YOUR_SUPABASE_URL'
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY'

export const supabase = createClient(supabaseUrl, supabaseKey)

// Database utility functions for inventory logs
export const inventoryLogService = {
  // Get all inventory logs with product information
  async getInventoryLogs() {
    const { data, error } = await supabase
      .from('inventory_logs')
      .select(`
        *,
        products (
          id,
          name,
          sku,
          category
        )
      `)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  // Get low stock products
  async getLowStockProducts(threshold = 10) {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .lt('quantity', threshold)
      .order('quantity', { ascending: true })
    
    if (error) throw error
    return data
  },

  // Get recent stock movements
  async getRecentStockMovements(days = 7) {
    const date = new Date()
    date.setDate(date.getDate() - days)
    
    const { data, error } = await supabase
      .from('inventory_logs')
      .select(`
        *,
        products (
          name,
          sku
        )
      `)
      .gte('created_at', date.toISOString())
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  // Add inventory log entry
  async addInventoryLog(logEntry) {
    const { data, error } = await supabase
      .from('inventory_logs')
      .insert([logEntry])
      .select()
    
    if (error) throw error
    return data
  }
}