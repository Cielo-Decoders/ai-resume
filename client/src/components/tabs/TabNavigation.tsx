import React from 'react';
import { Target, type LucideIcon } from 'lucide-react';

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
  const tabs: Array<{ id: string; label: string; icon: LucideIcon; badge?: number }> = [
    { id: 'analyze', label: 'Analyze & Optimize', icon: Target, badge: applicationsCount },
  ];

  return (
    <div className="flex flex-wrap gap-2 mb-8 bg-white rounded-xl p-2 shadow-lg w-64">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`w-64 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span>{tab.label}</span>
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full ml-2">
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
