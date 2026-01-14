'use client';

import React, { useState } from 'react';
import jsPDF from 'jspdf';
import { format, startOfWeek, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

import type { WeekPlan, MealSlot, MealType, NutritionInfo } from '../types';

const MEAL_ORDER: MealType[] = ['desayuno', 'almuerzo', 'merienda', 'cena'];
const MEAL_LABELS: Record<MealType, string> = {
    desayuno: '☕ Desayuno',
    almuerzo: '☀️ Almuerzo',
    merienda: '🍎 Merienda',
    cena: '🌙 Cena'
};

const DAY_LABELS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

interface PDFSectionOptions {
    title: string;
    startY: number;
}

/**
 * Generates a PDF document from a week meal plan
 */
export async function generateMealPlanPDF(
    weekPlan: WeekPlan | null,
    currentDate: Date
): Promise<void> {
    if (!weekPlan || !weekPlan.slots || weekPlan.slots.length === 0) {
        toast.error('No hay comidas planificadas para exportar');
        return;
    }

    try {
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 15;
        const contentWidth = pageWidth - 2 * margin;

        let yPosition = margin;

        // ===== HEADER =====
        // Background gradient effect (simulated with rectangles)
        doc.setFillColor(249, 115, 22); // orange-500
        doc.rect(0, 0, pageWidth, 45, 'F');

        // Title
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text('🍽️ Plan de Comidas Semanal', pageWidth / 2, 20, { align: 'center' });

        // Week date range
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
        const weekEnd = addDays(weekStart, 6);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(
            `Semana del ${format(weekStart, 'd MMM', { locale: es })} al ${format(weekEnd, 'd MMM yyyy', { locale: es })}`,
            pageWidth / 2,
            32,
            { align: 'center' }
        );

        // Generated date
        doc.setFontSize(9);
        doc.text(
            `Generado: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })}`,
            pageWidth / 2,
            40,
            { align: 'center' }
        );

        yPosition = 55;

        // ===== NUTRITION SUMMARY =====
        const nutritionSummary = calculateWeekNutrition(weekPlan.slots);

        doc.setFillColor(254, 243, 199); // yellow-100
        doc.roundedRect(margin, yPosition, contentWidth, 20, 3, 3, 'F');

        doc.setTextColor(146, 64, 14); // yellow-800
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('📊 Resumen Nutricional Semanal', margin + 5, yPosition + 7);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        const nutritionText = [
            `🔥 ${nutritionSummary.calories.toLocaleString()} kcal`,
            `💪 ${nutritionSummary.protein}g proteína`,
            `🍞 ${nutritionSummary.carbs}g carbos`,
            `🥑 ${nutritionSummary.fat}g grasa`
        ].join('  |  ');
        doc.text(nutritionText, margin + 5, yPosition + 15);

        yPosition += 28;

        // ===== DAILY MEAL PLANS =====
        doc.setTextColor(31, 41, 55); // gray-800

        // Group slots by day
        const slotsByDay = groupSlotsByDay(weekPlan.slots);

        for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
            const dayDate = addDays(weekStart, dayIndex);
            const daySlots = slotsByDay[dayIndex] || [];

            // Calculate daily nutrition
            const dailyNutrition = calculateDailyNutrition(daySlots);

            // Check if we need a new page
            if (yPosition > pageHeight - 80) {
                doc.addPage();
                yPosition = margin;
            }

            // Day header with daily nutrition
            doc.setFillColor(243, 244, 246); // gray-100
            doc.roundedRect(margin, yPosition, contentWidth, 14, 2, 2, 'F');

            doc.setTextColor(31, 41, 55);
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.text(
                `${DAY_LABELS[dayIndex]} - ${format(dayDate, 'd MMM', { locale: es })}`,
                margin + 5,
                yPosition + 7
            );

            // Daily nutrition summary
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(107, 114, 128);
            const dailyNutritionText = `${dailyNutrition.calories} kcal | ${dailyNutrition.protein}g P | ${dailyNutrition.carbs}g C | ${dailyNutrition.fat}g G`;
            doc.text(dailyNutritionText, pageWidth - margin - 5, yPosition + 7, { align: 'right' });

            yPosition += 18;

            // Meals for this day
            for (const mealType of MEAL_ORDER) {
                const slot = daySlots.find(s => s.mealType === mealType);

                // Check if we need more space for detailed meal info
                if (yPosition > pageHeight - 40) {
                    doc.addPage();
                    yPosition = margin;
                }

                doc.setFontSize(9);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(107, 114, 128); // gray-500
                doc.text(MEAL_LABELS[mealType], margin + 3, yPosition + 4);

                doc.setFont('helvetica', 'normal');
                doc.setTextColor(31, 41, 55);

                if (slot?.recipe) {
                    const recipeName = slot.recipe.name || slot.recipe.title || slot.customMealName || 'Sin nombre';
                    doc.setFontSize(9);
                    doc.setFont('helvetica', 'bold');
                    doc.text(recipeName, margin + 35, yPosition + 4);

                    // Prep time and difficulty
                    let metaInfo = [];
                    const prepTime = (slot.recipe.prepTime || 0) + (slot.recipe.cookTime || 0);
                    if (prepTime > 0) {
                        metaInfo.push(`⏱ ${prepTime} min`);
                    }
                    if (slot.recipe.difficulty) {
                        const difficultyMap: Record<string, string> = {
                            easy: '✓ Fácil',
                            medium: '⚡ Media',
                            hard: '⭐ Difícil'
                        };
                        metaInfo.push(difficultyMap[slot.recipe.difficulty] || slot.recipe.difficulty);
                    }

                    if (metaInfo.length > 0) {
                        doc.setFontSize(7);
                        doc.setFont('helvetica', 'normal');
                        doc.setTextColor(156, 163, 175);
                        doc.text(metaInfo.join(' | '), margin + 35, yPosition + 8);
                    }

                    // Nutrition info for this meal
                    if (slot.recipe.nutrition) {
                        doc.setTextColor(249, 115, 22); // orange-500
                        doc.setFontSize(8);
                        doc.setFont('helvetica', 'bold');
                        const mealNutrition = `${slot.recipe.nutrition.calories || 0} kcal`;
                        doc.text(mealNutrition, pageWidth - margin - 5, yPosition + 4, { align: 'right' });

                        // Macros
                        doc.setFontSize(7);
                        doc.setTextColor(107, 114, 128);
                        const macros = `P:${slot.recipe.nutrition.protein || 0}g C:${slot.recipe.nutrition.carbs || 0}g G:${slot.recipe.nutrition.fat || 0}g`;
                        doc.text(macros, pageWidth - margin - 5, yPosition + 8, { align: 'right' });
                    }

                    // Description (if available and fits)
                    if (slot.recipe.description && yPosition < pageHeight - 50) {
                        doc.setFontSize(7);
                        doc.setFont('helvetica', 'normal');
                        doc.setTextColor(107, 114, 128);
                        const maxDescWidth = contentWidth - 40;
                        const descLines = doc.splitTextToSize(slot.recipe.description, maxDescWidth);
                        // Only show first line to keep it compact
                        if (descLines.length > 0) {
                            doc.text(descLines[0], margin + 35, yPosition + 12);
                        }
                        yPosition += 4;
                    }

                    yPosition += 12;
                } else {
                    doc.setTextColor(156, 163, 175);
                    doc.text('Sin planificar', margin + 35, yPosition + 4);
                    yPosition += 8;
                }
            }

            yPosition += 3;
        }

        // ===== SHOPPING LIST =====
        // Always start shopping list on a new page
        doc.addPage();
        yPosition = margin;

        // Header
        doc.setFillColor(220, 252, 231); // green-100
        doc.roundedRect(margin, yPosition, contentWidth, 12, 3, 3, 'F');

        doc.setTextColor(22, 101, 52); // green-800
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('🛒 Lista de Compras Semanal', margin + 5, yPosition + 8);

        yPosition += 18;

        // Get consolidated shopping list
        const shoppingList = consolidateShoppingList(weekPlan.slots);
        const sortedIngredients = Array.from(shoppingList.entries()).sort((a, b) =>
            a[0].localeCompare(b[0], 'es')
        );

        doc.setTextColor(31, 41, 55);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(`Total de ingredientes: ${sortedIngredients.length}`, margin, yPosition);
        yPosition += 8;

        // List ingredients in two columns for space efficiency
        const columnWidth = (contentWidth - 5) / 2;
        let leftColumnY = yPosition;
        let rightColumnY = yPosition;
        let useLeftColumn = true;

        for (const [ingredientName, details] of sortedIngredients) {
            const currentY = useLeftColumn ? leftColumnY : rightColumnY;
            const currentX = useLeftColumn ? margin : margin + columnWidth + 5;

            // Check if we need a new page
            if (currentY > pageHeight - 20) {
                if (!useLeftColumn) {
                    // Both columns full, new page
                    doc.addPage();
                    leftColumnY = margin;
                    rightColumnY = margin;
                    useLeftColumn = true;
                    continue;
                } else {
                    // Switch to right column
                    useLeftColumn = false;
                    continue;
                }
            }

            // Ingredient checkbox and name
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(31, 41, 55);

            // Checkbox
            doc.rect(currentX, currentY - 2, 3, 3);

            // Ingredient name
            const ingredientText = doc.splitTextToSize(ingredientName, columnWidth - 8);
            doc.text(ingredientText[0], currentX + 5, currentY + 1);

            // Quantity and unit
            doc.setFontSize(7);
            doc.setTextColor(107, 114, 128);
            const quantityText = `${details.totalQuantity.toFixed(0)} ${details.unit}`;
            doc.text(quantityText, currentX + 5, currentY + 5);

            const lineHeight = 7;
            if (useLeftColumn) {
                leftColumnY += lineHeight;
            } else {
                rightColumnY += lineHeight;
            }

            useLeftColumn = !useLeftColumn;
        }

        yPosition = Math.max(leftColumnY, rightColumnY) + 5;

        // ===== FOOTER =====
        yPosition = pageHeight - 15;
        doc.setTextColor(156, 163, 175);
        doc.setFontSize(8);
        doc.text('Generado por ¿Qué carajo como? 🍳', pageWidth / 2, yPosition, { align: 'center' });
        doc.text('kecarajocomo.app', pageWidth / 2, yPosition + 5, { align: 'center' });

        // Save the PDF
        const fileName = `plan-comidas-${format(weekStart, 'yyyy-MM-dd')}.pdf`;
        doc.save(fileName);

        toast.success('PDF descargado correctamente', {
            description: fileName
        });
    } catch (error) {
        console.error('Error generating PDF:', error);
        toast.error('Error al generar el PDF');
        throw error;
    }
}

