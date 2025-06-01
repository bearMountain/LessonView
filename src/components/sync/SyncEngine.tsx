import React, { createContext, useContext, useReducer, useEffect, useRef, useCallback } from 'react';

// Types
export interface MasterTimeline {
  currentTime: number;      // Master timestamp (seconds)
  isPlaying: boolean;       // Master play state
  totalDuration: number;    // Total duration
  playbackRate: number;     // Master playback speed
}

export interface SyncPoint {
  videoTime: number;        // Timestamp in video (seconds)
  notationTime: number;     // Position in notation (beats)
  confidence: number;       // How confident this sync point is
  type: 'manual' | 'automatic' | 'keyframe';
}

export interface TimeMapper {
  videoTimeToNotationTime(videoSeconds: number): number;
  notationTimeToVideoTime(notationBeats: number): number;
}

interface SyncEngineState {
  masterTimeline: MasterTimeline;
  syncPoints: SyncPoint[];
  isInitialized: boolean;
}

// Actions
type SyncEngineAction =
  | { type: 'PLAY' }
  | { type: 'PAUSE' }
  | { type: 'SEEK'; time: number }
  | { type: 'SET_PLAYBACK_RATE'; rate: number }
  | { type: 'SET_DURATION'; duration: number }
  | { type: 'UPDATE_TIME'; time: number }
  | { type: 'ADD_SYNC_POINT'; syncPoint: SyncPoint }
  | { type: 'REMOVE_SYNC_POINT'; index: number }
  | { type: 'INITIALIZE' };

// Reducer
function syncEngineReducer(state: SyncEngineState, action: SyncEngineAction): SyncEngineState {
  switch (action.type) {
    case 'INITIALIZE':
      return {
        ...state,
        isInitialized: true,
      };

    case 'PLAY':
      return {
        ...state,
        masterTimeline: {
          ...state.masterTimeline,
          isPlaying: true,
        },
      };

    case 'PAUSE':
      return {
        ...state,
        masterTimeline: {
          ...state.masterTimeline,
          isPlaying: false,
        },
      };

    case 'SEEK':
      return {
        ...state,
        masterTimeline: {
          ...state.masterTimeline,
          currentTime: Math.max(0, Math.min(action.time, state.masterTimeline.totalDuration)),
        },
      };

    case 'SET_PLAYBACK_RATE':
      return {
        ...state,
        masterTimeline: {
          ...state.masterTimeline,
          playbackRate: action.rate,
        },
      };

    case 'SET_DURATION':
      return {
        ...state,
        masterTimeline: {
          ...state.masterTimeline,
          totalDuration: action.duration,
        },
      };

    case 'UPDATE_TIME':
      return {
        ...state,
        masterTimeline: {
          ...state.masterTimeline,
          currentTime: action.time,
        },
      };

    case 'ADD_SYNC_POINT':
      return {
        ...state,
        syncPoints: [...state.syncPoints, action.syncPoint].sort((a, b) => a.videoTime - b.videoTime),
      };

    case 'REMOVE_SYNC_POINT':
      return {
        ...state,
        syncPoints: state.syncPoints.filter((_, index) => index !== action.index),
      };

    default:
      return state;
  }
}

// Initial state
const initialState: SyncEngineState = {
  masterTimeline: {
    currentTime: 0,
    isPlaying: false,
    totalDuration: 0,
    playbackRate: 1.0,
  },
  syncPoints: [],
  isInitialized: false,
};

// Context
interface SyncEngineContextType {
  state: SyncEngineState;
  timeMapper: TimeMapper;
  
  // Core methods
  play(): void;
  pause(): void;
  togglePlayback(): void;
  seekTo(time: number): void;
  setPlaybackRate(rate: number): void;
  setDuration(duration: number): void;
  updateTime(time: number): void;
  
  // Sync point methods
  addSyncPoint(syncPoint: SyncPoint): void;
  removeSyncPoint(index: number): void;
  
  // Conversion methods
  videoTimeToNotationTime(videoSeconds: number): number;
  notationTimeToVideoTime(notationBeats: number): number;
}

const SyncEngineContext = createContext<SyncEngineContextType | null>(null);

