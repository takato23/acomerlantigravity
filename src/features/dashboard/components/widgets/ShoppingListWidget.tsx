import React from 'react';
import { ShoppingCart, X, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ShoppingListWidgetProps {
    items: string[];
    newItemValue: string;
    onNewItemChange: (value: string) => void;
    onAddItem: (e: React.FormEvent) => void;
    onRemoveItem: (index: number) => void;
}

export const ShoppingListWidget: React.FC<ShoppingListWidgetProps> = ({
    items,
    newItemValue,
    onNewItemChange,
    onAddItem,
    onRemoveItem
}) => {
    return (
        <div className="p-4 h-full">
            <div className="bg-gray-50 dark:bg-white/5 text-slate-900 dark:text-white p-6 rounded-3xl border border-gray-200 dark:border-white/10 flex flex-col h-full min-h-[300px]">
                <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-black tracking-tighter flex items-center gap-2"><ShoppingCart className="w-4 h-4" /> Compras</h3>
                        <span className="text-xs font-bold bg-orange-100 dark:bg-orange-500/20 px-2 py-1 rounded-full text-orange-600 dark:text-orange-400">{items.length} items</span>
                    </div>

                    <ul className="space-y-1 mb-6 flex-1">
                        <AnimatePresence initial={false}>
                            {items.map((item, i) => (
                                <motion.li
                                    key={`${item}-${i}`}
                                    initial={{ opacity: 0, height: 0, x: -20 }}
                                    animate={{ opacity: 1, height: 'auto', x: 0 }}
                                    exit={{ opacity: 0, height: 0, x: 20 }}
                                    className="flex items-center justify-between text-sm py-2 px-3 rounded-lg hover:bg-white dark:hover:bg-white/5 group cursor-pointer"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-4 h-4 rounded border border-gray-300 dark:border-white/20 group-hover:border-slate-900 dark:group-hover:border-white/40 transition-colors" />
                                        <span className="text-slate-700 dark:text-gray-300">{item}</span>
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onRemoveItem(i); }}
                                        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-slate-900 dark:hover:text-white transition-all"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </motion.li>
                            ))}
                        </AnimatePresence>
                    </ul>

                    <form onSubmit={onAddItem} className="relative mt-auto">
                        <input
                            type="text"
                            value={newItemValue}
                            onChange={(e) => onNewItemChange(e.target.value)}
                            placeholder="Agregar rapido..."
                            className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 pl-10 text-sm text-slate-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-slate-900 dark:focus:border-white/30 transition-all font-medium"
                        />
                        <Plus className="w-4 h-4 absolute left-3 top-3.5 text-gray-400" />
                    </form>
                </div>
            </div>
        </div>
    );
};