/**
 * Groups meal slots by day of week
 */
function groupSlotsByDay(slots: MealSlot[]): Record<number, MealSlot[]> {
    const grouped: Record<number, MealSlot[]> = {};

    for (const slot of slots) {
        // dayOfWeek: 0 = Sunday, 1 = Monday, etc. We need to adjust for our Monday-first display
        const adjustedDay = slot.dayOfWeek === 0 ? 6 : slot.dayOfWeek - 1;
        if (!grouped[adjustedDay]) {
            grouped[adjustedDay] = [];
        }
        grouped[adjustedDay].push(slot);
    }

    return grouped;
}

/**
 * Calculates total nutrition for the week
 */
function calculateWeekNutrition(slots: MealSlot[]): NutritionInfo {
    const totals: NutritionInfo = {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0
    };

    for (const slot of slots) {
        if (slot.recipe?.nutrition) {
            totals.calories += slot.recipe.nutrition.calories || 0;
            totals.protein += slot.recipe.nutrition.protein || 0;
            totals.carbs += slot.recipe.nutrition.carbs || 0;
            totals.fat += slot.recipe.nutrition.fat || 0;
        }
    }

    return totals;
}

/**
 * Calculates total nutrition for a single day
 */
function calculateDailyNutrition(daySlots: MealSlot[]): NutritionInfo {
    const totals: NutritionInfo = {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0
    };

    for (const slot of daySlots) {
        if (slot.recipe?.nutrition) {
            totals.calories += slot.recipe.nutrition.calories || 0;
            totals.protein += slot.recipe.nutrition.protein || 0;
            totals.carbs += slot.recipe.nutrition.carbs || 0;
            totals.fat += slot.recipe.nutrition.fat || 0;
        }
    }

    return totals;
}

