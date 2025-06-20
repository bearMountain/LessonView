// NoteStack Editor Hook
// New state management hook using the NoteStack architecture

import { useReducer, useCallback, useMemo } from 'react';
import type { Tab, Duration, AppState as NoteStackAppState } from '../types/notestack';
import { DURATION_TO_TICKS } from '../types/notestack';
import type { NoteSelection } from '../services/NoteStackSelection';
import {
  addNoteToStack, 
  removeNoteFromString, 
  findStackAtPosition,
  getNoteAt,
  updateStackDuration,
  moveStack,
  removeStack,
  getNextAvailablePosition,
  getPreviousStackPosition
} from '../services/NoteStackOperations';
import {
  selectNotesOnString,
  selectNotesInRange,
  cutNotesFromString,
  copyNotesFromSelection,
  pasteNotesToString,
  pasteNotesPreservingStrings,
  deleteNotesFromSelection
} from '../services/NoteStackSelection';
import { calculateDisplayPositions, getTotalTabWidth } from '../services/NoteStackLayout';

// Extended musical state - pure note/tab editing concerns
interface ExtendedAppState extends NoteStackAppState {
  // Current input state
  selectedDuration: Duration;
  selectedString: number; // 0=Low D, 1=A, 2=High D
  currentFretInput: string;
  
  // File management
  isModified: boolean;
  currentProjectName?: string;
  
  // Selection state
  selection: NoteSelection;
}

// Action types
type NoteStackAction = 
  | { type: 'ADD_NOTE'; payload: { position: number; string: number; fret: number; duration: Duration } }
  | { type: 'REMOVE_NOTE'; payload: { position: number; string: number } }
  | { type: 'UPDATE_STACK_DURATION'; payload: { stackId: string; duration: Duration } }
  | { type: 'MOVE_STACK'; payload: { stackId: string; newPosition: number } }
  | { type: 'REMOVE_STACK'; payload: { stackId: string } }
  | { type: 'SET_CURSOR_POSITION'; payload: number }
  | { type: 'SET_SELECTED_STACKS'; payload: string[] }
  | { type: 'SET_BPM'; payload: number }
  | { type: 'SET_TIME_SIGNATURE'; payload: { numerator: number; denominator: number } }
  | { type: 'SET_SELECTED_DURATION'; payload: Duration }
  | { type: 'SET_SELECTED_STRING'; payload: number }
  | { type: 'SET_FRET_INPUT'; payload: string }
  | { type: 'CLEAR_FRET_INPUT' }
  | { type: 'SET_SELECTION'; payload: NoteSelection }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'CUT_SELECTION' }
  | { type: 'COPY_SELECTION' }
  | { type: 'PASTE_CLIPBOARD'; payload: { position: number; string?: number } }
  | { type: 'DELETE_SELECTION' }

  | { type: 'SET_MODIFIED'; payload: boolean }
  | { type: 'LOAD_TAB'; payload: Tab }
  | { type: 'RESET_TAB' };

// Initial state
const initialState: ExtendedAppState = {
  tab: [],
  timeSignature: { numerator: 4, denominator: 4 },
  bpm: 120,
  currentPosition: 0,
  selectedStacks: [],
  clipboardStacks: [],
  
  // Input state
  selectedDuration: 'quarter',
  selectedString: 2, // 0=Low D, 1=A, 2=High D
  currentFretInput: '',
  
  // File management
  isModified: false,
  
  // Selection
  selection: []
};

