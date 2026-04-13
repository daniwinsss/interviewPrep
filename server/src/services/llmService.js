import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const TOPIC_QUESTIONS = {
  DSA: [
    'Could you introduce yourself and then walk me through a challenging data structures or algorithms problem you solved recently?',
    'How would you explain the difference between BFS and DFS, and when would you choose one over the other?',
    'Tell me about a time-space tradeoff you made in an algorithmic solution.',
    'How would you detect a cycle in a graph, and how would your approach change for directed vs. undirected graphs?',
    'When would you choose a heap over sorting for a top-k problem?',
    'How do hash maps help optimize two-sum style problems, and what are the tradeoffs?',
    'Explain Kadane’s algorithm and how you would derive it in an interview.',
    'How would you approach designing an LRU cache from scratch?',
    'What is the difference between backtracking and dynamic programming?',
    'How would you decide whether a problem should use binary search on the answer?',
    'Describe a bug you’ve seen in recursion-heavy code and how you debugged it.',
    'How would you explain amortized time complexity to a junior engineer?',
    'What are the tradeoffs between arrays, linked lists, and deques in real interview problems?',
    'How would you optimize a brute-force solution when the input size grows from 10^3 to 10^5?',
    'What edge cases do you check first in tree problems?',
    'How would you compare union-find with graph traversal approaches?',
    'Explain how prefix sums or difference arrays help in range query problems.',
    'Walk me through a sliding window problem you solved and why that pattern worked.',
    'How do you reason about invariants while writing a greedy algorithm?',
    'Describe how you validate correctness before worrying about micro-optimizations.'
  ],
  Behavioral: [
    'Tell me about yourself and then describe a time you handled a disagreement with a teammate.',
    'Tell me about a situation where you received difficult feedback and how you responded.',
    'Describe a time you had to prioritize conflicting deadlines.',
    'Tell me about a project where the requirements changed late. How did you adapt?',
    'Describe a time you made a mistake and what changed in your process afterward.',
    'Tell me about a time you took ownership of a problem outside your formal role.',
    'Describe a situation where you had to influence someone without direct authority.',
    'How do you handle ambiguity when expectations are not fully defined?',
    'Tell me about a time you had to learn something quickly to deliver a result.',
    'Describe a time you helped unblock a struggling teammate.',
    'Tell me about a situation where you had to say no or push back on a request.',
    'Describe a time when you improved a process instead of just completing a task.',
    'How have you balanced speed and quality under pressure?',
    'Tell me about a time you had to communicate technical information to a non-technical audience.',
    'Describe a situation where you had to rebuild trust after something went wrong.',
    'What kind of team environment helps you do your best work, and why?',
    'Tell me about a conflict that was more about communication style than technical disagreement.',
    'Describe a time you disagreed with your manager and how you handled it.',
    'How do you respond when your work is blocked by another team?',
    'Tell me about a time you were proud of your collaboration, not just the outcome.'
  ],
  'System Design': [
    'Introduce yourself and then design a URL shortener at a high level.',
    'How would you design a rate limiter for a public API?',
    'Walk me through how you would scale a chat application to millions of users.',
    'How would you design a file upload service with resumable uploads?',
    'Explain how you would approach cache invalidation in a read-heavy system.',
    'How would you design a notification system that supports email, SMS, and push?',
    'Describe how you would design a job queue for asynchronous tasks.',
    'How would you approach designing search autocomplete for a large catalog?',
    'What tradeoffs would you consider when choosing SQL vs. NoSQL for a new service?',
    'How would you design a metrics pipeline for collecting application telemetry?',
    'How would you make an API resilient to traffic spikes and downstream failures?',
    'Describe how you would design a collaborative document editing system.',
    'How would you approach multi-region deployment for a latency-sensitive product?',
    'How would you design a recommendation service and evaluate its quality?',
    'Explain how you would handle idempotency in payment-related APIs.',
    'How would you design an audit logging system for a SaaS platform?',
    'What would you cache in an e-commerce product page flow, and what would you avoid caching?',
    'How would you design a feature flagging system used by multiple teams?',
    'Describe how you would approach schema evolution in distributed services.',
    'How would you investigate a production system that is timing out under load?'
  ],
  'Project Experience': [
    'Introduce yourself and then walk me through one project you are most proud of.',
    'What problem was the project solving, and why did it matter?',
    'What was your exact role on the project, and which parts did you personally own?',
    'How did you decide on the architecture or tech stack for that project?',
    'What was the hardest technical challenge in the project, and how did you solve it?',
    'If you had to explain the project to a non-technical interviewer, how would you do it?',
    'What tradeoffs did you make while building the project?',
    'How did you test or validate that the project was working correctly?',
    'What part of the project would you redesign if you had another month?',
    'What performance or scalability concerns did you consider in that project?',
    'What bugs or failures did you run into during the project, and how did you debug them?',
    'How did you break the project into milestones or implementation phases?',
    'What impact did the project have on users, teammates, or your own growth?',
    'How did you handle scope creep or changing requirements in the project?',
    'What did you learn from the project that changed how you build software now?',
    'If I looked at the code today, what part would best represent your engineering strengths?',
    'What was the weakest part of the project, and why did it stay weak?',
    'How did you balance shipping quickly with maintaining code quality in the project?',
    'What assumptions did you make early in the project that later changed?',
    'If I asked you to continue the project now, what would be the next concrete step?'
  ]
};

