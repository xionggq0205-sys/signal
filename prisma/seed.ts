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

  // Create a sample topic
  const topic = await prisma.topic.create({
    data: {
      userId: user.id,
      title: "epub to pdf converter",
      description:
        "A tool to convert epub ebooks to pdf format with formatting preserved. Many users complain that Calibre is too complicated and the output formatting breaks.",
      keywords: JSON.stringify([
        "epub to pdf converter",
        "convert epub to pdf",
        "ebook converter",
        "epub converter online",
        "best epub to pdf tool",
        "Calibre alternative",
        "batch convert epub files",
        "free epub converter",
      ]),
    },
  });
  console.log(`Created topic: ${topic.title}`);

  // Add some mock signals
  const mockSignals = [
    {
      topicId: topic.id,
      source: "reddit",
      type: "pain_point",
      title: "Why is converting epub to pdf still such a nightmare in 2024?",
      content:
        "I have tried Calibre, online converters, everything. The formatting is always broken, fonts are wrong, and it takes forever. I would literally pay $10/month for something that just works.",
      url: "https://reddit.com/r/ebooks/comments/example1",
      author: "bookworm42",
      engagement: 156,
      intensity: 0.85,
      specificity: 0.7,
      wtpSignal: 0.8,
      extractedAt: new Date(),
    },
    {
      topicId: topic.id,
      source: "hackernews",
      type: "feature_request",
      title: "Show HN: I built an epub converter that actually preserves formatting",
      content:
        "I got tired of Calibre ruining my carefully formatted ebooks. Built a CLI tool that uses headless Chrome for pixel-perfect PDF output. Looking for beta testers.",
      url: "https://news.ycombinator.com/item?id=example1",
      author: "dev_pdf",
      engagement: 89,
      intensity: 0.45,
      specificity: 0.9,
      wtpSignal: 0.2,
      extractedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
    {
      topicId: topic.id,
      source: "producthunt",
      type: "comparison",
      title: "PDFConvert — The simplest epub to pdf converter",
      content:
        "A dead-simple epub to pdf converter. Drag, drop, done. No configuration needed. Alternative to Calibre for people who just want files converted.",
      url: "https://producthunt.com/posts/pdfconvert",
      author: "startup_founder",
      engagement: 234,
      intensity: 0.3,
      specificity: 0.5,
      wtpSignal: 0.4,
      extractedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    },
    {
      topicId: topic.id,
      source: "googletrends",
      type: "question",
      title: 'Search interest: "epub to pdf converter" (avg: 67)',
      content:
        'Google Trends 12-month search interest for "epub to pdf converter": 67 average relative interest. 12 monthly data points.',
      url: "https://trends.google.com/trends/explore?q=epub+to+pdf+converter",
      engagement: 67,
      intensity: 0.2,
      specificity: 0.3,
      wtpSignal: 0.1,
      extractedAt: new Date(),
    },
    {
      topicId: topic.id,
      source: "fiverr",
      type: "payment_signal",
      title: "I will convert your epub to pdf with perfect formatting",
      content:
        "Professional epub to pdf conversion service. I preserve all formatting, fonts, and layout. 100+ orders completed.",
      url: "https://fiverr.com/gigs/epub-conversion",
      author: "formatpro",
      engagement: 45,
      intensity: 0.1,
      specificity: 0.8,
      wtpSignal: 0.9,
      extractedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      topicId: topic.id,
      source: "reddit",
      type: "complaint",
      title: "Calibre epub to pdf output is unacceptable for professional use",
      content:
        "Trying to convert technical ebooks to pdf for work. Calibre destroys the code blocks, tables are misaligned, and images get stretched. What are you all using instead?",
      url: "https://reddit.com/r/selfpublish/comments/example2",
      author: "tech_author",
      engagement: 203,
      intensity: 0.75,
      specificity: 0.8,
      wtpSignal: 0.6,
      extractedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
  ];

  for (const signal of mockSignals) {
    await prisma.signal.create({ data: signal });
  }
  console.log(`Created ${mockSignals.length} mock signals`);

  // Create a score snapshot
  await prisma.scoreSnapshot.create({
    data: {
      topicId: topic.id,
      compositeScore: 72.5,
      frequencyScore: 18.2,
      intensityScore: 22.5,
      specificityScore: 15.8,
      monetizabilityScore: 16.0,
      totalSignals: 6,
      activeSignals: 6,
      growthRate: 0.8,
      goDecision: "go",
      goReasons: JSON.stringify([
        "Multi-platform validation (3+ sources show same demand)",
        "High pain intensity (avg intensity > 0.6)",
        "Willingness to pay detected (WTP > 0.3 or payment signals present)",
      ]),
      noGoReasons: null,
      snappedAt: new Date(),
    },
  });
  console.log("Created score snapshot");
  console.log("Seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
