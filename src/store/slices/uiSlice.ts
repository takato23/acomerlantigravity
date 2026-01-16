/**
 * UI Slice - UI state management
 */

import { StateCreator } from 'zustand';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  actions?: {
    label: string;
    action: () => void;
  }[];
  createdAt: Date;
}

export interface Modal {
  id: string;
  component: string;
  props?: any;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  persistent?: boolean; // can't be closed by clicking outside
}

export interface LoadingState {
  [key: string]: boolean;
}

export interface UIState {
  theme: 'light' | 'dark' | 'system' | 'elegant' | 'vibrant' | 'minimal';
  language: 'es' | 'en';
  sidebarOpen: boolean;
  notifications: Notification[];
  modals: Modal[];
  loading: LoadingState;
  preferences: {
    animations: boolean;
    sounds: boolean;
    reducedMotion: boolean;
    highContrast: boolean;
    fontSize: 'sm' | 'md' | 'lg';
    compactMode: boolean;
    showTips: boolean;
    autoSave: boolean;
    confirmActions: boolean;
  };
  layout: {
    currentPage: string;
    breadcrumbs: { label: string; href?: string }[];
    pageTitle?: string;
    pageDescription?: string;
  };
  tour: {
    active: boolean;
    currentStep: number;
    completed: string[]; // tour IDs that have been completed
  };
  search: {
    query: string;
    filters: Record<string, any>;
    results: any[];
    isSearching: boolean;
  };
}

export interface UISlice {
  ui: UIState;

  // Actions
  setTheme: (theme: UIState['theme']) => void;
  setLanguage: (language: UIState['language']) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;

  showNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => void;
  hideNotification: (id: string) => void;
  clearNotifications: () => void;

  setModalOpen: (modal: Omit<Modal, 'id'>) => void;
  closeModal: (id: string) => void;
  closeAllModals: () => void;

  setLoading: (key: string, loading: boolean) => void;
  clearLoading: () => void;

  updatePreferences: (preferences: Partial<UIState['preferences']>) => void;

  setCurrentPage: (page: string, title?: string, description?: string) => void;
  setBreadcrumbs: (breadcrumbs: UIState['layout']['breadcrumbs']) => void;

  startTour: (tourId: string) => void;
  nextTourStep: () => void;
  prevTourStep: () => void;
  completeTour: (tourId: string) => void;
  skipTour: () => void;

  setSearchQuery: (query: string) => void;
  setSearchFilters: (filters: Record<string, any>) => void;
  setSearchResults: (results: any[]) => void;
  setSearching: (searching: boolean) => void;
  clearSearch: () => void;
}

const defaultPreferences = {
  animations: true,
  sounds: false,
  reducedMotion: false,
  highContrast: false,
  fontSize: 'md' as const,
  compactMode: false,
  showTips: true,
  autoSave: true,
  confirmActions: true
};

