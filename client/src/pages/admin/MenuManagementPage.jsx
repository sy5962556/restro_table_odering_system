import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Plus, Edit2, Trash2, ToggleLeft, ToggleRight, Sparkles, ChevronDown, ChevronUp, Search, Filter } from 'lucide-react';
import api from '../../services/api';
import AdminSidebar from '../../components/admin/AdminSidebar';
import AdminTopNav from '../../components/admin/AdminTopNav';

const FOOD_TYPES = ['Veg', 'Non-Veg', 'Vegan', 'Egg'];
const SPICE_LEVELS = ['Mild', 'Medium', 'Hot', 'Extra Hot'];

function CategoryCard({ category, onEdit, onDelete, onToggle }) {
  return (
    <div className="flex items-center justify-between p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{category.icon || '🍽️'}</span>
        <div>
          <p className="font-extrabold text-xs text-slate-900 dark:text-white">{category.name}</p>
          <p className="text-[10px] text-slate-400">{category.itemCount || 0} items</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={() => onToggle(category._id, !category.isActive)} className="text-slate-400 hover:text-brand-500 transition-colors">
          {category.isActive ? <ToggleRight className="w-5 h-5 text-emerald-500" /> : <ToggleLeft className="w-5 h-5" />}
        </button>
        <button onClick={() => onEdit(category)} className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <Edit2 className="w-3.5 h-3.5 text-blue-500" />
        </button>
        <button onClick={() => onDelete(category._id)} className="p-1.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors">
          <Trash2 className="w-3.5 h-3.5 text-rose-500" />
        </button>
      </div>
    </div>
  );
}

