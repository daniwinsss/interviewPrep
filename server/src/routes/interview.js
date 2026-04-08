import express from 'express';
import Interview from '../models/Interview.js';
import { llmService } from '../services/llmService.js';

const router = express.Router();

// 1. Start an interview
router.post('/start', async (req, res) => {
  try {
    const { userId, topic } = req.body;
    
    const interview = new Interview({
      userId,
      topic,
      messages: [{ 
        role: 'ai', 
        content: `Welcome to your ${topic} interview. First question: Could you explain the concept of hoisting in Javascript and how it affects variables declared with var, let, and const?`,
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
    
    const interview = await Interview.findById(interviewId);
    if (!interview) return res.status(404).json({ error: 'Interview not found' });

    // Push the user's answer into history
    interview.messages.push({ role: 'user', content: answer });

    // Ask Gemini for evaluation & next question
    const evaluation = await llmService.evaluateInterviewAnswer(interview.topic, interview.messages);
    
    // Assign rating to the user's answer
    interview.messages[interview.messages.length - 1].rating = evaluation.rating;
    
    // Append the AI's feedback and next question
    interview.messages.push({ 
      role: 'ai', 
      content: `${evaluation.feedback}\n\n**Next Question:** ${evaluation.nextQuestion}` 
    });

    await interview.save();
    res.json({ evaluation, interview });
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
