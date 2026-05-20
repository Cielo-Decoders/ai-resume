import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { HelpCircle, Menu, X } from 'lucide-react';

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
  const [mobileOpen, setMobileOpen] = useState(false);

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

  // Full link set for the mobile drawer (everything except the page you're on).
  const mobileLinks = [
    { to: '/app', label: 'Home' },
    ...ALL_LINKS,
  ].filter(l => l.to !== pathname);

  const closeMobile = () => setMobileOpen(false);

  return (
    <div className="relative mb-8">
      <div className="flex justify-between items-center">
        {/* Logo + Title */}
        <Link to="/app" className="flex items-center gap-0" onClick={closeMobile}>
          <img
            src="/Logo3.png"
            alt="CareerDev Logo"
            className="h-12 sm:h-16 lg:h-20 w-auto object-contain"
          />
          <div className="flex flex-col mt-4">
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 bg-clip-text text-transparent drop-shadow-2xl tracking-tight">
              CareerDev AI
            </h1>
            <p className="hidden sm:block text-gray-600 text-sm font-medium tracking-wide text-center">
              Your AI-Powered Career Assistant
            </p>
          </div>
        </Link>

        {/* Desktop nav */}
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

        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
          className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden absolute left-0 right-0 top-full mt-2 z-50 bg-white rounded-2xl shadow-xl border border-gray-100 p-3 space-y-1">
          {mobileLinks.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              onClick={closeMobile}
              className="block px-4 py-3 text-base font-semibold text-gray-700 rounded-lg hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
            >
              {label}
            </Link>
          ))}
          {showHelpBtn && (
            <Link
              to="/help"
              onClick={closeMobile}
              className="flex items-center gap-2 mt-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold px-4 py-3 rounded-xl shadow-md justify-center"
            >
              <HelpCircle className="w-4 h-4" />
              Help Center
            </Link>
          )}
        </div>
      )}
    </div>
  );
};

export default PageNavBar;
