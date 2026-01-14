'use client';

import React, { useState, useCallback } from 'react';
import { Search, X, Settings, TrendingUp } from 'lucide-react';

import { useEnhancedPriceScraper } from '@/hooks/useEnhancedPriceScraper';
import { StoreProduct } from '@/lib/services/enhancedStoreScraper';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
// Removed Popover import - will use dialog instead

import { EnhancedPriceDisplay } from './EnhancedPriceDisplay';
import { ProductComparisonModal } from './ProductComparisonModal';

interface PriceSearchComponentProps {
  initialQuery?: string;
  onProductSelect?: (product: StoreProduct) => void;
  showHistory?: boolean;
  compact?: boolean;
}

export function PriceSearchComponent({
  initialQuery = '',
  onProductSelect,
  showHistory = true,
  compact = false
}: PriceSearchComponentProps) {
  const [query, setQuery] = useState(initialQuery);
  const [useCache, setUseCache] = useState(true);
  const [groupProducts, setGroupProducts] = useState(true);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<StoreProduct | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const scraper = useEnhancedPriceScraper({
    useCache,
    groupProducts,
    showNotifications: true,
    onSuccess: (products) => {
      if (query && !searchHistory.includes(query)) {
        setSearchHistory(prev => [query, ...prev.slice(0, 9)]);
      }
    }
  });

  const handleSearch = useCallback((searchQuery: string) => {
    if (searchQuery.trim()) {
      setQuery(searchQuery);
      scraper.searchProducts(searchQuery);
    }
  }, [scraper]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch(query);
    }
  };

  const handleProductSelect = (product: StoreProduct) => {
    setSelectedProduct(product);
    onProductSelect?.(product);
  };

  const cacheStats = scraper.getCacheStats();
  const serviceStatus = scraper.getServiceStatus();

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="text"
                placeholder="Buscar productos..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pl-10 pr-10"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <Button
              onClick={() => handleSearch(query)}
              disabled={!query.trim() || scraper.isLoading}
            >
              Buscar
            </Button>

            {!compact && (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setViewMode(prev => prev === 'grid' ? 'list' : 'grid')}
                  title={viewMode === 'grid' ? 'Ver como lista' : 'Ver como grilla'}
                >
                  {viewMode === 'grid' ? (
                    <div className="flex flex-col gap-0.5">
                      <div className="h-0.5 w-3 bg-current" />
                      <div className="h-0.5 w-3 bg-current" />
                      <div className="h-0.5 w-3 bg-current" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-0.5">
                      <div className="h-1 w-1 bg-current" />
                      <div className="h-1 w-1 bg-current" />
                      <div className="h-1 w-1 bg-current" />
                      <div className="h-1 w-1 bg-current" />
                    </div>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowSettings(true)}
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>

          {/* Search history */}
          {showHistory && searchHistory.length > 0 && !scraper.isLoading && (
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="text-xs text-muted-foreground">Búsquedas recientes:</span>
              {searchHistory.map((item, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="cursor-pointer hover:bg-secondary/80"
                  onClick={() => handleSearch(item)}
                >
                  {item}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Price comparison info */}
      {!compact && !scraper.isLoading && scraper.products.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Resumen de precios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Productos encontrados</p>
                <p className="font-semibold">{scraper.products.length}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Precio más bajo</p>
                <p className="font-semibold text-green-600">
                  ${Math.min(...scraper.products.map(p => p.price)).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Precio más alto</p>
                <p className="font-semibold text-red-600">
                  ${Math.max(...scraper.products.map(p => p.price)).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Precio promedio</p>
                <p className="font-semibold">
                  ${(scraper.products.reduce((sum, p) => sum + p.price, 0) / scraper.products.length).toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results display */}
      <EnhancedPriceDisplay
        products={scraper.products}
        productGroups={groupProducts ? scraper.productGroups : undefined}
        isLoading={scraper.isLoading}
        error={scraper.error}
        progress={scraper.progress}
        isWarmingUp={scraper.isWarmingUp}
        cacheHit={scraper.cacheHit}
        responseTime={scraper.responseTime}
        onProductSelect={handleProductSelect}
        onRefresh={() => handleSearch(query)}
        viewMode={viewMode}
      />

      {/* Product detail dialog */}
      <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        {selectedProduct && scraper.productGroups.length > 0 ? (
          // Find the group related to this product
          (() => {
            const group = scraper.productGroups.find(g =>
              g.baseProduct.id === selectedProduct.id ||
              g.variations.some(v => v.id === selectedProduct.id)
            );

            // Or create an ad-hoc group if not found (shouldn't happen with enriched data)
            const variations = group
              ? [...(group.baseProduct.id !== selectedProduct.id ? [group.baseProduct] : []), ...group.variations.filter(v => v.id !== selectedProduct.id)]
              : scraper.products.filter(p => p.name === selectedProduct.name && p.store !== selectedProduct.store);

            return <ProductComparisonModal product={selectedProduct} variations={variations} />;
          })()
        ) : (
          // Fallback if no groups (should be covered by enrichment) or standard view
          selectedProduct && (
            <ProductComparisonModal
              product={selectedProduct}
              variations={scraper.products.filter(p => p.name === selectedProduct.name && p.id !== selectedProduct.id)}
            />
          )
        )}
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configuración de búsqueda</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="cache">Usar caché</Label>
              <input
                type="checkbox"
                id="cache"
                checked={useCache}
                onChange={(e) => setUseCache(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="group">Agrupar productos</Label>
              <input
                type="checkbox"
                id="group"
                checked={groupProducts}
                onChange={(e) => setGroupProducts(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Estado del caché</span>
                <Badge variant="outline">{cacheStats.size} entradas</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Tamaño</span>
                <span className="text-sm text-muted-foreground">{cacheStats.totalSize}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={scraper.clearCache}
                className="w-full"
              >
                Limpiar caché
              </Button>
            </div>

            <div className="space-y-2">
              <h5 className="text-sm font-medium">Estado del servicio</h5>
              <div className="text-xs space-y-1 text-muted-foreground">
                <div>Tiempo de respuesta promedio: {serviceStatus.averageResponseTime.toFixed(0)}ms</div>
                <div>Fallos: {serviceStatus.failureCount}</div>
                {serviceStatus.isWarmingUp && (
                  <Badge variant="secondary" className="text-xs">
                    Calentando...
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Compact version for embedding in other components
export function CompactPriceSearch({
  onProductSelect
}: {
  onProductSelect?: (product: StoreProduct) => void
}) {
  return (
    <PriceSearchComponent
      compact={true}
      showHistory={false}
      onProductSelect={onProductSelect}
    />
  );
}