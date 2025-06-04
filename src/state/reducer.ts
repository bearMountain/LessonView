// Main Reducer - Pure state transitions for the entire app
import type { AppState, AppAction } from './types'
import { initialState } from './initialState'
import { 
  addNoteAtPosition, 
  removeNoteAtIndex, 
  updateNoteAtIndex,
  calculateNewCursorPosition,
  toggleNoteInSelection,
  findNoteAtPosition,
  changeNoteDuration,
  toggleNoteDotted
} from './stateHelpers'

// Main reducer - handles all state transitions
export const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    // === Note Management ===
    case 'ADD_NOTE':
      return {
        ...state,
        notes: addNoteAtPosition(state.notes, action.payload.note),
        isModified: true
      }
    
    case 'REMOVE_NOTE':
      return {
        ...state,
        notes: removeNoteAtIndex(state.notes, action.payload.index),
        selection: state.selection.filter(i => i !== action.payload.index),
        isModified: true
      }
    
    case 'UPDATE_NOTE':
      return {
        ...state,
        notes: updateNoteAtIndex(state.notes, action.payload.index, action.payload.note),
        isModified: true
      }
    
    case 'TOGGLE_DOTTED_NOTE':
      return {
        ...state,
        notes: toggleNoteDotted(state.notes, action.payload.index),
        isModified: true
      }
    
    case 'CHANGE_NOTE_DURATION':
      return {
        ...state,
        notes: changeNoteDuration(state.notes, action.payload.index, action.payload.duration),
        isModified: true
      }
    
    // === Cursor and Selection ===
    case 'MOVE_CURSOR':
      return {
        ...state,
        cursor: calculateNewCursorPosition(state.cursor, action.payload, state.notes),
        currentFretInput: '', // Clear input when cursor moves
      }
    
    case 'SET_CURSOR_POSITION':
      return {
        ...state,
        cursor: action.payload,
        currentFretInput: '', // Clear input when cursor is set
      }
    
    case 'UPDATE_FRET_INPUT':
      return {
        ...state,
        currentFretInput: action.payload
      }
    
    case 'CLEAR_FRET_INPUT':
      return {
        ...state,
        currentFretInput: ''
      }
    
    case 'SET_SELECTION':
      return {
        ...state,
        selection: action.payload
      }
    
    case 'TOGGLE_NOTE_SELECTION':
      return {
        ...state,
        selection: toggleNoteInSelection(
          state.selection, 
          action.payload.index, 
          action.payload.shiftHeld || false
        )
      }
    
    case 'CLEAR_SELECTION':
      return {
        ...state,
        selection: [],
        firstSelectedNote: null
      }
    
    case 'SET_FIRST_SELECTED_NOTE':
      return {
        ...state,
        firstSelectedNote: action.payload
      }
    
    // === Playback Controls ===
    case 'TOGGLE_PLAYBACK':
      return {
        ...state,
        isPlaying: !state.isPlaying,
        // Reset playback position if starting from stopped state
        playbackPosition: state.isPlaying ? state.playbackPosition : 0
      }
    
    case 'START_PLAYBACK':
      return {
        ...state,
        isPlaying: true
      }
    
    case 'STOP_PLAYBACK':
      return {
        ...state,
        isPlaying: false,
        playbackPosition: 0
      }
    
    case 'SET_PLAYBACK_POSITION':
      return {
        ...state,
        playbackPosition: action.payload
      }
    
    case 'SET_PAUSED_POSITION':
      return {
        ...state,
        pausedAtTimeSlot: action.payload
      }
    
    case 'TOGGLE_COUNT_IN':
      return {
        ...state,
        countIn: !state.countIn
      }
    
    case 'TOGGLE_LOOPING':
      return {
        ...state,
        isLooping: !state.isLooping
      }
    
    // === Musical Settings ===
    case 'SET_TEMPO':
      return {
        ...state,
        tempo: Math.max(30, Math.min(300, action.payload)), // Clamp between 30-300 BPM
        isModified: true
      }
    
    case 'SET_TIME_SIGNATURE':
      return {
        ...state,
        timeSignature: action.payload,
        isModified: true
      }
    
    case 'SET_SELECTED_DURATION':
      return {
        ...state,
        selectedDuration: action.payload
      }
    
    case 'SET_SELECTED_NOTE_TYPE':
      return {
        ...state,
        selectedNoteType: action.payload
      }
    
    case 'SET_TOOL_MODE':
      return {
        ...state,
        currentToolMode: action.payload
      }
    
    // === Visual Controls ===
    case 'SET_ZOOM':
      return {
        ...state,
        zoom: Math.max(0.25, Math.min(4.0, action.payload)) // Clamp between 0.25x and 4x
      }
    
    case 'TOGGLE_FRETBOARD':
      return {
        ...state,
        showFretboard: !state.showFretboard
      }
    
    case 'ADD_MEASURE_LINE':
      return {
        ...state,
        customMeasureLines: [...state.customMeasureLines, action.payload],
        isModified: true
      }
    
    case 'REMOVE_MEASURE_LINE':
      return {
        ...state,
        customMeasureLines: state.customMeasureLines.filter(
          line => line.slot !== action.payload.slot
        ),
        isModified: true
      }
    
    case 'CLEAR_MEASURE_LINES':
      return {
        ...state,
        customMeasureLines: [],
        isModified: true
      }
    
    // === Video Sync ===
    case 'SET_VIDEO_SOURCE':
      return {
        ...state,
        videoSource: action.payload
      }
    
    case 'SET_SPLIT_RATIO':
      return {
        ...state,
        splitRatio: Math.max(0.1, Math.min(0.9, action.payload)) // Clamp between 10% and 90%
      }
    
    case 'SET_VIDEO_CURRENT_TIME':
      return {
        ...state,
        videoCurrentTime: action.payload
      }
    
    case 'SET_VIDEO_PLAYBACK_RATE':
      return {
        ...state,
        videoPlaybackRate: action.payload
      }
    
    // === Audio Controls ===
    case 'TOGGLE_VIDEO_MUTE':
      return {
        ...state,
        isVideoMuted: !state.isVideoMuted
      }
    
    case 'TOGGLE_SYNTH_MUTE':
      return {
        ...state,
        isSynthMuted: !state.isSynthMuted
      }
    
    // === File Management ===
    case 'SET_MODIFIED':
      return {
        ...state,
        isModified: action.payload
      }
    
    case 'SET_PROJECT_METADATA':
      return {
        ...state,
        currentProjectMetadata: {
          ...state.currentProjectMetadata,
          ...action.payload,
          modifiedAt: new Date().toISOString()
        },
        isModified: true
      }
    
    case 'TOGGLE_SAVE_DIALOG':
      return {
        ...state,
        saveDialogOpen: !state.saveDialogOpen
      }
    
    case 'TOGGLE_LOAD_DIALOG':
      return {
        ...state,
        loadDialogOpen: !state.loadDialogOpen
      }
    
    case 'TOGGLE_NEW_PROJECT_DIALOG':
      return {
        ...state,
        newProjectDialogOpen: !state.newProjectDialogOpen
      }
    
    // === Bulk State Operations ===
    case 'LOAD_PROJECT_STATE':
      return {
        ...state,
        ...action.payload,
        // Always preserve certain UI state when loading
        saveDialogOpen: false,
        loadDialogOpen: false,
        newProjectDialogOpen: false,
        isModified: false
      }
    
    case 'RESET_TO_INITIAL_STATE':
      return {
        ...initialState,
        // Preserve user preferences
        zoom: state.zoom,
        showFretboard: state.showFretboard,
        splitRatio: state.splitRatio,
        isVideoMuted: state.isVideoMuted,
        isSynthMuted: state.isSynthMuted,
      }
    
    default:
      return state
  }
}

// Action creators for commonly used actions
export const actionCreators = {
  // Note actions
  addNote: (note: Parameters<typeof addNoteAtPosition>[1]): AppAction => ({
    type: 'ADD_NOTE',
    payload: { note }
  }),
  
  removeNote: (index: number): AppAction => ({
    type: 'REMOVE_NOTE',
    payload: { index }
  }),
  
  // Cursor actions
  moveCursor: (direction: 'left' | 'right' | 'up' | 'down'): AppAction => ({
    type: 'MOVE_CURSOR',
    payload: direction
  }),
  
  setCursorPosition: (position: AppState['cursor']): AppAction => ({
    type: 'SET_CURSOR_POSITION',
    payload: position
  }),
  
  // Playback actions
  togglePlayback: (): AppAction => ({ type: 'TOGGLE_PLAYBACK' }),
  setTempo: (tempo: number): AppAction => ({ type: 'SET_TEMPO', payload: tempo }),
  
  // Input actions
  updateFretInput: (input: string): AppAction => ({
    type: 'UPDATE_FRET_INPUT',
    payload: input
  }),
  
  clearFretInput: (): AppAction => ({ type: 'CLEAR_FRET_INPUT' }),
} 