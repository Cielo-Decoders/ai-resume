import React from 'react';
import { Sparkles, CheckCircle, ArrowLeft } from 'lucide-react';
import Footer from '../components/Footer';
import { Link } from 'react-router-dom';
import PageNavBar from '../components/PageNavBar';

const Features: React.FC = () => {
  const features = [
    {
      title: "Live Resume Editor",
      description: "Upload your PDF and refine it in a two-panel editor. Edit sections in real time and use AI-assisted bullet rewrites to sharpen each line.",
      highlights: ["PDF text + OCR extraction", "Live preview as you type", "AI bullet enhancement"]
    },
    {
      title: "Curated Job Listings",
      description: "Browse roles surfaced from major job boards, see match scores against your resume, and jump straight into analysis with one click.",
      highlights: ["Match score per role", "Filter by location and role", "One-click analyze"]
    },
    {
      title: "ATS Analysis & Optimization",
      description: "Score your resume against any job description and get a rewritten, ATS-friendly version tailored to the role — keyword matching, requirements fit, and formatting all checked.",
      highlights: ["ATS compatibility score", "Job-tailored rewrites", "Missing keyword insights"]
    },
    {
      title: "AI Cover Letters",
      description: "Generate a personalized cover letter for the job you're targeting using your resume and the job description, with adjustable tone.",
      highlights: ["Tailored to each role", "Multiple tone options", "Editable draft output"]
    },
    {
      title: "AI Mock Interviews",
      description: "Practice with role-specific interview questions, submit answers, and get structured feedback so you walk into the real thing prepared.",
      highlights: ["Role-specific question sets", "Answer evaluation", "Actionable feedback"]
    },
    {
      title: "Privacy & Security",
      description: "Your resume is processed in real time over encrypted connections. We don't permanently store full resumes after your session ends.",
      highlights: ["Encrypted in transit", "No long-term resume storage", "Session-based processing"]
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-10 sm:py-16 max-w-7xl">
        <PageNavBar />

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
        <div className="text-center mb-10 sm:mb-16">
          <div className="flex items-center justify-center gap-2 mb-4">
            <h1 className="text-3xl sm:text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Features
            </h1>
          </div>
          <p className="text-base sm:text-xl text-gray-600 max-w-3xl mx-auto">
            Discover how CareerDev AI empowers you to create winning resumes that get past ATS systems and land interviews
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-12 sm:mb-16">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-indigo-200 hover:-translate-y-1 flex flex-col h-full"
            >
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3">{feature.title}</h3>
              <p className="text-gray-600 mb-4 flex-1">{feature.description}</p>
              <ul className="mt-4 space-y-2">
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
        <div className="bg-white rounded-2xl p-6 sm:p-12 shadow-xl mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-8 text-center">How It Works</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-indigo-600">1</span>
              </div>
              <h4 className="font-semibold text-gray-800 mb-2">Update Your Resume</h4>
              <p className="text-sm text-gray-600">Upload your PDF and refine it in the live editor</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-purple-600">2</span>
              </div>
              <h4 className="font-semibold text-gray-800 mb-2">Find a Job</h4>
              <p className="text-sm text-gray-600">Browse listings or paste a job description</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">3</span>
              </div>
              <h4 className="font-semibold text-gray-800 mb-2">Analyze & Optimize</h4>
              <p className="text-sm text-gray-600">Get an ATS score and a tailored rewrite</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-600">4</span>
              </div>
              <h4 className="font-semibold text-gray-800 mb-2">Cover Letter & Mock Interview</h4>
              <p className="text-sm text-gray-600">Generate a cover letter and rehearse interviews</p>
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
            Try CareerDev AI Now
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Features;
