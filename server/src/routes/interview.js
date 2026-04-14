import express from 'express';
import { interviewService } from '../services/interviewService.js';

const router = express.Router();

function mapTopicToRoundType(topic = '') {
  const normalized = String(topic).trim().toLowerCase();
  if (normalized === 'dsa') return 'dsa';
  if (normalized === 'behavioral' || normalized === 'behavioural') return 'behavioural';
  if (normalized === 'system design') return 'system_design';
  if (normalized === 'project experience' || normalized === 'project') return 'project';
  if (normalized === 'core cs') return 'core_cs';
  return normalized || 'dsa';
}

function mapRoundTypeToTopic(roundType = '') {
  return {
    dsa: 'DSA',
    behavioural: 'Behavioral',
    system_design: 'System Design',
    project: 'Project Experience',
    core_cs: 'Core CS'
  }[roundType] || roundType;
}

function formatSessionResponse(session, messages = [], evaluations = [], report = null) {
  return {
    _id: session._id,
    id: session._id,
    topic: mapRoundTypeToTopic(session.config?.roundType),
    roundType: session.config?.roundType,
    difficulty: session.config?.difficulty,
    durationMin: session.config?.durationMin,
    company: session.config?.company,
    userName: session.config?.userName,
    completed: session.status === 'completed',
    status: session.status,
    currentPhase: session.currentPhase,
    hintsUsed: session.hintsUsed,
    question: session.questionSnapshot || null,
    messages: messages.map((message) => ({
      _id: message._id,
      role: message.role === 'interviewer' ? 'ai' : 'user',
      content: message.content,
      phase: message.phase || null,
      action: message.action || null,
      screenshotUrl: message.screenshotUrl || null
    })),
    evaluations,
    report
  };
}

router.post('/start', async (req, res) => {
  try {
    const {
      userId,
      userName,
      topic,
      roundType,
      difficulty = 'medium',
      durationMin = 45,
      company = 'generic',
      repoUrl = ''
    } = req.body;

    const { session, message } = await interviewService.startSession({
      userId: userId || 'anonymous',
      userName: userName || 'Candidate',
      roundType: mapTopicToRoundType(roundType || topic),
      difficulty,
      durationMin,
      company,
      repoUrl
    });

    res.json(formatSessionResponse(session, [message]));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/answer', async (req, res) => {
  try {
    const { sessionId, interviewId, answer } = req.body;
    const activeSessionId = sessionId || interviewId;

    if (!activeSessionId || !answer?.trim()) {
      return res.status(400).json({ error: 'sessionId and answer are required' });
    }

    const result = await interviewService.answerSession(activeSessionId, answer.trim());
    const sessionState = await interviewService.getSession(activeSessionId);

    res.json({
      evaluation: result.evaluation,
      report: result.report,
      interview: formatSessionResponse(
        sessionState.session,
        sessionState.messages,
        sessionState.evaluations,
        sessionState.report
      )
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/code-feedback', async (req, res) => {
  try {
    const { sessionId, interviewId, code, language } = req.body;
    const activeSessionId = sessionId || interviewId;
    if (!activeSessionId || !String(code || '').trim()) {
      return res.status(400).json({ error: 'sessionId and code are required' });
    }

    const result = await interviewService.reviewCode(activeSessionId, code, language || 'cpp');
    res.json({
      success: true,
      skipped: Boolean(result.skipped),
      interviewerMessage: result.interviewerMessage,
      session: result.session,
      messages: result.messages
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/live-token', async (req, res) => {
  try {
    const result = await interviewService.createLiveVoiceToken();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/hint', async (req, res) => {
  try {
    const result = await interviewService.requestHint(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id/report', async (req, res) => {
  try {
    const report = await interviewService.getReport(req.params.id);
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const state = await interviewService.getSession(req.params.id);
    if (!state.session) {
      return res.status(404).json({ error: 'Interview session not found' });
    }

    res.json(formatSessionResponse(state.session, state.messages, state.evaluations, state.report));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
