import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import fs from 'fs';
import crypto from 'crypto';
import axios from 'axios';
import InterviewSession from '../models/InterviewSession.js';
import InterviewMessage from '../models/InterviewMessage.js';
import InterviewEvaluation from '../models/InterviewEvaluation.js';
import InterviewReport from '../models/InterviewReport.js';
import InterviewQuestion from '../models/InterviewQuestion.js';

dotenv.config();

const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  : null;

const ROUND_PHASES = {
  dsa: ['clarification', 'dsa_link', 'code', 'dry_run', 'complexity'],
  system_design: ['requirements', 'estimation', 'hld', 'deep_dive', 'tradeoffs'],
  behavioural: ['question', 'star_probe', 'ownership_probe', 'result_probe'],
  project: ['overview', 'architecture', 'challenge', 'tradeoffs', 'impact', 'reflection'],
  core_cs: ['fundamentals', 'example', 'edge_cases', 'tradeoffs']
};

const FALLBACK_QUESTIONS = {
  dsa: [
    {
      title: 'Longest Subarray With Sum K',
      content: 'Given an array of integers and a target sum K, find the length of the longest subarray with sum exactly K.',
      constraints: 'N up to 2e5. Values may be negative.',
      examples: 'Input: [1, -1, 5, -2, 3], K = 3\nOutput: 4',
      targetTC: 'O(n)',
      targetSC: 'O(n)',
      phases: ROUND_PHASES.dsa,
      tags: ['prefix-sum', 'hash-map'],
      leetcodeSlug: 'longest-subarray-with-sum-k'
    },
    {
      title: 'Merge Intervals',
      content: 'Given a list of intervals, merge all overlapping intervals and return the condensed list.',
      constraints: 'N up to 1e5 intervals.',
      examples: 'Input: [[1,3],[2,6],[8,10],[15,18]]\nOutput: [[1,6],[8,10],[15,18]]',
      targetTC: 'O(n log n)',
      targetSC: 'O(n)',
      phases: ROUND_PHASES.dsa,
      tags: ['sorting', 'intervals'],
      leetcodeSlug: 'merge-intervals'
    },
    {
      title: 'Number of Islands',
      content: 'Given a 2D grid of 0s and 1s, count the number of connected islands.',
      constraints: 'Grid size up to 1000 x 1000.',
      examples: 'Input: [[1,1,0],[0,1,0],[1,0,1]]\nOutput: 3',
      targetTC: 'O(rows * cols)',
      targetSC: 'O(rows * cols) worst-case recursion/queue',
      phases: ROUND_PHASES.dsa,
      tags: ['graphs', 'bfs', 'dfs'],
      leetcodeSlug: 'number-of-islands'
    },
    {
      title: 'Two Sum',
      content: 'Given an array of integers and a target, return indices of the two numbers that add up to the target.',
      constraints: 'N up to 10^4. Each input would have exactly one solution.',
      examples: 'Input: [2,7,11,15], target = 9\nOutput: [0,1]',
      targetTC: 'O(n)',
      targetSC: 'O(n)',
      phases: ROUND_PHASES.dsa,
      tags: ['hash-map', 'arrays'],
      leetcodeSlug: 'two-sum'
    },
    {
      title: 'Valid Parentheses',
      content: 'Given a string containing just the characters "(", ")", "{", "}", "[" and "]", determine if the input string is valid.',
      constraints: 'N up to 10^4.',
      examples: 'Input: "()[]{}"\nOutput: true',
      targetTC: 'O(n)',
      targetSC: 'O(n)',
      phases: ROUND_PHASES.dsa,
      tags: ['stack', 'strings'],
      leetcodeSlug: 'valid-parentheses'
    }
  ],
  system_design: [
    {
      title: 'Design a URL Shortener',
      content: 'Design a URL shortener similar to bit.ly.',
      scaleHints: '100M redirects/day, high read traffic, low-latency redirects, custom aliases optional.',
      phases: ROUND_PHASES.system_design,
      tags: ['web', 'caching', 'database']
    },
    {
      title: 'Design a Rate Limiter',
      content: 'Design a distributed rate limiter for a public API gateway.',
      scaleHints: 'Millions of requests/minute, multi-region clients, different per-customer quotas.',
      phases: ROUND_PHASES.system_design,
      tags: ['distributed-systems', 'quotas']
    },
    {
      title: 'Design a Chat Service',
      content: 'Design a real-time chat system for one-to-one and group messaging.',
      scaleHints: '10M DAU, persistent history, online presence, mobile clients, delivery acknowledgements.',
      phases: ROUND_PHASES.system_design,
      tags: ['messaging', 'realtime']
    }
  ],
  behavioural: [
    {
      title: 'Ownership Under Pressure',
      content: 'Tell me about a time you took ownership of a problem that was not clearly assigned to you.',
      lpPrinciples: ['Ownership', 'Bias for Action'],
      phases: ROUND_PHASES.behavioural,
      tags: ['ownership']
    },
    {
      title: 'Conflict Resolution',
      content: 'Tell me about a time you disagreed with a teammate and how you handled it.',
      lpPrinciples: ['Earn Trust', 'Have Backbone; Disagree and Commit'],
      phases: ROUND_PHASES.behavioural,
      tags: ['communication']
    },
    {
      title: 'Learning Fast',
      content: 'Describe a time you had to learn something quickly to deliver results.',
      lpPrinciples: ['Learn and Be Curious'],
      phases: ROUND_PHASES.behavioural,
      tags: ['growth']
    }
  ],
  project: [
    {
      title: 'Project Deep Dive',
      content: 'Pick one project you are proud of and walk me through it end to end.',
      phases: ROUND_PHASES.project,
      tags: ['project']
    },
    {
      title: 'Architecture Ownership',
      content: 'Tell me about a project where you made or influenced an important technical design decision.',
      phases: ROUND_PHASES.project,
      tags: ['architecture']
    },
    {
      title: 'Debugging and Recovery',
      content: 'Describe a project where something failed in production or late in development and how you handled it.',
      phases: ROUND_PHASES.project,
      tags: ['debugging']
    }
  ],
  core_cs: [
    {
      title: 'Operating Systems Fundamentals',
      content: 'Explain the difference between processes and threads, and when threads can become problematic.',
      phases: ROUND_PHASES.core_cs,
      tags: ['os']
    },
    {
      title: 'Database Indexing',
      content: 'Explain what a database index is, what problem it solves, and what tradeoffs it introduces.',
      phases: ROUND_PHASES.core_cs,
      tags: ['dbms']
    },
    {
      title: 'Networking Basics',
      content: 'How would you explain the difference between TCP and UDP in a practical engineering context?',
      phases: ROUND_PHASES.core_cs,
      tags: ['networking']
    }
  ]
};

