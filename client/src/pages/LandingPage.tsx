import React from 'react';
import { CheckCircle, Star, ArrowRight, Sparkles, TrendingUp, Users, Award, Zap, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/app');
  };

  const features = [
    { icon: Sparkles, text: 'AI-powered resume optimization', color: 'from-purple-500 to-pink-500' },
    { icon: Users, text: 'Interview preparation assistance', color: 'from-blue-500 to-cyan-500' },
    { icon: TrendingUp, text: 'Salary insights', color: 'from-green-500 to-emerald-500' },
    { icon: Target, text: '1000+ freshly posted jobs', color: 'from-orange-500 to-red-500' },
    { icon: Award, text: 'Application tracking system', color: 'from-indigo-500 to-purple-500' },
    { icon: CheckCircle, text: 'ATS compatibility scoring', color: 'from-teal-500 to-green-500' }
  ];

  const stats = [
    { value: '95%', label: 'Success Rate', icon: TrendingUp },
    { value: '3x', label: 'More Interviews', icon: Award }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4 py-8">
        <div className="max-w-7xl w-full">
          <div className="text-center space-y-6">

            {/* Logo and Title Section */}
            <div className="space-y-3 animate-fade-in">
              <h1 className="text-4xl lg:text-6xl font-black">
                <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent animate-gradient">
                  CareerLab AI
                </span>
              </h1>

              <p className="text-lg lg:text-xl text-gray-300 font-light max-w-2xl mx-auto">
                Your AI-Powered Career Assistant
              </p>
            </div>

            {/* Main Headline */}
            <div className="space-y-3 animate-fade-in-delay">
              <h2 className="text-2xl lg:text-4xl font-bold text-white leading-tight">
                Optimize Your Resume & Land
                <br />
                <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  Your Dream Job Faster
                </span>
              </h2>
              <p className="text-base lg:text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed">
                Beat ATS systems, get expert interview prep, and accelerate your career with AI-powered insights
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
              {stats.map((stat, idx) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={idx}
                    className="group bg-white/10 backdrop-blur-lg border border-white/10 rounded-xl p-4 hover:bg-indigo-600/30 hover:border-indigo-500/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-indigo-500/20"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div className="p-2 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-lg group-hover:from-indigo-500/30 group-hover:to-purple-500/30 transition-all">
                        <Icon className="w-6 h-6 text-indigo-300" />
                      </div>
                      <div className="text-center">
                        <h3 className="text-2xl lg:text-3xl font-bold text-white mb-1">{stat.value}</h3>
                        <p className="text-gray-300 text-xs font-medium">{stat.label}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Features Grid */}
            <div className="max-w-4xl mx-auto">
              <h3 className="text-xl lg:text-2xl font-bold text-white mb-4">
                Everything You Need to Succeed
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {features.map((feature, idx) => {
                  const Icon = feature.icon;
                  return (
                    <div
                      key={idx}
                      className="group relative bg-white/10 backdrop-blur-lg border border-white/10 rounded-lg p-4 hover:bg-indigo-600/20 hover:border-white/20 transition-all duration-300 hover:scale-105 hover:shadow-xl"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 bg-gradient-to-br ${feature.color} rounded-lg flex-shrink-0 group-hover:scale-110 transition-transform`}>
                          <Icon className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-white font-medium text-left text-sm leading-relaxed">
                          {feature.text}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* CTA Section */}
            <div className="pt-4">
              <button
                onClick={handleGetStarted}
                className="group relative inline-flex items-center gap-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-10 py-4 rounded-full font-bold text-lg hover:from-indigo-500 hover:to-purple-500 transition-all duration-300 shadow-2xl shadow-indigo-500/50 hover:shadow-indigo-500/70 hover:scale-105 transform"
              >
                <span>Get Started Free</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-400 to-purple-400 blur-lg opacity-50 group-hover:opacity-75 transition-opacity -z-10"></div>
              </button>
            </div>

          </div>
        </div>
      </div>

      <style>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }

        @keyframes gradient {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }

        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }

        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }

        .animate-fade-in-delay {
          animation: fade-in 0.8s ease-out 0.2s backwards;
        }
      `}</style>
    </div>
  );
}
