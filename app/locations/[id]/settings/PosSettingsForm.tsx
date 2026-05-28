"use client";

import { useState } from "react";
import { updatePosSettings } from "./actions";

type TestResult = { success: boolean; message: string } | null;

interface Props {
  locationId: string;
  currentPosType: string;
  hasApiKey: boolean;
  maskedKey: string | null;
}

export default function PosSettingsForm({
  locationId,
  currentPosType,
  hasApiKey,
  maskedKey,
}: Props) {
  const [posType, setPosType] = useState(currentPosType);
  const [replacing, setReplacing] = useState(!hasApiKey);
  const [newKey, setNewKey] = useState("");
  const [testResult, setTestResult] = useState<TestResult>(null);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saved, setSaved] = useState(false);

  const keepExistingKey = hasApiKey && !replacing;

  async function handleTest() {
    const keyToTest = replacing ? newKey : "";
    if (!keyToTest) {
      setTestResult({ success: false, message: "Enter an API key first, then test." });
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/test-pos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ posType, apiKey: keyToTest }),
      });
      const data = await res.json();
      setTestResult(data);
    } catch {
      setTestResult({ success: false, message: "Network error. Check your connection." });
    } finally {
      setTesting(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setSaveError("");
    setSaved(false);
    const formData = new FormData(e.currentTarget);
    try {
      await updatePosSettings(formData);
      setSaved(true);
      if (replacing && newKey) {
        setReplacing(false);
        setNewKey("");
      }
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <input type="hidden" name="locationId" value={locationId} />
      <input type="hidden" name="keepExistingKey" value={String(keepExistingKey)} />

      {/* POS System */}
      <div>
        <label className="block text-sm font-medium mb-1">
          POS System
        </label>
        <select
          name="pos_type"
          value={posType}
          onChange={(e) => {
            setPosType(e.target.value);
            setTestResult(null);
          }}
          className="w-full max-w-xs px-3 py-2 border border-input rounded-lg text-sm bg-muted focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="none">Dashboard Only (no POS)</option>
          <option value="toast">Toast</option>
          <option value="square">Square</option>
          <option value="clover">Clover</option>
        </select>
      </div>

      {/* API Key */}
      {posType !== "none" && (
        <div>
          <label className="block text-sm font-medium mb-1">
            API Key
          </label>

          {keepExistingKey ? (
            <div className="flex items-center gap-3">
              <span className="px-3 py-2 bg-muted border border-input rounded-lg text-sm text-muted-foreground font-mono">
                {maskedKey}
              </span>
              <button
                type="button"
                onClick={() => {
                  setReplacing(true);
                  setTestResult(null);
                }}
                className="text-sm text-primary underline hover:text-primary/80"
              >
                Replace
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 flex-wrap">
              <input
                name="pos_api_key"
                value={newKey}
                onChange={(e) => {
                  setNewKey(e.target.value);
                  setTestResult(null);
                }}
                placeholder="Paste your API key here"
                className="w-full max-w-md px-3 py-2 border border-input rounded-lg text-sm bg-muted focus:outline-none focus:ring-2 focus:ring-ring"
              />
              {hasApiKey && (
                <button
                  type="button"
                  onClick={() => {
                    setReplacing(false);
                    setNewKey("");
                    setTestResult(null);
                  }}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
              )}
            </div>
          )}

          {/* Test Connection */}
          {!keepExistingKey && (
            <div className="mt-3">
              <button
                type="button"
                onClick={handleTest}
                disabled={testing || !newKey}
                className="px-4 py-2 text-sm border border-input rounded-lg bg-muted hover:bg-secondary disabled:opacity-40 transition-colors"
              >
                {testing ? "Testing…" : "Test Connection"}
              </button>

              {testResult && (
                <p
                  className={`mt-2 text-sm px-3 py-2 rounded-lg ${
                    testResult.success
                      ? "bg-green-500/10 text-green-400"
                      : "bg-destructive/10 text-destructive"
                  }`}
                >
                  {testResult.success ? "✓ " : "✗ "}
                  {testResult.message}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Save */}
      {saveError && (
        <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
          {saveError}
        </p>
      )}
      {saved && (
        <p className="text-sm text-green-400 bg-green-500/10 px-3 py-2 rounded-lg">
          ✓ Settings saved.
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="bg-primary text-primary-foreground px-5 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
      >
        {saving ? "Saving…" : "Save Settings"}
      </button>
    </form>
  );
}
