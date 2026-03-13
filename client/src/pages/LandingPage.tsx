import React from 'react';
import { ArrowRight, CheckCircle, Star, FileText, Target, Sparkles, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/app');
  };

  const features = [
    'AI-powered resume analysis',
    'ATS compatibility scoring',
    'Smart resume optimization',
    'Keyword matching & insights',
    'Job description analysis',
    'Instant feedback & suggestions'
  ];

  const iconFeatures = [
    {
      icon: FileText,
      title: 'Resume Analysis',
      description: 'AI-powered scanning and ATS optimization',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Target,
      title: 'ATS Compatibility',
      description: 'Detailed scoring and recommendations',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: Sparkles,
      title: 'Smart Optimization',
      description: 'Tailored resume for each job',
      color: 'from-indigo-500 to-purple-500'
    },
    {
      icon: TrendingUp,
      title: 'Keyword Insights',
      description: 'Match job requirements instantly',
      color: 'from-green-500 to-emerald-500'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4 py-8 sm:py-12">
      <div className="max-w-6xl w-full grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">

        {/* Left Side - Branding & Features */}
        <div className="flex flex-col space-y-6 sm:space-y-8">
          {/* Logo and Title Section */}
          <div className="text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start gap-0 mb-1">
              <img
                src="/Logo3.png"
                alt="CareerDev Logo"
                className="h-16 sm:h-20 lg:h-24 w-auto object-contain "
              />
              <div className="flex flex-col mt-4">
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 bg-clip-text text-transparent drop-shadow-2xl tracking-tight leading-tight">
                  CareerDev AI
                </h1>
                <p className="text-gray-600 text-base sm:text-lg font-medium tracking-wide text-center">
                  Your AI-Powered Career Assistant
                </p>
              </div>
            </div>
          </div>

          {/* Journey Section */}
          <div className="text-center lg:text-left">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-3">
              Start Your Career Journey
            </h2>
            <p className="text-base sm:text-lg text-gray-600">
              Optimize your resume with AI and accelerate your career growth.
            </p>
          </div>

          {/* AI-Powered Optimization Card */}
          <div className="flex items-center gap-3 bg-white/60 backdrop-blur-sm rounded-lg p-3 shadow-sm max-w-md mx-auto lg:mx-0">
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
              <Star className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 text-base">AI-Powered Optimization</h3>
              <p className="text-sm text-gray-600">Get noticed by top employers</p>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md mx-auto lg:mx-0">
            {features.map((feature, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-gray-700 text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side - Feature Icons */}
        <div className="bg-white rounded-2xl shadow-2xl p-4 sm:p-6 flex flex-col justify-between mt-8 lg:mt-12">
          {/* Feature Icons Grid */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4">
            {iconFeatures.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div
                  key={idx}
                  className="group relative bg-gradient-to-br from-gray-50 to-white rounded-xl p-3 sm:p-4 border border-gray-200 hover:border-indigo-300 hover:shadow-lg transition-all duration-300 hover:scale-105"
                >
                  <div className="flex flex-col items-center text-center space-y-1.5 sm:space-y-2">
                    <div className={`p-2 sm:p-2.5 bg-gradient-to-br ${feature.color} rounded-lg group-hover:scale-110 transition-transform`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <h4 className="font-bold text-gray-800 text-xs sm:text-sm">
                      {feature.title}
                    </h4>
                    <p className="text-[10px] sm:text-xs text-gray-600 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* CTA Button */}
          <div className="text-center">
            <button
              onClick={handleGetStarted}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-6 rounded-lg font-bold text-sm sm:text-base hover:from-indigo-700 hover:to-purple-700 focus:ring-4 focus:ring-indigo-200 transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
            >
              Get Started Now
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <p className="mt-2 sm:mt-3 text-[10px] sm:text-xs text-gray-500">
              Be among the first to experience AI-powered career advancement
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
