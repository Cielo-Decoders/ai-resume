import React from 'react';
import { Target, Briefcase, type LucideIcon } from 'lucide-react';

interface TabNavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  applicationsCount: number;
}

const TabNavigation: React.FC<TabNavigationProps> = ({
  activeTab,
  setActiveTab,
  applicationsCount,
}) => {
  const tabs: Array<{ id: string; label: string; subtitle: string; icon: LucideIcon; badge?: number }> = [
    { id: 'jobs', label: 'Job Listings', subtitle: 'Discover matching opportunities', icon: Briefcase },
    { id: 'analyze', label: 'Analyze & Optimize', subtitle: 'ATS scoring & resume tailoring', icon: Target, badge: applicationsCount },
  ];

  return (
    <nav className="flex flex-col sm:flex-row gap-4 mb-10" role="tablist">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => setActiveTab(tab.id)}
            className="group relative flex-1 sm:flex-none"
            style={{ outline: 'none' }}
          >
            <div
              className={`
                relative overflow-hidden rounded-2xl px-7 py-5
                transition-all duration-300 ease-out
                flex items-center gap-4
                ${isActive
                  ? 'bg-white shadow-[0_8px_30px_rgba(79,70,229,0.12)] border border-indigo-100 scale-[1.02]'
                  : 'bg-white/60 backdrop-blur-sm shadow-sm border border-gray-200/70 hover:bg-white hover:shadow-md hover:border-gray-300 hover:-translate-y-0.5'
                }
              `}
            >
              {/* Active accent bar */}
              <div
                className={`
                  absolute left-0 top-0 bottom-0 w-1 rounded-r-full
                  transition-all duration-300 ease-out
                  ${isActive
                    ? 'bg-gradient-to-b from-indigo-500 to-purple-500 opacity-100'
                    : 'bg-gray-300 opacity-0 group-hover:opacity-40'
                  }
                `}
              />

              {/* Icon container */}
              <div
                className={`
                  flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center
                  transition-all duration-300 ease-out
                  ${isActive
                    ? 'bg-gradient-to-br from-indigo-500 to-purple-500 shadow-md shadow-indigo-200/50'
                    : 'bg-gray-100 group-hover:bg-indigo-50'
                  }
                `}
              >
                <Icon
                  className={`w-5 h-5 transition-colors duration-300 ${
                    isActive ? 'text-white' : 'text-gray-500 group-hover:text-indigo-500'
                  }`}
                />
              </div>

              {/* Text content */}
              <div className="flex flex-col items-start text-left min-w-0">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`
                      text-lg font-bold tracking-tight leading-snug
                      transition-colors duration-300
                      ${isActive ? 'text-gray-900' : 'text-gray-600 group-hover:text-gray-800'}
                    `}
                  >
                    {tab.label}
                  </span>
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span
                      className={`
                        inline-flex items-center justify-center min-w-[22px] h-[22px] px-2
                        text-xs font-bold rounded-md leading-none
                        transition-all duration-300
                        ${isActive
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'bg-gray-100 text-gray-500 group-hover:bg-indigo-50 group-hover:text-indigo-600'
                        }
                      `}
                    >
                      {tab.badge}
                    </span>
                  )}
                </div>
                <span
                  className={`
                    text-sm leading-tight mt-1
                    transition-colors duration-300
                    ${isActive ? 'text-indigo-500/80' : 'text-gray-400 group-hover:text-gray-500'}
                  `}
                >
                  {tab.subtitle}
                </span>
              </div>

              {/* Active bottom glow */}
              {isActive && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-indigo-400/40 to-transparent" />
              )}
            </div>
          </button>
        );
      })}
    </nav>
  );
};

export default TabNavigation;