// Time mapping implementation
function createTimeMapper(syncPoints: SyncPoint[]): TimeMapper {
  return {
    videoTimeToNotationTime(videoSeconds: number): number {
      if (syncPoints.length === 0) {
        // Default 1:1 mapping - 120 BPM, 4/4 time
        // 1 beat = 0.5 seconds at 120 BPM
        return videoSeconds * 2; // Convert seconds to beats
      }

      if (syncPoints.length === 1) {
        const point = syncPoints[0];
        const timeOffset = videoSeconds - point.videoTime;
        return point.notationTime + (timeOffset * 2); // Assume default 120 BPM
      }

      // Find surrounding sync points for interpolation
      let beforePoint = syncPoints[0];
      let afterPoint = syncPoints[syncPoints.length - 1];

      for (let i = 0; i < syncPoints.length - 1; i++) {
        if (videoSeconds >= syncPoints[i].videoTime && videoSeconds <= syncPoints[i + 1].videoTime) {
          beforePoint = syncPoints[i];
          afterPoint = syncPoints[i + 1];
          break;
        }
      }

      // Linear interpolation between sync points
      const videoTimeDiff = afterPoint.videoTime - beforePoint.videoTime;
      const notationTimeDiff = afterPoint.notationTime - beforePoint.notationTime;
      
      if (videoTimeDiff === 0) return beforePoint.notationTime;
      
      const ratio = (videoSeconds - beforePoint.videoTime) / videoTimeDiff;
      return beforePoint.notationTime + (ratio * notationTimeDiff);
    },

    notationTimeToVideoTime(notationBeats: number): number {
      if (syncPoints.length === 0) {
        // Default 1:1 mapping - 120 BPM
        return notationBeats * 0.5; // Convert beats to seconds
      }

      if (syncPoints.length === 1) {
        const point = syncPoints[0];
        const beatOffset = notationBeats - point.notationTime;
        return point.videoTime + (beatOffset * 0.5); // Assume default 120 BPM
      }

      // Find surrounding sync points for reverse interpolation
      let beforePoint = syncPoints[0];
      let afterPoint = syncPoints[syncPoints.length - 1];

      for (let i = 0; i < syncPoints.length - 1; i++) {
        if (notationBeats >= syncPoints[i].notationTime && notationBeats <= syncPoints[i + 1].notationTime) {
          beforePoint = syncPoints[i];
          afterPoint = syncPoints[i + 1];
          break;
        }
      }

      // Linear interpolation between sync points
      const notationTimeDiff = afterPoint.notationTime - beforePoint.notationTime;
      const videoTimeDiff = afterPoint.videoTime - beforePoint.videoTime;
      
      if (notationTimeDiff === 0) return beforePoint.videoTime;
      
      const ratio = (notationBeats - beforePoint.notationTime) / notationTimeDiff;
      return beforePoint.videoTime + (ratio * videoTimeDiff);
    },
  };
}

// Provider component
interface SyncEngineProviderProps {
  children: React.ReactNode;
}

export const SyncEngineProvider: React.FC<SyncEngineProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(syncEngineReducer, initialState);
  const timeMapper = createTimeMapper(state.syncPoints);
  const animationFrameRef = useRef<number>();
  const lastTimeRef = useRef<number>(Date.now());

  // Master timeline update loop
  const updateLoop = useCallback(() => {
    const now = Date.now();
    const deltaTime = (now - lastTimeRef.current) / 1000; // Convert to seconds
    lastTimeRef.current = now;
    
    dispatch({ 
      type: 'UPDATE_TIME', 
      time: state.masterTimeline.currentTime + deltaTime * state.masterTimeline.playbackRate 
    });
    
    if (state.masterTimeline.isPlaying) {
      animationFrameRef.current = requestAnimationFrame(updateLoop);
    }
  }, [state.masterTimeline.currentTime, state.masterTimeline.playbackRate, state.masterTimeline.isPlaying]);

  useEffect(() => {
    if (state.masterTimeline.isPlaying && state.isInitialized) {
      lastTimeRef.current = Date.now();
      animationFrameRef.current = requestAnimationFrame(updateLoop);
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [state.masterTimeline.isPlaying, state.isInitialized, updateLoop]);

  // Initialize on mount
  useEffect(() => {
    dispatch({ type: 'INITIALIZE' });
  }, []);

  const contextValue: SyncEngineContextType = {
    state,
    timeMapper,

    play() {
      dispatch({ type: 'PLAY' });
    },

    pause() {
      dispatch({ type: 'PAUSE' });
    },

    togglePlayback() {
      if (state.masterTimeline.isPlaying) {
        dispatch({ type: 'PAUSE' });
      } else {
        dispatch({ type: 'PLAY' });
      }
    },

    seekTo(time: number) {
      dispatch({ type: 'SEEK', time });
    },

    setPlaybackRate(rate: number) {
      dispatch({ type: 'SET_PLAYBACK_RATE', rate });
    },

    setDuration(duration: number) {
      dispatch({ type: 'SET_DURATION', duration });
    },

    updateTime(time: number) {
      dispatch({ type: 'UPDATE_TIME', time });
    },

    addSyncPoint(syncPoint: SyncPoint) {
      dispatch({ type: 'ADD_SYNC_POINT', syncPoint });
    },

    removeSyncPoint(index: number) {
      dispatch({ type: 'REMOVE_SYNC_POINT', index });
    },

    videoTimeToNotationTime(videoSeconds: number): number {
      return timeMapper.videoTimeToNotationTime(videoSeconds);
    },

    notationTimeToVideoTime(notationBeats: number): number {
      return timeMapper.notationTimeToVideoTime(notationBeats);
    },
  };

  return (
    <SyncEngineContext.Provider value={contextValue}>
      {children}
    </SyncEngineContext.Provider>
  );
};

// Hook to use sync engine
export function useSyncEngine(): SyncEngineContextType {
  const context = useContext(SyncEngineContext);
  if (!context) {
    throw new Error('useSyncEngine must be used within a SyncEngineProvider');
  }
  return context;
} 