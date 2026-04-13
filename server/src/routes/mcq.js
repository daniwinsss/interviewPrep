import express from 'express';

const router = express.Router();

const HF_API_BASE = 'https://datasets-server.huggingface.co/rows?dataset=lmms-lab%2FCSBench_MCQ&config=default&split=mcq';

const SUBJECTS = {
  dsa: {
    domain: 'Data Structure and Algorithm',
    offsets: [0, 100, 200, 300]
  },
  arch: {
    domain: 'Computer Organization',
    offsets: [400, 500, 600, 700, 800, 900]
  },
  cn: {
    domain: 'Computer Network',
    offsets: [1000]
  },
  os: {
    domain: 'Operating System',
    offsets: [1100, 1200, 1236]
  }
};

router.get('/questions', async (req, res) => {
  try {
    const subjectId = String(req.query.subject || '');
    const subject = SUBJECTS[subjectId];

    if (!subject) {
      return res.status(400).json({ error: 'Invalid subject id' });
    }

    const responses = await Promise.all(
      subject.offsets.map(async (offset) => {
        const response = await fetch(`${HF_API_BASE}&offset=${offset}&length=100`);
        if (!response.ok) {
          throw new Error(`Upstream MCQ API error: ${response.status}`);
        }
        return response.json();
      })
    );

    const rows = responses
      .flatMap((data) => data.rows.map((r) => r.row))
      .filter((r) => r.Domain === subject.domain && r.Language === 'English');

    res.json({ rows });
  } catch (err) {
    console.error('MCQ fetch error:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch MCQs' });
  }
});

export default router;
