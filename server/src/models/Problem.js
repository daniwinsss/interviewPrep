import mongoose from 'mongoose';

const problemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], required: true },
  
  // USACO-specific fields
  source: { type: String, enum: ['custom', 'usaco'], default: 'custom' },
  usacoCpid: { type: Number },
  division: { type: String, enum: ['Bronze', 'Silver', 'Gold', 'Platinum', 'Custom'] },
  contest: { type: String }, // e.g. "2023 February Bronze"
  timeLimit: { type: Number, default: 2000 }, // ms
  memoryLimit: { type: Number, default: 256 }, // MB
  
  // Supported languages
  languages: {
    type: [String],
    enum: ['java', 'python', 'cpp'],
    default: ['java', 'python', 'cpp']
  },

  // Starter code templates per language
  starterCode: {
    java: { type: String, default: 'import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: Read input and write solution\n    }\n}' },
    python: { type: String, default: 'import sys\ninput = sys.stdin.readline\n\n# TODO: Write your solution\n' },
    cpp: { type: String, default: '#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    ios_base::sync_with_stdio(false);\n    cin.tie(NULL);\n    // TODO: Write your solution\n    return 0;\n}' }
  },

  company: [{ type: String }],
  
  testCases: [{
    input: { type: String, required: true },
    output: { type: String, required: true },
    isHidden: { type: Boolean, default: false }
  }]
}, { timestamps: true });

export default mongoose.model('Problem', problemSchema);
