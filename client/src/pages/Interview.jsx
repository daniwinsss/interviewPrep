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
  const [voiceStatus, setVoiceStatus] = useState('Standard voice active');
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

  const activateFallbackVoice = useCallback((nextStatus = 'Standard voice active') => {
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
        setVoiceStatus('Standard voice active');
      setLiveTranscript('');
      stopBrowserListening();
      if (codeMonitorTimerRef.current) { clearTimeout(codeMonitorTimerRef.current); codeMonitorTimerRef.current = null; }
      activateFallbackVoice('Standard voice active');
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

  const stopLiveVoiceSession = useCallback((nextStatus = 'Standard voice active') => {
    activateFallbackVoice(nextStatus);
  }, [activateFallbackVoice]);

  const startLiveVoiceSession = useCallback(async () => {
    if (voiceMode === 'connecting' || voiceMode === 'live_ready') return;
    setError('');
    stopBrowserListening();
    activateFallbackVoice('Connecting live voice...');
    setVoiceMode('connecting');
    setLiveSessionStatus('connecting');
    setVoiceStatus('Connecting live voice...');
    const attemptId = Date.now();
    liveConnectionAttemptRef.current = attemptId;
    liveIntentionallyClosingRef.current = false;
    liveSessionInitializedRef.current = false;
    liveStartupCompleteRef.current = false;
    liveReadyRef.current = false;
    liveCloseQueuedRef.current = false;

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Microphone access not supported. Switching to standard voice.');
      }
      liveStartupTimerRef.current = setTimeout(() => {
        if (liveConnectionAttemptRef.current !== attemptId) return;
    setError('Live voice handshake timed out. Switching to standard voice.');
        activateFallbackVoice('Standard voice active');
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
            setVoiceStatus('Live voice connected. Stabilizing...');
            liveStabilityTimerRef.current = setTimeout(() => {
              if (liveConnectionAttemptRef.current !== attemptId || !liveSessionRef.current || liveCloseQueuedRef.current || liveIntentionallyClosingRef.current) return;
              liveStartupCompleteRef.current = true;
              liveReadyRef.current = true;
              clearLiveTimers();
              setVoiceMode('live_ready');
              setLiveSessionStatus('live_ready');
              setVoiceStatus('Live voice active');
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
                setVoiceStatus('Live voice active');
              }
              setMessages((prev) => [...prev, { role: 'ai', content: text }]);
            }
          },
          onerror: (event) => {
            console.error('Gemini Live error:', event);
            if (liveConnectionAttemptRef.current !== attemptId) return;
            setError('Live voice interrupted. Switching to standard voice.');
            stopLiveVoiceSession('Standard voice active');
          },
          onclose: () => {
            if (liveConnectionAttemptRef.current !== attemptId || liveIntentionallyClosingRef.current) return;
            if (!liveSessionInitializedRef.current) { liveCloseQueuedRef.current = true; return; }
            if (!liveStartupCompleteRef.current) setError('Live voice session closed early.');
            stopLiveVoiceSession('Standard voice active');
          }
        }
      });

      if (liveConnectionAttemptRef.current !== attemptId) { session.close?.(); return; }
      liveSessionRef.current = session;
      liveSessionInitializedRef.current = true;
      if (liveCloseQueuedRef.current) {
        liveCloseQueuedRef.current = false;
        setError('Live voice session closed during startup.');
        stopLiveVoiceSession('Standard voice active');
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
      setError(err.message || 'Failed to start live voice session');
      stopLiveVoiceSession('Standard voice active');
    }
  }, [voiceMode, stopBrowserListening, activateFallbackVoice, stopLiveVoiceSession, clearLiveTimers]);

  useEffect(() => () => {
    stopBrowserListening();
    activateFallbackVoice('Standard voice active');
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  }, [activateFallbackVoice, stopBrowserListening]);

  const toggleListening = useCallback(() => {
    if (voiceMode === 'live_ready' || voiceMode === 'connecting') {
      stopLiveVoiceSession('Standard voice active');
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
      setError('Unable to activate voice input. Check microphone permissions.');
    }
    setVoiceMode('fallback_active');
    setVoiceStatus('Standard voice active');
  }, [isListening, voiceMode, stopLiveVoiceSession]);

  const toggleSpokenReplies = useCallback(() => {
    if (!window.speechSynthesis) {
      setError('Speech synthesis is not supported in this browser.');
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
      setError(err.message || 'Message delivery failed');
    } finally {
      setIsTyping(false);
    }
  }

  const isDsa = topic === 'DSA';
  const isProject = topic === 'Project Experience';
  const liveVoiceActive = voiceMode === 'live_ready';
  const liveVoiceConnecting = voiceMode === 'connecting';

  return (
    <div className="h-screen flex flex-col bg-slate-50 text-slate-900 overflow-hidden selection:bg-emerald-200">
      {/* Tactical Header */}
      <header className="h-20 border-b border-slate-200 bg-white flex items-center px-8 gap-8 z-30 shadow-soft relative">
        <Link to="/" className="w-12 h-12 rounded-2xl border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all">
          <ArrowLeft className="w-6 h-6" />
        </Link>

        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-soft">
            <Bot className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-bold tracking-tight">PrepDost Interview</h1>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.3)]" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Live session</span>
            </div>
          </div>
        </div>

        <div className="h-10 w-px bg-slate-200 mx-2" />

        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">Interview track</span>
            <select
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              disabled={isStarting || isTyping}
              className="bg-transparent text-sm font-bold text-slate-900 outline-none cursor-pointer hover:text-emerald-600 transition-colors"
            >
              {TOPICS.map((item) => <option key={item} value={item} className="bg-white">{item}</option>)}
            </select>
          </div>
          
          {isDsa && (
            <div className="flex flex-col ml-4">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">Language</span>
              <select
                value={language}
                onChange={(e) => {
                  const nextLanguage = e.target.value;
                  setLanguage(nextLanguage);
                  setCode(STARTER_CODE[nextLanguage] || '');
                  lastReviewedCodeRef.current = '';
                }}
                disabled={isStarting}
                className="bg-transparent text-sm font-bold text-slate-900 outline-none cursor-pointer hover:text-emerald-600 transition-colors"
              >
                {Object.entries(LANG_MAP).map(([key, value]) => <option key={key} value={key} className="bg-white">{value.label}</option>)}
              </select>
            </div>
          )}
        </div>

        <div className="ml-auto flex items-center gap-4">
          <div className="flex flex-col items-end mr-4">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">Voice status</span>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold tracking-wider ${liveVoiceActive ? 'text-emerald-600' : 'text-slate-400'}`}>
                {voiceStatus}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-white p-1 rounded-2xl border border-slate-200">
            {speechSupported && (
              <button
                onClick={toggleListening}
                disabled={isStarting || isTyping || isComplete}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                  isListening || liveVoiceActive || liveVoiceConnecting ? 'bg-emerald-600 text-white shadow-soft' : 'text-slate-400 hover:text-slate-900'
                }`}
              >
                {isListening || liveVoiceActive || liveVoiceConnecting ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
            )}

              <button
                onClick={liveVoiceActive || liveVoiceConnecting ? () => stopLiveVoiceSession('Standard voice active') : startLiveVoiceSession}
                disabled={isStarting || isTyping || isComplete}
                className={`h-10 px-5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                  liveVoiceActive ? 'bg-emerald-600 text-white shadow-[0_0_20px_rgba(15,157,88,0.25)]' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {liveVoiceConnecting ? 'Connecting...' : liveVoiceActive ? 'Live voice on' : 'Live voice'}
              </button>

              <button
                onClick={toggleSpokenReplies}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                  spokenReplyEnabled ? 'bg-emerald-50 text-emerald-700' : 'text-slate-300'
                }`}
              >
                {spokenReplyEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </button>
            </div>
        </div>
      </header>

      {isProject && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="px-8 pt-6 z-20">
          <div className="surface p-6 rounded-3xl border-slate-200 flex items-center gap-6 shadow-soft">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <Globe className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.3em] block mb-2 text-center md:text-left">Project repository</span>
              <div className="flex flex-col md:flex-row gap-4">
                <input
                  type="url"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="https://github.com/organization/infrastructure"
                  className="flex-1 bg-white border border-slate-200 rounded-2xl px-6 py-3 text-sm font-medium text-slate-900 focus:outline-none focus:border-emerald-400 transition-all placeholder:text-slate-400"
                />
                <Button onClick={restartInterview} disabled={isStarting || isTyping} variant="secondary" className="px-8 whitespace-nowrap h-12">
                  Refresh context
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {error && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="px-8 pt-6 z-20">
          <div className="bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold uppercase tracking-widest px-6 py-4 rounded-2xl flex items-center gap-3 shadow-soft">
            <AlertTriangle className="w-5 h-5" />
            {error}
          </div>
        </motion.div>
      )}

      <main className="flex-1 flex overflow-hidden p-8 gap-8 relative z-10">
        {/* Cinematic Watermark Overlay */}
        <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none opacity-[0.03]">
          <span className="text-[20vw] font-black tracking-tighter select-none">PREPDOST</span>
        </div>

        {/* Left: Chat Stream */}
        <div className={`${isDsa ? 'w-[45%]' : 'w-full'} flex flex-col gap-6 relative z-10`}>
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 flex flex-col gap-8 scroll-smooth">
            <AnimatePresence mode="popLayout">
              {isStarting ? (
                <motion.div key="starting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                  <div className="surface p-6 rounded-3xl rounded-tl-lg border-slate-200 flex items-center gap-4 text-slate-500">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-xs font-bold uppercase tracking-widest">Starting interview...</span>
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
                          ? 'bg-emerald-600 text-white font-medium rounded-tr-lg shadow-soft'
                          : 'surface-strong border border-slate-200 text-slate-800 rounded-tl-lg shadow-soft backdrop-blur-md'
                      }`}>
                        {msg.role !== 'user' && (
                          <div className="flex items-center gap-2 mb-4">
                            <div className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center">
                              <Bot className="w-3.5 h-3.5 text-emerald-600" />
                            </div>
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">PrepDost AI</span>
                          </div>
                        )}
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                      </div>
                      <div className={`absolute -bottom-6 flex gap-2 ${msg.role === 'user' ? 'right-4' : 'left-4'}`}>
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}

              {isTyping && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
                  <div className="surface p-6 rounded-3xl rounded-tl-lg border-slate-200 flex items-center gap-3">
                    <div className="flex gap-1">
                      <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0 }} className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }} className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.4 }} className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={messagesEndRef} className="h-10" />
          </div>

          {/* Tactical Input */}
          <div className="relative group z-20">
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-200/40 to-emerald-100/40 rounded-[36px] blur-xl opacity-0 group-focus-within:opacity-100 transition-all duration-700" />
            <div className="relative surface-strong border border-slate-200 rounded-[32px] p-2 flex items-center gap-3 shadow-soft backdrop-blur-2xl">
              <textarea
                className="flex-1 bg-transparent border-none rounded-2xl px-6 py-4 text-sm font-medium text-slate-900 focus:outline-none resize-none h-[64px] custom-scrollbar placeholder:text-slate-400"
                placeholder={isStarting ? 'Starting interview...' : isComplete ? 'Session completed.' : 'Share your response...'}
                value={input}
                disabled={isStarting || isTyping || !sessionId || isComplete}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isTyping || isStarting || !sessionId || isComplete}
                className="w-14 h-14 rounded-3xl bg-emerald-600 text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-40 shadow-soft"
              >
                <Send className="w-6 h-6" />
              </button>
            </div>
            
            {(speechSupported || liveVoiceActive || liveVoiceConnecting) && liveTranscript && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="absolute -top-12 inset-x-8 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-xl backdrop-blur-xl">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest truncate">Voice: {liveTranscript}</span>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Right: Tactical Information & Code */}
        {isDsa ? (
          <div className="flex-1 flex flex-col gap-6 relative z-10">
            {/* Sector Briefing Card */}
            <div className="surface p-8 rounded-[40px] border-slate-200 relative overflow-hidden shadow-soft">
              <div className="absolute top-0 right-0 p-8 opacity-[0.08]">
                <Shield className="w-32 h-32" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-[0.3em] mb-2">Problem briefing</span>
                    <h2 className="text-2xl font-bold tracking-tight">{problemTitle || 'Interview prompt'}</h2>
                  </div>
                  {problemLink && (
                    <a href={problemLink} target="_blank" rel="noopener noreferrer" className="surface p-3 rounded-xl border-slate-200 hover:border-emerald-200 transition-all">
                      <ExternalLink className="w-5 h-5 text-slate-400" />
                    </a>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-white p-4 rounded-2xl border border-slate-200">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Phase</span>
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">{currentPhase.replace(/_/g, ' ') || 'Evaluation'}</span>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-slate-200">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Source</span>
                    <span className="text-xs font-bold text-slate-700">{repoName || 'PrepDost library'}</span>
                  </div>
                </div>

                <p className="text-sm text-slate-600 leading-relaxed line-clamp-3 mb-6">{problemContent}</p>

                <div className="flex items-center gap-4">
                  <div className={`flex-1 h-1 rounded-full bg-slate-200 overflow-hidden`}>
                    <motion.div initial={{ width: 0 }} animate={{ width: isComplete ? '100%' : '65%' }} className="h-full bg-emerald-500" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Progress</span>
                </div>
              </div>
            </div>

            {/* Coding Environment */}
            <div className="flex-1 surface-strong rounded-[40px] border-slate-200 overflow-hidden flex flex-col shadow-soft relative">
              <div className="h-14 border-b border-slate-200 flex items-center justify-between px-8 bg-slate-50 shrink-0">
                <div className="flex items-center gap-3">
                  <Terminal className="w-4 h-4 text-slate-400" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Code workspace</span>
                </div>
                <div className="flex items-center gap-4">
                  <AnimatePresence>
                    {isMonitoringCode && (
                      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                        <Loader2 className="w-3 h-3 animate-spin text-emerald-600" />
                        <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">Reviewing code...</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <button
                    onClick={() => requestCodeFeedback(code)}
                    disabled={isStarting || isMonitoringCode || !sessionId || isComplete}
                    className="text-[9px] font-bold uppercase tracking-widest px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 transition-all disabled:opacity-40"
                  >
                    Request feedback
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
                    automaticLayout: true
                  }}
                />
              </div>
            </div>
          </div>
        ) : (
          /* Tactical Statistics for Non-DSA topics */
          <div className="hidden lg:flex w-80 flex-col gap-6">
            <div className="surface p-8 rounded-[40px] border-slate-200 space-y-8">
              <div>
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-[0.3em] block mb-4">Interview insights</span>
                <div className="space-y-4">
                  {[
                    { label: 'Complexity', value: 'High', icon: Cpu },
                    { label: 'Latency', value: '14ms', icon: Zap },
                    { label: 'Security', value: 'Encrypted', icon: Shield },
                    { label: 'Engine', value: 'Gemini 2.5', icon: Sparkles }
                  ].map((stat) => (
                    <div key={stat.label} className="flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                        <stat.icon className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 transition-colors" />
                        <span className="text-[11px] text-slate-500 group-hover:text-slate-700 transition-colors">{stat.label}</span>
                      </div>
                      <span className="text-xs font-bold text-slate-700">{stat.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="h-px bg-slate-200" />
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] block mb-4">Context</span>
                <p className="text-[11px] text-slate-500 leading-relaxed italic">
                  Reviewing {topic} responses with AI scoring and placement-ready feedback.
                </p>
              </div>
            </div>
            
            <div className="flex-1 surface-strong rounded-[40px] border-slate-200 p-8 flex flex-col items-center justify-center text-center opacity-60">
              <Bot className="w-16 h-16 text-slate-200 mb-6" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-loose">
                PREPDOST AI UNIT<br/>MODEL SERIAL: XP-2026<br/>STATUS: OBSERVING
              </span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