/**
 * Counts unique ingredients across all meals
 */
function countUniqueIngredients(slots: MealSlot[]): number {
    const uniqueIngredients = new Set<string>();

    for (const slot of slots) {
        if (slot.recipe?.ingredients) {
            for (const ingredient of slot.recipe.ingredients) {
                uniqueIngredients.add(ingredient.name.toLowerCase());
            }
        }
    }

    return uniqueIngredients.size;
}

/**
 * Consolidates shopping list by combining quantities of the same ingredient
 */
function consolidateShoppingList(slots: MealSlot[]): Map<string, { totalQuantity: number; unit: string }> {
    const consolidatedList = new Map<string, { totalQuantity: number; unit: string }>();

    for (const slot of slots) {
        if (slot.recipe?.ingredients) {
            for (const ingredient of slot.recipe.ingredients) {
                const ingredientKey = ingredient.name.toLowerCase().trim();
                const quantity = ingredient.quantity || 0;
                const unit = ingredient.unit || 'unidad';

                if (consolidatedList.has(ingredientKey)) {
                    const existing = consolidatedList.get(ingredientKey)!;
                    // Only sum if units match, otherwise keep separate
                    if (existing.unit === unit) {
                        existing.totalQuantity += quantity;
                    } else {
                        // Create a new key with unit suffix if units don't match
                        const newKey = `${ingredientKey} (${unit})`;
                        consolidatedList.set(newKey, { totalQuantity: quantity, unit });
                    }
                } else {
                    // Capitalize first letter for display
                    const displayName = ingredient.name.charAt(0).toUpperCase() + ingredient.name.slice(1);
                    consolidatedList.set(displayName, { totalQuantity: quantity, unit });
                }
            }
        }
    }

    return consolidatedList;
}

/**
 * Export button component for the meal planner
 */
interface ExportPDFButtonProps {
    weekPlan: WeekPlan | null;
    currentDate: Date;
    className?: string;
}

export function ExportPDFButton({ weekPlan, currentDate, className }: ExportPDFButtonProps) {
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async () => {
        setIsExporting(true);
        try {
            await generateMealPlanPDF(weekPlan, currentDate);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <button
            onClick={handleExport}
            disabled={isExporting || !weekPlan?.slots?.length}
            className={className}
            title="Descargar PDF"
        >
            {isExporting ? (
                <span className="animate-spin">⏳</span>
            ) : (
                <span>📥</span>
            )}
        </button>
    );
}


