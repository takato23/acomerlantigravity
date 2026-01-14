// =============================================
// MEAL PLANNING TYPE DEFINITIONS
// Hybrid implementation: Enhanced with Summit's Argentine-specific features
// =============================================

export type MealType = 'desayuno' | 'almuerzo' | 'merienda' | 'cena';
export type MealSlotType = 'breakfast' | 'lunch' | 'snack' | 'dinner'; // API compatibility
export type DietaryPreference = 'omnivore' | 'vegetarian' | 'vegan' | 'pescatarian' | 'keto' | 'paleo' | 'glutenFree' | 'dairyFree';
export type DietProfile = 'balanced' | 'protein-rich' | 'low-carb' | 'mediterranean' | 'low-fat';
export type BudgetLevel = 'low' | 'medium' | 'high';
export type Difficulty = 'easy' | 'medium' | 'hard';

// Argentine-specific types from Summit
export type ArgentineRegion = 'NOA' | 'NEA' | 'CABA' | 'PBA' | 'Cuyo' | 'Patagonia';
export type ModeType = 'normal' | 'economico' | 'fiesta' | 'dieta';
export type ShoppingAisle = 'verduleria' | 'carniceria' | 'almacen' | 'panaderia' | 'fiambreria' | 'pescaderia' | 'otros';
export type ArgentineSeason = 'verano' | 'otoño' | 'invierno' | 'primavera';

// =============================================
// CORE DOMAIN TYPES
// =============================================

export interface Recipe {
  id: string;
  name: string;
  title?: string; // Compatibility alias for name
  description?: string;
  image?: string;
  prepTime: number; // minutes
  prep_time?: number; // Compatibility alias
  cookTime: number; // minutes
  cook_time?: number; // Compatibility alias
  total_time?: number; // Compatibility alias
  servings: number;
  difficulty: Difficulty | string; // Allow string for legacy values like 'medio'
  ingredients: Ingredient[];
  instructions: string[];
  nutrition?: NutritionInfo;
  nutritional_info?: NutritionInfo; // Compatibility alias
  dietaryLabels?: DietaryPreference[];
  dietary_tags?: string[]; // Compatibility alias
  cuisine?: string;
  tags: string[];
  rating?: number;
  ratingCount?: number;
  reviewCount?: number;
  isAiGenerated?: boolean;
  ai_generated?: boolean; // Compatibility alias
  isFavorite?: boolean;
  isBookmarked?: boolean;
  author?: string;
  user_id?: string; // Compatibility for owner
  createdAt?: string | Date;
  updatedAt?: string | Date;

  // Argentine-specific extensions (Summit)
  region?: ArgentineRegion | string;
  season?: ArgentineSeason | string;
  cultural?: {
    isTraditional?: boolean;
    occasion?: string;
    significance?: string;
  };
  cost?: {
    total: number;
    perServing: number;
    currency: string;
  };
}

// ... existing Ingredient and NutritionInfo ...

export interface MealSlot {
  id: string;
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  mealType: MealType;
  date: string; // YYYY-MM-DD format
  recipeId?: string;
  customMealName?: string;
  recipe?: Recipe;
  servings: number;
  isLocked: boolean;
  locked?: boolean; // Compatibility alias
  isCompleted: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Legacy compatibility types (System A/B)
export type ArgentineMeal = MealSlot;
export interface ArgentineDayPlan {
  date: string;
  dayOfWeek: number;
  dayName?: string;
  desayuno?: ArgentineMeal;
  almuerzo?: ArgentineMeal;
  merienda?: ArgentineMeal;
  cena?: ArgentineMeal;
  cultural?: {
    isSpecialDay?: boolean;
    occasion?: string;
    notes?: string;
  };
  dailyNutrition?: NutritionInfo;
  dailyCost?: number;
  isToday?: boolean;
}

export interface WeekPlan {
  id: string;
  userId: string;
  startDate: string; // YYYY-MM-DD format
  endDate: string; // YYYY-MM-DD format
  slots: MealSlot[];
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;

