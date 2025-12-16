"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import RAGConfigSection from "../components/RAGConfigSection";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RefreshCw } from "lucide-react";

type ProviderKind = "llm" | "embedding";

type Provider = {
  key: string;
  label: string;
  type: ProviderKind;
};

type Model = {
  id: string;
  label: string;
  context_length?: number | null;
};

type ProviderSelection = {
  provider: string | null;
  model: string | null;
};

type SelectionState = {
  llm: ProviderSelection;
  embedding: ProviderSelection;
};

type ProviderSectionProps = {
  kind: ProviderKind;
  title: string;
  description: string;
  accent: "emerald" | "amber";
  apiBase: string;
  selection: ProviderSelection;
  onSelectionChange: (next: ProviderSelection) => void;
  loadingSelection: boolean;
  disabled?: boolean;
};

function ProviderSection({ kind, title, description, accent, apiBase, selection, onSelectionChange, loadingSelection, disabled }: ProviderSectionProps) {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string | null>(selection.model);
  const [models, setModels] = useState<Model[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProviders = async () => {
      setLoadingProviders(true);
      setError(null);
      try {
        const res = await fetch(`${apiBase}/providers/${kind}`);
        if (!res.ok) {
          throw new Error("Unable to load providers");
        }
        const data = await res.json();
        setProviders(data.providers);
        if (!data.providers?.length) {
          setSelectedProvider(null);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load providers");
      } finally {
        setLoadingProviders(false);
      }
    };

    fetchProviders();
  }, [apiBase, kind]);

  useEffect(() => {
    if (loadingProviders || loadingSelection) return;
    const preferred = selection.provider;
    const found = preferred && providers.some((p) => p.key === preferred);
    const fallback = providers.length ? providers[0].key : null;
    const next = found ? preferred : fallback;
    if (next !== selectedProvider) {
      setSelectedProvider(next);
      setSelectedModel(null);
      onSelectionChange({ provider: next, model: null });
    }
  }, [loadingProviders, loadingSelection, providers, selection.provider, selectedProvider, onSelectionChange]);
  const loadModels = useCallback(async () => {
    if (!selectedProvider) {
      setModels([]);
      setSelectedModel(null);
      return;
    }
    setLoadingModels(true);
    setError(null);
    try {
      const segment = kind === "llm" ? "llm" : "embedding";
      const res = await fetch(`${apiBase}/providers/${segment}/${selectedProvider}/models`);
      if (!res.ok) {
        throw new Error("Unable to load models");
      }
      const data = await res.json();
      setModels(data.models ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load models");
    } finally {
      setLoadingModels(false);
    }
  }, [apiBase, kind, selectedProvider]);

  useEffect(() => {
    loadModels();
  }, [loadModels]);

  useEffect(() => {
    if (loadingModels) return;
    const preferred = selection.model;
    if (preferred && models.some((m) => m.id === preferred)) {
      setSelectedModel(preferred);
    } else if (!preferred) {
      setSelectedModel(null);
    }
  }, [loadingModels, models, selection.model]);

  const accentClasses = useMemo(() => {
    if (accent === "emerald") {
      return {
        border: "border-emerald-200 dark:border-emerald-500/30",
        badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
        button: "bg-emerald-500 hover:bg-emerald-400 text-white",
      };
    }
    return {
      border: "border-amber-200 dark:border-amber-500/30",
      badge: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100",
      button: "bg-amber-500 hover:bg-amber-400 text-slate-900",
    };
  }, [accent]);

  return (
    <section className="rounded-lg border bg-card shadow p-6 flex flex-col gap-4">
      <header className="space-y-2">
        <p className="inline-flex px-2 py-1 text-xs font-semibold">
          {kind === "llm" ? "LLM Provider" : "Embedding Provider"}
        </p>
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-foreground">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </header>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 space-y-2">
            <Label htmlFor={`${kind}-provider`} className="text-xs font-semibold">Provider</Label>
            <Select
              value={selectedProvider ?? ""}
              onValueChange={(value) => {
                const providerValue = value || null;
                setSelectedProvider(providerValue);
                setSelectedModel(null);
                onSelectionChange({ provider: providerValue, model: null });
              }}
              disabled={loadingProviders || disabled}
            >
              <SelectTrigger id={`${kind}-provider`}>
                <SelectValue placeholder="Select a provider" />
              </SelectTrigger>
              <SelectContent>
                {providers.map((provider) => (
                  <SelectItem key={provider.key} value={provider.key}>
                    {provider.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={loadModels}
            variant="outline"
            size="sm"
            className="mt-6"
            disabled={loadingProviders || disabled}
            title="Refresh models for the current provider"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {loadingProviders && <p className="text-sm text-muted-foreground">Loading providers...</p>}
        {error && <p className="text-sm text-destructive">{error}</p>}

        {!loadingProviders && providers.length === 0 && (
          <p className="text-sm text-muted-foreground">No providers detected for this section.</p>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold">Available models</Label>
          {loadingModels && <Badge variant="outline" className="text-[11px]">Loading...</Badge>}
        </div>
        <ScrollArea className="h-80">
          <div className="grid gap-3">
            {models.length === 0 && !loadingModels ? (
              <div className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
                {selectedProvider ? "No models found for this provider." : "Select a provider to view models."}
              </div>
            ) : (
              <RadioGroup
                value={selectedModel ?? ""}
                onValueChange={(value) => {
                  setSelectedModel(value);
                  onSelectionChange({ provider: selectedProvider, model: value });
                }}
                disabled={disabled}
              >
                {models.map((model) => (
                  <Label
                    key={`${kind}-${model.id}`}
                    htmlFor={`${kind}-${model.id}`}
                    className="rounded-lg border bg-card p-3 flex items-center justify-between gap-4 cursor-pointer hover:border-primary transition"
                  >
                    <div className="flex items-start gap-3">
                      <RadioGroupItem
                        id={`${kind}-${model.id}`}
                        value={model.id}
                        className="mt-0.5"
                      />
                      <div>
                        <p className="text-sm font-semibold">{model.label}</p>
                        <p className="text-xs text-muted-foreground truncate">{model.id}</p>
                      </div>
                    </div>
                    {model.context_length && (
                      <Badge variant="secondary" className="text-[11px]">
                        {model.context_length.toLocaleString()} tokens
                      </Badge>
                    )}
                  </Label>
                ))}
              </RadioGroup>
            )}
          </div>
        </ScrollArea>
      </div>
    </section>
  );
}

export default function ConfigurationPage() {
  const apiBase = useMemo(() => {
    const envBase = process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "");
    if (envBase) return envBase;
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (url.port === "3000") return "http://localhost:8000";
      return `${url.protocol}//${url.host}`;
    }
    return "http://localhost:8000";
  }, []);

  const [selection, setSelection] = useState<SelectionState>({
    llm: { provider: null, model: null },
    embedding: { provider: null, model: null },
  });
  const [loadingSelection, setLoadingSelection] = useState(true);
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSelection = async () => {
      setLoadingSelection(true);
      setSelectionError(null);
      try {
        const res = await fetch(`${apiBase}/providers/selection`);
        if (!res.ok) {
          throw new Error("Unable to load current selection");
        }
        const data = await res.json();
        setSelection({ llm: data.llm, embedding: data.embedding });
      } catch (err) {
        setSelectionError(err instanceof Error ? err.message : "Failed to load selection");
      } finally {
        setLoadingSelection(false);
      }
    };

    fetchSelection();
  }, [apiBase]);

  const handleSave = async () => {
    if (!selection.llm.provider || !selection.llm.model || !selection.embedding.provider || !selection.embedding.model) {
      setSaveStatus("error");
      setSaveError("Select both a provider and model for LLM and embedding.");
      return;
    }

    setSaveStatus("saving");
    setSaveError(null);
    try {
      const res = await fetch(`${apiBase}/providers/selection`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(selection),
      });

      if (!res.ok) {
        let detail = "Unable to save selection";
        try {
          const body = await res.json();
          if (body?.detail) detail = body.detail;
        } catch (_) {
          /* ignore */
        }
        throw new Error(detail);
      }

      const data = await res.json();
      setSelection({ llm: data.llm, embedding: data.embedding });
      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 1200);
    } catch (err) {
      setSaveStatus("error");
      setSaveError(err instanceof Error ? err.message : "Failed to save selection");
    }
  };

  const [activeTab, setActiveTab] = useState<"providers" | "rag">("providers");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-xs uppercase text-muted-foreground font-semibold">Configuration</p>
            <h1 className="text-3xl font-semibold">Configuration</h1>
            <p className="text-sm text-muted-foreground max-w-2xl">Configure LLM, Embedding, and RAG settings.</p>
          </div>
          <div className="flex flex-col items-end gap-3 text-sm">
            <div className="flex items-center gap-2">
              {activeTab === "providers" && (
                <Button
                  onClick={handleSave}
                  disabled={saveStatus === "saving" || loadingSelection}
                  variant="default"
                >
                  {saveStatus === "saving" ? "Saving..." : "Save selection"}
                </Button>
              )}
              <Button asChild variant="outline">
                <Link href="/">
                  ← Back to chat
                </Link>
              </Button>
            </div>
            {saveStatus === "success" && <Badge className="text-xs">Saved and applied</Badge>}
            {saveError && <Badge variant="destructive" className="text-xs">{saveError}</Badge>}
            {selectionError && <Badge variant="destructive" className="text-xs">{selectionError}</Badge>}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setActiveTab("providers")}
              variant={activeTab === "providers" ? "default" : "outline"}
            >
              LLM & Embedding Config
            </Button>
            <Button
              onClick={() => setActiveTab("rag")}
              variant={activeTab === "rag" ? "default" : "outline"}
            >
              RAG Config
            </Button>
          </div>

          {activeTab === "providers" && (
            <div className="grid md:grid-cols-2 gap-6">
              <ProviderSection
                kind="llm"
                title="LLM Provider Configuration"
                description="Choose the chat model provider and browse its available models."
                accent="emerald"
                apiBase={apiBase}
                selection={selection.llm}
                onSelectionChange={(next) => setSelection((prev) => ({ ...prev, llm: next }))}
                loadingSelection={loadingSelection}
                disabled={saveStatus === "saving" || loadingSelection}
              />
              <ProviderSection
                kind="embedding"
                title="Embedding Provider Configuration"
                description="Select an embedding backend independently from your chat provider."
                accent="amber"
                apiBase={apiBase}
                selection={selection.embedding}
                onSelectionChange={(next) => setSelection((prev) => ({ ...prev, embedding: next }))}
                loadingSelection={loadingSelection}
                disabled={saveStatus === "saving" || loadingSelection}
              />
            </div>
          )}

          {activeTab === "rag" && <RAGConfigSection apiBase={apiBase} />}
        </div>
      </div>
    </div>
  );
}
