import React from 'react';
import { Sparkles, CheckCircle, ArrowLeft } from 'lucide-react';
import Footer from '../components/Footer';
import { Link } from 'react-router-dom';

const Features: React.FC = () => {
  const features = [
    {
      title: "AI-Powered Analysis",
      description: "Advanced AI algorithms analyze your resume against job descriptions to provide intelligent optimization suggestions.",
      highlights: ["Deep learning models", "Natural language processing", "Contextual understanding"]
    },
    {
      title: "ATS Score Optimization",
      description: "Get detailed ATS scores with breakdowns for keyword integration, job requirements match, completeness, and formatting.",
      highlights: ["Real-time scoring", "Industry-standard metrics", "Actionable feedback"]
    },
    {
      title: "Smart Resume Tailoring",
      description: "Automatically tailor your resume for specific job descriptions while maintaining your authentic voice and experience.",
      highlights: ["Job-specific customization", "Keyword integration", "Professional formatting"]
    },
    {
      title: "Instant Feedback",
      description: "Receive immediate insights on how to improve your resume with specific, actionable recommendations.",
      highlights: ["Real-time analysis", "Detailed suggestions", "Quick iterations"]
    },
    {
      title: "Privacy & Security",
      description: "Your resume data is processed securely and privately. We never share or store your personal information.",
      highlights: ["Encrypted processing", "No data retention", "GDPR compliant"]
    },
    {
      title: "Career Insights",
      description: "Get strategic insights about job market trends and how your resume compares to industry standards.",
      highlights: ["Market analysis", "Competitive benchmarking", "Trend identification"]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-16 max-w-7xl">
        {/* Back to Home Button */}
        <div className="mb-8">
          <Link
            to="/app"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-lg font-semibold transition-all duration-300 shadow-md hover:shadow-lg group"
          >
            <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-2 mb-4">

            <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Features
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover how CareerLab AI empowers you to create winning resumes that get past ATS systems and land interviews
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-indigo-200 hover:-translate-y-1"
            >
              <h3 className="text-2xl font-bold text-gray-800 mb-3">{feature.title}</h3>
              <p className="text-gray-600 mb-4">{feature.description}</p>
              <ul className="space-y-2">
                {feature.highlights.map((highlight, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    {highlight}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-2xl p-12 shadow-xl mb-16">
          <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-indigo-600">1</span>
              </div>
              <h4 className="font-semibold text-gray-800 mb-2">Upload Resume</h4>
              <p className="text-sm text-gray-600">Upload your existing resume in any format</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-purple-600">2</span>
              </div>
              <h4 className="font-semibold text-gray-800 mb-2">Paste Job Description</h4>
              <p className="text-sm text-gray-600">Add the job posting you're targeting</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">3</span>
              </div>
              <h4 className="font-semibold text-gray-800 mb-2">AI Analysis</h4>
              <p className="text-sm text-gray-600">Get instant ATS score and recommendations</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-600">4</span>
              </div>
              <h4 className="font-semibold text-gray-800 mb-2">Optimize & Download</h4>
              <p className="text-sm text-gray-600">Get your optimized resume ready to apply</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link
            to="/app"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-full font-semibold text-lg hover:shadow-2xl transition-all duration-300 hover:scale-105"
          >
            <Sparkles className="w-5 h-5" />
            Try CareerLab AI Now
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Features;
