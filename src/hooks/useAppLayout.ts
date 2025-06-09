import { useReducer, useCallback } from 'react';

// App layout state interface
interface AppLayoutState {
  zoom: number;
  showFretboard: boolean;
  splitRatio: number;
  isPlaying: boolean; // Playback state affects layout/UI
}

// App layout actions
type AppLayoutAction = 
  | { type: 'SET_ZOOM'; payload: number }
  | { type: 'TOGGLE_FRETBOARD' }
  | { type: 'SET_SPLIT_RATIO'; payload: number }
  | { type: 'SET_PLAYING'; payload: boolean };

// Initial state
const initialState: AppLayoutState = {
  zoom: 1,
  showFretboard: true,
  splitRatio: 0.5,
  isPlaying: false,
};

// App layout reducer
const appLayoutReducer = (state: AppLayoutState, action: AppLayoutAction): AppLayoutState => {
  switch (action.type) {
    case 'SET_ZOOM':
      return {
        ...state,
        zoom: Math.max(0.25, Math.min(4.0, action.payload))
      };
    
    case 'TOGGLE_FRETBOARD':
      return {
        ...state,
        showFretboard: !state.showFretboard
      };
    
    case 'SET_SPLIT_RATIO':
      return {
        ...state,
        splitRatio: Math.max(0.1, Math.min(0.9, action.payload))
      };
    
    case 'SET_PLAYING':
      return {
        ...state,
        isPlaying: action.payload
      };
    
    default:
      return state;
  }
};

/**
 * Hook for managing app-wide layout and UI state
 * Handles zoom, fretboard visibility, split panes, and playback UI state
 */
export const useAppLayout = () => {
  const [state, dispatch] = useReducer(appLayoutReducer, initialState);
  
  // Zoom controls
  const setZoom = useCallback((zoom: number) => {
    dispatch({ type: 'SET_ZOOM', payload: zoom });
  }, []);
  
  const zoomIn = useCallback(() => {
    dispatch({ type: 'SET_ZOOM', payload: state.zoom + 0.25 });
  }, [state.zoom]);
  
  const zoomOut = useCallback(() => {
    dispatch({ type: 'SET_ZOOM', payload: state.zoom - 0.25 });
  }, [state.zoom]);
  
  // Fretboard visibility
  const toggleFretboard = useCallback(() => {
    dispatch({ type: 'TOGGLE_FRETBOARD' });
  }, []);
  
  // Split pane controls
  const setSplitRatio = useCallback((ratio: number) => {
    dispatch({ type: 'SET_SPLIT_RATIO', payload: ratio });
  }, []);
  
  // Playback UI state
  const setPlaying = useCallback((playing: boolean) => {
    dispatch({ type: 'SET_PLAYING', payload: playing });
  }, []);
  
  return {
    // State
    ...state,
    
    // Actions
    setZoom,
    zoomIn,
    zoomOut,
    toggleFretboard,
    setSplitRatio,
    setPlaying,
  };
}; 