import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

import { shoppingService } from '@/lib/supabase/shopping';
import { offlineShoppingService } from '@/services/shopping/offlineShoppingService';
import { useAppStore } from '@/store';
import { usePantryStore } from '@/features/pantry/store/pantryStore';
import {
  ShoppingList as UnifiedShoppingList,
  ShoppingListItem
} from '@/features/meal-planning/types';
import type { Database } from '@/lib/supabase/database.types';

type ShoppingList = Database['public']['Tables']['shopping_lists']['Row'] & {
  shopping_list_items?: ShoppingListItem[];
};
type ShoppingItem = Database['public']['Tables']['shopping_items']['Row'];

export function useShoppingList() {
  const user = useAppStore((state) => state.user.profile);
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [activeList, setActiveList] = useState<ShoppingList | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const shoppingServiceToUse = user ? shoppingService : offlineShoppingService;
  const userIdToUse = user ? user.id : 'offline-user';

  // Pantry integration for auto-adding purchased items
  const addItemsToPantry = usePantryStore((s) => s.addItemsFromShoppingList);

  // Fetch all lists
  const fetchLists = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await shoppingServiceToUse.getLists(userIdToUse);
      setLists(data);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar las listas';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [user, userIdToUse]);

  // Fetch active list with items
  const fetchActiveList = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await shoppingServiceToUse.getActiveList(userIdToUse);
      // @ts-ignore - The offline service returns the list WITH items, matching the enhanced type expected here
      setActiveList(data);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar la lista activa';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [user, userIdToUse]);

  // Create a new list
  const createList = useCallback(async (name: string, makeActive = false) => {
    try {
      const newList = await shoppingServiceToUse.createList(userIdToUse, { name, is_active: makeActive });
      setLists(prev => [newList, ...prev]);
      if (makeActive) {
        setActiveList(newList);
      }
      toast.success('Lista creada exitosamente');
      return newList;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al crear la lista';
      toast.error(message);
      throw err;
    }
  }, [user, userIdToUse]);

  // Update list
  const updateList = useCallback(async (listId: string, updates: Partial<ShoppingList>) => {
    try {
      const updatedList = await shoppingServiceToUse.updateList(listId, updates);
      setLists(prev => prev.map(list => list.id === listId ? { ...list, ...updatedList } : list));
      if (activeList?.id === listId) {
        setActiveList(prev => prev ? { ...prev, ...updatedList } : null);
      }
      toast.success('Lista actualizada');
      return updatedList;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al actualizar la lista';
      toast.error(message);
      throw err;
    }
  }, [activeList, shoppingServiceToUse]);

  // Delete list
  const deleteList = useCallback(async (listId: string) => {
    try {
      await shoppingServiceToUse.deleteList(listId);
      setLists(prev => prev.filter(list => list.id !== listId));
      if (activeList?.id === listId) {
        setActiveList(null);
      }
      toast.success('Lista eliminada');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al eliminar la lista';
      toast.error(message);
      throw err;
    }
  }, [activeList, shoppingServiceToUse]);

  // Add item to active list
  const addItem = useCallback(async (
    item: Omit<ShoppingItem, 'id' | 'list_id' | 'created_at' | 'updated_at' | 'position'>,
    listId?: string
  ) => {
    const targetListId = listId || activeList?.id;
    if (!targetListId) {
      toast.error('No hay una lista activa');
      return;
    }

    try {
      const newItem = await shoppingServiceToUse.addItem(targetListId, item);
      // Refetch the active list to ensure consistency
      const updatedList = await shoppingServiceToUse.getActiveList(userIdToUse);
      // @ts-ignore
      setActiveList(updatedList);
      toast.success('Item agregado');
      return newItem;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al agregar el item';
      toast.error(message);
      throw err;
    }
  }, [activeList?.id, shoppingServiceToUse, userIdToUse]);

  // Add multiple items
  const addItems = useCallback(async (
    items: Omit<ShoppingItem, 'id' | 'list_id' | 'created_at' | 'updated_at' | 'position'>[]
  ) => {
    try {
      // Loop sequentially to maintain order/priority if needed, or use Promise.all for speed
      // Using sequence to avoid potential race conditions with priorities
      for (const item of items) {
        await addItem(item);
      }
      toast.success(`${items.length} items agregados`);
    } catch (err) {
      // Error is already handled in addItem
    }
  }, [addItem]);

  // Update item
  const updateItem = useCallback(async (itemId: string, updates: Partial<ShoppingItem>) => {
    try {
      const updatedItem = await shoppingServiceToUse.updateItem(itemId, updates);
      setActiveList(prev => {
        if (!prev) return null;
        return {
          ...prev,
          shopping_list_items: prev.shopping_list_items?.map(item =>
            item.id === itemId ? { ...item, ...updatedItem } : item
          )
        };
      });
      return updatedItem;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al actualizar el item';
      toast.error(message);
      throw err;
    }
  }, [shoppingServiceToUse]);

  // Delete item
  const deleteItem = useCallback(async (itemId: string) => {
    try {
      await shoppingServiceToUse.deleteItem(itemId);
      setActiveList(prev => {
        if (!prev) return null;
        return {
          ...prev,
          shopping_list_items: prev.shopping_list_items?.filter(item => item.id !== itemId)
        };
      });
      toast.success('Item eliminado');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al eliminar el item';
      toast.error(message);
      throw err;
    }
  }, [shoppingServiceToUse]);

  // Toggle item - also adds to pantry when marked as purchased
  const toggleItem = useCallback(async (itemId: string) => {
    try {
      // Find the current item before toggling to determine next state
      const currentItem = activeList?.shopping_list_items?.find(item => item.id === itemId);
      const willBePurchased = currentItem && !currentItem.is_purchased;

      const updatedItem = await shoppingServiceToUse.toggleItem(itemId);
      setActiveList(prev => {
        if (!prev) return null;
        return {
          ...prev,
          shopping_list_items: prev.shopping_list_items?.map(item =>
            item.id === itemId ? updatedItem : item
          )
        };
      });

      // If item is now marked as purchased, add it to pantry
      if (willBePurchased && currentItem) {
        try {
          await addItemsToPantry([{
            ingredientName: currentItem.custom_name || 'Sin nombre',
            totalAmount: currentItem.quantity || 1,
            unit: currentItem.unit || 'u',
            category: currentItem.category || 'Pantry'
          }]);
          toast.success(`✅ ${currentItem.custom_name || 'Item'} agregado a tu despensa`);
        } catch (pantryError) {
          // Don't fail the toggle if pantry add fails
          console.error('Error adding to pantry:', pantryError);
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al actualizar el item';
      toast.error(message);
      throw err;
    }
  }, [shoppingServiceToUse, activeList, addItemsToPantry]);

  // Bulk toggle items
  const bulkToggleItems = useCallback(async (itemIds: string[], checked: boolean) => {
    if (!activeList) return;

    try {
      await shoppingServiceToUse.bulkToggleItems(activeList.id, itemIds, checked);
      setActiveList(prev => {
        if (!prev) return null;
        return {
          ...prev,
          shopping_list_items: prev.shopping_list_items?.map(item =>
            itemIds.includes(item.id) ? { ...item, checked } : item
          )
        };
      });
      toast.success(`${itemIds.length} items actualizados`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al actualizar los items';
      toast.error(message);
      throw err;
    }
  }, [activeList, shoppingServiceToUse]);

  // Reorder items
  const reorderItems = useCallback(async (itemIds: string[]) => {
    if (!activeList) return;

    try {
      await shoppingServiceToUse.reorderItems(activeList.id, itemIds);
      // Reorder locally
      setActiveList(prev => {
        if (!prev || !prev.shopping_list_items) return null;
        const itemMap = new Map(prev.shopping_list_items.map(item => [item.id, item]));
        const reorderedItems = itemIds.map((id, index) => {
          const item = itemMap.get(id);
          return item ? { ...item, position: index } : null;
        }).filter(Boolean) as ShoppingItem[];
        return { ...prev, shopping_list_items: reorderedItems };
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al reordenar los items';
      toast.error(message);
      throw err;
    }
  }, [activeList, shoppingServiceToUse]);

  // Set active list
  const setActiveListById = useCallback(async (listId: string) => {
    const list = lists.find(l => l.id === listId);
    if (list) {
      // Fetch full list with items
      try {
        const data = await shoppingServiceToUse.getItems(listId);
        setActiveList({ ...list, shopping_list_items: data });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al cargar los items';
        toast.error(message);
      }
    }
  }, [lists, shoppingServiceToUse]);

  // Initialize
  useEffect(() => {
    // We explicitly want this to run whether user is logged in or not
    fetchLists();
    fetchActiveList();
  }, [user, fetchLists, fetchActiveList]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!activeList) return;

    const unsubscribe = shoppingServiceToUse.subscribeToList(activeList.id, (payload) => {
      // Handle real-time updates
      if (payload.eventType === 'INSERT') {
        setActiveList(prev => {
          if (!prev) return null;
          return {
            ...prev,
            shopping_list_items: [...(prev.shopping_list_items || []), payload.new]
          };
        });
      } else if (payload.eventType === 'UPDATE') {
        setActiveList(prev => {
          if (!prev) return null;
          return {
            ...prev,
            shopping_list_items: prev.shopping_list_items?.map(item =>
              item.id === payload.new.id ? payload.new : item
            )
          };
        });
      } else if (payload.eventType === 'DELETE') {
        setActiveList(prev => {
          if (!prev) return null;
          return {
            ...prev,
            shopping_list_items: prev.shopping_list_items?.filter(item => item.id !== payload.old.id)
          };
        });
      }
    });

    return unsubscribe;
  }, [activeList?.id, shoppingServiceToUse]);

  return {
    lists,
    activeList,
    isLoading,
    error,
    createList,
    updateList,
    deleteList,
    addItem,
    addItems,
    updateItem,
    deleteItem,
    toggleItem,
    bulkToggleItems,
    reorderItems,
    setActiveListById,
    refresh: fetchActiveList
  };
}
