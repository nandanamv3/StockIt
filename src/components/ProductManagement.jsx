import { Package } from 'lucide-react'

const ProductManagement = () => {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Product Management</h1>
        <p className="text-gray-600">Manage your products, categories, and inventory</p>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Product Management Coming Soon</h3>
          <p className="text-gray-500">Add, edit, and manage your products here</p>
        </div>
      </div>
    </div>
  )
}

export default ProductManagement