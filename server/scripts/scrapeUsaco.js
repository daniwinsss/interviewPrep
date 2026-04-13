/**
 * USACO Problem Scraper & Seeder
 *
 * Usage: node server/scripts/scrapeUsaco.js
 *
 * This script:
 * 1. Fetches problem statement HTML from usaco.org for each curated cpid
 * 2. Downloads + unzips the test data when available
 * 3. Seeds valid problems into MongoDB
 */

import 'dotenv/config';
import axios from 'axios';
import * as cheerio from 'cheerio';
import AdmZip from 'adm-zip';
import mongoose from 'mongoose';
import Problem from '../src/models/Problem.js';
import { BRONZE_PROBLEMS, SILVER_PROBLEMS, GOLD_PROBLEMS } from './usacoProblemList.js';

const USACO_BASE = 'https://usaco.org';
const PROBLEM_URL = (cpid) => `${USACO_BASE}/index.php?page=viewproblem2&cpid=${cpid}`;
const PUBLIC_SAMPLE_LIMIT = 3;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function normalizeHtml(html = '') {
  return html
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripTags(html = '') {
  return normalizeHtml(cheerio.load(`<div>${html}</div>`)('div').text());
}

function isFallbackDescription(description = '') {
  return !description || /See problem at usaco\.org/i.test(description);
}

function hasMeaningfulDescription(description = '') {
  if (isFallbackDescription(description)) return false;
  return stripTags(description).length >= 120;
}

function hasUsableTestCases(testCases = []) {
  return Array.isArray(testCases) && testCases.some(tc => tc?.input?.trim() && tc?.output?.trim());
}

function isPlaceholderProblem(problem) {
  return (
    !problem?.description ||
    problem.description.includes('usaco.org') ||
    stripTags(problem.description).length < 120 ||
    problem.testCases?.some(tc => tc?.input === '3\n1 2 3' && tc?.output === '6')
  );
}

function extractSamples(html) {
  if (!html) return [];
  const $ = cheerio.load(html);

  const sampleInputs = $('h4')
    .filter((_, el) => /sample input/i.test($(el).text()))
    .map((_, el) => $(el).nextAll('pre').first().text().trim())
    .get()
    .filter(Boolean);

  const sampleOutputs = $('h4')
    .filter((_, el) => /sample output/i.test($(el).text()))
    .map((_, el) => $(el).nextAll('pre').first().text().trim())
    .get()
    .filter(Boolean);

  if (sampleInputs.length > 0 && sampleOutputs.length > 0) {
    return [{
      input: sampleInputs[0],
      output: sampleOutputs[0],
      isHidden: false
    }];
  }

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

function extractDescriptionFromPage(html) {
  const $ = cheerio.load(html);
  const selectors = ['.problem-text', '.problem-statement', '.panel.prob', '.prob-text', 'div[role="main"]'];

  for (const selector of selectors) {
    const candidate = $(selector).first().html()?.trim();
    if (hasMeaningfulDescription(candidate)) {
      return candidate;
    }
  }

  const bodyHtml = $('body').html()?.trim();
  const bodyText = stripTags(bodyHtml || '');
  if (/sample input|sample output|input format|output format/i.test(bodyText) && bodyText.length >= 120) {
    return bodyHtml;
  }

  return '';
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
      const description = extractDescriptionFromPage(html);

      if (!hasMeaningfulDescription(description)) {
        throw new Error(`Incomplete page content for cpid=${cpid}`);
      }

      const samples = extractSamples(description);
      const infoText = $('.prob-info').text() || '';
      const timeLimitMatch = infoText.match(/(\d+)\s*second/i);
      const memLimitMatch = infoText.match(/(\d+)\s*MB/i);

      const timeLimit = timeLimitMatch ? parseInt(timeLimitMatch[1], 10) * 1000 : 2000;
      const memoryLimit = memLimitMatch ? parseInt(memLimitMatch[1], 10) : 256;

      return { description, timeLimit, memoryLimit, samples };
    } catch (err) {
      console.warn(`  WARN  [Attempt ${i + 1}/${retries}] Failed to fetch cpid=${cpid}: ${err.message}`);
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

async function fetchTestCases(cpid, extractedSamples = []) {
  try {
    const { data: html } = await axios.get(PROBLEM_URL(cpid), {
      headers: { 'User-Agent': 'Mozilla/5.0 (Educational Tool)' },
      timeout: 15000
    });

    const $ = cheerio.load(html);
    let zipUrl = null;

    $('a[href*=".zip"]').each((_, el) => {
      const href = $(el).attr('href');
      if (href && href.includes('usaco')) {
        zipUrl = href.startsWith('http') ? href : `${USACO_BASE}/${href.replace(/^\//, '')}`;
      }
    });

    if (!zipUrl) {
      if (extractedSamples.length > 0) {
        console.log(`  INFO  Using extracted samples for cpid=${cpid} (no ZIP found)`);
        return extractedSamples;
      }
      console.warn(`  WARN  No test data ZIP found for cpid=${cpid}, and no samples were extracted`);
      return [];
    }

    const { data: zipBuffer } = await axios.get(zipUrl, {
      responseType: 'arraybuffer',
      timeout: 30000,
      headers: { 'User-Agent': 'Mozilla/5.0 (Educational Tool)' }
    });

    const zip = new AdmZip(Buffer.from(zipBuffer));
    const inputs = {};
    const outputs = {};

    for (const entry of zip.getEntries()) {
      const name = entry.entryName.split('/').pop();
      if (name.endsWith('.in')) {
        inputs[name.replace('.in', '')] = entry.getData().toString('utf-8');
      } else if (name.endsWith('.out')) {
        outputs[name.replace('.out', '')] = entry.getData().toString('utf-8');
      }
    }

    const testCases = [];
    for (const num of Object.keys(inputs)) {
      if (outputs[num]) {
        testCases.push({
          input: inputs[num].trim(),
          output: outputs[num].trim(),
          isHidden: parseInt(num, 10) > PUBLIC_SAMPLE_LIMIT
        });
      }
    }

    if (testCases.length === 0) {
      return extractedSamples.length > 0 ? extractedSamples : [];
    }

    return testCases;
  } catch (err) {
    console.warn(`  WARN  Could not fetch test cases for cpid=${cpid}: ${err.message}`);
    return extractedSamples.length > 0 ? extractedSamples : [];
  }
}

function mapDifficulty(division, rawDifficulty) {
  if (division === 'Bronze') {
    if (rawDifficulty === 'Easy') return 'Easy';
    if (rawDifficulty === 'Hard') return 'Hard';
    return 'Medium';
  }
  if (division === 'Silver') {
    return rawDifficulty === 'Hard' ? 'Hard' : 'Medium';
  }
  return rawDifficulty === 'Hard' ? 'Hard' : 'Medium';
}

async function main() {
  console.log('USACO Problem Scraper Starting...\n');

  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/interviewPrep';
  console.log('Connecting to MongoDB...');
  await mongoose.connect(uri);
  console.log('MongoDB Connected\n');

  const allProblems = [
    ...BRONZE_PROBLEMS.map((p) => ({ ...p, division: 'Bronze' })),
    ...SILVER_PROBLEMS.map((p) => ({ ...p, division: 'Silver' })),
    ...GOLD_PROBLEMS.map((p) => ({ ...p, division: 'Gold' }))
  ];

  let seeded = 0;
  let skipped = 0;
  let failed = 0;
  const failedProblems = [];

  for (const prob of allProblems) {
    const { cpid, title, contest, difficulty, division, topic } = prob;
    const existing = await Problem.findOne({ usacoCpid: cpid });

    if (existing) {
      const needsTopicUpdate = existing.topic !== topic;
      if (!isPlaceholderProblem(existing) && !needsTopicUpdate) {
        console.log(`  SKIP  "${title}" (cpid=${cpid}) is already up to date`);
        skipped++;
        continue;
      }
      console.log(`  REPAIR  "${title}" (cpid=${cpid}) needs refresh`);
    }

    console.log(`  FETCH  [${division}] "${title}" (cpid=${cpid})`);

    const { description, timeLimit, memoryLimit, samples } = await fetchProblemPage(cpid);
    await sleep(1500);

    const testCases = await fetchTestCases(cpid, samples);
    await sleep(1500);

    let invalidReason = null;
    if (!hasMeaningfulDescription(description)) invalidReason = 'missing or fallback description';
    else if (!hasUsableTestCases(testCases)) invalidReason = 'missing usable test cases';

    if (invalidReason) {
      console.warn(`  FAIL  "${title}" (cpid=${cpid}) skipped: ${invalidReason}\n`);
      failed++;
      failedProblems.push({ cpid, title, reason: invalidReason });
      continue;
    }

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
      console.log(`  OK  Updated "${title}"\n`);
      seeded++;
      continue;
    }

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
    console.log(`  OK  Saved "${title}" with ${testCases.length} test case(s)\n`);
  }

  console.log(`\nDone! Seeded: ${seeded} | Skipped: ${skipped} | Failed validation: ${failed}`);
  if (failedProblems.length > 0) {
    console.log('Failed problems:');
    for (const prob of failedProblems) {
      console.log(`  - ${prob.title} (cpid=${prob.cpid}): ${prob.reason}`);
    }
  }

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error('Fatal scraper error:', err);
  process.exit(1);
});