function randomItem(items) {
  if (!items.length) return null;
  return items[Math.floor(Math.random() * items.length)];
}

function normalizeText(value = '') {
  return String(value).trim();
}

function getRoundLabel(roundType) {
  return {
    dsa: 'DSA',
    system_design: 'System Design',
    behavioural: 'Behavioural',
    project: 'Project',
    core_cs: 'Core CS'
  }[roundType] || roundType;
}

function questionSummary(question = {}) {
  return question.title || question.content || 'Interview question';
}

function getLeetCodeLink(slug) {
  if (!slug) return null;
  return `https://leetcode.com/problems/${slug}/`;
}

function parseGithubRepoUrl(repoUrl = '') {
  const trimmed = String(repoUrl).trim();
  const match = trimmed.match(/^https?:\/\/github\.com\/([^/\s]+)\/([^/\s#?]+?)(?:\.git)?(?:[/?#].*)?$/i);
  if (!match) return null;
  return {
    owner: match[1],
    repo: match[2]
  };
}

function safeJsonParse(text) {
  const cleaned = String(text || '').replace(/```json/gi, '').replace(/```/g, '').trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  const payload = match ? match[0] : cleaned;
  return JSON.parse(payload);
}

function buildSystemPrompt(config) {
  return `You are a senior SDE interviewer at ${config.company || 'generic'}.
Round: ${config.roundType} | Difficulty: ${config.difficulty} | Duration: ${config.durationMin} min
Candidate: ${config.userName || 'Candidate'}

Rules:
- Ask ONE question at a time. Wait for the candidate to finish.
- Never reveal answers. If they're stuck, ask a leading question.
- After each answer, evaluate internally then decide:
  (a) ask a follow-up to go deeper
  (b) move to the next sub-phase
  (c) end the round if time is up or all phases are complete
- Always stay in character. Address the candidate by name.
- End your turns with either a question or a clear transition signal.

Output format (always valid JSON):
{
  "message": "<your spoken response to candidate>",
  "phase": "<current phase name>",
  "action": "ask_followup" | "next_phase" | "end_round",
  "internalNote": "<brief note for evaluator, not shown to user>"
}`;
}

function buildRoundPrompt(session) {
  const question = session.questionSnapshot || {};
  const round = session.config.roundType;
  if (round === 'dsa') {
    return `Problem: ${question.title}
LeetCode Link: ${getLeetCodeLink(question.leetcodeSlug) || 'N/A'}
Constraints: ${question.constraints || 'N/A'}
Sample I/O: ${question.examples || 'N/A'}
Expected complexity: ${question.targetTC || 'N/A'} / ${question.targetSC || 'N/A'}

Phase order:
1. clarification - Ask candidate about edge cases and clarifying questions
2. dsa_link - Send the LeetCode link and problem description
3. solve - Give candidate time to solve
4. screenshot - Ask for screenshot showing test case results
5. complexity - Ask for time and space complexity analysis

During the coding phase, monitor the candidate's code and ask targeted follow-up questions.
Never skip phases. Do not show the solution even if asked.`;
  }
  if (round === 'system_design') {
    return `Question: ${question.content}
Scale hints: ${question.scaleHints || 'N/A'}

Phases (enforce strictly):
1. requirements
2. estimation
3. hld
4. deep_dive
5. tradeoffs

Push back on hand-wavy answers and ask for specifics.`;
  }
  if (round === 'behavioural') {
    return `Company: ${session.config.company}
LP focus: ${(question.lpPrinciples || []).join(', ') || 'Ownership, Communication'}

For each question:
1. Ask the LP question cold.
2. If Situation, Task, Action, or Result is missing, probe for it.
3. Do not accept "we did X" without clarifying the candidate's individual contribution.`;
  }
  if (round === 'project') {
    return `Focus area: project deep dive.
Question: ${question.content}

Phases:
1. overview
2. architecture
3. challenge
4. tradeoffs
5. impact
6. reflection

Keep drilling on ownership and concrete engineering decisions.`;
  }
  return `Focus area: core computer science fundamentals.
Question: ${question.content}

Phases:
1. fundamentals
2. example
3. edge_cases
4. tradeoffs`;
}

function buildMessages(session, history, newUserMsg) {
  const system = `${buildSystemPrompt(session.config)}\n\n${buildRoundPrompt(session)}`;
  const messages = history.map((m) => ({
    role: m.role === 'interviewer' ? 'assistant' : 'user',
    content: m.content
  }));
  return {
    system,
    messages: [...messages, { role: 'user', content: newUserMsg }]
  };
}

function buildEvaluatorMessages(answer, question, phase, roundType) {
  return {
    system: `You are a silent evaluator.
You receive a candidate answer and context. Respond ONLY with JSON.
No preamble. No markdown fences.

Schema:
{
  "scores": {
    "correctness": 0-25,
    "complexity": 0-25,
    "edgeCases": 0-25,
    "communication": 0-25
  },
  "total": 0-100,
  "strengths": ["..."],
  "gaps": ["..."],
  "nextHint": "..." | null
}`,
    messages: [{
      role: 'user',
      content: `Round: ${roundType}\nPhase: ${phase}\nQuestion: ${questionSummary(question)}\nQuestion Details: ${question.content || question.title || ''}\nAnswer: ${answer}`
    }]
  };
}

function getPhasePrompt(session, phase, evaluation = null) {
  const q = session.questionSnapshot || {};
  const hint = evaluation?.nextHint ? ` If needed, you can use this leading hint: ${evaluation.nextHint}` : '';

  const prompts = {
    dsa: {
      clarification: `Let's start with clarification. For "${q.title}", what edge cases or clarifying questions would you ask before solving it?`,
      dsa_link: `Here is your coding problem: ${q.title}\nLeetCode Link: ${getLeetCodeLink(q.leetcodeSlug) || 'N/A'}\n\n${q.content}\n\nConstraints: ${q.constraints || 'N/A'}\nExample: ${q.examples || 'N/A'}\n\nStart coding in the editor. I will monitor your approach live and ask follow-up questions in chat as you work.`,
      code: `Keep coding your solution. Talk me through the data structures and invariants you are relying on while you implement it.`,
      dry_run: `Walk me through a dry run of your current solution on a representative example, including any tricky edge case you care about.`,
      complexity: `What are the final time and space complexities of your solution, and why?`
    },
    system_design: {
      requirements: `Start with requirements. What functional and non-functional requirements would you clarify for ${q.content}?`,
      estimation: `Now walk me through your capacity estimates and the assumptions behind them.`,
      hld: `Give me the high-level design now. What are the major components and how do they interact?`,
      deep_dive: `Let's deep dive into one or two critical components. Be specific about storage, caching, or asynchronous processing choices.`,
      tradeoffs: `What are the key tradeoffs in your design? Why did you choose this approach over alternatives?`
    },
    behavioural: {
      question: q.content,
      star_probe: `I want to tighten the STAR structure. Can you give me more concrete context, responsibility, and the actions you personally took?${hint}`,
      ownership_probe: `Let's focus on your individual contribution. What specifically did you do versus the rest of the team?${hint}`,
      result_probe: `What was the result, and can you quantify the impact or what changed afterward?${hint}`
    },
    project: {
      overview: q.content,
      architecture: `Let's go deeper on the architecture. What were the major components, and how did you decide on that design?`,
      challenge: `What was the hardest technical challenge in the project, and how did you debug or resolve it?`,
      tradeoffs: `What tradeoffs did you make in the project, and what did you consciously defer or simplify?`,
      impact: `What impact did the project have, and how did you validate that it worked well?`,
      reflection: `If you had more time, what would you improve next, and what did this project change about how you build software?`
    },
    core_cs: {
      fundamentals: q.content,
      example: `Can you give me a practical engineering example where this concept matters?`,
      edge_cases: `What edge cases, failure modes, or caveats should an engineer keep in mind here?`,
      tradeoffs: `What tradeoffs or alternative approaches are worth comparing in this area?`
    }
  };

  return prompts[session.config.roundType]?.[phase] || q.content || 'Can you elaborate on your approach?';
}

function getNextPhase(roundType, currentPhase) {
  const phases = ROUND_PHASES[roundType] || [];
  const currentIdx = phases.indexOf(currentPhase);
  if (currentIdx === -1) return phases[0] || null;
  return phases[currentIdx + 1] || null;
}

function getLastInterviewerMessage(history = []) {
  return [...history].reverse().find((msg) => msg.role === 'interviewer') || null;
}

function getLastUserMessage(history = []) {
  return [...history].reverse().find((msg) => msg.role === 'user') || null;
}

function normalizeConductorResponse(response, fallback) {
  return {
    message: normalizeText(response?.message || fallback.message),
    phase: normalizeText(response?.phase || fallback.phase),
    action: ['ask_followup', 'next_phase', 'end_round'].includes(response?.action)
      ? response.action
      : fallback.action,
    internalNote: normalizeText(response?.internalNote || fallback.internalNote)
  };
}

function fallbackEvaluation(answer, phase, roundType) {
  const text = normalizeText(answer);
  const wordCount = text ? text.split(/\s+/).length : 0;
  const mentionsComplexity = /O\(|complexity|time|space/i.test(text);
  const mentionsEdgeCases = /edge|corner|null|empty|duplicate|overflow|boundary/i.test(text);
  const mentionsCommunication = /because|therefore|first|then|finally|tradeoff|for example/i.test(text);

  let correctness = Math.min(25, 8 + Math.floor(wordCount / 8));
  let complexity = mentionsComplexity ? 18 : 10;
  let edgeCases = mentionsEdgeCases ? 18 : 8;
  let communication = mentionsCommunication ? 18 : 10;

  if (roundType === 'behavioural' || roundType === 'project') {
    correctness = Math.min(25, 10 + Math.floor(wordCount / 7));
    complexity = /tradeoff|decision|architecture|metric|impact|result/i.test(text) ? 18 : 10;
    edgeCases = /risk|problem|challenge|conflict|constraint/i.test(text) ? 18 : 10;
    communication = /I\b|my role|specifically|for example|result/i.test(text) ? 20 : 12;
  }

  if (phase === 'complexity' || phase === 'tradeoffs') {
    complexity += 4;
  }

  correctness = Math.min(25, correctness);
  complexity = Math.min(25, complexity);
  edgeCases = Math.min(25, edgeCases);
  communication = Math.min(25, communication);

  const total = correctness + complexity + edgeCases + communication;
  const strengths = [];
  const gaps = [];

  if (correctness >= 18) strengths.push('Clear core understanding of the prompt.');
  else gaps.push('Need a more precise or better grounded answer.');

  if (complexity >= 18) strengths.push('Discussed tradeoffs or complexity well.');
  else gaps.push('Tradeoffs or complexity reasoning is still shallow.');

  if (edgeCases >= 18) strengths.push('Thought about edge cases and constraints.');
  else gaps.push('Could discuss more edge cases or constraints.');

  if (communication >= 18) strengths.push('Structured and easy to follow explanation.');
  else gaps.push('Communication could be more structured and concrete.');

  return {
    scores: { correctness, complexity, edgeCases, communication },
    total,
    strengths,
    gaps,
    nextHint: total < 65 ? 'Break your answer into assumptions, approach, tradeoffs, and edge cases.' : null
  };
}

function fallbackConductor(session, history, evaluation) {
  const phase = session.currentPhase;
  const lastInterviewer = getLastInterviewerMessage(history);
  const alreadyFollowedUp = lastInterviewer?.phase === phase && lastInterviewer?.action === 'ask_followup';
  const nextPhase = getNextPhase(session.config.roundType, phase);
  const questionPrompt = getPhasePrompt(session, phase, evaluation);

  if (evaluation.total < 65 && !alreadyFollowedUp) {
    return {
      message: `${evaluation.strengths[0] || 'Thanks.'} I want to go a bit deeper here. ${evaluation.nextHint || 'Can you be more specific and structured in your reasoning?'} ${questionPrompt}`,
      phase,
      action: 'ask_followup',
      internalNote: 'Candidate needs one more pass in the same phase before advancing.'
    };
  }

  if (!nextPhase) {
    return {
      message: `${evaluation.strengths[0] || 'Thanks.'} We’ve covered the planned phases for this round. We’ll stop here.`,
      phase,
      action: 'end_round',
      internalNote: 'All phases complete.'
    };
  }

  return {
    message: `${evaluation.strengths[0] || 'Thanks.'} Let's move to the next phase. ${getPhasePrompt(session, nextPhase, evaluation)}`,
    phase: nextPhase,
    action: nextPhase === phase ? 'ask_followup' : 'next_phase',
    internalNote: `Advance to ${nextPhase}.`
  };
}

async function runConductorModel(session, history, answer, evaluation) {
  if (!ai) return null;

  const { system, messages } = buildMessages(session, history, answer);
  const reminder = `\nEvaluator summary for internal use only: ${JSON.stringify(evaluation)}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `${system}\n\nConversation:\n${JSON.stringify(messages)}${reminder}`
    });
    return safeJsonParse(response.text);
  } catch (error) {
    console.error('Conductor LLM Error:', error);
    return null;
  }
}

async function runEvaluatorModel(session, answer, phase) {
  if (!ai) return null;
  const payload = buildEvaluatorMessages(answer, session.questionSnapshot || {}, phase, session.config.roundType);

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `${payload.system}\n\n${payload.messages[0].content}`
    });
    return safeJsonParse(response.text);
  } catch (error) {
    console.error('Evaluator LLM Error:', error);
    return null;
  }
}

async function analyzeScreenshot(imagePath) {
  if (!ai) {
    return {
      passed: 'Unknown (AI not configured)',
      total: 'Unknown',
      feedback: 'Unable to analyze screenshot without AI. Please describe your test results.'
    };
  }

  try {
    const imageData = await fs.promises.readFile(imagePath);
    const base64Image = imageData.toString('base64');
    
    const prompt = `You are analyzing a screenshot of a coding problem submission result (likely from LeetCode or a similar platform).

Look at this image and identify:
1. How many test cases passed
2. How many test cases failed (if any)
3. Any other notable information about the submission

Return ONLY valid JSON with this exact schema:
{
  "passed": number or string describing how many passed,
  "total": number or string describing total test cases,
  "feedback": "2-3 sentences of constructive feedback based on what you see",
  "allPassed": true if all test cases passed, false otherwise
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [
        { text: prompt },
        { inlineData: { mimeType: 'image/png', data: base64Image } }
      ]
    });

    const result = safeJsonParse(response.text);
    await fs.promises.unlink(imagePath).catch(() => {});
    
    return {
      passed: result.passed || 'Unknown',
      total: result.total || 'Unknown',
      feedback: result.feedback || 'Screenshot analyzed successfully.',
      allPassed: result.allPassed || false
    };
  } catch (error) {
    console.error('Screenshot Analysis Error:', error);
    if (fs.existsSync(imagePath)) {
      await fs.promises.unlink(imagePath).catch(() => {});
    }
    return {
      passed: 'Unknown',
      total: 'Unknown',
      feedback: 'Could not analyze the screenshot. Please describe your test results manually.',
      allPassed: false
    };
  }
}

function hashCode(code = '') {
  return crypto.createHash('sha1').update(String(code)).digest('hex');
}

function fallbackCodeReview(session, code, language) {
  const normalizedCode = normalizeText(code);
  const lines = normalizedCode ? normalizedCode.split('\n').length : 0;
  const question = session.questionSnapshot || {};
  const mentionsLoop = /\bfor\b|\bwhile\b/.test(normalizedCode);
  const mentionsMap = /unordered_map|map<|HashMap|dict|defaultdict/.test(normalizedCode);
  const mentionsVector = /vector<|list<|ArrayList|deque|queue|stack/.test(normalizedCode);
  const mentionsReturn = /\breturn\b/.test(normalizedCode);

  const observations = [];
  if (lines < 8) observations.push('Your implementation is still very early.');
  else observations.push(`I can see a ${language} solution taking shape with about ${lines} lines of code.`);

  if (mentionsMap) observations.push('You seem to be leaning on a hash-based structure, which is often a good sign for keeping lookups efficient.');
  else if (mentionsLoop) observations.push('I can see iteration logic, but I do not yet see a clear optimization structure.');

  if (!mentionsReturn) {
    observations.push('I do not yet see the final return/output path.');
  }

  let questionText = `What invariant is your implementation maintaining as it processes the input for "${question.title || 'this problem'}"?`;
  if (mentionsMap) {
    questionText = 'What exactly does each entry in your map represent, and when is it updated?';
  } else if (mentionsVector) {
    questionText = 'How does your chosen container help you avoid extra work or repeated scans?';
  } else if (lines > 20) {
    questionText = 'Which part of this implementation dominates the runtime, and is there any nested work you can eliminate?';
  }

  return `${observations.join(' ')} ${questionText}`.trim();
}

async function runCodeReviewModel(session, code, language) {
  if (!ai) return null;

  const question = session.questionSnapshot || {};
  const prompt = `You are a senior coding interviewer conducting a live DSA interview.
Candidate: ${session.config.userName || 'Candidate'}
Language: ${language}
Current phase: ${session.currentPhase}
Problem: ${question.title || 'Coding problem'}
Description: ${question.content || 'N/A'}
Constraints: ${question.constraints || 'N/A'}
Expected complexity: ${question.targetTC || 'N/A'} / ${question.targetSC || 'N/A'}

The candidate is actively coding. Do not reveal the solution. Give 1-2 sentences of live coaching plus exactly one focused follow-up question based on the code you see.
Return JSON only:
{
  "message": "..."
}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `${prompt}\n\nCurrent code:\n\`\`\`${language}\n${code}\n\`\`\``
    });
    const parsed = safeJsonParse(response.text);
    return normalizeText(parsed?.message);
  } catch (error) {
    console.error('Code Review LLM Error:', error);
    return null;
  }
}

