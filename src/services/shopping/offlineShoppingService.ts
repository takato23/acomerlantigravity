import type { Database } from '@/lib/supabase/database.types';

type ShoppingList = Database['public']['Tables']['shopping_lists']['Row'];
type ShoppingItem = Database['public']['Tables']['shopping_list_items']['Row'];
type ShoppingListInsert = Database['public']['Tables']['shopping_lists']['Insert'];
type ShoppingItemInsert = Database['public']['Tables']['shopping_list_items']['Insert'];
type ShoppingListUpdate = Database['public']['Tables']['shopping_lists']['Update'];
type ShoppingItemUpdate = Database['public']['Tables']['shopping_list_items']['Update'];

const STORAGE_KEY_LISTS = 'kecarajo_shopping_lists';
const STORAGE_KEY_ITEMS = 'kecarajo_shopping_items';

// Check if an ID is a valid UUID format
const isValidUUID = (id: string): boolean => {
    if (!id || typeof id !== 'string') return false;
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
};

// Sanitize lists - fix corrupt IDs
const sanitizeLists = (lists: ShoppingList[]): ShoppingList[] => {
    if (!Array.isArray(lists)) return [];
    return lists
        .filter(list => list && typeof list === 'object')
        .map(list => ({
            ...list,
            id: isValidUUID(list.id) ? list.id : crypto.randomUUID()
        }));
};

// Sanitize items - fix corrupt IDs and filter out broken entries
const sanitizeItems = (items: ShoppingItem[]): ShoppingItem[] => {
    if (!Array.isArray(items)) return [];
    return items
        .filter(item => item && typeof item === 'object' && item.shopping_list_id)
        .map(item => ({
            ...item,
            id: isValidUUID(item.id) ? item.id : crypto.randomUUID()
        }));
};

// Helper to get data from local storage
const getStoredLists = (): ShoppingList[] => {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(STORAGE_KEY_LISTS);
    if (!stored) return [];
    try {
        const parsed = JSON.parse(stored);
        const sanitized = sanitizeLists(parsed);
        // Save sanitized data back if different
        if (JSON.stringify(sanitized) !== stored) {
            localStorage.setItem(STORAGE_KEY_LISTS, JSON.stringify(sanitized));
        }
        return sanitized;
    } catch {
        return [];
    }
};

const getStoredItems = (): ShoppingItem[] => {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(STORAGE_KEY_ITEMS);
    if (!stored) return [];
    try {
        const parsed = JSON.parse(stored);
        const sanitized = sanitizeItems(parsed);
        // Save sanitized data back if different
        if (JSON.stringify(sanitized) !== stored) {
            localStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(sanitized));
        }
        return sanitized;
    } catch {
        return [];
    }
};

const saveLists = (lists: ShoppingList[]) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY_LISTS, JSON.stringify(sanitizeLists(lists)));
};

const saveItems = (items: ShoppingItem[]) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(sanitizeItems(items)));
};

