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
import { BRONZE_PROBLEMS, SILVER_PROBLEMS, GOLD_PROBLEMS } from './usacoProblemList.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const USACO_BASE = 'https://usaco.org';
const PROBLEM_URL = (cpid) => `${USACO_BASE}/index.php?page=viewproblem2&cpid=${cpid}`;

// Polite delay between requests to avoid hammering USACO servers
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Parse the problem HTML page to extract:
 * - title, description, time/memory limits
 */
/**
 * Extract sample test cases from the problem HTML
 */
function extractSamples(html) {
  if (!html) return [];
  const $ = cheerio.load(html);
  
  // Clean up HTML tags for text matching
  const text = $('body').text();
  
  // Common USACO patterns: "SAMPLE INPUT:" and "SAMPLE OUTPUT:"
  const inputRegex = /SAMPLE INPUT\s*:?\s*([^]*?)(?=SAMPLE OUTPUT|SCORING|PROBLEM NAME|INPUT FORMAT|$)/i;
  const outputRegex = /SAMPLE OUTPUT\s*:?\s*([^]*?)(?=SAMPLE INPUT|SCORING|PROBLEM NAME|OUTPUT FORMAT|$)/i;
  
  const inputMatch = text.match(inputRegex);
  const outputMatch = text.match(outputRegex);
  
  if (inputMatch && outputMatch) {
    return [{
      input: inputMatch[1].trim(),
      output: outputMatch[1].trim(),
      isHidden: false
    }];
  }
  
  // Try <pre> tags as fallback
  const samples = [];
  $('pre').each((_, el) => {
    const content = $(el).text().trim();
    if (content && content.length > 0 && content.length < 2000) {
      samples.push(content);
    }
  });
  
  if (samples.length >= 2) {
    return [{
      input: samples[0],
      output: samples[1],
      isHidden: false
    }];
  }
  
  return [];
}

async function fetchProblemPage(cpid, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const { data: html } = await axios.get(PROBLEM_URL(cpid), {
        headers: { 
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'http://www.usaco.org/index.php?page=problems',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9'
        },
        timeout: 25000
      });

      const $ = cheerio.load(html);
      
      const bodyEl = $('.problem-text');
      const description = bodyEl.html()?.trim();
      
      // Some pages might use different structure or be empty if redirected
      if (!description || description.length < 100) {
        // Check if maybe it's under a different selector?
        const fallback = $('.problem-statement').html()?.trim();
        if (fallback && fallback.length > 100) {
          return { description: fallback, samples: extractSamples(fallback), timeLimit: 2000, memoryLimit: 256 };
        }
        throw new Error(`Incomplete page content (length: ${description?.length || 0})`);
      }

      const samples = extractSamples(bodyEl.html());
      
      const infoText = $('.prob-info').text() || '';
      const timeLimitMatch = infoText.match(/(\d+)\s*second/i);
      const memLimitMatch = infoText.match(/(\d+)\s*MB/i);
      
      const timeLimit = timeLimitMatch ? parseInt(timeLimitMatch[1]) * 1000 : 2000;
      const memoryLimit = memLimitMatch ? parseInt(memLimitMatch[1]) : 256;

      return { description, timeLimit, memoryLimit, samples };
    } catch (err) {
      console.warn(`  ⚠  [Attempt ${i+1}/${retries}] Failed to fetch cpid=${cpid}: ${err.message}`);
      if (i === retries - 1) {
        return {
          description: `See problem at usaco.org (Direct: http://www.usaco.org/index.php?page=viewproblem2&cpid=${cpid})`,
          timeLimit: 2000,
          memoryLimit: 256,
          samples: []
        };
      }
      await sleep(3000); 
    }
  }
}

/**
 * Fetch test data ZIP for a problem
 * USACO hosts zips at: usaco.org/usaco/data/<problem>.zip
 * We discover the zip URL from the problem page's links
 */
/**
 * Fetch test cases for a problem
 */
async function fetchTestCases(cpid, extractedSamples = []) {
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
      if (extractedSamples.length > 0) {
        console.log(`  ℹ  Using extracted samples for cpid=${cpid} (no ZIP found)`);
        return extractedSamples;
      }
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
      return extractedSamples.length > 0 ? extractedSamples : generateSampleTestCases();
    }

    // Limit to 10 test cases per problem for storage efficiency
    return testCases.slice(0, 10);

  } catch (err) {
    console.warn(`  ⚠  Could not fetch test cases for cpid=${cpid}: ${err.message}`);
    return extractedSamples.length > 0 ? extractedSamples : generateSampleTestCases();
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
  if (division === 'Silver') {
    // Silver problems are always Medium or Hard
    return rawDifficulty === 'Hard' ? 'Hard' : 'Medium';
  }
  // Gold problems are always Hard or Medium
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
    ...SILVER_PROBLEMS.map(p => ({ ...p, division: 'Silver' })),
    ...GOLD_PROBLEMS.map(p => ({ ...p, division: 'Gold' }))
  ];

  let seeded = 0;
  let skipped = 0;

  for (const prob of allProblems) {
    const { cpid, title, contest, difficulty, division, topic } = prob;

    // Skip if already in DB
    const existing = await Problem.findOne({ usacoCpid: cpid });
    if (existing) {
      const isPlaceholder = existing.testCases[0]?.input === '3\n1 2 3';
      const isBroken = !existing.description || existing.description.includes('usaco.org') || existing.description.length < 100;
      const needsTopicUpdate = existing.topic !== topic;
      
      if (isPlaceholder || isBroken || needsTopicUpdate) {
        console.log(`  📝 Updating "${title}" (cpid=${cpid}) - needs repair (broken description or placeholders)`);
      } else {
        console.log(`  ⏩ Skipping "${title}" (cpid=${cpid}) - up to date`);
        skipped++;
        continue;
      }
    }

    console.log(`  📥 Processing [${division}] "${title}" (cpid=${cpid})...`);

    const { description, timeLimit, memoryLimit, samples } = await fetchProblemPage(cpid);
    await sleep(1500); // Politer pause

    const testCases = await fetchTestCases(cpid, samples);
    await sleep(1500); // Politer pause

    if (existing) {
      existing.title = title;
      existing.description = description;
      existing.difficulty = mapDifficulty(division, difficulty);
      existing.topic = topic;
      existing.contest = contest;
      existing.timeLimit = timeLimit;
      existing.memoryLimit = memoryLimit;
      existing.testCases = testCases;
      await existing.save();
      console.log(`  ✅ Updated "${title}" in database\n`);
      seeded++;
    } else {
      const newProblem = new Problem({
        title,
        description,
        difficulty: mapDifficulty(division, difficulty),
        source: 'usaco',
        usacoCpid: cpid,
        division,
        topic,
        contest,
        timeLimit,
        memoryLimit,
        languages: ['java', 'python', 'cpp'],
        testCases,
        company: []
      });
      await newProblem.save();
      seeded++;
      console.log(`  ✅ Saved NEW problem "${title}" with ${testCases.length} test case(s)\n`);
    }
  }

  console.log(`\n🎉 Done! Seeded: ${seeded} | Skipped (already existed): ${skipped}`);
  await mongoose.disconnect();
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Fatal scraper error:', err);
  process.exit(1);
});
