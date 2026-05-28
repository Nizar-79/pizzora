"use client";

import { useState } from "react";
import { addMenuItem, deleteMenuItem } from "@/app/menu-editor/actions";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface MenuItem {
  id: string;
  item_name: string;
  category: string;
  base_price: number;
  is_available: boolean;
}

interface Props {
  locationId: string;
  items: MenuItem[];
}

export default function AddMenuItemForm({ locationId, items }: Props) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError("");
    const formData = new FormData(e.currentTarget);
    formData.set("location_id", locationId);
    try {
      await addMenuItem(formData);
      (e.target as HTMLFormElement).reset();
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add item");
    } finally {
      setPending(false);
    }
  }

  async function handleDelete(itemId: string) {
    setDeletingId(itemId);
    try {
      await deleteMenuItem(itemId);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      {items.length === 0 ? (
        <div className="px-4 py-4 text-sm text-muted-foreground">No menu items yet.</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Available</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.item_name}</TableCell>
                <TableCell className="text-muted-foreground capitalize">{item.category}</TableCell>
                <TableCell>${item.base_price.toFixed(2)}</TableCell>
                <TableCell>
                  <Badge variant={item.is_available ? "default" : "destructive"}>
                    {item.is_available ? "Yes" : "No"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={deletingId === item.id}
                    className="text-xs text-muted-foreground hover:text-destructive disabled:opacity-40 transition-colors"
                  >
                    {deletingId === item.id ? "Removing…" : "Remove"}
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {open ? (
        <form onSubmit={handleSubmit} className="px-4 py-4 border-t border-border bg-muted/30">
          <div className="flex gap-3 items-end flex-wrap">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Item Name</label>
              <input
                name="item_name"
                required
                className="px-3 py-1.5 border border-input rounded-lg text-sm w-40 bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Category</label>
              <input
                name="category"
                placeholder="pizza, drinks…"
                required
                className="px-3 py-1.5 border border-input rounded-lg text-sm w-32 bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Price ($)</label>
              <input
                name="base_price"
                type="number"
                step="0.01"
                min="0"
                required
                className="px-3 py-1.5 border border-input rounded-lg text-sm w-24 bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={pending}
                className="bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {pending ? "Adding…" : "Add"}
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
          {error && <p className="text-xs text-destructive mt-2">{error}</p>}
        </form>
      ) : (
        <div className="px-4 py-3 border-t border-border">
          <button
            onClick={() => setOpen(true)}
            className="text-sm text-primary font-medium hover:underline"
          >
            + Add Item
          </button>
        </div>
      )}
    </>
  );
}
