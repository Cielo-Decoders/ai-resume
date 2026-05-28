import React from 'react';
import { Mail, ArrowLeft } from 'lucide-react';
import Footer from '../components/Footer';
import { Link } from 'react-router-dom';
import PageNavBar from '../components/PageNavBar';

const HelpCenter: React.FC = () => {
  const resources = [
    {
      title: "Getting Started Guide",
      description: "Learn how to upload your resume, analyze it, and create optimized versions",
      link: "#getting-started"
    },
    {
      title: "Video Tutorials",
      description: "Watch step-by-step tutorials on using all CareerDev AI features",
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
      title: "Using the Resume Updater",
      content: "The resume updater is the best starting point for new users.\n\n• Upload your existing PDF — text extraction (with OCR fallback for scanned resumes) parses every section into editable fields.\n• Edit any field on the right and watch the live preview update on the left.\n• Click the wand icon next to any bullet to have AI rewrite it for impact.\n• Use 'Reorganize & Reformat' when you're done to let AI sort experiences chronologically and polish the final layout.\n• Download the result as a clean PDF or send it directly into the analyzer."
    },
    {
      title: "Finding the Right Jobs",
      content: "The Job Listings tab pulls roles from major job boards and ranks them against your resume.\n\n• Each role shows a match score so you can prioritize the strongest fits.\n• Filter by role title, location, or company to narrow the list.\n• Click 'Analyze' on any listing to jump straight into ATS scoring and optimization for that role.\n• If you already have a role in mind, paste the job description directly in the Analyze tab instead."
    },
    {
      title: "Understanding Your ATS Score",
      content: "Your ATS score is calculated based on four key metrics:\n\n• Keyword Integration (40/100): How well your resume includes relevant keywords from the job description\n• Job Requirements Match (30/100): How closely your experience aligns with the job requirements\n• Resume Completeness (20/100): Whether your resume includes all essential sections\n• Formatting Quality (10/100): How well-formatted and ATS-friendly your resume is\n\nA score above 75 is excellent, 60-75 is good, and below 60 suggests significant improvements are needed."
    },
    {
      title: "How to Select Keywords Effectively",
      content: "When you see the 'Job-Relevant Skills & Terms' section:\n\n1. Review all suggested keywords carefully\n2. Only select skills you actually possess\n3. Prioritize technical skills and industry-specific terms\n4. Include soft skills that genuinely reflect your abilities\n5. Don't add keywords you can't discuss in an interview\n\nOur AI will naturally integrate selected keywords into your resume context."
    },
    {
      title: "Generating Cover Letters",
      content: "Use the Cover Letter tab after running an analysis for a role.\n\n• The AI uses your resume + the job description to draft a personalized letter.\n• Pick a tone (professional, enthusiastic, etc.) before generating.\n• Edit the draft inline — every paragraph stays editable.\n• Download as PDF when you're happy with the result.\n• Tip: run the analysis first so the letter draws on the same keywords and themes as your optimized resume."
    },
    {
      title: "Practicing with Mock Interviews",
      content: "The Mock Interview tab helps you rehearse before the real thing.\n\n• Generate a question set tailored to the role and your resume.\n• Type or paste your answers for each question.\n• Submit to receive structured feedback on clarity, depth, and relevance.\n• Iterate on weaker answers until you're confident.\n• Use it for behavioral and technical questions alike."
    },
    {
      title: "Troubleshooting Common Issues",
      content: "Upload Issues:\n• Preferred format: PDF. Scanned PDFs are handled via OCR fallback, but a clean text-based PDF parses most accurately.\n• Remove password protection and large embedded images; keep files under 10MB.\n• If you have DOC/DOCX, convert to PDF before uploading.\n\nTimeouts & Rate Limits:\n• Very large job descriptions or concurrent requests may time out or hit provider limits.\n• Shorten or split long job descriptions and retry after a short wait.\n\nFormatting & Parsing Tips:\n• Use standard fonts (Arial, Calibri, Times New Roman).\n• Avoid tables, text boxes, images, and complex layouts.\n• Use clear section headings and simple bullet points for best results.\n\nIf the issue persists, email support at mycareerlabai@gmail.com with your browser/version, file type and size, and any console/network errors (do not include sensitive personal data)."
    }
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
          <h1 className="text-3xl sm:text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Help Center
          </h1>
          <p className="text-base sm:text-xl text-gray-600 max-w-3xl mx-auto mt-4">
            Guides for every CareerDev AI feature — resume updates, job listings, optimization, cover letters, and mock interviews
          </p>
        </div>

        {/* Quick Access Resources - commented out per request
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
        */}

        {/* Detailed Guides */}
        <div className="mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-8 text-center">Comprehensive Guides</h2>
          <div className="grid gap-6">
            {guides.map((guide, index) => (
              <div key={index} className="bg-white rounded-xl p-6 sm:p-8 shadow-lg border border-gray-100">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">
                  {guide.title}
                </h3>
                <p className="text-gray-700 whitespace-pre-line leading-relaxed">{guide.content}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Tips */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 sm:p-8 mb-12 sm:mb-16 text-white">
          <h2 className="text-2xl sm:text-3xl font-bold mb-6">
            Workflow Quick Tips
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">📝 Update your resume first</h4>
              <p className="text-indigo-100">Use the live editor to refresh every section before analyzing — a clean baseline produces better optimizations.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">💼 Use job listings for ideas</h4>
              <p className="text-indigo-100">Browse the match-scored job listings to find strong fits, then jump straight into analysis with one click.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">🎯 Tailor per role</h4>
              <p className="text-indigo-100">Run a separate analysis and optimization for each job description — keep only the suggestions that genuinely fit you.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">✉️ Cover letter + 🎤 mock interview</h4>
              <p className="text-indigo-100">After optimizing, generate a tailored cover letter and rehearse with the mock interview so you walk in prepared.</p>
            </div>
          </div>
        </div>

        {/* Contact Support */}
        <div className="bg-white rounded-2xl p-6 sm:p-12 shadow-xl text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4">Need More Help?</h2>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Can't find what you're looking for? Our support team is ready to assist you with any questions or issues.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:mycareerlabai@gmail.com"
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
