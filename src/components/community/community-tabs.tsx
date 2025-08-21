import React, { useState } from 'react';
import { Discussions } from './discussions';
import { StudyGroups } from './study-groups';
import { LearningChallenges } from './learning-challenges';
import { BookClubs } from './book-clubs';

type Tab = 'discussions' | 'study-groups' | 'challenges' | 'book-clubs';

interface CommunityTabsProps {
  defaultTab?: string;
}

export function CommunityTabs({ defaultTab = 'discussions' }: CommunityTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>(defaultTab as Tab);

  // Update active tab when defaultTab changes
  React.useEffect(() => {
    setActiveTab(defaultTab as Tab);
  }, [defaultTab]);

  const tabs = [
    { id: 'discussions', label: 'Discussions' },
    { id: 'study-groups', label: 'Study Groups' },
    { id: 'book-clubs', label: 'Book Clubs' },
    { id: 'challenges', label: 'Learning Challenges' },
  ] as const;

  const handleTabChange = (tabId: Tab) => {
    setActiveTab(tabId);
    // Update URL without page reload
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tabId);
    window.history.replaceState({}, '', url.toString());
  };

  return (
    <div>
      <div className="border-b">
        <div className="flex gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="py-6">
        {activeTab === 'discussions' && <Discussions />}
        {activeTab === 'study-groups' && <StudyGroups />}
        {activeTab === 'book-clubs' && <BookClubs />}
        {activeTab === 'challenges' && <LearningChallenges />}
      </div>
    </div>
  );
}