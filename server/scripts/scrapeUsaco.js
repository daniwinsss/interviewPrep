/**
 * USACO Problem Scraper & Seeder
 * 
 * Usage: node server/scripts/scrapeUsaco.js
 * 
 * This script:
 * 1. Fetches problem statement HTML from usaco.org for each curated cpid
 * 2. Downloads + unzips the test data
 * 3. Seeds all problems into MongoDB
 */

import 'dotenv/config';
import axios from 'axios';
import * as cheerio from 'cheerio';
import AdmZip from 'adm-zip';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import Problem from '../src/models/Problem.js';
import { BRONZE_PROBLEMS, SILVER_PROBLEMS } from './usacoProblemList.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const USACO_BASE = 'https://usaco.org';
const PROBLEM_URL = (cpid) => `${USACO_BASE}/index.php?page=viewproblem2&cpid=${cpid}`;

// Polite delay between requests to avoid hammering USACO servers
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Parse the problem HTML page to extract:
 * - title, description, time/memory limits
 */
async function fetchProblemPage(cpid) {
  try {
    const { data: html } = await axios.get(PROBLEM_URL(cpid), {
      headers: { 'User-Agent': 'Mozilla/5.0 (Educational Tool)' },
      timeout: 15000
    });

    const $ = cheerio.load(html);
    
    // The problem statement lives in .problem-text div
    const bodyEl = $('.problem-text');
    const description = bodyEl.html()?.trim() || 'See problem at usaco.org';
    
    // Time/memory limits are in .prob-info
    const infoText = $('.prob-info').text() || '';
    const timeLimitMatch = infoText.match(/(\d+)\s*second/i);
    const memLimitMatch = infoText.match(/(\d+)\s*MB/i);
    
    const timeLimit = timeLimitMatch ? parseInt(timeLimitMatch[1]) * 1000 : 2000;
    const memoryLimit = memLimitMatch ? parseInt(memLimitMatch[1]) : 256;

    return { description, timeLimit, memoryLimit };
  } catch (err) {
    console.warn(`  ⚠  Could not fetch problem page for cpid=${cpid}: ${err.message}`);
    return {
      description: `View the original problem at https://usaco.org/index.php?page=viewproblem2&cpid=${cpid}`,
      timeLimit: 2000,
      memoryLimit: 256
    };
  }
}

/**
 * Fetch test data ZIP for a problem
 * USACO hosts zips at: usaco.org/usaco/data/<problem>.zip
 * We discover the zip URL from the problem page's links
 */
async function fetchTestCases(cpid) {
  try {
    const { data: html } = await axios.get(PROBLEM_URL(cpid), {
      headers: { 'User-Agent': 'Mozilla/5.0 (Educational Tool)' },
      timeout: 15000
    });

    const $ = cheerio.load(html);
    
    // Find a link to the test data ZIP
    let zipUrl = null;
    $('a[href*=".zip"]').each((_, el) => {
      const href = $(el).attr('href');
      if (href && href.includes('usaco')) {
        zipUrl = href.startsWith('http') ? href : `${USACO_BASE}/${href.replace(/^\//, '')}`;
      }
    });

    if (!zipUrl) {
      console.warn(`  ⚠  No test data ZIP found for cpid=${cpid}, using sample data`);
      return generateSampleTestCases();
    }

    const { data: zipBuffer } = await axios.get(zipUrl, {
      responseType: 'arraybuffer',
      timeout: 30000,
      headers: { 'User-Agent': 'Mozilla/5.0 (Educational Tool)' }
    });

    const zip = new AdmZip(Buffer.from(zipBuffer));
    const entries = zip.getEntries();

    // Collect all .in/.out pairs
    const inputs = {};
    const outputs = {};

    for (const entry of entries) {
      const name = entry.entryName.split('/').pop(); // get filename
      if (name.endsWith('.in')) {
        const num = name.replace('.in', '');
        inputs[num] = entry.getData().toString('utf-8');
      } else if (name.endsWith('.out')) {
        const num = name.replace('.out', '');
        outputs[num] = entry.getData().toString('utf-8');
      }
    }

    const testCases = [];
    for (const num of Object.keys(inputs)) {
      if (outputs[num]) {
        testCases.push({
          input: inputs[num].trim(),
          output: outputs[num].trim(),
          // First 2 test cases are visible, rest are hidden
          isHidden: parseInt(num) > 2
        });
      }
    }

    if (testCases.length === 0) {
      return generateSampleTestCases();
    }

    // Limit to 10 test cases per problem for storage efficiency
    return testCases.slice(0, 10);

  } catch (err) {
    console.warn(`  ⚠  Could not fetch test cases for cpid=${cpid}: ${err.message}`);
    return generateSampleTestCases();
  }
}

/**
 * Fallback sample test cases when download fails
 */
function generateSampleTestCases() {
  return [
    { input: '3\n1 2 3', output: '6', isHidden: false },
    { input: '5\n1 1 1 1 1', output: '5', isHidden: true }
  ];
}

/**
 * Map division to our difficulty enum
 */
function mapDifficulty(division, rawDifficulty) {
  if (division === 'Bronze') {
    if (rawDifficulty === 'Easy') return 'Easy';
    if (rawDifficulty === 'Hard') return 'Hard';
    return 'Medium';
  }
  // Silver problems are always Medium or Hard
  return rawDifficulty === 'Hard' ? 'Hard' : 'Medium';
}

async function main() {
  console.log('🐄 USACO Problem Scraper Starting...\n');

  // Connect to MongoDB
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/interviewPrep';
  console.log(`📦 Connecting to MongoDB...`);
  await mongoose.connect(uri);
  console.log('✅ MongoDB Connected\n');

  const allProblems = [
    ...BRONZE_PROBLEMS.map(p => ({ ...p, division: 'Bronze' })),
    ...SILVER_PROBLEMS.map(p => ({ ...p, division: 'Silver' }))
  ];

  let seeded = 0;
  let skipped = 0;

  for (const prob of allProblems) {
    const { cpid, title, contest, difficulty, division } = prob;

    // Skip if already in DB
    const existing = await Problem.findOne({ usacoCpid: cpid });
    if (existing) {
      console.log(`  ⏩ Skipping "${title}" (cpid=${cpid}) — already in DB`);
      skipped++;
      continue;
    }

    console.log(`  📥 Importing [${division}] "${title}" (cpid=${cpid})...`);

    const { description, timeLimit, memoryLimit } = await fetchProblemPage(cpid);
    await sleep(800); // Polite pause

    const testCases = await fetchTestCases(cpid);
    await sleep(800); // Polite pause

    const newProblem = new Problem({
      title,
      description,
      difficulty: mapDifficulty(division, difficulty),
      source: 'usaco',
      usacoCpid: cpid,
      division,
      contest,
      timeLimit,
      memoryLimit,
      languages: ['java', 'python', 'cpp'],
      testCases,
      company: []
    });

    await newProblem.save();
    seeded++;
    console.log(`  ✅ Saved "${title}" with ${testCases.length} test case(s)\n`);
  }

  console.log(`\n🎉 Done! Seeded: ${seeded} | Skipped (already existed): ${skipped}`);
  await mongoose.disconnect();
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Fatal scraper error:', err);
  process.exit(1);
});
