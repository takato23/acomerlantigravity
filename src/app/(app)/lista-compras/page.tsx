'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { toast } from "sonner";
import { logger } from '@/services/logger';
import {
  ShoppingCart,
  Plus,
  Search,
  Store,
  Edit2,
  Trash2,
  Package,
  AlertCircle,
  ShoppingBag,
  TrendingDown,
  DollarSign,
  ChevronRight,
  ChevronDown,
  Grid3X3,
  List,
  Apple,
  Carrot,
  Milk,
  Beef,
  Cookie,
  Coffee,
  Wheat,
  CheckCircle2,
  Circle,
  RefreshCw,
  Loader2,
  MessageCircle,
  Share2,
  Smartphone
} from 'lucide-react';

import { GlassCard, GlassButton, GlassInput, GlassModal } from '@/components/ui/GlassCard';
import { cn } from '@/lib/utils';
import { useUser } from '@/store';
import { useShoppingList } from '@/hooks/useShoppingList';
import { PriceSearchComponent } from '@/components/price-scraper/PriceSearchComponent';
import { useEnhancedPriceScraper } from '@/hooks/useEnhancedPriceScraper';
import type { Database } from '@/lib/supabase/database.types';
import { useRequiredIngredients } from '@/features/meal-planning/hooks/useRequiredIngredients';
import { useMealPlanningStore } from '@/features/meal-planning/store/useMealPlanningStore';
import { usePantryStore } from '@/features/pantry/store/pantryStore';
import { Sparkles, CheckCircle, AlertCircle as CircleAlert } from 'lucide-react';

type ShoppingItem = Database['public']['Tables']['shopping_list_items']['Row'];

// Helper to map database fields to UI fields
const mapShoppingItem = (item: ShoppingItem) => ({
  ...item,
  name: item.custom_name || 'Sin nombre',
  checked: item.is_purchased || false,
  price: item.estimated_cost || 0,
  store: item.source || null
});

const categoryIcons = {
  dairy: { icon: Milk, color: 'bg-slate-100 text-slate-600' },
  vegetables: { icon: Carrot, color: 'bg-slate-100 text-slate-600' },
  fruits: { icon: Apple, color: 'bg-orange-100 text-orange-600' },
  grains: { icon: Wheat, color: 'bg-slate-100 text-slate-600' },
  proteins: { icon: Beef, color: 'bg-slate-100 text-slate-600' },
  beverages: { icon: Coffee, color: 'bg-slate-100 text-slate-600' },
  snacks: { icon: Cookie, color: 'bg-orange-100 text-orange-600' },
  otros: { icon: Package, color: 'bg-slate-100 text-slate-600' }
};

const stores = [
  { id: 'all', name: 'Todas las tiendas', icon: Store },
  { id: 'carrefour', name: 'Carrefour', icon: ShoppingCart },
  { id: 'dia', name: 'Dia', icon: ShoppingBag },
  { id: 'coto', name: 'Coto', icon: Store },
  { id: 'jumbo', name: 'Jumbo', icon: ShoppingCart }
];

// Common items for quick-add
const quickAddItems = [
  { name: 'Leche', category: 'dairy', icon: '🥛' },
  { name: 'Huevos', category: 'proteins', icon: '🥚' },
  { name: 'Pan', category: 'grains', icon: '🍞' },
  { name: 'Queso', category: 'dairy', icon: '🧀' },
  { name: 'Manteca', category: 'dairy', icon: '🧈' },
  { name: 'Arroz', category: 'grains', icon: '🍚' },
  { name: 'Fideos', category: 'grains', icon: '🍝' },
  { name: 'Tomate', category: 'vegetables', icon: '🍅' },
  { name: 'Cebolla', category: 'vegetables', icon: '🧅' },
  { name: 'Pollo', category: 'proteins', icon: '🍗' },
  { name: 'Carne', category: 'proteins', icon: '🥩' },
  { name: 'Aceite', category: 'otros', icon: '🫒' },
];

