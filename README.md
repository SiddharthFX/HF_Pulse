<div align="center">

# ⚡ HF Pulse — Hugging Face Analytics Dashboard

**Live, research-grade intelligence for the Pluto AI Labs Hugging Face organization.**

[![Next.js](https://img.shields.io/badge/Next.js-15.5-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.3-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Cloudflare](https://img.shields.io/badge/Cloudflare-OpenNext-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)](https://opennext.js.org/cloudflare)
[![Hugging Face](https://img.shields.io/badge/Hugging%20Face-Hub%20API-FFD21E?style=for-the-badge&logo=huggingface&logoColor=black)](https://huggingface.co/Pluto-AI-Labs)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

<br />

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-data-honesty-principles">Data Honesty</a> •
  <a href="#-architecture">Architecture</a> •
  <a href="#-scripts">Scripts</a> •
  <a href="#-deployment">Deployment</a>
</p>

</div>

---

## 🧭 Overview

**HF Pulse** is a high-performance analytics platform built for tracking repository engagement, velocity, and assets across the [`Pluto-AI-Labs`](https://huggingface.co/Pluto-AI-Labs) portfolio on Hugging Face Hub.

Engineered with **Next.js 15 App Router**, **React 19**, **Tailwind CSS v4**, and **OpenNext for Cloudflare**, HF Pulse requires:
- ❌ **No database**
- ❌ **No authentication or tracking cookies**
- ❌ **No third-party SaaS analytics**
- ❌ **No synthetic data interpolation**

It interfaces directly with public Hugging Face endpoints, caches responses via Incremental Static Regeneration (ISR) with 12-hour revalidation, and allows instant on-demand cache busting.

---

## ✨ Features

- 🌿 **Modern Sage Aesthetic & Floating Pill Navigation:** Refined floating icon rail with elevation stacking, animated tooltips, and a slide-over mobile drawer with full keyboard and focus trap accessibility.
- 🏔️ **Mountain & Peak Visualizations:** Interactive download elevation charts comparing lifetime downloads, 30-day velocity, and community likes with linear & logarithmic scale controls.
- ⚖️ **Portfolio Balance Gauge:** Radial gauge breakdown measuring distribution between Models and Datasets across 7d, 30d, 90d, and all-time horizons.
- 💡 **Narrative Research Insights:** Real-time concentration analysis highlighting top-performing repositories and recent publish recency without marketing fluff.
- 🔍 **Universal ⌘K Search:** Instant fuzzy subsequence search across all models and datasets with keyboard navigation.
- 🏷️ **Adaptive Collection Views:** Switch seamlessly between responsive Grid and dense Table views, with task-based grouping and sorting.
- 🌓 **Curated Dark / Light Theme:** Custom HSL color system anchored by rich Jade accents (`#0fa871`), zero flash of unstyled theme (FOUT), and persistent preference storage.
- 📥 **One-Click JSON Export:** Download the entire Hub telemetry snapshot directly from the topbar.
- ☁️ **Cloudflare & Edge Ready:** Preconfigured for ultra-fast global edge deployment using OpenNext Cloudflare Workers.
- 🛡️ **Defensive & Resilient:** Zod schema validation on every API endpoint with isolated failure boundaries — if models rate-limit, datasets continue to render uninterrupted.

---

## 📊 Live Metrics & Telemetry

| Metric | Source | Description |
| :--- | :--- | :--- |
| **Lifetime Downloads** | Hub API (`downloadsAllTime`) | Total downloads since repository inception |
| **30-Day Downloads** | Hub API (`downloads`) | Downloads accumulated over the last 30 days |
| **Community Likes** | Hub API (`likes`) | Public stars/likes awarded by the Hub community |
| **Hosted Assets** | Hub Repositories | Aggregated count of public models and datasets |
| **Portfolio Freshness** | `lastModified` | Categorized as *Active* (≤7d), *Recent* (≤30d), *Stable* (≤180d), or *Dormant* |

---

## 🚀 Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/SiddharthFX/HF_Pulse.git
cd HF_Pulse
```

### 2. Install dependencies

```bash
npm install
```

### 3. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. The dashboard functions immediately out of the box because Hugging Face Hub endpoints are public.

### 4. Optional: Higher Rate Limit Token

Hugging Face throttles unauthenticated IP addresses. To raise your throttle limits, copy the environment template:

```bash
cp .env.example .env.local
```

Add your **read-scope** token to `.env.local`:

```ini
HF_TOKEN=hf_your_read_token_here
```

> **Security Note:** The token is read server-side only in `lib/hf/client.ts` to sign outbound requests. It is never bundled into client scripts, never logged, and `.env.local` is gitignored.

---

## ⚖️ Data Honesty Principles

This dashboard was built under strict telemetry ethics:

1. **No Invented Time Series:** The Hugging Face public Hub API exposes no daily time-series counts. HF Pulse never fakes or interpolates daily trendlines.
2. **Missing ≠ Zero:** If the Hub does not return a field for a repository, the dashboard renders `—` rather than an inaccurate `0`.
3. **Explicit Partial Totals:** Any aggregate missing data for one or more repos is marked with an asterisk (`*`) detailing exact omission counts.
4. **Honest Velocity Shares:** 30-day downloads relative to lifetime downloads are strictly labeled as a *share*, never as a synthetic growth rate.
5. **No Negative Fabrications:** No declining charts or red down-arrows appear unless backed by authentic API delta proofs.

---

## 🏗️ Architecture

```
HF_Pulse/
├── app/
│   ├── api/
│   │   ├── hf/route.ts          # JSON export route
│   │   └── revalidate/route.ts  # POST-only tag cache buster
│   ├── error.tsx                # Error boundary
│   ├── globals.css              # Custom Jade design system & dark theme tokens
│   ├── layout.tsx               # Root HTML, Plus Jakarta Sans, theme injector
│   ├── loading.tsx              # Skeleton shimmers
│   └── page.tsx                 # ISR entry point (revalidate = 43200)
├── components/
│   ├── DashboardShell.tsx       # Main dashboard layout coordinator
│   ├── RepoConfirmDialog.tsx    # Accessible universal detail sheet
│   ├── shell/
│   │   ├── SearchField.tsx      # Fuzzy ⌘K search combobox
│   │   ├── ShellContext.tsx     # Context & modal manager
│   │   ├── Sidebar.tsx          # Floating navigation rail & mobile drawer
│   │   └── Topbar.tsx           # Global actions, refresh & theme toggles
│   ├── ui/                      # Primitive accessible UI components
│   └── widgets/
│       ├── DownloadDistributionCard.tsx # Donut & bar market share
│       ├── DownloadsOverviewCard.tsx    # Mountain velocity visualization
│       ├── InsightCard.tsx              # Research narrative & pixel motif
│       ├── KpiGrid.tsx                  # Top-line metrics
│       ├── ModelsSection.tsx            # Model repository collection
│       ├── DatasetsSection.tsx          # Dataset repository collection
│       ├── PromoCard.tsx                # Public research hub callout
│       ├── RecentActivityCard.tsx       # Chronological update ledger
│       ├── RepoHealthGaugeCard.tsx      # Radial portfolio balance gauge
│       └── TopReposCard.tsx             # Ranked leaders by downloads
├── lib/
│   ├── constants.ts             # Compile-time org configs & keys
│   ├── format.ts                # Null-safe tabular numeric formatters
│   └── hf/
│       ├── client.ts            # Resilient HTTP client with retry backoff
│       ├── derive.ts            # Pure arithmetic functions
│       ├── fixtures.ts          # Offline dev mode mock fixtures
│       ├── payload.ts           # Unified payload composer
│       ├── queries.ts           # Hub query composers
│       └── schemas.ts           # Zod response validation
├── open-next.config.ts          # OpenNext Cloudflare configuration
├── wrangler.jsonc               # Cloudflare Workers configuration
└── types/
    └── hf.ts                    # Shared domain type definitions
```

---

## 🛠️ Scripts

| Command | Action |
| :--- | :--- |
| `npm run dev` | Starts local Next.js dev server on port `3000` |
| `npm run build` | Generates optimized production build with ISR prerendering |
| `npm start` | Runs the compiled production server |
| `npm run lint` | Runs Next.js ESLint verification |
| `npm run typecheck` | Executes `tsc --noEmit` strict mode check |
| `npm run cf:build` | Compiles the application bundle for Cloudflare via OpenNext |
| `npm run cf:deploy` | Builds and deploys directly to Cloudflare Workers via Wrangler |

---

## 🌐 Offline Development

To develop or test without network access:

```bash
HF_FIXTURES=1 npm run dev
```

This injects simulated local fixtures from `lib/hf/fixtures.ts` and renders a prominent banner indicating test mode. Fixtures are statically excluded in production builds.

---

## 🚢 Deployment

### 1. Cloudflare Workers / Pages (OpenNext)

Deploy to Cloudflare's global edge network using the included OpenNext configuration:

```bash
# Build the Cloudflare Worker bundle
npm run cf:build

# Deploy to Cloudflare Workers
npm run cf:deploy
```

Ensure `HF_TOKEN` is configured as a secret in your Cloudflare dashboard or via `wrangler secret put HF_TOKEN`.

### 2. Vercel, Node, or Docker

Deploy to any platform that supports **Next.js 15**:

1. Set `HF_TOKEN` in your hosting provider's Environment Variables (optional, for higher rate limits).
2. The application will automatically statically pre-render the dashboard and revalidate in the background every 12 hours.

---

## 📄 License

Distributed under the MIT License. Built for **Pluto AI Labs** research on the Hugging Face Hub.
