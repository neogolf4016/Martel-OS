import type { HouseholdSnapshot } from "./domain";

export const DAYS = [
  "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
] as const;

export const seedData: HouseholdSnapshot = {
  monthlyBudget: 1400,
  meals: [
    { id: "sweet-meat", name: "Korean Sweet Meat Bowls", protein: "Ground beef or turkey", sides: ["Rice", "Edamame", "Green onions"], notes: "Use the family sweet-meat sauce.", active: true },
    { id: "tacos", name: "Taco Night", protein: "Ground beef or turkey", sides: ["Rice or tortillas", "Lettuce", "Cheese", "Sour cream", "Salsa"], active: true },
    { id: "steak", name: "Tenderloin Steak Dinner", protein: "Sam's whole tenderloin steaks", sides: ["Regular or sweet potatoes", "Green beans or broccoli"], notes: "Use one frozen steak pack each week.", active: true },
    { id: "whole-chicken", name: "Pressure Cooker Whole Chicken", protein: "Whole chicken", sides: ["Mashed potatoes", "Green beans"], notes: "Save leftovers for quesadillas, soup, or sandwiches.", active: true },
    { id: "spaghetti", name: "Spaghetti Night", protein: "Ground beef or turkey", sides: ["Salad", "Garlic bread"], active: true },
    { id: "grilled-chicken", name: "Grilled Chicken Dinner", protein: "Chicken breast", sides: ["Broccoli", "Rice or potatoes"], active: true },
    { id: "pizza", name: "Pizza Night", protein: "Pizza", sides: ["Salad or fruit"], active: true }
  ],
  weeklyPlan: {
    Monday: "sweet-meat", Tuesday: "tacos", Wednesday: "whole-chicken",
    Thursday: "spaghetti", Friday: "steak", Saturday: "pizza", Sunday: "grilled-chicken"
  },
  groceries: [
    { id: "ground-turkey", name: "Ground turkey", category: "Meat", store: "Sam's Club", quantity: 1, checked: false, staple: true },
    { id: "ground-beef", name: "Ground beef", category: "Meat", store: "Either", quantity: 1, checked: false, staple: true },
    { id: "whole-chicken", name: "Whole chicken", category: "Meat", store: "Walmart", quantity: 1, checked: false, staple: true },
    { id: "chicken-breast", name: "Chicken breasts", category: "Meat", store: "Sam's Club", quantity: 1, checked: false, staple: true },
    { id: "rice", name: "Rice", category: "Pantry", store: "Sam's Club", quantity: 1, checked: false, staple: true },
    { id: "edamame", name: "Edamame", category: "Frozen", store: "Either", quantity: 1, checked: false, staple: true },
    { id: "green-onions", name: "Green onions", category: "Produce", store: "Walmart", quantity: 1, checked: false, staple: true },
    { id: "potatoes", name: "Regular potatoes", category: "Produce", store: "Walmart", quantity: 1, checked: false, staple: true },
    { id: "sweet-potatoes", name: "Sweet potatoes", category: "Produce", store: "Walmart", quantity: 1, checked: false, staple: true },
    { id: "green-beans", name: "Green beans", category: "Produce", store: "Walmart", quantity: 1, checked: false, staple: true },
    { id: "broccoli", name: "Broccoli", category: "Produce", store: "Walmart", quantity: 1, checked: false, staple: true },
    { id: "spaghetti", name: "Spaghetti noodles", category: "Pantry", store: "Walmart", quantity: 1, checked: false, staple: true },
    { id: "sauce", name: "Pasta sauce", category: "Pantry", store: "Walmart", quantity: 1, checked: false, staple: true },
    { id: "taco", name: "Taco ingredients", category: "Pantry", store: "Walmart", quantity: 1, checked: false, staple: true },
    { id: "sparkling-water", name: "Sparkling water", category: "Drinks", store: "Sam's Club", quantity: 1, checked: false, staple: true },
    { id: "water", name: "Bottled water", category: "Drinks", store: "Sam's Club", quantity: 1, checked: false, staple: true },
    { id: "gatorade", name: "Low-sugar Gatorade", category: "Drinks", store: "Sam's Club", quantity: 1, checked: false, staple: true },
    { id: "string-cheese", name: "String cheese", category: "Dairy", store: "Sam's Club", quantity: 1, checked: false, staple: true },
    { id: "tillamook", name: "Tillamook cheddar", category: "Dairy", store: "Sam's Club", quantity: 1, checked: false, staple: true },
    { id: "eggs", name: "Eggs", category: "Dairy", store: "Walmart", quantity: 1, checked: false, staple: true },
    { id: "milk", name: "Milk", category: "Dairy", store: "Walmart", quantity: 1, checked: false, staple: true },
    { id: "bananas", name: "Bananas", category: "Produce", store: "Walmart", quantity: 1, checked: false, staple: true },
    { id: "berries", name: "Berries", category: "Produce", store: "Either", quantity: 1, checked: false, staple: true },
    { id: "apples", name: "Apples", category: "Produce", store: "Either", quantity: 1, checked: false, staple: true },
    { id: "laundry", name: "Laundry detergent", category: "Household", store: "Sam's Club", quantity: 1, checked: false, staple: true }
  ],
  inventory: [
    { id: "steaks", name: "Tenderloin steaks", category: "Freezer", quantity: 12, unit: "steaks", lowAt: 4 },
    { id: "chicken", name: "Chicken breasts", category: "Freezer", quantity: 8, unit: "breasts", lowAt: 3 },
    { id: "turkey", name: "Ground turkey", category: "Freezer", quantity: 5, unit: "lb", lowAt: 2 },
    { id: "whole-chickens", name: "Whole chickens", category: "Freezer", quantity: 2, unit: "chickens", lowAt: 1 },
    { id: "broccoli-frozen", name: "Frozen broccoli", category: "Freezer", quantity: 2, unit: "bags", lowAt: 1 },
    { id: "rice-stock", name: "Rice", category: "Pantry", quantity: 1, unit: "bag", lowAt: 1 },
    { id: "pasta-stock", name: "Spaghetti noodles", category: "Pantry", quantity: 3, unit: "boxes", lowAt: 1 },
    { id: "broth-stock", name: "Chicken broth", category: "Pantry", quantity: 4, unit: "cartons", lowAt: 2 },
    { id: "sauce-stock", name: "Pasta sauce", category: "Pantry", quantity: 3, unit: "jars", lowAt: 1 }
  ],
  budgetEntries: []
};

export function mergeSnapshot(value: unknown): HouseholdSnapshot {
  const candidate = value as Partial<HouseholdSnapshot> | null;
  return {
    ...seedData,
    ...(candidate || {}),
    meals: candidate?.meals || seedData.meals,
    weeklyPlan: candidate?.weeklyPlan || seedData.weeklyPlan,
    groceries: candidate?.groceries || seedData.groceries,
    inventory: candidate?.inventory || seedData.inventory,
    budgetEntries: candidate?.budgetEntries || seedData.budgetEntries
  };
}
