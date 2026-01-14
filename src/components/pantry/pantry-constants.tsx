import React from 'react';
import {
    Package,
    Carrot,
    Apple,
    Beef,
    Milk,
    Wheat,
    Coffee,
    Cookie,
    TrendingDown,
    Home,
    Refrigerator
} from 'lucide-react';
import { IngredientCategory } from '@/types/pantry';

export interface CategoryItem {
    id: IngredientCategory | 'all';
    name: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
}

export interface LocationItem {
    id: string;
    name: string;
    icon: React.ComponentType<{ className?: string }>;
}

export const categories: CategoryItem[] = [
    { id: 'all', name: 'Todos', icon: Package, color: 'from-gray-400 to-gray-500' },
    { id: 'verduras', name: 'Verduras', icon: Carrot, color: 'from-green-400 to-green-500' },
    { id: 'frutas', name: 'Frutas', icon: Apple, color: 'from-orange-400 to-orange-500' },
    { id: 'carnes', name: 'Carnes', icon: Beef, color: 'from-red-400 to-red-500' },
    { id: 'lacteos', name: 'Lácteos', icon: Milk, color: 'from-blue-400 to-blue-500' },
    { id: 'granos', name: 'Granos', icon: Wheat, color: 'from-yellow-400 to-yellow-500' },
    { id: 'condimentos', name: 'Condimentos', icon: Package, color: 'from-gray-400 to-gray-500' },
    { id: 'bebidas', name: 'Bebidas', icon: Coffee, color: 'from-amber-400 to-amber-500' },
    { id: 'enlatados', name: 'Enlatados', icon: Package, color: 'from-gray-400 to-gray-500' },
    { id: 'congelados', name: 'Congelados', icon: TrendingDown, color: 'from-cyan-400 to-cyan-500' },
    { id: 'panaderia', name: 'Panadería', icon: Package, color: 'from-orange-400 to-orange-500' },
    { id: 'snacks', name: 'Snacks', icon: Cookie, color: 'from-purple-400 to-purple-500' },
    { id: 'otros', name: 'Otros', icon: Package, color: 'from-gray-400 to-gray-500' }
];

export const locations: LocationItem[] = [
    { id: 'all', name: 'Todos', icon: Home },
    { id: 'despensa', name: 'Despensa', icon: Package },
    { id: 'refrigerador', name: 'Refrigerador', icon: Refrigerator },
    { id: 'congelador', name: 'Congelador', icon: TrendingDown }
];

export const categoryIconMap: Record<IngredientCategory, React.ComponentType<{ className?: string }>> = {
    verduras: Carrot,
    frutas: Apple,
    carnes: Beef,
    lacteos: Milk,
    granos: Wheat,
    condimentos: Package,
    bebidas: Coffee,
    enlatados: Package,
    congelados: TrendingDown,
    panaderia: Package,
    snacks: Cookie,
    otros: Package
};
