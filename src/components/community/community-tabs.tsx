import React, { useState } from 'react';
import { Discussions } from './discussions';
import { StudyGroups } from './study-groups';
import { LearningChallenges } from './learning-challenges';
import { BookClubs } from './book-clubs';

type Tab = 'discussions' | 'study-groups' | 'challenges' | 'book-clubs';

export function CommunityTabs() {
  const [activeTab, setActiveTab] = useState<Tab>('discussions');

  const tabs = [
    { id: 'discussions', label: 'Discussions' },
    { id: 'study-groups', label: 'Study Groups' },
    { id: 'book-clubs', label: 'Book Clubs' },
    { id: 'challenges', label: 'Learning Challenges' },
  ] as const;

  return (
    <div>
      <div className="border-b">
        <div className="flex gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
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