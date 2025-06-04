// Unified State Types for Functional Architecture
// This consolidates all app state into a single, predictable structure

import type { 
  Note, 
  NoteDuration, 
  NoteType, 
  CursorPosition, 
  TabData, 
  ToolMode, 
  CustomMeasureLine 
} from '../types'

// Core unified app state - single source of truth
export interface AppState {
  // === Musical Data (Core) ===
  notes: Note[]  // Flattened from TabData grid to simple array
  tempo: number
  timeSignature: [number, number] // [numerator, denominator] like [4, 4]
  
  // === UI State ===
  cursor: CursorPosition
  selection: number[] // Selected note indices  
  zoom: number
  currentFretInput: string
  showFretboard: boolean
  
  // === Playback State ===
  isPlaying: boolean
  playbackPosition: number // Current playback slot
  countIn: boolean
  isLooping: boolean
  pausedAtTimeSlot: number
  
  // === Tool & Input State ===
  selectedDuration: NoteDuration
  selectedNoteType: NoteType
  currentToolMode: ToolMode
  firstSelectedNote: { timeSlot: number; stringIndex: number } | null
  
  // === Visual & Layout State ===
  customMeasureLines: CustomMeasureLine[]
  
  // === Video Sync State ===
  videoSource: string
  splitRatio: number // For split pane layout
  videoCurrentTime: number
  videoPlaybackRate: number
  
  // === Audio State ===
  isVideoMuted: boolean
  isSynthMuted: boolean
  
  // === File Management State ===
  isModified: boolean
  currentProjectMetadata: {
    title?: string
    author?: string
    description?: string
    createdAt?: string
    modifiedAt?: string
  }
  saveDialogOpen: boolean
  loadDialogOpen: boolean
  newProjectDialogOpen: boolean
}

// Action types for the reducer
export type AppAction = 
  // Note actions
  | { type: 'ADD_NOTE'; payload: { note: Note } }
  | { type: 'REMOVE_NOTE'; payload: { index: number } }
  | { type: 'UPDATE_NOTE'; payload: { index: number; note: Partial<Note> } }
  | { type: 'TOGGLE_DOTTED_NOTE'; payload: { index: number } }
  | { type: 'CHANGE_NOTE_DURATION'; payload: { index: number; duration: NoteDuration } }
  
  // Cursor and selection actions
  | { type: 'MOVE_CURSOR'; payload: 'left' | 'right' | 'up' | 'down' | { type: 'absolute'; position: CursorPosition } }
  | { type: 'SET_CURSOR_POSITION'; payload: CursorPosition }
  | { type: 'UPDATE_FRET_INPUT'; payload: string }
  | { type: 'CLEAR_FRET_INPUT' }
  | { type: 'SET_SELECTION'; payload: number[] }
  | { type: 'TOGGLE_NOTE_SELECTION'; payload: { index: number; shiftHeld?: boolean } }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'SET_FIRST_SELECTED_NOTE'; payload: { timeSlot: number; stringIndex: number } | null }
  
  // Playback actions
  | { type: 'TOGGLE_PLAYBACK' }
  | { type: 'START_PLAYBACK' }
  | { type: 'STOP_PLAYBACK' }
  | { type: 'SET_PLAYBACK_POSITION'; payload: number }
  | { type: 'SET_PAUSED_POSITION'; payload: number }
  | { type: 'TOGGLE_COUNT_IN' }
  | { type: 'TOGGLE_LOOPING' }
  
  // Musical settings actions
  | { type: 'SET_TEMPO'; payload: number }
  | { type: 'SET_TIME_SIGNATURE'; payload: [number, number] }
  | { type: 'SET_SELECTED_DURATION'; payload: NoteDuration }
  | { type: 'SET_SELECTED_NOTE_TYPE'; payload: NoteType }
  | { type: 'SET_TOOL_MODE'; payload: ToolMode }
  
  // Visual actions
  | { type: 'SET_ZOOM'; payload: number }
  | { type: 'TOGGLE_FRETBOARD' }
  | { type: 'ADD_MEASURE_LINE'; payload: CustomMeasureLine }
  | { type: 'REMOVE_MEASURE_LINE'; payload: { slot: number } }
  | { type: 'CLEAR_MEASURE_LINES' }
  
  // Video sync actions
  | { type: 'SET_VIDEO_SOURCE'; payload: string }
  | { type: 'SET_SPLIT_RATIO'; payload: number }
  | { type: 'SET_VIDEO_CURRENT_TIME'; payload: number }
  | { type: 'SET_VIDEO_PLAYBACK_RATE'; payload: number }
  
  // Audio actions
  | { type: 'TOGGLE_VIDEO_MUTE' }
  | { type: 'TOGGLE_SYNTH_MUTE' }
  
  // File management actions
  | { type: 'SET_MODIFIED'; payload: boolean }
  | { type: 'SET_PROJECT_METADATA'; payload: AppState['currentProjectMetadata'] }
  | { type: 'TOGGLE_SAVE_DIALOG' }
  | { type: 'TOGGLE_LOAD_DIALOG' }
  | { type: 'TOGGLE_NEW_PROJECT_DIALOG' }
  
  // Bulk state actions (for loading projects)
  | { type: 'LOAD_PROJECT_STATE'; payload: Partial<AppState> }
  | { type: 'RESET_TO_INITIAL_STATE' }

// Derived/computed state interfaces (not stored, but calculated by selectors)
export interface MeasureBoundary {
  startSlot: number
  beat: number
  type: 'calculated' | 'custom'
  measureNumber?: number
}

export interface VisualNote extends Note {
  visualX: number
  visualY: number
  slot: number
  isSelected?: boolean
}

export interface VisualMeasure extends MeasureBoundary {
  visualX: number
}

export interface VisualLayout {
  notes: VisualNote[]
  measures: VisualMeasure[]
  totalWidth: number
  stringPositions: number[] // Y positions for each string
}

export interface AudioEvent {
  time: number // When to play (in seconds)
  frequency: number // Note frequency in Hz
  duration: number // How long to play (in seconds)
  stringIndex: number
  fret: number
  velocity?: number
}

// Tie-related types
export interface TieConnection {
  fromSlot: number
  toSlot: number
  stringIndex: number
  fret: number
}

// Helper type for cursor movement calculations
export interface CursorMovement {
  direction: 'left' | 'right' | 'up' | 'down'
  distance?: number
} 