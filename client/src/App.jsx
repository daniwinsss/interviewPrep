import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import CodeEditor from './pages/CodeEditor';
import Interview from './pages/Interview';
import MCQ from './pages/MCQ';
import Login from './pages/Login';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/problems/:id" element={<CodeEditor />} />
        <Route path="/interview" element={<Interview />} />
        <Route path="/mcq" element={<MCQ />} />
      </Routes>
    </Router>
  );
}

export default App;
