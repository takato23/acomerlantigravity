/**
 * Price Tracker Service
 * Advanced price tracking and comparison engine
 * Uses mock data - can be connected to Supabase in production
 */

import { logger } from '@/services/logger';

// Types (no longer importing from Prisma)
export interface Store {
  id: string;
  name: string;
  active: boolean;
  location?: string;
  address?: string;
  chainId?: string;
}

export interface Product {
  id: string;
  name: string;
  normalizedName: string;
  category?: string;
  brand?: string;
  unit?: string;
  updatedAt: Date;
}

export interface Price {
  id: string;
  productId: string;
  storeId: string;
  price: number;
  unit: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  product?: Product;
  store?: Store;
}

export interface PriceComparison {
  product: Product & {
    prices: (Price & { store: Store })[];
    lowestPrice?: {
      price: number;
      store: Store;
      priceId: string;
    };
    highestPrice?: {
      price: number;
      store: Store;
      priceId: string;
    };
    averagePrice: number;
    priceRange: {
      min: number;
      max: number;
    };
    savings: {
      amount: number;
      percentage: number;
    };
  };
}

export interface StoreComparison {
  store: Store;
  totalItems: number;
  totalPrice: number;
  savings: number;
  savingsPercentage: number;
  missingItems: string[];
  priceBreakdown: {
    productId: string;
    productName: string;
    price: number;
    unit: string;
  }[];
}

export interface PriceAlert {
  id: string;
  productId: string;
  targetPrice: number;
  currentPrice: number;
  triggered: boolean;
  createdAt: Date;
}

export interface PriceTrend {
  productId: string;
  storeId: string;
  prices: {
    price: number;
    date: Date;
  }[];
  trend: 'increasing' | 'decreasing' | 'stable';
  changePercentage: number;
  forecast?: {
    nextWeek: number;
    confidence: number;
  };
}

// Mock data for Argentine supermarkets
const MOCK_STORES: Store[] = [
  { id: 'carrefour', name: 'Carrefour', active: true, location: 'CABA' },
  { id: 'coto', name: 'Coto', active: true, location: 'CABA' },
  { id: 'dia', name: 'Día', active: true, location: 'CABA' },
  { id: 'jumbo', name: 'Jumbo', active: true, location: 'CABA' },
  { id: 'changomas', name: 'Changomas', active: true, location: 'GBA' },
];

const MOCK_PRODUCTS: Product[] = [
  { id: 'leche-1', name: 'Leche Entera 1L', normalizedName: 'leche entera', category: 'lácteos', unit: 'L', updatedAt: new Date() },
  { id: 'pan-1', name: 'Pan Lactal', normalizedName: 'pan lactal', category: 'panadería', unit: 'unidad', updatedAt: new Date() },
  { id: 'huevos-1', name: 'Huevos x12', normalizedName: 'huevos', category: 'lácteos', unit: 'docena', updatedAt: new Date() },
  { id: 'arroz-1', name: 'Arroz Largo Fino 1kg', normalizedName: 'arroz', category: 'almacén', unit: 'kg', updatedAt: new Date() },
  { id: 'aceite-1', name: 'Aceite Girasol 1.5L', normalizedName: 'aceite girasol', category: 'almacén', unit: 'L', updatedAt: new Date() },
  { id: 'carne-1', name: 'Carne Picada', normalizedName: 'carne picada', category: 'carnes', unit: 'kg', updatedAt: new Date() },
  { id: 'pollo-1', name: 'Pechuga de Pollo', normalizedName: 'pechuga pollo', category: 'carnes', unit: 'kg', updatedAt: new Date() },
  { id: 'tomate-1', name: 'Tomate Redondo', normalizedName: 'tomate', category: 'verduras', unit: 'kg', updatedAt: new Date() },
  { id: 'cebolla-1', name: 'Cebolla', normalizedName: 'cebolla', category: 'verduras', unit: 'kg', updatedAt: new Date() },
  { id: 'papa-1', name: 'Papa', normalizedName: 'papa', category: 'verduras', unit: 'kg', updatedAt: new Date() },
];

// Generate mock prices with some variation between stores
function generateMockPrices(): Price[] {
  const basePrices: Record<string, number> = {
    'leche-1': 950,
    'pan-1': 1200,
    'huevos-1': 2800,
    'arroz-1': 1500,
    'aceite-1': 3200,
    'carne-1': 5500,
    'pollo-1': 4200,
    'tomate-1': 1800,
    'cebolla-1': 900,
    'papa-1': 700,
  };

  const prices: Price[] = [];

  MOCK_PRODUCTS.forEach(product => {
    const basePrice = basePrices[product.id] || 1000;

    MOCK_STORES.forEach(store => {
      // Add ±15% variation per store
      const variation = 0.85 + Math.random() * 0.30;
      const price = Math.round(basePrice * variation);

      prices.push({
        id: `${product.id}-${store.id}`,
        productId: product.id,
        storeId: store.id,
        price,
        unit: product.unit || 'unidad',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        product,
        store,
      });
    });
  });

  return prices;
}

