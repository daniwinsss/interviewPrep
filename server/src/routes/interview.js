import express from 'express';
import Interview from '../models/Interview.js';
import { llmService } from '../services/llmService.js';

const router = express.Router();

// 1. Start an interview
router.post('/start', async (req, res) => {
  try {
    const { userId, topic } = req.body;
    if (!topic) return res.status(400).json({ error: 'topic is required' });
    const openingQuestion = llmService.getOpeningQuestion(topic, []);
    if (!openingQuestion) {
      return res.status(400).json({ error: 'No interview questions configured for this topic' });
    }
    
    const interview = new Interview({
      userId: userId || 'anonymous',
      topic,
      askedQuestions: [openingQuestion],
      completed: false,
      messages: [{ 
        role: 'ai', 
        content: `Welcome to your ${topic} interview. First question: ${openingQuestion}`,
      }]
    });
    
    await interview.save();
    res.json(interview);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Answer a question
router.post('/answer', async (req, res) => {
  try {
    const { interviewId, answer } = req.body;
    if (!interviewId || !answer?.trim()) {
      return res.status(400).json({ error: 'interviewId and answer are required' });
    }
    
    const interview = await Interview.findById(interviewId);
    if (!interview) return res.status(404).json({ error: 'Interview not found' });
    if (interview.completed) {
      return res.status(400).json({ error: 'This interview session is already complete' });
    }

    // Push the user's answer into history
    interview.messages.push({ role: 'user', content: answer });

    // Ask Gemini/fallback evaluator for feedback
    const evaluation = await llmService.evaluateInterviewAnswer(interview.topic, interview.messages);
    const nextQuestion = llmService.getNextQuestion(interview.topic, interview.askedQuestions);
    
    // Assign rating to the user's answer
    interview.messages[interview.messages.length - 1].rating = evaluation.rating;
    
    if (nextQuestion) {
      interview.askedQuestions.push(nextQuestion);
      interview.messages.push({ 
        role: 'ai', 
        content: `${evaluation.feedback}\n\nNext Question: ${nextQuestion}` 
      });
    } else {
      interview.completed = true;
      interview.messages.push({
        role: 'ai',
        content: `${evaluation.feedback}\n\nYou have completed this interview set. Change topic or restart to continue practicing.`
      });
    }

    const ratedUserMessages = interview.messages.filter((msg) => msg.role === 'user' && typeof msg.rating === 'number');
    if (ratedUserMessages.length > 0) {
      interview.overallScore = Math.round(
        ratedUserMessages.reduce((sum, msg) => sum + msg.rating, 0) / ratedUserMessages.length
      );
    }

    await interview.save();
    res.json({
      evaluation: {
        ...evaluation,
        nextQuestion: nextQuestion || null
      },
      interview
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Get Interview history
router.get('/:id', async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id);
    res.json(interview);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
