'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { usageTracker, FeatureKey } from './UsageTracker';
import { UpgradeModal } from './components/UpgradeModal';
import { toast } from 'sonner';

interface MonetizationContextType {
    isPremium: boolean;
    isLoading: boolean;
    checkAccess: (feature: FeatureKey, autoShowModal?: boolean) => Promise<boolean>;
    trackAction: (feature: FeatureKey) => Promise<void>;
    openUpgradeModal: (reason?: string) => void;
    getRemainingQuota: (feature: FeatureKey) => number;
}

const MonetizationContext = createContext<MonetizationContextType | null>(null);

export function useMonetization() {
    const context = useContext(MonetizationContext);
    if (!context) {
        throw new Error('useMonetization must be used within a MonetizationProvider');
    }
    return context;
}

export function MonetizationProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [isPremium, setIsPremium] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalReason, setModalReason] = useState<string | undefined>(undefined);

    // Initialize tracker on auth change
    useEffect(() => {
        const initTracker = async () => {
            if (user?.id) {
                setIsLoading(true);
                try {
                    await usageTracker.initialize(user.id);
                    setIsPremium(usageTracker.getIsPremium());
                } catch (error) {
                    console.error('Failed to init usage tracker', error);
                } finally {
                    setIsLoading(false);
                }
            } else {
                setIsLoading(false);
                setIsPremium(false);
            }
        };

        initTracker();
    }, [user]);

    const openUpgradeModal = useCallback((reason?: string) => {
        setModalReason(reason);
        setModalOpen(true);
    }, []);

    const checkAccess = useCallback(async (feature: FeatureKey, autoShowModal = true): Promise<boolean> => {
        if (!user) return true; // Allow guests for some things or handle separately, but usually auth required

        const allowed = await usageTracker.checkLimit(feature);

        if (!allowed && autoShowModal) {
            const featureNames = {
                weekly_plan: 'Has alcanzado tu límite de planes semanales.',
                chef_chat: 'Límite de mensajes diarios alcanzado.',
                recipe_gen: 'Límite de recetas diarias alcanzado.',
            };

            openUpgradeModal(featureNames[feature] || 'Límite alcanzado.');
        }

        return allowed;
    }, [user, openUpgradeModal]);

    const trackAction = useCallback(async (feature: FeatureKey) => {
        if (user?.id) {
            await usageTracker.incrementUsage(feature, user.id);
            // Re-sync premium status just in case
            setIsPremium(usageTracker.getIsPremium());
        }
    }, [user]);

    const getRemainingQuota = useCallback((feature: FeatureKey) => {
        return usageTracker.getRemaining(feature);
    }, []);

    const value = {
        isPremium,
        isLoading,
        checkAccess,
        trackAction,
        openUpgradeModal,
        getRemainingQuota
    };

    return (
        <MonetizationContext.Provider value={value}>
            {children}
            <UpgradeModal
                open={modalOpen}
                onOpenChange={setModalOpen}
                triggerReason={modalReason}
            />
        </MonetizationContext.Provider>
    );
}
