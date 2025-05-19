import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface AudioContextType {
  isPlayerVisible: boolean;
  setPlayerVisible: (visible: boolean) => void;
  currentAudio: {
    title: string;
    author: string;
    thumbnail: string;
    contentUrl: string;
    audioUrl?: string;
    chapters?: Array<{
      id: number;
      title: string;
      audio_url: string;
      duration: string;
    }>;
    type: 'audiobook' | 'podcast';
    currentTime?: number; // Store current playback position
  } | null;
  setCurrentAudio: (audio: AudioContextType['currentAudio']) => void;
  isMainPlayerPage: boolean;
  currentChapter: number;
  setCurrentChapter: (index: number) => void;
  updateCurrentTime: (time: number) => void; // New function to update current time
}

const AudioContext = createContext<AudioContextType | null>(null);

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [isPlayerVisible, setPlayerVisible] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<AudioContextType['currentAudio']>(null);
  const [currentChapter, setCurrentChapter] = useState(0);
  const location = useLocation();

  // Check if current page is the main player page
  const isMainPlayerPage = location.pathname.startsWith('/player/');

  // Update current time function
  const updateCurrentTime = (time: number) => {
    if (currentAudio) {
      setCurrentAudio({
        ...currentAudio,
        currentTime: time
      });
    }
  };

  // Restore state from localStorage on mount
  useEffect(() => {
    try {
      const savedState = localStorage.getItem('audioState');
      if (savedState) {
        const state = JSON.parse(savedState);
        setCurrentAudio(state.currentAudio);
        setPlayerVisible(state.isPlayerVisible);
        setCurrentChapter(state.currentChapter || 0);
      }
    } catch (error) {
      console.error('Error restoring audio state:', error);
      // Clear potentially corrupted state
      localStorage.removeItem('audioState');
    }
  }, []);

  // Save state to localStorage when it changes
  useEffect(() => {
    if (currentAudio || isPlayerVisible) {
      try {
        localStorage.setItem('audioState', JSON.stringify({
          currentAudio,
          isPlayerVisible,
          currentChapter
        }));
      } catch (error) {
        console.error('Error saving audio state:', error);
      }
    }
  }, [currentAudio, isPlayerVisible, currentChapter]);

  return (
    <AudioContext.Provider value={{
      isPlayerVisible,
      setPlayerVisible,
      currentAudio,
      setCurrentAudio,
      isMainPlayerPage,
      currentChapter,
      setCurrentChapter,
      updateCurrentTime
    }}>
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
}