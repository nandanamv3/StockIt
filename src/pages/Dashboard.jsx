import React, { useState, useEffect } from 'react'
import  supabase  from '../lib/supabase'
import { 
  DollarSign, 
  Package, 
  ShoppingCart, 
  AlertTriangle, 
  TrendingUp,
  Users,
  Eye
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    totalProducts: 0,
    lowStockItems: 0,
    pendingOrders: 0,
  })
  const [topProducts, setTopProducts] = useState([])
  const [salesData, setSalesData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
  
      const { data: products } = await supabase
        .from('products')
        .select('id, stock_quantity, low_stock_threshold')
      
      const totalProducts = products?.length || 0
      const lowStockItems = products?.filter(p => p.stock_quantity <= (p.low_stock_threshold || 5)).length || 0

      const { data: orders } = await supabase
        .from('orders')
        .select('id, status, total_amount, created_at')

      const totalOrders = orders?.length || 0
      const pendingOrders = orders?.filter(o => o.status === 'pending').length || 0
      const completedOrders = orders?.filter(o => o.status === 'completed') || []
      const totalSales = completedOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0)

      const salesByDay = generateSalesData(completedOrders)

      // Fetch top products (mock data for now)
      const mockTopProducts = [
        { name: 'Product A', sales: 45, revenue: 2250 },
        { name: 'Product B', sales: 32, revenue: 1600 },
        { name: 'Product C', sales: 28, revenue: 1400 },
        { name: 'Product D', sales: 19, revenue: 950 },
      ]

      setStats({
        totalSales,
        totalOrders,
        totalProducts,
        lowStockItems,
        pendingOrders,
      })
      
      setTopProducts(mockTopProducts)
      setSalesData(salesByDay)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      setLoading(false)
    }
  }

  const generateSalesData = (orders) => {
    const last7Days = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      
      const dayOrders = orders.filter(order => 
        order.created_at?.startsWith(dateStr)
      )
      
      const totalSales = dayOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0)
      
      last7Days.push({
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        sales: totalSales,
        orders: dayOrders.length,
      })
    }
    return last7Days
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const statCards = [
    {
    title: 'Total Sales',
    value: `₹${stats.totalSales.toLocaleString('en-IN')}`,
    icon: DollarSign,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    change: '+12.5%',
  },
    {
      title: 'Total Orders',
      value: stats.totalOrders.toString(),
      icon: ShoppingCart,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      change: '+8.2%',
    },
    {
      title: 'Products',
      value: stats.totalProducts.toString(),
      icon: Package,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      change: '+2.1%',
    },
    {
      title: 'Low Stock Items',
      value: stats.lowStockItems.toString(),
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      urgent: stats.lowStockItems > 0,
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back! Here's what's happening with your business.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((card, index) => {
            const Icon = card.icon
            return (
              <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">{card.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                    {card.change && (
                      <p className="text-sm text-green-600 mt-1 flex items-center">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        {card.change}
                      </p>
                    )}
                    {card.urgent && (
                      <p className="text-sm text-red-600 mt-1 font-medium">Needs attention</p>
                    )}
                  </div>
                  <div className={`${card.bgColor} p-3 rounded-lg`}>
                    <Icon className={`h-6 w-6 ${card.color}`} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Sales Chart */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Sales Overview</h3>
              <div className="flex items-center text-sm text-gray-600">
                <Eye className="h-4 w-4 mr-1" />
                Last 7 days
              </div>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip 
  formatter={(value, name) => [`₹${value.toLocaleString('en-IN')}`, 'Sales']}
  labelFormatter={(label) => `Day: ${label}`}
/>
                <Bar dataKey="sales" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Top Selling Products</h3>
            <div className="space-y-4">
              {topProducts.map((product, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-blue-600 font-semibold text-sm">{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-sm text-gray-600">{product.sales} units sold</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">₹{product.revenue.toLocaleString('en-IN')}</p>
                    <p className="text-sm text-gray-600">Revenue</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200">
              <Package className="h-5 w-5 mr-2 text-blue-600" />
              <span className="font-medium">Add New Product</span>
            </button>
            <button className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200">
              <ShoppingCart className="h-5 w-5 mr-2 text-green-600" />
              <span className="font-medium">Create Order</span>
            </button>
            <button className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200">
              <Users className="h-5 w-5 mr-2 text-purple-600" />
              <span className="font-medium">View Reports</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard