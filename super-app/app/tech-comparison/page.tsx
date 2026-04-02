"use client";

import React from "react";

/* ------------------------------------------------------------------ */
/*  TYPES                                                             */
/* ------------------------------------------------------------------ */
interface Solution {
  name: string;
  url?: string;
  logo: string; // domain for favicon
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
      { name: "Microsoft 365", logo: "microsoft.com" },
      { name: "Google Workspace", logo: "google.com" },
      { name: "Slack", logo: "slack.com" },
      { name: "Zoom", logo: "zoom.us" },
    ],
    india: [
      { name: "HCL Domino Workspace", logo: "hcl-software.com", url: "https://www.hcl-software.com/domino" },
      { name: "Reverie NLP", logo: "reverieinc.com", url: "https://reverieinc.com" },
    ],
  },
  {
    category: "LLMs",
    emoji: "\uD83E\uDDE0",
    us: [
      { name: "OpenAI GPT-4", logo: "openai.com" },
      { name: "Claude", logo: "anthropic.com" },
      { name: "Llama", logo: "meta.com" },
    ],
    india: [
      { name: "Krutrim", logo: "krutrim.com", url: "https://www.krutrim.com" },
      { name: "Sarvam AI", logo: "sarvam.ai", url: "https://www.sarvam.ai" },
      { name: "BharatGPT", logo: "bharatgpt.ai", url: "https://bharatgpt.ai" },
    ],
  },
  {
    category: "Cloud Infrastructure",
    emoji: "\u2601\uFE0F",
    us: [
      { name: "AWS", logo: "aws.amazon.com" },
      { name: "Azure", logo: "azure.microsoft.com" },
      { name: "GCP", logo: "cloud.google.com" },
    ],
    india: [
      { name: "Jio Cloud", logo: "jio.com", url: "https://www.jio.com/business/jio-cloud" },
      { name: "Sify", logo: "sify.com", url: "https://www.sify.com" },
      { name: "E2E Networks", logo: "e2enetworks.com", url: "https://www.e2enetworks.com" },
    ],
  },
  {
    category: "AI Orchestration",
    emoji: "\uD83D\uDD17",
    us: [
      { name: "LangChain", logo: "langchain.com" },
      { name: "CrewAI", logo: "crewai.com" },
      { name: "AutoGen", logo: "microsoft.com" },
    ],
    india: [
      { name: "HCL Workload Automation", logo: "hcl-software.com", url: "https://www.hcl-software.com/workload-automation" },
      { name: "SuperAGI", logo: "superagi.com", url: "https://superagi.com" },
    ],
  },
  {
    category: "Data Analytics",
    emoji: "\uD83D\uDCCA",
    us: [
      { name: "Snowflake", logo: "snowflake.com" },
      { name: "Databricks", logo: "databricks.com" },
    ],
    india: [
      { name: "HCL Actian", logo: "hcl-software.com", url: "https://www.hcl-software.com/actian" },
      { name: "Hevo Data", logo: "hevodata.com", url: "https://hevodata.com" },
      { name: "Sigmoid", logo: "sigmoid.com", url: "https://www.sigmoid.com" },
    ],
  },
  {
    category: "CRM & Sales",
    emoji: "\uD83E\uDD1D",
    us: [
      { name: "Salesforce", logo: "salesforce.com" },
      { name: "HubSpot", logo: "hubspot.com" },
    ],
    india: [
      { name: "Zoho CRM", logo: "zoho.com", url: "https://www.zoho.com/crm" },
      { name: "Freshsales", logo: "freshworks.com", url: "https://www.freshworks.com/crm/sales" },
    ],
  },
  {
    category: "Cybersecurity",
    emoji: "\uD83D\uDD12",
    us: [
      { name: "CrowdStrike", logo: "crowdstrike.com" },
      { name: "Palo Alto", logo: "paloaltonetworks.com" },
    ],
    india: [
      { name: "HCL BigFix", logo: "hcl-software.com", url: "https://www.hcl-software.com/bigfix" },
      { name: "HCL AppScan", logo: "hcl-software.com", url: "https://www.hcl-software.com/appscan" },
    ],
  },
  {
    category: "Developer Tools",
    emoji: "\uD83D\uDEE0\uFE0F",
    us: [
      { name: "GitHub Copilot", logo: "github.com" },
      { name: "Cursor", logo: "cursor.com" },
    ],
    india: [
      { name: "Pieces", logo: "pieces.app", url: "https://pieces.app" },
      { name: "CodeParrot", logo: "codeparrot.ai", url: "https://www.codeparrot.ai" },
    ],
  },
  {
    category: "Payment & Fintech",
    emoji: "\uD83D\uDCB3",
    us: [
      { name: "Stripe", logo: "stripe.com" },
      { name: "Plaid", logo: "plaid.com" },
    ],
    india: [
      { name: "Razorpay", logo: "razorpay.com", url: "https://razorpay.com" },
      { name: "PhonePe", logo: "phonepe.com", url: "https://www.phonepe.com" },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  LOGO HELPER                                                       */
/* ------------------------------------------------------------------ */
function LogoImg({ domain }: { domain: string }) {
  return (
    <img
      src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
      alt=""
      width={24}
      height={24}
      className="rounded-sm shrink-0"
      style={{ imageRendering: "auto" }}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  BADGE COMPONENT                                                   */
/* ------------------------------------------------------------------ */
function SolutionBadge({ s, side }: { s: Solution; side: "us" | "india" }) {
  const colors =
    side === "us"
      ? { bg: "rgba(59,130,246,0.12)", border: "rgba(59,130,246,0.3)", text: "#93c5fd" }
      : { bg: "rgba(34,197,94,0.12)", border: "rgba(34,197,94,0.3)", text: "#86efac" };

  const badge = (
    <span
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-transform hover:scale-105"
      style={{
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        color: colors.text,
      }}
    >
      <LogoImg domain={s.logo} />
      {s.name}
      {s.url && <span style={{ fontSize: "9px", opacity: 0.5 }}>&#x2197;</span>}
    </span>
  );

  if (s.url) {
    return (
      <a href={s.url} target="_blank" rel="noopener noreferrer">
        {badge}
      </a>
    );
  }
  return badge;
}

/* ------------------------------------------------------------------ */
/*  PAGE                                                              */
/* ------------------------------------------------------------------ */
export default function TechComparisonPage() {
  const usTotal = COMPARISON_DATA.reduce((n, r) => n + r.us.length, 0);
  const indiaTotal = COMPARISON_DATA.reduce((n, r) => n + r.india.length, 0);

  return (
    <div
      className="min-h-screen p-6"
      style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)",
        color: "#f1f5f9",
      }}
    >
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-3xl font-black tracking-tight mb-1">
          <span className="bg-gradient-to-r from-blue-400 via-white to-orange-400 bg-clip-text text-transparent">
            US vs India &mdash; AI &amp; Technology Stack
          </span>
        </h1>
        <p className="text-sm" style={{ color: "#94a3b8" }}>
          Comparative Analysis &mdash; HCLSoftware
        </p>

        {/* Counters */}
        <div className="flex justify-center gap-6 mt-4">
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg" style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.25)" }}>
            <span className="text-lg font-black text-blue-400">{usTotal}</span>
            <span className="text-xs font-semibold text-blue-300">US Solutions</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg" style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)" }}>
            <span className="text-lg font-black text-green-400">{indiaTotal}</span>
            <span className="text-xs font-semibold text-green-300">India Solutions</span>
          </div>
        </div>
      </div>

      {/* Comparison Grid */}
      <div className="max-w-6xl mx-auto space-y-4">
        {/* Header row */}
        <div className="grid grid-cols-3 gap-4 px-4 text-sm font-bold" style={{ color: "#94a3b8" }}>
          <div>Category</div>
          <div className="text-center">
            <span className="inline-block w-6 h-4 mr-1 align-middle rounded-sm" style={{ background: "linear-gradient(90deg, #3b82f6, #ef4444)" }} />
            US Solutions
          </div>
          <div className="text-center">
            <span className="inline-block w-6 h-4 mr-1 align-middle rounded-sm" style={{ background: "linear-gradient(90deg, #22c55e, #16a34a)" }} />
            India Solutions
          </div>
        </div>

        {COMPARISON_DATA.map((row) => (
          <div
            key={row.category}
            className="grid grid-cols-3 gap-4 rounded-xl p-4 transition hover:bg-white/5"
            style={{
              background: "#1e293b",
              border: "1px solid #334155",
            }}
          >
            {/* Category */}
            <div className="flex items-center gap-2">
              <span className="text-xl">{row.emoji}</span>
              <span className="font-semibold text-sm">{row.category}</span>
            </div>

            {/* US */}
            <div className="flex flex-wrap gap-2 justify-center">
              {row.us.map((s) => (
                <SolutionBadge key={s.name} s={s} side="us" />
              ))}
            </div>

            {/* India */}
            <div className="flex flex-wrap gap-2 justify-center">
              {row.india.map((s) => (
                <SolutionBadge key={s.name} s={s} side="india" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
