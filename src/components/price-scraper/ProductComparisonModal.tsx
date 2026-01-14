import React from 'react';
import { StoreProduct } from '@/lib/services/enhancedStoreScraper';
import { DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, TrendingDown, TrendingUp, AlertCircle, ShoppingCart, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useShoppingList } from '@/hooks/useShoppingList';
import { toast } from 'sonner';

interface ProductComparisonModalProps {
    product: StoreProduct;
    variations: StoreProduct[];
}

const STORE_LOGOS: Record<string, string> = {
    'jumbo': 'https://upload.wikimedia.org/wikipedia/commons/d/d3/Logo_Jumbo_Cencosud.png',
    'carrefour': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Carrefour_logo.svg/1200px-Carrefour_logo.svg.png',
    'coto': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Logo_Coto.svg/1200px-Logo_Coto.svg.png',
    'día': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Logo_DIA.svg/1200px-Logo_DIA.svg.png',
    'dia': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Logo_DIA.svg/1200px-Logo_DIA.svg.png',
};

export function ProductComparisonModal({ product, variations }: ProductComparisonModalProps) {
    const { addItem } = useShoppingList();

    // Combine base product and variations to find the absolute best price
    const allOptions = [product, ...variations].sort((a, b) => a.price - b.price);
    const bestOption = allOptions[0];
    const worstOption = allOptions[allOptions.length - 1];

    // Calculate potential savings
    const maxSavings = worstOption.price - bestOption.price;
    const savingsPercent = Math.round((maxSavings / worstOption.price) * 100);

    const handleAddToList = async (item: StoreProduct) => {
        try {
            await addItem({
                custom_name: item.name,
                price: item.price,
                store: item.store,
                quantity: 1,
                unit: 'un',
                checked: false,
                category: 'Otros'
            });
            // Toast is handled by useShoppingList
        } catch (error) {
            console.error('Error adding to list:', error);
        }
    };

    const StoreLogo = ({ storeName, className }: { storeName: string, className?: string }) => {
        const logoUrl = STORE_LOGOS[storeName.toLowerCase()];
        if (logoUrl) {
            return (
                <div className={cn("bg-white p-1 rounded border border-slate-100 dark:border-white/10 flex items-center justify-center", className)}>
                    <img src={logoUrl} alt={storeName} className="h-full w-full object-contain" />
                </div>
            );
        }
        return (
            <div className={cn("bg-slate-100 dark:bg-slate-800 rounded font-bold text-[10px] flex items-center justify-center", className)}>
                {storeName.substring(0, 2).toUpperCase()}
            </div>
        );
    };

    const getStoreColor = (storeName: string) => {
        const store = storeName.toLowerCase();
        if (store.includes('jumbo')) return 'text-green-600 bg-green-50 dark:bg-green-900/20';
        if (store.includes('carrefour')) return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
        if (store.includes('coto')) return 'text-red-600 bg-red-50 dark:bg-red-900/20';
        if (store.includes('dia') || store.includes('día')) return 'text-orange-600 bg-orange-50 dark:bg-orange-900/20';
        return 'text-slate-600 bg-slate-50 dark:bg-slate-800';
    };

    return (
        <DialogContent className="max-w-2xl bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 overflow-hidden">
            <DialogHeader>
                <div className="flex items-start gap-4">
                    {product.image && (
                        <div className="w-24 h-24 rounded-lg overflow-hidden bg-white shrink-0 border border-slate-200 dark:border-white/10 p-2 shadow-sm">
                            <img
                                src={product.image}
                                alt={product.name}
                                className="w-full h-full object-contain"
                            />
                        </div>
                    )}
                    <div className="flex-1">
                        <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
                            {product.name}
                        </DialogTitle>
                        <DialogDescription className="mt-1 flex flex-wrap items-center gap-2">
                            <span className="text-slate-600 dark:text-gray-400 font-medium">
                                {allOptions.length} tiendas disponibles
                            </span>
                            {savingsPercent > 0 && (
                                <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 border-green-200 dark:border-green-800 px-2 py-0.5">
                                    Ahorro del {savingsPercent}%
                                </Badge>
                            )}
                        </DialogDescription>
                    </div>
                </div>
            </DialogHeader>

            <div className="space-y-6 mt-4">
                {/* Winner Card */}
                <div className="relative overflow-hidden rounded-2xl border-2 border-green-500/50 bg-gradient-to-br from-green-50 to-white dark:from-green-900/20 dark:to-slate-900 p-5 shadow-lg shadow-green-500/5">
                    <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] tracking-wider font-black px-4 py-1.5 rounded-bl-2xl uppercase">
                        Más Barato 🚀
                    </div>
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <StoreLogo storeName={bestOption.store} className="w-16 h-12 shadow-sm" />
                            <div>
                                <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                                    ${bestOption.price.toLocaleString()}
                                </p>
                                <p className="text-xs text-green-600 dark:text-green-400 font-bold flex items-center gap-1 mt-0.5">
                                    <TrendingDown className="w-3.5 h-3.5" /> Precio imbatible
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-md shadow-green-600/20"
                                onClick={() => handleAddToList(bestOption)}
                            >
                                <Plus className="w-4 h-4 mr-2" /> Agregar
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white text-xs"
                                onClick={() => window.open(bestOption.url, '_blank')}
                            >
                                Ver online <ExternalLink className="w-3 h-3 ml-1.5" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Comparison Table */}
                <div className="space-y-3">
                    <h4 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">
                        Comparativa directa
                    </h4>
                    <div className="space-y-2.5">
                        {allOptions.slice(1).map((option) => {
                            const diffPercent = Math.round(((option.price - bestOption.price) / bestOption.price) * 100);
                            const diffAmount = option.price - bestOption.price;

                            return (
                                <div
                                    key={option.id}
                                    className="group flex items-center justify-between p-3.5 rounded-2xl border border-slate-100 dark:border-white/5 bg-white dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-white/20 transition-all duration-200"
                                >
                                    <div className="flex items-center gap-4">
                                        <StoreLogo storeName={option.store} className="w-12 h-10 shadow-sm opacity-90 group-hover:opacity-100 transition-opacity" />
                                        <div className="flex flex-col">
                                            <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
                                                ${option.price.toLocaleString()}
                                            </span>
                                            <span className="text-[10px] text-red-500 dark:text-red-400 font-black flex items-center gap-0.5 uppercase tracking-tighter">
                                                <TrendingUp className="w-3 h-3" /> +${diffAmount.toLocaleString()} ({diffPercent}%)
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 font-bold rounded-xl"
                                            onClick={() => handleAddToList(option)}
                                        >
                                            <Plus className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-slate-400 hover:text-slate-900 dark:text-slate-500 dark:hover:text-white rounded-xl"
                                            onClick={() => window.open(option.url, '_blank')}
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Disclaimer */}
                <div className="flex gap-2.5 p-4 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-white/5 text-[11px] text-slate-500 dark:text-slate-400 line-height-relaxed">
                    <AlertCircle className="w-4 h-4 shrink-0 text-slate-400" />
                    <p>
                        Esta comparativa considera precios de lista. No incluye descuentos por segunda unidad o beneficios de billeteras virtuales.
                    </p>
                </div>
            </div>
        </DialogContent>
    );
}
