import React from 'react';
import { Mail, ArrowLeft } from 'lucide-react';
import Footer from '../components/Footer';
import { Link } from 'react-router-dom';

const HelpCenter: React.FC = () => {
  const resources = [
    {
      title: "Getting Started Guide",
      description: "Learn how to upload your resume, analyze it, and create optimized versions",
      link: "#getting-started"
    },
    {
      title: "Video Tutorials",
      description: "Watch step-by-step tutorials on using all CareerLab AI features",
      link: "#tutorials"
    },
    {
      title: "Documentation",
      description: "Detailed guides on ATS scoring, keyword optimization, and best practices",
      link: "#documentation"
    },
    {
      title: "Community Forum",
      description: "Connect with other job seekers and share tips and experiences",
      link: "#community"
    }
  ];

  const guides = [
    {
      title: "Understanding Your ATS Score",
      content: "Your ATS score is calculated based on four key metrics:\n\n• Keyword Integration (40/100): How well your resume includes relevant keywords from the job description\n• Job Requirements Match (30/100): How closely your experience aligns with the job requirements\n• Resume Completeness (20/100): Whether your resume includes all essential sections\n• Formatting Quality (10/100): How well-formatted and ATS-friendly your resume is\n\nA score above 75 is excellent, 60-75 is good, and below 60 suggests significant improvements are needed."
    },
    {
      title: "How to Select Keywords Effectively",
      content: "When you see the 'Job-Relevant Skills & Terms' section:\n\n1. Review all suggested keywords carefully\n2. Only select skills you actually possess\n3. Prioritize technical skills and industry-specific terms\n4. Include soft skills that genuinely reflect your abilities\n5. Don't add keywords you can't discuss in an interview\n\nOur AI will naturally integrate selected keywords into your resume context."
    },
    {
      title: "Best Practices for Resume Optimization",
      content: "• Tailor your resume for each specific job application\n• Use the exact keywords from the job description when they match your experience\n• Keep formatting simple and ATS-friendly\n• Include measurable achievements and results\n• Update your resume regularly with new skills and experiences\n• Proofread carefully before downloading\n• Save different versions for different types of roles"
    },
    {
      title: "Troubleshooting Common Issues",
      content: "Upload Issues:\n• Ensure file is PDF, DOC, DOCX, or TXT format\n• Check file size is under 10MB\n• Remove password protection from files\n\nTimeout Errors:\n• Shorten very long job descriptions\n• Try again during off-peak hours\n• Contact support if issue persists\n\nFormatting Problems:\n• Use standard fonts (Arial, Calibri, Times New Roman)\n• Avoid tables, text boxes, and graphics\n• Use simple bullet points and clear section headers"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-16 max-w-7xl">
        {/* Back to Home Button */}
        <div className="mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-lg font-semibold transition-all duration-300 shadow-md hover:shadow-lg group"
          >
            <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Help Center
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mt-4">
            Everything you need to master CareerLab AI and land your dream job
          </p>
        </div>

        {/* Quick Access Resources */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {resources.map((resource, index) => (
            <a
              key={index}
              href={resource.link}
              className="bg-white rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-indigo-200 hover:-translate-y-1 group"
            >
              <h3 className="font-bold text-gray-800 mb-2">{resource.title}</h3>
              <p className="text-sm text-gray-600">{resource.description}</p>
            </a>
          ))}
        </div>

        {/* Detailed Guides */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">Comprehensive Guides</h2>
          <div className="grid gap-6">
            {guides.map((guide, index) => (
              <div key={index} className="bg-white rounded-xl p-8 shadow-lg border border-gray-100">
                <h3 className="text-2xl font-bold text-gray-800 mb-4">
                  {guide.title}
                </h3>
                <p className="text-gray-700 whitespace-pre-line leading-relaxed">{guide.content}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Tips */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 mb-16 text-white">
          <h2 className="text-3xl font-bold mb-6">
            Quick Tips for Success
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">✨ Always customize for each job</h4>
              <p className="text-indigo-100">Generic resumes rarely pass ATS systems. Tailor each application.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">🎯 Focus on relevant experience</h4>
              <p className="text-indigo-100">Highlight experiences that directly relate to the job requirements.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">📊 Use metrics and numbers</h4>
              <p className="text-indigo-100">Quantify achievements whenever possible (e.g., "increased sales by 30%").</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">🔍 Mirror job description language</h4>
              <p className="text-indigo-100">Use the same terminology and keywords as the job posting.</p>
            </div>
          </div>
        </div>

        {/* Contact Support */}
        <div className="bg-white rounded-2xl p-12 shadow-xl text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Need More Help?</h2>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Can't find what you're looking for? Our support team is ready to assist you with any questions or issues.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:support@mycareerlab.ai"
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-full font-semibold hover:shadow-2xl transition-all duration-300 hover:scale-105"
            >
              <Mail className="w-5 h-5" />
              Email Support
            </a>
            <a
              href="/faq"
              className="inline-flex items-center justify-center gap-2 bg-gray-100 text-gray-800 px-8 py-4 rounded-full font-semibold hover:bg-gray-200 transition-all duration-300"
            >
              View FAQ
            </a>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default HelpCenter;