function MenuItemCard({ item, onEdit, onDelete, onToggle }) {
  return (
    <div className={`bg-white dark:bg-slate-900 rounded-2xl border ${item.isAvailable ? 'border-slate-200 dark:border-slate-800' : 'border-rose-200 dark:border-rose-900 opacity-60'} shadow-xs overflow-hidden`}>
      {item.imageUrl && (
        <div className="h-32 overflow-hidden">
          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="p-3.5 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-1.5">
              <span className={`w-3 h-3 rounded-sm border-2 ${item.foodType === 'Veg' || item.foodType === 'Vegan' ? 'border-emerald-600' : 'border-rose-600'} flex items-center justify-center`}>
                <span className={`w-1.5 h-1.5 rounded-full ${item.foodType === 'Veg' || item.foodType === 'Vegan' ? 'bg-emerald-600' : 'bg-rose-600'}`} />
              </span>
              <p className="font-extrabold text-xs text-slate-900 dark:text-white line-clamp-1">{item.name}</p>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">{item.categoryName}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="font-black text-sm text-brand-600 dark:text-brand-400">₹{item.price}</p>
            {item.discountedPrice && item.discountedPrice < item.price && (
              <p className="text-[10px] line-through text-slate-400">₹{item.price}</p>
            )}
          </div>
        </div>

        <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2">{item.description}</p>

        <div className="flex gap-1.5">
          <button onClick={() => onToggle(item._id, !item.isAvailable)}
            className={`flex-1 py-1.5 rounded-xl text-[10px] font-black uppercase transition-colors ${item.isAvailable ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100' : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 hover:bg-rose-100'}`}
          >
            {item.isAvailable ? '✓ Available' : '✗ Out of Stock'}
          </button>
          <button onClick={() => onEdit(item)} className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 transition-colors">
            <Edit2 className="w-3.5 h-3.5 text-blue-600" />
          </button>
          <button onClick={() => onDelete(item._id)} className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 transition-colors">
            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
          </button>
        </div>
      </div>
    </div>
  );
}

function ItemFormModal({ item, categories, onClose, onSave }) {
  const isEdit = !!item?._id;
  const [form, setForm] = useState({
    name: item?.name || '',
    description: item?.description || '',
    categoryId: item?.categoryId?._id || item?.categoryId || '',
    price: item?.price || '',
    discountedPrice: item?.discountedPrice || '',
    foodType: item?.foodType || 'Veg',
    spiceLevel: item?.spiceLevel || 'Medium',
    prepTime: item?.prepTime || 15,
    calories: item?.calories || '',
    imageUrl: item?.imageUrl || '',
    isAvailable: item?.isAvailable !== false,
    isFeatured: item?.isFeatured || false,
    allergens: (item?.allergens || []).join(', '),
  });
  const [aiLoading, setAiLoading] = useState(false);

  const generateDescription = async () => {
    setAiLoading(true);
    try {
      const res = await api.post('/menu/ai-description', { name: form.name, foodType: form.foodType });
      if (res.data.description) setForm(prev => ({ ...prev, description: res.data.description }));
    } catch (err) {
      console.error('AI description error:', err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...form,
      allergens: form.allergens.split(',').map(a => a.trim()).filter(Boolean),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h2 className="font-black text-sm text-slate-900 dark:text-white">{isEdit ? 'Edit Menu Item' : 'Add New Menu Item'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">Dish Name*</label>
              <input required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Butter Chicken" className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">Category*</label>
              <select required value={form.categoryId} onChange={e => setForm(p => ({ ...p, categoryId: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500">
                <option value="">Select…</option>
                {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">Food Type*</label>
              <select value={form.foodType} onChange={e => setForm(p => ({ ...p, foodType: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500">
                {FOOD_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">Price (₹)*</label>
              <input required type="number" min="0" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} placeholder="350" className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">Discounted Price (₹)</label>
              <input type="number" min="0" value={form.discountedPrice} onChange={e => setForm(p => ({ ...p, discountedPrice: e.target.value }))} placeholder="299" className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Description</label>
              <button type="button" onClick={generateDescription} disabled={!form.name || aiLoading}
                className="flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400 hover:underline disabled:opacity-40">
                <Sparkles className="w-3 h-3" /> {aiLoading ? 'Generating…' : 'AI Generate'}
              </button>
            </div>
            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} placeholder="Describe the dish…" className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">Spice Level</label>
              <select value={form.spiceLevel} onChange={e => setForm(p => ({ ...p, spiceLevel: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500">
                {SPICE_LEVELS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">Prep Time (min)</label>
              <input type="number" min="1" value={form.prepTime} onChange={e => setForm(p => ({ ...p, prepTime: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">Calories</label>
              <input type="number" min="0" value={form.calories} onChange={e => setForm(p => ({ ...p, calories: e.target.value }))} placeholder="450" className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">Image URL</label>
            <input type="url" value={form.imageUrl} onChange={e => setForm(p => ({ ...p, imageUrl: e.target.value }))} placeholder="https://…" className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">Allergens (comma separated)</label>
            <input value={form.allergens} onChange={e => setForm(p => ({ ...p, allergens: e.target.value }))} placeholder="Gluten, Nuts, Dairy…" className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
              <input type="checkbox" checked={form.isAvailable} onChange={e => setForm(p => ({ ...p, isAvailable: e.target.checked }))} className="w-4 h-4 rounded accent-brand-500" />
              Available
            </label>
            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
              <input type="checkbox" checked={form.isFeatured} onChange={e => setForm(p => ({ ...p, isFeatured: e.target.checked }))} className="w-4 h-4 rounded accent-amber-500" />
              Featured / Chef's Special
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              Cancel
            </button>
            <button type="submit" className="flex-1 py-2.5 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-black uppercase tracking-wide transition-colors">
              {isEdit ? 'Save Changes' : 'Add to Menu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export const MenuManagementPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tab, setTab] = useState('items');
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [editingItem, setEditingItem] = useState(null);
  const [showItemForm, setShowItemForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [categoryForm, setCategoryForm] = useState({ name: '', icon: '🍽️' });

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [catRes, itemRes] = await Promise.all([
        api.get('/menu/categories'),
        api.get('/menu/items?all=true'),
      ]);
      if (catRes.data.success) setCategories(catRes.data.categories || []);
      if (itemRes.data.success) setMenuItems(itemRes.data.items || []);
    } catch (err) {
      console.error('Error fetching menu:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = !search || item.name.toLowerCase().includes(search.toLowerCase());
    const matchesCat = filterCategory === 'all' || item.categoryId?._id === filterCategory || item.categoryId === filterCategory;
    return matchesSearch && matchesCat;
  });

  const handleSaveItem = async (data) => {
    try {
      if (editingItem?._id) {
        await api.put(`/menu/items/${editingItem._id}`, data);
      } else {
        await api.post('/menu/items', data);
      }
      setShowItemForm(false);
      setEditingItem(null);
      fetchAll();
    } catch (err) {
      alert(err?.response?.data?.message || 'Error saving item');
    }
  };

  const handleDeleteItem = async (id) => {
    if (!window.confirm('Delete this menu item?')) return;
    await api.delete(`/menu/items/${id}`);
    fetchAll();
  };

  const handleToggleItem = async (id, val) => {
    await api.patch(`/menu/items/${id}/availability`, { isAvailable: val });
    fetchAll();
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    try {
      if (editingCategory?._id) {
        await api.put(`/menu/categories/${editingCategory._id}`, categoryForm);
      } else {
        await api.post('/menu/categories', categoryForm);
      }
      setShowCategoryForm(false);
      setEditingCategory(null);
      setCategoryForm({ name: '', icon: '🍽️' });
      fetchAll();
    } catch (err) {
      alert(err?.response?.data?.message || 'Error saving category');
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Delete this category? All items will be uncategorized.')) return;
    await api.delete(`/menu/categories/${id}`);
    fetchAll();
  };

  const handleToggleCategory = async (id, val) => {
    await api.patch(`/menu/categories/${id}`, { isActive: val });
    fetchAll();
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex text-slate-900 dark:text-slate-100">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {showItemForm && (
        <ItemFormModal
          item={editingItem}
          categories={categories}
          onClose={() => { setShowItemForm(false); setEditingItem(null); }}
          onSave={handleSaveItem}
        />
      )}

      {showCategoryForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <h2 className="font-black text-sm text-slate-900 dark:text-white">{editingCategory ? 'Edit Category' : 'Add Category'}</h2>
            <form onSubmit={handleSaveCategory} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Category Name</label>
                <input required value={categoryForm.name} onChange={e => setCategoryForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Biryani & Rice" className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Icon (emoji)</label>
                <input value={categoryForm.icon} onChange={e => setCategoryForm(p => ({ ...p, icon: e.target.value }))} placeholder="🍛" className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => { setShowCategoryForm(false); setEditingCategory(null); }} className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-brand-500 text-white text-xs font-black uppercase transition-colors">{editingCategory ? 'Save' : 'Add Category'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="flex-1 lg:ml-64 flex flex-col min-w-0">
        <AdminTopNav onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} title="Menu Management" />

        <div className="px-4 sm:px-6 py-4 space-y-5 flex-1 overflow-y-auto">
          {/* Tabs */}
          <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800">
            {['items', 'categories'].map(t => (
              <button key={t} onClick={() => setTab(t)} className={`pb-3 text-xs font-black uppercase tracking-wider border-b-2 transition-colors ${tab === t ? 'border-brand-500 text-brand-600 dark:text-brand-400' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                {t === 'items' ? `Menu Items (${menuItems.length})` : `Categories (${categories.length})`}
              </button>
            ))}
          </div>

          {tab === 'items' && (
            <>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="relative flex-1 min-w-48">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search dishes…" className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
                <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="px-3 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500">
                  <option value="all">All Categories</option>
                  {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
                <button onClick={() => { setEditingItem(null); setShowItemForm(true); }} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-black uppercase tracking-wide transition-colors">
                  <Plus className="w-4 h-4" /> Add Dish
                </button>
              </div>

              {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {[...Array(8)].map((_, i) => <div key={i} className="h-48 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />)}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredItems.map(item => (
                    <MenuItemCard
                      key={item._id}
                      item={item}
                      onEdit={(i) => { setEditingItem(i); setShowItemForm(true); }}
                      onDelete={handleDeleteItem}
                      onToggle={handleToggleItem}
                    />
                  ))}
                  {filteredItems.length === 0 && <p className="col-span-full text-center py-12 text-slate-400 text-xs">No menu items found.</p>}
                </div>
              )}
            </>
          )}

          {tab === 'categories' && (
            <>
              <div className="flex justify-end">
                <button onClick={() => { setEditingCategory(null); setCategoryForm({ name: '', icon: '🍽️' }); setShowCategoryForm(true); }} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-black uppercase tracking-wide transition-colors">
                  <Plus className="w-4 h-4" /> Add Category
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {categories.map(cat => (
                  <CategoryCard
                    key={cat._id}
                    category={cat}
                    onEdit={(c) => { setEditingCategory(c); setCategoryForm({ name: c.name, icon: c.icon || '🍽️' }); setShowCategoryForm(true); }}
                    onDelete={handleDeleteCategory}
                    onToggle={handleToggleCategory}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MenuManagementPage;
