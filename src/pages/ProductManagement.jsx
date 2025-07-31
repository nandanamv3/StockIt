import { useEffect, useState } from 'react';
import supabase from '../lib/supabase';
import { Plus, Search, Edit, Trash2, Package, AlertTriangle, ArrowLeft, Save, Upload } from 'lucide-react';

function Products() {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    id: null,
    name: '',
    sku: '',
    quantity: '',
    price: '',
    category: '',
    image_file: null,
    low_stock_threshold: 5,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  useEffect(() => {
    async function getUserData() {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
    }
    getUserData();
  }, []);

  useEffect(() => {
    async function fetchProducts() {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, sku, quantity, price, category, image_url, low_stock_threshold, created_at');

      if (error) {
        setError(error.message);
      } else {
        setProducts(data);
      }
    }

    fetchProducts();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const logInventoryChange = async (productId, changeType, quantityChanged, productName, sku) => {
    if (quantityChanged === 0) return;
    const { error } = await supabase
      .from('inventory_logs')
      .insert([{
        product_id: productId,
        user_id: user?.id,
        change_type: changeType,
        quantity_changed: quantityChanged,
        SKU: sku || '',
        product_name: productName,
      }]);

    if (error) {
      throw new Error(`Failed to log inventory change: ${error.message}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
        setError("User not found. Please relogin and try again.");
        return;
    }

    const { id, name, sku, quantity, price, category, image_file, low_stock_threshold } = formData;

    if (!name || !quantity || !price) {
      setError('Name, quantity, and price are required.');
      return;
    }

    const parsedQuantity = parseInt(quantity);
    const parsedPrice = parseFloat(price);
    const parsedThreshold = parseInt(low_stock_threshold) || 5;

    if (isNaN(parsedQuantity) || parsedQuantity < 0) {
      setError('Quantity must be a non-negative number.');
      return;
    }
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      setError('Price must be a positive number.');
      return;
    }

    let imageUrl = null;
    if (image_file) {
      const fileName = `${Date.now()}_${image_file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(`public/${fileName}`, image_file, {
          contentType: image_file.type,
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        setError(`Failed to upload image: ${uploadError.message}`);
        return;
      }

      const { data: urlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(`public/${fileName}`);

      imageUrl = urlData.publicUrl;
    }

    try {
      if (isEditing) {
        const { data: currentProduct, error: fetchError } = await supabase
          .from('products')
          .select('quantity, name, sku, image_url')
          .eq('id', id)
          .single();

        if (fetchError) {
          throw new Error(fetchError.message);
        }

        if (image_file && currentProduct.image_url) {
          const oldPath = currentProduct.image_url.split('/').slice(-2).join('/');
          await supabase.storage
            .from('product-images')
            .remove([oldPath]);
        }

        const { error: updateError } = await supabase
          .from('products')
          .update({
            name,
            sku: sku || null,
            quantity: parsedQuantity,
            price: parsedPrice,
            category: category || null,
            image_url: imageUrl || currentProduct.image_url,
            low_stock_threshold: parsedThreshold,
          })
          .eq('id', id);

        if (updateError) {
          throw new Error(updateError.message);
        }

        const quantityDiff = parsedQuantity - currentProduct.quantity;
        if (quantityDiff !== 0) {
          const changeType = quantityDiff > 0 ? 'add' : 'remove';
          await logInventoryChange(id, changeType, Math.abs(quantityDiff), name, sku);
        }

        setProducts((prev) =>
          prev.map((p) => (p.id === id ? { ...p, name, sku, quantity: parsedQuantity, price: parsedPrice, category, image_url: imageUrl || currentProduct.image_url, low_stock_threshold: parsedThreshold } : p))
        );
      } else {
        const { data, error: insertError } = await supabase
          .from('products')
          .insert([{
            name,
            sku: sku || null,
            quantity: parsedQuantity,
            price: parsedPrice,
            category: category || null,
            image_url: imageUrl,
            low_stock_threshold: parsedThreshold,
            user_id: user.id,
          }])
          .select();

        if (insertError) {
          throw new Error(insertError.message);
        }

        if (parsedQuantity > 0) {
          await logInventoryChange(data[0].id, 'add', parsedQuantity, name, sku);
        }

        setProducts((prev) => [...prev, data[0]]);
      }

      resetForm();
      setShowForm(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (product) => {
    setFormData({
      id: product.id,
      name: product.name,
      sku: product.sku || '',
      quantity: product.quantity,
      price: product.price,
      category: product.category || '',
      image_file: null,
      low_stock_threshold: product.low_stock_threshold,
    });
    setIsEditing(true);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product? This will also remove its inventory logs.')) return;

    try {
      const { data: product, error: fetchError } = await supabase
        .from('products')
        .select('image_url')
        .eq('id', id)
        .single();

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      if (product.image_url) {
        const path = product.image_url.split('/').slice(-2).join('/');
        await supabase.storage
          .from('product-images')
          .remove([path]);
      }

      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(error.message);
      }

      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  const resetForm = () => {
    setFormData({
      id: null,
      name: '',
      sku: '',
      quantity: '',
      price: '',
      category: '',
      image_file: null,
      low_stock_threshold: 5,
    });
    setIsEditing(false);
    setError(null);
  };

  const toggleForm = () => {
    setShowForm(true);
    setIsEditing(false);
    resetForm();
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = !selectedCategory || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(products.map(p => p.category).filter(Boolean))];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Product Management</h1>
            <p className="text-gray-600 mt-2">Manage your product inventory</p>
          </div>
          <div className="flex space-x-4">
            <button
              onClick={toggleForm}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center transition-colors duration-200"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add New Product
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-8 flex items-center">
            <span className="text-red-700 text-sm">{error}</span>
            <button onClick={() => setError(null)} className="ml-auto text-red-600 hover:text-red-800">Clear</button>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="flex items-center mb-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="mr-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{isEditing ? 'Edit Product' : 'Add New Product'}</h2>
                  <p className="text-gray-600 mt-1">{isEditing ? 'Update product information' : 'Create a new product for your inventory'}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter product name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">SKU/Code</label>
                  <input
                    type="text"
                    name="sku"
                    value={formData.sku}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter SKU or product code"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                    <input
                      type="number"
                      name="price"
                      required
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={handleInputChange}
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Quantity *</label>
                  <input
                    type="number"
                    name="quantity"
                    required
                    min="0"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter quantity"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <input
                    type="text"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter category"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Low Stock Threshold</label>
                  <input
                    type="number"
                    name="low_stock_threshold"
                    min="0"
                    value={formData.low_stock_threshold}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="5"
                  />
                  <p className="text-xs text-gray-600 mt-1">Alert when stock falls below this number</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Product Image</label>
                <div className="flex items-center space-x-4">
                  <input
                    type="file"
                    name="image_file"
                    accept="image/*"
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {formData.image_file && (
                    <span className="text-sm text-gray-600">{formData.image_file.name}</span>
                  )}
                </div>
                <p className="text-xs text-gray-600 mt-1">Upload an image file (max 5MB)</p>
              </div>
              <div className="flex justify-end space-x-4 pt-6">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center transition-colors duration-200"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isEditing ? 'Update Product' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        )}

        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-600 mb-6">Get started by adding your first product</p>
            <button
              onClick={toggleForm}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium inline-flex items-center transition-colors duration-200"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Product
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => {
              const isLowStock = product.quantity <= (product.low_stock_threshold || 5);

              return (
                <div key={product.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
                  {product.image_url && (
                    <div className="h-48 bg-gray-200">
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">{product.name}</h3>
                        {product.sku && (
                          <p className="text-sm text-gray-600 mb-2">SKU: {product.sku}</p>
                        )}
                        {product.category && (
                          <span className="inline-block bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-medium">
                            {product.category}
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">₹{product.price.toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <span className="text-sm text-gray-600 mr-2">Stock:</span>
                        <span className={`font-medium ${isLowStock ? 'text-red-600' : 'text-green-600'}`}>
                          {product.quantity}
                        </span>
                        {isLowStock && (
                          <AlertTriangle className="h-4 w-4 text-red-500 ml-1" />
                        )}
                      </div>
                    </div>
                    {isLowStock && (
                      <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
                        <div className="flex items-center">
                          <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />
                          <span className="text-red-700 text-sm font-medium">Low Stock Alert</span>
                        </div>
                      </div>
                    )}
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(product)}
                        className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-2 rounded-lg font-medium text-center flex items-center justify-center transition-colors duration-200"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 px-3 py-2 rounded-lg font-medium flex items-center justify-center transition-colors duration-200"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default Products;