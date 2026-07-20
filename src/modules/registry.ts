export const moduleRegistry = [
  { id: "home", label: "Home", status: "active" },
  { id: "grocery", label: "Grocery", status: "active" },
  { id: "meals", label: "Meals", status: "active" },
  { id: "pantry", label: "Pantry", status: "planned" },
  { id: "inventory", label: "Inventory", status: "active" },
  { id: "finance", label: "Finance", status: "active" },
  { id: "family", label: "Family", status: "planned" },
  { id: "calendar", label: "Calendar", status: "planned" },
  { id: "projects", label: "Projects", status: "planned" },
  { id: "documents", label: "Documents", status: "planned" },
  { id: "neogolf", label: "NeoGolf", status: "planned" },
  { id: "coastal-tour", label: "Coastal Tour", status: "planned" },
  { id: "ai", label: "AI Assistant", status: "planned" },
  { id: "settings", label: "Settings", status: "active" }
] as const;

export type ActiveModuleId = Extract<(typeof moduleRegistry)[number], { status: "active" }>["id"];
