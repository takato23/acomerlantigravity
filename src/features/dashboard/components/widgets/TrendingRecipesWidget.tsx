import React from 'react';
import Image from 'next/image';
import { TrendingUp, Clock, Star } from 'lucide-react';

interface TrendingRecipe {
    id: string;
    name: string;
    image: string;
    time: string;
    rating: number;
}

interface TrendingRecipesWidgetProps {
    recipes: TrendingRecipe[];
}

export const TrendingRecipesWidget: React.FC<TrendingRecipesWidgetProps> = ({ recipes }) => {
    return (
        <div className="space-y-6 p-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl text-slate-900 dark:text-white font-black tracking-tighter flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" /> Sugeridos para vos
                </h2>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
                {recipes.slice(0, 2).map((recipe) => (
                    <div key={recipe.id} className="bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10 p-4 flex gap-4 cursor-pointer hover:border-slate-900 dark:hover:border-white/30 transition-colors group">
                        <div className="relative overflow-hidden rounded-xl w-20 h-20 shrink-0">
                            <Image
                                src={recipe.image}
                                alt={recipe.name}
                                className="object-cover group-hover:scale-110 transition-transform duration-500"
                                fill
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            />
                        </div>
                        <div className="flex flex-col justify-center">
                            <h4 className="font-bold text-slate-900 dark:text-white leading-tight mb-1">{recipe.name}</h4>
                            <div className="flex gap-2 text-xs text-gray-500 dark:text-gray-400">
                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {recipe.time}</span>
                                <span className="flex items-center gap-1"><Star className="w-3 h-3 text-orange-500" /> {recipe.rating}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