function dedupeStrings(values = []) {
  return [...new Set(values.map((v) => normalizeText(v)).filter(Boolean))];
}

function buildStudyPlan(roundType, weaknesses) {
  const fallbackResources = {
    dsa: ['Revise common patterns: sliding window, graphs, prefix sums', 'Practice 3 medium problems focused on edge cases'],
    system_design: ['Practice requirement gathering and estimation separately', 'Review cache, queue, and database tradeoff patterns'],
    behavioural: ['Rehearse STAR stories with quantified outcomes', 'Write down specific personal actions for each story'],
    project: ['Prepare one flagship project with architecture, tradeoffs, and metrics', 'Practice explaining your exact ownership clearly'],
    core_cs: ['Review one CS fundamental area deeply this week', 'Create concise explanations with practical examples']
  };

  const topics = weaknesses.slice(0, 3).map((gap, idx) => ({
    topic: gap,
    priority: idx === 0 ? 'high' : idx === 1 ? 'medium' : 'low',
    resources: fallbackResources[roundType] || ['Review fundamentals and practice concise explanations']
  }));

  return topics.length ? topics : [{
    topic: 'General interview polish',
    priority: 'medium',
    resources: fallbackResources[roundType] || ['Review fundamentals and practice concise explanations']
  }];
}

