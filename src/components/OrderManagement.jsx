import { ShoppingCart } from 'lucide-react'

const OrderManagement = () => {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
        <p className="text-gray-600">Process and track customer orders</p>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center">
          <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Order Management Coming Soon</h3>
          <p className="text-gray-500">Create and manage customer orders here</p>
        </div>
      </div>
    </div>
  )
}

export default OrderManagement