// Reducer
const noteStackReducer = (state: ExtendedAppState, action: NoteStackAction): ExtendedAppState => {
  switch (action.type) {
    case 'ADD_NOTE': {
      const { position, string, fret, duration } = action.payload;
      const newTab = addNoteToStack(state.tab, position, string, fret, duration);
      return {
        ...state,
        tab: newTab,
        isModified: true
      };
    }
    
    case 'REMOVE_NOTE': {
      const { position, string } = action.payload;
      const newTab = removeNoteFromString(state.tab, position, string);
      return {
        ...state,
        tab: newTab,
        isModified: true
      };
    }
    
    case 'UPDATE_STACK_DURATION': {
      const { stackId, duration } = action.payload;
      const newTab = updateStackDuration(state.tab, stackId, duration);
      return {
        ...state,
        tab: newTab,
        isModified: true
      };
    }
    
    case 'MOVE_STACK': {
      const { stackId, newPosition } = action.payload;
      const newTab = moveStack(state.tab, stackId, newPosition);
      return {
        ...state,
        tab: newTab,
        isModified: true
      };
    }
    
    case 'REMOVE_STACK': {
      const { stackId } = action.payload;
      const newTab = removeStack(state.tab, stackId);
      return {
        ...state,
        tab: newTab,
        isModified: true
      };
    }
    
    case 'SET_CURSOR_POSITION':
      console.log('Reducer SET_CURSOR_POSITION:', { 
        oldPosition: state.currentPosition, 
        newPosition: action.payload 
      });
      return {
        ...state,
        currentPosition: action.payload
      };
    
    case 'SET_SELECTED_STACKS':
      return {
        ...state,
        selectedStacks: action.payload
      };
    
    case 'SET_BPM':
      return {
        ...state,
        bpm: action.payload,
        isModified: true
      };
    
    case 'SET_TIME_SIGNATURE':
      return {
        ...state,
        timeSignature: action.payload,
        isModified: true
      };
    
    case 'SET_SELECTED_DURATION':
      return {
        ...state,
        selectedDuration: action.payload
      };
    
    case 'SET_SELECTED_STRING':
      return {
        ...state,
        selectedString: Math.max(0, Math.min(2, action.payload)) // Clamp to 0-2
      };
    
    case 'SET_FRET_INPUT':
      return {
        ...state,
        currentFretInput: action.payload
      };
    
    case 'CLEAR_FRET_INPUT':
      return {
        ...state,
        currentFretInput: ''
      };
    
    case 'SET_SELECTION':
      return {
        ...state,
        selection: action.payload
      };
    
    case 'CLEAR_SELECTION':
      return {
        ...state,
        selection: []
      };
    
    case 'CUT_SELECTION': {
      const { newTab, clipboard } = cutNotesFromString(state.tab, state.selection);
      return {
        ...state,
        tab: newTab,
        clipboardStacks: clipboard,
        selection: [],
        isModified: true
      };
    }
    
    case 'COPY_SELECTION': {
      const clipboard = copyNotesFromSelection(state.tab, state.selection);
      return {
        ...state,
        clipboardStacks: clipboard
      };
    }
    
    case 'PASTE_CLIPBOARD': {
      const { position, string } = action.payload;
      const newTab = string !== undefined 
        ? pasteNotesToString(state.tab, state.clipboardStacks, position, string)
        : pasteNotesPreservingStrings(state.tab, state.clipboardStacks, position);
      return {
        ...state,
        tab: newTab,
        isModified: true
      };
    }
    
    case 'DELETE_SELECTION': {
      const newTab = deleteNotesFromSelection(state.tab, state.selection);
      return {
        ...state,
        tab: newTab,
        selection: [],
        isModified: true
      };
    }
    

    
    case 'SET_MODIFIED':
      return {
        ...state,
        isModified: action.payload
      };
    
    case 'LOAD_TAB':
      return {
        ...state,
        tab: action.payload,
        isModified: false,
        selection: [],
        currentPosition: 0
      };
    
    case 'RESET_TAB':
      return {
        ...initialState
      };
    
    default:
      return state;
  }
};

/**
 * Main hook for NoteStack editor functionality
 */
