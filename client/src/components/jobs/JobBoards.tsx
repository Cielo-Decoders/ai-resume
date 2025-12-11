import React, { useState } from 'react';
import { Briefcase, X } from 'lucide-react';

interface JobBoard {
  name: string;
  url: string;
  description: string;
  icon: string;
  category: string;
}

interface JobBoardsProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const JobBoards: React.FC<JobBoardsProps> = ({ isOpen, onClose }) => {
  const [activeCategory, setActiveCategory] = useState('General');

  // Helper function to get category-specific pro tips
  const getProTipForCategory = (category: string): string => {
    switch (category) {
      case 'General':
        return 'Start with LinkedIn and Indeed for the broadest reach, then use Glassdoor to research company culture and salaries before applying.';
      case 'Technology':
        return 'Build a strong GitHub profile and contribute to open source projects. Use Stack Overflow and HackerRank to showcase your coding skills.';
      case 'Finance & Accounting':
        return 'Highlight your certifications (CPA, CFA, etc.) and emphasize quantifiable achievements like cost savings or revenue improvements.';
      case 'Marketing & Advertising':
        return 'Create a portfolio showcasing your campaigns and results. Use Behance or Dribbble to display creative work alongside traditional applications.';
      case 'Sales & Business':
        return 'Focus on your numbers - quotas exceeded, revenue generated, and client relationships built. Include specific metrics in every application.';
      case 'Engineering':
        return 'Include your PE license status and highlight project management experience. Many roles value both technical skills and leadership capabilities.';
      case 'Healthcare':
        return 'Ensure all licenses and certifications are current and prominently displayed. Many healthcare roles require specific state licensing.';
      case 'Agriculture':
        return 'Highlight hands-on experience and any sustainable farming or environmental conservation initiatives youve been involved in.';
      case 'Education':
        return 'Include your teaching philosophy and any innovative curriculum development. Many schools value educators who can adapt to new technologies.';
      case 'Legal':
        return 'Specify your bar admissions and areas of specialization. Include pro bono work and any published articles or case victories.';
      case 'Human Resources':
        return 'Emphasize your people skills and any HR certifications (PHR, SHRM). Include examples of successful talent acquisition or employee retention.';
      case 'Startup & Venture':
        return 'Show your adaptability and entrepreneurial mindset. Startups value candidates who can wear multiple hats and thrive in fast-paced environments.';
      case 'Remote Work':
        return 'Demonstrate your self-management skills and remote work experience. Highlight your home office setup and communication tools proficiency.';
      case 'Major Companies':
        return 'Research each companys values and tailor your application accordingly. These companies often have specific cultural values they prioritize.';
      default:
        return 'Create profiles on multiple platforms and set up job alerts for your target roles. Apply quickly to new postings for the best response rates.';
    }
  };

