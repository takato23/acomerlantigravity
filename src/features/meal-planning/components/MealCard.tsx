/**
 * MealCard - Tarjeta optimizada para mostrar comidas en el planificador
 * Drag & Drop, macros, costo, tiempo - Design system KeCard
 */

'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import {
  Clock,
  DollarSign,
  Zap,
  Beef,
  MoreVertical,
  Edit,
  Trash2,
  Copy,
  ShoppingCart
} from 'lucide-react';

import {
  KeCard,
  KeCardHeader,
  KeCardTitle,
  KeCardContent,
  KeCardFooter,
  KeBadge,
  KeButton
} from '@/components/ui';
import { cn } from '@/lib/utils';

interface MealData {
  id?: string;
  title: string;
  ingredients?: Array<{
    name: string;
    quantity: number;
    unit: string;
    from_pantry?: boolean;
  }>;
  macros?: {
    kcal: number;
    protein_g: number;
    carbs_g?: number;
    fat_g?: number;
  };
  time_minutes: number;
  cost_estimate_ars?: number;
  image_url?: string;
  tags?: string[];
}

interface MealCardProps {
  meal?: MealData;
  mealType: 'desayuno' | 'almuerzo' | 'merienda' | 'cena';
  dayOfWeek: number;
  isEmpty?: boolean;
  isDragging?: boolean;
  isDropTarget?: boolean;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onAddToShoppingList?: () => void;
  className?: string;
}

const mealTypeConfig = {
  desayuno: {
    label: 'Desayuno',
    emoji: '☕',
    color: 'bg-slate-900',
    bgColor: 'bg-slate-50'
  },
  almuerzo: {
    label: 'Almuerzo',
    emoji: '☀️',
    color: 'bg-slate-700',
    bgColor: 'bg-slate-50'
  },
  merienda: {
    label: 'Merienda',
    emoji: '🍎',
    color: 'bg-slate-500',
    bgColor: 'bg-slate-50'
  },
  cena: {
    label: 'Cena',
    emoji: '🌙',
    color: 'bg-slate-800',
    bgColor: 'bg-slate-50'
  }
};

