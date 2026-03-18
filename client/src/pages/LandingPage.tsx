import {
  ArrowRight, CheckCircle, Star, FileText,
  Search, List, Download, Upload, ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/* ─── Tiny Before/After Resume Mock ──────────────────────────────── */
function ResumeMock({ variant }: { variant: 'before' | 'after' }) {
  const isAfter = variant === 'after';
  const hi = (idx: number, alwaysHighlight?: boolean) =>
    isAfter && (alwaysHighlight || [1, 3].includes(idx));

  return (
    <div
      className="flex-1 bg-white rounded-xl p-3 text-[7px] leading-tight"
      style={{
        boxShadow: isAfter
          ? '0 0 0 2px #A855F7, 0 10px 15px -3px rgb(0 0 0 / 0.08)'
          : '0 10px 15px -3px rgb(0 0 0 / 0.08)',
      }}
    >
      {/* Header label */}
      <div
        className="text-center font-semibold mb-2 text-[8px]"
        style={{ color: isAfter ? '#7C3AED' : '#94A3B8' }}
      >
        {isAfter ? 'After' : 'Before'}
      </div>

      {/* Name line */}
      <div className="font-bold text-gray-700 mb-0.5 text-[8px]">Daniel Example</div>
      <div className="h-1 w-24 bg-gray-200 rounded mb-2" />

      {/* Experience */}
      <div className="text-[6px] font-bold text-gray-400 uppercase tracking-wide mb-1">Experience</div>
      {[82, 68, 55, 75].map((w, i) => (
        <div
          key={i}
          className="h-1.5 rounded-full mb-1"
          style={{
            width: `${w}%`,
            background: hi(i) ? 'linear-gradient(90deg,#7C3AED,#A855F7)' : '#E2E8F0',
          }}
        />
      ))}

      {/* Skills */}
      <div className="text-[6px] font-bold text-gray-400 uppercase tracking-wide mt-2 mb-1">Skills</div>
      <div className="flex flex-wrap gap-1">
        {['React', 'TypeScript', 'Node.js'].map((skill, i) => (
          <span
            key={i}
            className="px-1 py-0.5 rounded text-[5px] font-medium"
            style={
              isAfter && i < 2
                ? { background: '#EDE9FE', color: '#6D28D9' }
                : { background: '#F1F5F9', color: '#64748B' }
            }
          >
            {skill}
          </span>
        ))}
      </div>

      {/* Education */}
      <div className="text-[6px] font-bold text-gray-400 uppercase tracking-wide mt-2 mb-1">Education</div>
      {[78, 58].map((w, i) => (
        <div key={i} className="h-1.5 rounded-full mb-1 bg-gray-200" style={{ width: `${w}%` }} />
      ))}
    </div>
  );
}

function BeforeAfterPreview() {
  return (
    <div className="flex items-stretch gap-2 mt-5">
      <ResumeMock variant="before" />
      <div className="flex items-center flex-shrink-0">
        <div
          className="flex items-center justify-center w-7 h-7 rounded-full"
          style={{ background: 'linear-gradient(135deg,#7C3AED,#A855F7)' }}
        >
          <ChevronRight className="w-4 h-4 text-white" />
        </div>
      </div>
      <ResumeMock variant="after" />
    </div>
  );
}

/* ─── Main Page ───────────────────────────────────────────────────── */
const CHECKLIST = [
  'Upload resume & AI analysis',
  'Job description breakdown & key requirements',
  'Interactive skill selection (you choose what you have)',
  'Seamless integration into your original resume',
  'ATS compatibility scoring & optimization',
  'Keyword insights & instant feedback',
];

const FEATURE_CARDS = [
  {
    icon: Upload,
    title: 'Resume Upload & Analysis',
    description: 'Securely upload your resume for AI-powered scanning',
  },
  {
    icon: Search,
    title: 'Job Description Insights',
    description: 'AI extracts key requirements and skills from the job posting',
  },
  {
    icon: List,
    title: 'Skill Selector',
    description: 'You choose the skills you possess for authentic optimization',
  },
  {
    icon: Download,
    title: 'Optimized Resume Generator',
    description: 'Integrates selected skills into your original resume format',
  },
];

const STEPS = [
  {
    num: 1,
    icon: Upload,
    title: '1. Upload Your Resume',
    desc: 'Drag and drop your resume to start the analysis',
  },
  {
    num: 2,
    icon: FileText,
    title: '2. Paste Job Description',
    desc: 'Copy and paste the job posting you want to target',
  },
  {
    num: 3,
    icon: CheckCircle,
    title: '3. Select Your Matching Skills',
    desc: 'Choose from the AI suggestions the skills you actually have',
  },
  {
    num: 4,
    icon: Download,
    title: '4. Download Optimized Resume',
    desc: 'Get your ATS-ready resume ready for submission',
  },
];

const CARD_SHADOW = '0 10px 15px -3px rgb(0 0 0 / 0.08)';
const PURPLE_GRADIENT = 'linear-gradient(135deg,#6D28D9,#A855F7)';
const PURPLE_GRADIENT_ALT = 'linear-gradient(135deg,#7C3AED 0%,#A855F7 100%)';
const PAGE_BG = 'linear-gradient(145deg,#F8FAFC 0%,#E0E7FF 100%)';

export default function LandingPage() {
  const navigate = useNavigate();
  const goToApp = () => navigate('/app');

  return (
    <div className="min-h-screen font-sans" style={{ background: PAGE_BG }}>

      {/* ── Nav ─────────────────────────────────────────────────────── */}
      <nav className="w-full max-w-[1280px] mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/Logo3.png" alt="CareerDev AI logo" className="h-9 w-auto object-contain" />
          <span className="font-bold text-lg tracking-tight" style={{ color: '#0F172A' }}>
            CareerDev AI
          </span>
        </div>
        <button
          onClick={goToApp}
          className="px-5 py-2 text-white text-sm font-semibold transition-all duration-200 hover:scale-105 hover:shadow-lg"
          style={{ background: PURPLE_GRADIENT, borderRadius: '12px' }}
        >
          Get Started
        </button>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────── */}
      <section className="max-w-[1280px] mx-auto px-6 pt-6 pb-20">
        <div className="grid lg:grid-cols-2 gap-10 xl:gap-16 items-start">

          {/* Left Column */}
          <div className="flex flex-col">
            {/* Headline */}
            <h1
              className="text-4xl sm:text-5xl font-bold leading-tight mb-5"
              style={{ color: '#0F172A', letterSpacing: '-0.02em' }}
            >
              Free AI Resume Optimizer&nbsp;– Upload, Match Skills, Get Hired Faster
            </h1>

            <p className="text-base sm:text-lg leading-relaxed mb-6" style={{ color: '#334155' }}>
              Upload your resume. Paste any job description. Our AI extracts key requirements.
              You select the skills you actually have. We integrate them seamlessly into your
              original resume for a perfectly tailored, ATS-ready version.
            </p>

            {/* Interactive Skill Matching card */}
            <div
              className="bg-white rounded-2xl p-4 flex items-center gap-3 mb-1"
              style={{ boxShadow: CARD_SHADOW, borderRadius: '16px' }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg,#10B981,#059669)' }}
              >
                <Star className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-sm" style={{ color: '#0F172A' }}>
                  Interactive Skill Matching
                </h3>
                <p className="text-sm mt-0.5" style={{ color: '#334155' }}>
                  You control every skill – authentic optimization that gets results
                </p>
              </div>
            </div>

            {/* Before / After */}
            <BeforeAfterPreview />

            {/* Checklist */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5">
              {CHECKLIST.map((item, i) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle
                    className="w-5 h-5 flex-shrink-0 mt-0.5"
                    style={{ color: '#10B981' }}
                  />
                  <span className="text-sm leading-snug" style={{ color: '#334155' }}>
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column */}
          <div className="flex flex-col">
            {/* "Powered by advanced AI" badge */}
            <div className="flex justify-end mb-4">
              <span
                className="text-xs font-semibold text-white px-3 py-1.5"
                style={{ background: PURPLE_GRADIENT_ALT, borderRadius: '999px' }}
              >
                Powered by advanced AI
              </span>
            </div>

            {/* 2×2 Feature Cards */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {FEATURE_CARDS.map((card, i) => {
                const Icon = card.icon;
                return (
                  <div
                    key={i}
                    className="bg-white p-4 transition-all duration-200 hover:scale-[1.03] hover:shadow-xl cursor-default"
                    style={{ boxShadow: CARD_SHADOW, borderRadius: '16px' }}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center mb-3"
                      style={{ background: '#EDE9FE' }}
                    >
                      <Icon className="w-4 h-4" style={{ color: '#6D28D9' }} />
                    </div>
                    <h4 className="font-bold text-sm mb-1 leading-tight" style={{ color: '#0F172A' }}>
                      {card.title}
                    </h4>
                    <p className="text-xs leading-relaxed" style={{ color: '#334155' }}>
                      {card.description}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* CTA Button */}
            <button
              onClick={goToApp}
              className="w-full py-4 text-white font-bold text-lg flex items-center justify-center gap-2 transition-all duration-200 hover:scale-[1.02] hover:shadow-2xl mb-4"
              style={{ background: PURPLE_GRADIENT, borderRadius: '12px' }}
            >
              Upload Resume &amp; Start Free
              <ArrowRight className="w-5 h-5" />
            </button>

            {/* Trust bar */}
            <p className="text-center text-sm font-medium mb-4" style={{ color: '#334155' }}>
              Trusted by 10,000+ professionals&nbsp;•&nbsp;62% higher interview rate
            </p>

            {/* Testimonials */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                {
                  quote:
                    '"CareerDev AI helped me land interviews at Google and Amazon in weeks."',
                  author: '– Sarah M.',
                },
                {
                  quote:
                    '"The skill matching feature is a game-changer for career changers."',
                  author: '– David L.',
                },
              ].map((t, i) => (
                <div
                  key={i}
                  className="bg-white p-3"
                  style={{ boxShadow: CARD_SHADOW, borderRadius: '12px' }}
                >
                  <p className="text-xs italic leading-relaxed" style={{ color: '#334155' }}>
                    {t.quote}
                  </p>
                  <p className="text-xs font-semibold mt-1" style={{ color: '#6D28D9' }}>
                    {t.author}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works ────────────────────────────────────────────── */}
      <section className="py-16 px-6" style={{ background: 'rgba(255,255,255,0.6)' }}>
        <div className="max-w-[1280px] mx-auto">
          <h2
            className="text-3xl sm:text-4xl font-bold text-center mb-12"
            style={{ color: '#0F172A', letterSpacing: '-0.02em' }}
          >
            How CareerDev AI Works in 4 Simple Steps
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {STEPS.map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.num}
                  className="bg-white flex flex-col items-center text-center p-6 transition-all duration-200 hover:scale-[1.03] hover:shadow-xl"
                  style={{ boxShadow: CARD_SHADOW, borderRadius: '16px' }}
                >
                  {/* Number badge */}
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-base mb-3 flex-shrink-0"
                    style={{ background: PURPLE_GRADIENT_ALT }}
                  >
                    {step.num}
                  </div>
                  {/* Icon */}
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
                    style={{ background: '#EDE9FE' }}
                  >
                    <Icon className="w-5 h-5" style={{ color: '#6D28D9' }} />
                  </div>
                  <h3 className="font-bold text-sm leading-snug mb-2" style={{ color: '#0F172A' }}>
                    {step.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: '#334155' }}>
                    {step.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <footer className="py-8 px-6" style={{ background: '#0F172A' }}>
        <div className="max-w-[1280px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img
              src="/Logo3.png"
              alt="CareerDev AI"
              className="h-6 w-auto"
              style={{ filter: 'brightness(0) invert(1)' }}
            />
            <span className="font-bold text-white">CareerDev AI</span>
          </div>
          <p className="text-sm text-gray-400 order-last sm:order-none">
            © 2024 CareerDev AI. All rights reserved.
          </p>
          <div className="flex gap-5 text-sm text-gray-400">
            <a href="/privacy" className="hover:text-white transition-colors">Privacy</a>
            <a href="/terms" className="hover:text-white transition-colors">Terms</a>
            <a href="/contact" className="hover:text-white transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
