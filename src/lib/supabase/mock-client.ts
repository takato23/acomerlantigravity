/* eslint-disable @typescript-eslint/no-explicit-any */
import { Database } from './database.types';

// Mock data generator helper
const createMockUser = () => ({
    id: 'mock-user-id-123',
    email: 'usuario@ejemplo.com',
    user_metadata: {
        name: 'Usuario Demo',
    },
    created_at: new Date().toISOString(),
});

/**
 * A highly simplified mock of the Supabase client for development without credentials
 */
const createQueryBuilder = (table: string) => {
    const builder: any = {
        data: getMockDataForTable(table),
        error: null,
        select: () => builder,
        insert: () => builder,
        update: () => builder,
        upsert: () => builder,
        delete: () => builder,
        eq: () => builder,
        in: () => builder,
        order: () => builder,
        limit: () => builder,
        abortSignal: () => builder, // Add support for abort signals
        single: async () => ({ data: getMockDataForTable(table, true), error: null }),
        maybeSingle: async () => ({ data: getMockDataForTable(table, true), error: null }),
    };

    return builder;
};

export const mockSupabaseClient = {
    auth: {
        getUser: async () => ({
            data: { user: createMockUser() },
            error: null,
        }),
        getSession: async () => ({
            data: { session: { user: createMockUser(), access_token: 'mock-token' } },
            error: null,
        }),
        signInWithPassword: async () => ({
            data: { user: createMockUser(), session: { user: createMockUser(), access_token: 'mock-token' } },
            error: null,
        }),
        signOut: async () => ({ error: null }),
        onAuthStateChange: (callback: any) => {
            // Immediately trigger callback with mock session
            setTimeout(() => {
                callback('SIGNED_IN', { user: createMockUser(), access_token: 'mock-token' });
            }, 0);
            return { data: { subscription: { unsubscribe: () => { } } } };
        },
    },
    from: (table: string) => createQueryBuilder(table),
    storage: {
        from: () => ({
            upload: async () => ({ data: { path: 'mock-path' }, error: null }),
            getPublicUrl: () => ({ data: { publicUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c' } }),
        }),
    },
    channel: () => ({
        on: function () { return this; },
        subscribe: () => ({
            unsubscribe: () => { }
        }),
        unsubscribe: () => { }
    }),
    removeChannel: async (channel?: { unsubscribe?: () => void }) => {
        channel?.unsubscribe?.();
        return { status: 'ok' };
    },
    rpc: async () => ({ data: null, error: null }),
} as any;

function getMockDataForTable(table: string, single = false) {
    const data: Record<string, any[]> = {
        ingredients: [
            { id: '1', name: 'Pollo', category: 'Proteína', default_unit: 'g' },
            { id: '2', name: 'Arroz', category: 'Carbohidratos', default_unit: 'g' },
            { id: '3', name: 'Tomate', category: 'Vegetales', default_unit: 'unidad' },
        ],
        recipes: [
            {
                id: '1',
                name: 'Pollo con Arroz Demo',
                description: 'Una receta clásica de prueba',
                preparation_time: 15,
                cooking_time: 30,
                difficulty_level: 'Fácil',
                ingredients: [{ name: 'Pollo', amount: 500, unit: 'g' }],
                instructions: ['Lavar el arroz', 'Cocinar el pollo', 'Mezclar todo'],
            },
        ],
        pantry_items: [
            { id: '1', custom_name: 'Pollo congelado', quantity: 2, unit: 'kg' },
        ],
        meal_plans: [
            {
                id: 'mock-meal-plan-1',
                user_id: 'mock-user-id-123',
                name: 'Semana demo',
                start_date: '2025-01-01',
                end_date: '2025-01-07',
                is_template: false,
                is_public: false,
                created_at: new Date().toISOString(),
            },
        ],
        planned_meals: [],
        shopping_lists: [
            { id: '1', name: 'Lista Semanal', items: [] },
        ],
        notifications: [
            {
                id: 'mock-notif-1',
                user_id: 'mock-user-id-123',
                type: 'plan_ready',
                title: 'Tu plan está listo',
                message: 'Tu plan semanal ha sido generado',
                data: {},
                is_read: false,
                is_dismissed: false,
                created_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
            },
            {
                id: 'mock-notif-2',
                user_id: 'mock-user-id-123',
                type: 'daily_reminder',
                title: 'Recordatorio de cocina',
                message: 'Hoy cocinas: Pollo con Arroz',
                data: {},
                is_read: true,
                is_dismissed: false,
                created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
            },
        ],
        user_profiles: [
            {
                id: 'mock-profile-1',
                user_id: 'mock-user-id-123',
                notification_preferences: {
                    email_enabled: true,
                    push_enabled: false,
                    plan_ready: true,
                    daily_reminders: true,
                    shopping_reminders: true,
                    reminder_time: '08:00',
                },
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            },
        ],
    };

    const tableData = data[table] || [];
    return single ? tableData[0] : tableData;
}
