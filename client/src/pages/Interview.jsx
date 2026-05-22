import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Bot,
  ClipboardCheck,
  Clock,
  Code2,
  Crown,
  ExternalLink,
  FileText,
  Globe,
  Headphones,
  Mic,
  MicOff,
  PanelRight,
  Shield,
  Sparkles,
  Terminal,
  Users,
  Video,
  VideoOff
} from 'lucide-react';
import { motion } from 'framer-motion';
import Peer from 'simple-peer/simplepeer.min.js';
import { io } from 'socket.io-client';
import { apiUrl, SOCKET_BASE_URL } from '../lib/api';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';

const API = apiUrl('/api/ai/interview');

const TOPICS = ['DSA', 'Behavioral', 'System Design', 'Project Experience', 'Resume Session', 'Core CS'];

const LANG_MAP = {
  cpp: { label: 'C++', monaco: 'cpp' },
  java: { label: 'Java', monaco: 'java' },
  python: { label: 'Python', monaco: 'python' }
};

const STARTER_CODE = {
  cpp: '#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n\n    return 0;\n}\n',
  java: 'import java.io.*;\nimport java.util.*;\n\npublic class Main {\n    public static void main(String[] args) throws Exception {\n        \n    }\n}\n',
  python: 'def solve():\n    pass\n\nif __name__ == "__main__":\n    solve()\n'
};

const TOOLS = [
  { id: 'whiteboard', label: 'Whiteboard', icon: PanelRight },
  { id: 'notes', label: 'Notes', icon: FileText },
  { id: 'transcript', label: 'Transcript', icon: ClipboardCheck },
  { id: 'participants', label: 'Participants', icon: Users }
];

const VOICE_STATUS_LABELS = {
  idle: 'Idle',
  requesting: 'Requesting mic',
  connecting: 'Connecting',
  connected: 'Connected',
  reconnecting: 'Reconnecting',
  failed: 'Failed'
};

function getProblemData(interview) {
  const question = interview?.question || {};
  const slug = question.leetcodeSlug;
  return {
    title: question.title || '',
    content: question.content || '',
    constraints: question.constraints || '',
    examples: question.examples || '',
    link: slug ? `https://leetcode.com/problems/${slug}/` : ''
  };
}

async function readApiResponse(response) {
  const raw = await response.text();
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return { error: raw };
  }
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
  const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
}

function useSpeechRecognition({ enabled, onTranscript }) {
  const recognitionRef = useRef(null);
  const shouldRunRef = useRef(false);
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);

  useEffect(() => {
    const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      setSupported(false);
      return undefined;
    }
    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0]?.transcript || '')
        .join(' ')
        .trim();
      onTranscript(transcript, event.results[event.results.length - 1]?.isFinal);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => {
      setListening(false);
      if (!shouldRunRef.current || !enabled) return;
      try {
        recognition.start();
        setListening(true);
      } catch {
        setListening(false);
      }
    };
    recognitionRef.current = recognition;
    setSupported(true);
    return () => {
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      shouldRunRef.current = false;
      try { recognition.stop(); } catch {}
    };
  }, [onTranscript]);

  const start = useCallback(() => {
    if (!enabled || !recognitionRef.current || listening) return;
    shouldRunRef.current = true;
    try {
      recognitionRef.current.start();
      setListening(true);
    } catch {
      setListening(false);
    }
  }, [enabled, listening]);

  const stop = useCallback(() => {
    if (!recognitionRef.current || !listening) return;
    shouldRunRef.current = false;
    recognitionRef.current.stop();
    setListening(false);
  }, [listening]);

  const toggle = useCallback(() => {
    if (listening) {
      stop();
      return;
    }
    start();
  }, [listening, start, stop]);

  useEffect(() => {
    if (enabled) return;
    shouldRunRef.current = false;
    try {
      recognitionRef.current?.stop();
    } catch {}
    setListening(false);
  }, [enabled]);

  return { supported, listening, toggle, start, stop };
}

function Whiteboard({ strokes, setStrokes }) {
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef(null);
  const activePointerIdRef = useRef(null);
  const [tool, setTool] = useState('pen');

  const drawStrokes = useCallback((ctx) => {
    if (!ctx) return;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    strokes.forEach((stroke) => {
      const points = Array.isArray(stroke) ? stroke : stroke?.points;
      if (!points?.length) return;
      const isEraser = !Array.isArray(stroke) && stroke.mode === 'eraser';
      ctx.globalCompositeOperation = isEraser ? 'destination-out' : 'source-over';
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = isEraser ? 18 : 2.5;
      ctx.beginPath();
      points.forEach((point, idx) => {
        if (idx === 0) ctx.moveTo(point.x, point.y);
        else ctx.lineTo(point.x, point.y);
      });
      ctx.stroke();
    });
    ctx.globalCompositeOperation = 'source-over';
  }, [strokes]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawStrokes(ctx);
  }, [drawStrokes]);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    const rect = parent.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawStrokes(ctx);
  }, [drawStrokes]);

  useEffect(() => {
    resizeCanvas();
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    const handleResize = () => resizeCanvas();
    window.addEventListener('resize', handleResize);

    let observer = null;
    if (parent && typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => resizeCanvas());
      observer.observe(parent);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (observer) observer.disconnect();
    };
  }, [resizeCanvas]);

  const handlePointerDown = (event) => {
    drawingRef.current = true;
    activePointerIdRef.current = event.pointerId;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    const rect = event.currentTarget.getBoundingClientRect();
    const point = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    lastPointRef.current = point;
    setStrokes((prev) => [...prev, { mode: tool, points: [point] }]);
  };

  const handlePointerMove = (event) => {
    if (!drawingRef.current) return;
    if (activePointerIdRef.current !== null && event.pointerId !== activePointerIdRef.current) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const point = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    lastPointRef.current = point;
    setStrokes((prev) => {
      const next = [...prev];
      const currentStroke = next[next.length - 1];
      if (currentStroke?.points) currentStroke.points.push(point);
      return next;
    });
  };

  const handlePointerUp = (event) => {
    if (activePointerIdRef.current !== null && event?.pointerId !== undefined && event.pointerId !== activePointerIdRef.current) return;
    if (event?.pointerId !== undefined) {
      event.currentTarget?.releasePointerCapture?.(event.pointerId);
    }
    activePointerIdRef.current = null;
    drawingRef.current = false;
    lastPointRef.current = null;
  };

  return (
    <div className="h-[420px] md:h-[520px] rounded-3xl border border-slate-200 bg-white relative overflow-hidden">
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
        <button
          onClick={() => setTool('pen')}
          className={`h-8 px-3 rounded-lg text-[10px] font-bold uppercase tracking-widest border ${
            tool === 'pen' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-500 border-slate-200'
          }`}
        >
          Pen
        </button>
        <button
          onClick={() => setTool('eraser')}
          className={`h-8 px-3 rounded-lg text-[10px] font-bold uppercase tracking-widest border ${
            tool === 'eraser' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-500 border-slate-200'
          }`}
        >
          Eraser
        </button>
        <button
          onClick={() => setStrokes([])}
          className="h-8 px-3 rounded-lg text-[10px] font-bold uppercase tracking-widest border bg-white text-slate-500 border-slate-200"
        >
          Clear
        </button>
      </div>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerLeave={handlePointerUp}
      />
      <div className="absolute bottom-4 right-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        Live whiteboard
      </div>
    </div>
  );
}

