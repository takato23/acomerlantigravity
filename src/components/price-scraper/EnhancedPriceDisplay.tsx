'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Store, Clock, AlertCircle, ChevronDown, Plus, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useShoppingList } from '@/hooks/useShoppingList';
import { useAppStore } from '@/store';
import { StoreProduct, ProductGroup } from '@/lib/services/enhancedStoreScraper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
// Removed collapsible import - will use simple state toggle

interface EnhancedPriceDisplayProps {
  products: StoreProduct[];
  productGroups?: ProductGroup[];
  isLoading: boolean;
  error?: string | null;
  progress?: string | null;
  isWarmingUp?: boolean;
  cacheHit?: boolean;
  responseTime?: number;
  onProductSelect?: (product: StoreProduct) => void;
  onRefresh?: () => void;
  viewMode?: 'grid' | 'list';
}

export function EnhancedPriceDisplay({
  products,
  productGroups,
  isLoading,
  error,
  progress,
  isWarmingUp,
  cacheHit,
  responseTime,
  onProductSelect,
  onRefresh,
  viewMode = 'grid'
}: EnhancedPriceDisplayProps) {
  const [expandedGroups, setExpandedGroups] = React.useState<Set<string>>(new Set());

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        {isWarmingUp && (
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              El servicio se está iniciando. La primera búsqueda puede tardar hasta 50 segundos.
            </AlertDescription>
          </Alert>
        )}

        {progress && (
          <div className="text-sm text-muted-foreground text-center py-2">
            {progress}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-8 w-1/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertCircle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          {error}
        </AlertDescription>
        {onRefresh && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            className="mt-2"
          >
            Reintentar
          </Button>
        )}
      </Alert>
    );
  }

  // Empty state
  if (!products.length && !productGroups?.length) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            No se encontraron productos. Intenta con otra búsqueda.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Display grouped products if available
  if (productGroups && productGroups.length > 0) {
    return (
      <div className="space-y-4">
        {/* Performance metrics */}
        {responseTime && (
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{responseTime}ms</span>
            </div>
            {cacheHit && (
              <Badge variant="secondary" className="text-xs">
                Desde caché
              </Badge>
            )}
          </div>
        )}

        {/* Product groups */}
        <div className="space-y-3">
          {productGroups.map((group, index) => (
            <Card key={index} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {group.baseProduct.name}
                  </CardTitle>
                  <Badge variant="outline">
                    {group.variations.length + 1} variantes
                  </Badge>
                </div>

                {/* Price range */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Precio:</span>
                  <span className="font-semibold text-foreground">
                    ${group.priceRange.min.toFixed(2)}
                  </span>
                  {group.priceRange.min !== group.priceRange.max && (
                    <>
                      <span>-</span>
                      <span className="font-semibold text-foreground">
                        ${group.priceRange.max.toFixed(2)}
                      </span>
                    </>
                  )}
                </div>
              </CardHeader>

              <CardContent>
                {/* Base product (cheapest) */}
                <ProductCard
                  product={group.baseProduct}
                  isCheapest
                  onSelect={onProductSelect}
                />

                {/* Variations */}
                {group.variations.length > 0 && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-between mt-2"
                      onClick={() => toggleGroup(`group-${index}`)}
                    >
                      <span>Ver más opciones</span>
                      <ChevronDown className={`h-4 w-4 transition-transform ${expandedGroups.has(`group-${index}`) ? 'rotate-180' : ''
                        }`} />
                    </Button>
                    {expandedGroups.has(`group-${index}`) && (
                      <div className="space-y-2 mt-2">
                        <AnimatePresence>
                          {group.variations.map((product, vIndex) => (
                            <motion.div
                              key={product.id}
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              transition={{ delay: vIndex * 0.05 }}
                            >
                              <ProductCard
                                product={product}
                                onSelect={onProductSelect}
                              />
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Display individual products
  return (
    <div className="space-y-4">
      {/* Performance metrics */}
      {responseTime && (
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{responseTime}ms</span>
          </div>
          {cacheHit && (
            <Badge variant="secondary" className="text-xs">
              Desde caché
            </Badge>
          )}
        </div>
      )}

      {/* Product grid/list */}
      <div className={viewMode === 'grid'
        ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        : "space-y-3"
      }>
        {products.map((product, index) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            {viewMode === 'grid' ? (
              <ProductCard
                product={product}
                onSelect={onProductSelect}
                showFullDetails
              />
            ) : (
              <ProductListItem
                product={product}
                onSelect={onProductSelect}
              />
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function ProductListItem({ product, onSelect }: { product: StoreProduct, onSelect?: (product: StoreProduct) => void }) {
  const { addItem } = useShoppingList();
  const logoUrl = CONSTANTS.STORE_LOGOS[product.store.toLowerCase()];

  const handleAddToList = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await addItem({
        custom_name: product.name,
        price: product.price,
        store: product.store,
        quantity: 1,
        unit: 'un',
        checked: false,
        category: 'Otros'
      });
    } catch (error) {
      console.error('Error adding to list:', error);
    }
  };

  return (
    <div
      className="group flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-white/5 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-white/20 transition-all cursor-pointer"
      onClick={() => onSelect?.(product)}
    >
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div className="w-12 h-12 rounded bg-white shrink-0 border border-slate-100 dark:border-white/10 p-1 flex items-center justify-center">
          {product.image ? (
            <img src={product.image} alt={product.name} className="max-w-full max-h-full object-contain" />
          ) : (
            <Store className="h-5 w-5 text-slate-300" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-slate-900 dark:text-white truncate text-sm">{product.name}</h4>
          <div className="flex items-center gap-2 mt-0.5">
            {logoUrl && <img src={logoUrl} alt={product.store} className="h-3 object-contain" />}
            <span className="text-xs text-slate-500">{product.store}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 ml-4">
        <span className="font-bold text-slate-900 dark:text-white">${product.price.toLocaleString()}</span>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 text-slate-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-full"
            onClick={handleAddToList}
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-full"
            onClick={(e) => {
              e.stopPropagation();
              window.open(product.url, '_blank');
            }}
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

const CONSTANTS = {
  STORE_LOGOS: {
    'jumbo': 'https://upload.wikimedia.org/wikipedia/commons/d/d3/Logo_Jumbo_Cencosud.png',
    'carrefour': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Carrefour_logo.svg/1200px-Carrefour_logo.svg.png',
    'coto': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Logo_Coto.svg/1200px-Logo_Coto.svg.png',
    'día': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Logo_DIA.svg/1200px-Logo_DIA.svg.png',
    'dia': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Logo_DIA.svg/1200px-Logo_DIA.svg.png',
  }
};

// Individual product card component
interface ProductCardProps {
  product: StoreProduct;
  isCheapest?: boolean;
  showFullDetails?: boolean;
  onSelect?: (product: StoreProduct) => void;
}

const STORE_LOGOS: Record<string, string> = {
  'jumbo': 'https://upload.wikimedia.org/wikipedia/commons/d/d3/Logo_Jumbo_Cencosud.png',
  'carrefour': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Carrefour_logo.svg/1200px-Carrefour_logo.svg.png',
  'coto': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Logo_Coto.svg/1200px-Logo_Coto.svg.png',
  'día': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Logo_DIA.svg/1200px-Logo_DIA.svg.png',
  'dia': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Logo_DIA.svg/1200px-Logo_DIA.svg.png',
};

function ProductCard({
  product,
  isCheapest,
  showFullDetails,
  onSelect
}: ProductCardProps) {
  const { addItem } = useAppStore.getState().user.profile ? useShoppingList() : { addItem: (item: any) => Promise.resolve() }; // Simple fallback for unauthenticated
  // Actually, better to use the hook normally and let it handle auth
  const shopping = useShoppingList();

  const handleAddToList = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await shopping.addItem({
        custom_name: product.name,
        price: product.price,
        store: product.store,
        quantity: 1,
        unit: 'un',
        checked: false,
        category: 'Otros'
      });
    } catch (error) {
      console.error('Error adding to list:', error);
    }
  };

  const logoUrl = STORE_LOGOS[product.store.toLowerCase()];

  return (
    <Card
      className={cn(
        "group overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer border-slate-100 dark:border-white/5 bg-white dark:bg-slate-900",
        isCheapest && "ring-2 ring-green-500/50 shadow-lg shadow-green-500/10"
      )}
      onClick={() => onSelect?.(product)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {showFullDetails && (
              <h3 className="font-bold text-slate-900 dark:text-white mb-2 line-clamp-2 leading-snug group-hover:text-orange-500 transition-colors">
                {product.name}
              </h3>
            )}

            <div className="flex items-center gap-2 mb-3">
              {logoUrl ? (
                <div className="h-6 w-8 bg-white p-0.5 rounded border border-slate-100 dark:border-white/10 flex items-center justify-center shrink-0">
                  <img src={logoUrl} alt={product.store} className="h-full w-full object-contain" />
                </div>
              ) : (
                <Store className="h-4 w-4 text-slate-400" />
              )}
              <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-gray-400 truncate">
                {product.store}
              </span>
              {isCheapest && (
                <Badge className="text-[10px] bg-green-500 hover:bg-green-600 font-black h-5 px-1.5 uppercase">
                  Mejor Precio
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">
                ${product.price.toLocaleString()}
              </span>
            </div>
          </div>

          {product.image && showFullDetails && (
            <div className="w-16 h-16 rounded-xl overflow-hidden bg-white shrink-0 border border-slate-100 dark:border-white/10 p-1 group-hover:scale-105 transition-transform duration-300">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center gap-2">
          <Button
            size="sm"
            className="flex-1 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-orange-600 dark:hover:bg-orange-500 font-bold rounded-xl transition-all h-9"
            onClick={handleAddToList}
          >
            <Plus className="w-4 h-4 mr-2" /> Agregar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-9 h-9 p-0 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white border border-transparent hover:border-slate-100 dark:hover:border-white/10"
            onClick={(e) => {
              e.stopPropagation();
              window.open(product.url, '_blank');
            }}
          >
            <ExternalLink className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}