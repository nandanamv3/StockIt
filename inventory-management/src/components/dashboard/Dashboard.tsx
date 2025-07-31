import React, { useEffect, useState } from 'react';
import { supabase, Product, Order } from '../../config/supabase';
import { 
  CubeIcon, 
  ClipboardDocumentListIcon, 
  CurrencyDollarIcon,
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline';

interface DashboardStats {
  totalProducts: number;
  lowStockProducts: number;
  totalOrders: number;
  pendingOrders: number;
  todaysSales: number;
  totalSales: number;
}

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    lowStockProducts: 0,
    totalOrders: 0,
    pendingOrders: 0,
    todaysSales: 0,
    totalSales: 0,
  });
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch products data
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('*');

      if (productsError) throw productsError;

      // Fetch orders data
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // Calculate stats
      const totalProducts = products?.length || 0;
      const lowStockItems = products?.filter(p => p.quantity <= p.low_stock_threshold) || [];
      const lowStockProducts = lowStockItems.length;
      
      const totalOrders = orders?.length || 0;
      const pendingOrders = orders?.filter(o => o.status === 'pending').length || 0;
      
      const today = new Date().toISOString().split('T')[0];
      const todaysOrders = orders?.filter(o => o.order_date === today && o.status === 'completed') || [];
      const todaysSales = todaysOrders.reduce((sum, order) => sum + Number(order.total_amount), 0);
      
      const completedOrders = orders?.filter(o => o.status === 'completed') || [];
      const totalSales = completedOrders.reduce((sum, order) => sum + Number(order.total_amount), 0);

      setStats({
        totalProducts,
        lowStockProducts,
        totalOrders,
        pendingOrders,
        todaysSales,
        totalSales,
      });

      setLowStockProducts(lowStockItems.slice(0, 5)); // Show top 5 low stock items
      setRecentOrders(orders?.slice(0, 5) || []); // Show 5 most recent orders

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      name: 'Total Products',
      value: stats.totalProducts,
      icon: CubeIcon,
      color: 'bg-blue-500',
    },
    {
      name: 'Low Stock Alert',
      value: stats.lowStockProducts,
      icon: ExclamationTriangleIcon,
      color: 'bg-red-500',
    },
    {
      name: 'Total Orders',
      value: stats.totalOrders,
      icon: ClipboardDocumentListIcon,
      color: 'bg-green-500',
    },
    {
      name: 'Pending Orders',
      value: stats.pendingOrders,
      icon: ClipboardDocumentListIcon,
      color: 'bg-yellow-500',
    },
    {
      name: "Today's Sales",
      value: `$${stats.todaysSales.toFixed(2)}`,
      icon: CurrencyDollarIcon,
      color: 'bg-purple-500',
    },
    {
      name: 'Total Sales',
      value: `$${stats.totalSales.toFixed(2)}`,
      icon: CurrencyDollarIcon,
      color: 'bg-indigo-500',
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">Welcome to your inventory management system</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        {statCards.map((stat) => (
          <div key={stat.name} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`${stat.color} rounded-md p-3`}>
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">{stat.name}</dt>
                    <dd className="text-lg font-medium text-gray-900">{stat.value}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Low Stock Alert */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Low Stock Alert
            </h3>
            {lowStockProducts.length > 0 ? (
              <div className="space-y-3">
                {lowStockProducts.map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{product.name}</p>
                      <p className="text-sm text-gray-500">
                        Stock: {product.quantity} (Threshold: {product.low_stock_threshold})
                      </p>
                    </div>
                    <div className="text-red-600">
                      <ExclamationTriangleIcon className="h-5 w-5" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No low stock items</p>
            )}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Recent Orders
            </h3>
            {recentOrders.length > 0 ? (
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {order.customer_name || 'Anonymous Customer'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(order.order_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        ${Number(order.total_amount).toFixed(2)}
                      </p>
                      <p className={`text-xs px-2 py-1 rounded-full ${
                        order.status === 'completed' ? 'bg-green-100 text-green-800' :
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {order.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No recent orders</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};