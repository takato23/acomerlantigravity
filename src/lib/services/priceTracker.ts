import { createServerSupabaseClient } from '@/lib/supabase/client';
import { logger } from '@/services/logger';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

export interface PriceInfo {
  productId: string;
  storeId: string;
  storeName?: string;
  price: number;
  recordedAt: Date;
}

export interface PriceTrend {
  average: number;
  min: number;
  max: number;
  trend: 'up' | 'down' | 'stable';
  percentageChange: number;
}

export interface ProductWithLowestPrice {
  productId: string;
  productName: string;
  lowestPrice: number;
  store: string;
  savings: number; // compared to average
}

export class PriceTracker {
  private static instance: PriceTracker;
  private supabase: SupabaseClient<Database>;

  private constructor() {
    this.supabase = createServerSupabaseClient();
  }

  static getInstance(): PriceTracker {
    if (!PriceTracker.instance) {
      PriceTracker.instance = new PriceTracker();
    }
    return PriceTracker.instance;
  }

  async trackPrice(
    productId: string,
    storeId: string,
    price: number,
    source: 'scraper' | 'manual' | 'receipt' = 'scraper'
  ): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('price_history')
        .insert({
          product_id: productId,
          store_id: storeId,
          price: price,
          recorded_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error: unknown) {
      logger.error('Error tracking price:', 'priceTracker', error);
      throw error;
    }
  }

  async trackPrices(prices: Array<{
    productId: string;
    storeId: string;
    price: number;
    source?: 'scraper' | 'manual' | 'receipt';
  }>): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('price_history')
        .insert(
          prices.map(p => ({
            product_id: p.productId,
            store_id: p.storeId,
            price: p.price,
            recorded_at: new Date().toISOString()
          }))
        );

      if (error) throw error;
    } catch (error: unknown) {
      logger.error('Error tracking multiple prices:', 'priceTracker', error);
      throw error;
    }
  }

  async getPriceHistory(productId: string, days: number = 30): Promise<PriceInfo[]> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    try {
      const { data: history, error } = await this.supabase
        .from('price_history')
        .select(`
          *,
          store:stores(name)
        `)
        .eq('product_id', productId)
        .gte('recorded_at', since.toISOString())
        .order('recorded_at', { ascending: false });

      if (error) throw error;

      return (history || []).map((h) => ({
        productId: h.product_id,
        storeId: h.store_id,
        storeName: h.store?.name,
        price: h.price,
        recordedAt: new Date(h.recorded_at)
      }));
    } catch (error: unknown) {
      logger.error('Error fetching price history:', 'priceTracker', error);
      return [];
    }
  }

  async getLowestPrice(productId: string): Promise<PriceInfo | null> {
    const recent = await this.getPriceHistory(productId, 7);

    if (recent.length === 0) return null;

    return recent.reduce((lowest, current) =>
      current.price < lowest.price ? current : lowest
    );
  }

  async getLowestPrices(productIds: string[]): Promise<Map<string, PriceInfo>> {
    const lowestPrices = new Map<string, PriceInfo>();

    // Batch fetch for efficiency
    const since = new Date();
    since.setDate(since.getDate() - 7);

    try {
      const { data: history, error } = await this.supabase
        .from('price_history')
        .select(`
          *,
          store:stores(name)
        `)
        .in('product_id', productIds)
        .gte('recorded_at', since.toISOString())
        .order('price', { ascending: true });

      if (error) throw error;

      // Group by product and get lowest for each
      (history || []).forEach((h) => {
        const productId = h.product_id;
        if (!lowestPrices.has(productId)) {
          lowestPrices.set(productId, {
            productId: h.product_id,
            storeId: h.store_id,
            storeName: h.store?.name,
            price: h.price,
            recordedAt: new Date(h.recorded_at)
          });
        }
      });
    } catch (error: unknown) {
      logger.error('Error fetching lowest prices:', 'priceTracker', error);
    }

    return lowestPrices;
  }

  async getPriceTrends(productId: string, days: number = 30): Promise<PriceTrend> {
    const history = await this.getPriceHistory(productId, days);

    if (history.length === 0) {
      return {
        average: 0,
        min: 0,
        max: 0,
        trend: 'stable',
        percentageChange: 0
      };
    }

    const prices = history.map(h => h.price);
    const average = prices.reduce((a, b) => a + b, 0) / prices.length;
    const min = Math.min(...prices);
    const max = Math.max(...prices);

    // Calculate trend based on recent vs older prices
    const midPoint = Math.floor(history.length / 2);
    const recentPrices = history.slice(0, midPoint);
    const olderPrices = history.slice(midPoint);

    if (recentPrices.length === 0 || olderPrices.length === 0) {
      return {
        average,
        min,
        max,
        trend: 'stable',
        percentageChange: 0
      };
    }

    const recentAvg = recentPrices.reduce((a, b) => a + b.price, 0) / recentPrices.length;
    const olderAvg = olderPrices.reduce((a, b) => a + b.price, 0) / olderPrices.length;

    const percentageChange = ((recentAvg - olderAvg) / olderAvg) * 100;

    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (percentageChange > 5) trend = 'up';
    else if (percentageChange < -5) trend = 'down';

    return {
      average,
      min,
      max,
      trend,
      percentageChange
    };
  }

  async compareStores(productId: string): Promise<Array<{
    store: string;
    averagePrice: number;
    lastPrice: number;
    priceCount: number;
  }>> {
    const history = await this.getPriceHistory(productId, 30);

    // Group by store
    const storeData = new Map<string, number[]>();
    history.forEach(h => {
      const storePrices = storeData.get(h.storeId) || [];
      storePrices.push(h.price);
      storeData.set(h.storeId, storePrices);
    });

    // Calculate stats per store
    const comparison = Array.from(storeData.entries()).map(([storeId, prices]) => {
      const storeName = history.find(h => h.storeId === storeId)?.storeName || storeId;
      const averagePrice = prices.reduce((a, b) => a + b, 0) / prices.length;
      const lastPrice = prices[0]; // Most recent

      return {
        store: storeName,
        averagePrice,
        lastPrice,
        priceCount: prices.length
      };
    });

    // Sort by average price
    return comparison.sort((a, b) => a.averagePrice - b.averagePrice);
  }

  async findPriceAlerts(userId: string, threshold: number = 20): Promise<Array<{
    productName: string;
    previousPrice: number;
    currentPrice: number;
    percentageChange: number;
    store: string;
  }>> {
    // This would check user's tracked products for significant price changes
    // For now, return empty array
    return [];
  }
}

// Export singleton instance
export const priceTracker = PriceTracker.getInstance();
