'use client';

import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { addDays, format, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';

interface WeekStripProps {
    currentDate: Date;
    onSelectDate: (date: Date) => void;
    startDate?: Date; // Defaults to today/monday if not provided
}

export function WeekStrip({
    currentDate,
    onSelectDate,
    startDate = new Date(),
}: WeekStripProps) {
    // Generate 2 weeks of dates for smooth scrolling future planning
    const days = React.useMemo(() => {
        // Start from Monday of the current week if possible, or just the startDate
        // For this MVP let's show +/- 3 days from "today" or just 14 days forward
        const start = new Date(startDate);
        // Align to Monday? Optional. Let's just do 14 days from start.
        return Array.from({ length: 14 }, (_, i) => addDays(start, i));
    }, [startDate]);

    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to selected date on mount or change
    useEffect(() => {
        if (scrollRef.current) {
            // Simple logic: find screen center and item center... 
            // For MVP just standard scroll
        }
    }, [currentDate]);

    return (
        <div className="w-full overflow-hidden py-4">
            <div
                ref={scrollRef}
                className="flex space-x-3 overflow-x-auto px-4 pb-2 hide-scrollbar snap-x snap-mandatory"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {days.map((day) => {
                    const isSelected = isSameDay(day, currentDate);
                    const isToday = isSameDay(day, new Date());

                    return (
                        <motion.button
                            key={day.toISOString()}
                            onClick={() => onSelectDate(day)}
                            className={`
                relative flex-shrink-0 flex flex-col items-center justify-center 
                w-[60px] h-[80px] rounded-2xl snap-center transition-all duration-300
                ${isSelected
                                    ? 'bg-black text-white shadow-lg transform scale-105 z-10'
                                    : 'bg-white/80 backdrop-blur-md border border-gray-200 text-gray-600 hover:bg-white'
                                }
              `}
                            whileTap={{ scale: 0.95 }}
                            initial={false}
                            animate={{
                                scale: isSelected ? 1.05 : 1,
                                y: isSelected ? -2 : 0
                            }}
                        >
                            <span className={`text-xs font-medium uppercase mb-1 ${isSelected ? 'text-white/90' : 'text-gray-500'}`}>
                                {format(day, 'EEE', { locale: es }).slice(0, 3)}
                            </span>
                            <span className={`text-xl font-bold ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                                {format(day, 'd')}
                            </span>

                            {isToday && !isSelected && (
                                <div className="absolute bottom-2 w-1 h-1 rounded-full bg-slate-700" />
                            )}
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
}