export const useNoteStackEditor = () => {
  const [state, dispatch] = useReducer(noteStackReducer, initialState);
  
  // === Derived state (memoized) ===
  const layoutItems = useMemo(() => calculateDisplayPositions(state.tab), [state.tab]);
  const totalWidth = useMemo(() => getTotalTabWidth(state.tab), [state.tab]);
  
  // === Note management actions ===
  
  const addNote = useCallback((position: number, string: number, fret: number, duration: Duration) => {
    dispatch({
      type: 'ADD_NOTE',
      payload: {
        position,
        string,
        fret,
        duration
      }
    });
  }, []);
  
  const removeNote = useCallback((position: number, string: number) => {
    dispatch({
      type: 'REMOVE_NOTE',
      payload: { position, string }
    });
  }, []);
  
  const updateDuration = useCallback((stackId: string, duration: Duration) => {
    dispatch({
      type: 'UPDATE_STACK_DURATION',
      payload: { stackId, duration }
    });
  }, []);
  
  // === Cursor and navigation ===
  
  const setCursorPosition = useCallback((position: number) => {
    console.log('setCursorPosition called:', { from: state.currentPosition, to: position });
    dispatch({
      type: 'SET_CURSOR_POSITION',
      payload: position
    });
  }, [state.currentPosition]);
  
  const moveCursorLeft = useCallback(() => {
    const newPosition = getPreviousStackPosition(state.tab, state.currentPosition);
    console.log('moveCursorLeft (Shift+Tab):', { from: state.currentPosition, to: newPosition });
    setCursorPosition(newPosition);
  }, [state.tab, state.currentPosition, setCursorPosition]);
  
  const moveCursorRight = useCallback(() => {
    const newPosition = getNextAvailablePosition(state.tab, state.currentPosition);
    console.log('moveCursorRight (Tab):', { from: state.currentPosition, to: newPosition });
    setCursorPosition(newPosition);
  }, [state.tab, state.currentPosition, setCursorPosition]);
  
  // === Arrow key navigation (by selected duration) ===
  
  const moveCursorLeftByDuration = useCallback(() => {
    const durationTicks = DURATION_TO_TICKS[state.selectedDuration];
    const newPosition = Math.max(0, state.currentPosition - durationTicks);
    console.log('moveCursorLeftByDuration (Arrow Left):', { 
      from: state.currentPosition, 
      to: newPosition, 
      duration: state.selectedDuration,
      ticks: durationTicks 
    });
    setCursorPosition(newPosition);
  }, [state.currentPosition, state.selectedDuration, setCursorPosition]);

  const moveCursorRightByDuration = useCallback(() => {
    const durationTicks = DURATION_TO_TICKS[state.selectedDuration];
    const newPosition = state.currentPosition + durationTicks;
    console.log('moveCursorRightByDuration (Arrow Right):', { 
      from: state.currentPosition, 
      to: newPosition, 
      duration: state.selectedDuration,
      ticks: durationTicks 
    });
    setCursorPosition(newPosition);
  }, [state.currentPosition, state.selectedDuration, setCursorPosition]);
  
  // === String navigation (up/down arrows) ===
  
  const moveStringUp = useCallback(() => {
    // Visual "up" means higher pitch, higher string index
    // Display order: Hi D (2), A (1), Low D (0)
    const newString = state.selectedString + 1;
    if (newString <= 2) {
      console.log('moveStringUp (Arrow Up):', { 
        from: state.selectedString, 
        to: newString 
      });
      dispatch({
        type: 'SET_SELECTED_STRING',
        payload: newString
      });
    }
  }, [state.selectedString]);

  const moveStringDown = useCallback(() => {
    // Visual "down" means lower pitch, lower string index
    const newString = state.selectedString - 1;
    if (newString >= 0) {
      console.log('moveStringDown (Arrow Down):', { 
        from: state.selectedString, 
        to: newString 
      });
      dispatch({
        type: 'SET_SELECTED_STRING',
        payload: newString
      });
    }
  }, [state.selectedString]);
  
  // === Selection operations ===
  
  const selectNotesInString = useCallback((string: number, startPos: number, endPos: number) => {
    const selection = selectNotesOnString(state.tab, string, startPos, endPos);
    dispatch({
      type: 'SET_SELECTION',
      payload: selection
    });
  }, [state.tab]);
  
  const selectAllNotesInRange = useCallback((startPos: number, endPos: number) => {
    const selection = selectNotesInRange(state.tab, startPos, endPos);
    dispatch({
      type: 'SET_SELECTION',
      payload: selection
    });
  }, [state.tab]);
  
  const clearSelection = useCallback(() => {
    dispatch({ type: 'CLEAR_SELECTION' });
  }, []);
  
  // === Clipboard operations ===
  
  const cutSelection = useCallback(() => {
    dispatch({ type: 'CUT_SELECTION' });
  }, []);
  
  const copySelection = useCallback(() => {
    dispatch({ type: 'COPY_SELECTION' });
  }, []);
  
  const paste = useCallback((position: number, string?: number) => {
    dispatch({
      type: 'PASTE_CLIPBOARD',
      payload: { position, string }
    });
  }, []);
  
  const deleteSelection = useCallback(() => {
    dispatch({ type: 'DELETE_SELECTION' });
  }, []);
  
  // === Query functions ===
  
  const getNoteAtPosition = useCallback((position: number, string: number) => {
    return getNoteAt(state.tab, position, string);
  }, [state.tab]);
  
  const getStackAtPosition = useCallback((position: number) => {
    return findStackAtPosition(state.tab, position);
  }, [state.tab]);
  
  // === Settings ===
  
  const setBpm = useCallback((bpm: number) => {
    dispatch({
      type: 'SET_BPM',
      payload: bpm
    });
  }, []);
  
  const setTimeSignature = useCallback((numerator: number, denominator: number) => {
    dispatch({
      type: 'SET_TIME_SIGNATURE',
      payload: { numerator, denominator }
    });
  }, []);
  
  const setSelectedDuration = useCallback((duration: Duration) => {
    dispatch({
      type: 'SET_SELECTED_DURATION',
      payload: duration
    });
  }, []);
  
  const setSelectedString = useCallback((string: number) => {
    dispatch({
      type: 'SET_SELECTED_STRING',
      payload: string
    });
  }, []);
  
  // === File operations ===
  
  const loadTab = useCallback((tab: Tab) => {
    dispatch({
      type: 'LOAD_TAB',
      payload: tab
    });
  }, []);
  
  const resetTab = useCallback(() => {
    dispatch({ type: 'RESET_TAB' });
  }, []);
  
  const setModified = useCallback((modified: boolean) => {
    dispatch({
      type: 'SET_MODIFIED',
      payload: modified
    });
  }, []);
  

  
  return {
    // State
    state,
    layoutItems,
    totalWidth,
    
    // Note operations
    addNote,
    removeNote,
    updateDuration,
    
    // Navigation
    setCursorPosition,
    moveCursorLeft,
    moveCursorRight,
    
    // Arrow key navigation (by selected duration)
    moveCursorLeftByDuration,
    moveCursorRightByDuration,
    
    // String navigation (up/down arrows)
    moveStringUp,
    moveStringDown,
    
    // Selection
    selectNotesInString,
    selectAllNotesInRange,
    clearSelection,
    
    // Clipboard
    cutSelection,
    copySelection,
    paste,
    deleteSelection,
    
    // Queries
    getNoteAtPosition,
    getStackAtPosition,
    
    // Settings
    setBpm,
    setTimeSignature,
    setSelectedDuration,
    setSelectedString,
    
    // File operations
    loadTab,
    resetTab,
    setModified,
    

  };
};

export type NoteStackEditorAPI = ReturnType<typeof useNoteStackEditor>; 