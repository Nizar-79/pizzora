"use client";

import { useRef, useState } from "react";
import { addLocation } from "@/app/locations/actions";

export default function AddLocationForm() {
  const [open, setOpen] = useState(false);
  const [posType, setPosType] = useState("none");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError("");
    const formData = new FormData(e.currentTarget);
    try {
      await addLocation(formData);
      formRef.current?.reset();
      setPosType("none");
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add location");
    } finally {
      setPending(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
      >
        + Add Location
      </button>
    );
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="bg-card rounded-xl border border-border p-6 mb-6"
    >
      <h3 className="font-semibold mb-4">New Location</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Pizzeria Name</label>
          <input
            name="name"
            required
            className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Phone Number</label>
          <input
            name="phone_number"
            placeholder="+15551234567"
            required
            className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">POS System</label>
          <select
            name="pos_type"
            value={posType}
            onChange={(e) => setPosType(e.target.value)}
            className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="none">Dashboard Only</option>
            <option value="toast">Toast</option>
            <option value="square">Square</option>
            <option value="clover">Clover</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Tax Rate (%)</label>
          <input
            name="tax_rate"
            type="number"
            step="0.01"
            min="0"
            max="30"
            defaultValue="8.5"
            required
            className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        {posType !== "none" && (
          <div className="col-span-2">
            <label className="block text-sm font-medium mb-1">POS API Key</label>
            <input
              name="pos_api_key"
              className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        )}
        <div className="col-span-2">
          <label className="block text-sm font-medium mb-1">
            Client Login Email{" "}
            <span className="text-muted-foreground font-normal">
              (optional — must already have a Pizzora account)
            </span>
          </label>
          <input
            name="client_email"
            type="email"
            className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg mt-3">
          {error}
        </p>
      )}

      <div className="flex gap-3 mt-4">
        <button
          type="submit"
          disabled={pending}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {pending ? "Adding…" : "Add Location"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
