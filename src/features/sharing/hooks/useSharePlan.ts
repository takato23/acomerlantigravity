'use client';

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/providers/SupabaseAuthProvider';
import { toast } from 'sonner';
import type { WeekPlan } from '@/features/meal-planning/types';

interface SharedPlanEntry {
    id: string;
    plan_id: string | null;
    creator_id: string;
    share_token: string;
    plan_snapshot: WeekPlan;
    title: string | null;
    created_at: string;
    expires_at: string | null;
    views: number;
    is_active: boolean;
}

interface UseSharePlanReturn {
    isSharing: boolean;
    mySharedPlans: SharedPlanEntry[];
    createShareLink: (weekPlan: WeekPlan, title?: string) => Promise<string | null>;
    loadMySharedPlans: () => Promise<void>;
    deactivateShareLink: (id: string) => Promise<void>;
    deleteShareLink: (id: string) => Promise<void>;
    getSharedPlan: (token: string) => Promise<SharedPlanEntry | null>;
}

/**
 * Generates a unique share token
 */
function generateToken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 16; i++) {
        token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
}

export function useSharePlan(): UseSharePlanReturn {
    const { user } = useAuth();
    const [isSharing, setIsSharing] = useState(false);
    const [mySharedPlans, setMySharedPlans] = useState<SharedPlanEntry[]>([]);

    /**
     * Create a shareable link for a week plan
     */
    const createShareLink = useCallback(async (
        weekPlan: WeekPlan,
        title?: string
    ): Promise<string | null> => {
        if (!user) {
            toast.error('Debes iniciar sesión para compartir');
            return null;
        }

        setIsSharing(true);

        try {
            const token = generateToken();

            const { data, error } = await supabase
                .from('shared_plans')
                .insert({
                    creator_id: user.id,
                    share_token: token,
                    plan_snapshot: weekPlan,
                    title: title || `Plan del ${weekPlan.startDate}`,
                    plan_id: weekPlan.id
                })
                .select('share_token')
                .single();

            if (error) throw error;

            const shareUrl = `${window.location.origin}/shared/${data.share_token}`;

            // Copy to clipboard
            await navigator.clipboard.writeText(shareUrl);

            toast.success('🔗 Link copiado al portapapeles', {
                description: 'Comparte este link con tu familia'
            });

            return shareUrl;
        } catch (err) {
            console.error('Error creating share link:', err);
            toast.error('Error al crear el link');
            return null;
        } finally {
            setIsSharing(false);
        }
    }, [user]);

    /**
     * Load all shared plans created by the user
     */
    const loadMySharedPlans = useCallback(async () => {
        if (!user) return;

        try {
            const { data, error } = await supabase
                .from('shared_plans')
                .select('*')
                .eq('creator_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setMySharedPlans(data || []);
        } catch (err) {
            console.error('Error loading shared plans:', err);
        }
    }, [user]);

    /**
     * Deactivate a share link (can be reactivated)
     */
    const deactivateShareLink = useCallback(async (id: string) => {
        if (!user) return;

        try {
            const { error } = await supabase
                .from('shared_plans')
                .update({ is_active: false })
                .eq('id', id)
                .eq('creator_id', user.id);

            if (error) throw error;

            setMySharedPlans(prev =>
                prev.map(sp => sp.id === id ? { ...sp, is_active: false } : sp)
            );

            toast.success('Link desactivado');
        } catch (err) {
            console.error('Error deactivating share link:', err);
            toast.error('Error al desactivar el link');
        }
    }, [user]);

    /**
     * Permanently delete a share link
     */
    const deleteShareLink = useCallback(async (id: string) => {
        if (!user) return;

        try {
            const { error } = await supabase
                .from('shared_plans')
                .delete()
                .eq('id', id)
                .eq('creator_id', user.id);

            if (error) throw error;

            setMySharedPlans(prev => prev.filter(sp => sp.id !== id));
            toast.success('Link eliminado');
        } catch (err) {
            console.error('Error deleting share link:', err);
            toast.error('Error al eliminar el link');
        }
    }, [user]);

    /**
     * Get a shared plan by token (public access)
     */
    const getSharedPlan = useCallback(async (token: string): Promise<SharedPlanEntry | null> => {
        try {
            const { data, error } = await supabase
                .from('shared_plans')
                .select('*')
                .eq('share_token', token)
                .eq('is_active', true)
                .single();

            if (error) throw error;

            // Increment view count
            await supabase.rpc('increment_shared_plan_views', { token });

            return data;
        } catch (err) {
            console.error('Error fetching shared plan:', err);
            return null;
        }
    }, []);

    return {
        isSharing,
        mySharedPlans,
        createShareLink,
        loadMySharedPlans,
        deactivateShareLink,
        deleteShareLink,
        getSharedPlan
    };
}