const TOPIC_CONTEXT = {
  DSA: 'Focus on algorithm choice, complexity, correctness, edge cases, and communication.',
  Behavioral: 'Focus on ownership, communication, reflection, collaboration, and impact.',
  'System Design': 'Focus on requirements, tradeoffs, scalability, reliability, interfaces, and operational thinking.',
  'Project Experience': 'Focus on ownership, architecture, decision-making, tradeoffs, debugging, impact, and lessons learned.'
};

const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  : null;

function normalizeString(value = '') {
  return String(value).trim();
}

function uniqueNormalized(values = []) {
  return [...new Set(values.map(normalizeString).filter(Boolean))];
}

function getQuestionBank(topic) {
  return TOPIC_QUESTIONS[topic] || TOPIC_QUESTIONS.DSA;
}

function getAvailableQuestions(topic, askedQuestions = []) {
  const used = new Set(uniqueNormalized(askedQuestions));
  return getQuestionBank(topic).filter((question) => !used.has(normalizeString(question)));
}

function pickRandom(items = []) {
  if (!items.length) return null;
  return items[Math.floor(Math.random() * items.length)];
}

function clampRating(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return 6;
  return Math.min(10, Math.max(1, Math.round(num)));
}

function parseJsonResponse(text) {
  const cleaned = String(text || '')
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch (_) {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('No JSON object found in LLM response');
    return JSON.parse(match[0]);
  }
}

function buildFallbackFeedback(messageHistory = []) {
  const lastUserMessage = [...messageHistory].reverse().find((msg) => msg.role === 'user')?.content || '';
  const answer = normalizeString(lastUserMessage);
  const wordCount = answer ? answer.split(/\s+/).length : 0;
  const mentionsTradeoff = /tradeoff|trade-off|complexity|because|however|latency|space|time|bottleneck/i.test(answer);
  const mentionsExample = /for example|for instance|example|in my project|once|specifically|we built/i.test(answer);

  let rating = 4;
  if (wordCount >= 20) rating += 2;
  if (wordCount >= 60) rating += 1;
  if (mentionsTradeoff) rating += 1;
  if (mentionsExample) rating += 1;

  let feedback = 'You covered the basics, but I would like a more structured answer.';
  if (rating >= 8) {
    feedback = 'Strong answer. You explained your reasoning clearly and included useful tradeoffs or concrete examples.';
  } else if (rating >= 6) {
    feedback = 'Good start. Your answer is understandable, and it would be even stronger with a more concrete example and clearer tradeoffs.';
  } else if (rating >= 5) {
    feedback = 'You are on the right track, but the answer feels a bit high-level. Try organizing it around approach, tradeoffs, and impact.';
  }

  return { feedback, rating: clampRating(rating) };
}

function normalizeEvaluation(evaluation) {
  return {
    feedback: String(evaluation?.feedback || 'Solid effort. I would like a bit more structure and a clearer explanation of the tradeoffs in your answer.'),
    rating: clampRating(evaluation?.rating)
  };
}

export const llmService = {
  getOpeningQuestion(topic, askedQuestions = []) {
    return pickRandom(getAvailableQuestions(topic, askedQuestions));
  },

  getNextQuestion(topic, askedQuestions = []) {
    return pickRandom(getAvailableQuestions(topic, askedQuestions));
  },

  async evaluateInterviewAnswer(topic, messageHistory) {
    if (!ai) {
      return buildFallbackFeedback(messageHistory);
    }

    const prompt = `You are a technical interviewer.
Topic: ${topic}
Interview focus: ${TOPIC_CONTEXT[topic] || TOPIC_CONTEXT.DSA}

Conversation history:
${JSON.stringify(messageHistory)}

Evaluate only the candidate's latest answer.
Return JSON only using this exact shape:
{
  "feedback": "2-4 sentences of constructive interview feedback",
  "rating": 1-10 integer
}`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      });

      return normalizeEvaluation(parseJsonResponse(response.text));
    } catch (error) {
      console.error('LLM Error:', error);
      return buildFallbackFeedback(messageHistory);
    }
  }
};
