import React from 'react';
import { ArrowRight, CheckCircle, Star, FileText, Target, Sparkles, TrendingUp, Cloud, Copy, MousePointer, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/app');
  };

  const iconFeatures = [
    {
      icon: FileText,
      title: 'Resume Analysis',
      description: 'AI-powered scanning and ATS optimization',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Target,
      title: 'ATS Compatibility',
      description: 'Detailed scoring and recommendations',
      color: 'from-purple-500 to-pink-500',
    },
    {
      icon: Sparkles,
      title: 'Smart Optimization',
      description: 'Tailored resume for each job',
      color: 'from-indigo-500 to-purple-500',
    },
    {
      icon: TrendingUp,
      title: 'Keyword Insights',
      description: 'Match job requirements instantly',
      color: 'from-green-500 to-emerald-500',
    },
  ];

  const checkFeatures = [
    'AI-powered resume analysis',
    'ATS compatibility scoring',
    'Smart resume optimization',
    'Keyword matching & insights',
    'Job description analysis',
    'Instant feedback & suggestions',
  ];

  const steps = [
    { number: 1, icon: Cloud,        title: 'Upload Resume',         description: 'Upload or Drag & drop your resume to start' },
    { number: 2, icon: Copy,         title: 'Paste Job Description', description: 'Copy the job posting you want to target' },
    { number: 3, icon: MousePointer, title: 'Select Skills',         description: 'Choose the skills you actually have' },
    { number: 4, icon: Download,     title: 'Download Resume',       description: 'Get your ATS-ready resume instantly' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col items-center justify-center p-4 py-8 sm:py-10">
      <div className="max-w-5xl w-full flex flex-col gap-8">

        {/* ── Hero Section ── */}
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-start">

          {/* Left Side */}
          <div className="flex flex-col space-y-6 lg:mt-20">

            {/* Logo + Name */}
            <div className="flex items-center justify-center lg:justify-start gap-0">
              <img
                src="/Logo3.png"
                alt="CareerDev AI"
                className="h-16 sm:h-20 lg:h-24 w-auto object-contain"
              />
              <div className="flex flex-col mt-4">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 bg-clip-text text-transparent tracking-tight leading-tight">
                  CareerDev AI
                </h1>
                <p className="text-gray-500 text-sm sm:text-base italic tracking-wide text-center lg:text-left">
                  Your AI-Powered Career Assistant
                </p>
              </div>
            </div>

            {/* Headline + Subtext */}
            <div className="text-center lg:text-left">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight mb-2">
                Start Your Career Journey
              </h2>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                Optimize your resume with AI and accelerate your career growth.
              </p>
            </div>

            {/* Highlight Card */}
            <div className="flex items-center gap-3 bg-white/80 backdrop-blur-sm rounded-xl p-3.5 shadow-sm border border-gray-100 max-w-xs mx-auto lg:mx-0">
              <div className="w-9 h-9 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                <Star className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="font-bold text-gray-800 text-sm">Interactive Skill Matching!</p>
                <p className="text-xs text-gray-500">You control every skill - authentic optimization that gets results</p>
              </div>
            </div>

            {/* Checklist — 2 columns on mobile, stays as is */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
              {checkFeatures.map((f, i) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 text-sm">{f}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Side Card — mt pushes it down to align with CareerDev AI text */}
          <div className="mt-0 lg:mt-20 bg-white rounded-2xl shadow-2xl p-5 sm:p-6 flex flex-col gap-4">

            {/* Badge */}
            <div className="flex justify-end">
              <span className="text-xs bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-3 py-1 rounded-full font-medium">
                Powered by advanced AI
              </span>
            </div>

            {/* 2×2 Feature Cards */}
            <div className="grid grid-cols-2 gap-3">
              {iconFeatures.map((f, i) => {
                const Icon = f.icon;
                return (
                  <div
                    key={i}
                    className="rounded-xl p-4 border bg-gray-50 border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all flex flex-col items-center text-center gap-2"
                  >
                    <div className={`p-2.5 bg-gradient-to-br ${f.color} rounded-xl`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-sm font-bold text-gray-800">{f.title}</p>
                    <p className="text-[11px] text-gray-500 leading-snug">{f.description}</p>
                  </div>
                );
              })}
            </div>

            {/* CTA */}
            <button
              onClick={handleGetStarted}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3.5 px-6 rounded-xl font-bold text-base hover:from-indigo-700 hover:to-purple-700 focus:ring-4 focus:ring-indigo-200 transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
            >
              Get Started Free Now
              <ArrowRight className="w-5 h-5" />
            </button>

            {/* Subtext */}
            <p className="text-center text-xs text-gray-400">
              Be among the first to experience AI-powered career advancement
            </p>
          </div>
        </div>

        {/* ── How It Works — fully responsive ── */}
        <div className="mt-10 relative bg-white rounded-2xl shadow-md border border-gray-100 px-4 sm:px-6 py-6 sm:py-8 overflow-hidden">

          {/* Subtle background accent */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -translate-y-1/2 translate-x-1/4 blur-2xl" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-50 rounded-full translate-y-1/2 -translate-x-1/4 blur-2xl" />

          {/* Header */}
          <div className="relative flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 mb-6 sm:mb-8">
            <span className="text-[10px] font-semibold tracking-widest uppercase text-indigo-500 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full whitespace-nowrap">
              Simple Process
            </span>
            <h3 className="text-sm sm:text-base lg:text-lg font-extrabold text-gray-900 text-center">
              How CareerDev AI Works in{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                4 Simple Steps
              </span>
            </h3>
          </div>

          {/* Steps */}
          <div className="relative grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-4">

            {/* Connector line — desktop only */}
            <div className="hidden sm:block absolute top-5 left-[12.5%] right-[12.5%] h-px bg-indigo-100" />

            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.number} className="group flex flex-col items-center text-center gap-2 sm:gap-3">
                  <div className="relative z-10">
                    <div className="w-12 h-12 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 flex items-center justify-center group-hover:from-indigo-100 group-hover:to-purple-100 group-hover:scale-110 transition-all duration-300 shadow-sm">
                      <Icon className="w-5 h-5 sm:w-4 sm:h-4 text-indigo-500" />
                    </div>
                    <div className="absolute -top-1.5 -right-1.5 w-5 h-5 sm:w-4 sm:h-4 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-sm">
                      <span className="text-[9px] sm:text-[8px] font-extrabold text-white">{step.number}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm sm:text-xs font-bold text-gray-800 leading-tight">{step.title}</p>
                    <p className="text-xs sm:text-[10px] text-gray-400 leading-snug mt-0.5">{step.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