  // Argentine-specific extensions
  weeklyNutrition?: NutritionInfo;
  weeklyCost?: number;
  mode?: ModeType;
  region?: ArgentineRegion | string;
  season?: ArgentineSeason | string;
  cultural?: {
    hasAsado?: boolean;
    hasMate?: boolean;
    hasNoquis29?: boolean;
    specialOccasions?: string[];
  };
}

export type ArgentineWeeklyPlan = WeekPlan;

export interface WeeklyNutritionSummary {
  daily: NutritionInfo;
  weekly: NutritionInfo;
  balance?: {
    varietyScore: number;
    nutritionScore: number;
    culturalScore: number;
  };
  recommendations?: string[];
}

export interface MealPlanRecord {
  id: string;
  user_id: string;
  week_start: string;
  week_end: string;
  plan_data: WeekPlan;
  created_at: string;
  updated_at: string;
}

// =============================================
// UI & DISPLAY TYPES
// =============================================

export interface DayPlan {
  date: string;
  dayOfWeek: number;
  meals: {
    desayuno?: MealSlot;
    almuerzo?: MealSlot;
    merienda?: MealSlot;
    cena?: MealSlot;
  };
  nutritionSummary?: NutritionInfo;
  isToday: boolean;
}

export interface WeekSummary {
  totalMeals: number;
  completedMeals: number;
  uniqueRecipes: number;
  totalServings: number;
  nutritionAverage?: NutritionInfo;
  completionPercentage: number;
}

// =============================================
// USER PREFERENCES & PANTRY
// =============================================

export interface PantryItem {
  id: string;
  name: string;
  category: string | IngredientCategory;
  amount: number;
  unit: string;
  expiryDate?: string;
  cost?: number;
  frequency?: 'alta' | 'media' | 'baja' | string;
  inStock?: boolean;
}

export interface UserPreferences {
  // Core System C fields
  dietaryPreferences: DietaryPreference[];
  dietProfile: DietProfile;
  cuisinePreferences: string[];
  excludedIngredients: string[];
  preferredIngredients: string[];
  allergies: string[];
  cookingSkill: 'beginner' | 'intermediate' | 'advanced';
  maxCookingTime: number; // minutes
  mealsPerDay: number;
  servingsPerMeal: number;
  budget: BudgetLevel;
  preferVariety: boolean;
  useSeasonalIngredients: boolean;
  considerPantryItems: boolean;

  // Compatibility fields (System A/B)
  userId?: string;
  user_id?: string;
  dietary?: {
    restrictions: string[];
    allergies: string[];
    dislikes: string[];
    favorites: string[];
  };
  cooking?: {
    skill: string;
    timeAvailable: number;
    equipment: string[];
    preferredTechniques: string[];
  };
  cultural?: {
    region: string;
    traditionLevel: string;
    mateFrequency: string;
    asadoFrequency: string;
  };
  family?: {
    householdSize: number;
    hasChildren: boolean;
    ageRanges: string[];
    specialNeeds: string[];
  };
  budget_legacy?: { // Renamed to avoid collision with 'budget' prop
    weekly: number;
    currency: string;
    flexibility: string;
  };
  shopping?: {
    preferredStores: string[];
    buysBulk: boolean;
    prefersLocal: boolean;
    hasGarden: boolean;
  };
}

// =============================================
// SHOPPING LIST TYPES
// =============================================

export interface ShoppingList {
  id: string;
  userId: string;
  user_id?: string; // Compatibility
  weekPlanId: string;
  week_plan_id?: string; // Compatibility
  items: ShoppingListItem[];
  shopping_items?: ShoppingListItem[]; // Compatibility
  shopping_list_items?: ShoppingListItem[]; // Compatibility
  categories: ShoppingListCategory[];
  estimatedTotal?: number;
  total_cost?: number; // Compatibility
  createdAt: string;
  updatedAt: string;
}

export interface ShoppingListItem {
  id: string;
  ingredientName: string;
  custom_name?: string; // Compatibility
  totalAmount: number;
  quantity?: number; // Compatibility
  unit: string;
  category: IngredientCategory | string;
  recipeNames: string[]; // Recipes that use this ingredient
  recipes?: string[]; // Compatibility
  isPurchased: boolean;
  is_purchased?: boolean; // Compatibility
  checked?: boolean; // Compatibility
  estimatedPrice?: number;
  estimated_cost?: number; // Compatibility
  price?: number; // Compatibility
  notes?: string;
  source?: string; // Compatibility
  position?: number; // Compatibility
  packageInfo?: {
    amount: number;
    unit: string;
    quantity: number;
  };
}

export interface ShoppingListCategory {
  name: IngredientCategory;
  items: ShoppingListItem[];
  subtotal?: number;
}

// =============================================
// STORE TYPES
// =============================================

export interface MealPlanningStore {
  // Core State
  currentWeekPlan: WeekPlan | null;
  recipes: Record<string, Recipe>;
  userPreferences: UserPreferences | null;
  currentDate: Date;
  staples: string[];

