# Signal — Market Validation Platform

## Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS (Linear-inspired design system)
- **Database**: SQLite via Prisma ORM
- **Charts**: Recharts

## Getting Started

```bash
# Install dependencies
npm install

# Generate Prisma client + push schema
npx prisma generate
npx prisma db push

# Seed sample data (optional)
npx tsx prisma/seed.ts

# Start dev server
npm run dev
```

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Landing page (input)
│   ├── dashboard/
│   │   └── page.tsx          # Dashboard (score + signals)
│   └── api/
│       ├── topics/           # Create/list topics
│       └── topics/[id]/
│           ├── route.ts      # Get topic detail
│           ├── scan/         # Run signal scan
│           ├── score/        # Score history
│           └── signals/      # Signal list
├── lib/
│   ├── types.ts              # Shared types
│   ├── db.ts                 # Prisma client
│   ├── db-ops.ts             # Database CRUD operations
│   ├── pipeline.ts           # Main Pipeline: Collect → Classify → Score
│   ├── signals/
│   │   ├── collector.ts      # Unified 5-source collector
│   │   ├── keywords.ts       # 扩词 engine (CN→EN context)
│   │   ├── reddit.ts         # Reddit API
│   │   ├── hackernews.ts     # HN Algolia API
│   │   ├── producthunt.ts    # PH API
│   │   ├── googletrends.ts   # Google Trends
│   │   └── payment.ts        # Fiverr / Upwork / Gumroad
│   ├── llm/
│   │   └── classifier.ts     # Rule-based signal classification
│   ├── scoring/
│   │   └── engine.ts         # 4D scoring + GO/NO-GO decision
│   └── scheduler.ts          # Cron jobs
└── components/
    └── ...                    # Shared React components
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/topics` | Create new topic + quick scan |
| GET | `/api/topics/[id]` | Get topic detail + signals + score |
| POST | `/api/topics/[id]/scan` | Run full signal scan |
| GET | `/api/topics/[id]/score` | Score history (trend chart) |
| GET | `/api/topics/[id]/signals` | Signal list with filters |
| GET | `/api/cron/scan` | Scheduled 6h scan (cron) |

## Signal Sources

| Source | Type | API |
|--------|------|-----|
| Reddit | Community discussion | Public JSON API |
| Hacker News | Tech community | Algolia Search API |
| Product Hunt | Product launches | v1 Public API |
| Google Trends | Search volume | Unofficial widget API |
| Fiverr | Service marketplace | HTML scraping (P2: headless) |
| Upwork | Freelance jobs | RSS feed |
| Gumroad | Digital products | HTML scraping (P2: headless) |