async function chooseQuestion(config) {
  if (config.roundType === 'project' && config.resumeContext) {
    const resume = config.resumeContext;
    const topProject = Array.isArray(resume.projects) && resume.projects.length > 0 ? resume.projects[0] : null;
    const focusAreas = Array.isArray(resume.questionFocusAreas) ? resume.questionFocusAreas.filter(Boolean) : [];
    const skills = Array.isArray(resume.skills) ? resume.skills.filter(Boolean) : [];
    const highlights = Array.isArray(resume.experienceHighlights) ? resume.experienceHighlights.filter(Boolean) : [];

    const title = topProject?.name || 'Resume-Based Project Deep Dive';
    const summary = normalizeText(resume.candidateSummary || '');
    const projectDesc = normalizeText(topProject?.description || '');
    const projectImpact = normalizeText(topProject?.impact || '');
    const projectTech = Array.isArray(topProject?.tech) ? topProject.tech.filter(Boolean) : [];

    return {
      questionId: null,
      snapshot: {
        title,
        content: `Let's do a deep dive based on your resume. Start with "${title}" and explain your ownership, architecture decisions, tradeoffs, and measurable outcomes.${focusAreas.length ? `\nFocus areas: ${focusAreas.join(', ')}` : ''}`,
        constraints: [
          summary ? `Candidate summary: ${summary}` : '',
          projectDesc ? `Project summary: ${projectDesc}` : '',
          projectImpact ? `Reported impact: ${projectImpact}` : '',
          projectTech.length ? `Technologies: ${projectTech.join(', ')}` : '',
          skills.length ? `Skills from resume: ${skills.join(', ')}` : ''
        ].filter(Boolean).join('\n'),
        examples: highlights.join('\n'),
        phases: ROUND_PHASES.project,
        tags: dedupeStrings(['resume-based', ...focusAreas, ...skills.slice(0, 5)])
      }
    };
  }

  if (config.roundType === 'project' && config.repoContext) {
    return {
      questionId: null,
      snapshot: {
        title: config.repoContext.repoName || 'GitHub Project Deep Dive',
        content: `Let's do a deep dive on your GitHub project "${config.repoContext.repoName}". Start by explaining what the project does, who it is for, and what you personally owned.`,
        constraints: config.repoContext.repoSummary || '',
        examples: config.repoContext.repoHighlights || '',
        phases: ROUND_PHASES.project,
        tags: config.repoContext.repoTopics || [],
        repoUrl: config.repoContext.repoUrl,
        repoName: config.repoContext.repoName,
        repoSummary: config.repoContext.repoSummary,
        repoTopics: config.repoContext.repoTopics || [],
        repoLanguage: config.repoContext.repoLanguage || ''
      }
    };
  }

  const dbQuestion = await InterviewQuestion.aggregate([
    { $match: { round: config.roundType, difficulty: config.difficulty } },
    { $sample: { size: 1 } }
  ]);

  if (dbQuestion.length > 0) {
    const [question] = dbQuestion;
    return {
      questionId: question._id,
      snapshot: {
        title: question.title,
        content: question.content,
        constraints: question.constraints,
        examples: question.examples,
        targetTC: question.solution?.tc || '',
        targetSC: question.solution?.sc || '',
        scaleHints: question.scaleHints || '',
        lpPrinciples: question.lpPrinciples || [],
        phases: question.phases?.length ? question.phases : ROUND_PHASES[config.roundType],
        tags: question.tags || [],
        leetcodeSlug: question.leetcodeSlug || null
      }
    };
  }

  const fallback = randomItem(FALLBACK_QUESTIONS[config.roundType] || []);
  if (!fallback) return { questionId: null, snapshot: null };
  return { questionId: null, snapshot: fallback };
}