  // UI State
  isLoading: boolean;
  error: string | null;
  selectedSlots: string[];
  draggedSlot: MealSlot | null;
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncedAt: string | null;

  // Modal State
  activeModal: 'recipe-select' | 'ai-planner' | 'preferences' | 'shopping-list' | 'recipe-detail' | null;
  selectedMeal: MealSlot | null;

  // Offline queue
  offlineQueue: Array<() => Promise<void>>;

  // Real-time state
  realtimeStatus: 'connecting' | 'connected' | 'disconnected' | 'error';

  // Actions - Data Management
  loadWeekPlan: (startDate: string) => Promise<void>;
  saveWeekPlan: (weekPlan: WeekPlan) => Promise<void>;

  // Actions - Meal Management
  addMealToSlot: (slot: Partial<MealSlot>, recipe: Recipe) => Promise<void>;
  updateMealSlot: (slotId: string, updates: Partial<MealSlot>) => Promise<void>;
  removeMealFromSlot: (slotId: string) => Promise<void>;
  toggleSlotLock: (slotId: string) => Promise<void>;

  // Actions - Batch Operations
  generateWeekWithAI: (config: AIPlannerConfig) => Promise<AIGeneratedPlan>;
  clearWeek: () => Promise<void>;
  duplicateWeek: (targetStartDate: string) => Promise<void>;

  // Actions - UI
  setCurrentDate: (date: Date) => void;
  setActiveModal: (modal: MealPlanningStore['activeModal']) => void;
  setSelectedMeal: (meal: MealSlot | null) => void;
  toggleSlotSelection: (slotId: string, multi?: boolean) => void;
  setStaples: (staples: string[]) => void;

  // Selectors
  getSlotForDay: (dayOfWeek: number, mealType: MealType) => MealSlot | undefined;
  getWeekSummary: () => WeekSummary;
  getDayPlan: (dayOfWeek: number) => DayPlan;
  getShoppingList: () => Promise<ShoppingList>;

  // Export functionality
  exportWeekPlanAsJSON: () => String;
  exportWeekPlanAsCSV: () => String;
  exportWeekPlanAsPDF: () => Promise<Blob>;
  downloadWeekPlan: (format: 'json' | 'csv' | 'pdf') => void;

  // Real-time sync methods
  setupRealtimeSync: () => Promise<void>;
  cleanupRealtimeSync: () => Promise<void>;

  // Offline support methods
  syncOfflineChanges: () => Promise<void>;
  setOnlineStatus: (isOnline: boolean) => void;