export const createUISlice: StateCreator<any, [], [], UISlice> = (set, get) => ({
  ui: {
    theme: 'elegant',
    language: 'es',
    sidebarOpen: false,
    notifications: [],
    modals: [],
    loading: {},
    preferences: defaultPreferences,
    layout: {
      currentPage: '',
      breadcrumbs: [],
      pageTitle: undefined,
      pageDescription: undefined
    },
    tour: {
      active: false,
      currentStep: 0,
      completed: []
    },
    search: {
      query: '',
      filters: {},
      results: [],
      isSearching: false
    }
  },

  setTheme: (theme) => set((state: any) => {
    state.ui.theme = theme;

    // Apply theme to document
    if (typeof window !== 'undefined') {
      const root = document.documentElement;
      root.classList.remove('light', 'dark', 'elegant', 'vibrant', 'minimal');

      if (theme === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        root.classList.add(prefersDark ? 'dark' : 'light');
      } else {
        root.classList.add(theme);
      }
    }
  }),

  setLanguage: (language) => set((state: any) => {
    state.ui.language = language;

    // Update document language
    if (typeof window !== 'undefined') {
      document.documentElement.lang = language;
    }
  }),

  toggleSidebar: () => set((state: any) => {
    state.ui.sidebarOpen = !state.ui.sidebarOpen;
  }),

  setSidebarOpen: (open) => set((state: any) => {
    state.ui.sidebarOpen = open;
  }),

  showNotification: (notification) => set((state: any) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString() + Math.random(),
      createdAt: new Date()
    };

    state.ui.notifications.push(newNotification);

    // Auto-remove notification after duration
    if (notification.duration && notification.duration > 0) {
      setTimeout(() => {
        get().hideNotification(newNotification.id);
      }, notification.duration);
    }
  }),

  hideNotification: (id) => set((state: any) => {
    state.ui.notifications = state.ui.notifications.filter((n: any) => n.id !== id);
  }),

  clearNotifications: () => set((state: any) => {
    state.ui.notifications = [];
  }),

  setModalOpen: (modal) => set((state: any) => {
    const newModal: Modal = {
      ...modal,
      id: Date.now().toString() + Math.random()
    };

    state.ui.modals.push(newModal);
  }),

  closeModal: (id) => set((state: any) => {
    state.ui.modals = state.ui.modals.filter((m: any) => m.id !== id);
  }),

  closeAllModals: () => set((state: any) => {
    state.ui.modals = [];
  }),

  setLoading: (key, loading) => set((state: any) => {
    if (loading) {
      state.ui.loading[key] = true;
    } else {
      delete state.ui.loading[key];
    }
  }),

  clearLoading: () => set((state: any) => {
    state.ui.loading = {};
  }),

  updatePreferences: (preferences) => set((state: any) => {
    Object.assign(state.ui.preferences, preferences);

    // Apply preferences to document
    if (typeof window !== 'undefined') {
      const root = document.documentElement;

      // Reduced motion
      if (preferences.reducedMotion !== undefined) {
        root.style.setProperty('--motion-reduce', preferences.reducedMotion ? '1' : '0');
      }

      // High contrast
      if (preferences.highContrast !== undefined) {
        root.classList.toggle('high-contrast', preferences.highContrast);
      }

      // Font size
      if (preferences.fontSize) {
        root.classList.remove('text-sm', 'text-md', 'text-lg');
        root.classList.add(`text-${preferences.fontSize}`);
      }

      // Compact mode
      if (preferences.compactMode !== undefined) {
        root.classList.toggle('compact-mode', preferences.compactMode);
      }
    }
  }),

  setCurrentPage: (page, title, description) => set((state: any) => {
    state.ui.layout.currentPage = page;
    state.ui.layout.pageTitle = title;
    state.ui.layout.pageDescription = description;

    // Update document title
    if (title && typeof window !== 'undefined') {
      document.title = `${title} - KeCarajoComér`;
    }
  }),

  setBreadcrumbs: (breadcrumbs) => set((state: any) => {
    state.ui.layout.breadcrumbs = breadcrumbs;
  }),

  startTour: (tourId) => set((state: any) => {
    state.ui.tour.active = true;
    state.ui.tour.currentStep = 0;
  }),

  nextTourStep: () => set((state: any) => {
    if (state.ui.tour.active) {
      state.ui.tour.currentStep += 1;
    }
  }),

  prevTourStep: () => set((state: any) => {
    if (state.ui.tour.active && state.ui.tour.currentStep > 0) {
      state.ui.tour.currentStep -= 1;
    }
  }),

  completeTour: (tourId) => set((state: any) => {
    state.ui.tour.active = false;
    state.ui.tour.currentStep = 0;

    if (!state.ui.tour.completed.includes(tourId)) {
      state.ui.tour.completed.push(tourId);
    }
  }),

  skipTour: () => set((state: any) => {
    state.ui.tour.active = false;
    state.ui.tour.currentStep = 0;
  }),

  setSearchQuery: (query) => set((state: any) => {
    state.ui.search.query = query;
  }),

  setSearchFilters: (filters) => set((state: any) => {
    state.ui.search.filters = filters;
  }),

  setSearchResults: (results) => set((state: any) => {
    state.ui.search.results = results;
  }),

  setSearching: (searching) => set((state: any) => {
    state.ui.search.isSearching = searching;
  }),

  clearSearch: () => set((state: any) => {
    state.ui.search.query = '';
    state.ui.search.filters = {};
    state.ui.search.results = [];
    state.ui.search.isSearching = false;
  })
});