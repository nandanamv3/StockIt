import { FileText } from 'lucide-react'

const Reports = () => {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-600">Generate and export business reports</p>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Reports Coming Soon</h3>
          <p className="text-gray-500">Sales reports and analytics will be available here</p>
        </div>
      </div>
    </div>
  )
}

export default Reports