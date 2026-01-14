'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useSwipeable } from 'react-swipeable';
import { MealCard, MealSlotType } from './MealCard';

interface DayViewProps {
    date: Date;
    meals: Record<MealSlotType, any>; // Using any for the meal object for now
    onAddMeal: (type: MealSlotType) => void;
    onRemoveMeal: (type: MealSlotType) => void;
    onRegenerateMeal: (type: MealSlotType) => void;
    onViewMeal: (type: MealSlotType) => void;
    onNextDay: () => void;
    onPrevDay: () => void;
}

export function DayView({
    date,
    meals,
    onAddMeal,
    onRemoveMeal,
    onRegenerateMeal,
    onViewMeal,
    onNextDay,
    onPrevDay
}: DayViewProps) {
    // Swipe handlers
    const handlers = useSwipeable({
        onSwipedLeft: () => onNextDay(),
        onSwipedRight: () => onPrevDay(),
        preventScrollOnSwipe: true,
        trackMouse: true
    });

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const slots: MealSlotType[] = ['breakfast', 'lunch', 'snack', 'dinner'];

    return (
        <div {...handlers} className="min-h-[500px]">
            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="p-4 space-y-4 pb-24" // padding-bottom for mobile nav clearance
            >
                {slots.map((slot) => {
                    const meal = meals[slot];
                    return (
                        <MealCard
                            key={slot}
                            type={slot}
                            title={meal?.title}
                            image={meal?.image}
                            prepTime={meal?.prepTime}
                            calories={meal?.calories}
                            onAdd={() => onAddMeal(slot)}
                            onRemove={() => onRemoveMeal(slot)}
                            onRegenerate={() => onRegenerateMeal(slot)}
                            onView={() => onViewMeal(slot)}
                        />
                    );
                })}
            </motion.div>
        </div>
    );
}
