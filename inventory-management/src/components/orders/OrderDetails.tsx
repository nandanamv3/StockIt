import React, { useEffect, useState } from 'react';
import { supabase, Order, OrderItem } from '../../config/supabase';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface OrderDetailsProps {
  order: Order;
  onClose: () => void;
}

export const OrderDetails: React.FC<OrderDetailsProps> = ({ order, onClose }) => {
  const [orderItems, setOrderItems] = useState<(OrderItem & { product?: any })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrderItems();
  }, [order.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchOrderItems = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('order_items')
        .select(`
          *,
          product:products(name, sku, category)
        `)
        .eq('order_id', order.id);

      if (error) throw error;

      setOrderItems(data || []);
    } catch (error) {
      console.error('Error fetching order items:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-medium text-gray-900">Order Details</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Order Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-md font-medium text-gray-900 mb-4">Order Information</h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Order ID</label>
                <p className="mt-1 text-sm text-gray-900">{order.id}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Order Date</label>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(order.order_date).toLocaleDateString()}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                  {order.status}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Customer Name</label>
                <p className="mt-1 text-sm text-gray-900">{order.customer_name || 'Anonymous'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Contact Information</label>
                <p className="mt-1 text-sm text-gray-900">{order.customer_contact || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Total Amount</label>
                <p className="mt-1 text-lg font-semibold text-indigo-600">
                  ${Number(order.total_amount).toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-4">Order Items</h4>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : (
              <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        SKU
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Unit Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Subtotal
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {orderItems.map((item) => (
                      <tr key={item.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {item.product?.name || 'Unknown Product'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {item.product?.category || 'N/A'}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.product?.sku || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${Number(item.unit_price).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          ${Number(item.subtotal).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-lg font-medium text-gray-900">Order Total:</span>
              <span className="text-xl font-bold text-indigo-600">
                ${Number(order.total_amount).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};