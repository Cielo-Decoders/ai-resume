import React, { useState, useRef, useEffect } from 'react';
import {
  MessageCircle,
  Mic,
  MicOff,
  Keyboard,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Trophy,
  Target,
  Lightbulb,
  CheckCircle,
  Send,
  Sparkles,
  Clock,
  BarChart3,
  ArrowRight,
  Brain,
  Zap,
  Users,
  Code,
  Briefcase,
  Star,
} from 'lucide-react';
import { InterviewQuestion, AnswerFeedback } from '../../types/index';
import { generateInterviewQuestions, evaluateInterviewAnswer } from '../../services/api';

interface InterviewerQuestionsProps {
  resumeText: string;
  jobDescription: string;
  jobTitle: string;
  company: string;
}

type Phase = 'idle' | 'loading' | 'interviewing' | 'evaluating' | 'feedback' | 'complete';

const TYPE_ICONS: Record<string, React.ElementType> = {
  behavioral: Users,
  technical: Code,
  situational: Brain,
  'role-specific': Briefcase,
};

const TYPE_COLORS: Record<string, string> = {
  behavioral: 'bg-sky-100 text-sky-700 border-sky-200',
  technical: 'bg-amber-100 text-amber-700 border-amber-200',
  situational: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'role-specific': 'bg-violet-100 text-violet-700 border-violet-200',
};

const DIFF_COLORS: Record<string, string> = {
  easy: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  hard: 'bg-red-100 text-red-700',
};

function getScoreColor(score: number) {
  if (score >= 80) return { text: 'text-emerald-600', bg: 'bg-emerald-50', ring: 'ring-emerald-300', gradient: 'from-emerald-400 to-emerald-600' };
  if (score >= 60) return { text: 'text-sky-600', bg: 'bg-sky-50', ring: 'ring-sky-300', gradient: 'from-sky-400 to-sky-600' };
  if (score >= 40) return { text: 'text-amber-600', bg: 'bg-amber-50', ring: 'ring-amber-300', gradient: 'from-amber-400 to-amber-600' };
  return { text: 'text-red-600', bg: 'bg-red-50', ring: 'ring-red-300', gradient: 'from-red-400 to-red-600' };
}

function getScoreLabel(score: number) {
  if (score >= 85) return 'Excellent';
  if (score >= 70) return 'Strong';
  if (score >= 55) return 'Good';
  if (score >= 40) return 'Fair';
  return 'Needs Work';
}

