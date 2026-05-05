import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { HelpCircle } from 'lucide-react';

// All possible nav links (excluding Home which is always shown)
const ALL_LINKS = [
  { to: '/features', label: 'Features' },
  { to: '/contact', label: 'Contact Us' },
  { to: '/privacy', label: 'Privacy Policy' },
  { to: '/terms', label: 'Terms of Service' },
  { to: '/faq', label: 'FAQ' },
];

const PageNavBar: React.FC = () => {
  const { pathname } = useLocation();

  // Pick 2 links that are NOT the current page, prioritising the default set
  const preferred = ['/features', '/contact', '/faq'];
  const fallbacks = ['/privacy', '/terms'];
  const ordered = [...preferred, ...fallbacks];

  const picked = ordered
    .filter(path => path !== pathname)
    .slice(0, 2)
    .map(path => ALL_LINKS.find(l => l.to === path)!);

  // Fourth link: first candidate not already shown and not current page
  const extraCandidates = [
    { to: '/faq', label: 'FAQ' },
    { to: '/contact', label: 'Contact Us' },
    { to: '/features', label: 'Features' },
    { to: '/privacy', label: 'Privacy Policy' },
  ];
  const pickedPaths = picked.map(l => l.to);
  const extraLink = extraCandidates.find(
    l => l.to !== pathname && !pickedPaths.includes(l.to)
  ) ?? { to: '/terms', label: 'Terms of Service' };

  const showHelpBtn = pathname !== '/help';

  return (
    <div className="flex justify-between items-center mb-8">
      {/* Logo + Title */}
      <Link to="/app" className="flex items-center gap-0">
        <img
          src="/Logo3.png"
          alt="CareerDev Logo"
          className="h-12 sm:h-16 lg:h-20 w-auto object-contain"
        />
        <div className="flex flex-col mt-4">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 bg-clip-text text-transparent drop-shadow-2xl tracking-tight">
            CareerDev AI
          </h1>
          <p className="text-gray-600 text-sm font-medium tracking-wide text-center">
            Your AI-Powered Career Assistant
          </p>
        </div>
      </Link>

      {/* Right-side nav */}
      <div className="hidden md:flex items-center gap-3">
        <nav className="flex items-center gap-0.5">
          <Link
            to="/app"
            className="px-3 py-1.5 text-base font-bold text-gray-500 rounded-lg hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-150"
          >
            Home
          </Link>
          {picked.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className="px-3 py-1.5 text-base font-bold text-gray-500 rounded-lg hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-150"
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="h-6 w-px bg-gray-200" />

        <Link
          to={extraLink.to}
          className="px-3 py-1.5 text-base font-bold text-gray-500 rounded-lg hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-150"
        >
          {extraLink.label}
        </Link>

        {showHelpBtn && (
          <>
            <div className="h-6 w-px bg-gray-200" />
            <Link
              to="/help"
              className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold px-4 py-2 rounded-xl shadow-md shadow-indigo-200/60 hover:shadow-lg hover:shadow-indigo-300/60 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
            >
              <HelpCircle className="w-4 h-4" />
              Help Center
            </Link>
          </>
        )}
      </div>

      {/* Mobile */}
      <Link
        to={extraLink.to}
        className="flex md:hidden px-3 py-1.5 text-sm font-medium text-gray-500 rounded-lg hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-150"
      >
        {extraLink.label}
      </Link>
    </div>
  );
};

export default PageNavBar;
