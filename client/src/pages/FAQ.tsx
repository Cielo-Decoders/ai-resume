import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ArrowLeft } from 'lucide-react';
import Footer from '../components/Footer';
import { Link } from 'react-router-dom';

const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      category: "Getting Started",
      questions: [
        {
          q: "What is CareerDev AI?",
          a: (
            <div>
              <div className="mb-1">CareerDev AI is an AI-powered resume optimization tool.</div>
              <ul className="list-disc list-inside ml-4 text-gray-700">
                <li>Analyzes your resume vs. a job description and returns an ATS score with concise, actionable suggestions.</li>
                <li>Offers automated rewrites, keyword recommendations, and formatting fixes to improve match.</li>
                <li>Processing is done in real time via third-party AI providers; we do not permanently store full resumes.</li>
              </ul>
            </div>
          )
        },
        {
          q: "How does the ATS scoring work?",
          a: (
            <ul className="list-disc list-inside ml-4 text-gray-700">
              <li>Keyword match (40%)</li>
              <li>Requirements fit (30%)</li>
              <li>Completeness (20%)</li>
              <li>Formatting (10%)</li>
            </ul>
          )
        },
        {
          q: "What file formats do you support?",
          a: (<div>We currently support PDF uploads only — PDF is recommended for best parsing accuracy.</div>)
        }
      ]
    },
    {
      category: "Features & Functionality",
      questions: [
        {
          q: "How does the AI optimization work?",
          a: (<div>We analyze your resume and the job description to suggest keywords, rephrase bullets, and fix formatting for ATS compatibility.</div>)
        },
        {
          q: "Can I optimize my resume for multiple jobs?",
          a: (<div>Yes — run a separate analysis per job description to tailor your resume to each role.</div>)
        },
        {
          q: "What are Job-Relevant Skills & Terms?",
          a: (<div>Keywords and phrases from the job description that the AI extracts and suggests adding to your resume.</div>)
        },
      ]
    },
    {
      category: "Privacy & Security",
      questions: [
        {
          q: "Is my resume data secure?",
          a: (
            <div>
              <div>Files are transmitted over encrypted connections and processed in real time by third‑party AI providers (e.g., OpenAI).</div>
              <div className="mt-1">We do not permanently store full resume files in our database, but third parties may retain or use submitted data per their policies.</div>
              <div className="mt-1 font-semibold">Avoid submitting highly sensitive information.</div>
            </div>
          )
        },
        {
          q: "Do you share my resume with employers?",
          a: (<div>No — we don't share your resume with employers; the tool is for your personal use.</div>)
        },
        {
          q: "What happens to my data after analysis?",
          a: (<div>We process resumes in real time and do not retain full resume files after the session ends.</div>)
        }
      ]
    },
//     {
//       category: "Pricing & Plans",
//       questions: [
//         {
//           q: "Is there a free trial?",
//           a: "Yes! Our Free plan allows you to analyze up to 3 resumes per month at no cost. This is perfect for trying out our platform and seeing the value it provides."
//         },
//         {
//           q: "What's included in the Pro plan?",
//           a: "The Pro plan includes unlimited resume analyses, advanced ATS scoring breakdowns, AI-powered optimization, multiple resume versions, job description matching, priority support, resume templates, and career insights."
//         },
//         {
//           q: "Can I cancel my subscription anytime?",
//           a: "Yes, you can cancel your subscription at any time with no penalties or cancellation fees. If you cancel, you'll continue to have access until the end of your billing period."
//         }
//       ]
//     },
    {
      category: "Technical Support",
      questions: [
        {
          q: "I'm getting a timeout error when analyzing my resume. What should I do?",
          a: (
            <div>
              <div>Possible causes: large input, temporary service load, network issues, or rate limits.</div>
              <ol className="list-decimal list-inside ml-4 mt-2 text-gray-700">
                <li>Shorten or split long job descriptions.</li>
                <li>Convert resume to clean PDF or plain text.</li>
                <li>Retry after a short wait or off-peak hours.</li>
              </ol>
            </div>
          )
        },
        {
          q: "Why isn't my resume uploading?",
          a: (
            <>
              <div className="mb-2 font-semibold">Common causes:</div>
              <ul className="list-disc list-inside ml-4 mb-3 text-gray-700">
                <li>Unsupported file format</li>
                <li>Excessive file size</li>
                <li>File corruption or password protection</li>
                <li>Browser or network issues</li>
                <li>Client-side validation error</li>
              </ul>

              <div className="mb-2 font-semibold">Troubleshooting steps:</div>
              <ol className="list-decimal list-inside ml-4 space-y-1 text-gray-700">
                <li>Convert and upload a clean PDF — we recommend PDF for the most accurate parsing.</li>
                <li>Remove password protection or heavy embedded assets (images, large fonts).</li>
                <li>Reduce file size — keep files under 10MB where possible.</li>
                <li>Try pasting your resume as plain text into the resume editor.</li>
                <li>Clear browser cache or try a different browser.</li>
              </ol>

              <div className="mt-3 text-gray-700">If the issue persists, email <a href="mailto:mycareerlabai@gmail.com" className="text-indigo-600">mycareerlabai@gmail.com</a> with browser+version, file size, format, and any console/network errors. Do not include sensitive personal data.</div>
            </>
          )
        },
        {
          q: "How do I contact support?",
          a: (<div>Email support at <a href="mailto:mycareerlabai@gmail.com" className="text-indigo-600">mycareerlabai@gmail.com</a>.</div>)
        }
      ]
    },
    {
      category: "Best Practices",
      questions: [
        {
          q: "How can I get the best ATS score?",
          a: (
            <div>
              <div className="mb-1">The ATS score is calculated automatically and cannot be changed manually.</div>
              <ul className="list-disc list-inside ml-4 text-gray-700">
                <li>Include relevant keywords from the job description.</li>
                <li>Use clear headings and concise bullet points.</li>
                <li>Keep formatting simple (no images or complex layouts).</li>
              </ul>
            </div>
          )
        },
        {
          q: "Should I use all suggested keywords?",
          a: (<div>Only add keywords that truthfully reflect your skills and experience.</div>)
        }
      ]
    }
  ];

  const toggleQuestion = (categoryIndex: number, questionIndex: number) => {
    const globalIndex = faqs
      .slice(0, categoryIndex)
      .reduce((acc, cat) => acc + cat.questions.length, 0) + questionIndex;
    setOpenIndex(openIndex === globalIndex ? null : globalIndex);
  };

  const getGlobalIndex = (categoryIndex: number, questionIndex: number) => {
    return faqs
      .slice(0, categoryIndex)
      .reduce((acc, cat) => acc + cat.questions.length, 0) + questionIndex;
  };

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
          <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mt-4">
            Find answers to common questions about CareerDev AI
          </p>
        </div>

        {/* FAQ Sections */}
        <div className="space-y-8">
          {faqs.map((category, catIndex) => (
            <div key={catIndex} className="bg-white rounded-2xl p-8 shadow-lg">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                {category.category}
              </h2>
              <div className="space-y-4">
                {category.questions.map((faq, qIndex) => {
                  const globalIndex = getGlobalIndex(catIndex, qIndex);
                  const isOpen = openIndex === globalIndex;

                  return (
                    <div
                      key={qIndex}
                      className="border border-gray-200 rounded-lg overflow-hidden hover:border-indigo-300 transition-colors"
                    >
                      <button
                        onClick={() => toggleQuestion(catIndex, qIndex)}
                        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                      >
                        <span className="font-semibold text-gray-800 pr-4">{faq.q}</span>
                        {isOpen ? (
                          <ChevronUp className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        )}
                      </button>
                      {isOpen && (
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                          <div className="text-gray-700 leading-relaxed">{faq.a}</div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Contact Section */}
        <div className="mt-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-center text-white shadow-xl">
          <h3 className="text-2xl font-bold mb-4">Still have questions?</h3>
          <p className="mb-6 text-indigo-100">
            Our support team is here to help you succeed
          </p>
          <Link
            to={{ pathname: '/contact' }}
            state={{ subject: 'Technical Support', message: 'I need help with an issue I found in the FAQ.' }}
            className="inline-flex items-center gap-2 bg-white text-indigo-600 px-8 py-4 rounded-full font-semibold hover:shadow-2xl transition-all duration-300 hover:scale-105"
          >
            Contact Support
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default FAQ;