export default function ListaComprasPage() {
  const router = useRouter();
  const { profile } = useUser();
  const {
    lists,
    activeList,
    isLoading,
    error,
    createList,
    updateList,
    deleteList,
    addItem,
    updateItem,
    deleteItem,
    toggleItem,
    setActiveListById,
    refresh
  } = useShoppingList();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStore, setSelectedStore] = useState('all');
  const [viewMode, setViewMode] = useState<'categories' | 'list'>('categories');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showPriceSearch, setShowPriceSearch] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['dairy', 'vegetables', 'fruits']);

  // Form states
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState(1);
  const [newItemUnit, setNewItemUnit] = useState('unidades');
  const [newItemCategory, setNewItemCategory] = useState('otros');
  const [newListName, setNewListName] = useState('');
  const [showNewListModal, setShowNewListModal] = useState(false);

  // Edit states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ShoppingItem | null>(null);
  const [editItemName, setEditItemName] = useState('');
  const [editItemQuantity, setEditItemQuantity] = useState(1);
  const [editItemUnit, setEditItemUnit] = useState('unidades');
  const [editItemCategory, setEditItemCategory] = useState('otros');
  const [editItemPrice, setEditItemPrice] = useState<number | null>(null);

  // Price scraping for all items
  const { searchMultipleProducts, isLoading: isPriceLoading } = useEnhancedPriceScraper();

  // Meal planning integration - get required ingredients from week plan
  const currentWeekPlan = useMealPlanningStore((s) => s.currentWeekPlan);
  const { missing, available } = useRequiredIngredients(currentWeekPlan);
  const addItemsToPantry = usePantryStore((s) => s.addItemsFromShoppingList);

  // Handler to add a single missing ingredient to the shopping list
  const handleAddMissingIngredient = async (ing: { name: string; requiredQuantity: number; unit: string; category: string }) => {
    await addItem({
      custom_name: ing.name,
      quantity: ing.requiredQuantity,
      unit: ing.unit,
      category: ing.category || 'otros',
      is_purchased: false,
      estimated_cost: null,
      source: null,
      notes: 'Agregado desde plan semanal'
    });
  };

  // Handler to add all missing ingredients at once
  const handleAddAllMissingIngredients = async () => {
    for (const ing of missing) {
      await handleAddMissingIngredient(ing);
    }
    toast.success(`✅ ${missing.length} ingredientes agregados a tu lista`);
  };

  // Calculate statistics
  const calculateStats = () => {
    if (!activeList?.shopping_list_items) {
      return {
        totalItems: 0,
        checkedItems: 0,
        totalPrice: 0,
        checkedPrice: 0,
        progress: 0,
        savings: 0
      };
    }

    let totalItems = 0;
    let checkedItems = 0;
    let totalPrice = 0;
    let checkedPrice = 0;

    activeList.shopping_list_items.forEach(item => {
      if (!item) return;
      const mappedItem = mapShoppingItem(item);
      totalItems++;
      totalPrice += mappedItem.price || 0;
      if (mappedItem.checked) {
        checkedItems++;
        checkedPrice += mappedItem.price || 0;
      }
    });

    return {
      totalItems,
      checkedItems,
      totalPrice,
      checkedPrice,
      progress: totalItems > 0 ? (checkedItems / totalItems) * 100 : 0,
      savings: totalPrice * 0.15 // 15% estimated savings
    };
  };

  const stats = calculateStats();

  // Toggle category expansion
  const toggleCategory = (category: string) => {
    setExpandedCategories(prev =>
      prev.includes(category)
        ? prev.filter(cat => cat !== category)
        : [...prev, category]
    );
  };

  // Filter items based on search and store
  const getFilteredItems = () => {
    if (!activeList?.shopping_list_items) return {};

    const filtered = activeList.shopping_list_items.filter(item => {
      if (!item) return false;
      const mappedItem = mapShoppingItem(item);
      const matchesSearch = mappedItem.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStore = selectedStore === 'all' || mappedItem.store?.toLowerCase() === selectedStore;
      return matchesSearch && matchesStore;
    });

    // Group by category
    return filtered.reduce((acc, item) => {
      const category = item.category || 'otros';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
      return acc;
    }, {} as Record<string, ShoppingItem[]>);
  };

  const filteredAndGroupedItems = getFilteredItems();

  // Handle add item
  const handleAddItem = async () => {
    if (!newItemName.trim()) return;

    await addItem({
      custom_name: newItemName,
      quantity: newItemQuantity,
      unit: newItemUnit,
      category: newItemCategory,
      is_purchased: false,
      estimated_cost: null,
      source: null,
      notes: null
    });

    setNewItemName('');
    setNewItemQuantity(1);
    setNewItemCategory('otros');
    setShowAddModal(false);
  };

  // Handle quick-add item
  const handleQuickAdd = async (itemName: string, category: string) => {
    await addItem({
      custom_name: itemName,
      quantity: 1,
      unit: 'unidades',
      category: category,
      is_purchased: false,
      estimated_cost: null,
      source: null,
      notes: null
    });
  };

  // Handle create list
  const handleCreateList = async () => {
    if (!newListName.trim()) return;

    await createList(newListName, true);
    setNewListName('');
    setShowNewListModal(false);
  };

  // Handle edit item
  const handleEditItem = (item: ShoppingItem) => {
    setEditingItem(item);
    setEditItemName(item.custom_name || '');
    setEditItemQuantity(item.quantity || 1);
    setEditItemUnit(item.unit || 'unidades');
    setEditItemCategory(item.category || 'otros');
    setEditItemPrice(item.estimated_cost);
    setShowEditModal(true);
  };

  // Handle update item
  const handleUpdateItem = async () => {
    if (!editingItem || !editItemName.trim()) return;

    await updateItem(editingItem.id, {
      custom_name: editItemName,
      quantity: editItemQuantity,
      unit: editItemUnit,
      category: editItemCategory,
      estimated_cost: editItemPrice
    });

    setShowEditModal(false);
    setEditingItem(null);
  };

  // Handle price search for all items
  const handleSearchAllPrices = async () => {
    if (!activeList?.shopping_list_items) return;

    const uncheckedItems = activeList.shopping_list_items
      .filter(item => item && !item.is_purchased)
      .map(item => mapShoppingItem(item).name);

    if (uncheckedItems.length === 0) {
      return;
    }

    try {
      const results = await searchMultipleProducts(uncheckedItems);

      // Update item prices with lowest found price
      for (const [query, products] of results.entries()) {
        if (products.length > 0) {
          const lowestPrice = Math.min(...products.map(p => p.price));
          const bestStore = products.find(p => p.price === lowestPrice)?.store;

          // Find matching item in shopping list
          const matchingItem = activeList.shopping_list_items.find(item => {
            if (!item) return false;
            const mappedItem = mapShoppingItem(item);
            return mappedItem.name.toLowerCase().includes(query.toLowerCase());
          });

          if (matchingItem) {
            await updateItem(matchingItem.id, {
              estimated_cost: lowestPrice,
              source: bestStore
            });
          }
        }
      }

      logger.info('Updated prices for shopping list items', 'ListaComprasPage', {
        itemsSearched: uncheckedItems.length
      });

    } catch (error) {
      logger.error('Error searching prices:', 'ListaComprasPage', error);
    }
  };

  // WhatsApp share function
  const handleShareWhatsApp = () => {
    if (!activeList?.shopping_list_items) return;

    const lines: string[] = ['Lista de Compras'];

    // Group by category
    const grouped = activeList.shopping_list_items.reduce((acc, item) => {
      if (!item) return acc;
      const cat = item.category || 'otros';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(mapShoppingItem(item));
      return acc;
    }, {} as Record<string, any[]>);

    Object.entries(grouped).forEach(([category, items]) => {
      const unchecked = items.filter(i => !i.checked);
      if (unchecked.length === 0) return;

      lines.push(`\n*${category.charAt(0).toUpperCase() + category.slice(1)}*`);
      unchecked.forEach(item => {
        const priceStr = item.price > 0 ? ` ($${item.price.toFixed(0)})` : '';
        lines.push(`  - ${item.name} x${item.quantity}${priceStr}`);
      });
    });

    if (stats.totalPrice > 0) {
      lines.push(`\n*Total:* $${stats.totalPrice.toFixed(0)}`);
    }

    const text = encodeURIComponent(lines.join('\n'));
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  // Toggle supermarket mode
  const [supermarketMode, setSupermarketMode] = useState(false);

  // Removed auth guard for local shopping list feature

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-lg text-slate-600 dark:text-gray-400">Cargando tu lista...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-transparent">
      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl lg:text-5xl font-black tracking-tighter text-slate-900 dark:text-white">
                  Lista de Compras
                </h1>
                {!profile && (
                  <div className="px-3 py-1 bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 text-xs font-bold uppercase tracking-wider rounded-full border border-orange-200 dark:border-orange-500/30">
                    Local Mode
                  </div>
                )}
              </div>
              <p className="text-lg text-slate-600 dark:text-gray-400">
                {stats.totalItems} items - ${stats.totalPrice.toFixed(2)} estimado
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <GlassButton
                variant="primary"
                icon={<Plus className="w-4 h-4" />}
                onClick={() => setShowAddModal(true)}
              >
                Anadir Item
              </GlassButton>
              <GlassButton
                variant="secondary"
                icon={<DollarSign className="w-4 h-4" />}
                onClick={handleSearchAllPrices}
                disabled={isPriceLoading || !activeList?.shopping_list_items?.length}
                loading={isPriceLoading}
              >
                {isPriceLoading ? 'Actualizando Precios...' : 'Actualizar Precios'}
              </GlassButton>
              <GlassButton
                variant="ghost"
                icon={<Search className="w-4 h-4" />}
                onClick={() => setShowPriceSearch(true)}
              >
                Comparar Precios
              </GlassButton>
              <GlassButton
                variant="ghost"
                icon={<RefreshCw className="w-4 h-4" />}
                onClick={refresh}
              >
                Actualizar
              </GlassButton>
              <GlassButton
                variant="ghost"
                icon={<MessageCircle className="w-4 h-4" />}
                onClick={handleShareWhatsApp}
                className="text-slate-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-white/10"
              >
                WhatsApp
              </GlassButton>
              <GlassButton
                variant={supermarketMode ? 'primary' : 'ghost'}
                icon={<Smartphone className="w-4 h-4" />}
                onClick={() => setSupermarketMode(!supermarketMode)}
              >
                {supermarketMode ? 'Salir Modo Super' : 'Modo Super'}
              </GlassButton>
            </div>
          </div>

          {/* List Selector */}
          {lists.length > 0 && (
            <div className="flex items-center gap-4 mb-6">
              <select
                value={activeList?.id || ''}
                onChange={(e) => setActiveListById(e.target.value)}
                className="glass-input bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-white/10"
              >
                {lists.map(list => (
                  <option key={list.id} value={list.id}>
                    {list.name}
                  </option>
                ))}
              </select>
              <GlassButton
                variant="ghost"
                icon={<Plus className="w-4 h-4" />}
                onClick={() => setShowNewListModal(true)}
              >
                Nueva Lista
              </GlassButton>
            </div>
          )}

          {/* Progress Bar */}
          {activeList && (
            <GlassCard variant="subtle" className="p-4 mb-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-900 dark:text-white">
                  Progreso de compra
                </span>
                <span className="text-sm text-slate-600 dark:text-gray-400">
                  {stats.checkedItems} de {stats.totalItems} items
                </span>
              </div>
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-orange-500 to-orange-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${stats.progress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </GlassCard>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05 }}
            >
              <GlassCard variant="medium" className="p-4 bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-white/10" interactive>
                <div className="flex items-center justify-between mb-2">
                  <ShoppingCart className="w-8 h-8 text-slate-600 dark:text-gray-400" />
                  <span className="text-2xl font-bold text-slate-900 dark:text-white">{stats.totalItems}</span>
                </div>
                <p className="text-sm text-slate-600 dark:text-gray-400">Items Total</p>
              </GlassCard>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              whileHover={{ scale: 1.05 }}
            >
              <GlassCard variant="medium" className="p-4 bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-white/10" interactive>
                <div className="flex items-center justify-between mb-2">
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                  <span className="text-2xl font-bold text-slate-900 dark:text-white">{stats.checkedItems}</span>
                </div>
                <p className="text-sm text-slate-600 dark:text-gray-400">Completados</p>
              </GlassCard>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              whileHover={{ scale: 1.05 }}
              onClick={() => setShowStatsModal(true)}
              className="cursor-pointer"
            >
              <GlassCard variant="medium" className="p-4 bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-white/10" interactive>
                <div className="flex items-center justify-between mb-2">
                  <DollarSign className="w-8 h-8 text-blue-500" />
                  <span className="text-2xl font-bold text-slate-900 dark:text-white">${stats.totalPrice.toFixed(0)}</span>
                </div>
                <p className="text-sm text-slate-600 dark:text-gray-400">Presupuesto</p>
              </GlassCard>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              whileHover={{ scale: 1.05 }}
            >
              <GlassCard variant="medium" className="p-4 bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-white/10" interactive>
                <div className="flex items-center justify-between mb-2">
                  <TrendingDown className="w-8 h-8 text-orange-500" />
                  <span className="text-2xl font-bold text-orange-500">
                    ${stats.savings.toFixed(0)}
                  </span>
                </div>
                <p className="text-sm text-slate-600 dark:text-gray-400">Ahorro Est.</p>
              </GlassCard>
            </motion.div>
          </div>

          {/* Search and Filters */}
          <GlassCard variant="medium" className="p-4 mb-6 bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-white/10">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <GlassInput
                  placeholder="Buscar items..."
                  icon={<Search className="w-5 h-5" />}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>

              <div className="flex gap-3">
                <select
                  value={selectedStore}
                  onChange={(e) => setSelectedStore(e.target.value)}
                  className="glass-input bg-white text-slate-900 border border-slate-200"
                >
                  {stores.map(store => (
                    <option key={store.id} value={store.id}>
                      {store.name}
                    </option>
                  ))}
                </select>

                <div className="flex items-center bg-slate-100 rounded-lg p-1">
                  <GlassButton
                    variant={viewMode === 'categories' ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('categories')}
                    className="p-2"
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </GlassButton>
                  <GlassButton
                    variant={viewMode === 'list' ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="p-2"
                  >
                    <List className="w-4 h-4" />
                  </GlassButton>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Quick Add Buttons */}
          {activeList && (
            <GlassCard variant="subtle" className="p-4 mb-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-gray-300">Agregar Rápido</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {quickAddItems.map((item) => (
                  <motion.button
                    key={item.name}
                    onClick={() => handleQuickAdd(item.name, item.category)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-full text-sm font-medium text-slate-700 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-orange-500/10 hover:border-orange-300 dark:hover:border-orange-500/30 hover:text-orange-600 dark:hover:text-orange-400 transition-all active:scale-95"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span>{item.icon}</span>
                    <span>{item.name}</span>
                  </motion.button>
                ))}
              </div>
            </GlassCard>
          )}
        </motion.div>

        {/* SECCIÓN: Ingredientes Faltantes del Plan Semanal */}
        {missing.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <GlassCard variant="medium" className="p-4 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-500/10 dark:to-red-500/10 border-2 border-orange-300 dark:border-orange-500/30">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-orange-500/20 rounded-xl">
                  <CircleAlert className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h3 className="font-bold text-orange-700 dark:text-orange-400">
                    🛒 Ingredientes que necesitas para tu plan
                  </h3>
                  <p className="text-sm text-orange-600 dark:text-orange-400/80">
                    Basado en tu planificación semanal
                  </p>
                </div>
              </div>

              <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
                {missing.map((ing) => (
                  <motion.div
                    key={ing.name}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between bg-white dark:bg-slate-800/80 p-3 rounded-xl border border-orange-200 dark:border-orange-500/20"
                  >
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">{ing.name}</p>
                      <p className="text-sm text-slate-600 dark:text-gray-400">
                        Necesitas: {ing.requiredQuantity.toFixed(1)} {ing.unit}
                      </p>
                    </div>
                    <GlassButton
                      variant="primary"
                      size="sm"
                      onClick={() => handleAddMissingIngredient(ing)}
                      className="bg-orange-500 hover:bg-orange-600"
                    >
                      <Plus className="w-4 h-4" />
                      Agregar
                    </GlassButton>
                  </motion.div>
                ))}
              </div>

              <GlassButton
                variant="primary"
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                onClick={handleAddAllMissingIngredients}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Agregar todos ({missing.length})
              </GlassButton>
            </GlassCard>
          </motion.div>
        )}

        {/* SECCIÓN: Ingredientes Disponibles (ya tienes) */}
        {available.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <GlassCard variant="medium" className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-500/10 dark:to-teal-500/10 border-2 border-emerald-300 dark:border-emerald-500/30">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-emerald-500/20 rounded-xl">
                  <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-bold text-emerald-700 dark:text-emerald-400">
                    ✅ Ya tienes estos ingredientes
                  </h3>
                  <p className="text-sm text-emerald-600 dark:text-emerald-400/80">
                    Disponibles en tu despensa
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {available.map((ing) => (
                  <div
                    key={ing.name}
                    className="flex items-center gap-2 bg-white dark:bg-slate-800/60 px-3 py-2 rounded-lg border border-emerald-200 dark:border-emerald-500/20 text-sm"
                  >
                    <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span className="text-emerald-700 dark:text-emerald-300 truncate">
                      {ing.name}
                    </span>
                  </div>
                ))}
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* Shopping List */}
        <AnimatePresence mode="wait">
          {!activeList ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <GlassCard variant="subtle" className="p-8 max-w-md mx-auto bg-slate-50 border border-slate-200">
                <ShoppingCart className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">
                  No tienes listas de compras
                </h3>
                <p className="text-slate-600 mb-4">
                  Crea tu primera lista para comenzar.
                </p>
                <GlassButton
                  variant="primary"
                  icon={<Plus className="w-4 h-4" />}
                  onClick={() => setShowNewListModal(true)}
                >
                  Crear Lista
                </GlassButton>
              </GlassCard>
            </motion.div>
          ) : viewMode === 'categories' ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {Object.entries(filteredAndGroupedItems).map(([category, items], categoryIndex) => {
                const CategoryIcon = categoryIcons[category as keyof typeof categoryIcons]?.icon || Package;
                const categoryColor = categoryIcons[category as keyof typeof categoryIcons]?.color || 'bg-slate-100 text-slate-600';
                const isExpanded = expandedCategories.includes(category);
                const mappedItems = items.map(mapShoppingItem);
                const completedCount = mappedItems.filter(item => item.checked).length;

                return (
                  <motion.div
                    key={category}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: categoryIndex * 0.1 }}
                  >
                    <GlassCard variant="medium" className="overflow-hidden bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-white/10">
                      {/* Category Header */}
                      <motion.div
                        className="p-4 cursor-pointer"
                        onClick={() => toggleCategory(category)}
                        whileHover={{ backgroundColor: 'rgba(241, 245, 249, 0.5)' }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "p-2.5 rounded-xl",
                              categoryColor
                            )}>
                              <CategoryIcon className="w-5 h-5" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg text-slate-900 dark:text-white capitalize">{category}</h3>
                              <p className="text-sm text-slate-600 dark:text-gray-400">
                                {completedCount} de {mappedItems.length} items
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className="font-semibold text-slate-900 dark:text-white">
                                ${mappedItems.reduce((sum, item) => sum + (item.price || 0), 0).toFixed(2)}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-gray-500">Total</p>
                            </div>
                            {isExpanded ? <ChevronDown className="w-5 h-5 text-slate-600 dark:text-gray-400" /> : <ChevronRight className="w-5 h-5 text-slate-600 dark:text-gray-400" />}
                          </div>
                        </div>
                      </motion.div>

                      {/* Category Items */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t border-slate-200 dark:border-white/10"
                          >
                            <div className="p-4 space-y-2">
                              {mappedItems.map((item, itemIndex) => (
                                <motion.div
                                  key={item.id}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: itemIndex * 0.05 }}
                                  whileHover={{ x: 5 }}
                                  className={cn(
                                    "flex items-center gap-3 p-3 rounded-lg transition-all",
                                    item.checked
                                      ? "bg-slate-100 dark:bg-slate-800/50 opacity-60"
                                      : "hover:bg-slate-50 dark:hover:bg-slate-800/30"
                                  )}
                                >
                                  <button
                                    onClick={() => toggleItem(item.id)}
                                    className="flex-shrink-0"
                                  >
                                    {item.checked ? (
                                      <CheckCircle2 className="w-6 h-6 text-orange-500" />
                                    ) : (
                                      <Circle className="w-6 h-6 text-slate-400 dark:text-gray-600" />
                                    )}
                                  </button>

                                  <div className="flex-1">
                                    <div className="flex items-start justify-between">
                                      <div>
                                        <p className={cn(
                                          "font-medium text-slate-900 dark:text-white",
                                          item.checked && "line-through text-slate-500 dark:text-gray-500"
                                        )}>
                                          {item.name}
                                        </p>
                                        <p className="text-sm text-slate-600 dark:text-gray-400">
                                          {item.quantity} {item.unit}
                                          {item.store && ` - ${item.store}`}
                                        </p>
                                      </div>
                                      <div className="text-right">
                                        <p className="font-medium text-slate-900 dark:text-white">
                                          ${item.price?.toFixed(2) || '0.00'}
                                        </p>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex gap-1">
                                    <GlassButton
                                      variant="ghost"
                                      size="sm"
                                      className="p-1.5"
                                      onClick={() => handleEditItem(item)}
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </GlassButton>
                                    <GlassButton
                                      variant="ghost"
                                      size="sm"
                                      className="p-1.5"
                                      onClick={() => deleteItem(item.id)}
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </GlassButton>
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </GlassCard>
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <GlassCard variant="medium" className="p-6 bg-white border border-slate-200">
                <div className="space-y-3">
                  {Object.values(filteredAndGroupedItems).flat().map(item => {
                    const mappedItem = mapShoppingItem(item);
                    const categoryKey = mappedItem.category || 'otros';
                    const CategoryIcon = categoryIcons[categoryKey as keyof typeof categoryIcons]?.icon || Package;
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        whileHover={{ x: 5 }}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg transition-all",
                          mappedItem.checked
                            ? "bg-slate-100 opacity-60"
                            : "hover:bg-slate-50"
                        )}
                      >
                        <button
                          onClick={() => toggleItem(item.id)}
                          className="flex-shrink-0"
                        >
                          {mappedItem.checked ? (
                            <CheckCircle2 className="w-6 h-6 text-orange-500" />
                          ) : (
                            <Circle className="w-6 h-6 text-slate-400" />
                          )}
                        </button>

                        <CategoryIcon className="w-5 h-5 text-slate-400 flex-shrink-0" />

                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className={cn(
                                "font-medium text-slate-900",
                                mappedItem.checked && "line-through text-slate-500"
                              )}>
                                {mappedItem.name}
                              </p>
                              <p className="text-sm text-slate-600">
                                {mappedItem.quantity} {mappedItem.unit} - {mappedItem.category}
                                {mappedItem.store && ` - ${mappedItem.store}`}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-slate-900">
                                ${mappedItem.price?.toFixed(2) || '0.00'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Supermarket Mode - Full Screen Optimized UI */}
        {supermarketMode && activeList?.shopping_list_items && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 bg-slate-900 text-white overflow-auto"
          >
            {/* Supermarket Mode Header */}
            <div className="sticky top-0 bg-orange-500 p-4 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">Modo Supermercado</h2>
                  <p className="text-sm opacity-90">
                    {stats.checkedItems}/{stats.totalItems} completados - ${stats.totalPrice.toFixed(0)}
                  </p>
                </div>
                <button
                  onClick={() => setSupermarketMode(false)}
                  className="px-4 py-2 bg-white/20 rounded-lg font-medium hover:bg-white/30 transition"
                >
                  Salir
                </button>
              </div>
              {/* Progress bar */}
              <div className="mt-3 h-2 bg-white/20 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-white"
                  initial={{ width: 0 }}
                  animate={{ width: `${stats.progress}%` }}
                />
              </div>
            </div>

            {/* Supermarket Items List - Large Touch Targets */}
            <div className="p-4 space-y-2 pb-24">
              {Object.entries(filteredAndGroupedItems).map(([category, items]) => {
                const mappedItems = items.map(mapShoppingItem);
                const uncheckedItems = mappedItems.filter(i => !i.checked);
                const checkedItems = mappedItems.filter(i => i.checked);

                if (uncheckedItems.length === 0 && checkedItems.length === 0) return null;

                return (
                  <div key={category} className="space-y-2">
                    {/* Category header */}
                    <div className="flex items-center gap-2 py-2 px-1 sticky top-20 bg-slate-900/95 backdrop-blur">
                      <span className="font-semibold text-lg capitalize">{category}</span>
                      <span className="text-sm opacity-60">
                        ({uncheckedItems.length} pendientes)
                      </span>
                    </div>

                    {/* Unchecked items first */}
                    {uncheckedItems.map(item => (
                      <motion.button
                        key={item.id}
                        onClick={() => toggleItem(item.id)}
                        className="w-full flex items-center gap-4 p-5 bg-slate-800 rounded-xl active:scale-[0.98] transition-transform"
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="w-10 h-10 rounded-full border-3 border-white/40 flex items-center justify-center">
                          <Circle className="w-6 h-6 text-white/40" />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="text-xl font-medium">{item.name}</p>
                          <p className="text-sm opacity-60">
                            {item.quantity} {item.unit}
                            {item.price > 0 && ` - $${item.price.toFixed(0)}`}
                          </p>
                        </div>
                      </motion.button>
                    ))}

                    {/* Checked items (collapsed) */}
                    {checkedItems.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {checkedItems.map(item => (
                          <motion.button
                            key={item.id}
                            onClick={() => toggleItem(item.id)}
                            className="w-full flex items-center gap-4 p-4 bg-slate-800/40 rounded-xl border border-white/5"
                          >
                            <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center shrink-0">
                              <CheckCircle2 className="w-6 h-6 text-orange-500" />
                            </div>
                            <p className="text-lg line-through text-slate-500 truncate">{item.name}</p>
                          </motion.button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Floating Stats Footer */}
            <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900 to-transparent p-4 pt-8">
              <div className="flex items-center justify-between bg-slate-800 rounded-xl p-4">
                <div>
                  <p className="text-sm opacity-60">Total estimado</p>
                  <p className="text-2xl font-bold">${stats.totalPrice.toFixed(0)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm opacity-60">Ahorro estimado</p>
                  <p className="text-xl font-bold text-orange-400">${stats.savings.toFixed(0)}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Empty State */}
        {activeList && activeList.shopping_list_items?.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <GlassCard variant="subtle" className="p-8 max-w-md mx-auto bg-slate-50 border border-slate-200">
              <ShoppingCart className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                Lista vacia
              </h3>
              <p className="text-slate-600 mb-4">
                Comienza anadiendo items a tu lista de compras.
              </p>
              <GlassButton
                variant="primary"
                icon={<Plus className="w-4 h-4" />}
                onClick={() => setShowAddModal(true)}
              >
                Anadir Primer Item
              </GlassButton>
            </GlassCard>
          </motion.div>
        )}
      </div>

      {/* Add Item Modal */}
      <GlassModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Anadir Item a la Lista"
        size="lg"
      >
        <div className="space-y-4">
          <GlassInput
            label="Nombre del producto"
            placeholder="ej. Leche, Pan, etc."
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-4">
            <GlassInput
              label="Cantidad"
              type="number"
              placeholder="1"
              value={newItemQuantity}
              onChange={(e) => setNewItemQuantity(Number(e.target.value))}
            />
            <div>
              <label className="block text-sm font-medium mb-2 text-slate-700">Unidad</label>
              <select
                className="glass-input w-full bg-white text-slate-900 border border-slate-200"
                value={newItemUnit}
                onChange={(e) => setNewItemUnit(e.target.value)}
              >
                <option value="unidades">unidades</option>
                <option value="kg">kg</option>
                <option value="gramos">gramos</option>
                <option value="litros">litros</option>
                <option value="ml">ml</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-slate-700">Categoria</label>
            <select
              className="glass-input w-full bg-white text-slate-900 border border-slate-200"
              value={newItemCategory}
              onChange={(e) => setNewItemCategory(e.target.value)}
            >
              <option value="dairy">Lacteos</option>
              <option value="vegetables">Vegetales</option>
              <option value="fruits">Frutas</option>
              <option value="grains">Granos</option>
              <option value="proteins">Proteinas</option>
              <option value="beverages">Bebidas</option>
              <option value="snacks">Snacks</option>
              <option value="otros">Otros</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <GlassButton
              variant="primary"
              className="flex-1"
              onClick={handleAddItem}
              disabled={!newItemName.trim()}
            >
              Anadir Item
            </GlassButton>
            <GlassButton variant="ghost" onClick={() => setShowAddModal(false)}>
              Cancelar
            </GlassButton>
          </div>
        </div>
      </GlassModal>

      {/* Edit Item Modal */}
      <GlassModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Editar Item"
        size="lg"
      >
        <div className="space-y-4">
          <GlassInput
            label="Nombre del producto"
            placeholder="ej. Leche, Pan, etc."
            value={editItemName}
            onChange={(e) => setEditItemName(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-4">
            <GlassInput
              label="Cantidad"
              type="number"
              placeholder="1"
              value={editItemQuantity}
              onChange={(e) => setEditItemQuantity(Number(e.target.value))}
            />
            <div>
              <label className="block text-sm font-medium mb-2 text-slate-700">Unidad</label>
              <select
                className="glass-input w-full bg-white text-slate-900 border border-slate-200"
                value={editItemUnit}
                onChange={(e) => setEditItemUnit(e.target.value)}
              >
                <option value="unidades">unidades</option>
                <option value="kg">kg</option>
                <option value="gramos">gramos</option>
                <option value="litros">litros</option>
                <option value="ml">ml</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-slate-700">Categoria</label>
              <select
                className="glass-input w-full bg-white text-slate-900 border border-slate-200"
                value={editItemCategory}
                onChange={(e) => setEditItemCategory(e.target.value)}
              >
                <option value="dairy">Lacteos</option>
                <option value="vegetables">Vegetales</option>
                <option value="fruits">Frutas</option>
                <option value="grains">Granos</option>
                <option value="proteins">Proteinas</option>
                <option value="beverages">Bebidas</option>
                <option value="snacks">Snacks</option>
                <option value="otros">Otros</option>
              </select>
            </div>
            <GlassInput
              label="Precio estimado (opcional)"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={editItemPrice || ''}
              onChange={(e) => setEditItemPrice(e.target.value ? Number(e.target.value) : null)}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <GlassButton
              variant="primary"
              className="flex-1"
              onClick={handleUpdateItem}
              disabled={!editItemName.trim()}
            >
              Actualizar Item
            </GlassButton>
            <GlassButton variant="ghost" onClick={() => setShowEditModal(false)}>
              Cancelar
            </GlassButton>
          </div>
        </div>
      </GlassModal>

      {/* New List Modal */}
      <GlassModal
        isOpen={showNewListModal}
        onClose={() => setShowNewListModal(false)}
        title="Crear Nueva Lista"
        size="md"
      >
        <div className="space-y-4">
          <GlassInput
            label="Nombre de la lista"
            placeholder="ej. Compras semanales"
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
          />

          <div className="flex gap-3 pt-4">
            <GlassButton
              variant="primary"
              className="flex-1"
              onClick={handleCreateList}
              disabled={!newListName.trim()}
            >
              Crear Lista
            </GlassButton>
            <GlassButton variant="ghost" onClick={() => setShowNewListModal(false)}>
              Cancelar
            </GlassButton>
          </div>
        </div>
      </GlassModal>

      {/* Price Search Modal */}
      <GlassModal
        isOpen={showPriceSearch}
        onClose={() => setShowPriceSearch(false)}
        title="Buscar Precios en Supermercados"
        size="xl"
      >
        <div className="space-y-4">
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg">
            <p className="text-sm text-slate-700">
              <strong>Busca productos</strong> y compara precios en tiempo real de supermercados argentinos como Carrefour, Jumbo, Coto y Dia.
            </p>
          </div>
          <PriceSearchComponent
            onProductSelect={(product) => {
              logger.info('Selected product from price search:', 'ListaComprasPage', {
                product: product.name,
                price: product.price,
                store: product.store
              });
              // Future enhancement: Could auto-add to shopping list or update existing item price
            }}
          />
        </div>
      </GlassModal>
    </div>
  );
}