// Simple ingredient normalizer
function normalizeIngredient(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim();
}

export class PriceTracker {
  private mockPrices: Price[];
  private alertThresholds = {
    significant: 0.15,
    moderate: 0.10,
    minor: 0.05
  };

  constructor() {
    this.mockPrices = generateMockPrices();
  }

  /**
   * Compare prices across all stores for a single product
   */
  async compareProductPrices(
    productName: string,
    quantity: number = 1,
    unit?: string
  ): Promise<PriceComparison | null> {
    try {
      const normalized = normalizeIngredient(productName);

      // Find matching product
      const product = MOCK_PRODUCTS.find(p =>
        p.normalizedName.includes(normalized) ||
        normalized.includes(p.normalizedName)
      );

      if (!product) {
        logger.warn(`Product not found: ${productName}`, 'PriceTracker');
        return null;
      }

      // Get prices for this product
      const productPrices = this.mockPrices.filter(p => p.productId === product.id);

      if (productPrices.length === 0) {
        return null;
      }

      // Calculate adjusted prices based on quantity
      const adjustedPrices = productPrices.map(price => ({
        ...price,
        adjustedPrice: this.calculateAdjustedPrice(price.price, price.unit, quantity, unit)
      }));

      // Find lowest and highest prices
      const sortedPrices = adjustedPrices.sort((a, b) => a.adjustedPrice - b.adjustedPrice);
      const lowestPrice = sortedPrices[0];
      const highestPrice = sortedPrices[sortedPrices.length - 1];

      // Calculate average price
      const averagePrice = adjustedPrices.reduce((sum, p) => sum + p.adjustedPrice, 0) / adjustedPrices.length;

      // Calculate potential savings
      const savings = {
        amount: highestPrice.adjustedPrice - lowestPrice.adjustedPrice,
        percentage: ((highestPrice.adjustedPrice - lowestPrice.adjustedPrice) / highestPrice.adjustedPrice) * 100
      };

      return {
        product: {
          ...product,
          prices: productPrices as (Price & { store: Store })[],
          lowestPrice: {
            price: lowestPrice.adjustedPrice,
            store: lowestPrice.store!,
            priceId: lowestPrice.id
          },
          highestPrice: {
            price: highestPrice.adjustedPrice,
            store: highestPrice.store!,
            priceId: highestPrice.id
          },
          averagePrice,
          priceRange: {
            min: lowestPrice.adjustedPrice,
            max: highestPrice.adjustedPrice
          },
          savings
        }
      };
    } catch (error: unknown) {
      logger.error('Error comparing product prices:', 'PriceTracker', error);
      return null;
    }
  }

  /**
   * Compare total basket prices across stores
   */
  async compareBasketPrices(
    items: { name: string; quantity: number; unit?: string }[]
  ): Promise<StoreComparison[]> {
    try {
      const comparisons: StoreComparison[] = [];

      for (const store of MOCK_STORES) {
        const priceBreakdown: StoreComparison['priceBreakdown'] = [];
        const missingItems: string[] = [];
        let totalPrice = 0;

        for (const item of items) {
          const normalized = normalizeIngredient(item.name);

          // Find product and its price at this store
          const product = MOCK_PRODUCTS.find(p =>
            p.normalizedName.includes(normalized) ||
            normalized.includes(p.normalizedName)
          );

          if (product) {
            const price = this.mockPrices.find(p =>
              p.productId === product.id && p.storeId === store.id
            );

            if (price) {
              const adjustedPrice = this.calculateAdjustedPrice(
                price.price,
                price.unit,
                item.quantity,
                item.unit
              );

              totalPrice += adjustedPrice;
              priceBreakdown.push({
                productId: product.id,
                productName: product.name,
                price: adjustedPrice,
                unit: price.unit
              });
            } else {
              missingItems.push(item.name);
            }
          } else {
            missingItems.push(item.name);
          }
        }

        comparisons.push({
          store,
          totalItems: items.length - missingItems.length,
          totalPrice,
          savings: 0,
          savingsPercentage: 0,
          missingItems,
          priceBreakdown
        });
      }

      // Calculate savings relative to most expensive option
      if (comparisons.length > 0) {
        const maxPrice = Math.max(...comparisons.map(c => c.totalPrice));

        comparisons.forEach(comparison => {
          comparison.savings = maxPrice - comparison.totalPrice;
          comparison.savingsPercentage = maxPrice > 0 ? (comparison.savings / maxPrice) * 100 : 0;
        });
      }

      // Sort by total price (cheapest first)
      return comparisons.sort((a, b) => a.totalPrice - b.totalPrice);
    } catch (error: unknown) {
      logger.error('Error comparing basket prices:', 'PriceTracker', error);
      return [];
    }
  }