async function generateReport(sessionId) {
  const session = await InterviewSession.findById(sessionId).lean();
  if (!session) return null;

  const evaluations = await InterviewEvaluation.find({ sessionId }).lean();
  const overallScore = evaluations.length
    ? Math.round(evaluations.reduce((sum, item) => sum + item.total, 0) / evaluations.length)
    : 0;

  const scoreByPhase = {};
  const strengths = [];
  const weaknesses = [];

  for (const evaluation of evaluations) {
    const message = await InterviewMessage.findById(evaluation.messageId).lean();
    const phase = message?.phase || 'unknown';
    scoreByPhase[phase] = evaluation.total;
    strengths.push(...evaluation.strengths);
    weaknesses.push(...evaluation.gaps);
  }

  const report = await InterviewReport.findOneAndUpdate(
    { sessionId },
    {
      sessionId,
      userId: session.userId,
      overallScore,
      scoreByPhase,
      strengths: dedupeStrings(strengths).slice(0, 6),
      weaknesses: dedupeStrings(weaknesses).slice(0, 6),
      studyPlan: buildStudyPlan(session.config.roundType, dedupeStrings(weaknesses)),
      generatedAt: new Date()
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).lean();

  return report;
}

async function fetchGithubRepoContext(repoUrl) {
  const parsed = parseGithubRepoUrl(repoUrl);
  if (!parsed) {
    throw new Error('Please enter a valid GitHub repository URL');
  }

  const baseHeaders = {
    'User-Agent': 'interview-prep-app',
    Accept: 'application/vnd.github+json'
  };

  const repoResponse = await axios.get(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}`, {
    headers: baseHeaders,
    timeout: 12000
  });

  let readmeText = '';
  try {
    const readmeResponse = await axios.get(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}/readme`, {
      headers: {
        ...baseHeaders,
        Accept: 'application/vnd.github.raw+json'
      },
      timeout: 12000
    });
    readmeText = String(readmeResponse.data || '').trim();
  } catch {
    readmeText = '';
  }

  const repo = repoResponse.data || {};
  const summaryParts = [
    repo.description,
    readmeText ? readmeText.slice(0, 1200) : ''
  ].filter(Boolean);

  return {
    repoUrl,
    repoName: repo.full_name || `${parsed.owner}/${parsed.repo}`,
    repoSummary: summaryParts.join('\n\n').trim(),
    repoTopics: Array.isArray(repo.topics) ? repo.topics : [],
    repoLanguage: repo.language || '',
    repoHighlights: [
      repo.stargazers_count ? `Stars: ${repo.stargazers_count}` : '',
      repo.forks_count ? `Forks: ${repo.forks_count}` : '',
      repo.language ? `Primary language: ${repo.language}` : '',
      Array.isArray(repo.topics) && repo.topics.length ? `Topics: ${repo.topics.join(', ')}` : ''
    ].filter(Boolean).join('\n')
  };
}

