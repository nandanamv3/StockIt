import { useState, useEffect } from 'react'
import { 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  Package, 
  Search,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react'
import { format } from 'date-fns'

// Mock data for demonstration (replace with actual Supabase calls)
const mockInventoryLogs = [
  {
    id: 1,
    product_id: 1,
    change_type: 'in',
    quantity_changed: 50,
    previous_quantity: 100,
    new_quantity: 150,
    reason: 'Stock replenishment',
    created_at: '2024-01-15T10:30:00Z',
    products: { name: 'Wireless Headphones', sku: 'WH001', category: 'Electronics' }
  },
  {
    id: 2,
    product_id: 2,
    change_type: 'out',
    quantity_changed: 5,
    previous_quantity: 25,
    new_quantity: 20,
    reason: 'Order fulfillment',
    created_at: '2024-01-15T09:15:00Z',
    products: { name: 'Coffee Mug', sku: 'CM001', category: 'Kitchenware' }
  },
  {
    id: 3,
    product_id: 3,
    change_type: 'out',
    quantity_changed: 15,
    previous_quantity: 20,
    new_quantity: 5,
    reason: 'Order fulfillment',
    created_at: '2024-01-15T08:45:00Z',
    products: { name: 'Notebook', sku: 'NB001', category: 'Stationery' }
  }
]

const mockLowStockProducts = [
  {
    id: 3,
    name: 'Notebook',
    sku: 'NB001',
    quantity: 5,
    category: 'Stationery',
    price: 12.99,
    low_stock_threshold: 10
  },
  {
    id: 4,
    name: 'USB Cable',
    sku: 'USB001',
    quantity: 8,
    category: 'Electronics',
    price: 9.99,
    low_stock_threshold: 15
  }
]

const InventoryLog = () => {
  const [logs, setLogs] = useState([])
  const [lowStockProducts, setLowStockProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      // Replace with actual Supabase calls
      // const inventoryLogs = await inventoryLogService.getInventoryLogs()
      // const lowStock = await inventoryLogService.getLowStockProducts()
      
      setLogs(mockInventoryLogs)
      setLowStockProducts(mockLowStockProducts)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.products.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.products.sku.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterType === 'all' || log.change_type === filterType
    return matchesSearch && matchesFilter
  })

  const totalStockIn = logs
    .filter(log => log.change_type === 'in')
    .reduce((sum, log) => sum + log.quantity_changed, 0)

  const totalStockOut = logs
    .filter(log => log.change_type === 'out')
    .reduce((sum, log) => sum + log.quantity_changed, 0)

  const StatsCard = ({ title, value, icon: Icon, color, bgColor }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className={`${bgColor} p-3 rounded-full`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  )

  const InventoryLogTable = () => (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Stock Movement History</h3>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Changes</option>
              <option value="in">Stock In</option>
              <option value="out">Stock Out</option>
            </select>
            <button
              onClick={loadData}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Change Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Quantity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stock Level
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Reason
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredLogs.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {log.products.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      SKU: {log.products.sku}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    log.change_type === 'in' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {log.change_type === 'in' ? (
                      <TrendingUp className="w-3 h-3 mr-1" />
                    ) : (
                      <TrendingDown className="w-3 h-3 mr-1" />
                    )}
                    Stock {log.change_type === 'in' ? 'In' : 'Out'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {log.change_type === 'in' ? '+' : '-'}{log.quantity_changed}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {log.previous_quantity} → {log.new_quantity}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {log.reason}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {format(new Date(log.created_at), 'MMM dd, yyyy HH:mm')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  const LowStockAlert = () => (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center">
          <AlertTriangle className="w-5 h-5 text-yellow-500 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Low Stock Alerts</h3>
          <span className="ml-2 bg-yellow-100 text-yellow-800 text-sm px-2 py-1 rounded-full">
            {lowStockProducts.length} items
          </span>
        </div>
      </div>
      
      <div className="divide-y divide-gray-200">
        {lowStockProducts.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No low stock items</p>
          </div>
        ) : (
          lowStockProducts.map((product) => (
            <div key={product.id} className="px-6 py-4 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900">{product.name}</h4>
                <p className="text-sm text-gray-500">SKU: {product.sku}</p>
              </div>
              <div className="text-right">
                <span className="text-sm font-medium text-red-600">
                  {product.quantity} left
                </span>
                <p className="text-xs text-gray-500">
                  Threshold: {product.low_stock_threshold}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Inventory Log</h1>
        <p className="text-gray-600">Track stock movements, monitor levels, and manage inventory changes</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <StatsCard
          title="Total Stock In"
          value={totalStockIn}
          icon={TrendingUp}
          color="text-green-600"
          bgColor="bg-green-100"
        />
        <StatsCard
          title="Total Stock Out"
          value={totalStockOut}
          icon={TrendingDown}
          color="text-red-600"
          bgColor="bg-red-100"
        />
        <StatsCard
          title="Low Stock Items"
          value={lowStockProducts.length}
          icon={AlertTriangle}
          color="text-yellow-600"
          bgColor="bg-yellow-100"
        />
      </div>

      {/* Low Stock Alerts */}
      {lowStockProducts.length > 0 && (
        <div className="mb-6">
          <LowStockAlert />
        </div>
      )}

      {/* Inventory Log Table */}
      <InventoryLogTable />
    </div>
  )
}

export default InventoryLog