  /**
   * Track price trends for a product (mock implementation)
   */
  async getProductPriceTrends(
    productId: string,
    days: number = 30
  ): Promise<PriceTrend[]> {
    try {
      // Generate mock historical prices
      const trends: PriceTrend[] = [];
      const product = MOCK_PRODUCTS.find(p => p.id === productId);

      if (!product) return [];

      for (const store of MOCK_STORES) {
        const basePrice = this.mockPrices.find(
          p => p.productId === productId && p.storeId === store.id
        )?.price || 1000;

        // Generate mock historical data
        const prices: { price: number; date: Date }[] = [];
        for (let i = days; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);

          // Add some random variation
          const variation = 0.95 + Math.random() * 0.10;
          prices.push({
            price: Math.round(basePrice * variation),
            date
          });
        }

        const firstPrice = prices[0].price;
        const lastPrice = prices[prices.length - 1].price;
        const changePercentage = ((lastPrice - firstPrice) / firstPrice) * 100;

        let trend: PriceTrend['trend'] = 'stable';
        if (changePercentage > 5) trend = 'increasing';
        else if (changePercentage < -5) trend = 'decreasing';

        trends.push({
          productId,
          storeId: store.id,
          prices,
          trend,
          changePercentage,
          forecast: this.calculatePriceForecast(prices)
        });
      }

      return trends;
    } catch (error: unknown) {
      logger.error('Error getting price trends:', 'PriceTracker', error);
      return [];
    }
  }

  /**
   * Set up price alerts (mock implementation)
   */
  async createPriceAlert(
    productId: string,
    targetPrice: number,
    userId: string
  ): Promise<PriceAlert> {
    try {
      const productPrices = this.mockPrices.filter(p => p.productId === productId);
      const currentPrice = Math.min(...productPrices.map(p => p.price));
      const triggered = currentPrice <= targetPrice;

      const alert: PriceAlert = {
        id: `alert_${Date.now()}`,
        productId,
        targetPrice,
        currentPrice,
        triggered,
        createdAt: new Date()
      };

      logger.info(`Price alert created for product ${productId}`, 'PriceTracker');
      return alert;
    } catch (error: unknown) {
      logger.error('Error creating price alert:', 'PriceTracker', error);
      throw error;
    }
  }

  /**
   * Find deals and promotions
   */
  async findDeals(
    category?: string,
    minDiscount: number = 10
  ): Promise<PriceComparison[]> {
    try {
      const deals: PriceComparison[] = [];

      const products = category
        ? MOCK_PRODUCTS.filter(p => p.category === category)
        : MOCK_PRODUCTS;

      for (const product of products) {
        const comparison = await this.compareProductPrices(product.name);
        if (comparison && comparison.product.savings.percentage >= minDiscount) {
          deals.push(comparison);
        }
      }

      return deals.sort((a, b) => b.product.savings.percentage - a.product.savings.percentage);
    } catch (error: unknown) {
      logger.error('Error finding deals:', 'PriceTracker', error);
      return [];
    }
  }

  /**
   * Calculate adjusted price based on units
   */
  private calculateAdjustedPrice(
    price: number,
    priceUnit: string,
    desiredQuantity: number,
    desiredUnit?: string
  ): number {
    const unitConversions: Record<string, Record<string, number>> = {
      kg: { g: 1000, lb: 2.20462 },
      g: { kg: 0.001, oz: 0.035274 },
      L: { ml: 1000, gal: 0.264172 },
      ml: { L: 0.001, fl_oz: 0.033814 }
    };

    let adjustedPrice = price * desiredQuantity;

    if (desiredUnit && priceUnit !== desiredUnit) {
      const conversion = unitConversions[priceUnit]?.[desiredUnit];
      if (conversion) {
        adjustedPrice = price * desiredQuantity * conversion;
      }
    }

    return adjustedPrice;
  }

  /**
   * Calculate simple price forecast
   */
  private calculatePriceForecast(
    prices: { price: number; date: Date }[]
  ): { nextWeek: number; confidence: number } | undefined {
    if (prices.length < 3) return undefined;

    const n = prices.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = prices.map(p => p.price);

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    const nextWeek = intercept + slope * (n + 7);

    const yMean = sumY / n;
    const ssTotal = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
    const ssResidual = y.reduce((sum, yi, i) => {
      const predicted = intercept + slope * i;
      return sum + Math.pow(yi - predicted, 2);
    }, 0);

    const rSquared = 1 - (ssResidual / ssTotal);
    const confidence = Math.max(0, Math.min(1, rSquared));

    return {
      nextWeek: Math.max(0, nextWeek),
      confidence
    };
  }
}
