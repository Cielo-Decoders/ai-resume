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
          q: "What is CareerLab AI?",
          a: "CareerLab AI is an AI-powered resume optimization platform that helps job seekers create ATS-friendly resumes. Our advanced algorithms analyze your resume against specific job descriptions and provide intelligent suggestions to improve your chances of landing interviews."
        },
        {
          q: "How does the ATS scoring work?",
          a: "Our ATS (Applicant Tracking System) scoring analyzes four key areas: Keyword Integration (40 points), Job Requirements Match (30 points), Resume Completeness (20 points), and Formatting Quality (10 points). You receive a total score out of 100 with detailed breakdowns for each category."
        },
        {
          q: "What file formats do you support?",
          a: "We currently support PDF, DOC, DOCX, and TXT file formats for resume uploads. For best results, we recommend using PDF or DOCX formats."
        }
      ]
    },
    {
      category: "Features & Functionality",
      questions: [
        {
          q: "How does the AI optimization work?",
          a: "Our AI analyzes your resume and the job description to identify missing keywords, skills gaps, and formatting issues. It then suggests specific improvements and can automatically generate an optimized version of your resume that better matches the job requirements while maintaining your authentic voice."
        },
        {
          q: "Can I optimize my resume for multiple jobs?",
          a: "Yes! You can analyze and optimize your resume for as many different job descriptions as you want. We recommend tailoring your resume for each specific position you apply to for the best results."
        },
        {
          q: "What are Job-Relevant Skills & Terms?",
          a: "These are keywords, skills, and phrases extracted from the job description that are missing or underrepresented in your resume. You can select which ones to add, and our AI will integrate them naturally into your optimized resume."
        },
        {
          q: "How is my optimized resume saved?",
          a: "Your optimized resume is saved with a filename format of 'YourName_Date_CompanyName_optimized.txt'. This makes it easy to keep track of different versions for different job applications."
        }
      ]
    },
    {
      category: "Privacy & Security",
      questions: [
        {
          q: "Is my resume data secure?",
          a: "Absolutely. We take your privacy seriously. All resume data is processed using encrypted connections, and we don't store your personal information or resume content on our servers permanently. Your data is only used for the analysis you request."
        },
        {
          q: "Do you share my resume with employers?",
          a: "No, we never share your resume or personal information with anyone. CareerLab AI is purely a tool for you to optimize your own resume. You have complete control over your data."
        },
        {
          q: "What happens to my data after analysis?",
          a: "Currently, we process your resume in real-time and don't store it in a database. Once you close your session, your data is not retained on our servers."
        }
      ]
    },
    {
      category: "Pricing & Plans",
      questions: [
        {
          q: "Is there a free trial?",
          a: "Yes! Our Free plan allows you to analyze up to 3 resumes per month at no cost. This is perfect for trying out our platform and seeing the value it provides."
        },
        {
          q: "What's included in the Pro plan?",
          a: "The Pro plan includes unlimited resume analyses, advanced ATS scoring breakdowns, AI-powered optimization, multiple resume versions, job description matching, priority support, resume templates, and career insights."
        },
        {
          q: "Can I cancel my subscription anytime?",
          a: "Yes, you can cancel your subscription at any time with no penalties or cancellation fees. If you cancel, you'll continue to have access until the end of your billing period."
        }
      ]
    },
    {
      category: "Technical Support",
      questions: [
        {
          q: "I'm getting a timeout error when analyzing my resume. What should I do?",
          a: "Timeout errors can occur if the job description is very long or if there's high server traffic. Try breaking down very long job descriptions into key sections, or try again in a few moments. If the problem persists, please contact our support team."
        },
        {
          q: "Why isn't my resume uploading?",
          a: "Make sure your file is in a supported format (PDF, DOC, DOCX, or TXT) and is under 10MB in size. Also check that the file isn't corrupted or password-protected."
        },
        {
          q: "How do I contact support?",
          a: "You can reach our support team at support@mycareerlab.ai. Pro plan users receive priority support with faster response times."
        }
      ]
    },
    {
      category: "Best Practices",
      questions: [
        {
          q: "How can I get the best ATS score?",
          a: "To maximize your ATS score: (1) Include relevant keywords from the job description naturally in your resume, (2) Ensure your resume is complete with all standard sections, (3) Use clean, simple formatting, and (4) Match your experience to the job requirements as closely as possible."
        },
        {
          q: "Should I use all suggested keywords?",
          a: "Not necessarily. Only add keywords that genuinely reflect your skills and experience. Adding irrelevant keywords can backfire during the interview process. Select the skills you actually have and can speak to confidently."
        },
        {
          q: "How often should I update my resume?",
          a: "You should tailor your resume for each job application. Use CareerLab AI to optimize your resume specifically for each position you're applying to, as different jobs emphasize different skills and requirements."
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
            Find answers to common questions about CareerLab AI
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
                          <p className="text-gray-700 leading-relaxed">{faq.a}</p>
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
          <a
            href="mailto:support@mycareerlab.ai"
            className="inline-flex items-center gap-2 bg-white text-indigo-600 px-8 py-4 rounded-full font-semibold hover:shadow-2xl transition-all duration-300 hover:scale-105"
          >
            Contact Support
          </a>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default FAQ;

