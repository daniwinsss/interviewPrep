import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

// Intentionally loose on keys for the MVP wrapper so it doesn't crash on boot without a key.
const ai = new GoogleGenAI(process.env.GEMINI_API_KEY ? { apiKey: process.env.GEMINI_API_KEY } : {});

export const llmService = {
  async evaluateInterviewAnswer(topic, messageHistory) {
    // We pass the conversation context and strict JSON instructions
    const prompt = `Act as a technical interviewer for the topic: ${topic}.
    Here is the conversation history:
    ${JSON.stringify(messageHistory)}
    
    Evaluate the candidate's LAST answer based on correctness, clarity, and optimization.
    Must return JSON ONLY with this exact format:
    {
      "feedback": "...",
      "rating": 8,
      "nextQuestion": "..."
    }`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: prompt,
      });

      // Simple parsing of potentially Markdown-wrapped JSON
      const rawText = response.text || '';
      const rawJson = rawText.replace(/```json/gi, '').replace(/```/gi, '').trim();
      return JSON.parse(rawJson);
    } catch (e) {
      console.error('LLM Error:', e);
      throw new Error('Failed to generate AI response');
    }
  }
};
