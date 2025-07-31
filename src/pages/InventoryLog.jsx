// ...existing imports...
import React, { useState, useEffect } from 'react'
import { Search, RefreshCw, ChevronDown, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react'
import supabase from '../lib/supabase';
// ...existing code...

export default function InventoryLog() {
  const [logs, setLogs] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('All Changes')
  const [refreshing, setRefreshing] = useState(false)

  // Summary stats
  const [summaryStats, setSummaryStats] = useState({
    totalStockIn: 0,
    totalStockOut: 0,
    lowStockItems: 0
  })

  const fetchInventoryLogs = async () => {
    try {
      // Get current user session
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      const { data, error } = await supabase
        .from('inventory_logs')
        .select(`
          *,
          products (
            name,
            sku
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setLogs(data || [])
    } catch (err) {
      console.error('Error fetching inventory logs:', err)
      setError('Failed to fetch inventory logs')
    }
  }

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')

      if (error) throw error
      setProducts(data || [])
    } catch (err) {
      console.error('Error fetching products:', err)
      setError('Failed to fetch products')
    }
  }


  const calculateSummaryStats = (logs, products) => {
    const totalStockIn = logs
      .filter(log => log.change_type === 'add')
      .reduce((sum, log) => sum + log.quantity_changed, 0)

    const totalStockOut = logs
      .filter(log => log.change_type === 'remove')
      .reduce((sum, log) => sum + log.quantity_changed, 0)

    const lowStockItems = products.filter(
      product => product.quantity <= product.low_stock_threshold
    ).length

    setSummaryStats({
      totalStockIn,
      totalStockOut,
      lowStockItems
    })
  }

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    await Promise.all([
      fetchInventoryLogs(),
      fetchProducts()
    ])
    setLoading(false)
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchData()
    setRefreshing(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    calculateSummaryStats(logs, products)
  }, [logs, products])

 
  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.products?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.products?.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.product_id.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesFilter = filterType === 'All Changes' || 
      (filterType === 'Stock In' && log.change_type === 'add') ||
      (filterType === 'Stock Out' && log.change_type === 'remove')

    return matchesSearch && matchesFilter
  })



  return (
    <div className="min-h-screen bg-white py-10 px-4">
      <div className="max-w-7xl mx-auto bg-white">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Inventory Log</h1>
          <p className="text-gray-600">Track stock movements, monitor levels, and manage inventory changes</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-green-50 rounded-xl p-6 border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center">
                <TrendingUp className="text-green-600 w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Stock In</p>
                <p className="text-3xl font-bold text-gray-900">{summaryStats.totalStockIn.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="bg-red-50 rounded-xl p-6 border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="bg-red-100 w-12 h-12 rounded-full flex items-center justify-center">
                <TrendingDown className="text-red-600 w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Stock Out</p>
                <p className="text-3xl font-bold text-gray-900">{summaryStats.totalStockOut.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="bg-yellow-50 rounded-xl p-6 border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="bg-yellow-100 w-12 h-12 rounded-full flex items-center justify-center">
                <AlertTriangle className="text-yellow-600 w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Low Stock Items</p>
                <p className="text-3xl font-bold text-gray-900">{summaryStats.lowStockItems.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stock Movement History */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Stock Movement History</h2>
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none w-full sm:w-64"
                />
              </div>
              {/* Filter Dropdown */}
              <div className="relative">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none cursor-pointer"
                >
                  <option>All Changes</option>
                  <option>Stock In</option>
                  <option>Stock Out</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
              </div>
              {/* Refresh Button */}
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Product ID</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Product Name</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{log.product_id}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{log.products?.sku || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{log.products?.name || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{log.quantity_changed}</td>
                    <td className="px-6 py-4 text-sm">
                      {log.change_type === 'add' ? (
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700">
                          Stock In
                        </span>
                      ) : log.change_type === 'remove' ? (
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-700">
                          Stock Out
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">
                          {log.change_type}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}