  const jobBoards: JobBoard[] = [
    // ========== GENERAL JOB BOARDS ==========
    {
      name: 'LinkedIn',
      url: 'https://linkedin.com/jobs',
      description: 'Largest professional network with extensive job listings across all industries',
      icon: '💼',
      category: 'General',
    },
    {
      name: 'Indeed',
      url: 'https://indeed.com',
      description: 'Massive job board with millions of listings across all industries',
      icon: '🔍',
      category: 'General',
    },
    {
      name: 'Glassdoor',
      url: 'https://glassdoor.com',
      description: 'Job listings with company reviews, salaries, and interview insights',
      icon: '⭐',
      category: 'General',
    },
    {
      name: 'Monster',
      url: 'https://monster.com',
      description: 'Long-established job board with AI-powered job matching',
      icon: '👹',
      category: 'General',
    },
    {
      name: 'ZipRecruiter',
      url: 'https://ziprecruiter.com',
      description: 'Jobs aggregated from multiple sources, easy application process',
      icon: '🎯',
      category: 'General',
    },
    {
      name: 'CareerBuilder',
      url: 'https://careerbuilder.com',
      description: 'Comprehensive job board with resume tips and career advice',
      icon: '🏗️',
      category: 'General',
    },
    {
      name: 'SimplyHired',
      url: 'https://simplyhired.com',
      description: 'Job aggregator with over 1 million active listings',
      icon: '🎯',
      category: 'General',
    },
    {
      name: 'The Muse',
      url: 'https://themuse.com/jobs',
      description: 'Culture-fit focused job search with company reviews',
      icon: '🎭',
      category: 'General',
    },
    // ========== TECHNOLOGY & TECH-SPECIFIC ==========
    {
      name: 'GitHub Jobs',
      url: 'https://github.com/jobs',
      description: 'Tech-focused job board for developers and engineers',
      icon: '🐙',
      category: 'Technology',
    },
    {
      name: 'Stack Overflow',
      url: 'https://stackoverflow.com/jobs',
      description: 'Developer-focused job listings from trusted tech companies',
      icon: '⚡',
      category: 'Technology',
    },
    {
      name: 'HackerRank',
      url: 'https://hackerrank.com/jobs',
      description: 'Tech jobs with coding challenges and skill verification',
      icon: '💻',
      category: 'Technology',
    },
    {
      name: 'LeetCode',
      url: 'https://leetcode.com/jobs',
      description: 'Software engineering jobs with technical interview prep',
      icon: '🧠',
      category: 'Technology',
    },
    {
      name: 'Built In',
      url: 'https://builtin.com',
      description: 'Tech jobs at top companies with company culture focus',
      icon: '🏢',
      category: 'Technology',
    },
    {
      name: 'Dice',
      url: 'https://dice.com',
      description: 'Tech and engineering jobs with salary data',
      icon: '🎲',
      category: 'Technology',
    },
    {
      name: 'Levels.fyi',
      url: 'https://levels.fyi/jobs',
      description: 'Tech jobs at top companies with salary and level transparency',
      icon: '📈',
      category: 'Technology',
    },
    {
      name: 'Dev.to Jobs',
      url: 'https://dev.to/jobs',
      description: 'Dev community job listings and opportunities',
      icon: '👨‍💻',
      category: 'Technology',
    },
    // ========== FINANCE & ACCOUNTING ==========
    {
      name: 'eFinancialCareers',
      url: 'https://efinancialcareers.com',
      description: 'Investment banking, hedge funds, and financial services jobs',
      icon: '💰',
      category: 'Finance & Accounting',
    },
    {
      name: 'Wall Street On Demand',
      url: 'https://wallstreetonjobs.com',
      description: 'Finance, trading, and investment careers',
      icon: '📊',
      category: 'Finance & Accounting',
    },
    {
      name: 'AccountingJobs',
      url: 'https://accountingjobs.com',
      description: 'Dedicated job board for accounting and finance professionals',
      icon: '📋',
      category: 'Finance & Accounting',
    },
    {
      name: 'CPA Jobs',
      url: 'https://cpajobs.com',
      description: 'Jobs specifically for certified public accountants',
      icon: '✓',
      category: 'Finance & Accounting',
    },
    {
      name: 'AuditBoard Jobs',
      url: 'https://auditboard.com/careers',
      description: 'Internal audit and compliance roles',
      icon: '🔍',
      category: 'Finance & Accounting',
    },
    {
      name: 'iStockanalyst',
      url: 'https://istockanalyst.com',
      description: 'Financial analyst and investment roles',
      icon: '📈',
      category: 'Finance & Accounting',
    },
    // ========== MARKETING & ADVERTISING ==========
    {
      name: 'MarketingHire',
      url: 'https://marketinghire.com',
      description: 'Marketing, advertising, and digital marketing jobs',
      icon: '📢',
      category: 'Marketing & Advertising',
    },
    {
      name: 'We Work Remotely',
      url: 'https://weworkremotely.com',
      description: 'Remote marketing and creative roles across all industries',
      icon: '🌍',
      category: 'Marketing & Advertising',
    },
    {
      name: 'AdWeek Jobs',
      url: 'https://adweek.com/jobs',
      description: 'Advertising, marketing, and creative agency positions',
      icon: '🎨',
      category: 'Marketing & Advertising',
    },
    {
      name: 'Marketing Dive',
      url: 'https://marketingdive.com',
      description: 'Marketing industry jobs and news',
      icon: '💡',
      category: 'Marketing & Advertising',
    },
    {
      name: 'Behance',
      url: 'https://behance.net/joblist',
      description: 'Creative, design, and advertising jobs',
      icon: '🎨',
      category: 'Marketing & Advertising',
    },
    {
      name: 'Dribbble',
      url: 'https://dribbble.com/jobs',
      description: 'Design and creative agency roles',
      icon: '🎬',
      category: 'Marketing & Advertising',
    },
    // ========== SALES & BUSINESS ==========
    {
      name: 'SalesHQ',
      url: 'https://saleshq.com',
      description: 'Sales positions and business development roles',
      icon: '🎯',
      category: 'Sales & Business',
    },
    {
      name: 'SalesJobs',
      url: 'https://salesjobs.com',
      description: 'Dedicated job board for sales professionals',
      icon: '📞',
      category: 'Sales & Business',
    },
    {
      name: 'Business Insider Jobs',
      url: 'https://businessinsider.com/jobs',
      description: 'Business, entrepreneurship, and corporate roles',
      icon: '📈',
      category: 'Sales & Business',
    },
    {
      name: 'Entrepreneur Jobs',
      url: 'https://entrepreneur.com/jobs',
      description: 'Startup and entrepreneurial opportunity listings',
      icon: '🚀',
      category: 'Sales & Business',
    },
    // ========== ENGINEERING & MANUFACTURING ==========
    {
      name: 'Engineering.com',
      url: 'https://engineering.com/jobs',
      description: 'Civil, mechanical, electrical, and structural engineering jobs',
      icon: '⚙️',
      category: 'Engineering',
    },
    {
      name: 'MechanicalEngineeringJobs',
      url: 'https://mechanicalengineeringjobs.com',
      description: 'Mechanical engineering positions worldwide',
      icon: '🔧',
      category: 'Engineering',
    },
    {
      name: 'CivilEngineer.com',
      url: 'https://civilengineer.com',
      description: 'Civil engineering and construction jobs',
      icon: '🏗️',
      category: 'Engineering',
    },
    {
      name: 'ElectricalEngineeringJobs',
      url: 'https://electricalengineering.jobs',
      description: 'Electrical and electronics engineering positions',
      icon: '⚡',
      category: 'Engineering',
    },
    {
      name: 'IEEE Job Site',
      url: 'https://ieeejobs.ieee.org',
      description: 'Engineering and technology jobs from IEEE',
      icon: '🔬',
      category: 'Engineering',
    },
    // ========== HEALTHCARE ==========
    {
      name: 'HealthcareJobs',
      url: 'https://healthcarejobs.com',
      description: 'Nursing, physician, and healthcare professional jobs',
      icon: '⚕️',
      category: 'Healthcare',
    },
    {
      name: 'Nurse.com',
      url: 'https://nurse.com',
      description: 'Dedicated job board for nursing professionals',
      icon: '👩‍⚕️',
      category: 'Healthcare',
    },
    {
      name: 'Physician Jobs',
      url: 'https://physiciansjobs.com',
      description: 'Doctor and physician position listings',
      icon: '👨‍⚕️',
      category: 'Healthcare',
    },
    {
      name: 'PharmacyJobs',
      url: 'https://pharmacyjobs.com',
      description: 'Pharmacy and pharmaceutical careers',
      icon: '💊',
      category: 'Healthcare',
    },
    {
      name: 'DentalJobs',
      url: 'https://dentaljobs.com',
      description: 'Dental hygienist and dental professional positions',
      icon: '🦷',
      category: 'Healthcare',
    },
    // ========== AGRICULTURE & ENVIRONMENT ==========
    {
      name: 'AgriJobs',
      url: 'https://agrijobs.com',
      description: 'Agriculture, farming, and agribusiness careers',
      icon: '🌾',
      category: 'Agriculture',
    },
    {
      name: 'AgriculturalJobs.org',
      url: 'https://agriculturaljobs.org',
      description: 'Agricultural employment opportunities worldwide',
      icon: '🚜',
      category: 'Agriculture',
    },
    {
      name: 'Environmental Jobs',
      url: 'https://environmentaljobs.com',
      description: 'Environmental science and conservation careers',
      icon: '♻️',
      category: 'Agriculture',
    },
    {
      name: 'EcoJobs',
      url: 'https://ecojobs.com',
      description: 'Green jobs and sustainability careers',
      icon: '🌱',
      category: 'Agriculture',
    },
    // ========== EDUCATION & TRAINING ==========
    {
      name: 'HigherEdJobs',
      url: 'https://higheredjobs.com',
      description: 'University and academic faculty positions',
      icon: '🎓',
      category: 'Education',
    },
    {
      name: 'TeachingJobs',
      url: 'https://teachingjobs.com',
      description: 'K-12 and private school teaching positions',
      icon: '👨‍🏫',
      category: 'Education',
    },
    {
      name: 'CareerTrain',
      url: 'https://careertrain.org',
      description: 'Training and educational staff positions',
      icon: '📚',
      category: 'Education',
    },
    // ========== LEGAL ==========
    {
      name: 'LawJobs',
      url: 'https://lawjobs.com',
      description: 'Attorney and legal professional positions',
      icon: '⚖️',
      category: 'Legal',
    },
    {
      name: 'Law.com Careers',
      url: 'https://law.com/careers',
      description: 'Law firm and legal department jobs',
      icon: '📋',
      category: 'Legal',
    },
    {
      name: 'Attorney Jobs',
      url: 'https://attorneyjobs.com',
      description: 'Dedicated job board for attorneys and legal professionals',
      icon: '👨‍⚖️',
      category: 'Legal',
    },
    // ========== HUMAN RESOURCES ==========
    {
      name: 'HR.com',
      url: 'https://hr.com/jobs',
      description: 'Human resources and talent management careers',
      icon: '👥',
      category: 'Human Resources',
    },
    {
      name: 'HR Jobs',
      url: 'https://hrjobs.com',
      description: 'HR specialist and recruitment positions',
      icon: '📋',
      category: 'Human Resources',
    },
    // ========== STARTUP & VENTURE ==========
    {
      name: 'AngelList',
      url: 'https://angel.co/jobs',
      description: 'Startup and venture-backed company jobs and equity opportunities',
      icon: '🚀',
      category: 'Startup & Venture',
    },
    {
      name: 'Y Combinator Jobs',
      url: 'https://jobs.ycombinator.com',
      description: 'Jobs at Y Combinator startups and backed companies',
      icon: '🚀',
      category: 'Startup & Venture',
    },
    {
      name: 'Otta',
      url: 'https://otta.com',
      description: 'Top startup and tech company jobs with company insights',
      icon: '🎯',
      category: 'Startup & Venture',
    },
    {
      name: 'Welcome to the Jungle',
      url: 'https://welcometothejungle.com/jobs',
      description: 'Tech and startup jobs across Europe and beyond',
      icon: '🌴',
      category: 'Startup & Venture',
    },
    // ========== REMOTE WORK ==========
    {
      name: 'Remote.co',
      url: 'https://remote.co/remote-jobs',
      description: 'Curated remote job listings across all industries',
      icon: '🌐',
      category: 'Remote Work',
    },
    {
      name: 'Working Nomads',
      url: 'https://workingnomads.com',
      description: 'Remote work jobs for digital nomads',
      icon: '🧳',
      category: 'Remote Work',
    },
    {
      name: 'RemoteOK',
      url: 'https://remoteok.io',
      description: 'Remote jobs across all industries and roles',
      icon: '✅',
      category: 'Remote Work',
    },
    {
      name: 'FlexJobs',
      url: 'https://flexjobs.com',
      description: 'Vetted remote, part-time, and flexible job opportunities',
      icon: '📱',
      category: 'Remote Work',
    },
    // ========== COMPANY CAREERS PAGES ==========
    {
      name: 'Google Careers',
      url: 'https://careers.google.com',
      description: 'Direct job listings from Google globally',
      icon: '🔴',
      category: 'Major Companies',
    },
    {
      name: 'Amazon Careers',
      url: 'https://amazon.jobs',
      description: 'Jobs at Amazon worldwide in all categories',
      icon: '📦',
      category: 'Major Companies',
    },
    {
      name: 'Microsoft Careers',
      url: 'https://careers.microsoft.com',
      description: 'Microsoft job opportunities globally',
      icon: '🪟',
      category: 'Major Companies',
    },
    {
      name: 'Apple Careers',
      url: 'https://apple.com/careers',
      description: 'Jobs at Apple in engineering, retail, and more',
      icon: '🍎',
      category: 'Major Companies',
    },
    {
      name: 'Meta Careers',
      url: 'https://metacareers.com',
      description: 'Meta (Facebook) jobs in technology and beyond',
      icon: '📱',
      category: 'Major Companies',
    },
    {
      name: 'Netflix Careers',
      url: 'https://jobs.netflix.com',
      description: 'Netflix jobs in tech, content, and operations',
      icon: '🎬',
      category: 'Major Companies',
    },
    {
      name: 'Tesla Careers',
      url: 'https://tesla.com/careers',
      description: 'Tesla engineering, manufacturing, and sales jobs',
      icon: '⚡',
      category: 'Major Companies',
    },
    {
      name: 'JPMorgan Chase Careers',
      url: 'https://jpmorganchase.com/careers',
      description: 'Finance, technology, and business roles at JPMorgan',
      icon: '🏦',
      category: 'Major Companies',
    },
    {
      name: 'Goldman Sachs Careers',
      url: 'https://goldmansachs.com/careers',
      description: 'Investment banking and finance careers',
      icon: '📊',
      category: 'Major Companies',
    },
    {
      name: 'Deloitte Careers',
      url: 'https://deloitte.com/careers',
      description: 'Consulting, audit, and advisory roles',
      icon: '🏢',
      category: 'Major Companies',
    },
  ];