  // Batch operations
  batchUpdateSlots: (updates: Array<{ slotId: string; changes: Partial<MealSlot> }>) => Promise<void>;
}

// =============================================
// COMPONENT PROPS
// =============================================

export interface MealSlotProps {
  slot?: MealSlot;
  dayOfWeek: number;
  mealType: MealType;
  isToday?: boolean;
  isSelected?: boolean;
  isHovered?: boolean;
  onSlotClick?: (slot: MealSlot) => void;
  onRecipeSelect?: (slot: MealSlot) => void;
  onSlotClear?: (slot: MealSlot) => void;
  onSlotLock?: (slot: MealSlot, locked: boolean) => void;
  onAIGenerate?: (slot: Partial<MealSlot>) => void;
}

export interface WeekNavigatorProps {
  currentWeek: Date;
  onWeekChange: (direction: 'prev' | 'next' | 'today') => void;
  weekSummary: WeekSummary;
}

// =============================================
// MEAL CONFIGURATION
// =============================================

export interface MealConfig {
  label: string;
  icon: React.ComponentType<any>;
  emoji: string;
  gradient: string;
  glowColor: string;
  time: string;
}

export const MEAL_CONFIG: Record<MealType, MealConfig> = {
  desayuno: {
    label: 'Desayuno',
    icon: () => null, // Will be replaced with actual icon
    emoji: '☕',
    gradient: 'from-amber-400 via-orange-400 to-yellow-400',
    glowColor: 'rgba(251, 191, 36, 0.4)',
    time: '7:00 - 10:00'
  },
  almuerzo: {
    label: 'Almuerzo',
    icon: () => null,
    emoji: '☀️',
    gradient: 'from-blue-400 via-cyan-400 to-teal-400',
    glowColor: 'rgba(59, 130, 246, 0.4)',
    time: '12:00 - 14:00'
  },
  merienda: {
    label: 'Merienda',
    icon: () => null,
    emoji: '🍎',
    gradient: 'from-green-400 via-emerald-400 to-lime-400',
    glowColor: 'rgba(34, 197, 94, 0.4)',
    time: '16:00 - 17:00'
  },
  cena: {
    label: 'Cena',
    icon: () => null,
    emoji: '🌙',
    gradient: 'from-purple-400 via-pink-400 to-rose-400',
    glowColor: 'rgba(168, 85, 247, 0.4)',
    time: '19:00 - 21:00'
  }
};

// =============================================
// UTILITY TYPES
// =============================================

export interface ServiceResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}

export interface LoadingState {
  isLoading: boolean;
  error?: string;
}

// =============================================
// SUMMIT ENHANCED TYPES - Argentine specific
// =============================================

export interface PlannedMeal {
  slot: MealSlotType;
  time: string;
  recipe: Recipe;
  aiGenerated: boolean;
}

export interface MealPlan {
  id: string;
  userId: string;
  weekStart: string;
  weekEnd: string;
  days: Array<{
    date: string;
    label: string;
    meals: {
      breakfast: PlannedMeal;
      lunch: PlannedMeal;
      snack: PlannedMeal;
      dinner: PlannedMeal;
    };
  }>;
  metadata: {
    season: ArgentineSeason;
    region: ArgentineRegion;
    mode: ModeType;
    createdAt: string;
  };
  updatedAt?: string;
}

export interface SummitUserPreferences {
  dietary_restrictions: string[];
  favorite_dishes: string[];
  disliked_ingredients: string[];
  household_size: number;
  budget_weekly: number;
  region?: ArgentineRegion;
}

// =============================================
// AI GENERATION TYPES
// =============================================

export interface AIPlannerConfig {
  userId: string;
  startDate: string;
  endDate: string;
  preferences: UserPreferences;
  optimizationFocus?: 'waste_reduction' | 'budget' | 'nutrition' | 'time';
  variationLevel?: number; // 0-1
  includeStaples?: boolean;
}

export interface AIGeneratedPlan {
  id: string;
  config: AIPlannerConfig;
  weekPlan: WeekPlan;
  shoppingList: ShoppingList;
  nutritionSummary: WeeklyNutritionSummary;
  generatedAt: string;
  suggestions: string[];
}

// Utility functions for type conversion
export function mealTypeToSlot(mealType: MealType): MealSlotType {
  const mapping: Record<MealType, MealSlotType> = {
    'desayuno': 'breakfast',
    'almuerzo': 'lunch',
    'merienda': 'snack',
    'cena': 'dinner'
  };
  return mapping[mealType];
}

export function slotToMealType(slot: MealSlotType): MealType {
  const mapping: Record<MealSlotType, MealType> = {
    'breakfast': 'desayuno',
    'lunch': 'almuerzo',
    'snack': 'merienda',
    'dinner': 'cena'
  };
  return mapping[slot];
}
