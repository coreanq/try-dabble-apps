/**
 * recipelog:shopping:v1 = { items: { text, checked, fromRecipeId? }[] }
 * A flat list merged from whichever recipes you tapped "Add to shopping list" on.
 */
import { normalizeShopping, type ShoppingItem, type ShoppingList } from "./recipes.ts";

export const SHOPPING_KEY = "recipelog:shopping:v1";

export function loadShopping(): ShoppingList {
  try {
    const raw = localStorage.getItem(SHOPPING_KEY);
    return raw ? normalizeShopping(JSON.parse(raw)) : { items: [] };
  } catch {
    return { items: [] };
  }
}

export function saveShopping(list: ShoppingList): void {
  try {
    localStorage.setItem(SHOPPING_KEY, JSON.stringify(list));
  } catch {
    /* quota or private mode */
  }
}

/** Adds lines; an identical unchecked line already on the list is not doubled. */
export function addShoppingItems(list: ShoppingList, texts: string[], fromRecipeId?: string): { list: ShoppingList; added: number } {
  const have = new Set(list.items.filter((i) => !i.checked).map((i) => i.text.toLowerCase()));
  const items = list.items.slice();
  let added = 0;
  for (const raw of texts) {
    const text = raw.trim();
    if (!text || have.has(text.toLowerCase())) continue;
    const item: ShoppingItem = { text, checked: false };
    if (fromRecipeId) item.fromRecipeId = fromRecipeId;
    items.push(item);
    have.add(text.toLowerCase());
    added += 1;
  }
  return { list: { items }, added };
}

export function toggleShoppingItem(list: ShoppingList, index: number): ShoppingList {
  return { items: list.items.map((i, n) => (n === index ? { ...i, checked: !i.checked } : i)) };
}

export function removeChecked(list: ShoppingList): ShoppingList {
  return { items: list.items.filter((i) => !i.checked) };
}

export function shoppingAsText(list: ShoppingList): string {
  return list.items.map((i) => `${i.checked ? "☑" : "☐"} ${i.text}`).join("\n");
}
