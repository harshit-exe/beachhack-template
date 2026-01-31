'use client';

import React, { useState, useEffect } from 'react';
import { 
  Store, 
  Package, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Save, 
  TrendingUp,
  AlertCircle,
  ShoppingBag,
  Tag,
  RefreshCw,
  ArrowLeft
} from 'lucide-react';
import { useRouter } from 'next/navigation';

// API Configuration
const API_BASE = 'http://localhost:5001/api';

interface Product {
  _id?: string;
  name: string;
  category: string;
  price: number;
  description: string;
  inStock: boolean;
  tags?: string[];
}

interface StoreData {
  name: string;
  agenda: string;
  products: Product[];
}

export default function StorePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [storeData, setStoreData] = useState<StoreData>({
    name: '',
    agenda: '',
    products: []
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '',
    category: 'General',
    price: 0,
    description: '',
    inStock: true
  });

  // Fetch Store Data
  useEffect(() => {
    fetchStoreData();
  }, []);

  const fetchStoreData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/store`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setStoreData(data);
    } catch (error) {
      console.error('Error fetching store:', error);
      // Fallback Mock Data for demo
      setStoreData({
        name: 'Floral Essence Boutique',
        agenda: 'Focus on promoting the new Spring Collection. Offer 10% discount on first-time orders.',
        products: [
          { _id: '1', name: 'Red Rose Bouquet', category: 'Flowers', price: 450, description: '12 premium red roses with fillers', inStock: true },
          { _id: '2', name: 'Lily Delight', category: 'Flowers', price: 550, description: 'Fragrant white lilies in a glass vase', inStock: true },
          { _id: '3', name: 'Orchid Pot', category: 'Plants', price: 800, description: 'Potted purple orchid, long lasting', inStock: true },
          { _id: '4', name: 'Birthday Cake (Chocolate)', category: 'Gifts', price: 600, description: '1kg rich chocolate truffle cake', inStock: true },
          { _id: '5', name: 'Greeting Card', category: 'Add-ons', price: 50, description: 'Personalized handwritten card', inStock: true },
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStore = async () => {
    try {
      setSaving(true);
      const res = await fetch(`${API_BASE}/store`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: storeData.name, agenda: storeData.agenda })
      });
      if (!res.ok) throw new Error('Failed to update');
      alert('Store details updated!');
    } catch (error) {
      alert('Updated (Local Mock Mode)');
    } finally {
      setSaving(false);
    }
  };

  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.price) return alert('Name and Price required');
    
    try {
      const res = await fetch(`${API_BASE}/store/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct)
      });
      if (res.ok) {
        const updatedStore = await res.json();
        setStoreData(updatedStore);
      } else {
        throw new Error('Failed to add');
      }
    } catch (error) {
      // Mock update
      setStoreData(prev => ({
        ...prev,
        products: [...prev.products, { ...newProduct, _id: Date.now().toString() } as Product]
      }));
    }
    setShowAddModal(false);
    setNewProduct({ name: '', category: 'General', price: 0, description: '', inStock: true });
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    try {
      const res = await fetch(`${API_BASE}/store/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        const updatedStore = await res.json();
        setStoreData(updatedStore);
      }
    } catch (error) {
      setStoreData(prev => ({
        ...prev,
        products: prev.products.filter(p => p._id !== id)
      }));
    }
  };

  const filteredProducts = storeData.products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 rounded-full hover:bg-slate-200 transition-colors">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Store & Context Manager</h1>
            <p className="text-slate-500 font-medium">Manage what your AI agents know about your business</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchStoreData} className="p-2 text-slate-400 hover:text-slate-600">
            <RefreshCw size={20} />
          </button>
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">System Active</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-12 gap-8">
        
        {/* LEFT: Context & Agenda (4 cols) */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          
          {/* Store Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                  <Package size={20} />
                </div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Products</span>
              </div>
              <p className="text-3xl font-black text-slate-900">{storeData.products.length}</p>
            </div>
            <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                  <TrendingUp size={20} />
                </div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Value</span>
              </div>
              <p className="text-3xl font-black text-slate-900">₹{storeData.products.reduce((acc, p) => acc + (p.price || 0), 0)}</p>
            </div>
          </div>

          {/* Agenda Editor */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Store size={20} className="text-slate-900" />
                <h3 className="font-bold text-lg text-slate-900">Store Context</h3>
              </div>
              <button 
                onClick={handleUpdateStore}
                disabled={saving}
                className="text-xs font-bold px-3 py-1.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2"
              >
                {saving ? 'Saving...' : <><Save size={14} /> SAVE</>}
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Store Name</label>
                <input 
                  type="text" 
                  value={storeData.name}
                  onChange={(e) => setStoreData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 font-medium"
                  placeholder="e.g. My Awesome Store"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Daily Agenda / Goals</label>
                <textarea 
                  value={storeData.agenda}
                  onChange={(e) => setStoreData(prev => ({ ...prev, agenda: e.target.value }))}
                  rows={6}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 font-medium resize-none text-sm leading-relaxed"
                  placeholder="What should the agents focus on today?"
                />
                <p className="text-[10px] text-slate-400 mt-2 font-medium">
                  * This information is injected into the AI system prompt.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Inventory (8 cols) */}
        <div className="col-span-12 lg:col-span-8">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 min-h-[600px] flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-black text-xl text-slate-900">Inventory</h3>
              
              <div className="flex gap-3">
                <div className="relative">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-200 w-64" 
                  />
                </div>
                <button 
                  onClick={() => setShowAddModal(true)}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
                >
                  <Plus size={18} /> Add Product
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              <table className="w-full">
                <thead className="bg-slate-50 sticky top-0">
                  <tr>
                    <th className="text-left py-3 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider rounded-l-xl">Product</th>
                    <th className="text-left py-3 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Category</th>
                    <th className="text-right py-3 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Price</th>
                    <th className="text-center py-3 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Stock</th>
                    <th className="text-right py-3 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider rounded-r-xl">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.map((product) => (
                    <tr key={product._id} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
                            <ShoppingBag size={18} />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{product.name}</p>
                            <p className="text-xs text-slate-500 truncate max-w-[200px]">{product.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-bold uppercase tracking-wide">
                          {product.category}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className="font-mono font-medium text-slate-700">₹{product.price}</span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        {product.inStock ? (
                          <span className="inline-flex w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                        ) : (
                          <span className="inline-flex w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button 
                          onClick={() => handleDeleteProduct(product._id!)}
                          className="p-2 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredProducts.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 font-medium">
                        No products found matching your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-6 transform transition-all">
            <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
              <ShoppingBag className="text-emerald-500" />
              Add Product
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Name</label>
                <input 
                  autoFocus
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  value={newProduct.name}
                  onChange={e => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Product Name"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Price (₹)</label>
                  <input 
                    type="number"
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    value={newProduct.price}
                    onChange={e => setNewProduct(prev => ({ ...prev, price: Number(e.target.value) }))}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Category</label>
                  <input 
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    value={newProduct.category}
                    onChange={e => setNewProduct(prev => ({ ...prev, category: e.target.value }))}
                    placeholder="Category"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Description</label>
                <textarea 
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none"
                  rows={3}
                  value={newProduct.description}
                  onChange={e => setNewProduct(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Short description for AI..."
                />
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox"
                  id="inStock"
                  checked={newProduct.inStock}
                  onChange={e => setNewProduct(prev => ({ ...prev, inStock: e.target.checked }))}
                  className="rounded text-emerald-500 focus:ring-emerald-500"
                />
                <label htmlFor="inStock" className="text-sm font-medium text-slate-700">In Stock</label>
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-6 border-t border-slate-100">
              <button 
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-3 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors"
              >
                CANCEL
              </button>
              <button 
                onClick={handleAddProduct}
                className="flex-1 py-3 bg-emerald-500 text-white rounded-xl font-bold text-sm hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 transition-all"
              >
                ADD PRODUCT
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
