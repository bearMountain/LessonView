import React, { useState, useRef, useEffect } from 'react';
import './PlaybackBar.css';

interface PlaybackBarProps {
  isPlaying: boolean;
  tempo: number;
  currentTime: string;
  totalTime: string;
  trackTitle: string;
  onPlayPause: () => void;
  onTempoChange: (newTempo: number) => void;
  onLoopToggle: () => void;
  onFretboardToggle: () => void;
  onCountInToggle: () => void;
  isLooping?: boolean;
  showFretboard?: boolean;
  countInEnabled?: boolean;
}

const PlaybackBar: React.FC<PlaybackBarProps> = ({
  isPlaying,
  tempo,
  currentTime,
  totalTime,
  trackTitle,
  onPlayPause,
  onTempoChange,
  onLoopToggle,
  onFretboardToggle,
  onCountInToggle,
  isLooping = false,
  showFretboard = true,
  countInEnabled = false,
}) => {
  const [isChangingTempo, setIsChangingTempo] = useState(false);
  const tempoIntervalRef = useRef<number | null>(null);

  const handleTempoDecrease = () => {
    const newTempo = Math.max(60, tempo - 5);
    onTempoChange(newTempo);
  };

  const handleTempoIncrease = () => {
    const newTempo = Math.min(200, tempo + 5);
    onTempoChange(newTempo);
  };

  const startTempoChange = (direction: 'increase' | 'decrease') => {
    setIsChangingTempo(true);
    
    // Immediate change
    if (direction === 'increase') {
      handleTempoIncrease();
    } else {
      handleTempoDecrease();
    }
    
    // Start continuous change after a short delay
    const timeout = setTimeout(() => {
      tempoIntervalRef.current = setInterval(() => {
        if (direction === 'increase') {
          const newTempo = Math.min(200, tempo + 1); // Smaller increments for continuous change
          onTempoChange(newTempo);
        } else {
          const newTempo = Math.max(60, tempo - 1);
          onTempoChange(newTempo);
        }
      }, 100); // Change every 100ms
    }, 300); // Wait 300ms before starting continuous change
    
    // Store timeout reference for cleanup
    tempoIntervalRef.current = timeout as any;
  };

  const stopTempoChange = () => {
    setIsChangingTempo(false);
    if (tempoIntervalRef.current) {
      clearInterval(tempoIntervalRef.current);
      clearTimeout(tempoIntervalRef.current);
      tempoIntervalRef.current = null;
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (tempoIntervalRef.current) {
        clearInterval(tempoIntervalRef.current);
        clearTimeout(tempoIntervalRef.current);
      }
    };
  }, []);

  // Handle mouse/touch events for continuous tempo changes
  const handleTempoButtonEvents = (direction: 'increase' | 'decrease') => ({
    onMouseDown: () => startTempoChange(direction),
    onMouseUp: stopTempoChange,
    onMouseLeave: stopTempoChange,
    onTouchStart: () => startTempoChange(direction),
    onTouchEnd: stopTempoChange,
    onClick: direction === 'increase' ? handleTempoIncrease : handleTempoDecrease, // Fallback for quick clicks
  });

  return (
    <div className="playback-bar">
      {/* Left Section - Playback Controls */}
      <div className="playback-bar__left">
        <button 
          className="playback-bar__play-button"
          onClick={onPlayPause}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="8,5 19,12 8,19" />
            </svg>
          )}
        </button>
        
        <button 
          className={`playback-bar__count-in-button ${countInEnabled ? 'active' : ''}`}
          onClick={onCountInToggle}
          aria-label="Toggle count-in"
          title="Count-in: Play one measure of metronome before playback"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            {/* Metronome icon */}
            <path d="M12 2L10.5 8.5L9 9L10.5 15.5L12 22L13.5 15.5L15 9L13.5 8.5L12 2Z"/>
            <circle cx="12" cy="6" r="1.5"/>
            <path d="M8 20H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
        
        <div className="playback-bar__track-info">
          <div className="playback-bar__track-title">{trackTitle}</div>
          <div className="playback-bar__time-display">
            {currentTime} / {totalTime}
          </div>
        </div>
      </div>

      {/* Center Section - Tempo Controls */}
      <div className="playback-bar__center">
        <button 
          className="playback-bar__tempo-button"
          {...handleTempoButtonEvents('decrease')}
          aria-label="Decrease tempo"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
        
        <div className="playback-bar__tempo-display">
          {tempo} BPM
        </div>
        
        <button 
          className="playback-bar__tempo-button"
          {...handleTempoButtonEvents('increase')}
          aria-label="Increase tempo"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>

      {/* Right Section - Feature Buttons */}
      <div className="playback-bar__right">
        <button 
          className={`playback-bar__feature-button ${isLooping ? 'active' : ''}`}
          onClick={onLoopToggle}
          aria-label="Toggle loop"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17 2H7C5.9 2 5 2.9 5 4v16c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-5 18l-4-4h3V8h2v8h3l-4 4z"/>
          </svg>
          Loop
        </button>
        
        <button 
          className={`playback-bar__feature-button ${showFretboard ? 'active' : ''}`}
          onClick={onFretboardToggle}
          aria-label="Toggle fretboard"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <rect x="2" y="6" width="20" height="2" />
            <rect x="2" y="10" width="20" height="2" />
            <rect x="2" y="14" width="20" height="2" />
            <line x1="6" y1="4" x2="6" y2="18" />
            <line x1="10" y1="4" x2="10" y2="18" />
            <line x1="14" y1="4" x2="14" y2="18" />
            <line x1="18" y1="4" x2="18" y2="18" />
          </svg>
          Fretboard
        </button>
      </div>
    </div>
  );
};

export default PlaybackBar; 