export const offlineShoppingService = {
    // Shopping Lists
    async getLists(userId: string) {
        // userId is ignored in offline mode, we just return all local lists
        return getStoredLists();
    },

    async getActiveList(userId: string) {
        const lists = getStoredLists();
        let activeList = lists.find(l => l.is_active);

        if (!activeList) {
            // Create a default list if none exists
            if (lists.length === 0) {
                return this.createList(userId, { name: 'Mi Lista (Offline)', is_active: true });
            }
            // Should catch the case where lists exist but none are active, maybe just return the first one?
            // For compliance with the interface, if no active list is strictly found and we have lists, 
            // we might want to just make the first one active.
            activeList = lists[0];
        }

        // We need to return the list AND its items attached
        const items = getStoredItems().filter(item => item.shopping_list_id === activeList!.id);
        return { ...activeList, shopping_list_items: items };
    },

    async createList(userId: string, list: Partial<ShoppingListInsert>) {
        const lists = getStoredLists();

        const newList: ShoppingList = {
            id: crypto.randomUUID(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            user_id: 'offline-user', // Mock User ID
            name: list.name || 'Nueva Lista',
            is_active: list.is_active ?? false,
            is_archived: false,
            is_shared: false,
            color: null,
            icon: null
        };

        if (newList.is_active) {
            // Deactivate others
            lists.forEach(l => l.is_active = false);
        }

        lists.unshift(newList);
        saveLists(lists);

        return { ...newList, shopping_list_items: [] };
    },

    async updateList(listId: string, updates: ShoppingListUpdate) {
        const lists = getStoredLists();
        const index = lists.findIndex(l => l.id === listId);

        if (index === -1) throw new Error('List not found');

        const updatedList = { ...lists[index], ...updates, updated_at: new Date().toISOString() };

        if (updates.is_active) {
            lists.forEach(l => l.is_active = false);
        }

        lists[index] = updatedList;
        saveLists(lists);
        return updatedList;
    },

    async deleteList(listId: string) {
        let lists = getStoredLists();
        lists = lists.filter(l => l.id !== listId);
        saveLists(lists);

        // Also delete associated items
        let items = getStoredItems();
        items = items.filter(i => i.shopping_list_id !== listId);
        saveItems(items);
    },

    // Shopping Items
    async getItems(listId: string) {
        const items = getStoredItems();
        return items
            .filter(i => i.shopping_list_id === listId)
            .sort((a, b) => (a.priority || 0) - (b.priority || 0));
    },

    async addItem(listId: string, item: Omit<ShoppingItemInsert, 'shopping_list_id'>) {
        const items = getStoredItems();
        const listItems = items.filter(i => i.shopping_list_id === listId);

        // Calculate priority
        const maxPriority = listItems.reduce((max, curr) => Math.max(max, curr.priority || 0), -1);
        const nextPriority = maxPriority + 1;

        const newItem: ShoppingItem = {
            id: crypto.randomUUID(),
            shopping_list_id: listId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            custom_name: item.custom_name || null,
            product_id: item.product_id || null,
            quantity: item.quantity || 1,
            unit: item.unit || 'unidades',
            category: item.category || 'otros',
            is_purchased: false,
            priority: nextPriority,
            notes: item.notes || null,
            estimated_cost: item.estimated_cost || null,
            source: item.source || null,
            added_by: 'offline-user'
        };

        items.push(newItem);
        saveItems(items);
        return newItem;
    },

    async updateItem(itemId: string, updates: ShoppingItemUpdate) {
        const items = getStoredItems();
        const index = items.findIndex(i => i.id === itemId);

        if (index === -1) throw new Error('Item not found');

        const updatedItem = { ...items[index], ...updates, updated_at: new Date().toISOString() };
        items[index] = updatedItem;
        saveItems(items);
        return updatedItem;
    },

    async deleteItem(itemId: string) {
        let items = getStoredItems();
        items = items.filter(i => i.id !== itemId);
        saveItems(items);
    },

    async toggleItem(itemId: string) {
        const items = getStoredItems();
        const index = items.findIndex(i => i.id === itemId);

        if (index === -1) throw new Error('Item not found');

        const item = items[index];
        const updatedItem = { ...item, is_purchased: !item.is_purchased, updated_at: new Date().toISOString() };

        items[index] = updatedItem;
        saveItems(items);
        return updatedItem;
    },

    async bulkToggleItems(listId: string, itemIds: string[], is_purchased: boolean) {
        const items = getStoredItems();
        let updated = false;

        itemIds.forEach(id => {
            const index = items.findIndex(i => i.id === id);
            if (index !== -1 && items[index].shopping_list_id === listId) {
                items[index] = { ...items[index], is_purchased, updated_at: new Date().toISOString() };
                updated = true;
            }
        });

        if (updated) saveItems(items);
    },

    async reorderItems(listId: string, itemIds: string[]) {
        const items = getStoredItems();
        let updated = false;

        itemIds.forEach((id, index) => {
            const itemIndex = items.findIndex(i => i.id === id);
            if (itemIndex !== -1 && items[itemIndex].shopping_list_id === listId) {
                items[itemIndex] = { ...items[itemIndex], priority: index, updated_at: new Date().toISOString() };
                updated = true;
            }
        });

        if (updated) saveItems(items);
    },

    // Stubbing subscription for offline mode (no-op)
    subscribeToList(listId: string, callback: (payload: any) => void) {
        return () => { }; // No-op unsubscribe
    }
};