  const categories = [
    'General',
    'Technology',
    'Finance & Accounting',
    'Marketing & Advertising',
    'Sales & Business',
    'Engineering',
    'Healthcare',
    'Agriculture',
    'Education',
    'Legal',
    'Human Resources',
    'Startup & Venture',
    'Remote Work',
    'Major Companies',
  ];

  if (isOpen === true) {
    // Modal mode - only show if explicitly opened as modal
  }
  // Remove the problematic condition that returns null
  // Show tab version for all other cases (isOpen === false or undefined)

  return (
    <>
      {/* Modal version - shown when modal is explicitly requested */}
      {isOpen === true && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Briefcase className="w-6 h-6" />
                <div>
                  <h2 className="text-2xl font-bold">Job Boards & Career Sites</h2>
                  <p className="text-blue-100 text-sm">{jobBoards.length} platforms across all industries</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:bg-white/20 rounded-full p-2 transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <p className="text-gray-600 mb-6">
                Explore these {jobBoards.length} job boards and career platforms across multiple industries:
              </p>

              {categories.map((category) => {
                const categoryJobs = jobBoards.filter((job) => job.category === category);
                if (categoryJobs.length === 0) return null;

                return (
                  <div key={category} className="space-y-4">
                    <h3 className="text-lg font-bold text-gray-800 border-b-2 border-gray-200 pb-2">
                      {category}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {categoryJobs.map((board, idx) => (
                        <a
                          key={idx}
                          href={board.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-lg transition-all group"
                        >
                          <div className="flex items-start gap-3">
                            <span className="text-3xl flex-shrink-0">{board.icon}</span>
                            <div className="flex-1">
                              <h3 className="font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
                                {board.name}
                              </h3>
                              <p className="text-sm text-gray-600 mt-1">{board.description}</p>
                              <p className="text-xs text-blue-600 mt-2 group-hover:underline">
                                Visit Site →
                              </p>
                            </div>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                );
              })}

              <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>💡 Pro Tip:</strong> Create profiles on multiple job boards in your industry and set up job alerts for your target roles.
                  Check regularly and apply quickly to positions as they're posted. Use your optimized resume on all applications!
                </p>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 border-t p-6 flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab version - shown when used as a tab */}
      {(isOpen === false || isOpen === undefined) && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-lg">
            {/* Header */}
            <div className="p-8 pb-0">
              <div className="flex items-center gap-3 mb-6">
                <Briefcase className="w-8 h-8 text-indigo-600" />
                <div>
                  <h2 className="text-3xl font-bold text-gray-800">Job Boards & Career Sites</h2>
                  <p className="text-gray-600 mt-1">Find open positions across all industries</p>
                </div>
              </div>

              <p className="text-gray-600 mb-6">
                Explore {jobBoards.length}+ job boards across {categories.length} industry categories:
              </p>
            </div>

            {/* Industry Category Tabs */}
            <div className="px-8">
              <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200">
                {categories.map((category) => {
                  const categoryJobs = jobBoards.filter((job) => job.category === category);
                  return (
                    <button
                      key={category}
                      onClick={() => setActiveCategory(category)}
                      className={`px-4 py-3 font-semibold text-sm transition-all border-b-2 whitespace-nowrap ${
                        activeCategory === category
                          ? 'text-indigo-600 border-indigo-600 bg-indigo-50'
                          : 'text-gray-600 border-transparent hover:text-indigo-500 hover:border-indigo-300'
                      }`}
                    >
                      {category}
                      <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                        {categoryJobs.length}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Category Content */}
            <div className="p-8 pt-0">
              {(() => {
                const categoryJobs = jobBoards.filter((job) => job.category === activeCategory);

                return (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        {activeCategory}
                        <span className="text-lg text-gray-500">({categoryJobs.length} platforms)</span>
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {categoryJobs.map((board, idx) => (
                        <a
                          key={idx}
                          href={board.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-6 border-2 border-gray-200 rounded-xl hover:border-indigo-500 hover:shadow-xl transition-all group bg-gradient-to-br from-white to-gray-50"
                        >
                          <div className="flex items-start gap-4">
                            <span className="text-4xl flex-shrink-0">{board.icon}</span>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-lg text-gray-800 group-hover:text-indigo-600 transition-colors break-words mb-2">
                                {board.name}
                              </h4>
                              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{board.description}</p>
                              <p className="text-sm text-indigo-600 group-hover:underline font-semibold flex items-center gap-1">
                                Visit Site →
                              </p>
                            </div>
                          </div>
                        </a>
                      ))}
                    </div>

                    {/* Pro Tip for each category */}
                    <div className="mt-8 p-6 bg-gradient-to-r from-green-50 to-blue-50 border-l-4 border-green-600 rounded-lg">
                      <p className="text-sm text-gray-800">
                        <strong>💡 Pro Tip for {activeCategory}:</strong> {getProTipForCategory(activeCategory)}
                      </p>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default JobBoards;

