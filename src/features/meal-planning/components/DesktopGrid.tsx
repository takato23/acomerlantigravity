/**
 * DesktopGrid - Vista desktop del planificador (grid 7x4)
 * Drag & Drop, design system KeCard, responsive
 */

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Calendar,
  TrendingUp,
  DollarSign,
  Clock,
  Beef
} from 'lucide-react';
import { format, addDays, startOfWeek } from 'date-fns';
import { format, addDays, startOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
  DragStartEvent,
  DragEndEvent,
  useDraggable,
  useDroppable,
} from '@dnd-kit/core';
import {
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';

import {
  KeCard,
  KeCardHeader,
  KeCardTitle,
  KeCardContent,
  KeButton,
  KeBadge
} from '@/components/ui';
import { cn } from '@/lib/utils';
import { MealCard } from './MealCard';

interface DesktopGridProps {
  currentDate: Date;
  weekPlan: any; // TODO: Type this properly
  onRecipeSelect: (slot: { dayOfWeek: number; mealType: any }) => void;
  onMealEdit?: (meal: any, slot: any) => void;
  onMealDuplicate?: (meal: any, slot: any) => void;
  isLoading?: boolean;
  rangeDays?: number;
  rangeDays?: number;
  onMealMove?: (fromSlotId: string, toDayOfWeek: number, toMealType: string) => void;
  onMealDelete?: (slotId: string) => void;
}

const MEAL_TYPES = ['desayuno', 'almuerzo', 'merienda', 'cena'] as const;
const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export function DesktopGrid({
  currentDate,
  weekPlan,
  onRecipeSelect,
  onMealEdit,
  onMealDuplicate,
  isLoading = false,
  rangeDays = 7,
  isLoading = false,
  rangeDays = 7,
  onMealMove,
  onMealDelete
}: DesktopGridProps) {
  const [hoveredSlot, setHoveredSlot] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeMeal, setActiveMeal] = useState<any | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);

    // Find the meal data for the overlay
    const [dayIndex, mealType] = (active.id as string).split('|'); // Assuming ID format: index|type
    const meal = weekPlan?.[parseInt(dayIndex)]?.[mealType];
    setActiveMeal(meal);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setActiveMeal(null);

    if (over && active.id !== over.id) {
      // Parse source
      const [fromDayIndex, fromMealType] = (active.id as string).split('|');

      // Parse target
      const [toDayIndex, toMealType] = (over.id as string).split('|');

      // Call handler
      if (onMealMove) {
        // Create a composite ID that the store can use to find the source slot if needed, 
        // BUT looking at moveMealSlot in store, it expects a `fromSlotId`.
        // The `weekPlan` passed here is "adapted" data (just the meal content), not the raw slots.
        // Effectively, `weekPlan[day][type]` has `id` which IS the recipeId, not the slotId.
        // WAIT. `weekPlan` from `adaptMealDataForGrid` does NOT contain the slot ID. It contains `id: slot.recipeId`.
        // This is a problem. I need the SLOT ID to move it.

        // ERROR: `adaptMealDataForGrid` returns a structured object but loses the original Slot ID.
        // I need to fix `adaptMealDataForGrid` in `MealPlannerGrid.tsx` to include `slotId`.

        // Assuming I will fix `adaptMealDataForGrid` to include `slotId`.
        const sourceMeal = weekPlan?.[parseInt(fromDayIndex)]?.[fromMealType];
        if (sourceMeal?.slotId) {
          onMealMove(sourceMeal.slotId, parseInt(toDayIndex), toMealType);
        }
      }
    }
  };

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });

  // Calculate week stats
  const getWeekStats = () => {
    let totalKcal = 0;
    let totalProtein = 0;
    let totalCost = 0;
    let mealsPlanned = 0;

    for (let day = 0; day < rangeDays; day++) {
      for (const mealType of MEAL_TYPES) {
        const meal = weekPlan?.[day]?.[mealType];
        if (meal) {
          totalKcal += meal.macros?.kcal || 0;
          totalProtein += meal.macros?.protein_g || 0;
          totalCost += meal.cost_estimate_ars || 0;
          mealsPlanned++;
        }
      }
    }

    return {
      totalKcal,
      totalProtein,
      totalCost,
      mealsPlanned,
      totalSlots: rangeDays * MEAL_TYPES.length,
      completionPercentage: Math.round((mealsPlanned / (rangeDays * MEAL_TYPES.length)) * 100)
    };
  };

  const weekStats = getWeekStats();

  return (
    <div className="space-y-6">
      {/* Week Stats Header */}
      <KeCard variant="default">
        <KeCardHeader>
          <div className="flex items-center justify-between">
            <div>
              <KeCardTitle className="text-xl">
                Planificación Semanal
              </KeCardTitle>
              <p className="text-sm text-slate-600">
                {format(weekStart, "d 'de' MMMM", { locale: es })} - {format(addDays(weekStart, rangeDays - 1), "d 'de' MMMM", { locale: es })}
              </p>
            </div>

            <div className="flex gap-3">
              <KeButton
                variant="primary"
                leftIcon={<Sparkles className="w-4 h-4" />}
              >
                Generar semana con IA
              </KeButton>
            </div>
          </div>
        </KeCardHeader>

        <KeCardContent>
          <div className="grid grid-cols-4 gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-medium text-slate-600">Kcal Totales</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">
                {weekStats.totalKcal.toLocaleString()}
              </p>
              <p className="text-xs text-slate-500">
                ~{Math.round(weekStats.totalKcal / 7)} por día
              </p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Beef className="w-4 h-4 text-red-500" />
                <span className="text-sm font-medium text-slate-600">Proteina</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">
                {weekStats.totalProtein.toFixed(0)}g
              </p>
              <p className="text-xs text-slate-500">
                ~{Math.round(weekStats.totalProtein / 7)}g por día
              </p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium text-slate-600">Costo Estimado</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">
                ${(weekStats.totalCost / 1000).toFixed(1)}k
              </p>
              <p className="text-xs text-slate-500">
                ~${(weekStats.totalCost / 7000).toFixed(1)}k por día
              </p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium text-slate-600">Progreso</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">
                {weekStats.completionPercentage}%
              </p>
              <p className="text-xs text-slate-500">
                {weekStats.mealsPlanned}/{weekStats.totalSlots} comidas
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${weekStats.completionPercentage}%` }}
              />
            </div>
          </div>
        </KeCardContent>
      </KeCard>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <KeCard variant="default" className="overflow-hidden">
          <KeCardContent className="p-0">
            <div className="grid grid-cols-8 min-h-[600px]">
              {/* Header row with meal types */}
              <div className="bg-slate-50 border-r border-b border-slate-200"></div>
              {MEAL_TYPES.map((mealType) => (
                <div
                  key={mealType}
                  className="bg-slate-50 border-r border-b border-slate-200 p-3 text-center"
                >
                  <p className="text-sm font-medium text-slate-700 capitalize">
                    {mealType}
                  </p>
                </div>
              ))}

              {/* Grid rows - Days */}
              {Array.from({ length: rangeDays }).map((_, dayIndex) => (
                <div key={dayIndex} className="contents">
                  {/* Day label */}
                  <div className="bg-slate-50 border-r border-b border-slate-200 p-3 flex flex-col justify-center">
                    <p className="text-sm font-medium text-slate-700">
                      {DAYS[dayIndex % 7]}
                    </p>
                    <p className="text-xs text-slate-500">
                      {format(addDays(weekStart, dayIndex), 'd/M')}
                    </p>
                  </div>

                  {/* Meal slots */}
                  {MEAL_TYPES.map((mealType, mealIndex) => {
                    // Use a composite ID for DnD: dayIndex|mealType
                    const dndId = `${dayIndex}|${mealType}`;
                    const meal = weekPlan?.[dayIndex]?.[mealType];
                    const isHovered = hoveredSlot === dndId;

                    return (
                      <DraggableSlot
                        key={dndId}
                        id={dndId}
                        meal={meal}
                        mealType={mealType}
                        dayIndex={dayIndex}
                        onMouseEnter={() => setHoveredSlot(dndId)}
                        onMouseLeave={() => setHoveredSlot(null)}
                        onRecipeSelect={onRecipeSelect}
                        onMealEdit={onMealEdit}
                        onMealDuplicate={onMealDuplicate}
                        onMealDelete={onMealDelete}
                        onAddToShoppingList={meal ? () => onAddToShoppingList?.(meal) : undefined}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </KeCardContent>
        </KeCard>

        <DragOverlay dropAnimation={{
          sideEffects: defaultDropAnimationSideEffects({
            styles: {
              active: {
                opacity: '0.5',
              },
            },
          }),
        }}>
          {activeId && activeMeal ? (
            <div className="w-[180px]">
              <MealCard
                meal={activeMeal}
                mealType={activeId.split('|')[1] as any}
                dayOfWeek={parseInt(activeId.split('|')[0])}
                isDragging={true}
                className="h-full shadow-2xl rotate-3 cursor-grabbing"
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Quick Actions */}
      <div className="flex gap-4 justify-center">
        <KeButton
          variant="outline"
          leftIcon={<Calendar className="w-4 h-4" />}
        >
          Duplicar semana
        </KeButton>

        <KeButton
          variant="outline"
          leftIcon={<Clock className="w-4 h-4" />}
        >
          Limpiar semana
        </KeButton>

        <KeButton
          variant="secondary"
          leftIcon={<TrendingUp className="w-4 h-4" />}
        >
          Ver análisis nutricional
        </KeButton>
      </div>

      {/* Loading overlay */}
      {
        isLoading && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-white rounded-xl p-6 shadow-xl">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-slate-600">Generando plan semanal...</p>
            </div>
          </div>
        )
      }
    </div>
  );
}

// Separate component for droppable cell to optimize rendering
function DraggableSlot({
  id,
  dayIndex,
  mealType,
  meal,
  onRecipeSelect,
  onMealEdit,
  onMealDuplicate,
  onMealDelete,
  onAddToShoppingList
}: any) {
  const { isOver, setNodeRef } = useDroppable({
    id: id,
  });

  const { attributes, listeners, setNodeRef: setDraggableRef, transform, isDragging } = useDraggable({
    id: id,
    data: { dayIndex, mealType, meal },
    disabled: !meal
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "border-r border-b border-slate-200 min-h-[140px] p-2 transition-colors relative",
        isOver && "bg-blue-50/50"
      )}
    >
      <div
        ref={setDraggableRef}
        style={style}
        {...listeners}
        {...attributes}
        className="h-full"
      >
        <MealCard
          meal={meal}
          mealType={mealType}
          dayOfWeek={dayIndex}
          isDropTarget={isOver}
          isDragging={isDragging}
          onClick={() => onRecipeSelect({ dayOfWeek: dayIndex, mealType })}
          onEdit={() => onMealEdit?.(meal, { dayOfWeek: dayIndex, mealType })}
          onDuplicate={() => onMealDuplicate?.(meal, { dayOfWeek: dayIndex, mealType })}
          onDelete={() => onMealDelete?.(id)}
          onAddToShoppingList={onAddToShoppingList}
          className="h-full"
        />
      </div>
    </div>
  );
}