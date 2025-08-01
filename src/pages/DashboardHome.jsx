import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Package,
  ShoppingCart,
  AlertTriangle,
  Users,
  Eye,
  Info,
  TrendingUp,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import supabase from '../lib/supabase';

const DashboardHome = () => {
  const [stats, setStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    totalProducts: 0,
    lowStockItems: 0,
    pendingOrders: 0,
  });
  const [topProducts, setTopProducts] = useState([]);
  const [salesData, setSalesData] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLowStockDetails, setShowLowStockDetails] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, name, quantity, price, low_stock_threshold, user_id')
        .eq('user_id', userId);

      if (productsError) {
        throw productsError;
      }

      const totalProducts = products?.length || 0;
      const lowStockProductsArr = (products || []).filter(
        (p) => (p.quantity ?? 0) <= (p.low_stock_threshold ?? 2)
      );
      const lowStockItems = lowStockProductsArr.length;

      // Fetch orders data
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id, status, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });


      if (ordersError) {
        throw ordersError;
      }
      
      const totalOrders = orders?.length || 0;
      const pendingOrdersCount = orders?.filter((o) => {
        const status = o.status?.toLowerCase();
        return status === 'pending' || status === 'processing';
      }).length || 0;

      const { data: orderItems, error: orderItemsError } = await supabase
        .from('order_items')
        .select('order_id, product_id, quantity');
      
      if (orderItemsError) {
        throw orderItemsError;
      }
      
      const productMap = new Map(products.map(p => [p.id, p]));

      let totalSales = 0;
      const salesByDayMap = new Map();

      const completedOrderIds = new Set(orders
        .filter(o => o.status?.toLowerCase() === 'completed')
        .map(o => o.id));
      
      orderItems.forEach(item => {
        if (completedOrderIds.has(item.order_id)) {
          const product = productMap.get(item.product_id);
          if (product) {
            const saleAmount = (product.price ?? 0) * (item.quantity ?? 0);
            totalSales += saleAmount;

            const orderDate = orders.find(o => o.id === item.order_id)?.created_at;
            if (orderDate) {
              const dateKey = new Date(orderDate).toISOString().split('T')[0];
              salesByDayMap.set(dateKey, (salesByDayMap.get(dateKey) || 0) + saleAmount);
            }
          }
        }
      });
      
      const salesData = generateSalesData(salesByDayMap);

      const sortedProducts = (products || [])
        .filter(p => (p.quantity ?? 0) > 0)
        .sort((a, b) => (b.quantity ?? 0) - (a.quantity ?? 0))
        .slice(0, 4)
        .map((p) => ({
          name: p.name,
          sales: p.quantity ?? 0,
          revenue: ((p.price ?? 0) * (p.quantity ?? 0)).toFixed(2), // Format potential revenue
        }));
      
      setStats({
        totalSales,
        totalOrders,
        totalProducts,
        lowStockItems,
        pendingOrders: pendingOrdersCount,
      });

      setTopProducts(sortedProducts);
      setSalesData(salesData);
      setLowStockProducts(lowStockProductsArr);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const generateSalesData = (salesByDayMap) => {
    const last7Days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const sales = salesByDayMap.get(dateStr) || 0;

      last7Days.push({
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        sales: sales,
      });
    }
    return last7Days;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center p-8 bg-white rounded-lg shadow-xl">
          <div className="text-red-600 mb-4">
            <AlertTriangle className="h-16 w-16 mx-auto mb-2" />
            <h2 className="text-2xl font-bold">Error Loading Dashboard</h2>
          </div>
          <p className="text-gray-600 mb-6 max-w-sm">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors duration-200"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Sales',
      value: `₹${stats.totalSales.toLocaleString('en-IN')}`,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Total Orders',
      value: stats.totalOrders.toString(),
      icon: ShoppingCart,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Products',
      value: stats.totalProducts.toString(),
      icon: Package,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Low Stock Items',
      value: stats.lowStockItems.toString(),
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      urgent: stats.lowStockItems > 0,
      onClick: () => stats.lowStockItems > 0 && setShowLowStockDetails((prev) => !prev),
    },
  ];

  return (
    <div className="p-4 sm:p-8 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Your summary for the last 7 days.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={index}
              className={`bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow duration-300 ${
                card.onClick ? 'cursor-pointer' : ''
              }`}
              onClick={card.onClick}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    {card.title}
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {card.value}
                  </p>
                  {card.urgent && (
                    <p className="text-sm text-red-600 mt-2 font-semibold flex items-center">
                      <Info className="h-4 w-4 mr-1" />
                      Needs attention
                    </p>
                  )}
                  {card.info && (
                    <p className="text-xs text-gray-500 mt-2 flex items-center">
                      <Info className="h-3 w-3 mr-1" />
                      {card.info}
                    </p>
                  )}
                </div>
                <div className={`${card.bgColor} p-3 rounded-full flex-shrink-0`}>
                  <Icon className={`h-6 w-6 ${card.color}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showLowStockDetails && lowStockProducts.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-200">
          <h3 className="text-xl font-semibold text-red-600 mb-4 flex items-center">
            <AlertTriangle className="h-6 w-6 mr-2" />
            Low Stock Products
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {lowStockProducts.map((product) => (
              <div
                key={product.id}
                className="bg-gray-50 border border-red-200 rounded-lg p-4 transition-shadow duration-200 hover:shadow-md"
              >
                <h4 className="font-bold text-gray-900">
                  {product.name}
                </h4>
                <p className="text-sm text-gray-600">
                  Quantity Left: <span className="font-semibold text-red-500">{product.quantity}</span>
                </p>
                <p className="text-sm text-gray-600">
                  Price: ₹{product.price?.toLocaleString('en-IN') || '0'}
                </p>
                <p className="text-xs text-red-500 mt-2">
                  Threshold: {product.low_stock_threshold}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
 
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">
              Sales Overview
            </h3>
            <div className="flex items-center text-sm text-gray-600">
              <Eye className="h-4 w-4 mr-1" />
              Last 7 days
            </div>
          </div>
          <div className="flex-1 flex items-center">
            {salesData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={salesData} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Sales']}
                    labelFormatter={(label) => `Day: ${label}`}
                    labelStyle={{ fontWeight: 'bold' }}
                    contentStyle={{
                      borderRadius: '8px',
                      borderColor: '#E5E7EB',
                      backgroundColor: '#FFFFFF',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                    }}
                    itemStyle={{ color: '#4B5563' }}
                  />
                  <Bar dataKey="sales" fill="#60A5FA" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-gray-500 w-full">
                <p>No sales data available for the last 7 days.</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 flex flex-col">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">
            Top Products by Stock
          </h3>
          <div className="flex-1 space-y-4">
            {topProducts.length > 0 ? (
              topProducts.map((product, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100"
                >
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                      <span className="text-blue-600 font-bold text-sm">
                        {index + 1}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {product.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {product.sales} units in stock
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-gray-900">
                      ₹{parseFloat(product.revenue).toLocaleString('en-IN')}
                    </p>
                    <p className="text-sm text-gray-600">Potential Revenue</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No products with stock found</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
