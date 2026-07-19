export type Meal = {
  id: string;
  name: string;
  protein: string;
  sides: string[];
  notes?: string;
  active: boolean;
};

export type GroceryItem = {
  id: string;
  name: string;
  category: string;
  store: "Walmart" | "Sam's Club" | "Amazon" | "Target" | "Either";
  quantity: number;
  checked: boolean;
  staple: boolean;
};

export type InventoryItem = {
  id: string;
  name: string;
  category: "Freezer" | "Pantry" | "Refrigerator" | "Household";
  quantity: number;
  unit: string;
  lowAt: number;
};

export type BudgetEntry = {
  id: string;
  date: string;
  store: string;
  amount: number;
  category: "Groceries" | "Household";
};

export type AppData = {
  meals: Meal[];
  weeklyPlan: Record<string, string>;
  groceries: GroceryItem[];
  inventory: InventoryItem[];
  budgetEntries: BudgetEntry[];
  monthlyBudget: number;
  updatedAt?: string;
};
