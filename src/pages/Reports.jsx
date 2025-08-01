import React, { useState, useEffect } from 'react';
import supabase from '../lib/supabase';
import { Download, Calendar } from 'lucide-react';

const Reports = () => {
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

 
  useEffect(() => {
    console.log('Date range updated:', dateRange);
  }, [dateRange]);

  const exportToCSV = async () => {
    setLoading(true);
    try {
     
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select(`
          id,
          customer_name,
          customer_contact,
          created_at,
          status,
          order_items (
            quantity,
            products (
              name,
              price
            )
          )
        `)
        .gte('created_at', dateRange.startDate)
        .lte('created_at', dateRange.endDate + 'T23:59:59');

      if (ordersError) throw ordersError;

      // Prepare CSV data
      const csvData = [];
      csvData.push(['Order ID', 'Customer Name', 'Contact', 'Status', 'Date', 'Product', 'Quantity', 'Unit Price', 'Total Price']);

      orders.forEach(order => {
        const orderDate = new Date(order.created_at).toLocaleDateString();
        // Calculate total for the order
        let orderTotal = 0;
        
        if (order.order_items && order.order_items.length > 0) {
          order.order_items.forEach(item => {
            const productName = item.products?.name || 'Unknown';
            const unitPrice = item.products?.price || 0;
            const totalPrice = (unitPrice * item.quantity).toFixed(2);
            orderTotal += parseFloat(totalPrice);

            csvData.push([
              order.id,
              order.customer_name,
              order.customer_contact,
              order.status,
              orderDate,
              productName,
              item.quantity,
              unitPrice.toFixed(2),
              totalPrice
            ]);
          });
        } else {
          // If an order has no items, still include it in the report
          csvData.push([
            order.id,
            order.customer_name,
            order.customer_contact,
            order.status,
            orderDate,
            'No Items',
            0,
            0,
            0
          ]);
        }
      });

      // Convert to CSV string
      const csvContent = csvData
        .map(row =>
          row
            .map(cell => `"${String(cell).replace(/"/g, '""')}"`)
            .join(',')
        )
        .join('\n');
      
      // Create and download the file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sales-report-${dateRange.startDate}-to-${dateRange.endDate}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Error exporting CSV:', error);
      alert('Error exporting CSV. Please check the console for details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Sales Reports</h1>
            <p className="text-gray-600 mt-2">Generate and export sales data as a CSV file</p>
          </div>
          <button
            onClick={exportToCSV}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center transition-colors duration-200"
            disabled={loading}
          >
            <Download className="h-5 w-5 mr-2" />
            {loading ? 'Generating...' : 'Export CSV'}
          </button>
        </div>

        {/* Date Range Selector */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center space-x-4">
            <Calendar className="h-5 w-5 text-gray-400" />
            <span className="font-medium text-gray-700">Date Range:</span>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;