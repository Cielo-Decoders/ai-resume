import React from 'react';
import { ArrowRight, CheckCircle, Star, FileText, Target, Sparkles, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/app');
  };

  const features = [
    'AI-powered resume optimization',
    'Interview preparation assistance',
    'Salary insights & negotiation',
    '1000+ freshly posted jobs',
    'Application tracking system',
    'ATS compatibility scoring'
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
      description: 'AI-powered resume enhancements',
      color: 'from-indigo-500 to-purple-500'
    },
    {
      icon: TrendingUp,
      title: 'Career Growth',
      description: 'Track applications and insights',
      color: 'from-green-500 to-emerald-500'
    }
  ];

  return (
    <div className="h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4 overflow-hidden">
      <div className="max-w-6xl w-full grid lg:grid-cols-2 gap-6 items-stretch">

        {/* Left Side - Branding & Features */}
        <div className="flex flex-col justify-start pt-4 space-y-6 text-center lg:text-left">
          <div>
            <div className="flex items-center justify-center lg:justify-start mb-6">
              <div>
                <h1 className="text-6xl lg:text-7xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent leading-tight">
                  CareerLab AI
                </h1>
                <p className="text-gray-600 text-lg lg:text-xl mt-3 font-medium">
                  Your AI-Powered Career Assistant
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-800">
              Start Your Career Journey
            </h2>
            <p className="text-base lg:text-lg text-gray-600">
              Join thousands of professionals who have landed their dream jobs with our AI-powered platform.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 bg-white/60 backdrop-blur-sm rounded-lg p-3">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                <Star className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 text-base">95% Success Rate</h3>
                <p className="text-sm text-gray-600">Users get 3x more interviews</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {features.map((feature, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span className="text-gray-700 text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side - Feature Icons */}
        <div className="bg-white rounded-2xl shadow-2xl p-6 lg:p-8 flex flex-col justify-center max-h-[600px] mt-[5%]">
          <div className="grid grid-cols-2 gap-4 mb-6">
            {iconFeatures.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div
                  key={idx}
                  className="group relative bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 border border-gray-200 hover:border-indigo-300 hover:shadow-lg transition-all duration-300 hover:scale-105"
                >
                  <div className="flex flex-col items-center text-center space-y-2">
                    <div className={`p-3 bg-gradient-to-br ${feature.color} rounded-lg group-hover:scale-110 transition-transform`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h4 className="font-bold text-gray-800 text-sm">
                      {feature.title}
                    </h4>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-center">
            <button
              onClick={handleGetStarted}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-6 rounded-lg font-bold text-base hover:from-indigo-700 hover:to-purple-700 focus:ring-4 focus:ring-indigo-200 transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
            >
              Get Started Now
              <ArrowRight className="w-5 h-5" />
            </button>
            <p className="mt-3 text-xs text-gray-500">
              Join thousands of professionals who landed their dream jobs
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
