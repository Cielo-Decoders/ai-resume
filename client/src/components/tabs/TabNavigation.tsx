import React from 'react';
import { Target, MessageSquare, DollarSign, Briefcase, Search } from 'lucide-react';

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
  const tabs = [
    { id: 'analyze', label: 'Analyze & Optimize', icon: Target },
    { id: 'jobs', label: 'Find More Jobs', icon: Search },
    { id: 'interview', label: 'Interview Prep', icon: MessageSquare },
    { id: 'salary', label: 'Salary Insights', icon: DollarSign },
    { id: 'track', label: 'Track Apps', icon: Briefcase, badge: applicationsCount },
  ];

  return (
    <div className="flex flex-wrap gap-2 mb-8 bg-white rounded-xl p-2 shadow-lg">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 min-w-fit py-3 px-4 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Icon className="w-5 h-5" />
            {tab.label}
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default TabNavigation;