export default function InterviewerQuestions({
  resumeText,
  jobDescription,
  jobTitle,
  company,
}: InterviewerQuestionsProps) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [feedbacks, setFeedbacks] = useState<AnswerFeedback[]>([]);
  const [error, setError] = useState('');
  const [questionCount, setQuestionCount] = useState(5);
  const [expandedSample, setExpandedSample] = useState<number | null>(null);
  const [timer, setTimer] = useState(0);
  const [inputMode, setInputMode] = useState<'type' | 'voice'>('type');
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Timer for answering
  useEffect(() => {
    if (phase === 'interviewing') {
      setTimer(0);
      timerRef.current = setInterval(() => setTimer((t) => t + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, currentIndex]);

  // Check for Web Speech API support
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setVoiceSupported(!!SpeechRecognition);
  }, []);

  // Stop listening when leaving interviewing phase or moving to next question
  useEffect(() => {
    if (phase !== 'interviewing' && isListening) {
      stopListening();
    }
  }, [phase]);

  // Auto-focus textarea when interviewing in type mode
  useEffect(() => {
    if (phase === 'interviewing' && inputMode === 'type' && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 300);
    }
  }, [phase, currentIndex, inputMode]);

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    let finalTranscript = currentAnswer;

    recognition.onresult = (event: any) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += (finalTranscript ? ' ' : '') + transcript;
          setCurrentAnswer(finalTranscript);
        } else {
          interim += transcript;
        }
      }
      // Show interim text in real time via a combined view
      if (interim) {
        setCurrentAnswer(finalTranscript + (finalTranscript ? ' ' : '') + interim);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error !== 'aborted') {
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const handleStartInterview = async () => {
    setPhase('loading');
    setError('');
    setFeedbacks([]);
    setCurrentIndex(0);
    setCurrentAnswer('');

    try {
      const result = await generateInterviewQuestions(resumeText, jobDescription, questionCount);
      if (result.success && result.questions.length > 0) {
        setQuestions(result.questions);
        setPhase('interviewing');
      } else {
        setError(result.message || 'Failed to generate questions. Please try again.');
        setPhase('idle');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate interview questions.');
      setPhase('idle');
    }
  };

  const handleSubmitAnswer = async () => {
    if (!currentAnswer.trim() || currentAnswer.trim().length < 10) return;

    setPhase('evaluating');
    try {
      const result = await evaluateInterviewAnswer(
        questions[currentIndex].question,
        currentAnswer,
        jobDescription
      );
      if (result.success && result.feedback) {
        setFeedbacks((prev) => [...prev, result.feedback]);
        setPhase('feedback');
      } else {
        setError(result.message || 'Failed to evaluate answer.');
        setPhase('interviewing');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to evaluate your answer.');
      setPhase('interviewing');
    }
  };

  const handleNextQuestion = () => {
    if (currentIndex + 1 >= questions.length) {
      setPhase('complete');
      topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      setCurrentIndex((i) => i + 1);
      setCurrentAnswer('');
      setPhase('interviewing');
    }
  };

  const handleRestart = () => {
    setPhase('idle');
    setQuestions([]);
    setFeedbacks([]);
    setCurrentIndex(0);
    setCurrentAnswer('');
    setError('');
    setExpandedSample(null);
  };

  const averageScore = feedbacks.length > 0
    ? Math.round(feedbacks.reduce((sum, f) => sum + f.score, 0) / feedbacks.length)
    : 0;

  const currentQuestion = questions[currentIndex];
  const progress = questions.length > 0 ? ((currentIndex + (phase === 'feedback' || phase === 'complete' ? 1 : 0)) / questions.length) * 100 : 0;

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden" ref={topRef}>
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-800 via-purple-800 to-indigo-900 text-white p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
              <Mic className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold">AI Mock Interview</h3>
              <p className="text-white/80 text-sm">
                {phase === 'idle'
                  ? 'Practice with AI-generated questions tailored to this role'
                  : phase === 'complete'
                  ? 'Interview complete — review your performance'
                  : `Question ${currentIndex + 1} of ${questions.length}`}
              </p>
            </div>
          </div>
          {phase !== 'idle' && phase !== 'loading' && phase !== 'complete' && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-white/70 text-sm">
                <Clock className="w-4 h-4" />
                {formatTime(timer)}
              </div>
              <div className="flex flex-col items-center justify-center w-14 h-14 rounded-full bg-white/20 ring-2 ring-white/30">
                <span className="text-base font-bold leading-none">{currentIndex + 1}/{questions.length}</span>
              </div>
            </div>
          )}
          {phase === 'complete' && (
            <div className={`flex flex-col items-center justify-center w-20 h-20 rounded-full bg-white/20 ring-2 ${getScoreColor(averageScore).ring}`}>
              <span className="text-xl font-bold leading-none">{averageScore}</span>
              <span className="text-[10px] uppercase tracking-wider opacity-80">avg</span>
            </div>
          )}
        </div>

        {/* Progress bar (only during interview) */}
        {phase !== 'idle' && phase !== 'loading' && (
          <div className="mt-4">
            <div className="w-full bg-white/20 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full rounded-full bg-white/80 transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* === IDLE STATE === */}
      {phase === 'idle' && (
        <div className="p-6">
          <div className="max-w-lg mx-auto text-center space-y-6">
            {/* Illustration area */}
            <div className="relative py-6">
              <div className="w-24 h-24 mx-auto rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center shadow-inner">
                <MessageCircle className="w-12 h-12 text-indigo-600" />
              </div>
              <div className="absolute top-4 left-1/2 -translate-x-20 w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center opacity-60 animate-pulse">
                <Zap className="w-5 h-5 text-amber-500" />
              </div>
              <div className="absolute bottom-4 left-1/2 translate-x-12 w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center opacity-60 animate-pulse" style={{ animationDelay: '1s' }}>
                <Target className="w-5 h-5 text-emerald-500" />
              </div>
            </div>

            <div>
              <h4 className="text-xl font-bold text-gray-800 mb-2">
                Prepare for Your{' '}
                <span className="text-indigo-600">{jobTitle || 'Target'}</span> Interview
                {company ? ` at ${company}` : ''}
              </h4>
              <p className="text-gray-500 text-sm">
                The AI will ask you role-specific questions based on the job description and your resume.
                Type your answers and get instant feedback with scoring.
              </p>
            </div>

            {/* Settings */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Number of Questions</span>
                <div className="flex items-center gap-1">
                  {[3, 5, 7].map((n) => (
                    <button
                      key={n}
                      onClick={() => setQuestionCount(n)}
                      className={`w-10 h-10 rounded-lg text-sm font-bold transition-all ${
                        questionCount === n
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'bg-white text-gray-600 border border-gray-200 hover:border-indigo-300'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Clock className="w-3.5 h-3.5" />
                Estimated time: ~{questionCount * 3} minutes
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                {error}
              </div>
            )}

            <button
              onClick={handleStartInterview}
              className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
            >
              <Sparkles className="w-5 h-5" />
              Start Mock Interview
            </button>
          </div>
        </div>
      )}

      {/* === LOADING STATE === */}
      {phase === 'loading' && (
        <div className="p-10 flex flex-col items-center justify-center text-center space-y-5">
          <div className="relative">
            <div className="w-20 h-20 rounded-full border-4 border-indigo-200" />
            <div className="w-20 h-20 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin absolute inset-0" />
            <Brain className="w-8 h-8 text-indigo-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <div>
            <h4 className="text-lg font-bold text-gray-800">Preparing Your Interview</h4>
            <p className="text-gray-500 text-sm mt-1">
              Analyzing the job description and your resume to craft {questionCount} tailored questions...
            </p>
          </div>
        </div>
      )}

      {/* === INTERVIEWING STATE === */}
      {phase === 'interviewing' && currentQuestion && (
        <div className="p-6 space-y-5">
          {/* Question Card */}
          <div className="relative">
            <div className="bg-gradient-to-br from-gray-50 to-indigo-50/30 rounded-xl p-5 border border-indigo-100">
              <div className="flex items-center gap-2 mb-3">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${TYPE_COLORS[currentQuestion.type] || TYPE_COLORS.behavioral}`}>
                  {React.createElement(TYPE_ICONS[currentQuestion.type] || Users, { className: 'w-3.5 h-3.5' })}
                  {currentQuestion.type}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${DIFF_COLORS[currentQuestion.difficulty] || DIFF_COLORS.medium}`}>
                  {currentQuestion.difficulty}
                </span>
              </div>
              <p className="text-gray-800 text-lg font-semibold leading-relaxed">
                {currentQuestion.question}
              </p>
              <p className="text-gray-400 text-xs mt-3 italic">
                {currentQuestion.context}
              </p>
            </div>
          </div>

          {/* Answer Box */}
          <div className="space-y-3">
            {/* Answer mode selector */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <label className="text-base font-semibold text-gray-800">Your Answer</label>
                {/* Input mode toggle */}
                {voiceSupported && (
                  <div className="flex items-center bg-gray-100 border border-gray-200 rounded-xl p-1 shadow-sm">
                    <button
                      onClick={() => { if (isListening) stopListening(); setInputMode('type'); }}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                        inputMode === 'type'
                          ? 'bg-white text-indigo-700 shadow-md ring-1 ring-indigo-200'
                          : 'text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      <Keyboard className="w-4.5 h-4.5" />
                      Type
                    </button>
                    <button
                      onClick={() => setInputMode('voice')}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                        inputMode === 'voice'
                          ? 'bg-white text-purple-700 shadow-md ring-1 ring-purple-200'
                          : 'text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      <Mic className="w-4.5 h-4.5" />
                      Voice
                    </button>
                  </div>
                )}
              </div>
              <span className={`text-xs font-medium ${currentAnswer.length < 50 ? 'text-gray-400' : currentAnswer.length < 100 ? 'text-amber-500' : 'text-emerald-500'}`}>
                {currentAnswer.length} characters
                {currentAnswer.length < 50 && ' (aim for 100+)'}
              </span>
            </div>

            {/* Voice mode */}
            {inputMode === 'voice' && (
              <div className="space-y-3">
                <div className="flex flex-col items-center justify-center py-6 bg-gradient-to-br from-gray-50 to-indigo-50/30 rounded-xl border border-gray-200">
                  <button
                    onClick={toggleListening}
                    className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-lg ${
                      isListening
                        ? 'bg-red-500 hover:bg-red-600 shadow-red-200'
                        : 'bg-gradient-to-br from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-indigo-200'
                    }`}
                  >
                    {isListening && (
                      <>
                        <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-30" />
                        <span className="absolute inset-[-6px] rounded-full border-2 border-red-300 animate-pulse" />
                      </>
                    )}
                    {isListening ? (
                      <MicOff className="w-8 h-8 text-white relative z-10" />
                    ) : (
                      <Mic className="w-8 h-8 text-white relative z-10" />
                    )}
                  </button>
                  <p className={`mt-3 text-sm font-medium ${
                    isListening ? 'text-red-600' : 'text-gray-500'
                  }`}>
                    {isListening ? 'Listening… tap to stop' : 'Tap to start speaking'}
                  </p>
                  {isListening && (
                    <div className="flex items-center gap-1 mt-2">
                      {[0, 1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className="w-1 bg-red-400 rounded-full animate-pulse"
                          style={{
                            height: `${12 + Math.random() * 16}px`,
                            animationDelay: `${i * 0.15}s`,
                            animationDuration: '0.6s',
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
                {/* Transcribed text (editable) */}
                <textarea
                  value={currentAnswer}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                  placeholder="Your spoken answer will appear here. You can also edit it before submitting."
                  className="w-full rounded-xl border border-gray-200 p-4 text-gray-700 placeholder:text-gray-400 text-sm resize-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none transition-all"
                  rows={4}
                />
              </div>
            )}

            {/* Type mode */}
            {inputMode === 'type' && (
              <textarea
                ref={textareaRef}
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.metaKey && currentAnswer.trim().length >= 10) {
                    handleSubmitAnswer();
                  }
                }}
                placeholder="Type your answer here... Think about specific examples, measurable outcomes, and the STAR method (Situation, Task, Action, Result)."
                className="w-full rounded-xl border border-gray-200 p-4 text-gray-700 placeholder:text-gray-400 text-sm resize-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none transition-all"
                rows={6}
              />
            )}

            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-400">
                {inputMode === 'type' ? (
                  <>Press <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-500 font-mono text-[11px]">⌘ Enter</kbd> to submit</>
                ) : (
                  isListening ? 'Speak clearly — your answer is being transcribed live' : 'Tap the mic, then speak your answer'
                )}
              </p>
              <button
                onClick={() => { if (isListening) stopListening(); handleSubmitAnswer(); }}
                disabled={currentAnswer.trim().length < 10}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium text-sm hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all shadow-md"
              >
                <Send className="w-4 h-4" />
                Submit Answer
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
              {error}
            </div>
          )}
        </div>
      )}

      {/* === EVALUATING STATE === */}
      {phase === 'evaluating' && (
        <div className="p-10 flex flex-col items-center justify-center text-center space-y-5">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-purple-200" />
            <div className="w-16 h-16 rounded-full border-4 border-purple-600 border-t-transparent animate-spin absolute inset-0" />
            <BarChart3 className="w-6 h-6 text-purple-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <div>
            <h4 className="text-lg font-bold text-gray-800">Evaluating Your Answer</h4>
            <p className="text-gray-500 text-sm mt-1">Analyzing relevance, completeness, and providing feedback...</p>
          </div>
        </div>
      )}

      {/* === FEEDBACK STATE === */}
      {phase === 'feedback' && feedbacks.length > 0 && (
        <div className="p-6 space-y-5">
          {(() => {
            const fb = feedbacks[feedbacks.length - 1];
            const sc = getScoreColor(fb.score);
            return (
              <>
                {/* Score Header */}
                <div className={`rounded-xl p-5 ${sc.bg} border`}>
                  <div className="flex items-center gap-5">
                    <div className={`flex flex-col items-center justify-center w-20 h-20 rounded-full ring-4 ${sc.ring} bg-white shadow-sm`}>
                      <span className={`text-2xl font-bold ${sc.text}`}>{fb.score}</span>
                      <span className="text-[10px] text-gray-500 uppercase tracking-wider">{getScoreLabel(fb.score)}</span>
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Relevance</span>
                        <span className="font-bold text-gray-800">{fb.relevance}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div className={`h-full rounded-full bg-gradient-to-r ${getScoreColor(fb.relevance).gradient}`} style={{ width: `${fb.relevance}%` }} />
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Completeness</span>
                        <span className="font-bold text-gray-800">{fb.completeness}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div className={`h-full rounded-full bg-gradient-to-r ${getScoreColor(fb.completeness).gradient}`} style={{ width: `${fb.completeness}%` }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Strengths & Improvements */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                    <h5 className="font-semibold text-emerald-800 mb-2 flex items-center gap-1.5 text-sm">
                      <CheckCircle className="w-4 h-4" /> Strengths
                    </h5>
                    <ul className="space-y-1.5">
                      {fb.strengths.map((s, i) => (
                        <li key={i} className="text-sm text-emerald-700 flex items-start gap-1.5">
                          <Star className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                    <h5 className="font-semibold text-amber-800 mb-2 flex items-center gap-1.5 text-sm">
                      <Lightbulb className="w-4 h-4" /> Improvements
                    </h5>
                    <ul className="space-y-1.5">
                      {fb.improvements.map((imp, i) => (
                        <li key={i} className="text-sm text-amber-700 flex items-start gap-1.5">
                          <ArrowRight className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                          {imp}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Sample Answer Toggle */}
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setExpandedSample(expandedSample === currentIndex ? null : currentIndex)}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-500" />
                      View Sample Strong Answer
                    </span>
                    {expandedSample === currentIndex ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                  {expandedSample === currentIndex && (
                    <div className="px-4 pb-4 border-t border-gray-100">
                      <p className="text-sm text-gray-600 mt-3 leading-relaxed whitespace-pre-line">
                        {fb.sampleAnswer}
                      </p>
                    </div>
                  )}
                </div>

                {/* Next button */}
                <div className="flex justify-center">
                  <button
                    onClick={handleNextQuestion}
                    className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg"
                  >
                    {currentIndex + 1 >= questions.length ? (
                      <>
                        <Trophy className="w-5 h-5" />
                        View Final Results
                      </>
                    ) : (
                      <>
                        Next Question
                        <ChevronRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* === COMPLETE STATE === */}
      {phase === 'complete' && (
        <div className="p-6 space-y-6">
          {/* Overall Score Card */}
          <div className={`rounded-xl p-6 ${getScoreColor(averageScore).bg} border`}>
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className={`flex flex-col items-center justify-center w-28 h-28 rounded-full ring-4 ${getScoreColor(averageScore).ring} bg-white shadow-md`}>
                <Trophy className={`w-5 h-5 mb-1 ${getScoreColor(averageScore).text}`} />
                <span className={`text-3xl font-bold ${getScoreColor(averageScore).text}`}>{averageScore}</span>
                <span className="text-[10px] text-gray-500 uppercase tracking-wider">{getScoreLabel(averageScore)}</span>
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h4 className="text-xl font-bold text-gray-800 mb-1">Interview Performance Summary</h4>
                <p className="text-gray-500 text-sm">
                  You answered {feedbacks.length} question{feedbacks.length !== 1 ? 's' : ''} with an average score of{' '}
                  <strong className={getScoreColor(averageScore).text}>{averageScore}/100</strong>.{' '}
                  {averageScore >= 75
                    ? "Great preparation — you're ready for the real thing!"
                    : averageScore >= 55
                    ? 'Solid effort! Review the feedback below to sharpen your answers.'
                    : 'Keep practicing — focus on the improvement suggestions below.'}
                </p>
              </div>
            </div>
          </div>

          {/* Per-Question Breakdown */}
          <div className="space-y-3">
            <h5 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Question-by-Question Breakdown</h5>
            {questions.map((q, idx) => {
              const fb = feedbacks[idx];
              if (!fb) return null;
              const sc = getScoreColor(fb.score);
              return (
                <div key={idx} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <div className="flex items-start gap-3">
                    <div className={`flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center ring-2 ${sc.ring} bg-white`}>
                      <span className={`text-sm font-bold ${sc.text}`}>{fb.score}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${TYPE_COLORS[q.type] || TYPE_COLORS.behavioral}`}>
                          {q.type}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-[11px] font-medium ${DIFF_COLORS[q.difficulty]}`}>{q.difficulty}</span>
                      </div>
                      <p className="text-sm text-gray-700 font-medium leading-snug">{q.question}</p>
                      <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                        <span>Relevance: <strong className={getScoreColor(fb.relevance).text}>{fb.relevance}%</strong></span>
                        <span>Completeness: <strong className={getScoreColor(fb.completeness).text}>{fb.completeness}%</strong></span>
                      </div>
                      {/* Key improvement */}
                      {fb.improvements.length > 0 && (
                        <div className="mt-2 flex items-start gap-1.5 text-xs text-amber-600">
                          <Lightbulb className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                          <span>{fb.improvements[0]}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <button
              onClick={handleRestart}
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-100 text-indigo-700 rounded-xl font-medium hover:bg-indigo-200 transition-colors"
            >
              <RotateCcw className="w-5 h-5" />
              Try Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}