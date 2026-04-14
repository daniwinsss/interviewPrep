import React, { useEffect, useRef, useState, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { Bot, Send, ArrowLeft, Loader2, ExternalLink, Code2, ChevronDown, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { Link } from 'react-router-dom';
import { GoogleGenAI, Modality } from '@google/genai';
import { apiUrl } from '../lib/api';

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
  const [voiceStatus, setVoiceStatus] = useState('Using standard voice mode.');
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
  }, [messages, isMonitoringCode]);

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

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    setSpeechSupported(true);

    return () => {
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      try {
        recognition.stop();
      } catch {
        // Ignore teardown stop errors.
      }
    };
  }, []);

  useEffect(() => {
    if (!spokenReplyEnabled || !window.speechSynthesis) {
      return;
    }
    if (voiceMode === 'live_ready') {
      return;
    }

    const lastAiMessage = [...messages].reverse().find((msg) => msg.role !== 'user');
    if (!lastAiMessage?.content) {
      return;
    }

    const messageKey = lastAiMessage._id || `${messages.length}:${lastAiMessage.content}`;
    if (spokenMessageIdsRef.current.has(messageKey)) {
      return;
    }

    spokenMessageIdsRef.current.add(messageKey);
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(lastAiMessage.content);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;
    window.speechSynthesis.speak(utterance);
  }, [messages, spokenReplyEnabled, voiceMode]);

  const clearLiveTimers = useCallback(() => {
    if (liveStartupTimerRef.current) {
      clearTimeout(liveStartupTimerRef.current);
      liveStartupTimerRef.current = null;
    }
    if (liveStabilityTimerRef.current) {
      clearTimeout(liveStabilityTimerRef.current);
      liveStabilityTimerRef.current = null;
    }
  }, []);

  const stopBrowserListening = useCallback(() => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.stop();
    } catch {
      // Ignore stop errors when recognition is already stopping.
    }
    setIsListening(false);
  }, []);

  const activateFallbackVoice = useCallback((nextStatus = 'Using standard voice mode.') => {
    liveIntentionallyClosingRef.current = true;
    clearLiveTimers();
    liveReadyRef.current = false;
    liveStartupCompleteRef.current = false;
    liveSessionInitializedRef.current = false;
    liveCloseQueuedRef.current = false;
    if (liveMediaRecorderRef.current?.state === 'recording') {
      liveMediaRecorderRef.current.stop();
    }
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

  const restartInterview = useCallback(() => {
    setSessionSeed((value) => value + 1);
  }, []);

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
      setVoiceStatus('Using standard voice mode.');
      setLiveTranscript('');
      stopBrowserListening();

      if (codeMonitorTimerRef.current) {
        clearTimeout(codeMonitorTimerRef.current);
        codeMonitorTimerRef.current = null;
      }

      activateFallbackVoice('Using standard voice mode.');

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

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to start interview');
        }
        if (ignore) return;

        setSessionId(data._id);
        setMessages(data.messages || []);
        syncInterviewState(data);
      } catch (err) {
        if (ignore) return;
        setError(err.message || 'Failed to start interview');
      } finally {
        if (!ignore) {
          setIsStarting(false);
        }
      }
    }

    startInterview();
    return () => {
      ignore = true;
    };
  }, [topic, sessionSeed, syncInterviewState, activateFallbackVoice, stopBrowserListening]);

  const stopLiveVoiceSession = useCallback((nextStatus = 'Using standard voice mode.') => {
    activateFallbackVoice(nextStatus);
  }, [activateFallbackVoice]);

  const startLiveVoiceSession = useCallback(async () => {
    if (voiceMode === 'connecting' || voiceMode === 'live_ready') {
      return;
    }

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
        throw new Error('Microphone access is not supported in this browser. Using standard voice mode instead.');
      }

      liveStartupTimerRef.current = setTimeout(() => {
        if (liveConnectionAttemptRef.current !== attemptId) return;
        setError('Gemini Live took too long to connect. Using standard voice mode instead.');
        activateFallbackVoice('Using standard voice mode.');
      }, LIVE_VOICE_STARTUP_TIMEOUT_MS);

      const tokenResponse = await fetch(`${API}/live-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const tokenData = await tokenResponse.json();
      if (!tokenResponse.ok) {
        throw new Error(tokenData.error || 'Failed to get Gemini Live token');
      }

      const ai = new GoogleGenAI({
        apiKey: tokenData.token,
        apiVersion: 'v1alpha'
      });

      const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (liveConnectionAttemptRef.current !== attemptId) {
        mediaStream.getTracks().forEach((track) => track.stop());
        return;
      }
      liveMediaStreamRef.current = mediaStream;

      const session = await ai.live.connect({
        model: tokenData.model || 'gemini-2.5-flash-native-audio-preview-12-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          outputAudioTranscription: {},
          inputAudioTranscription: {}
        },
        callbacks: {
          onopen: () => {
            if (liveConnectionAttemptRef.current !== attemptId) {
              return;
            }
            if (liveStartupTimerRef.current) {
              clearTimeout(liveStartupTimerRef.current);
              liveStartupTimerRef.current = null;
            }
            setLiveSessionStatus('warming_up');
            setVoiceStatus('Live voice connected. Verifying session stability...');
            liveStabilityTimerRef.current = setTimeout(() => {
              if (
                liveConnectionAttemptRef.current !== attemptId ||
                !liveSessionRef.current
              ) {
                return;
              }
              if (liveCloseQueuedRef.current || liveIntentionallyClosingRef.current) {
                return;
              }
              liveStartupCompleteRef.current = true;
              liveReadyRef.current = true;
              clearLiveTimers();
              setVoiceMode('live_ready');
              setLiveSessionStatus('live_ready');
              setVoiceStatus('Live voice active.');
            }, LIVE_VOICE_STABILITY_WINDOW_MS);
          },
          onmessage: (event) => {
            if (liveConnectionAttemptRef.current !== attemptId) {
              return;
            }
            if (event.serverContent?.inputTranscription?.text) {
              setLiveTranscript(event.serverContent.inputTranscription.text);
            }

            if (event.serverContent?.outputTranscription?.text) {
              const text = event.serverContent.outputTranscription.text;
              if (!liveReadyRef.current && liveSessionRef.current) {
                liveReadyRef.current = true;
                liveStartupCompleteRef.current = true;
                clearLiveTimers();
                setVoiceMode('live_ready');
                setLiveSessionStatus('live_ready');
                setVoiceStatus('Live voice active.');
              }
              setMessages((prev) => [...prev, {
                role: 'ai',
                content: text
              }]);
            }
          },
          onerror: (event) => {
            console.error('Gemini Live error:', event);
            if (liveConnectionAttemptRef.current !== attemptId) {
              return;
            }
            setError('Gemini Live voice connection failed. Using standard voice mode instead.');
            stopLiveVoiceSession('Using standard voice mode.');
          },
          onclose: () => {
            if (liveConnectionAttemptRef.current !== attemptId) {
              return;
            }
            if (liveIntentionallyClosingRef.current) {
              return;
            }
            if (!liveSessionInitializedRef.current) {
              liveCloseQueuedRef.current = true;
              return;
            }
            const closedDuringStartup = !liveStartupCompleteRef.current;
            if (closedDuringStartup) {
              setError('Gemini Live closed during startup. Using standard voice mode instead.');
            }
            stopLiveVoiceSession('Using standard voice mode.');
          }
        }
      });

      if (liveConnectionAttemptRef.current !== attemptId) {
        session.close?.();
        return;
      }
      liveSessionRef.current = session;
      liveSessionInitializedRef.current = true;
      if (liveCloseQueuedRef.current) {
        liveCloseQueuedRef.current = false;
        setError('Gemini Live closed during startup. Using standard voice mode instead.');
        stopLiveVoiceSession('Using standard voice mode.');
        return;
      }

      const recorder = new MediaRecorder(mediaStream, { mimeType: 'audio/webm' });
      liveMediaRecorderRef.current = recorder;

      recorder.ondataavailable = async (event) => {
        if (
          liveConnectionAttemptRef.current !== attemptId ||
          !event.data ||
          event.data.size === 0 ||
          !liveSessionRef.current ||
          !liveReadyRef.current
        ) {
          return;
        }
        try {
          liveSessionRef.current.sendRealtimeInput({
            media: event.data
          });
        } catch (error) {
          console.error('Gemini Live send error:', error);
          stopLiveVoiceSession();
        }
      };

      recorder.onstop = () => {
        if (!liveSessionRef.current || !liveReadyRef.current) {
          return;
        }
        try {
          liveSessionRef.current.sendRealtimeInput({ audioStreamEnd: true });
        } catch (error) {
          console.error('Gemini Live audio end error:', error);
        }
      };

      recorder.start(1000);
    } catch (err) {
      console.error(err);
      if (liveConnectionAttemptRef.current !== attemptId) {
        return;
      }
      setError(err.message || 'Could not start Gemini Live voice mode');
      stopLiveVoiceSession('Using standard voice mode.');
    }
  }, [voiceMode, stopBrowserListening, activateFallbackVoice, stopLiveVoiceSession, clearLiveTimers]);

  useEffect(() => () => {
    stopBrowserListening();
    activateFallbackVoice('Using standard voice mode.');
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, [activateFallbackVoice, stopBrowserListening]);

  const toggleListening = useCallback(() => {
    if (voiceMode === 'live_ready' || voiceMode === 'connecting') {
      stopLiveVoiceSession('Using standard voice mode.');
      return;
    }

    if (!recognitionRef.current) {
      setError('Voice input is not supported in this browser.');
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
      setError('Could not start voice input. Try refreshing the page and allowing microphone access.');
    }
    setVoiceMode('fallback_active');
    setVoiceStatus('Using standard voice mode.');
  }, [isListening, voiceMode, stopLiveVoiceSession]);

  const toggleSpokenReplies = useCallback(() => {
    if (!window.speechSynthesis) {
      setError('Speech output is not supported in this browser.');
      return;
    }

    if (spokenReplyEnabled) {
      window.speechSynthesis.cancel();
    }
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
        body: JSON.stringify({
          sessionId,
          code: nextCode,
          language
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to review code');
      }

      lastReviewedCodeRef.current = nextCode;
      if (!data.skipped) {
        setMessages(data.messages || []);
        setCurrentPhase(data.session?.currentPhase || '');
      }
    } catch (err) {
      setError(err.message || 'Failed to review code');
    } finally {
      setIsMonitoringCode(false);
    }
  }, [sessionId, topic, isComplete, language]);

  useEffect(() => {
    if (topic !== 'DSA' || !sessionId || isComplete) {
      return undefined;
    }

    if (codeMonitorTimerRef.current) {
      clearTimeout(codeMonitorTimerRef.current);
    }

    codeMonitorTimerRef.current = setTimeout(() => {
      requestCodeFeedback(code);
    }, 30000);

    return () => {
      if (codeMonitorTimerRef.current) {
        clearTimeout(codeMonitorTimerRef.current);
      }
    };
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

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to continue interview');
      }

      setMessages(data.interview?.messages || optimisticMessages);
      syncInterviewState(data.interview);
    } catch (err) {
      setMessages(optimisticMessages);
      setInput(answer);
      setError(err.message || 'Failed to continue interview');
    } finally {
      setIsTyping(false);
    }
  }

  const isDsa = topic === 'DSA';
  const isProject = topic === 'Project Experience';
  const liveVoiceActive = voiceMode === 'live_ready';
  const liveVoiceConnecting = voiceMode === 'connecting';

  return (
    <div className="h-screen bg-slate-950 flex flex-col font-sans text-slate-100 overflow-hidden">
      <header className="h-16 border-b border-slate-800 bg-slate-900/50 flex items-center px-6 gap-4 shrink-0">
        <Link to="/" className="text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
            <Bot className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h1 className="font-semibold text-slate-100">AI Interviewer</h1>
            <p className="text-xs text-blue-400">Live coding interview</p>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-3">
          {speechSupported && (
            <button
              onClick={toggleListening}
              disabled={isStarting || isTyping || isComplete}
              className={`p-2 rounded-lg transition-all ${
                isListening || liveVoiceActive || liveVoiceConnecting
                  ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              } disabled:opacity-50`}
              title={liveVoiceActive || liveVoiceConnecting ? 'Stop live voice mode' : isListening ? 'Stop listening' : 'Start listening'}
            >
              {isListening || liveVoiceActive || liveVoiceConnecting ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
          )}

          <button
            onClick={liveVoiceActive || liveVoiceConnecting ? () => stopLiveVoiceSession('Using standard voice mode.') : startLiveVoiceSession}
            disabled={isStarting || isTyping || isComplete}
            className={`px-3 py-2 rounded-lg text-sm transition-all ${
              liveVoiceActive
                ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                : liveVoiceConnecting
                  ? 'bg-amber-500/20 text-amber-200 hover:bg-amber-500/25'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            } disabled:opacity-50`}
          >
            {liveVoiceConnecting ? 'Connecting Voice...' : liveVoiceActive ? 'Gemini Live On' : 'Try Gemini Live'}
          </button>

          <button
            onClick={toggleSpokenReplies}
            className={`p-2 rounded-lg transition-all ${
              spokenReplyEnabled
                ? 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
            title={spokenReplyEnabled ? 'Mute AI voice' : 'Enable AI voice'}
          >
            {spokenReplyEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>

          {isDsa && (
            <div className="relative">
              <select
                value={language}
                onChange={(e) => {
                  const nextLanguage = e.target.value;
                  setLanguage(nextLanguage);
                  setCode(STARTER_CODE[nextLanguage] || '');
                  lastReviewedCodeRef.current = '';
                }}
                disabled={isStarting}
                className="appearance-none bg-slate-800 border border-slate-700 text-slate-200 text-sm px-3 py-2 pr-8 rounded-lg focus:outline-none focus:border-blue-500/50 cursor-pointer"
              >
                {Object.entries(LANG_MAP).map(([key, value]) => (
                  <option key={key} value={key}>{value.label}</option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          )}

          <select
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            disabled={isStarting || isTyping}
            className="appearance-none bg-slate-800 border border-slate-700 text-slate-200 text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500/50 cursor-pointer"
          >
            {TOPICS.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </div>
      </header>

      {isProject && (
        <div className="px-6 pt-4">
          <div className="max-w-7xl mx-auto bg-slate-900/40 border border-slate-800 rounded-xl p-4 flex flex-col gap-2">
            <label className="text-xs uppercase tracking-[0.16em] text-slate-400">GitHub Repository</label>
            <input
              type="url"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/username/repository"
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500/50"
            />
            <button
              onClick={restartInterview}
              disabled={isStarting || isTyping}
              className="self-start text-sm px-3 py-2 rounded-lg border border-blue-500/30 bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 disabled:opacity-50"
            >
              Load repo for interview
            </button>
            <p className="text-xs text-slate-500">
              Paste a public GitHub repo URL and the interviewer will tailor project questions from its description and README.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="px-6 pt-4">
          <div className="max-w-7xl mx-auto bg-red-900/30 border border-red-500/30 text-red-200 text-sm px-4 py-3 rounded-xl">
            {error}
          </div>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        <div className={`${isDsa ? 'w-[42%]' : 'w-full'} border-r border-slate-800 flex flex-col overflow-hidden`}>
          <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/40 shrink-0">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-white">{problemTitle || `${topic} Interview`}</h2>
                {repoName && (
                  <p className="text-sm text-blue-400 mt-1">{repoName}</p>
                )}
                {currentPhase && (
                  <p className="text-xs text-slate-400 uppercase tracking-[0.16em] mt-1">
                    Current phase: {currentPhase.replace(/_/g, ' ')}
                  </p>
                )}
              </div>
              {problemLink && (
                <a
                  href={problemLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm"
                >
                  Open problem <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
            {isDsa && problemContent && (
              <p className="text-sm text-slate-400 mt-3 line-clamp-3">{problemContent}</p>
            )}
            <div className="mt-3 rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-300">
              {voiceStatus}
            </div>
            {(speechSupported || liveVoiceActive || liveVoiceConnecting) && liveTranscript && (
              <div className="mt-3 rounded-lg border border-blue-500/20 bg-blue-500/10 px-3 py-2 text-sm text-blue-200">
                Listening: {liveTranscript}
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
            {isStarting ? (
              <div className="flex justify-start">
                <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-tl-sm p-4 flex items-center gap-2 text-slate-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Starting your interview...
                </div>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div key={msg._id || idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[88%] rounded-2xl p-4 ${
                    msg.role === 'user'
                      ? 'bg-blue-600/30 border border-blue-500/30 rounded-tr-sm text-blue-50'
                      : 'bg-slate-800 border border-slate-700 rounded-tl-sm text-slate-200'
                  }`}>
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  </div>
                </div>
              ))
            )}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-tl-sm p-4 flex items-center gap-2 text-slate-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  AI is replying...
                </div>
              </div>
            )}

            {isMonitoringCode && (
              <div className="flex justify-start">
                <div className="bg-slate-900 border border-blue-500/20 rounded-2xl rounded-tl-sm p-4 flex items-center gap-2 text-blue-300 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Live interviewer is reviewing your code...
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 bg-slate-900/80 border-t border-slate-800 backdrop-blur-md shrink-0">
            <div className="max-w-full flex gap-3">
              <textarea
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 resize-none h-14"
                placeholder={
                  isStarting
                    ? 'Wait for the interview to start...'
                    : isComplete
                      ? 'This interview set is complete. Change topic to continue.'
                      : 'Reply to the interviewer here...'
                }
                value={input}
                disabled={isStarting || isTyping || !sessionId || isComplete}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isTyping || isStarting || !sessionId || isComplete}
                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 text-white p-3 px-6 rounded-xl font-medium transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20"
              >
                <span>Send</span>
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {isDsa && (
          <div className="flex-1 flex flex-col overflow-hidden bg-[#020617]">
            <div className="h-12 border-b border-slate-800 flex items-center justify-between px-4 bg-slate-900/60 shrink-0">
              <div className="flex items-center gap-2 text-slate-300">
                <Code2 className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-medium">Live Coding Workspace</span>
              </div>
              <button
                onClick={() => requestCodeFeedback(code)}
                disabled={isStarting || isMonitoringCode || !sessionId || isComplete}
                className="text-xs px-3 py-1.5 rounded-lg border border-blue-500/30 bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 disabled:opacity-50"
              >
                Ask AI to review current code
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <Editor
                height="100%"
                language={LANG_MAP[language]?.monaco || 'cpp'}
                theme="vs-dark"
                value={code}
                onChange={(value) => setCode(value || '')}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  padding: { top: 16 },
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                  scrollBeyondLastLine: false,
                  lineNumbers: 'on',
                  automaticLayout: true
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
