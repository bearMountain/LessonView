import React, { createContext, useContext, useReducer, useEffect } from 'react';

// Types
export interface VideoConfig {
  source: string | File;
  recordedBPM: number;  // BPM the video was recorded at
}

export interface TimePosition {
  timeSlot: number;     // Current position in tab (16th note slots)
  seconds: number;      // Equivalent seconds based on current BPM
}

interface SyncEngineState {
  isPlaying: boolean;
  currentPosition: TimePosition;
  tabBPM: number;
  videoConfig: VideoConfig | null;
  timeSignature: string;
}

// Actions
type SyncEngineAction =
  | { type: 'PLAY' }
  | { type: 'PAUSE' }
  | { type: 'SEEK_TO_SLOT'; timeSlot: number }
  | { type: 'UPDATE_POSITION'; timeSlot: number }
  | { type: 'SET_TAB_BPM'; bpm: number }
  | { type: 'SET_VIDEO_CONFIG'; config: VideoConfig }
  | { type: 'SET_TIME_SIGNATURE'; signature: string };

// Utility functions
function getSlotsPerMeasure(timeSignature: string): number {
  const [numerator] = timeSignature.split('/').map(Number);
  return numerator * 4; // 4 sixteenth notes per beat
}

function timeSlotToSeconds(timeSlot: number, bpm: number): number {
  // Each timeSlot is a 16th note
  // At 120 BPM: 1 beat = 0.5 seconds, 1 sixteenth = 0.125 seconds
  return timeSlot * (60 / bpm / 4);
}

function getVideoPlaybackRate(tabBPM: number, videoBPM: number): number {
  return tabBPM / videoBPM;
}

// Reducer
function syncEngineReducer(state: SyncEngineState, action: SyncEngineAction): SyncEngineState {
  switch (action.type) {
    case 'PLAY':
      return {
        ...state,
        isPlaying: true,
      };

    case 'PAUSE':
      return {
        ...state,
        isPlaying: false,
      };

    case 'SEEK_TO_SLOT': {
      const seconds = timeSlotToSeconds(action.timeSlot, state.tabBPM);
      return {
        ...state,
        currentPosition: {
          timeSlot: action.timeSlot,
          seconds,
        },
      };
    }

    case 'UPDATE_POSITION': {
      const seconds = timeSlotToSeconds(action.timeSlot, state.tabBPM);
      return {
        ...state,
        currentPosition: {
          timeSlot: action.timeSlot,
          seconds,
        },
      };
    }

    case 'SET_TAB_BPM': {
      // Recalculate current position in seconds with new BPM
      const seconds = timeSlotToSeconds(state.currentPosition.timeSlot, action.bpm);
      return {
        ...state,
        tabBPM: action.bpm,
        currentPosition: {
          ...state.currentPosition,
          seconds,
        },
      };
    }

    case 'SET_VIDEO_CONFIG':
      return {
        ...state,
        videoConfig: action.config,
      };

    case 'SET_TIME_SIGNATURE':
      return {
        ...state,
        timeSignature: action.signature,
      };

    default:
      return state;
  }
}

// Initial state
const initialState: SyncEngineState = {
  isPlaying: false,
  currentPosition: {
    timeSlot: 0,
    seconds: 0,
  },
  tabBPM: 120,
  videoConfig: null,
  timeSignature: '4/4',
};

// Context
interface SyncEngineContextType {
  state: SyncEngineState;
  
  // Core methods
  play(): void;
  pause(): void;
  togglePlayback(): void;
  seekToSlot(timeSlot: number): void;
  updatePosition(timeSlot: number): void;
  
  // Configuration
  setTabBPM(bpm: number): void;
  setVideoConfig(config: VideoConfig): void;
  setTimeSignature(signature: string): void;
  
  // Utility methods
  getVideoPlaybackRate(): number;
  getSlotsPerMeasure(): number;
  timeSlotToSeconds(timeSlot: number): number;
}

const SyncEngineContext = createContext<SyncEngineContextType | null>(null);

// Provider component
interface SyncEngineProviderProps {
  children: React.ReactNode;
}

export const SyncEngineProvider: React.FC<SyncEngineProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(syncEngineReducer, initialState);

  const contextValue: SyncEngineContextType = {
    state,

    play() {
      dispatch({ type: 'PLAY' });
    },

    pause() {
      dispatch({ type: 'PAUSE' });
    },

    togglePlayback() {
      if (state.isPlaying) {
        dispatch({ type: 'PAUSE' });
      } else {
        dispatch({ type: 'PLAY' });
      }
    },

    seekToSlot(timeSlot: number) {
      dispatch({ type: 'SEEK_TO_SLOT', timeSlot });
    },

    updatePosition(timeSlot: number) {
      dispatch({ type: 'UPDATE_POSITION', timeSlot });
    },

    setTabBPM(bpm: number) {
      dispatch({ type: 'SET_TAB_BPM', bpm });
    },

    setVideoConfig(config: VideoConfig) {
      dispatch({ type: 'SET_VIDEO_CONFIG', config });
    },

    setTimeSignature(signature: string) {
      dispatch({ type: 'SET_TIME_SIGNATURE', signature });
    },

    getVideoPlaybackRate(): number {
      if (!state.videoConfig) return 1.0;
      return getVideoPlaybackRate(state.tabBPM, state.videoConfig.recordedBPM);
    },

    getSlotsPerMeasure(): number {
      return getSlotsPerMeasure(state.timeSignature);
    },

    timeSlotToSeconds(timeSlot: number): number {
      return timeSlotToSeconds(timeSlot, state.tabBPM);
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