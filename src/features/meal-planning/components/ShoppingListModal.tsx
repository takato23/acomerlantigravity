'use client';

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ShoppingCart,
  Download,
  Share2,
  MessageCircle,
  Package,
  Milk,
  Carrot,
  Apple,
  Wheat,
  Beef,
  Coffee,
  Cookie,
  CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';

import { iOS26EnhancedCard } from '@/components/ios26/iOS26EnhancedCard';
import { iOS26LiquidButton } from '@/components/ios26/iOS26LiquidButton';

// Category icons mapping
const categoryIcons: Record<string, any> = {
  dairy: Milk,
  vegetables: Carrot,
  fruits: Apple,
  grains: Wheat,
  proteins: Beef,
  beverages: Coffee,
  snacks: Cookie,
  otros: Package,
};

// Category colors
const categoryColors: Record<string, string> = {
  dairy: 'bg-slate-600',
  vegetables: 'bg-green-600',
  fruits: 'bg-orange-500',
  grains: 'bg-amber-500',
  proteins: 'bg-red-500',
  beverages: 'bg-slate-500',
  snacks: 'bg-slate-700',
  otros: 'bg-gray-500',
};

interface ShoppingItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  estimatedPrice?: number;
  isChecked?: boolean;
}

interface ShoppingListModalProps {
  onClose: () => void;
  items?: ShoppingItem[];
  totalEstimated?: number;
}

export function ShoppingListModal({ onClose, items = [], totalEstimated = 0 }: ShoppingListModalProps) {

  // Group items by category
  const groupedItems = useMemo(() => {
    const groups: Record<string, ShoppingItem[]> = {};
    items.forEach(item => {
      const cat = item.category || 'otros';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });
    return groups;
  }, [items]);

  const hasItems = items.length > 0;

  // Export to text
  const handleExport = () => {
    if (!hasItems) {
      toast.error('No hay items para exportar');
      return;
    }

    const lines = ['🛒 Lista de Compras\n'];
    Object.entries(groupedItems).forEach(([category, catItems]) => {
      lines.push(`\n📦 ${category.charAt(0).toUpperCase() + category.slice(1)}`);
      catItems.forEach(item => {
        const price = item.estimatedPrice ? ` ($${item.estimatedPrice.toFixed(0)})` : '';
        lines.push(`  ☐ ${item.name} x${item.quantity} ${item.unit}${price}`);
      });
    });
    if (totalEstimated > 0) {
      lines.push(`\n💰 Total estimado: $${totalEstimated.toFixed(0)}`);
    }

    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lista-compras.txt';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Lista exportada');
  };

  // Share to WhatsApp
  const handleShare = () => {
    if (!hasItems) {
      toast.error('No hay items para compartir');
      return;
    }

    const lines = ['🛒 *Lista de Compras*'];
    Object.entries(groupedItems).forEach(([category, catItems]) => {
      lines.push(`\n📦 *${category.charAt(0).toUpperCase() + category.slice(1)}*`);
      catItems.forEach(item => {
        const price = item.estimatedPrice ? ` ($${item.estimatedPrice.toFixed(0)})` : '';
        lines.push(`  ☐ ${item.name} x${item.quantity}${price}`);
      });
    });
    if (totalEstimated > 0) {
      lines.push(`\n💰 *Total:* $${totalEstimated.toFixed(0)}`);
    }

    const text = encodeURIComponent(lines.join('\n'));
    window.open(`https://wa.me/?text=${text}`, '_blank');
    toast.success('Abriendo WhatsApp...');
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg"
        >
          <iOS26EnhancedCard
            variant="aurora"
            elevation="floating"
            className="max-h-[80vh] overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-700 rounded-xl flex items-center justify-center">
                    <ShoppingCart className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Lista de Compras
                    </h2>
                    {hasItems && (
                      <p className="text-sm text-gray-500">
                        {items.length} items • ${totalEstimated.toFixed(0)} estimado
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 py-4 max-h-[50vh] overflow-y-auto">
              {!hasItems ? (
                <div className="text-center py-8">
                  <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center mx-auto mb-4">
                    <ShoppingCart className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Lista vacía
                  </h3>
                  <p className="text-gray-600">
                    Agrega comidas a tu planificador para generar una lista de compras automáticamente.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(groupedItems).map(([category, catItems]) => {
                    const Icon = categoryIcons[category] || Package;
                    const colorClass = categoryColors[category] || categoryColors.otros;

                    return (
                      <div key={category} className="space-y-2">
                        {/* Category Header */}
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-lg ${colorClass} flex items-center justify-center`}>
                            <Icon className="w-4 h-4 text-white" />
                          </div>
                          <span className="font-semibold text-gray-800 capitalize">
                            {category}
                          </span>
                          <span className="text-sm text-gray-500">
                            ({catItems.length})
                          </span>
                        </div>

                        {/* Items */}
                        <div className="ml-10 space-y-1">
                          {catItems.map(item => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between py-2 px-3 rounded-lg bg-white/5 hover:bg-white/10 transition"
                            >
                              <div className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                                <span className="text-gray-800">
                                  {item.name}
                                </span>
                                <span className="text-sm text-gray-500">
                                  x{item.quantity} {item.unit}
                                </span>
                              </div>
                              {item.estimatedPrice && item.estimatedPrice > 0 && (
                                <span className="text-sm font-medium text-green-600">
                                  ${item.estimatedPrice.toFixed(0)}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}

                  {/* Total */}
                  {totalEstimated > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
                      <span className="font-semibold text-gray-800">
                        Total Estimado
                      </span>
                      <span className="text-2xl font-bold text-green-600">
                        ${totalEstimated.toFixed(0)}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-white/10 flex justify-between">
              <div className="flex gap-2">
                <iOS26LiquidButton
                  variant="glass"
                  icon={<Download className="w-4 h-4" />}
                  iconPosition="left"
                  onClick={handleExport}
                  size="sm"
                  disabled={!hasItems}
                >
                  Exportar
                </iOS26LiquidButton>
                <iOS26LiquidButton
                  variant="glass"
                  icon={<MessageCircle className="w-4 h-4" />}
                  iconPosition="left"
                  onClick={handleShare}
                  size="sm"
                  disabled={!hasItems}
                  className="text-green-600"
                >
                  WhatsApp
                </iOS26LiquidButton>
              </div>
              <iOS26LiquidButton
                variant="primary"
                onClick={onClose}
                className="bg-black hover:bg-gray-800"
              >
                Cerrar
              </iOS26LiquidButton>
            </div>
          </iOS26EnhancedCard>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}