import { LayoutDashboard } from 'lucide-react'

const Dashboard = () => {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome to your inventory management system</p>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center">
          <LayoutDashboard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Dashboard Coming Soon</h3>
          <p className="text-gray-500">Sales insights and analytics will be displayed here</p>
        </div>
      </div>
    </div>
  )
}

export default Dashboard