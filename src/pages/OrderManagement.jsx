import React, { useState, useEffect } from 'react';
import supabase from '../lib/supabase';

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState('');
  const [userId, setUserId] = useState(null);
  const [user, setUser] = useState(null);
  const [newOrder, setNewOrder] = useState({
    customer_name: '',
    customer_contact: '',
    items: [{ product_id: '', quantity: 1 }]
  });

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage(null);
        setMessageType('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  useEffect(() => {
    async function getSession() {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setUserId(session?.user?.id ?? null);
    }
    getSession();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setUserId(session?.user?.id ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchOrders();
      fetchProducts();
    } else {
      setOrders([]);
    }
  }, [userId]);

  const displayMessage = (msg, type) => {
    setMessage(msg);
    setMessageType(type);
  };

  const fetchOrders = async () => {
    setLoading(true);
    if (!userId) {
      setOrders([]);
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (id, name, price, sku)
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      displayMessage('Error fetching orders: ' + error.message, 'error');
    }
    setLoading(false);
  };

  const fetchProducts = async () => {
    try {
      if (!userId) {
        setProducts([]);
        return;
      }
      const { data, error } = await supabase
        .from('products')
        .select('id, name, price, quantity, sku')
        .eq('user_id', userId)
        .gt('quantity', 0);
      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      displayMessage('Error fetching products: ' + error.message, 'error');
    }
  };

  const logInventoryChange = async (productId, changeType, quantity, productName, productSku) => {
    console.log(`[logInventoryChange] Attempting to log inventory change for product ${productName} (SKU: ${productSku})...`);
    const { error } = await supabase
      .from('inventory_logs')
      .insert({
        product_id: productId,
        user_id: userId,
        change_type: changeType,
        quantity_changed: quantity,
        product_name: productName,
        SKU: productSku
      });
    if (error) {
      console.error('[logInventoryChange] Error logging inventory change:', error);
      displayMessage('Failed to log inventory change: ' + error.message, 'error');
      return false;
    }
    console.log('[logInventoryChange] Inventory change logged successfully.');
    return true;
  };

  const createOrder = async () => {
    if (!newOrder.customer_name || newOrder.items.some(item => !item.product_id || item.quantity <= 0)) {
      displayMessage('Please fill all required fields and ensure item quantities are positive.', 'error');
      return;
    }
    
    for (const item of newOrder.items) {
      const product = products.find(p => p.id === item.product_id);
      if (product && product.quantity < item.quantity) {
        displayMessage(`Not enough stock for product: ${product.name}. Available: ${product.quantity}`, 'error');
        return;
      }
    }

    setLoading(true);
    try {
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: userId,
          customer_name: newOrder.customer_name,
          customer_contact: newOrder.customer_contact,
          status: 'pending',
          order_date: new Date().toISOString()
        })
        .select()
        .single();
      if (orderError) throw orderError;

      const orderItemsToInsert = newOrder.items.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: products.find(p => p.id === item.product_id)?.price || 0
      }));
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItemsToInsert);
      if (itemsError) throw itemsError;

      for (const item of newOrder.items) {
        const product = products.find(p => p.id === item.product_id);
        if (product) {
          const newQuantity = product.quantity - item.quantity;
          console.log(`[createOrder] Attempting to update product quantity for ${product.name} from ${product.quantity} to ${newQuantity}...`);
          const { data, error: updateProductError } = await supabase
            .from('products')
            .update({ quantity: newQuantity })
            .eq('id', item.product_id)
            .eq('user_id', userId)
            .select();
          if (updateProductError) {
            console.error(`[createOrder] Error updating product quantity for ${product.name}:`, updateProductError);
            displayMessage(`Error updating product quantity for ${product.name}: ` + updateProductError.message, 'error');
          } else if (data && data.length === 0) {
            console.warn(`[createOrder] Update query for product ${product.id} affected 0 rows. Check if product ID and user ID are correct.`);
            displayMessage(`Warning: Update for product ${product.name} did not find a matching row.`, 'error');
          } else {
            console.log(`[createOrder] Product ${product.name} quantity updated successfully.`);
          }
        }
      }

      displayMessage('Order created successfully!', 'success');
      setNewOrder({
        customer_name: '',
        customer_contact: '',
        items: [{ product_id: '', quantity: 1 }]
      });
      setShowForm(false);
      fetchOrders();
      fetchProducts();
    } catch (error) {
      console.error('Error creating order:', error);
      displayMessage('Error creating order: ' + error.message, 'error');
    }
    setLoading(false);
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    setLoading(true);
    try {
      const orderToUpdate = orders.find(o => o.id === orderId);
      if (!orderToUpdate) {
        throw new Error('Order not found.');
      }
      const oldStatus = orderToUpdate.status;

      console.log(`[updateOrderStatus] Updating order ${orderId} status from ${oldStatus} to ${newStatus}...`);
      const { data: updatedOrder, error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId)
        .eq('user_id', userId)
        .select();
      if (error) throw error;
      if (updatedOrder && updatedOrder.length === 0) {
        console.warn(`[updateOrderStatus] Update query for order ${orderId} affected 0 rows.`);
        displayMessage('Warning: Order status not updated. Check if Order ID is correct.', 'error');
      } else {
        console.log(`[updateOrderStatus] Order status updated successfully.`);
      }

      if (newStatus === 'completed' && oldStatus === 'pending') {
        if (orderToUpdate.order_items) {
          for (const item of orderToUpdate.order_items) {
            await logInventoryChange(item.product_id, 'remove', item.quantity, item.products?.name, item.products?.sku);
          }
        }
      } else if (newStatus === 'cancelled' && oldStatus !== 'cancelled') {
        if (orderToUpdate.order_items) {
          for (const item of orderToUpdate.order_items) {
            await logInventoryChange(item.product_id, 'add', item.quantity, item.products?.name, item.products?.sku);
            
            const productInState = products.find(p => p.id === item.product_id);
            if (productInState) {
              const newQuantity = productInState.quantity + item.quantity;
              console.log(`[updateOrderStatus] Attempting to update product quantity for ${productInState.name} on cancellation...`);
              console.log(`[updateOrderStatus] Update payload: { quantity: ${newQuantity} }`);
              console.log(`[updateOrderStatus] Filters: { id: ${item.product_id}, user_id: ${userId} }`);

              const { data, error: updateProductError } = await supabase
                .from('products')
                .update({ quantity: newQuantity })
                .eq('id', item.product_id)
                .eq('user_id', userId)
                .select();
              
              if (updateProductError) {
                console.error('[updateOrderStatus] Final error on product update:', updateProductError);
                displayMessage('Product update failed: ' + updateProductError.message, 'error');
              } else if (data && data.length > 0) {
                console.log(`[updateOrderStatus] SUCCESS: Product ${productInState.name} quantity updated in DB.`);
              } else {
                console.warn(`[updateOrderStatus] WARNING: Product update query affected 0 rows. Check filters again.`);
              }
            }
          }
        }
      }

      displayMessage('Order status updated successfully!', 'success');
      fetchOrders();
    } catch (error) {
      console.error('Error updating status:', error);
      displayMessage('Error updating status: ' + error.message, 'error');
    }
    setLoading(false);
  };

  const deleteOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to delete this order?')) {
      return;
    }
    setLoading(true);
    try {
      const orderToDelete = orders.find(o => o.id === orderId);
      
      console.log(`[deleteOrder] Deleting order items for order ${orderId}...`);
      const { error: deleteItemsError } = await supabase.from('order_items').delete().eq('order_id', orderId);
      if (deleteItemsError) throw deleteItemsError;
      console.log('[deleteOrder] Order items deleted successfully.');
      
      console.log(`[deleteOrder] Deleting order ${orderId}...`);
      const { error: deleteOrderError } = await supabase.from('orders').delete().eq('id', orderId).eq('user_id', userId);
      if (deleteOrderError) throw deleteOrderError;
      console.log('[deleteOrder] Order deleted successfully.');
      
      if (orderToDelete && orderToDelete.status === 'completed') {
        if (orderToDelete.order_items) {
          for (const item of orderToDelete.order_items) {
            await logInventoryChange(item.product_id, 'add', item.quantity, item.products?.name, item.products?.sku);
            
            const productInState = products.find(p => p.id === item.product_id);
            if (productInState) {
              const newQuantity = productInState.quantity + item.quantity;
              console.log(`[deleteOrder] Attempting to update product quantity for ${productInState.name} on deletion...`);
              console.log(`[deleteOrder] Update payload: { quantity: ${newQuantity} }`);
              console.log(`[deleteOrder] Filters: { id: ${item.product_id}, user_id: ${userId} }`);

              const { data, error: updateProductError } = await supabase
                .from('products')
                .update({ quantity: newQuantity })
                .eq('id', item.product_id)
                .eq('user_id', userId)
                .select();
              if (updateProductError) {
                console.error('[deleteOrder] Error updating product quantity on deletion:', updateProductError);
                displayMessage('Error updating product quantity on deletion: ' + updateProductError.message, 'error');
              } else if (data && data.length > 0) {
                console.log(`[deleteOrder] SUCCESS: Product ${productInState.name} quantity updated in DB.`);
              } else {
                console.warn(`[deleteOrder] WARNING: Update query for product ${item.product_id} affected 0 rows.`);
                displayMessage(`Warning: Update for product ${productInState.name} did not find a matching row.`, 'error');
              }
            }
          }
        }
      }
      
      displayMessage('Order deleted successfully!', 'success');
      fetchOrders();
    } catch (error) {
      console.error('Error deleting order:', error);
      displayMessage('Error deleting order: ' + error.message, 'error');
    }
    setLoading(false);
  };

  const addOrderItem = () => {
    setNewOrder({
      ...newOrder,
      items: [...newOrder.items, { product_id: '', quantity: 1 }]
    });
  };

  const updateOrderItem = (index, field, value) => {
    const updatedItems = [...newOrder.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setNewOrder({ ...newOrder, items: updatedItems });
  };

  const removeOrderItem = (index) => {
    const updatedItems = newOrder.items.filter((_, i) => i !== index);
    setNewOrder({ ...newOrder, items: updatedItems });
  };

  const getOrderTotal = (orderItems) => {
    return orderItems.reduce((total, item) => {
      const itemPrice = item.products?.price || item.price || 0;
      return total + (itemPrice * item.quantity);
    }, 0);
  };

  const filteredOrders = orders.filter(order =>
    order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.id.toString().includes(searchTerm) ||
    order.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.order_items.some(item => item.products?.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (order.user_id && order.user_id.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Order Management</h1>
          <button
            onClick={() => {
              setNewOrder({ customer_name: '', customer_contact: '', items: [{ product_id: '', quantity: 1 }] });
              setShowForm(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75"
            disabled={loading}
          >
            {loading ? 'Processing...' : 'New Order'}
          </button>
        </div>
        {message && (
          <div className={`mb-4 p-3 rounded-lg text-white ${messageType === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
            {message}
          </div>
        )}
        {userId && (
          <div className="mb-4 text-sm text-gray-600">
            Current User ID: <span className="font-mono bg-gray-200 px-2 py-1 rounded break-all">{userId}</span>
          </div>
        )}
        <div className="mb-4 relative">
          <input
            type="text"
            placeholder="Search orders by customer name, ID, status, product, or user ID..."
            className="w-full pl-4 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700 placeholder-gray-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-search text-gray-500">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
            </svg>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
          <table className="w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">#{order.id}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{order.customer_name}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{order.customer_contact}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {order.order_items && order.order_items.length > 0 ? (
                      <ul className="list-disc list-inside">
                        {order.order_items.map((item, idx) => (
                          <li key={idx}>
                            {item.products?.name || 'Unknown Product'} (x{item.quantity})
                          </li>
                        ))}
                      </ul>
                    ) : 'No items'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                    ₹{getOrderTotal(order.order_items || []).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <select
                      value={order.status}
                      onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                      className="px-2 py-1 border border-gray-300 rounded-md text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="pending">pending</option>
                      <option value="completed">completed</option>
                      <option value="cancelled">cancelled</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 break-all">{order.user_id}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => deleteOrder(order.id)}
                      className="text-red-600 hover:text-red-900 focus:outline-none"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredOrders.length === 0 && !loading && (
            <div className="text-center py-8 text-gray-500 text-lg">
              No orders found
            </div>
          )}
          {loading && (
            <div className="text-center py-8 text-blue-600 text-lg">
              Loading orders...
            </div>
          )}
        </div>
        {showForm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">Create New Order</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">Customer Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    placeholder="Customer Name"
                    className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-blue-500"
                    value={newOrder.customer_name}
                    onChange={(e) => setNewOrder({...newOrder, customer_name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">Customer Contact</label>
                  <input
                    type="text"
                    placeholder="Customer Contact"
                    className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-blue-500"
                    value={newOrder.customer_contact}
                    onChange={(e) => setNewOrder({...newOrder, customer_contact: e.target.value})}
                  />
                </div>
              </div>
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="font-bold text-gray-800">Order Items</label>
                  <button
                    type="button"
                    onClick={addOrderItem}
                    className="text-blue-600 hover:text-blue-800 text-sm font-semibold transition duration-200"
                  >
                    + Add Item
                  </button>
                </div>
                {newOrder.items.map((item, index) => (
                  <div key={index} className="flex flex-col sm:flex-row gap-2 mb-3 items-end p-3 border border-gray-200 rounded-lg bg-gray-50">
                    <div className="flex-1 w-full">
                      <label className="block text-gray-700 text-xs font-bold mb-1">Product <span className="text-red-500">*</span></label>
                      <select
                        className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-blue-500"
                        value={item.product_id}
                        onChange={(e) => updateOrderItem(index, 'product_id', e.target.value)}
                        required
                      >
                        <option value="">Select Product</option>
                        {products.map(product => (
                          <option key={product.id} value={product.id} disabled={product.quantity <= 0}>
                            {product.name} (SKU: {product.sku}) - ₹{product.price?.toFixed(2)} (Available: {product.quantity})
                          </option>
                        ))}
                      </select>
                  </div>
                  <div className="w-full sm:w-auto">
                      <label className="block text-gray-700 text-xs font-bold mb-1">Quantity <span className="text-red-500">*</span></label>
                      <input
                        type="number"
                        min="1"
                        className="shadow appearance-none border rounded-lg w-full sm:w-24 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-blue-500"
                        value={item.quantity}
                        onChange={(e) => updateOrderItem(index, 'quantity', parseInt(e.target.value) || 1)}
                        required
                      />
                  </div>
                  {newOrder.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeOrderItem(index)}
                        className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-200 mt-2 sm:mt-0"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowForm(false)}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-6 rounded-lg focus:outline-none focus:shadow-outline transition duration-200"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={createOrder}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg focus:outline-none focus:shadow-outline transition duration-200"
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Create Order'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderManagement;