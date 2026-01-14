import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SortableWidgetProps {
    id: string;
    children: React.ReactNode;
    isCustomizing: boolean;
    className?: string; // Add className prop
}

export const SortableWidget: React.FC<SortableWidgetProps> = ({ id, children, isCustomizing, className }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
        position: 'relative' as const,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                isDragging ? "opacity-50" : "",
                isCustomizing && "ring-2 ring-dashed ring-gray-200 dark:ring-white/20 rounded-xl",
                className // Apply custom classes
            )}
        >
            {isCustomizing && (
                <div
                    {...attributes}
                    {...listeners}
                    className="absolute top-2 right-2 z-50 p-2 bg-white/90 dark:bg-slate-800/90 backdrop-blur rounded-full shadow-sm dark:shadow-black/20 cursor-grab active:cursor-grabbing hover:bg-gray-50 dark:hover:bg-slate-700"
                >
                    <GripVertical className="w-4 h-4 text-gray-400" />
                </div>
            )}
            {children}
        </div>
    );
};
