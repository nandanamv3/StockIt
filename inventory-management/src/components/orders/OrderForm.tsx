import React, { useState, useEffect } from 'react';
import { supabase, Product } from '../../config/supabase';
import { XMarkIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

interface OrderFormProps {
  onClose: () => void;
}

interface OrderItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export const OrderForm: React.FC<OrderFormProps> = ({ onClose }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [customerInfo, setCustomerInfo] = useState({
    customer_name: '',
    customer_contact: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .gt('quantity', 0)
        .order('name');

      if (error) throw error;

      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const addOrderItem = () => {
    setOrderItems([...orderItems, {
      product_id: '',
      product_name: '',
      quantity: 1,
      unit_price: 0,
      subtotal: 0,
    }]);
  };

  const removeOrderItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const updateOrderItem = (index: number, field: string, value: any) => {
    const updatedItems = [...orderItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };

    if (field === 'product_id') {
      const selectedProduct = products.find(p => p.id === value);
      if (selectedProduct) {
        updatedItems[index].product_name = selectedProduct.name;
        updatedItems[index].unit_price = Number(selectedProduct.price);
        updatedItems[index].subtotal = updatedItems[index].quantity * Number(selectedProduct.price);
      }
    } else if (field === 'quantity') {
      updatedItems[index].subtotal = Number(value) * updatedItems[index].unit_price;
    }

    setOrderItems(updatedItems);
  };

  const calculateTotal = () => {
    return orderItems.reduce((total, item) => total + item.subtotal, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (orderItems.length === 0) {
      setError('Please add at least one item to the order');
      setLoading(false);
      return;
    }

    try {
      const totalAmount = calculateTotal();

      // Create order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([{
          ...customerInfo,
          total_amount: totalAmount,
          status: 'pending',
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItemsData = orderItems.map(item => ({
        order_id: orderData.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item.subtotal,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItemsData);

      if (itemsError) throw itemsError;

      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-medium text-gray-900">Create New Order</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Customer Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-md font-medium text-gray-900 mb-4">Customer Information</h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="customer_name" className="block text-sm font-medium text-gray-700">
                  Customer Name
                </label>
                <input
                  type="text"
                  name="customer_name"
                  id="customer_name"
                  value={customerInfo.customer_name}
                  onChange={(e) => setCustomerInfo({...customerInfo, customer_name: e.target.value})}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label htmlFor="customer_contact" className="block text-sm font-medium text-gray-700">
                  Contact Information
                </label>
                <input
                  type="text"
                  name="customer_contact"
                  id="customer_contact"
                  value={customerInfo.customer_contact}
                  onChange={(e) => setCustomerInfo({...customerInfo, customer_contact: e.target.value})}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-md font-medium text-gray-900">Order Items</h4>
              <button
                type="button"
                onClick={addOrderItem}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
              >
                <PlusIcon className="h-4 w-4 mr-1" />
                Add Item
              </button>
            </div>

            <div className="space-y-4">
              {orderItems.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-4 items-end p-4 border border-gray-200 rounded-lg">
                  <div className="col-span-4">
                    <label className="block text-sm font-medium text-gray-700">Product</label>
                    <select
                      value={item.product_id}
                      onChange={(e) => updateOrderItem(index, 'product_id', e.target.value)}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    >
                      <option value="">Select a product</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name} (Stock: {product.quantity})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateOrderItem(index, 'quantity', Number(e.target.value))}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Unit Price</label>
                    <input
                      type="number"
                      step="0.01"
                      value={item.unit_price}
                      readOnly
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm bg-gray-50"
                    />
                  </div>
                  <div className="col-span-3">
                    <label className="block text-sm font-medium text-gray-700">Subtotal</label>
                    <input
                      type="number"
                      step="0.01"
                      value={item.subtotal.toFixed(2)}
                      readOnly
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm bg-gray-50"
                    />
                  </div>
                  <div className="col-span-1">
                    <button
                      type="button"
                      onClick={() => removeOrderItem(index)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {orderItems.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No items added. Click "Add Item" to start building the order.
              </div>
            )}
          </div>

          {/* Order Total */}
          {orderItems.length > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium text-gray-900">Total Amount:</span>
                <span className="text-xl font-bold text-indigo-600">
                  ${calculateTotal().toFixed(2)}
                </span>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || orderItems.length === 0}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm bg-indigo-600 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};