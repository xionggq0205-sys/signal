/**
 * Database seed script for development.
 * Creates a default user and sample topic with mock signals.
 *
 * Run: npx tsx prisma/seed.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create default user
  const user = await prisma.user.upsert({
    where: { email: "dev@signal.app" },
    update: {},
    create: {
      id: "default-user",
      email: "dev@signal.app",
      name: "Developer",
    },
  });
  console.log(`Created user: ${user.email}`);

  // ── Scenario 1: epub to pdf converter (GO — strong demand) ──
  await seedTopic(user.id, {
    title: "epub to pdf converter",
    description:
      "A tool to convert epub ebooks to pdf format with formatting preserved.",
    keywords: [
      "epub to pdf converter",
      "convert epub to pdf",
      "ebook converter",
      "epub converter online",
      "Calibre alternative",
      "batch convert epub files",
    ],
    signals: [
      {
        source: "reddit", type: "pain_point",
        title: "Why is converting epub to pdf still such a nightmare?",
        content: "I have tried Calibre, online converters, everything. Formatting always breaks. I would pay $10/mo for something that just works.",
        url: "https://reddit.com/r/ebooks", author: "bookworm42", engagement: 156, intensity: 0.85, specificity: 0.7, wtpSignal: 0.8,
      },
      {
        source: "hackernews", type: "feature_request",
        title: "Show HN: I built an epub converter that preserves formatting",
        content: "Frustrated with Calibre, I built a CLI tool using headless Chrome for pixel-perfect PDF output. Looking for beta testers.",
        url: "https://news.ycombinator.com/item?id=1", author: "dev_pdf", engagement: 89, intensity: 0.45, specificity: 0.9, wtpSignal: 0.2, daysAgo: 3,
      },
      {
        source: "producthunt", type: "comparison",
        title: "PDFConvert — simplest epub to pdf converter",
        content: "Drag, drop, done. No configuration. Alternative to Calibre for people who just want files converted.",
        url: "https://producthunt.com/posts/pdfconvert", author: "founder_x", engagement: 234, intensity: 0.3, specificity: 0.5, wtpSignal: 0.4, daysAgo: 7,
      },
      {
        source: "googletrends", type: "question",
        title: 'Search interest: "epub to pdf converter" (avg: 67)',
        content: "Google Trends 12-month interest: 67 average. Growing 8% YoY.",
        engagement: 67, intensity: 0.2, specificity: 0.3, wtpSignal: 0.1,
      },
      {
        source: "fiverr", type: "payment_signal",
        title: "I will convert your epub to pdf with perfect formatting",
        content: "Professional epub→pdf conversion. 100+ orders completed, 4.9 stars.",
        url: "https://fiverr.com/gigs/epub", author: "formatpro", engagement: 45, intensity: 0.1, specificity: 0.8, wtpSignal: 0.9, daysAgo: 2,
      },
      {
        source: "reddit", type: "complaint",
        title: "Calibre epub→pdf output unacceptable for professional use",
        content: "Technical ebooks to pdf — code blocks destroyed, tables misaligned, images stretched. What are you all using?",
        url: "https://reddit.com/r/selfpublish", author: "tech_author", engagement: 203, intensity: 0.75, specificity: 0.8, wtpSignal: 0.6, daysAgo: 5,
      },
    ],
    score: { composite: 72, frequency: 18, intensity: 23, specificity: 16, monetizability: 15, totalSignals: 6, goDecision: "go", goReasons: ["Multi-platform validation (3+ sources)", "High pain intensity", "WTP signals detected"] },
  });

  // ── Scenario 2: AI writing assistant for developers (UNCERTAIN — emerging) ──
  await seedTopic(user.id, {
    title: "AI writing assistant for developers",
    description: "An AI tool that helps developers write technical docs, README files, and API documentation.",
    keywords: [
      "AI documentation generator",
      "code to docs AI",
      "auto generate README",
      "developer writing tool",
      "AI technical writer",
      "API documentation generator",
    ],
    signals: [
      {
        source: "hackernews", type: "feature_request",
        title: "Is there an AI that generates good README files?",
        content: "I hate writing documentation. Is there a tool that takes my codebase and generates comprehensive docs? Not just comments — actual guides.",
        url: "https://news.ycombinator.com/item?id=2", author: "lazy_dev", engagement: 312, intensity: 0.6, specificity: 0.7, wtpSignal: 0.5,
      },
      {
        source: "reddit", type: "pain_point",
        title: "Writing technical docs is the worst part of being a developer",
        content: "I spend 30% of my sprint writing docs. If an AI could do 80% of the work and I just review/edit, I would pay $25/mo immediately.",
        url: "https://reddit.com/r/programming", author: "doc_hater", engagement: 178, intensity: 0.7, specificity: 0.6, wtpSignal: 0.7,
      },
      {
        source: "producthunt", type: "comparison",
        title: "DocuGen — AI-powered documentation for dev teams",
        content: "Generate, maintain, and translate technical docs. Integrates with GitHub, GitLab. Early access.",
        url: "https://producthunt.com/posts/docugen", author: "ai_startup", engagement: 145, intensity: 0.25, specificity: 0.6, wtpSignal: 0.3, daysAgo: 5,
      },
      {
        source: "upwork", type: "payment_signal",
        title: "Technical writer needed — API docs for SaaS platform",
        content: "Looking for a technical writer to document our REST API. Swagger/OpenAPI experience required. Budget: $2,000-3,500.",
        engagement: 12, intensity: 0.1, specificity: 0.9, wtpSignal: 0.85, daysAgo: 10,
      },
      {
        source: "reddit", type: "question",
        title: "What do you use for API documentation in 2026?",
        content: "Evaluating documentation tools for our team. Currently using manually-written docs, looking for something automated. What's good?",
        url: "https://reddit.com/r/webdev", author: "api_dev", engagement: 67, intensity: 0.15, specificity: 0.5, wtpSignal: 0.2, daysAgo: 3,
      },
    ],
    score: { composite: 52, frequency: 12, intensity: 16, specificity: 14, monetizability: 10, totalSignals: 5, goDecision: "uncertain", goReasons: ["Pain intensity crosses threshold", "Payment signals exist"], },
  });

  // ── Scenario 3: time tracking for freelancers (NO-GO — saturated) ──
  await seedTopic(user.id, {
    title: "time tracking for freelancers",
    description: "A simple time tracking app for freelancers to log hours, generate invoices, and track project profitability.",
    keywords: [
      "time tracking app",
      "freelance time tracker",
      "billable hours tracker",
      "project time tracking",
      "freelancer invoicing",
      "time management tool",
    ],
    signals: [
      {
        source: "reddit", type: "complaint",
        title: "Toggl is getting too expensive for freelancers",
        content: "Toggl just raised prices again. $18/mo for basic time tracking is ridiculous for solo freelancers. Any alternatives?",
        url: "https://reddit.com/r/freelance", author: "solo_dev", engagement: 245, intensity: 0.7, specificity: 0.5, wtpSignal: 0.5,
      },
      {
        source: "producthunt", type: "comparison",
        title: "Clockwise — smart time tracking for teams",
        content: "AI-powered time tracking. Auto-categorizes activities, generates reports. Team plans from $12/user.",
        url: "https://producthunt.com/posts/clockwise", author: "saas_founder", engagement: 340, intensity: 0.2, specificity: 0.7, wtpSignal: 0.2, daysAgo: 10,
      },
      {
        source: "reddit", type: "pain_point",
        title: "Every time tracker I try has too many features",
        content: "I just want a timer, a project name, and a weekly report. Why does every tool have team management, kanban boards, and integrations I'll never use?",
        url: "https://reddit.com/r/freelance", author: "minimalist_dev", engagement: 89, intensity: 0.55, specificity: 0.8, wtpSignal: 0.3,
      },
      {
        source: "googletrends", type: "question",
        title: 'Search interest: "time tracking app" (avg: 34)',
        content: "Google Trends 12-month interest: 34 average. Declining 5% YoY. Market appears saturated.",
        engagement: 34, intensity: 0.1, specificity: 0.2, wtpSignal: 0.05,
      },
      {
        source: "producthunt", type: "comparison",
        title: "Toggl Track — time tracking that works everywhere",
        content: "The market leader. 5M+ users. Native apps for every platform. Free plan for up to 5 users.",
        url: "https://producthunt.com/posts/toggl", author: "toggl_team", engagement: 520, intensity: 0.05, specificity: 0.9, wtpSignal: 0.1, daysAgo: 1,
      },
      {
        source: "fiverr", type: "payment_signal",
        title: "I will set up your time tracking and invoicing system",
        content: "Helping freelancers set up time tracking workflows. 50+ orders. Not building new tools — just configuring existing ones.",
        engagement: 22, intensity: 0.0, specificity: 0.6, wtpSignal: 0.4, daysAgo: 7,
      },
    ],
    score: { composite: 28, frequency: 8, intensity: 9, specificity: 7, monetizability: 4, totalSignals: 6, goDecision: "no_go", goReasons: [], },
  });

  console.log("\nSeed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

// ─── Helper: create a topic with signals & score ────────────────

async function seedTopic(
  userId: string,
  config: {
    title: string;
    description: string;
    keywords: string[];
    signals: Array<{
      source: string;
      type: string;
      title: string;
      content: string;
      url?: string;
      author?: string;
      engagement: number;
      intensity: number;
      specificity: number;
      wtpSignal: number;
      daysAgo?: number;
    }>;
    score: {
      composite: number;
      frequency: number;
      intensity: number;
      specificity: number;
      monetizability: number;
      totalSignals: number;
      goDecision: string;
      goReasons: string[];
    };
  }
) {
  const topic = await prisma.topic.create({
    data: {
      userId,
      title: config.title,
      description: config.description,
      keywords: JSON.stringify(config.keywords),
    },
  });

  for (const s of config.signals) {
    await prisma.signal.create({
      data: {
        topicId: topic.id,
        source: s.source,
        type: s.type,
        title: s.title,
        content: s.content,
        url: s.url || null,
        author: s.author || null,
        engagement: s.engagement,
        intensity: s.intensity,
        specificity: s.specificity,
        wtpSignal: s.wtpSignal,
        extractedAt: s.daysAgo
          ? new Date(Date.now() - s.daysAgo * 24 * 60 * 60 * 1000)
          : new Date(),
      },
    });
  }

  await prisma.scoreSnapshot.create({
    data: {
      topicId: topic.id,
      compositeScore: config.score.composite,
      frequencyScore: config.score.frequency,
      intensityScore: config.score.intensity,
      specificityScore: config.score.specificity,
      monetizabilityScore: config.score.monetizability,
      totalSignals: config.score.totalSignals,
      activeSignals: config.score.totalSignals,
      growthRate: 0.5,
      goDecision: config.score.goDecision,
      goReasons: JSON.stringify(config.score.goReasons),
      noGoReasons: null,
      snappedAt: new Date(),
    },
  });

  console.log(`  ✅ ${config.title} (${config.signals.length} signals, score: ${config.score.composite}/100)`);
  return topic;
}
