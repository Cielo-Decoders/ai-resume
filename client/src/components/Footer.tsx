import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Mail, Linkedin, Github, Twitter, Heart } from 'lucide-react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900 text-white mt-16">
      <div className="container mx-auto px-4 py-8 md:py-10 max-w-7xl">
        {/* Main Footer Content */}
        <div className="mb-6">
          {/* Grid layout - stacked on mobile, single row on large screens */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8">
            {/* CareerLab AI Section - Full width on mobile, spans 6 columns on large screens */}
            <div className="md:col-span-6">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-8 h-8 text-indigo-400" />
                <h3 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  CareerLab AI
                </h3>
              </div>
              <p className="text-gray-300 mb-4 text-sm max-w-md">
                Your AI-powered career assistant. Optimize your resume, analyze job matches, and land your dream job with intelligent insights.
              </p>
              <div className="flex gap-4 mb-6 md:mb-0">
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-white/10 hover:bg-indigo-600 rounded-full flex items-center justify-center transition-all hover:scale-110"
                  aria-label="Twitter"
                >
                  <Twitter className="w-5 h-5" />
                </a>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-white/10 hover:bg-indigo-600 rounded-full flex items-center justify-center transition-all hover:scale-110"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="w-5 h-5" />
                </a>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-white/10 hover:bg-indigo-600 rounded-full flex items-center justify-center transition-all hover:scale-110"
                  aria-label="GitHub"
                >
                  <Github className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Quick Links and Support - 2 columns on mobile, 3 columns each on large screens */}
            <div className="grid grid-cols-2 md:col-span-6 md:grid-cols-2 gap-6 md:gap-4">
              {/* Quick Links */}
              <div>
                <h4 className="text-lg font-semibold mb-3 text-indigo-300">Quick Links</h4>
                <ul className="space-y-2">
                  <li>
                    <Link to="/" className="text-gray-300 hover:text-indigo-400 transition-colors text-sm">
                      Analyze Resume
                    </Link>
                  </li>
                  <li>
                    <Link to="/features" className="text-gray-300 hover:text-indigo-400 transition-colors text-sm">
                      Features
                    </Link>
                  </li>
                  <li>
                    <Link to="/pricing" className="text-gray-300 hover:text-indigo-400 transition-colors text-sm">
                      Pricing
                    </Link>
                  </li>
                  <li>
                    <Link to="/faq" className="text-gray-300 hover:text-indigo-400 transition-colors text-sm">
                      FAQ
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Support */}
              <div>
                <h4 className="text-lg font-semibold mb-3 text-indigo-300">Support</h4>
                <ul className="space-y-2">
                  <li>
                    <Link to="/help" className="text-gray-300 hover:text-indigo-400 transition-colors text-sm">
                      Help Center
                    </Link>
                  </li>
                  <li>
                    <Link to="/privacy" className="text-gray-300 hover:text-indigo-400 transition-colors text-sm">
                      Privacy Policy
                    </Link>
                  </li>
                  <li>
                    <Link to="/terms" className="text-gray-300 hover:text-indigo-400 transition-colors text-sm">
                      Terms of Service
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/contact"
                      className="text-gray-300 hover:text-indigo-400 transition-colors flex items-center gap-2 text-sm"
                    >
                      <Mail className="w-4 h-4" />
                      Contact Us
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="border-t border-white/10 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm text-center md:text-left">
              © {currentYear} CareerLab AI. All rights reserved.
            </p>
            <p className="text-gray-400 text-sm flex items-center gap-1">
              Made with <Heart className="w-4 h-4 text-red-500 fill-current" /> for job seekers worldwide
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
