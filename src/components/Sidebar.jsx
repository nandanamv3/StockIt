import { Link, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  ClipboardList, 
  FileText, 
  Store 
} from 'lucide-react'

const Sidebar = () => {
  const location = useLocation()
  
  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/products', icon: Package, label: 'Product Management' },
    { path: '/orders', icon: ShoppingCart, label: 'Order Management' },
    { path: '/inventory-log', icon: ClipboardList, label: 'Inventory Log' },
    { path: '/reports', icon: FileText, label: 'Reports' },
  ]

  return (
    <div className="bg-gray-900 text-white w-64 min-h-screen p-4">
      <div className="flex items-center mb-8">
        <Store className="w-8 h-8 mr-3 text-blue-400" />
        <h1 className="text-xl font-bold">StockIt</h1>
      </div>
      
      <nav>
        <ul className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                    isActive 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}

export default Sidebar