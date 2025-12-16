"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

type ChunkingMethod =
  | "recursive_character"
  | "character"
  | "token"
  | "markdown_header"
  | "nltk"
  | "spacy";

type RAGOptions = {
  retrieval_strategies: string[];
  vector_backends: { key: string; label: string }[];
  chunking_methods: ChunkingMethod[];
  defaults: any;
};

type RAGSelection = {
  retrieval_strategy: string;
  top_k: number;
  score_threshold?: number | null;
  fetch_k?: number | null;
  lambda_mult?: number | null;
  chunking_method?: ChunkingMethod | null;
  vector_backend: string;
};

type Props = {
  apiBase: string;
};

export default function RAGConfigSection({ apiBase }: Props) {
  const [options, setOptions] = useState<RAGOptions | null>(null);
  const [selection, setSelection] = useState<RAGSelection | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [optRes, selRes] = await Promise.all([
          fetch(`${apiBase}/providers/rag/options`),
          fetch(`${apiBase}/providers/rag/selection`),
        ]);
        if (!optRes.ok) throw new Error("Failed to load RAG options");
        if (!selRes.ok) throw new Error("Failed to load RAG selection");
        const opts = await optRes.json();
        const sel = await selRes.json();
        setOptions(opts);
        setSelection(sel.selection);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load RAG config");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [apiBase]);

  const strategies = useMemo(() => options?.retrieval_strategies ?? [], [options]);
  const backends = useMemo(() => options?.vector_backends ?? [], [options]);
  const methods = useMemo(() => options?.chunking_methods ?? [], [options]);

  const validate = (): string | null => {
    if (!selection) return "Invalid selection";
    if (!strategies.includes(selection.retrieval_strategy)) return "Unsupported retrieval strategy";
    if (selection.top_k < 1 || selection.top_k > 100) return "Top-k must be between 1 and 100";
    if (selection.score_threshold != null && (selection.score_threshold < 0 || selection.score_threshold > 1)) return "Score threshold must be 0.0–1.0";
    if (selection.fetch_k != null && selection.fetch_k < selection.top_k) return "fetch_k should be >= top_k for MMR";
    if (selection.lambda_mult != null && (selection.lambda_mult < 0 || selection.lambda_mult > 1)) return "lambda_mult must be 0.0–1.0";
    return null;
  };

  const save = async () => {
    const problem = validate();
    if (problem) {
      setSaveError(problem);
      setSaved(false);
      return;
    }
    setSaving(true);
    setSaveError(null);
    setSaved(false);
    try {
      const res = await fetch(`${apiBase}/providers/rag/selection`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selection }),
      });
      if (!res.ok) {
        let detail = "Failed to save RAG config";
        try { const body = await res.json(); if (body?.detail) detail = body.detail; } catch {}
        throw new Error(detail);
      }
      const data = await res.json();
      setSelection(data.selection);
      setSaved(true);
      setTimeout(() => setSaved(false), 1200);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Failed to save RAG config");
    } finally {
      setSaving(false);
    }
  };

  const resetDefaults = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch(`${apiBase}/providers/rag/reset`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to reset RAG config");
      const data = await res.json();
      setSelection(data.selection);
      setSaved(true);
      setTimeout(() => setSaved(false), 1200);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Failed to reset RAG config");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-2xl border border-sky-200 dark:border-sky-700 bg-white dark:bg-slate-900 shadow-xl p-6 flex flex-col gap-4">
      <header className="space-y-2">
        <p className="inline-flex px-2 py-1 text-[11px] font-semibold rounded-full bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200">RAG Configuration</p>
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">Retrieval-Augmented Generation</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">Select retrieval strategy, top-k, thresholds, and chunking.</p>
        </div>
      </header>

      {loading && <p className="text-sm text-slate-600 dark:text-slate-300">Loading RAG options…</p>}
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      {!loading && selection && (
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="retrieval-strategy" className="text-xs font-semibold">Retrieval Strategy</Label>
              <Select
                value={selection.retrieval_strategy}
                onValueChange={(value) => setSelection({ ...selection, retrieval_strategy: value })}
              >
                <SelectTrigger id="retrieval-strategy" title="Choose similarity, score threshold, or MMR">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {strategies.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="top-k" className="text-xs font-semibold">Top-k Results</Label>
              <Input
                id="top-k"
                type="number"
                min={1}
                max={100}
                value={selection.top_k}
                onChange={(e) => setSelection({ ...selection, top_k: Number(e.target.value) })}
                title="Number of context chunks retrieved"
              />
            </div>
          </div>

          {selection.retrieval_strategy === "similarity_score_threshold" && (
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="score-threshold" className="text-xs font-semibold">Score Threshold</Label>
                <Input
                  id="score-threshold"
                  type="number"
                  step={0.01}
                  min={0}
                  max={1}
                  value={selection.score_threshold ?? 0}
                  onChange={(e) => setSelection({ ...selection, score_threshold: Number(e.target.value) })}
                  title="Minimum relevance score (0–1)"
                />
              </div>
            </div>
          )}

          {selection.retrieval_strategy === "mmr" && (
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fetch-k" className="text-xs font-semibold">fetch_k</Label>
                <Input
                  id="fetch-k"
                  type="number"
                  min={selection.top_k}
                  max={1000}
                  value={selection.fetch_k ?? 20}
                  onChange={(e) => setSelection({ ...selection, fetch_k: Number(e.target.value) })}
                  title="Candidates passed to MMR"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lambda-mult" className="text-xs font-semibold">lambda_mult</Label>
                <Input
                  id="lambda-mult"
                  type="number"
                  step={0.05}
                  min={0}
                  max={1}
                  value={selection.lambda_mult ?? 0.5}
                  onChange={(e) => setSelection({ ...selection, lambda_mult: Number(e.target.value) })}
                  title="Diversity vs similarity tradeoff"
                />
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="chunking-method" className="text-xs font-semibold">Chunking Method</Label>
              <Select
                value={selection.chunking_method ?? "__default__"}
                onValueChange={(value) => setSelection({ ...selection, chunking_method: (value === "__default__" ? null : value) as ChunkingMethod | null })}
              >
                <SelectTrigger id="chunking-method" title="Text splitting method">
                  <SelectValue placeholder="Default (configured)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__default__">Default (configured)</SelectItem>
                  {methods.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="vector-backend" className="text-xs font-semibold">Vector Store Backend</Label>
              <Select
                value={selection.vector_backend}
                onValueChange={(value) => setSelection({ ...selection, vector_backend: value })}
              >
                <SelectTrigger id="vector-backend" title="Vector store provider">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {backends.map((b) => (
                    <SelectItem key={b.key} value={b.key}>{b.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={save} disabled={saving || loading} variant="default">
              {saving ? "Saving…" : "Save RAG config"}
            </Button>
            <Button onClick={resetDefaults} disabled={saving || loading} variant="outline">
              Reset to defaults
            </Button>
            {saved && <Badge variant="outline" className="text-xs">Saved</Badge>}
            {saveError && <Badge variant="destructive" className="text-xs">{saveError}</Badge>}
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
            <p><strong>Tip:</strong> Similarity is standard. Threshold filters low-relevance. MMR increases diversity using fetch_k and lambda_mult.</p>
            <p>Chunking affects indexing: recursive_character is robust; markdown_header respects headings.</p>
          </div>
        </div>
      )}
    </section>
  );
}
