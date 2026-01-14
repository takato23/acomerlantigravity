import { supabase } from '@/lib/supabase/client';
import { differenceInDays, differenceInWeeks, parseISO } from 'date-fns';

export interface UserUsage {
    weekly_plans_generated: number;
    daily_chat_messages: number;
    daily_recipes_generated: number;
    last_weekly_reset: string;
    last_daily_reset: string;
}

export type FeatureKey = 'weekly_plan' | 'chef_chat' | 'recipe_gen';

export const QUOTAS = {
    FREE: {
        weekly_plan: 1, // 1 per week
        chef_chat: 5,   // 5 per day
        recipe_gen: 3,  // 3 per day
    },
    PREMIUM: {
        weekly_plan: 9999,
        chef_chat: 9999,
        recipe_gen: 9999,
    }
};

class UsageTracker {
    private static instance: UsageTracker;
    private currentUsage: UserUsage | null = null;
    private isPremium: boolean = false;

    private constructor() { }

    static getInstance(): UsageTracker {
        if (!UsageTracker.instance) {
            UsageTracker.instance = new UsageTracker();
        }
        return UsageTracker.instance;
    }

    async initialize(userId: string): Promise<void> {
        // 1. Check Subscription
        const { data: sub } = await supabase
            .from('subscriptions')
            .select('status, plan_type')
            .eq('user_id', userId)
            .single();

        this.isPremium = sub?.status === 'active' || sub?.status === 'trialing'; // Simple check

        // 2. Get or Create Usage
        const { data: usage, error } = await supabase
            .from('user_usage')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (!usage && !error) {
            // Create if not exists
            const { data: newUsage } = await supabase
                .from('user_usage')
                .insert({ user_id: userId })
                .select()
                .single();
            this.currentUsage = newUsage;
        } else {
            this.currentUsage = usage;
            await this.checkAndResetQuotas(userId);
        }
    }

    private async checkAndResetQuotas(userId: string) {
        if (!this.currentUsage) return;

        const now = new Date();
        const lastDaily = parseISO(this.currentUsage.last_daily_reset);
        const lastWeekly = parseISO(this.currentUsage.last_weekly_reset);

        const updates: any = {};

        // Daily Reset
        if (differenceInDays(now, lastDaily) >= 1) {
            updates.daily_chat_messages = 0;
            updates.daily_recipes_generated = 0;
            updates.last_daily_reset = now.toISOString();
        }

        // Weekly Reset
        if (differenceInWeeks(now, lastWeekly) >= 1) {
            updates.weekly_plans_generated = 0;
            updates.last_weekly_reset = now.toISOString();
        }

        if (Object.keys(updates).length > 0) {
            const { data } = await supabase
                .from('user_usage')
                .update(updates)
                .eq('user_id', userId)
                .select()
                .single();

            this.currentUsage = data;
        }
    }

    async checkLimit(feature: FeatureKey): Promise<boolean> {
        if (this.isPremium) return true;
        if (!this.currentUsage) return true; // Fail open if no usage data to avoid blocking

        const limit = QUOTAS.FREE[feature];
        let current = 0;

        switch (feature) {
            case 'weekly_plan': current = this.currentUsage.weekly_plans_generated; break;
            case 'chef_chat': current = this.currentUsage.daily_chat_messages; break;
            case 'recipe_gen': current = this.currentUsage.daily_recipes_generated; break;
        }

        return current < limit;
    }

    async incrementUsage(feature: FeatureKey, userId: string): Promise<void> {
        if (this.isPremium) return; // Don't track/limit premium heavily (or just track for analytics)

        const updates: any = {};

        switch (feature) {
            case 'weekly_plan':
                updates.weekly_plans_generated = (this.currentUsage?.weekly_plans_generated || 0) + 1;
                break;
            case 'chef_chat':
                updates.daily_chat_messages = (this.currentUsage?.daily_chat_messages || 0) + 1;
                break;
            case 'recipe_gen':
                updates.daily_recipes_generated = (this.currentUsage?.daily_recipes_generated || 0) + 1;
                break;
        }

        // Optimistic update
        if (this.currentUsage) {
            this.currentUsage = { ...this.currentUsage, ...updates };
        }

        // Sync to DB
        await supabase.from('user_usage').update(updates).eq('user_id', userId);
    }

    getRemaining(feature: FeatureKey): number {
        if (this.isPremium) return 999;
        if (!this.currentUsage) return QUOTAS.FREE[feature];

        const limit = QUOTAS.FREE[feature];
        let current = 0;

        switch (feature) {
            case 'weekly_plan': current = this.currentUsage.weekly_plans_generated; break;
            case 'chef_chat': current = this.currentUsage.daily_chat_messages; break;
            case 'recipe_gen': current = this.currentUsage.daily_recipes_generated; break;
        }

        return Math.max(0, limit - current);
    }

    getIsPremium(): boolean {
        return this.isPremium;
    }
}

export const usageTracker = UsageTracker.getInstance();