async function analyzeResumeWithAi(fileBuffer, mimeType) {
  if (!ai) {
    throw new Error('AI resume analysis is not configured on the server');
  }

  const prompt = `You are parsing a candidate resume for interview personalization.
Return ONLY valid JSON with this exact schema:
{
  "candidateSummary": "2-4 sentence summary of profile",
  "skills": ["skill1", "skill2"],
  "projects": [
    {
      "name": "project name",
      "description": "short description",
      "tech": ["tech1", "tech2"],
      "impact": "measurable impact or outcome if present"
    }
  ],
  "experienceHighlights": ["highlight1", "highlight2"],
  "questionFocusAreas": ["focus area 1", "focus area 2"]
}
If some fields are missing in resume, return best-effort values and keep arrays possibly empty.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      { text: prompt },
      { inlineData: { mimeType, data: fileBuffer.toString('base64') } }
    ]
  });

  const parsed = safeJsonParse(response.text);
  return {
    candidateSummary: normalizeText(parsed?.candidateSummary || ''),
    skills: Array.isArray(parsed?.skills) ? dedupeStrings(parsed.skills).slice(0, 20) : [],
    projects: Array.isArray(parsed?.projects) ? parsed.projects.slice(0, 5).map((item) => ({
      name: normalizeText(item?.name || ''),
      description: normalizeText(item?.description || ''),
      tech: Array.isArray(item?.tech) ? dedupeStrings(item.tech).slice(0, 12) : [],
      impact: normalizeText(item?.impact || '')
    })) : [],
    experienceHighlights: Array.isArray(parsed?.experienceHighlights) ? dedupeStrings(parsed.experienceHighlights).slice(0, 10) : [],
    questionFocusAreas: Array.isArray(parsed?.questionFocusAreas) ? dedupeStrings(parsed.questionFocusAreas).slice(0, 8) : []
  };
}

export const interviewService = {
  async startSession({ userId = 'anonymous', userName = 'Candidate', roundType = 'dsa', difficulty = 'medium', durationMin = 45, company = 'generic', repoUrl = '', resumeContext = null }) {
    let repoContext = null;
    if (roundType === 'project' && String(repoUrl).trim()) {
      repoContext = await fetchGithubRepoContext(repoUrl.trim());
    }

    const normalizedConfig = {
      roundType,
      difficulty,
      durationMin,
      company,
      userName,
      resumeContext: resumeContext || null,
      repoContext
    };

    const selected = await chooseQuestion(normalizedConfig);
    if (!selected.snapshot) {
      throw new Error('No interview questions configured for this round.');
    }

    const phases = selected.snapshot.phases?.length ? selected.snapshot.phases : ROUND_PHASES[roundType];
    const currentPhase = phases[0];
    const openingQuestion = getPhasePrompt({ config: normalizedConfig, questionSnapshot: selected.snapshot }, currentPhase);

    const session = await InterviewSession.create({
      userId,
      config: {
        ...normalizedConfig,
        questionId: selected.questionId
      },
      status: 'active',
      currentPhase,
      phaseHistory: [{ phase: currentPhase, enteredAt: new Date() }],
      askedQuestions: [openingQuestion],
      questionSnapshot: selected.snapshot
    });

    const message = await InterviewMessage.create({
      sessionId: session._id,
      role: 'interviewer',
      content: `Hi ${userName}. ${openingQuestion}`,
      phase: currentPhase,
      action: 'next_phase'
    });

    return {
      session,
      message
    };
  },

  async getSession(sessionId) {
    const [session, messages, evaluations, report] = await Promise.all([
      InterviewSession.findById(sessionId).lean(),
      InterviewMessage.find({ sessionId }).sort({ createdAt: 1 }).lean(),
      InterviewEvaluation.find({ sessionId }).sort({ createdAt: 1 }).lean(),
      InterviewReport.findOne({ sessionId }).lean()
    ]);

    return { session, messages, evaluations, report };
  },

  async answerSession(sessionId, answer) {
    const session = await InterviewSession.findById(sessionId);
    if (!session) throw new Error('Session not found');
    if (session.status !== 'active') throw new Error('This session is no longer active');

    const history = await InterviewMessage.find({ sessionId }).sort({ createdAt: 1 }).lean();

    const userMessage = await InterviewMessage.create({
      sessionId,
      role: 'user',
      content: answer,
      phase: session.currentPhase
    });

    const llmEvaluation = await runEvaluatorModel(session, answer, session.currentPhase);
    const evaluationPayload = llmEvaluation || fallbackEvaluation(answer, session.currentPhase, session.config.roundType);

    const evaluation = await InterviewEvaluation.create({
      sessionId,
      messageId: userMessage._id,
      scores: evaluationPayload.scores,
      total: evaluationPayload.total,
      strengths: evaluationPayload.strengths || [],
      gaps: evaluationPayload.gaps || [],
      nextHint: evaluationPayload.nextHint || null
    });

    const conductorHistory = [...history, userMessage.toObject()];
    const llmConductor = await runConductorModel(session, conductorHistory, answer, evaluationPayload);
    const fallback = fallbackConductor(session, history, evaluationPayload);
    const conductor = normalizeConductorResponse(llmConductor, fallback);

    const interviewerMessage = await InterviewMessage.create({
      sessionId,
      role: 'interviewer',
      content: conductor.message,
      phase: conductor.phase,
      action: conductor.action
    });

    if (conductor.phase !== session.currentPhase) {
      session.currentPhase = conductor.phase;
      session.phaseHistory.push({ phase: conductor.phase, enteredAt: new Date() });
    }

    if (conductor.action !== 'end_round') {
      const currentQuestion = conductor.message.split('\n').pop()?.trim() || conductor.message;
      session.askedQuestions = dedupeStrings([...(session.askedQuestions || []), currentQuestion]);
    } else {
      session.status = 'completed';
      session.endedAt = new Date();
    }

    await session.save();

    const report = conductor.action === 'end_round'
      ? await generateReport(sessionId)
      : null;

    return {
      session: session.toObject(),
      userMessage: userMessage.toObject(),
      interviewerMessage: interviewerMessage.toObject(),
      evaluation: evaluation.toObject(),
      report
    };
  },

  async requestHint(sessionId) {
    const session = await InterviewSession.findById(sessionId);
    if (!session) throw new Error('Session not found');
    if (session.status !== 'active') throw new Error('This session is no longer active');

    const latestEvaluation = await InterviewEvaluation.findOne({ sessionId }).sort({ createdAt: -1 }).lean();
    const hint = latestEvaluation?.nextHint || 'Break your answer into assumptions, approach, tradeoffs, and edge cases before you continue.';

    session.hintsUsed += 1;
    await session.save();

    return { hint, hintsUsed: session.hintsUsed };
  },

  async reviewCode(sessionId, code, language = 'cpp') {
    const session = await InterviewSession.findById(sessionId);
    if (!session) throw new Error('Session not found');
    if (session.status !== 'active') throw new Error('This session is no longer active');
    if (session.config.roundType !== 'dsa') throw new Error('Live code review is only available for DSA rounds');

    const normalizedCode = String(code || '');
    if (normalizedCode.trim().length < 20) {
      throw new Error('Write a bit more code before requesting live feedback');
    }

    const nextHash = hashCode(normalizedCode);
    if (session.lastCodeReviewHash && session.lastCodeReviewHash === nextHash) {
      const state = await this.getSession(sessionId);
      return {
        skipped: true,
        session: session.toObject(),
        messages: state.messages
      };
    }

    session.currentCode = normalizedCode;
    session.currentLanguage = language;
    session.lastCodeReviewHash = nextHash;

    if (session.currentPhase === 'clarification') {
      session.currentPhase = 'dsa_link';
      session.phaseHistory.push({ phase: 'dsa_link', enteredAt: new Date() });
    } else if (session.currentPhase === 'dsa_link') {
      session.currentPhase = 'code';
      session.phaseHistory.push({ phase: 'code', enteredAt: new Date() });
    }

    await session.save();

    const reviewMessage = await runCodeReviewModel(session, normalizedCode, language);
    const fallbackMessage = fallbackCodeReview(session, normalizedCode, language);
    const content = reviewMessage || fallbackMessage;

    const interviewerMessage = await InterviewMessage.create({
      sessionId,
      role: 'interviewer',
      content,
      phase: session.currentPhase,
      action: 'ask_followup'
    });

    const state = await this.getSession(sessionId);
    return {
      skipped: false,
      session: session.toObject(),
      interviewerMessage: interviewerMessage.toObject(),
      messages: state.messages
    };
  },

  async createLiveVoiceToken() {
    if (!ai || !ai.authTokens?.create) {
      throw new Error('Gemini Live voice is not configured on the server');
    }

    const liveModel = 'gemini-2.5-flash-native-audio-preview-12-2025';
    const expireTime = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    const newSessionExpireTime = new Date(Date.now() + 60 * 1000).toISOString();

    const token = await ai.authTokens.create({
      config: {
        uses: 1,
        expireTime,
        newSessionExpireTime,
        liveConnectConstraints: {
          model: liveModel,
          config: {
            responseModalities: ['AUDIO'],
            outputAudioTranscription: {},
            inputAudioTranscription: {}
          }
        },
        httpOptions: {
          apiVersion: 'v1alpha'
        }
      }
    });

    return {
      token: token.name,
      model: liveModel,
      expireTime: token.expireTime || expireTime,
      newSessionExpireTime: token.newSessionExpireTime || newSessionExpireTime
    };
  },

  async getReport(sessionId) {
    const report = await InterviewReport.findOne({ sessionId }).lean();
    return report;
  },

  async analyzeResume({ fileBuffer, mimeType, fileName = '' }) {
    if (!fileBuffer || !mimeType) {
      throw new Error('Resume file is required');
    }

    const supportedTypes = new Set([
      'application/pdf',
      'text/plain',
      'text/markdown',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]);

    if (!supportedTypes.has(mimeType)) {
      throw new Error('Unsupported resume format. Please upload PDF, TXT, MD, DOC, or DOCX.');
    }

    const context = await analyzeResumeWithAi(fileBuffer, mimeType);
    if (!context.candidateSummary && !context.projects.length && !context.skills.length) {
      throw new Error('Could not extract enough information from the resume. Please try a clearer file.');
    }

    return {
      fileName,
      ...context
    };
  }
};
