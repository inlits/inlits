import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX,
  Settings,
  List,
  Clock,
  Loader2,
  X,
  Car,
  Timer,
  Moon as MoonIcon,
  Dumbbell,
  Lock
} from 'lucide-react';
import { useAudio } from '@/lib/audio-context';
import { ImageLoader } from '@/components/image-loader';
import { useAuth } from '@/lib/auth';

interface AudioPlayerProps {
  title: string;
  author: string;
  thumbnail: string;
  type: 'audiobook' | 'podcast';
}

interface Settings {
  playbackSpeed: number;
  autoplay: boolean;
  skipSilence: boolean;
}

type ListeningMode = 'normal' | 'driving' | 'walking' | 'sleep' | 'workout';

export function AudioPlayer({ 
  title, 
  author, 
  thumbnail,
  type
}: AudioPlayerProps) {
  const { user } = useAuth();
  const { 
    setPlayerVisible,
    isMainPlayerPage, 
    currentAudio,
    currentChapter,
    setCurrentChapter 
  } = useAudio();

  const audioRef = React.useRef<HTMLAudioElement>(null);
  const progressRef = React.useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [volume, setVolume] = React.useState(1);
  const [isMuted, setIsMuted] = React.useState(false);
  const [playbackRate, setPlaybackRate] = React.useState(1);
  const [showPlaylist, setShowPlaylist] = React.useState(false);
  const [showSettings, setShowSettings] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [settings, setSettings] = React.useState<Settings>({
    playbackSpeed: 1,
    autoplay: false,
    skipSilence: false
  });
  const [listeningMode, setListeningMode] = React.useState<ListeningMode>('normal');
  const [showModeSelector, setShowModeSelector] = React.useState(false);

  // Close dropdowns when clicking outside
  const closeAllExcept = (keep: 'settings' | 'playlist' | 'mode' | null) => {
    if (keep !== 'settings') setShowSettings(false);
    if (keep !== 'playlist') setShowPlaylist(false);
    if (keep !== 'mode') setShowModeSelector(false);
  };

  // Set initial audio source
  React.useEffect(() => {
    if (!currentAudio) return;

    try {
      const source = currentAudio.chapters && currentAudio.chapters.length > 0 && currentAudio.chapters[currentChapter]
        ? currentAudio.chapters[currentChapter].audio_url
        : currentAudio.audioUrl;

      if (audioRef.current && source) {
        audioRef.current.src = source;
        audioRef.current.load();
      }
    } catch (err) {
      console.error('Error setting audio source:', err);
      setError('Failed to load audio source');
    }
  }, [currentAudio, currentChapter]);

  // Handle playback control based on isPlaying state
  React.useEffect(() => {
    const audio = audioRef.current;
    if (!audio || isLoading) return;

    if (isPlaying) {
      audio.play().catch(err => {
        console.error('Error playing audio:', err);
        setError('Failed to play audio');
        setIsPlaying(false);
      });
    } else {
      audio.pause();
    }
  }, [isPlaying, isLoading]);

  // Handle audio element events
  React.useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Configure audio settings
    audio.playbackRate = settings.playbackSpeed;
    
    // Enable/disable silence skipping
    if (settings.skipSilence) {
      // @ts-ignore - This is a non-standard feature but widely supported
      audio.preservesPitch = false;
      // @ts-ignore
      audio.mozPreservesPitch = false;
      // @ts-ignore
      audio.webkitPreservesPitch = false;
    }

    const handleLoadStart = () => {
      setIsLoading(true);
      setError(null);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      if (currentAudio?.chapters && currentChapter < currentAudio.chapters.length - 1 && settings.autoplay) {
        setCurrentChapter(currentChapter + 1);
      } else {
        setIsPlaying(false);
      }
    };

    const handleError = (e: Event) => {
      const audioError = (e.target as HTMLAudioElement).error;
      setError(audioError?.message || 'Error playing audio');
      setIsLoading(false);
      setIsPlaying(false);
    };

    const handlePlay = () => {
      setIsPlaying(true);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, [currentAudio, currentChapter, settings, setCurrentChapter]);

  const togglePlay = async () => {
    if (!audioRef.current || isLoading) return;

    // Check if audio source is available
    const hasValidSource = currentAudio?.audioUrl || 
      (currentAudio?.chapters && currentAudio.chapters.length > 0 && currentAudio.chapters[currentChapter]?.audio_url);

    if (!hasValidSource) {
      setError('No audio source available');
      return;
    }

    // Simply toggle the playing state - the useEffect will handle the actual play/pause
    setIsPlaying(!isPlaying);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || !audioRef.current || isLoading) return;

    const rect = progressRef.current.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * duration;
    
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    if (audioRef.current) {
      const newMuted = !isMuted;
      audioRef.current.volume = newMuted ? 0 : volume;
      setIsMuted(newMuted);
    }
  };

  const handlePlaybackRateChange = (rate: number) => {
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
      setPlaybackRate(rate);
      setSettings(prev => ({ ...prev, playbackSpeed: rate }));
    }
  };

  const skipTime = (seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, Math.min(currentTime + seconds, duration));
    }
  };

  const formatTime = (time: number) => {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleModeChange = (mode: ListeningMode) => {
    setListeningMode(mode);
    closeAllExcept(null);

    // Apply mode-specific settings
    switch (mode) {
      case 'driving':
        setSettings(prev => ({
          ...prev,
          skipSilence: true,
          playbackSpeed: 1
        }));
        break;
      case 'walking':
        setSettings(prev => ({
          ...prev,
          skipSilence: false,
          playbackSpeed: 1.2
        }));
        break;
      case 'sleep':
        setSettings(prev => ({
          ...prev,
          autoplay: false,
          playbackSpeed: 0.9
        }));
        break;
      case 'workout':
        setSettings(prev => ({
          ...prev,
          autoplay: true,
          playbackSpeed: 1.5
        }));
        break;
      default:
        setSettings(prev => ({
          ...prev,
          autoplay: true,
          playbackSpeed: 1,
          skipSilence: false
        }));
    }
  };

  const getModeIcon = (mode: ListeningMode) => {
    switch (mode) {
      case 'driving':
        return <Car className="w-4 h-4" />;
      case 'walking':
        return <Timer className="w-4 h-4" />;
      case 'sleep':
        return <MoonIcon className="w-4 h-4" />;
      case 'workout':
        return <Dumbbell className="w-4 h-4" />;
      default:
        return <Play className="w-4 h-4" />;
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t shadow-lg z-50">
      <audio 
        ref={audioRef}
        preload="auto"
      />

      {/* Progress Bar */}
      <div
        ref={progressRef}
        onClick={handleProgressClick}
        className="h-1 bg-muted cursor-pointer group"
      >
        <div
          className="h-full bg-primary relative group-hover:bg-primary/90 transition-colors"
          style={{ width: `${(currentTime / duration) * 100}%` }}
        >
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      {/* Main Player */}
      <div className="container mx-auto px-2 py-2 md:px-4 md:py-3">
        <div className="flex items-center gap-2 md:gap-4">
          {/* Thumbnail - Always visible */}
          <Link 
            to={currentAudio?.contentUrl || '/'}
            className="flex-shrink-0 block md:hidden"
          >
            <div className="w-8 h-8 md:w-12 md:h-12 rounded-lg overflow-hidden bg-muted">
              <ImageLoader
                src={thumbnail}
                alt={title}
                className="w-full h-full object-cover"
                lowQualityUrl={`${thumbnail}?w=50`}
                fallback={
                  <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                    <Play className="w-4 h-4 text-primary" />
                  </div>
                }
              />
            </div>
          </Link>

          {/* Desktop Info - Hidden on mobile */}
          <Link 
            to={currentAudio?.contentUrl || '/'}
            className="hidden md:flex items-center gap-3 hover:text-primary transition-colors"
          >
            <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
              <ImageLoader
                src={thumbnail}
                alt={title}
                className="w-full h-full object-cover"
                lowQualityUrl={`${thumbnail}?w=50`}
                fallback={
                  <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                    <Play className="w-6 h-6 text-primary" />
                  </div>
                }
              />
            </div>
            <div className="min-w-0">
              <h3 className="font-medium line-clamp-1 text-sm">{title}</h3>
              <p className="text-xs text-muted-foreground">{author}</p>
            </div>
          </Link>

          {/* Controls */}
          <div className="flex-1 flex items-center justify-center gap-2 md:gap-4">
            <button
              onClick={() => skipTime(-10)}
              className="p-1.5 md:p-2 hover:bg-primary hover:text-primary-foreground rounded-lg transition-colors"
              disabled={isLoading}
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              onClick={togglePlay}
              disabled={isLoading || (!currentAudio?.audioUrl && !(currentAudio?.chapters && currentAudio.chapters.length > 0))}
              className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-4 h-4 md:w-5 md:h-5" />
              ) : (
                <Play className="w-4 h-4 md:w-5 md:h-5 ml-0.5" />
              )}
            </button>

            <button
              onClick={() => skipTime(10)}
              className="p-1.5 md:p-2 hover:bg-primary hover:text-primary-foreground rounded-lg transition-colors"
              disabled={isLoading}
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          {/* Volume and Settings */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* Time Display - Desktop only */}
            <div className="hidden md:block text-xs text-muted-foreground">
              <span>{formatTime(currentTime)}</span>
              <span className="mx-1">/</span>
              <span>{formatTime(duration)}</span>
            </div>

            {/* Volume Control - Desktop only */}
            <div className="hidden md:flex items-center gap-2">
              <button 
                onClick={toggleMute} 
                className="hover:text-primary transition-colors"
                disabled={isLoading}
              >
                {isMuted ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-20"
                disabled={isLoading}
              />
            </div>

            {/* Mode Selector - Compact on mobile */}
            <div className="relative">
              <button
                onClick={() => {
                  closeAllExcept('mode');
                  setShowModeSelector(!showModeSelector);
                }}
                className="p-1.5 md:p-2 rounded hover:bg-primary hover:text-primary-foreground transition-colors"
                title="Listening Mode"
              >
                {getModeIcon(listeningMode)}
              </button>

              {showModeSelector && (
                <div className="absolute bottom-full right-0 mb-2 w-48 bg-popover border rounded-lg shadow-lg">
                  <div className="p-2 space-y-1">
                    {[
                      { mode: 'normal', label: 'Normal Mode', icon: Play },
                      { mode: 'driving', label: 'Driving Mode', icon: Car },
                      { mode: 'walking', label: 'Walking Mode', icon: Timer },
                      { mode: 'sleep', label: 'Sleep Mode', icon: MoonIcon },
                      { mode: 'workout', label: 'Workout Mode', icon: Dumbbell }
                    ].map(({ mode, label, icon: Icon }) => (
                      <button
                        key={mode}
                        onClick={() => handleModeChange(mode as ListeningMode)}
                        className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-sm ${
                          listeningMode === mode
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-primary hover:text-primary-foreground'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Settings */}
            <button 
              onClick={() => {
                closeAllExcept('settings');
                setShowSettings(!showSettings);
              }}
              className={`p-1.5 md:p-2 rounded hover:bg-primary hover:text-primary-foreground transition-colors ${
                showSettings ? 'text-primary' : ''
              }`}
              disabled={isLoading}
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Chapters Toggle */}
            {currentAudio?.chapters && currentAudio.chapters.length > 0 && (
              <button
                onClick={() => {
                  closeAllExcept('playlist');
                  setShowPlaylist(!showPlaylist);
                }}
                className={`p-1.5 md:p-2 rounded hover:bg-primary hover:text-primary-foreground transition-colors ${
                  showPlaylist ? 'text-primary' : ''
                }`}
                disabled={isLoading}
              >
                <List className="w-4 h-4" />
              </button>
            )}

            {/* Close Button - Only show when not on main player page */}
            {!isMainPlayerPage && (
              <button
                onClick={() => setPlayerVisible(false)}
                className="p-1.5 md:p-2 hover:bg-primary hover:text-primary-foreground rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-2 text-xs text-destructive text-center">
            {error}
          </div>
        )}
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="absolute bottom-full right-0 mb-2 w-64 bg-popover border rounded-lg shadow-lg">
          <div className="p-4 space-y-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Playback Speed</h4>
              <div className="grid grid-cols-4 gap-2">
                {[0.5, 1, 1.5, 2].map(speed => (
                  <button
                    key={speed}
                    onClick={() => handlePlaybackRateChange(speed)}
                    className={`px-2 py-1 rounded text-sm ${
                      settings.playbackSpeed === speed 
                        ? 'bg-primary text-primary-foreground' 
                        : 'hover:bg-primary hover:text-primary-foreground'
                    }`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.autoplay}
                  onChange={(e) => setSettings(prev => ({ ...prev, autoplay: e.target.checked }))}
                  className="rounded border-input"
                />
                <span className="text-sm">Autoplay next chapter</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.skipSilence}
                  onChange={(e) => setSettings(prev => ({ ...prev, skipSilence: e.target.checked }))}
                  className="rounded border-input"
                />
                <span className="text-sm">Skip silence</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Chapters Sidebar */}
      {showPlaylist && currentAudio?.chapters && currentAudio.chapters.length > 0 && (
        <div className="absolute bottom-full right-0 mb-2 w-80 bg-popover border rounded-lg shadow-lg max-h-96 overflow-y-auto">
          <div className="p-4">
            <h3 className="font-medium mb-2">Chapters ({currentAudio.chapters.length})</h3>
            <div className="space-y-2">
              {currentAudio.chapters.map((chapter, index) => {
                // Only allow first chapter for non-signed in users
                const isLocked = !user && index > 0;
                
                return (
                  <button
                    key={chapter.id}
                    onClick={() => {
                      if (!isLocked) {
                        setCurrentChapter(index);
                      }
                    }}
                    className={`w-full flex items-center gap-2 p-2 rounded-lg text-sm ${
                      isLocked 
                        ? 'bg-muted/30 cursor-not-allowed' 
                        : currentChapter === index
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-primary hover:text-primary-foreground'
                    }`}
                    disabled={isLoading || isLocked}
                  >
                    {isLocked ? (
                      <Lock className="w-4 h-4" />
                    ) : isLoading && currentChapter === index ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                    <span className="flex-1 text-left line-clamp-1">
                      {chapter.title}
                    </span>
                    <span className="text-xs">
                      {chapter.duration}
                    </span>
                    {isLocked && (
                      <Link 
                        to="/signin" 
                        className="ml-2 text-xs text-primary hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Sign in
                      </Link>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}