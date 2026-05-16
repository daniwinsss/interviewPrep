import React, { useEffect, useRef, useState, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { Bot, Send, ArrowLeft, Loader2, ExternalLink, Code2, ChevronDown, Mic, MicOff, Volume2, VolumeX, Shield, Sparkles, Terminal, Globe, Zap, Cpu, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleGenAI, Modality } from '@google/genai';
import { apiUrl } from '../lib/api';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';

const API = apiUrl('/api/ai/interview');
const TOPICS = ['DSA', 'Behavioral', 'System Design', 'Project Experience'];
const LIVE_VOICE_STARTUP_TIMEOUT_MS = 10000;
const LIVE_VOICE_STABILITY_WINDOW_MS = 2500;
const LANG_MAP = {
  cpp: { label: 'C++', monaco: 'cpp' },
  java: { label: 'Java', monaco: 'java' },
  python: { label: 'Python', monaco: 'python' }
};

const STARTER_CODE = {
  cpp: '#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n\n    \n    return 0;\n}\n',
  java: 'import java.io.*;\nimport java.util.*;\n\npublic class Main {\n    public static void main(String[] args) throws Exception {\n        \n    }\n}\n',
  python: 'def solve():\n    pass\n\nif __name__ == "__main__":\n    solve()\n'
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

export default function Interview() {
  const [topic, setTopic] = useState('DSA');
  const [repoUrl, setRepoUrl] = useState('');
  const [sessionSeed, setSessionSeed] = useState(0);
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isStarting, setIsStarting] = useState(true);
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
  const [speechSupported, setSpeechSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [spokenReplyEnabled, setSpokenReplyEnabled] = useState(true);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [voiceMode, setVoiceMode] = useState('fallback_active');
  const [voiceStatus, setVoiceStatus] = useState('Standard Voice Engine Active');
  const [liveSessionStatus, setLiveSessionStatus] = useState('idle');

  const messagesEndRef = useRef(null);
  const codeMonitorTimerRef = useRef(null);
  const lastReviewedCodeRef = useRef('');
  const recognitionRef = useRef(null);
  const spokenMessageIdsRef = useRef(new Set());
  const liveSessionRef = useRef(null);
  const liveMediaRecorderRef = useRef(null);
  const liveMediaStreamRef = useRef(null);
  const liveStartupTimerRef = useRef(null);
  const liveStabilityTimerRef = useRef(null);
  const liveConnectionAttemptRef = useRef(0);
  const liveReadyRef = useRef(false);
  const liveStartupCompleteRef = useRef(false);
  const liveSessionInitializedRef = useRef(false);
  const liveIntentionallyClosingRef = useRef(false);
  const liveCloseQueuedRef = useRef(false);

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isMonitoringCode, isTyping]);

  useEffect(() => {
    const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      setSpeechSupported(false);
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
      setLiveTranscript(transcript);
      const lastResult = event.results[event.results.length - 1];
      if (lastResult?.isFinal && transcript) {
        setInput(transcript);
      }
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    setSpeechSupported(true);
    return () => {
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      try { recognition.stop(); } catch {}
    };
  }, []);

  useEffect(() => {
    if (!spokenReplyEnabled || !window.speechSynthesis || voiceMode === 'live_ready') return;
    const lastAiMessage = [...messages].reverse().find((msg) => msg.role !== 'user');
    if (!lastAiMessage?.content) return;
    const messageKey = lastAiMessage._id || `${messages.length}:${lastAiMessage.content}`;
    if (spokenMessageIdsRef.current.has(messageKey)) return;
    spokenMessageIdsRef.current.add(messageKey);
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(lastAiMessage.content);
    window.speechSynthesis.speak(utterance);
  }, [messages, spokenReplyEnabled, voiceMode]);

  const clearLiveTimers = useCallback(() => {
    if (liveStartupTimerRef.current) { clearTimeout(liveStartupTimerRef.current); liveStartupTimerRef.current = null; }
    if (liveStabilityTimerRef.current) { clearTimeout(liveStabilityTimerRef.current); liveStabilityTimerRef.current = null; }
  }, []);

  const stopBrowserListening = useCallback(() => {
    if (!recognitionRef.current) return;
    try { recognitionRef.current.stop(); } catch {}
    setIsListening(false);
  }, []);

  const activateFallbackVoice = useCallback((nextStatus = 'Standard Voice Engine Active') => {
    liveIntentionallyClosingRef.current = true;
    clearLiveTimers();
    liveReadyRef.current = false;
    liveStartupCompleteRef.current = false;
    liveSessionInitializedRef.current = false;
    liveCloseQueuedRef.current = false;
    if (liveMediaRecorderRef.current?.state === 'recording') liveMediaRecorderRef.current.stop();
    liveMediaRecorderRef.current = null;
    if (liveMediaStreamRef.current) {
      liveMediaStreamRef.current.getTracks().forEach((track) => track.stop());
      liveMediaStreamRef.current = null;
    }
    liveSessionRef.current?.close?.();
    liveSessionRef.current = null;
    setVoiceMode('fallback_active');
    setLiveSessionStatus('idle');
    setLiveTranscript('');
    setVoiceStatus(nextStatus);
  }, [clearLiveTimers]);

  const restartInterview = useCallback(() => setSessionSeed((value) => value + 1), []);

  useEffect(() => {
    let ignore = false;
    async function startInterview() {
      setIsStarting(true);
      setError('');
      setInput('');
      setMessages([]);
      setSessionId(null);
      setIsComplete(false);
      setCurrentPhase('');
      setProblemTitle('');
      setProblemLink('');
      setProblemContent('');
      setRepoName('');
      setLanguage('cpp');
      setCode(STARTER_CODE.cpp);
      lastReviewedCodeRef.current = '';
      spokenMessageIdsRef.current.clear();
      setVoiceMode('fallback_active');
      setLiveSessionStatus('idle');
      setVoiceStatus('Standard Voice Engine Active');
      setLiveTranscript('');
      stopBrowserListening();
      if (codeMonitorTimerRef.current) { clearTimeout(codeMonitorTimerRef.current); codeMonitorTimerRef.current = null; }
      activateFallbackVoice('Standard Voice Engine Active');
      try {
        const res = await fetch(`${API}/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: localStorage.getItem('token') || 'anonymous',
            userName: localStorage.getItem('userName') || 'Candidate',
            topic,
            repoUrl: topic === 'Project Experience' ? repoUrl.trim() : ''
          })
        });
        const data = await readApiResponse(res);
        if (!res.ok) throw new Error(data.error || 'Failed to start interview');
        if (ignore) return;
        setSessionId(data._id);
        setMessages(data.messages || []);
        syncInterviewState(data);
      } catch (err) {
        if (ignore) return;
        setError(err.message || 'Failed to start interview');
      } finally {
        if (!ignore) setIsStarting(false);
      }
    }
    startInterview();
    return () => { ignore = true; };
  }, [topic, sessionSeed, syncInterviewState, activateFallbackVoice, stopBrowserListening]);

  const stopLiveVoiceSession = useCallback((nextStatus = 'Standard Voice Engine Active') => {
    activateFallbackVoice(nextStatus);
  }, [activateFallbackVoice]);

  const startLiveVoiceSession = useCallback(async () => {
    if (voiceMode === 'connecting' || voiceMode === 'live_ready') return;
    setError('');
    stopBrowserListening();
    activateFallbackVoice('Synchronizing Neural Voice Link...');
    setVoiceMode('connecting');
    setLiveSessionStatus('connecting');
    setVoiceStatus('Synchronizing Neural Voice Link...');
    const attemptId = Date.now();
    liveConnectionAttemptRef.current = attemptId;
    liveIntentionallyClosingRef.current = false;
    liveSessionInitializedRef.current = false;
    liveStartupCompleteRef.current = false;
    liveReadyRef.current = false;
    liveCloseQueuedRef.current = false;

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Microphone access unsupported. Defaulting to standard engine.');
      }
      liveStartupTimerRef.current = setTimeout(() => {
        if (liveConnectionAttemptRef.current !== attemptId) return;
        setError('Live handshake timed out. Reverting to standard engine.');
        activateFallbackVoice('Standard Voice Engine Active');
      }, LIVE_VOICE_STARTUP_TIMEOUT_MS);

      const tokenResponse = await fetch(`${API}/live-token`, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
      const tokenData = await readApiResponse(tokenResponse);
      if (!tokenResponse.ok) throw new Error(tokenData.error || 'Failed to authorize voice session');

      const ai = new GoogleGenAI({ apiKey: tokenData.token, apiVersion: 'v1alpha' });
      const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (liveConnectionAttemptRef.current !== attemptId) {
        mediaStream.getTracks().forEach((track) => track.stop());
        return;
      }
      liveMediaStreamRef.current = mediaStream;

      const session = await ai.live.connect({
        model: tokenData.model || 'gemini-2.5-flash-native-audio-preview-12-2025',
        config: { responseModalities: [Modality.AUDIO], outputAudioTranscription: {}, inputAudioTranscription: {} },
        callbacks: {
          onopen: () => {
            if (liveConnectionAttemptRef.current !== attemptId) return;
            if (liveStartupTimerRef.current) { clearTimeout(liveStartupTimerRef.current); liveStartupTimerRef.current = null; }
            setLiveSessionStatus('warming_up');
            setVoiceStatus('Neural Link Established. Stabilizing... ');
            liveStabilityTimerRef.current = setTimeout(() => {
              if (liveConnectionAttemptRef.current !== attemptId || !liveSessionRef.current || liveCloseQueuedRef.current || liveIntentionallyClosingRef.current) return;
              liveStartupCompleteRef.current = true;
              liveReadyRef.current = true;
              clearLiveTimers();
              setVoiceMode('live_ready');
              setLiveSessionStatus('live_ready');
              setVoiceStatus('Neural Voice Interface Active');
            }, LIVE_VOICE_STABILITY_WINDOW_MS);
          },
          onmessage: (event) => {
            if (liveConnectionAttemptRef.current !== attemptId) return;
            if (event.serverContent?.inputTranscription?.text) setLiveTranscript(event.serverContent.inputTranscription.text);
            if (event.serverContent?.outputTranscription?.text) {
              const text = event.serverContent.outputTranscription.text;
              if (!liveReadyRef.current && liveSessionRef.current) {
                liveReadyRef.current = true;
                liveStartupCompleteRef.current = true;
                clearLiveTimers();
                setVoiceMode('live_ready');
                setLiveSessionStatus('live_ready');
                setVoiceStatus('Neural Voice Interface Active');
              }
              setMessages((prev) => [...prev, { role: 'ai', content: text }]);
            }
          },
          onerror: (event) => {
            console.error('Gemini Live error:', event);
            if (liveConnectionAttemptRef.current !== attemptId) return;
            setError('Neural link disrupted. Reverting to standard engine.');
            stopLiveVoiceSession('Standard Voice Engine Active');
          },
          onclose: () => {
            if (liveConnectionAttemptRef.current !== attemptId || liveIntentionallyClosingRef.current) return;
            if (!liveSessionInitializedRef.current) { liveCloseQueuedRef.current = true; return; }
            if (!liveStartupCompleteRef.current) setError('Neural link closed prematurely.');
            stopLiveVoiceSession('Standard Voice Engine Active');
          }
        }
      });

      if (liveConnectionAttemptRef.current !== attemptId) { session.close?.(); return; }
      liveSessionRef.current = session;
      liveSessionInitializedRef.current = true;
      if (liveCloseQueuedRef.current) {
        liveCloseQueuedRef.current = false;
        setError('Neural link closed during startup.');
        stopLiveVoiceSession('Standard Voice Engine Active');
        return;
      }

      const recorder = new MediaRecorder(mediaStream, { mimeType: 'audio/webm' });
      liveMediaRecorderRef.current = recorder;
      recorder.ondataavailable = async (event) => {
        if (liveConnectionAttemptRef.current !== attemptId || !event.data || event.data.size === 0 || !liveSessionRef.current || !liveReadyRef.current) return;
        try { liveSessionRef.current.sendRealtimeInput({ media: event.data }); } catch (error) { stopLiveVoiceSession(); }
      };
      recorder.onstop = () => {
        if (!liveSessionRef.current || !liveReadyRef.current) return;
        try { liveSessionRef.current.sendRealtimeInput({ audioStreamEnd: true }); } catch {}
      };
      recorder.start(1000);
    } catch (err) {
      console.error(err);
      if (liveConnectionAttemptRef.current !== attemptId) return;
      setError(err.message || 'Failed to initiate Neural Voice Link');
      stopLiveVoiceSession('Standard Voice Engine Active');
    }
  }, [voiceMode, stopBrowserListening, activateFallbackVoice, stopLiveVoiceSession, clearLiveTimers]);

  useEffect(() => () => {
    stopBrowserListening();
    activateFallbackVoice('Standard Voice Engine Active');
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  }, [activateFallbackVoice, stopBrowserListening]);

  const toggleListening = useCallback(() => {
    if (voiceMode === 'live_ready' || voiceMode === 'connecting') {
      stopLiveVoiceSession('Standard Voice Engine Active');
      return;
    }
    if (!recognitionRef.current) {
      setError('Voice input unsupported in this environment.');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }
    setLiveTranscript('');
    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch {
      setError('Failed to activate voice input. Check microphone permissions.');
    }
    setVoiceMode('fallback_active');
    setVoiceStatus('Standard Voice Engine Active');
  }, [isListening, voiceMode, stopLiveVoiceSession]);

  const toggleSpokenReplies = useCallback(() => {
    if (!window.speechSynthesis) {
      setError('Speech synthesis unsupported.');
      return;
    }
    if (spokenReplyEnabled) window.speechSynthesis.cancel();
    setSpokenReplyEnabled((value) => !value);
  }, [spokenReplyEnabled]);

  const requestCodeFeedback = useCallback(async (nextCode) => {
    if (!sessionId || topic !== 'DSA' || isComplete) return;
    if (nextCode.trim().length < 20) return;
    if (nextCode === lastReviewedCodeRef.current) return;
    setIsMonitoringCode(true);
    try {
      const res = await fetch(`${API}/code-feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, code: nextCode, language })
      });
      const data = await readApiResponse(res);
      if (!res.ok) throw new Error(data.error || 'Feedback link disrupted');
      lastReviewedCodeRef.current = nextCode;
      if (!data.skipped) {
        setMessages(data.messages || []);
        setCurrentPhase(data.session?.currentPhase || '');
      }
    } catch (err) {
      setError(err.message || 'Failed to retrieve code review');
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
    return () => { if (codeMonitorTimerRef.current) clearTimeout(codeMonitorTimerRef.current); };
  }, [code, topic, sessionId, isComplete, requestCodeFeedback]);

  async function handleSend() {
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
    } catch (err) {
      setMessages(optimisticMessages);
      setInput(answer);
      setError(err.message || 'Signal lost during transmission');
    } finally {
      setIsTyping(false);
    }
  }

  const isDsa = topic === 'DSA';
  const isProject = topic === 'Project Experience';
  const liveVoiceActive = voiceMode === 'live_ready';
  const liveVoiceConnecting = voiceMode === 'connecting';

  return (
    <div className="h-screen flex flex-col bg-[#050505] text-white overflow-hidden selection:bg-accent/30">
      {/* Tactical Header */}
      <header className="h-20 border-b border-white/5 bg-[#0b0b0c] flex items-center px-8 gap-8 z-30 shadow-2xl relative">
        <Link to="/" className="w-12 h-12 rounded-2xl border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 transition-all">
          <ArrowLeft className="w-6 h-6" />
        </Link>

        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white text-black flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.2)]">
            <Bot className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-bold tracking-tight">AI CONDUCTOR</h1>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">Active Session</span>
            </div>
          </div>
        </div>

        <div className="h-10 w-px bg-white/5 mx-2" />

        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <span className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em] mb-1">Current Sector</span>
            <select
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              disabled={isStarting || isTyping}
              className="bg-transparent text-sm font-bold text-white outline-none cursor-pointer hover:text-accent transition-colors"
            >
              {TOPICS.map((item) => <option key={item} value={item} className="bg-[#0b0b0c]">{item}</option>)}
            </select>
          </div>
          
          {isDsa && (
            <div className="flex flex-col ml-4">
              <span className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em] mb-1">Pattern Engine</span>
              <select
                value={language}
                onChange={(e) => {
                  const nextLanguage = e.target.value;
                  setLanguage(nextLanguage);
                  setCode(STARTER_CODE[nextLanguage] || '');
                  lastReviewedCodeRef.current = '';
                }}
                disabled={isStarting}
                className="bg-transparent text-sm font-bold text-white outline-none cursor-pointer hover:text-accent transition-colors"
              >
                {Object.entries(LANG_MAP).map(([key, value]) => <option key={key} value={key} className="bg-[#0b0b0c]">{value.label}</option>)}
              </select>
            </div>
          )}
        </div>

        <div className="ml-auto flex items-center gap-4">
          <div className="flex flex-col items-end mr-4">
            <span className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em] mb-1">Audio Diagnostics</span>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold tracking-wider ${liveVoiceActive ? 'text-emerald-400' : 'text-white/40'}`}>
                {voiceStatus}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-white/5 p-1 rounded-2xl border border-white/5">
            {speechSupported && (
              <button
                onClick={toggleListening}
                disabled={isStarting || isTyping || isComplete}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                  isListening || liveVoiceActive || liveVoiceConnecting ? 'bg-white text-black shadow-lg' : 'text-white/40 hover:text-white'
                }`}
              >
                {isListening || liveVoiceActive || liveVoiceConnecting ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
            )}

            <button
              onClick={liveVoiceActive || liveVoiceConnecting ? () => stopLiveVoiceSession('Standard Voice Engine Active') : startLiveVoiceSession}
              disabled={isStarting || isTyping || isComplete}
              className={`h-10 px-5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                liveVoiceActive ? 'bg-accent text-white shadow-[0_0_20px_rgba(124,140,255,0.4)]' : 'text-white/60 hover:text-white'
              }`}
            >
              {liveVoiceConnecting ? 'Linking...' : liveVoiceActive ? 'Neural Link On' : 'Neural Link'}
            </button>

            <button
              onClick={toggleSpokenReplies}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                spokenReplyEnabled ? 'bg-white/10 text-white' : 'text-white/20'
              }`}
            >
              {spokenReplyEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {isProject && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="px-8 pt-6 z-20">
          <div className="surface p-6 rounded-3xl border-white/5 flex items-center gap-6 shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/30">
              <Globe className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <span className="text-[9px] font-bold text-white/30 uppercase tracking-[0.3em] block mb-2 text-center md:text-left">Target Repository Infrastructure</span>
              <div className="flex flex-col md:flex-row gap-4">
                <input
                  type="url"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="https://github.com/organization/infrastructure"
                  className="flex-1 bg-black/40 border border-white/5 rounded-2xl px-6 py-3 text-sm font-medium text-white/80 focus:outline-none focus:border-white/20 transition-all placeholder:text-white/10"
                />
                <Button onClick={restartInterview} disabled={isStarting || isTyping} variant="secondary" className="px-8 whitespace-nowrap h-12">
                  Synchronize Data
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {error && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="px-8 pt-6 z-20">
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold uppercase tracking-widest px-6 py-4 rounded-2xl flex items-center gap-3 shadow-lg">
            <AlertTriangle className="w-5 h-5" />
            {error}
          </div>
        </motion.div>
      )}

      <main className="flex-1 flex overflow-hidden p-8 gap-8 relative z-10">
        {/* Cinematic Watermark Overlay */}
        <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none opacity-[0.03]">
          <span className="text-[20vw] font-black tracking-tighter select-none">CONDUCTOR</span>
        </div>

        {/* Left: Chat Stream */}
        <div className={`${isDsa ? 'w-[45%]' : 'w-full'} flex flex-col gap-6 relative z-10`}>
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 flex flex-col gap-8 scroll-smooth">
            <AnimatePresence mode="popLayout">
              {isStarting ? (
                <motion.div key="starting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                  <div className="surface p-6 rounded-3xl rounded-tl-lg border-white/10 flex items-center gap-4 text-white/40">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-xs font-bold uppercase tracking-widest">Initializing Interview Core...</span>
                  </div>
                </motion.div>
              ) : (
                messages.map((msg, idx) => (
                  <motion.div
                    key={msg._id || idx}
                    initial={{ opacity: 0, y: 20, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[85%] relative group ${msg.role === 'user' ? 'order-1' : 'order-2'}`}>
                      <div className={`p-6 rounded-[32px] text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-white text-black font-medium rounded-tr-lg shadow-xl'
                          : 'surface-strong border border-white/5 text-white/90 rounded-tl-lg shadow-2xl backdrop-blur-md'
                      }`}>
                        {msg.role !== 'user' && (
                          <div className="flex items-center gap-2 mb-4">
                            <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center">
                              <Bot className="w-3.5 h-3.5 text-white/40" />
                            </div>
                            <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest">Conductor</span>
                          </div>
                        )}
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                      </div>
                      <div className={`absolute -bottom-6 flex gap-2 ${msg.role === 'user' ? 'right-4' : 'left-4'}`}>
                        <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest">
                          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}

              {isTyping && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
                  <div className="surface p-6 rounded-3xl rounded-tl-lg border-white/5 flex items-center gap-3">
                    <div className="flex gap-1">
                      <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0 }} className="w-1.5 h-1.5 rounded-full bg-accent" />
                      <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }} className="w-1.5 h-1.5 rounded-full bg-accent" />
                      <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.4 }} className="w-1.5 h-1.5 rounded-full bg-accent" />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={messagesEndRef} className="h-10" />
          </div>

          {/* Tactical Input */}
          <div className="relative group z-20">
            <div className="absolute -inset-1 bg-gradient-to-r from-accent/20 to-purple-500/20 rounded-[36px] blur-xl opacity-0 group-focus-within:opacity-100 transition-all duration-700" />
            <div className="relative surface-strong border border-white/10 rounded-[32px] p-2 flex items-center gap-3 shadow-2xl backdrop-blur-2xl">
              <textarea
                className="flex-1 bg-transparent border-none rounded-2xl px-6 py-4 text-sm font-medium text-white focus:outline-none resize-none h-[64px] custom-scrollbar placeholder:text-white/10"
                placeholder={isStarting ? 'Awaiting core initialization...' : isComplete ? 'Session cycle complete.' : 'Input response signal...'}
                value={input}
                disabled={isStarting || isTyping || !sessionId || isComplete}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isTyping || isStarting || !sessionId || isComplete}
                className="w-14 h-14 rounded-3xl bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-20 shadow-xl"
              >
                <Send className="w-6 h-6" />
              </button>
            </div>
            
            {(speechSupported || liveVoiceActive || liveVoiceConnecting) && liveTranscript && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="absolute -top-12 inset-x-8 px-4 py-2 bg-accent/20 border border-accent/30 rounded-xl backdrop-blur-xl">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent animate-ping" />
                  <span className="text-[10px] font-bold text-accent uppercase tracking-widest truncate">Voice Stream: {liveTranscript}</span>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Right: Tactical Information & Code */}
        {isDsa ? (
          <div className="flex-1 flex flex-col gap-6 relative z-10">
            {/* Sector Briefing Card */}
            <div className="surface p-8 rounded-[40px] border-white/5 relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 p-8 opacity-[0.05]">
                <Shield className="w-32 h-32" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-accent uppercase tracking-[0.3em] mb-2">Primary Objective</span>
                    <h2 className="text-2xl font-bold tracking-tight">{problemTitle || 'Signal Analysis'}</h2>
                  </div>
                  {problemLink && (
                    <a href={problemLink} target="_blank" rel="noopener noreferrer" className="surface p-3 rounded-xl border-white/10 hover:border-white/30 transition-all">
                      <ExternalLink className="w-5 h-5 text-white/60" />
                    </a>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-white/[0.03] p-4 rounded-2xl border border-white/5">
                    <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest block mb-1">Phase Marker</span>
                    <span className="text-xs font-bold text-white/70 uppercase tracking-wider">{currentPhase.replace(/_/g, ' ') || 'Evaluation'}</span>
                  </div>
                  <div className="bg-white/[0.03] p-4 rounded-2xl border border-white/5">
                    <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest block mb-1">Source Index</span>
                    <span className="text-xs font-bold text-white/70">{repoName || 'Internal Database'}</span>
                  </div>
                </div>

                <p className="text-sm text-white/50 leading-relaxed line-clamp-3 mb-6">{problemContent}</p>

                <div className="flex items-center gap-4">
                  <div className={`flex-1 h-1 rounded-full bg-white/5 overflow-hidden`}>
                    <motion.div initial={{ width: 0 }} animate={{ width: isComplete ? '100%' : '65%' }} className="h-full bg-accent" />
                  </div>
                  <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Progress Trace</span>
                </div>
              </div>
            </div>

            {/* Coding Environment */}
            <div className="flex-1 surface-strong rounded-[40px] border-white/5 overflow-hidden flex flex-col shadow-2xl relative">
              <div className="h-14 border-b border-white/5 flex items-center justify-between px-8 bg-white/[0.02] shrink-0">
                <div className="flex items-center gap-3">
                  <Terminal className="w-4 h-4 text-white/30" />
                  <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Neural Workspace</span>
                </div>
                <div className="flex items-center gap-4">
                  <AnimatePresence>
                    {isMonitoringCode && (
                      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                        <Loader2 className="w-3 h-3 animate-spin text-accent" />
                        <span className="text-[9px] font-bold text-accent uppercase tracking-widest">Scanning Signal...</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <button
                    onClick={() => requestCodeFeedback(code)}
                    disabled={isStarting || isMonitoringCode || !sessionId || isComplete}
                    className="text-[9px] font-bold uppercase tracking-widest px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all disabled:opacity-20"
                  >
                    Sync Pattern
                  </button>
                </div>
              </div>
              <div className="flex-1 bg-[#050505]">
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
                    backgroundColor: '#050505',
                    renderLineHighlight: 'all',
                    cursorBlinking: 'smooth',
                    smoothScrolling: true,
                    automaticLayout: true
                  }}
                />
              </div>
            </div>
          </div>
        ) : (
          /* Tactical Statistics for Non-DSA topics */
          <div className="hidden lg:flex w-80 flex-col gap-6">
            <div className="surface p-8 rounded-[40px] border-white/5 space-y-8">
              <div>
                <span className="text-[10px] font-bold text-accent uppercase tracking-[0.3em] block mb-4">Neural Analytics</span>
                <div className="space-y-4">
                  {[
                    { label: 'Complexity', value: 'High', icon: Cpu },
                    { label: 'Latency', value: '14ms', icon: Zap },
                    { label: 'Security', value: 'Encrypted', icon: Shield },
                    { label: 'Engine', value: 'Gemini 2.5', icon: Sparkles }
                  ].map((stat) => (
                    <div key={stat.label} className="flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                        <stat.icon className="w-4 h-4 text-white/20 group-hover:text-accent transition-colors" />
                        <span className="text-[11px] text-white/40 group-hover:text-white/60 transition-colors">{stat.label}</span>
                      </div>
                      <span className="text-xs font-bold text-white/80">{stat.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="h-px bg-white/5" />
              <div>
                <span className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em] block mb-4">Sector Context</span>
                <p className="text-[11px] text-white/30 leading-relaxed italic">
                  Conducting deep-trace analysis on {topic} vectors. Neural voice synthesis active for enhanced candidate immersion. 
                </p>
              </div>
            </div>
            
            <div className="flex-1 surface-strong rounded-[40px] border-white/5 p-8 flex flex-col items-center justify-center text-center opacity-40">
              <Bot className="w-16 h-16 text-white/5 mb-6" />
              <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest leading-loose">
                AI CONDUCTOR UNIT<br/>MODEL SERIAL: XP-2026<br/>STATUS: OBSERVING
              </span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
