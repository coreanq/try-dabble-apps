import { useState } from "react";
import { ClipboardCopy, Plus, ShoppingBasket } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Translate } from "@/lib/i18n";
import type { ShoppingList } from "@/lib/recipes";

export function ShoppingCard({
  list,
  t,
  onToggle,
  onAdd,
  onRemoveChecked,
  onClearAll,
  onCopy,
}: {
  list: ShoppingList;
  t: Translate;
  onToggle: (index: number) => void;
  onAdd: (text: string) => void;
  onRemoveChecked: () => void;
  onClearAll: () => void;
  onCopy: () => void;
}) {
  const [text, setText] = useState("");
  const hasChecked = list.items.some((i) => i.checked);

  function add() {
    const v = text.trim();
    if (!v) return;
    onAdd(v);
    setText("");
  }

  return (
    <Card id="shopping-card" size="sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingBasket className="size-4 text-sage-deep" aria-hidden />
          {t("shopping")}
          {list.items.length > 0 && <span className="rl-tag">{list.items.length}</span>}
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2">
        {list.items.length === 0 ? (
          <p className="rl-hint" id="shopping-empty">
            {t("shoppingBody")}
          </p>
        ) : (
          <ul className="rl-shop" id="shopping-list">
            {list.items.map((item, i) => (
              <li key={`${i}-${item.text}`} data-checked={item.checked ? "true" : "false"}>
                <input id={`shop-${i}`} type="checkbox" checked={item.checked} onChange={() => onToggle(i)} />
                <label htmlFor={`shop-${i}`}>{item.text}</label>
              </li>
            ))}
          </ul>
        )}
        <form
          className="rl-url-row"
          onSubmit={(e) => {
            e.preventDefault();
            add();
          }}
        >
          <label className="sr-only" htmlFor="shop-add-text">
            {t("shoppingAddItem")}
          </label>
          <input id="shop-add-text" className="rl-input" type="text" autoComplete="off" placeholder={t("shoppingItemPlaceholder")} value={text} onChange={(e) => setText(e.target.value)} />
          <button type="submit" className="rl-btn rl-btn-sage rl-btn-sm" id="shop-add" disabled={!text.trim()}>
            <Plus className="size-4" aria-hidden />
            {t("shoppingAddItem")}
          </button>
        </form>
        {list.items.length > 0 && (
          <div className="rl-row">
            <button type="button" className="rl-btn rl-btn-quiet rl-btn-sm" id="shop-copy" onClick={onCopy}>
              <ClipboardCopy className="size-4" aria-hidden />
              {t("shoppingCopy")}
            </button>
            <button type="button" className="rl-btn rl-btn-quiet rl-btn-sm" id="shop-remove-checked" disabled={!hasChecked} onClick={onRemoveChecked}>
              {t("shoppingClearChecked")}
            </button>
            <button type="button" className="rl-btn rl-btn-danger rl-btn-sm" id="shop-clear" onClick={onClearAll}>
              {t("shoppingClearAll")}
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