export default function Interview() {
  const [view, setView] = useState('lobby');
  const [topic, setTopic] = useState('DSA');
  const [repoUrl, setRepoUrl] = useState('');
  const [resumeFileName, setResumeFileName] = useState('');
  const [resumeContext, setResumeContext] = useState(null);
  const [isAnalyzingResume, setIsAnalyzingResume] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isStarting, setIsStarting] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState('');
  const [problemTitle, setProblemTitle] = useState('');
  const [problemLink, setProblemLink] = useState('');
  const [problemContent, setProblemContent] = useState('');
  const [repoName, setRepoName] = useState('');
  const [currentPhase, setCurrentPhase] = useState('');
  const [language, setLanguage] = useState('cpp');
  const [code, setCode] = useState(STARTER_CODE.cpp);
  const [isMonitoringCode, setIsMonitoringCode] = useState(false);
  const [toolsTab, setToolsTab] = useState('whiteboard');
  const [notes, setNotes] = useState('');
  const [recordingConsent, setRecordingConsent] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [report, setReport] = useState(null);
  const [strokes, setStrokes] = useState([]);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [cameraStream, setCameraStream] = useState(null);
  const role = 'candidate';
  const [voiceStatus, setVoiceStatus] = useState('idle');
  const [aiVoiceEnabled, setAiVoiceEnabled] = useState(true);
  const [speakerEnabled, setSpeakerEnabled] = useState(true);
  const [pushToTalkEnabled, setPushToTalkEnabled] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [voiceError, setVoiceError] = useState('');
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [remoteUserId, setRemoteUserId] = useState(null);

  const messagesEndRef = useRef(null);
  const codeMonitorTimerRef = useRef(null);
  const lastReviewedCodeRef = useRef('');
  const timerRef = useRef(null);
  const cameraRef = useRef(null);
  const socketRef = useRef(null);
  const peerRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const userIdRef = useRef(`user_${Math.random().toString(36).slice(2, 10)}`);
  const roomIdRef = useRef(null);
  const voiceInitializedRef = useRef(false);
  const lastSpokenAiMessageRef = useRef('');
  const speechUnlockedRef = useRef(false);
  const speechQueueRef = useRef([]);
  const isSpeakingRef = useRef(false);

  const isDsa = topic === 'DSA';
  const isProjectExperience = topic === 'Project Experience';
  const isResumeSession = topic === 'Resume Session';
  const isProjectTrack = isProjectExperience || isResumeSession;

  useEffect(() => {
    if (isResumeSession) return;
    setResumeContext(null);
    setResumeFileName('');
    setIsAnalyzingResume(false);
  }, [isResumeSession]);

  const handleTranscript = useCallback((text, isFinal) => {
    setLiveTranscript(text);
    if (isFinal && text) {
      setInput(text);
    }
  }, []);

  const speech = useSpeechRecognition({
    enabled: view === 'live' && !isComplete,
    onTranscript: handleTranscript
  });

  useEffect(() => {
    if (view !== 'live' || isComplete) return;
    timerRef.current = setInterval(() => {
      setTimerSeconds((value) => value + 1);
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [view, isComplete]);

  useEffect(() => {
    if (!cameraRef.current || !cameraStream) return;
    cameraRef.current.srcObject = cameraStream;
  }, [cameraStream]);

  useEffect(() => {
    if (!remoteAudioRef.current) return;
    remoteAudioRef.current.srcObject = remoteStream || null;
  }, [remoteStream]);

  useEffect(() => {
    if (remoteAudioRef.current) {
      remoteAudioRef.current.muted = !speakerEnabled;
    }
  }, [speakerEnabled]);

  const splitSpeechChunks = useCallback((value) => {
    const normalized = String(value || '').replace(/\s+/g, ' ').trim();
    if (!normalized) return [];
    const maxLen = 220;
    const chunks = [];
    let remaining = normalized;
    while (remaining.length > maxLen) {
      const slice = remaining.slice(0, maxLen + 1);
      const breakAt = Math.max(slice.lastIndexOf('. '), slice.lastIndexOf('? '), slice.lastIndexOf('! '), slice.lastIndexOf(', '), slice.lastIndexOf(' '));
      const cut = breakAt > 40 ? breakAt + 1 : maxLen;
      chunks.push(remaining.slice(0, cut).trim());
      remaining = remaining.slice(cut).trim();
    }
    if (remaining) chunks.push(remaining);
    return chunks;
  }, []);

  const speakText = useCallback((value) => {
    if (!window.speechSynthesis || typeof window.SpeechSynthesisUtterance === 'undefined') return false;
    const chunks = splitSpeechChunks(value);
    if (!chunks.length) return false;

    const voices = window.speechSynthesis.getVoices?.() || [];
    const preferred = voices.find((voice) => /en(-|_)?(IN|US|GB)/i.test(voice.lang || '')) || voices[0];
    const queue = [...chunks];
    speechQueueRef.current = queue;
    isSpeakingRef.current = true;

    const speakNext = () => {
      if (!speechQueueRef.current.length) {
        isSpeakingRef.current = false;
        return;
      }
      const chunk = speechQueueRef.current.shift();
      const utterance = new window.SpeechSynthesisUtterance(chunk);
      if (preferred) utterance.voice = preferred;
      utterance.lang = preferred?.lang || 'en-US';
      utterance.rate = 0.98;
      utterance.pitch = 1;
      utterance.volume = 1;
      utterance.onstart = () => {
        setVoiceError('');
        setVoiceStatus('connected');
      };
      utterance.onend = () => {
        speakNext();
      };
      utterance.onerror = (event) => {
        const errorType = String(event?.error || '').toLowerCase();
        if (errorType === 'interrupted' || errorType === 'canceled' || errorType === 'cancelled') {
          isSpeakingRef.current = false;
          return;
        }
        setVoiceError('AI voice playback failed in this browser.');
        isSpeakingRef.current = false;
      };

      window.speechSynthesis.resume?.();
      window.speechSynthesis.speak(utterance);
    };

    if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
      window.speechSynthesis.cancel();
    }
    speakNext();
    return true;
  }, [splitSpeechChunks]);

  useEffect(() => {
    if (!aiVoiceEnabled || !speakerEnabled) {
      speechQueueRef.current = [];
      isSpeakingRef.current = false;
      window.speechSynthesis?.cancel();
      return;
    }
    const latestAiMessage = [...messages].reverse().find((msg) => msg.role === 'ai');
    const text = latestAiMessage?.content?.trim();
    if (!text || text === lastSpokenAiMessageRef.current) return;
    const played = speakText(text);
    if (!played) {
      setVoiceError('AI voice playback failed in this browser.');
      return;
    }
    lastSpokenAiMessageRef.current = text;
    return undefined;
  }, [messages, aiVoiceEnabled, speakerEnabled, speakText]);

  useEffect(() => {
    const synth = window.speechSynthesis;
    if (!synth) return undefined;
    const handleVoicesChanged = () => {
      // noop listener to ensure browser hydrates voice list before first speak
      synth.getVoices();
    };
    synth.getVoices();
    synth.addEventListener?.('voiceschanged', handleVoicesChanged);
    return () => synth.removeEventListener?.('voiceschanged', handleVoicesChanged);
  }, []);

  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cameraStream]);


  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isMonitoringCode, isTyping, toolsTab]);

  const syncInterviewState = useCallback((interview) => {
    if (!interview) return;
    setIsComplete(Boolean(interview.completed));
    setCurrentPhase(interview.currentPhase || '');
    const problem = getProblemData(interview);
    setProblemTitle(problem.title);
    setProblemLink(problem.link);
    setProblemContent(problem.content);
    setRepoName(interview?.question?.repoName || '');
  }, []);

  const startInterview = useCallback(async () => {
    setIsStarting(true);
    setError('');
    setMessages([]);
    setSessionId(null);
    setIsComplete(false);
    setCurrentPhase('');
    setProblemTitle('');
    setProblemLink('');
    setProblemContent('');
    setRepoName('');
    setCode(STARTER_CODE.cpp);
    setLanguage('cpp');
    setTimerSeconds(0);
    setReport(null);
    setVoiceError('');
    lastReviewedCodeRef.current = '';
    lastSpokenAiMessageRef.current = '';

    if (isResumeSession && !resumeContext) {
      setError('Please upload your resume first for Resume Session interviews.');
      setIsStarting(false);
      return;
    }

    try {
      const res = await fetch(`${API}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: localStorage.getItem('token') || 'anonymous',
          userName: localStorage.getItem('userName') || 'Candidate',
          topic,
          repoUrl: isProjectTrack ? repoUrl.trim() : '',
          resumeContext: isResumeSession ? resumeContext : null
        })
      });
      const data = await readApiResponse(res);
      if (!res.ok) throw new Error(data.error || 'Failed to start interview');
      setSessionId(data._id);
      setMessages(data.messages || []);
      lastSpokenAiMessageRef.current = '';
      syncInterviewState(data);
      setView('live');
      roomIdRef.current = data._id;
      localStorage.setItem('prepdost_session_id', data._id);
      localStorage.setItem('prepdost_user_id', userIdRef.current);
    } catch (err) {
      setError(err.message || 'Failed to start interview');
    } finally {
      setIsStarting(false);
    }
  }, [topic, repoUrl, isResumeSession, isProjectTrack, syncInterviewState, resumeContext]);

  const unlockAiVoice = useCallback(() => {
    if (!window.speechSynthesis || typeof window.SpeechSynthesisUtterance === 'undefined') return;
    if (speechUnlockedRef.current) return;
    try {
      const unlockUtterance = new window.SpeechSynthesisUtterance(' ');
      unlockUtterance.volume = 0;
      unlockUtterance.rate = 1;
      unlockUtterance.pitch = 1;
      window.speechSynthesis.cancel();
      window.speechSynthesis.resume?.();
      window.speechSynthesis.speak(unlockUtterance);
      speechUnlockedRef.current = true;
    } catch {}
  }, []);

  const handleStartInterview = useCallback(() => {
    unlockAiVoice();
    startInterview();
  }, [unlockAiVoice, startInterview]);

  const handleResumeUpload = useCallback(async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError('');
    setIsAnalyzingResume(true);
    setResumeContext(null);
    setResumeFileName(file.name || '');

    try {
      const formData = new FormData();
      formData.append('resume', file);
      const res = await fetch(`${API}/resume-analyze`, {
        method: 'POST',
        body: formData
      });
      const data = await readApiResponse(res);
      if (!res.ok) throw new Error(data.error || 'Failed to analyze resume');
      setResumeContext(data.resumeContext || null);
    } catch (err) {
      setResumeFileName('');
      setResumeContext(null);
      setError(err.message || 'Failed to analyze resume');
    } finally {
      setIsAnalyzingResume(false);
      event.target.value = '';
    }
  }, []);

  const buildPeer = useCallback((initiator, stream) => {
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }
    if (!stream) return;
    const peer = new Peer({
      initiator,
      trickle: true,
      stream,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      }
    });

    peer.on('signal', (data) => {
      const socket = socketRef.current;
      if (!socket || !roomIdRef.current || !remoteUserId) return;
      socket.emit('signal', {
        roomId: roomIdRef.current,
        to: remoteUserId,
        from: userIdRef.current,
        payload: data
      });
    });

    peer.on('stream', (stream) => {
      setRemoteStream(stream);
      setVoiceStatus('connected');
    });

    peer.on('connect', () => {
      setVoiceStatus('connected');
    });

    peer.on('error', () => {
      setVoiceStatus('failed');
    });

    peer.on('close', () => {
      setVoiceStatus('reconnecting');
    });

    peerRef.current = peer;
  }, [remoteUserId]);

  const connectSocket = useCallback(() => {
    if (socketRef.current) return socketRef.current;
    const socket = io(SOCKET_BASE_URL || undefined, { transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      if (roomIdRef.current) {
        socket.emit('join-room', {
          roomId: roomIdRef.current,
          userId: userIdRef.current,
          role
        });
      }
    });

    socket.on('room-info', ({ participants: list }) => {
      setParticipants(list || []);
      const candidate = list?.find((person) => person.role === 'candidate')?.userId;
      const interviewer = list?.find((person) => person.role === 'interviewer')?.userId;
      const target = role === 'candidate' ? interviewer : candidate;
      setRemoteUserId(target || null);
    });

    socket.on('participant-joined', ({ userId, role: joinedRole }) => {
      setParticipants((prev) => {
        const next = [...prev.filter((item) => item.userId !== userId), { userId, role: joinedRole, status: 'connected' }];
        return next;
      });
      if (role === 'candidate' && joinedRole === 'interviewer') {
        setRemoteUserId(userId);
      }
      if (role === 'interviewer' && joinedRole === 'candidate') {
        setRemoteUserId(userId);
      }
    });

    socket.on('participant-left', ({ userId }) => {
      setParticipants((prev) => prev.filter((item) => item.userId !== userId));
      if (remoteUserId === userId) {
        setRemoteUserId(null);
        setVoiceStatus('reconnecting');
      }
    });

    socket.on('signal', ({ from, payload }) => {
      if (!peerRef.current && localStream) {
        buildPeer(role === 'candidate', localStream);
      }
      setRemoteUserId(from);
      try {
        peerRef.current?.signal(payload);
      } catch {
        setVoiceStatus('failed');
      }
    });

    socket.on('disconnect', () => {
      setVoiceStatus('reconnecting');
    });

    return socket;
  }, [role, remoteUserId, buildPeer, localStream]);

  const initVoice = useCallback(async () => {
    if (!roomIdRef.current) return;
    if (voiceStatus === 'connecting' || voiceStatus === 'connected') return;
    setVoiceError('');
    setVoiceStatus('requesting');
    try {
      let stream = null;
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Microphone access is not supported in this browser.');
      }
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getAudioTracks().forEach((track) => {
        track.enabled = !pushToTalkEnabled;
      });
      setLocalStream(stream);
      setVoiceStatus('connected');

      const socket = connectSocket();
      socket.emit('join-room', {
        roomId: roomIdRef.current,
        userId: userIdRef.current,
        role
      });

      if (remoteUserId && role === 'candidate') {
        buildPeer(true, stream);
      }
      if (remoteUserId && role === 'interviewer') {
        buildPeer(false, stream);
      }
    } catch (err) {
      setVoiceError(err.message || 'Unable to access microphone.');
      setVoiceStatus('failed');
    }
  }, [connectSocket, buildPeer, pushToTalkEnabled, remoteUserId, role, voiceStatus]);

  useEffect(() => {
    if (view !== 'live' || topic !== 'Project Experience') return;
    if (!speech.supported || speech.listening || isComplete) return;
    speech.start();
    return () => {
      speech.stop();
    };
  }, [view, topic, speech.supported, speech.listening, speech.start, speech.stop, isComplete]);

  const hydrateSession = useCallback(async (sessionId) => {
    if (!sessionId) return;
    try {
      const res = await fetch(`${API}/${sessionId}`);
      const data = await readApiResponse(res);
      if (!res.ok) return;
      setSessionId(data._id);
      setMessages(data.messages || []);
      syncInterviewState(data);
      setView('live');
    } catch {
      setError('Unable to restore the previous session.');
    }
  }, [syncInterviewState]);

  const teardownVoice = useCallback(() => {
    window.speechSynthesis?.cancel();
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }
    if (socketRef.current) {
      socketRef.current.emit('leave-room', { roomId: roomIdRef.current, userId: userIdRef.current });
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }
    setLocalStream(null);
    setRemoteStream(null);
    setVoiceStatus('idle');
  }, [localStream]);

  const exitInterview = useCallback(() => {
    teardownVoice();
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
    }
    setCameraStream(null);
    setCameraEnabled(false);
    setRemoteUserId(null);
    setParticipants([]);
    setSessionId(null);
    setMessages([]);
    setInput('');
    setLiveTranscript('');
    setError('');
    roomIdRef.current = null;
    voiceInitializedRef.current = false;
    localStorage.removeItem('prepdost_session_id');
    localStorage.removeItem('prepdost_user_id');
    setView('lobby');
  }, [teardownVoice, cameraStream]);

  useEffect(() => {
    if (view !== 'live') return undefined;
    const handleBack = () => {
      exitInterview();
    };
    window.addEventListener('popstate', handleBack);
    return () => window.removeEventListener('popstate', handleBack);
  }, [view, exitInterview]);

  useEffect(() => {
    if (view !== 'live') {
      if (voiceInitializedRef.current) {
        teardownVoice();
        voiceInitializedRef.current = false;
      }
      return;
    }

    const storedSession = localStorage.getItem('prepdost_session_id');
    const storedUserId = localStorage.getItem('prepdost_user_id');
    if (storedSession) {
      roomIdRef.current = storedSession;
    }
    if (storedUserId) {
      userIdRef.current = storedUserId;
    }
    if (roomIdRef.current && !voiceInitializedRef.current) {
      voiceInitializedRef.current = true;
      initVoice();
    }
  }, [view, initVoice, teardownVoice]);

  useEffect(() => {
    const storedSession = localStorage.getItem('prepdost_session_id');
    if (!storedSession || view !== 'lobby') return;
    // Keep manual resume available, but do not auto-jump into a previous session on refresh.
    roomIdRef.current = storedSession;
  }, [view]);

  useEffect(() => {
    if (!remoteUserId || !localStream) return;
    if (!peerRef.current && localStream) {
      buildPeer(role === 'candidate', localStream);
    }
  }, [remoteUserId, localStream, buildPeer, role]);

  useEffect(() => {
    if (!localStream) return;
    localStream.getAudioTracks().forEach((track) => {
      track.enabled = !pushToTalkEnabled;
    });
  }, [localStream, pushToTalkEnabled, role]);

  useEffect(() => {
    if (!pushToTalkEnabled) return;
    const handleKeyDown = (event) => {
      if (event.code !== 'Space' || !localStream) return;
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = true;
      });
    };
    const handleKeyUp = (event) => {
      if (event.code !== 'Space' || !localStream) return;
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = false;
      });
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [pushToTalkEnabled, localStream, role]);

  const fetchReport = useCallback(async (targetSessionId) => {
    if (!targetSessionId) return;
    try {
      const res = await fetch(`${API}/${targetSessionId}/report`);
      const data = await readApiResponse(res);
      if (res.ok) setReport(data);
    } catch {
      setReport(null);
    }
  }, []);

  useEffect(() => {
    if (isComplete && sessionId) fetchReport(sessionId);
  }, [isComplete, sessionId, fetchReport]);

  const requestCodeFeedback = useCallback(async (nextCode, options = {}) => {
    const { force = false } = options;
    if (!sessionId || topic !== 'DSA' || isComplete) {
      setError('Start an active DSA interview to request feedback.');
      return;
    }
    if (nextCode.trim().length < 20) {
      setError('Write a bit more code before requesting feedback.');
      return;
    }
    if (!force && nextCode === lastReviewedCodeRef.current) return;
    setIsMonitoringCode(true);
    setError('');
    try {
      const res = await fetch(`${API}/code-feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, code: nextCode, language })
      });
      const data = await readApiResponse(res);
      if (!res.ok) throw new Error(data.error || 'Feedback link disrupted');
      lastReviewedCodeRef.current = nextCode;
      if (data.skipped) {
        setError('No new code changes detected since the last review.');
        return;
      }
      setMessages(data.messages || []);
      setCurrentPhase(data.session?.currentPhase || '');
    } catch (err) {
      setError(err.message || 'Failed to retrieve code feedback');
    } finally {
      setIsMonitoringCode(false);
    }
  }, [sessionId, topic, isComplete, language]);

  useEffect(() => {
    if (topic !== 'DSA' || !sessionId || isComplete) return undefined;
    if (codeMonitorTimerRef.current) clearTimeout(codeMonitorTimerRef.current);
    codeMonitorTimerRef.current = setTimeout(() => {
      requestCodeFeedback(code);
    }, 30000);
    return () => {
      if (codeMonitorTimerRef.current) clearTimeout(codeMonitorTimerRef.current);
    };
  }, [code, topic, sessionId, isComplete, requestCodeFeedback]);

  const handleSend = useCallback(async () => {
    const answer = input.trim();
    if (!answer || !sessionId || isTyping) return;
    const optimisticMessages = [...messages, { role: 'user', content: answer }];
    setMessages(optimisticMessages);
    setInput('');
    setError('');
    setIsTyping(true);
    try {
      const res = await fetch(`${API}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, answer })
      });
      const data = await readApiResponse(res);
      if (!res.ok) throw new Error(data.error || 'Response transmission failed');
      setMessages(data.interview?.messages || optimisticMessages);
      syncInterviewState(data.interview);
      if (data.interview?.completed) setIsComplete(true);
    } catch (err) {
      setMessages(optimisticMessages);
      setInput(answer);
      setError(err.message || 'Message delivery failed');
    } finally {
      setIsTyping(false);
    }
  }, [input, sessionId, isTyping, messages, syncInterviewState]);

  const transcriptItems = useMemo(
    () => messages.map((msg, idx) => ({
      id: msg._id || idx,
      role: msg.role === 'user' ? 'Candidate' : 'PrepDost AI',
      content: msg.content
    })),
    [messages]
  );

  const enableCamera = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Camera access is not supported in this browser.');
      return;
    }
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      setCameraStream(stream);
      setCameraEnabled(true);
    } catch (err) {
      setCameraError(err.message || 'Unable to access camera.');
      setCameraEnabled(false);
    }
  }, []);

  const disableCamera = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
    }
    setCameraStream(null);
    setCameraEnabled(false);
  }, [cameraStream]);

  return (
    <div className="h-screen flex flex-col bg-slate-50 text-slate-900 overflow-hidden selection:bg-emerald-200">
      <header className="h-20 border-b border-slate-200 bg-white flex items-center px-6 lg:px-8 gap-6 shadow-soft relative z-30">
        <Link
          to="/"
          onClick={() => {
            if (view === 'live') exitInterview();
          }}
          className="w-12 h-12 rounded-2xl border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all"
        >
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-soft">
            <Bot className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-bold tracking-tight">PrepDost Mock Interview</h1>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Free interview studio</span>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 uppercase tracking-widest text-[9px] font-bold">
            Free stack
          </Badge>
          <Badge className="bg-slate-100 text-slate-600 border-slate-200 uppercase tracking-widest text-[9px] font-bold">
            Web + editor + board
          </Badge>
        </div>
      </header>

      {view === 'lobby' && (
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-6 lg:px-10 py-12">
            <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-10 items-start">
              <div className="space-y-8">
                <div className="surface p-8 rounded-[36px] border-slate-200 shadow-soft">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-[0.4em]">Lobby</p>
                      <h2 className="text-3xl font-bold text-slate-900 mt-3">Get interview-ready in one room</h2>
                      <p className="text-slate-600 mt-3 leading-relaxed">
                        Launch a real-time mock interview with a free AI conductor, coding space, whiteboard, notes, and transcript.
                      </p>
                    </div>
                    <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                      <Crown className="w-8 h-8 text-emerald-600" />
                    </div>
                  </div>

                  <div className="mt-8 grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Interview track</label>
                      <select
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        className="mt-2 w-full bg-white border border-slate-200 rounded-2xl px-5 py-3 text-sm font-semibold text-slate-900 focus:outline-none focus:border-emerald-400"
                      >
                        {TOPICS.map((item) => (
                          <option key={item} value={item} className="bg-white">{item}</option>
                        ))}
                      </select>
                    </div>
                    {isDsa && (
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Preferred language</label>
                        <select
                          value={language}
                          onChange={(e) => {
                            const nextLanguage = e.target.value;
                            setLanguage(nextLanguage);
                            setCode(STARTER_CODE[nextLanguage] || '');
                          }}
                          className="mt-2 w-full bg-white border border-slate-200 rounded-2xl px-5 py-3 text-sm font-semibold text-slate-900 focus:outline-none focus:border-emerald-400"
                        >
                          {Object.entries(LANG_MAP).map(([key, value]) => (
                            <option key={key} value={key} className="bg-white">{value.label}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                    <div className="mt-6 grid md:grid-cols-1 gap-6">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Voice mode</label>
                      <div className="mt-2 flex items-center gap-3">
                        <button
                          onClick={() => setPushToTalkEnabled((value) => !value)}
                          className={`flex-1 h-12 rounded-2xl text-[10px] font-bold uppercase tracking-widest border transition-all ${
                            pushToTalkEnabled ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-500 border-slate-200'
                          }`}
                        >
                          {pushToTalkEnabled ? 'Push-to-talk' : 'Open mic'}
                        </button>
                      </div>
                      <p className="mt-2 text-xs text-slate-500">Hold space to speak when push-to-talk is enabled.</p>
                    </div>
                  </div>

                  {isProjectExperience && (
                    <div className="mt-6 space-y-4">
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Project Setup</p>
                        <label className="mt-3 block text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Project repository</label>
                        <div className="mt-2 flex flex-col md:flex-row gap-4">
                          <input
                            type="url"
                            value={repoUrl}
                            onChange={(e) => setRepoUrl(e.target.value)}
                            placeholder="https://github.com/org/project"
                            className="flex-1 bg-white border border-slate-200 rounded-2xl px-6 py-3 text-sm font-medium text-slate-900 focus:outline-none focus:border-emerald-400"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {isResumeSession && (
                    <div className="mt-6 space-y-4">
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Resume Session</p>
                        <p className="mt-2 text-xs text-slate-500">Upload resume first, AI will scan it, then interview questions are generated from your profile.</p>
                        <label className="mt-3 block text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Upload resume (required)</label>
                        <div className="mt-2 flex items-center gap-3">
                          <label className="h-11 px-5 rounded-2xl border border-slate-200 bg-white text-slate-700 text-xs font-bold uppercase tracking-widest flex items-center cursor-pointer hover:bg-slate-50">
                            {isAnalyzingResume ? 'Analyzing...' : 'Upload resume'}
                            <input
                              type="file"
                              accept=".pdf,.txt,.md,.doc,.docx"
                              className="hidden"
                              onChange={handleResumeUpload}
                              disabled={isAnalyzingResume}
                            />
                          </label>
                          <span className="text-xs text-slate-500">
                            {resumeContext ? `Analyzed: ${resumeFileName || 'Resume uploaded'}` : 'No resume uploaded'}
                          </span>
                        </div>
                        {resumeContext?.candidateSummary && (
                          <p className="mt-3 text-xs text-slate-600 leading-relaxed">
                            {resumeContext.candidateSummary}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="mt-6 flex items-center justify-between bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Recording consent</p>
                      <p className="text-xs text-slate-500">Required to generate transcript and summary.</p>
                    </div>
                    <button
                      onClick={() => setRecordingConsent((value) => !value)}
                      className={`h-10 px-4 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                        recordingConsent ? 'bg-emerald-600 text-white shadow-soft' : 'bg-white border border-slate-200 text-slate-500'
                      }`}
                    >
                      {recordingConsent ? 'Consent given' : 'Give consent'}
                    </button>
                  </div>

                  {error && (
                    <div className="mt-4 bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold uppercase tracking-widest px-6 py-4 rounded-2xl">
                      {error}
                    </div>
                  )}

                  <div className="mt-8 flex items-center justify-center gap-4">
                    <Button
                      size="lg"
                      className="h-14 px-8"
                      onClick={handleStartInterview}
                      disabled={isStarting || !recordingConsent || (isResumeSession && (!resumeContext || isAnalyzingResume))}
                    >
                      {isStarting ? 'Starting...' : 'Start interview'}
                    </Button>
                    {roomIdRef.current && (
                      <Button
                        variant="secondary"
                        className="h-14 px-6"
                        onClick={() => hydrateSession(roomIdRef.current)}
                      >
                        Continue previous session
                      </Button>
                    )}
                    <span className="text-xs text-slate-500">
                      Runs on free services and local browser features.
                    </span>
                  </div>
                  {!recordingConsent && (
                    <p className="mt-3 text-xs text-amber-600 font-semibold">
                      Enable consent to unlock the transcript and summary features.
                    </p>
                  )}
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  {[
                    { label: 'Live coding', detail: 'Monaco editor, free languages', icon: Code2 },
                    { label: 'Whiteboard', detail: 'Sketch system design on canvas', icon: PanelRight },
                    { label: 'Transcript', detail: 'Auto summary from chat flow', icon: FileText }
                  ].map((item) => (
                    <div key={item.label} className="surface p-6 rounded-3xl border-slate-200 shadow-soft">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                        <item.icon className="w-5 h-5 text-emerald-600" />
                      </div>
                      <h3 className="mt-4 text-lg font-bold text-slate-900">{item.label}</h3>
                      <p className="mt-2 text-sm text-slate-600 leading-relaxed">{item.detail}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <div className="surface-strong p-8 rounded-[32px] border-slate-200 shadow-soft">
                  <div className="flex items-center gap-3">
                    <Shield className="w-6 h-6 text-emerald-600" />
                    <h3 className="text-xl font-bold text-slate-900">Session checklist</h3>
                  </div>
                  <ul className="mt-6 space-y-4 text-sm text-slate-600">
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 mt-2 rounded-full bg-emerald-500" />
                      Use DSA for live coding, System Design for architecture boards, or Project for repo deep dives.
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 mt-2 rounded-full bg-emerald-500" />
                      The transcript is generated from chat and voice notes; no paid APIs required.
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 mt-2 rounded-full bg-emerald-500" />
                      Data stays inside your session and resets when you exit the room.
                    </li>
                  </ul>
                </div>

                <div className="surface p-8 rounded-[32px] border-slate-200 shadow-soft">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.4em]">Preview</p>
                  <h3 className="mt-3 text-2xl font-bold text-slate-900">Your interview room</h3>
                  <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                    A three-panel workspace: interview stream, live coding or discussion, and tools panel.
                  </p>
                  <div className="mt-6 grid grid-cols-2 gap-4">
                    {[
                      { label: 'Live chat', icon: Bot },
                      { label: 'Timer + phases', icon: Clock },
                      { label: 'Code review', icon: Terminal },
                      { label: 'Participants', icon: Users }
                    ].map((item) => (
                      <div key={item.label} className="flex items-center gap-3 bg-white border border-slate-200 rounded-2xl px-4 py-3">
                        <item.icon className="w-4 h-4 text-slate-400" />
                        <span className="text-xs font-semibold text-slate-700">{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      )}

      {view === 'live' && (
        <main className="flex-1 flex overflow-hidden">
          <div className="flex-1 flex flex-col">
              <div className="border-b border-slate-200 bg-white px-6 lg:px-8 py-4 flex flex-wrap items-center gap-4 justify-between">
                <div className="flex items-center gap-4">
                  <Badge className="bg-slate-100 text-slate-600 border-slate-200 uppercase tracking-widest text-[9px] font-bold">
                    {topic}
                  </Badge>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Clock className="w-4 h-4" />
                    <span className="font-semibold">{formatTime(timerSeconds)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Sparkles className="w-4 h-4" />
                    <span className="font-semibold">Phase: {currentPhase.replace(/_/g, ' ') || 'intro'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Headphones className="w-4 h-4" />
                    <span className="font-semibold">Voice: {VOICE_STATUS_LABELS[voiceStatus] || voiceStatus}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Users className="w-4 h-4" />
                    <span className="font-semibold">Peers: {participants.length}</span>
                  </div>
                </div>
              <div className="flex items-center gap-3">
                <Button variant="secondary" className="h-10 px-4" onClick={exitInterview}>Exit</Button>
                <Button className="h-10 px-5" onClick={() => setIsComplete(true)}>End session</Button>
              </div>
            </div>

            <div className="flex-1 flex overflow-hidden relative">
              <audio ref={remoteAudioRef} autoPlay playsInline />
              <div className={`${isDsa ? 'w-[35%]' : 'w-[45%]'} min-w-[320px] border-r border-slate-200 flex flex-col bg-slate-50`}>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                  <div className="surface p-6 rounded-3xl border-slate-200 shadow-soft">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-[0.4em]">Live interviewer</p>
                        <h2 className="text-2xl font-bold text-slate-900 mt-2">PrepDost AI</h2>
                        <p className="text-sm text-slate-600 mt-2">Structured interview conductor, free tier.</p>
                      </div>
                      <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                        <Bot className="w-6 h-6 text-emerald-600" />
                      </div>
                    </div>
                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <div className="bg-white border border-slate-200 rounded-2xl p-3">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Candidate camera</p>
                        <div className="mt-2 rounded-xl overflow-hidden bg-slate-900/90 aspect-video flex items-center justify-center">
                          {cameraEnabled && cameraStream ? (
                            <video ref={cameraRef} autoPlay muted playsInline className="w-full h-full object-cover" />
                          ) : (
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Camera off</div>
                          )}
                        </div>
                        {cameraError && (
                          <p className="mt-2 text-[10px] text-rose-500 font-semibold">{cameraError}</p>
                        )}
                        <button
                          onClick={cameraEnabled ? disableCamera : enableCamera}
                          className={`mt-3 w-full h-9 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all ${
                            cameraEnabled ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-500 border-slate-200'
                          }`}
                        >
                          {cameraEnabled ? (
                            <span className="flex items-center justify-center gap-2"><VideoOff className="w-3.5 h-3.5" />Stop camera</span>
                          ) : (
                            <span className="flex items-center justify-center gap-2"><Video className="w-3.5 h-3.5" />Start camera</span>
                          )}
                        </button>
                      </div>
                      <div className="bg-white border border-slate-200 rounded-2xl p-3">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Voice controls</p>
                        <div className="mt-2 space-y-2">
                          <button
                            onClick={() => setSpeakerEnabled((value) => !value)}
                            className={`w-full h-9 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all ${
                              speakerEnabled ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-500 border-slate-200'
                            }`}
                          >
                            {speakerEnabled ? 'Speaker on' : 'Speaker off'}
                          </button>
                          <button
                            onClick={() => setAiVoiceEnabled((value) => !value)}
                            className={`w-full h-9 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all ${
                              aiVoiceEnabled ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-500 border-slate-200'
                            }`}
                          >
                            {aiVoiceEnabled ? 'AI voice on' : 'AI voice off'}
                          </button>
                          <div className="text-[10px] text-slate-400 uppercase tracking-widest flex items-center justify-between">
                            <span>Status</span>
                            <span className="text-emerald-600 font-bold">{VOICE_STATUS_LABELS[voiceStatus] || voiceStatus}</span>
                          </div>
                          {voiceError && (
                            <p className="text-[10px] text-rose-500 font-semibold">{voiceError}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-5">
                    {messages.map((msg, idx) => (
                      <motion.div
                        key={msg._id || idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[85%] rounded-[28px] px-5 py-4 text-sm leading-relaxed ${
                          msg.role === 'user'
                            ? 'bg-emerald-600 text-white shadow-soft'
                            : 'bg-white border border-slate-200 text-slate-800 shadow-soft'
                        }`}>
                          {msg.content}
                        </div>
                      </motion.div>
                    ))}

                    {isTyping && (
                      <div className="flex justify-start">
                        <div className="bg-white border border-slate-200 rounded-[28px] px-5 py-4 text-xs text-slate-500">
                          PrepDost AI is thinking...
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </div>

                <div className="p-4 border-t border-slate-200 bg-white">
                  <div className="flex items-center gap-3">
                    {speech.supported && (
                      <button
                        onClick={speech.toggle}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${
                          speech.listening ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-slate-200 text-slate-400'
                        }`}
                      >
                        {speech.listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                      </button>
                    )}
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                      placeholder={isComplete ? 'Session completed' : 'Type your response...'}
                      disabled={isComplete}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-medium text-slate-900 focus:outline-none focus:border-emerald-400 resize-none h-12"
                    />
                    <button
                      onClick={handleSend}
                      disabled={!input.trim() || isTyping || isComplete}
                      className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-40"
                    >
                      <Code2 className="w-5 h-5" />
                    </button>
                  </div>
                  {liveTranscript && speech.listening && (
                    <div className="mt-2 text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Voice: {liveTranscript}</div>
                  )}
                </div>
              </div>

              <div className="w-[32%] min-w-[300px] border-l border-slate-200 bg-white flex flex-col">
                <div className="flex border-b border-slate-200 bg-slate-50">
                  {TOOLS.map((tool) => (
                    <button
                      key={tool.id}
                      onClick={() => setToolsTab(tool.id)}
                      className={`flex-1 flex items-center justify-center gap-2 py-4 text-[10px] font-bold uppercase tracking-[0.2em] transition-all relative ${
                        toolsTab === tool.id ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      <tool.icon className="w-3.5 h-3.5" />
                      {tool.label}
                    </button>
                  ))}
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {toolsTab === 'whiteboard' && (
                    <div className="space-y-4">
                      {isDsa && (
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Problem</p>
                          <div className="mt-2">
                            <h4 className="text-sm font-bold text-slate-900">{problemTitle || 'Coding Problem'}</h4>
                            <pre className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-slate-700 font-medium">
{problemContent || 'Problem statement will appear here when the interview question loads.'}
                            </pre>
                          </div>
                        </div>
                      )}
                      <Whiteboard strokes={strokes} setStrokes={setStrokes} />
                    </div>
                  )}
                  {toolsTab === 'notes' && (
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Capture quick notes or evaluation points..."
                      className="w-full h-full min-h-[300px] bg-slate-50 border border-slate-200 rounded-3xl p-5 text-sm text-slate-700 focus:outline-none focus:border-emerald-400 resize-none"
                    />
                  )}
                  {toolsTab === 'transcript' && (
                    <div className="space-y-4">
                      {transcriptItems.length === 0 ? (
                        <div className="text-center text-xs text-slate-400 uppercase tracking-widest">Transcript will appear here</div>
                      ) : (
                        transcriptItems.map((entry) => (
                          <div key={entry.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{entry.role}</div>
                            <p className="mt-2 text-sm text-slate-700 leading-relaxed">{entry.content}</p>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                  {toolsTab === 'participants' && (
                    <div className="space-y-4">
                      {participants.length === 0 && (
                        <div className="text-center text-xs text-slate-400 uppercase tracking-widest">Waiting for others</div>
                      )}
                      {participants.map((person) => (
                        <div key={person.userId} className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                              <Users className="w-4 h-4 text-emerald-600" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{person.userId === userIdRef.current ? 'You' : person.userId}</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{person.role}</p>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">{person.status || 'online'}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {report && (
                  <div className="border-t border-slate-200 p-6 bg-white">
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-emerald-600">
                      <Sparkles className="w-4 h-4" />
                      Session summary
                    </div>
                    <div className="mt-4 space-y-4">
                      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                        <div className="text-xs text-slate-500 uppercase tracking-widest">Overall score</div>
                        <div className="text-2xl font-bold text-slate-900">{report.overallScore || 0}</div>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-900">Strengths</p>
                        <ul className="mt-2 space-y-2 text-sm text-slate-600">
                          {(report.strengths || []).slice(0, 3).map((item) => (
                            <li key={item} className="flex items-start gap-2">
                              <div className="w-2 h-2 mt-2 rounded-full bg-emerald-500" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-900">Improvements</p>
                        <ul className="mt-2 space-y-2 text-sm text-slate-600">
                          {(report.weaknesses || []).slice(0, 3).map((item) => (
                            <li key={item} className="flex items-start gap-2">
                              <div className="w-2 h-2 mt-2 rounded-full bg-rose-400" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex-1 flex flex-col overflow-hidden">
                {!isDsa && (
                  <div className="p-6 border-b border-slate-200 bg-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Interview prompt</p>
                        <h3 className="text-2xl font-bold text-slate-900 mt-2">{problemTitle || 'Interview overview'}</h3>
                        <p className="mt-2 text-sm text-slate-600 leading-relaxed line-clamp-2">{problemContent || 'Answer the questions clearly and walk through your reasoning.'}</p>
                      </div>
                      {problemLink && (
                        <a href={problemLink} target="_blank" rel="noopener noreferrer" className="surface p-3 rounded-xl border-slate-200 hover:border-emerald-200 transition-all">
                          <ExternalLink className="w-5 h-5 text-slate-400" />
                        </a>
                      )}
                    </div>
                    {repoName && (
                      <div className="mt-3 text-xs text-slate-500 flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        {repoName}
                      </div>
                    )}
                  </div>
                )}

                {isDsa ? (
                  <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="h-12 px-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                      <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                        <Terminal className="w-4 h-4" />
                        Code workspace
                      </div>
                      <div className="flex items-center gap-3">
                        <select
                          value={language}
                          onChange={(e) => {
                            const nextLanguage = e.target.value;
                            setLanguage(nextLanguage);
                            setCode(STARTER_CODE[nextLanguage] || '');
                            lastReviewedCodeRef.current = '';
                          }}
                          className="bg-white border border-slate-200 text-slate-700 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-xl"
                        >
                          {Object.entries(LANG_MAP).map(([key, value]) => (
                            <option key={key} value={key}>{value.label}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => requestCodeFeedback(code, { force: true })}
                          disabled={isStarting || isMonitoringCode || !sessionId || isComplete}
                          className="text-[9px] font-bold uppercase tracking-widest px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 transition-all disabled:opacity-40"
                        >
                          {isMonitoringCode ? 'Reviewing...' : 'Request feedback'}
                        </button>
                      </div>
                    </div>
                    <div className="flex-1 bg-slate-900">
                      <Editor
                        height="100%"
                        language={LANG_MAP[language]?.monaco || 'cpp'}
                        theme="vs-dark"
                        value={code}
                        onChange={(value) => setCode(value || '')}
                        options={{
                          minimap: { enabled: false },
                          fontSize: 14,
                          padding: { top: 32, bottom: 32 },
                          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                          scrollBeyondLastLine: false,
                          lineNumbers: 'on',
                          backgroundColor: '#0f172a',
                          renderLineHighlight: 'all',
                          cursorBlinking: 'smooth',
                          smoothScrolling: true,
                          automaticLayout: true,
                          tabSize: 4,
                          insertSpaces: true,
                          autoIndent: 'full',
                          detectIndentation: true,
                          guides: { indentation: false },
                          renderIndentGuides: false,
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 grid md:grid-cols-2 gap-6 p-6 overflow-y-auto">
                    {[
                      { title: 'Answer structure', detail: 'Use STAR or clear phases, call out tradeoffs and impact.', icon: ClipboardCheck },
                      { title: 'Ownership spotlight', detail: 'Explain your personal contributions and key decisions.', icon: Shield },
                      { title: 'Metrics to mention', detail: 'Latency, scale, adoption, cost, or user impact numbers.', icon: Sparkles },
                      { title: 'Architecture notes', detail: 'Sketch components and data flow in the whiteboard.', icon: PanelRight }
                    ].map((card) => (
                      <div key={card.title} className="surface p-6 rounded-3xl border-slate-200 shadow-soft">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                          <card.icon className="w-5 h-5 text-emerald-600" />
                        </div>
                        <h4 className="mt-4 text-lg font-bold text-slate-900">{card.title}</h4>
                        <p className="mt-2 text-sm text-slate-600 leading-relaxed">{card.detail}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {error && (
                <div className="absolute bottom-6 right-[34%] bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold uppercase tracking-widest px-6 py-3 rounded-2xl shadow-soft">
                  {error}
                </div>
              )}
            </div>
          </div>
        </main>
      )}
    </div>
  );
}
