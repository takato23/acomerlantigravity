'use client';

/**
 * Demo page for Preciar-style price comparison
 * No auth required - just for testing the new UI
 */

import React, { useState, useEffect } from 'react';
import { PreciarStylePriceCard } from '@/components/pricing/PreciarStylePriceCard';
import { useBuscaPrecios } from '@/hooks/useBuscaPrecios';
import { Search, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Demo products to show
const DEMO_PRODUCTS = ['leche', 'arroz', 'banana', 'aceite', 'fideos'];

export default function PreciosDemoPage() {
    const { buscarProducto, loading, error } = useBuscaPrecios();
    const [searchQuery, setSearchQuery] = useState('');
    const [producto, setProducto] = useState<any>(null);
    const [selectedDemo, setSelectedDemo] = useState<string | null>(null);

    // Handle search
    const handleSearch = async (query: string) => {
        if (!query.trim()) return;

        setSelectedDemo(query);
        const result = await buscarProducto(query);
        setProducto(result);
    };

    // Load initial demo product
    useEffect(() => {
        handleSearch('leche');
    }, []);

    return (
        <div className="min-h-screen bg-gray-100 py-8 px-4">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl mb-4">
                        <ShoppingCart className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Comparador de Precios
                    </h1>
                    <p className="text-gray-500">
                        Encontrá el mejor precio entre supermercados argentinos
                    </p>
                </div>

                {/* Search bar */}
                <div className="bg-white rounded-xl p-4 shadow-sm mb-6">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleSearch(searchQuery);
                        }}
                        className="flex gap-2"
                    >
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Buscar producto..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            />
                        </div>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="bg-emerald-600 hover:bg-emerald-700"
                        >
                            Buscar
                        </Button>
                    </form>

                    {/* Quick demo buttons */}
                    <div className="flex flex-wrap gap-2 mt-4">
                        <span className="text-xs text-gray-500 w-full">Prueba rápida:</span>
                        {DEMO_PRODUCTS.map(prod => (
                            <button
                                key={prod}
                                onClick={() => {
                                    setSearchQuery(prod);
                                    handleSearch(prod);
                                }}
                                className={`
                                    px-3 py-1.5 rounded-full text-sm transition-all
                                    ${selectedDemo === prod
                                        ? 'bg-emerald-100 text-emerald-700 font-medium'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }
                                `}
                            >
                                {prod}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Error message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6">
                        {error}
                    </div>
                )}

                {/* Price comparison card */}
                {producto && (
                    <PreciarStylePriceCard
                        producto={producto}
                        loading={loading}
                        onRefresh={() => handleSearch(selectedDemo || 'leche')}
                    />
                )}

                {/* Powered by notice */}
                <div className="text-center mt-8 text-xs text-gray-400">
                    Precios proporcionados por BuscaPrecios API
                </div>
            </div>
        </div>
    );
}
