import React from 'react';
import { Calendar, ChefHat, Package, ShoppingCart } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

export const ActionGridWidget: React.FC = () => {
    const router = useRouter();

    const items = [
        { label: 'Planificar', icon: Calendar, color: 'text-slate-700 dark:text-gray-300', href: '/planificador' },
        { label: 'Recetas', icon: ChefHat, color: 'text-slate-700 dark:text-gray-300', href: '/recetas' },
        { label: 'Despensa', icon: Package, color: 'text-slate-700 dark:text-gray-300', href: '/despensa' },
        { label: 'Compras', icon: ShoppingCart, color: 'text-orange-500', href: '/lista-compras' },
    ];

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-4">
            {items.map((item) => (
                <button
                    key={item.label}
                    onClick={() => router.push(item.href)}
                    className="p-6 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10 hover:border-slate-900 dark:hover:border-white/30 transition-all text-left group"
                >
                    <item.icon className={cn("w-8 h-8 mb-4", item.color)} />
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">{item.label}</h3>
                    <div className="w-8 h-1 bg-gray-200 dark:bg-white/20 rounded-full mt-2 group-hover:w-full group-hover:bg-orange-500 transition-all" />
                </button>
            ))}
        </div>
    );
};
