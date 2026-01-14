import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface PantryStatusWidgetProps {
    totalItems: number;
    expiringSoon: number;
    items?: Array<{
        name: string;
        daysUntilExpiry?: number;
    }>;
}

export const PantryStatusWidget: React.FC<PantryStatusWidgetProps> = ({
    totalItems,
    expiringSoon,
    items = []
}) => {
    const router = useRouter();

    return (
        <div className="p-4">
            <div className="bg-gray-50 dark:bg-white/5 p-6 rounded-3xl border border-gray-200 dark:border-white/10">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-black text-slate-900 dark:text-white tracking-tighter flex items-center gap-2">Despensa</h3>
                    {expiringSoon > 0 && (
                        <span className="text-xs font-bold text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-500/20 px-2 py-1 rounded-full">{expiringSoon} venceran pronto</span>
                    )}
                </div>
                <ul className="space-y-3">
                    {items.length > 0 ? (
                        items.slice(0, 3).map((item, i) => (
                            <li key={i} className="flex items-center justify-between text-sm group cursor-default">
                                <span className="text-slate-700 dark:text-gray-300">{item.name}</span>
                                <span className={cn(
                                    "w-2 h-2 rounded-full ring-2 ring-gray-50 dark:ring-slate-800",
                                    (item.daysUntilExpiry !== undefined && item.daysUntilExpiry <= 3) ? "bg-orange-500" : "bg-gray-400 dark:bg-gray-500"
                                )} />
                            </li>
                        ))
                    ) : (
                        <li className="text-sm text-gray-500 dark:text-gray-400 italic">No hay items por vencer</li>
                    )}
                </ul>
                <Button
                    onClick={() => router.push('/despensa')}
                    variant="outline"
                    className="w-full mt-6 rounded-xl h-10 text-xs uppercase font-bold tracking-widest text-gray-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-900 dark:hover:border-white/30 dark:border-white/10"
                >
                    Ver Inventario
                </Button>
            </div>
        </div>
    );
};