export const MealCard = memo<MealCardProps>(({
  meal,
  mealType,
  dayOfWeek,
  isEmpty = false,
  isDragging = false,
  isDropTarget = false,
  onClick,
  onEdit,
  onDelete,
  onDuplicate,
  onAddToShoppingList,
  className
}) => {
  const config = mealTypeConfig[mealType];

  // Empty card state
  if (isEmpty || !meal) {
    return (
      <KeCard
        variant="outline"
        className={cn(
          "min-h-[120px] cursor-pointer transition-all duration-200",
          "border-dashed border-2 hover:border-slate-300",
          isDropTarget && "border-slate-400 bg-slate-50/50 scale-105",
          config.bgColor,
          className
        )}
        onClick={onClick}
      >
        <KeCardContent className="flex flex-col items-center justify-center h-full py-6">
          <div className="text-4xl mb-2 opacity-60">
            {config.emoji}
          </div>
          <p className="text-sm text-gray-500 text-center">
            Agregar {config.label.toLowerCase()}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Tap para elegir receta
          </p>
        </KeCardContent>
      </KeCard>
    );
  }

  return (
    <motion.div
      layout
      initial={false}
      animate={{
        scale: isDragging ? 0.95 : 1,
        opacity: isDragging ? 0.8 : 1,
        rotate: isDragging ? 5 : 0
      }}
      transition={{ duration: 0.2 }}
      className={cn(className)}
    >
      <KeCard
        variant="default"
        hoverable={!isDragging}
        clickable
        className={cn(
          "relative overflow-hidden cursor-pointer transition-all duration-200",
          isDragging && "shadow-xl shadow-gray-500/10 z-50",
          isDropTarget && "ring-2 ring-slate-400 ring-offset-2"
        )}
        onClick={onClick}
      >
        {/* Header con título y tipo */}
        <KeCardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{config.emoji}</span>
                <KeBadge
                  variant="secondary"
                  size="sm"
                  className={cn("text-white", config.color)}
                >
                  {config.label}
                </KeBadge>
              </div>
              <KeCardTitle className="text-sm font-semibold truncate">
                {meal.title}
              </KeCardTitle>
            </div>

            {/* Menu button */}
            <KeButton
              variant="ghost"
              size="sm"
              className="p-1 h-auto min-h-0 opacity-60 hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                // TODO: Show context menu
              }}
            >
              <MoreVertical className="w-4 h-4" />
            </KeButton>
          </div>
        </KeCardHeader>

        {/* Content con métricas */}
        <KeCardContent className="space-y-3">
          {/* Macros row */}
          {meal.macros && (
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1">
                <Zap className="w-3 h-3 text-slate-600" />
                <span className="font-medium">{meal.macros.kcal} kcal</span>
              </div>
              <div className="flex items-center gap-1">
                <Beef className="w-3 h-3 text-slate-600" />
                <span className="font-medium">{meal.macros.protein_g}g prot</span>
              </div>
            </div>
          )}

          {/* Time and cost row */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-600" />
              <span>{meal.time_minutes} min</span>
            </div>
            {meal.cost_estimate_ars && (
              <div className="flex items-center gap-1">
                <DollarSign className="w-3 h-3 text-slate-600" />
                <span>${(meal.cost_estimate_ars / 1000).toFixed(1)}k</span>
              </div>
            )}
          </div>

          {/* Tags */}
          {meal.tags && meal.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {meal.tags.slice(0, 2).map((tag, index) => (
                <KeBadge
                  key={index}
                  variant="default"
                  size="sm"
                  className="text-xs"
                >
                  {tag}
                </KeBadge>
              ))}
              {meal.tags.length > 2 && (
                <KeBadge variant="default" size="sm" className="text-xs">
                  +{meal.tags.length - 2}
                </KeBadge>
              )}
            </div>
          )}

          {/* Ingredients preview */}
          {meal.ingredients && meal.ingredients.length > 0 && (
            <div className="text-xs text-gray-600">
              <p className="truncate">
                {meal.ingredients.slice(0, 3).map(ing => ing.name).join(', ')}
                {meal.ingredients.length > 3 && '...'}
              </p>
            </div>
          )}
        </KeCardContent>

        {/* Actions footer (mobile only) */}
        <KeCardFooter className="pt-3 block md:hidden">
          <div className="flex gap-2">
            <KeButton
              variant="ghost"
              size="sm"
              leftIcon={<Edit className="w-3 h-3" />}
              className="flex-1 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.();
              }}
            >
              Editar
            </KeButton>
            <KeButton
              variant="ghost"
              size="sm"
              leftIcon={<Copy className="w-3 h-3" />}
              className="flex-1 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate?.();
              }}
            >
              Copiar
            </KeButton>
            {onAddToShoppingList && (
              <KeButton
                variant="ghost"
                size="sm"
                leftIcon={<ShoppingCart className="w-3 h-3" />}
                className="flex-1 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddToShoppingList();
                }}
              >
                Comprar
              </KeButton>
            )}
          </div>
        </KeCardFooter>

        {/* Hover overlay (desktop) */}
        <div className="absolute inset-0 bg-slate-500/10 opacity-0 hover:opacity-100 transition-opacity duration-200 hidden md:flex items-center justify-center">
          <div className="flex gap-2">
            <KeButton
              variant="secondary"
              size="sm"
              leftIcon={<Edit className="w-4 h-4" />}
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.();
              }}
            >
              Editar
            </KeButton>
            <KeButton
              variant="outline"
              size="sm"
              leftIcon={<Copy className="w-4 h-4" />}
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate?.();
              }}
            >
              Copiar
            </KeButton>
            {onAddToShoppingList && (
              <KeButton
                variant="outline"
                size="sm"
                leftIcon={<ShoppingCart className="w-4 h-4" />}
                onClick={(e) => {
                  e.stopPropagation();
                  onAddToShoppingList();
                }}
              >
                Comprar
              </KeButton>
            )}
          </div>
        </div>

        {/* Drag handle indicator */}
        {isDragging && (
          <div className="absolute top-2 right-2 w-2 h-2 bg-slate-500 rounded-full animate-pulse" />
        )}
      </KeCard>
    </motion.div>
  );
});

MealCard.displayName = 'MealCard';
