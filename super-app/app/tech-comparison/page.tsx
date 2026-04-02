"use client";

import React, { useState } from "react";

/* ------------------------------------------------------------------ */
/*  TYPES                                                             */
/* ------------------------------------------------------------------ */
type BadgeStatus = "available" | "partial" | "gap";

interface Solution {
  name: string;
  status: BadgeStatus;
}

interface ComparisonRow {
  category: string;
  emoji: string;
  us: Solution[];
  india: Solution[];
}

/* ------------------------------------------------------------------ */
/*  DATA                                                              */
/* ------------------------------------------------------------------ */
const COMPARISON_DATA: ComparisonRow[] = [
  {
    category: "Sovereign AI & Collaboration",
    emoji: "\uD83C\uDFDB\uFE0F",
    us: [
      { name: "HCL Domino", status: "available" },
      { name: "HCL Connections", status: "available" },
    ],
    india: [
      { name: "Zoho Workplace", status: "available" },
      { name: "Reverie NLP", status: "partial" },
    ],
  },
  {
    category: "LLMs",
    emoji: "\uD83E\uDDE0",
    us: [
      { name: "OpenAI GPT-4", status: "available" },
      { name: "Claude", status: "available" },
      { name: "Llama", status: "available" },
    ],
    india: [
      { name: "Krutrim", status: "partial" },
      { name: "Sarvam AI", status: "partial" },
      { name: "BharatGPT", status: "partial" },
    ],
  },
  {
    category: "Vector Databases",
    emoji: "\uD83D\uDDC4\uFE0F",
    us: [
      { name: "Pinecone", status: "available" },
      { name: "Weaviate", status: "available" },
      { name: "Chroma", status: "available" },
    ],
    india: [
      { name: "Qdrant (used in India)", status: "partial" },
      { name: "Milvus", status: "partial" },
    ],
  },
  {
    category: "Cloud Infrastructure",
    emoji: "\u2601\uFE0F",
    us: [
      { name: "AWS", status: "available" },
      { name: "Azure", status: "available" },
      { name: "GCP", status: "available" },
    ],
    india: [
      { name: "Jio Cloud", status: "partial" },
      { name: "Yotta", status: "partial" },
      { name: "E2E Networks", status: "partial" },
    ],
  },
  {
    category: "AI Orchestration",
    emoji: "\uD83D\uDD17",
    us: [
      { name: "LangChain", status: "available" },
      { name: "CrewAI", status: "available" },
      { name: "AutoGen", status: "available" },
    ],
    india: [
      { name: "Composio", status: "partial" },
      { name: "SuperAGI", status: "partial" },
    ],
  },
  {
    category: "Data Analytics",
    emoji: "\uD83D\uDCCA",
    us: [
      { name: "Snowflake", status: "available" },
      { name: "Databricks", status: "available" },
    ],
    india: [
      { name: "Hevo Data", status: "partial" },
      { name: "Sigmoid", status: "partial" },
    ],
  },
  {
    category: "CRM & Sales",
    emoji: "\uD83E\uDD1D",
    us: [
      { name: "Salesforce", status: "available" },
      { name: "HubSpot", status: "available" },
    ],
    india: [
      { name: "Zoho CRM", status: "available" },
      { name: "Freshsales", status: "available" },
    ],
  },
  {
    category: "Cybersecurity",
    emoji: "\uD83D\uDD12",
    us: [
      { name: "CrowdStrike", status: "available" },
      { name: "Palo Alto", status: "available" },
    ],
    india: [
      { name: "TAC Security", status: "partial" },
      { name: "Lucideus", status: "partial" },
    ],
  },
  {
    category: "Developer Tools",
    emoji: "\uD83D\uDEE0\uFE0F",
    us: [
      { name: "GitHub Copilot", status: "available" },
      { name: "Cursor", status: "available" },
    ],
    india: [
      { name: "Pieces", status: "partial" },
      { name: "CodeParrot", status: "gap" },
    ],
  },
  {
    category: "Payment & Fintech",
    emoji: "\uD83D\uDCB3",
    us: [
      { name: "Stripe", status: "available" },
      { name: "Plaid", status: "available" },
    ],
    india: [
      { name: "Razorpay", status: "available" },
      { name: "PhonePe", status: "available" },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  BADGE COLORS                                                      */
/* ------------------------------------------------------------------ */
const BADGE_STYLES: Record<BadgeStatus, { bg: string; border: string; text: string }> = {
  available: { bg: "rgba(34,197,94,0.15)", border: "#22c55e", text: "#4ade80" },
  partial: { bg: "rgba(234,179,8,0.15)", border: "#eab308", text: "#facc15" },
  gap: { bg: "rgba(239,68,68,0.15)", border: "#ef4444", text: "#f87171" },
};

/* ------------------------------------------------------------------ */
/*  COMPONENT                                                         */
/* ------------------------------------------------------------------ */
export default function TechComparisonPage() {
  const [filter, setFilter] = useState<"all" | BadgeStatus>("all");

  const filteredData =
    filter === "all"
      ? COMPARISON_DATA
      : COMPARISON_DATA.map((row) => ({
          ...row,
          us: row.us.filter((s) => s.status === filter),
          india: row.india.filter((s) => s.status === filter),
        })).filter((row) => row.us.length > 0 || row.india.length > 0);

  return (
    <div
      className="min-h-screen p-6"
      style={{
        ["--card-bg" as string]: "#1e293b",
        ["--text-primary" as string]: "#f1f5f9",
        ["--text-secondary" as string]: "#94a3b8",
        ["--border-color" as string]: "#334155",
        background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)",
        color: "var(--text-primary)",
      }}
    >
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-black tracking-tight mb-1">
          <span className="bg-gradient-to-r from-blue-400 via-white to-orange-400 bg-clip-text text-transparent">
            US vs India &mdash; AI &amp; Technology Stack
          </span>
        </h1>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Comparative Analysis &mdash; HCLSoftware
        </p>
      </div>

      {/* Legend / filter */}
      <div className="flex flex-wrap justify-center gap-3 mb-8">
        {(["all", "available", "partial", "gap"] as const).map((key) => {
          const isActive = filter === key;
          const label =
            key === "all"
              ? "All"
              : key === "available"
              ? "Available"
              : key === "partial"
              ? "Partial"
              : "Gap";
          const dot =
            key === "all" ? "#94a3b8" : BADGE_STYLES[key].border;
          return (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition"
              style={{
                background: isActive ? "rgba(255,255,255,0.1)" : "transparent",
                border: `1px solid ${isActive ? dot : "var(--border-color)"}`,
                color: isActive ? "#fff" : "var(--text-secondary)",
              }}
            >
              <span
                className="inline-block w-3 h-3 rounded-full"
                style={{ backgroundColor: dot }}
              />
              {label}
            </button>
          );
        })}
      </div>

      {/* Comparison Grid */}
      <div className="max-w-6xl mx-auto space-y-4">
        {/* Header row */}
        <div className="grid grid-cols-3 gap-4 px-4 text-sm font-bold" style={{ color: "var(--text-secondary)" }}>
          <div>Category</div>
          <div className="text-center">
            <span className="inline-block w-6 h-4 mr-1 align-middle rounded-sm" style={{ background: "linear-gradient(90deg, #3b82f6, #ef4444)" }} />
            US Solutions
          </div>
          <div className="text-center">
            <span className="inline-block w-6 h-4 mr-1 align-middle rounded-sm" style={{ background: "linear-gradient(90deg, #f97316, #22c55e)" }} />
            India Solutions
          </div>
        </div>

        {filteredData.map((row) => (
          <div
            key={row.category}
            className="grid grid-cols-3 gap-4 rounded-xl p-4 transition hover:bg-white/5"
            style={{
              background: "var(--card-bg)",
              border: "1px solid var(--border-color)",
            }}
          >
            {/* Category */}
            <div className="flex items-center gap-2">
              <span className="text-xl">{row.emoji}</span>
              <span className="font-semibold text-sm">{row.category}</span>
            </div>

            {/* US */}
            <div className="flex flex-wrap gap-2 justify-center">
              {row.us.map((s) => {
                const st = BADGE_STYLES[s.status];
                return (
                  <span
                    key={s.name}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
                    style={{
                      background: st.bg,
                      border: `1px solid ${st.border}`,
                      color: st.text,
                    }}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: st.border }}
                    />
                    {s.name}
                  </span>
                );
              })}
            </div>

            {/* India */}
            <div className="flex flex-wrap gap-2 justify-center">
              {row.india.map((s) => {
                const st = BADGE_STYLES[s.status];
                return (
                  <span
                    key={s.name}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
                    style={{
                      background: st.bg,
                      border: `1px solid ${st.border}`,
                      color: st.text,
                    }}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: st.border }}
                    />
                    {s.name}
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Summary stats */}
      <div className="max-w-6xl mx-auto mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {(["available", "partial", "gap"] as const).map((status) => {
          const usCount = COMPARISON_DATA.flatMap((r) => r.us).filter((s) => s.status === status).length;
          const indiaCount = COMPARISON_DATA.flatMap((r) => r.india).filter((s) => s.status === status).length;
          const st = BADGE_STYLES[status];
          const label = status === "available" ? "Fully Available" : status === "partial" ? "Partial / Emerging" : "Gap / Early Stage";
          return (
            <div
              key={status}
              className="rounded-xl p-5 text-center"
              style={{ background: "var(--card-bg)", border: `1px solid ${st.border}` }}
            >
              <div className="text-sm font-semibold mb-3" style={{ color: st.text }}>
                {label}
              </div>
              <div className="flex justify-center gap-8">
                <div>
                  <div className="text-2xl font-black">{usCount}</div>
                  <div className="text-xs" style={{ color: "var(--text-secondary)" }}>
                    US
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-black">{indiaCount}</div>
                  <div className="text-xs" style={{ color: "var(--text-secondary)" }}>
                    India
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
