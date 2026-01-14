'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { logger } from '@/services/logger';
import {
  Plus,
  Camera,
  AlertTriangle,
  ShoppingCart,
  Edit,
  Trash2,
  Package,
  Sparkles,
  Refrigerator
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';

import { GlassCard, GlassButton, GlassInput, GlassModal } from '@/components/ui/GlassCard';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { usePantry } from '@/hooks/usePantry';
import { OnboardingPacks } from '@/components/pantry/OnboardingPacks';
import { PantryStats } from '@/components/pantry/PantryStats';
import { PantryFilters } from '@/components/pantry/PantryFilters';
import { PantryGrid } from '@/components/pantry/PantryGrid';
import { QuickAddBar, type PendingItem } from '@/components/pantry/QuickAddBar';
import { locations } from '@/components/pantry/pantry-constants';

export default function DespensaPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  // Pantry hook with database integration
  const {
    items: pantryItems,
    stats: pantryStats,
    isLoading: pantryLoading,
    error: pantryError,
    addItemToPantry,
    updatePantryItem: _updatePantryItem,
    deletePantryItem,
    isAdding,
    isUpdatingItems: _isUpdatingItems,
    isDeleting
  } = usePantry(user?.id);

  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [sortBy, setSortBy] = useState('name');

  // Add item form state
  const [addItemForm, setAddItemForm] = useState({
    ingredient_name: '',
    quantity: 1,
    unit: 'unidades',
    expiration_date: undefined as Date | undefined,
    location: 'despensa',
    notes: '',
    photo: undefined as File | undefined
  });

  // Calcular días hasta vencimiento
  const getDaysUntilExpiry = (expiryDate: Date | string) => {
    const expiry = typeof expiryDate === 'string' ? new Date(expiryDate) : expiryDate;
    return differenceInDays(expiry, new Date());
  };

  // Handle loading and error states
  if (authLoading || pantryLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Cargando despensa...</p>
        </div>
      </div>
    );
  }

  if (pantryError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950">
        <GlassCard variant="medium" className="p-8 max-w-md mx-auto text-center">
          <AlertTriangle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
            Error al cargar la despensa
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {pantryError.message || 'No se pudo conectar con la base de datos'}
          </p>
          <GlassButton
            variant="primary"
            onClick={() => window.location.reload()}
          >
            Reintentar
          </GlassButton>
        </GlassCard>
      </div>
    );
  }

  // Filtrar items
  const filteredItems = pantryItems.filter(item => {
    const matchesSearch = item.ingredient?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.notes?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.ingredient?.category === selectedCategory;
    const matchesLocation = selectedLocation === 'all' || item.location === selectedLocation;

    return matchesSearch && matchesCategory && matchesLocation;
  });

  // Ordenar items - ensure all required fields are present for PantryGrid
  const sortedItems = [...filteredItems]
    .map(item => ({
      id: item.id,
      quantity: item.quantity,
      unit: item.unit,
      location: item.location || 'despensa',
      expiration_date: item.expiration_date,
      created_at: typeof item.created_at === 'string' ? item.created_at : item.created_at.toISOString(),
      photo_url: item.photo_url,
      notes: item.notes,
      ingredient: item.ingredient
    }))
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.ingredient?.name || '').localeCompare(b.ingredient?.name || '');
        case 'expiry':
          if (!a.expiration_date && !b.expiration_date) return 0;
          if (!a.expiration_date) return 1;
          if (!b.expiration_date) return -1;
          return getDaysUntilExpiry(a.expiration_date) - getDaysUntilExpiry(b.expiration_date);
        case 'quantity':
          return b.quantity - a.quantity;
        case 'added':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        default:
          return 0;
      }
    });

  // Estadísticas calculadas desde la base de datos
  const stats = {
    totalItems: pantryStats?.total_items || 0,
    expiringSoon: pantryStats?.expiring_soon || 0,
    lowStock: pantryStats?.low_stock || 0,
    categories: pantryStats?.categories || 0
  };

  const handleItemClick = (item: any) => {
    setSelectedItem(item);
    setShowDetailsModal(true);
  };

  const handleAddItem = async () => {
    if (!addItemForm.ingredient_name.trim()) return;

    try {
      await addItemToPantry(addItemForm);
      setShowAddModal(false);
      setAddItemForm({
        ingredient_name: '',
        quantity: 1,
        unit: 'unidades',
        expiration_date: undefined,
        location: 'despensa',
        notes: '',
        photo: undefined
      });
    } catch (error) {
      logger.error('Error adding item:', 'Page:page', error);
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      await deletePantryItem(id);
      setShowDetailsModal(false);
    } catch (error) {
      logger.error('Error deleting item:', 'Page:page', error);
    }
  };

  const handlePackSelection = async (ingredients: any[]) => {
    try {
      // Agregar múltiples items secuencialmente
      for (const ingredient of ingredients) {
        await addItemToPantry(ingredient);
      }
    } catch (error) {
      logger.error('Error adding pack items:', 'Page:page', error);
      throw error; // Propagar error para que OnboardingPacks pueda manejarlo
    }
  };

  // Handler para QuickAddBar - agregar items desde voz/texto
  const handleQuickAddItems = async (items: PendingItem[]) => {
    try {
      for (const item of items) {
        await addItemToPantry({
          ingredient_name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          location: item.location || 'despensa',
        });
      }
    } catch (error) {
      logger.error('Error adding quick items:', 'Page:page', error);
      throw error;
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-transparent">
      <div className="container mx-auto px-4 py-6 lg:py-8 max-w-6xl">
        {/* Beautiful Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative mb-8"
        >
          {/* Background decoration */}
          <div className="absolute -top-4 -left-4 w-32 h-32 bg-gradient-to-br from-orange-500/20 to-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -top-2 right-10 w-24 h-24 bg-gradient-to-br from-emerald-500/15 to-teal-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            {/* Title section */}
            <div className="flex items-start gap-4">
              {/* Icon container */}
              <motion.div
                initial={{ scale: 0.8, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                className="hidden sm:flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 shadow-lg shadow-orange-500/25"
              >
                <Refrigerator className="w-7 h-7 text-white" />
              </motion.div>

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 dark:from-white dark:via-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                    Mi Despensa
                  </h1>
                  {stats.totalItems > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="flex items-center gap-1 px-2 py-0.5 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-semibold rounded-full"
                    >
                      <Sparkles className="w-3 h-3" />
                      {stats.totalItems}
                    </motion.span>
                  )}
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {stats.totalItems > 0
                    ? `Gestioná tus ingredientes y evitá desperdicios`
                    : 'Tu inventario personal de alimentos'}
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowAddModal(true)}
                disabled={isAdding}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-sm rounded-xl font-semibold shadow-lg shadow-orange-500/25 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Agregar</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push('/despensa/escanear')}
                className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-white/10 text-slate-700 dark:text-white text-sm border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/20 rounded-xl font-medium transition-all backdrop-blur-sm"
              >
                <Camera className="w-4 h-4" />
                <span className="hidden sm:inline">Escanear</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/lista-compras')}
                className="p-2.5 bg-white dark:bg-white/10 text-slate-600 dark:text-white border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/20 rounded-xl transition-all backdrop-blur-sm"
                title="Lista de Compras"
              >
                <ShoppingCart className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Stats Pills */}
        <PantryStats
          totalItems={stats.totalItems}
          expiringSoon={stats.expiringSoon}
          lowStock={stats.lowStock}
          categories={stats.categories}
        />

        {/* Unified Input (Add + Search) */}
        <div className="mb-4">
          <QuickAddBar
            onItemsAdded={handleQuickAddItems}
            onSearchChange={setSearchQuery}
            searchQuery={searchQuery}
            hasItems={stats.totalItems > 0}
            isAdding={isAdding}
          />
        </div>

        {/* Filters */}
        <div className="mb-6">
          <PantryFilters
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            selectedLocation={selectedLocation}
            onLocationChange={setSelectedLocation}
            sortBy={sortBy}
            onSortChange={setSortBy}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />
        </div>

        {/* Items Grid/List */}
        <AnimatePresence mode="wait">
          {sortedItems.length > 0 ? (
            <PantryGrid
              items={sortedItems}
              viewMode={viewMode}
              onItemClick={handleItemClick}
            />
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-8"
            >
              {/* Si hay filtros activos, mostrar mensaje de no encontrados */}
              {(searchQuery || selectedCategory !== 'all' || selectedLocation !== 'all') ? (
                <div className="text-center">
                  <GlassCard variant="subtle" className="p-6 max-w-sm mx-auto">
                    <Package className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                    <h3 className="text-base font-medium text-slate-900 dark:text-white mb-1">
                      Sin resultados
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Ajusta los filtros o agrega nuevos items
                    </p>
                  </GlassCard>
                </div>
              ) : (
                /* Si no hay filtros, mostrar onboarding con packs */
                <div className="max-w-3xl mx-auto">
                  <OnboardingPacks
                    onPackSelected={handlePackSelection}
                    isLoading={isAdding}
                  />

                  {/* Divider */}
                  <div className="flex items-center gap-4 my-6">
                    <div className="flex-1 border-t border-gray-200 dark:border-white/10"></div>
                    <span className="text-xs text-gray-400 dark:text-gray-500">o</span>
                    <div className="flex-1 border-t border-gray-200 dark:border-white/10"></div>
                  </div>

                  {/* Manual add option */}
                  <div className="text-center">
                    <button
                      onClick={() => setShowAddModal(true)}
                      disabled={isAdding}
                      className="text-sm text-orange-600 dark:text-orange-400 hover:underline font-medium"
                    >
                      Agregar item manualmente
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Add Item Modal */}
      <GlassModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Agregar Item"
        size="lg"
      >
        <div className="space-y-4">
          <GlassInput
            label="Nombre del producto"
            placeholder="ej. Leche, Tomates, etc."
            value={addItemForm.ingredient_name}
            onChange={(e) => setAddItemForm(prev => ({ ...prev, ingredient_name: e.target.value }))}
          />

          <div className="grid grid-cols-2 gap-4">
            <GlassInput
              label="Cantidad"
              type="number"
              placeholder="1"
              value={addItemForm.quantity.toString()}
              onChange={(e) => setAddItemForm(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 1 }))}
            />
            <div>
              <label className="block text-sm font-medium mb-2 text-slate-900 dark:text-white">Unidad</label>
              <select
                className="glass-input w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white dark:border-white/10"
                value={addItemForm.unit}
                onChange={(e) => setAddItemForm(prev => ({ ...prev, unit: e.target.value }))}
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
            <label className="block text-sm font-medium mb-2 text-slate-900 dark:text-white">Ubicacion</label>
            <select
              className="glass-input w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white dark:border-white/10"
              value={addItemForm.location}
              onChange={(e) => setAddItemForm(prev => ({ ...prev, location: e.target.value }))}
            >
              {locations.filter(l => l.id !== 'all').map(location => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
          </div>

          <GlassInput
            label="Fecha de vencimiento (opcional)"
            type="date"
            value={addItemForm.expiration_date ? addItemForm.expiration_date.toISOString().split('T')[0] : ''}
            onChange={(e) => setAddItemForm(prev => ({
              ...prev,
              expiration_date: e.target.value ? new Date(e.target.value) : undefined
            }))}
          />

          <GlassInput
            label="Notas (opcional)"
            placeholder="Marca, observaciones, etc."
            value={addItemForm.notes}
            onChange={(e) => setAddItemForm(prev => ({ ...prev, notes: e.target.value }))}
          />

          <div className="flex gap-3 pt-4">
            <GlassButton
              variant="primary"
              className="flex-1"
              onClick={handleAddItem}
              disabled={isAdding || !addItemForm.ingredient_name.trim()}
            >
              {isAdding ? 'Agregando...' : 'Agregar'}
            </GlassButton>
            <GlassButton
              variant="ghost"
              onClick={() => setShowAddModal(false)}
              disabled={isAdding}
            >
              Cancelar
            </GlassButton>
          </div>
        </div>
      </GlassModal>

      {/* Item Details Modal */}
      <GlassModal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title={selectedItem?.ingredient?.name}
        size="lg"
      >
        {selectedItem && (
          <div className="space-y-6">
            {selectedItem.photo_url ? (
              <img
                src={selectedItem.photo_url}
                alt={selectedItem.ingredient?.name}
                className="w-full h-48 object-cover rounded-xl"
              />
            ) : (
              <div className="w-full h-32 bg-gray-100 dark:bg-white/5 rounded-xl flex items-center justify-center">
                <Package className="w-12 h-12 text-gray-400" />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Cantidad</p>
                <p className="font-semibold text-slate-900 dark:text-white">{selectedItem.quantity} {selectedItem.unit}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Ubicacion</p>
                <p className="font-semibold text-slate-900 dark:text-white">
                  {locations.find(l => l.id === selectedItem.location)?.name}
                </p>
              </div>
              {selectedItem.expiration_date && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Vencimiento</p>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {format(new Date(selectedItem.expiration_date), "d 'de' MMMM, yyyy", { locale: es })}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Agregado</p>
                <p className="font-semibold text-slate-900 dark:text-white">
                  {format(new Date(selectedItem.created_at), "d 'de' MMMM, yyyy", { locale: es })}
                </p>
              </div>
            </div>

            {selectedItem.notes && (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Notas</p>
                <p className="font-semibold text-slate-900 dark:text-white">{selectedItem.notes}</p>
              </div>
            )}

            <div className="flex gap-3">
              <GlassButton variant="primary" className="flex-1" icon={<Edit className="w-4 h-4" />}>
                Editar
              </GlassButton>
              <GlassButton variant="secondary" icon={<ShoppingCart className="w-4 h-4" />}>
                A Lista
              </GlassButton>
              <GlassButton
                variant="ghost"
                icon={<Trash2 className="w-4 h-4" />}
                onClick={() => handleDeleteItem(selectedItem.id)}
                disabled={isDeleting[selectedItem.id]}
              >
                {isDeleting[selectedItem.id] ? '...' : 'Eliminar'}
              </GlassButton>
            </div>
          </div>
        )}
      </GlassModal>
    </div>
  );
}
