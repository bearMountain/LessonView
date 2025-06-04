// Initial State - Default values for the unified app state
import type { AppState } from './types'

// Default state that matches current app behavior
export const initialState: AppState = {
  // === Musical Data (Core) ===
  notes: [], // Empty tablature to start
  tempo: 120, // Default BPM
  timeSignature: [4, 4], // 4/4 time signature
  
  // === UI State ===
  cursor: { 
    timeSlot: 0, 
    stringIndex: 2 // Start on Hi D string (top string visually)
  },
  selection: [], // No notes selected initially
  zoom: 1.0, // Default zoom level
  currentFretInput: '', // No fret input initially
  showFretboard: true, // Fretboard visible by default
  
  // === Playback State ===
  isPlaying: false,
  playbackPosition: 0, // Start at beginning
  countIn: false, // Count-in disabled by default
  isLooping: false, // Loop disabled by default
  pausedAtTimeSlot: -1, // No pause position initially
  
  // === Tool & Input State ===
  selectedDuration: 'quarter', // Default note duration
  selectedNoteType: 'note', // Default to notes (not rests)
  currentToolMode: 'note', // Default to note tool
  firstSelectedNote: null, // No selection anchor initially
  
  // === Visual & Layout State ===
  customMeasureLines: [], // No custom measure lines initially
  
  // === Video Sync State ===
  videoSource: '/videos/test-vid-1.mp4', // Default video
  splitRatio: 0.4, // 40% video, 60% tab viewer
  videoCurrentTime: 0,
  videoPlaybackRate: 1,
  
  // === Audio State ===
  isVideoMuted: false,
  isSynthMuted: false,
  
  // === File Management State ===
  isModified: false, // Clean state initially
  currentProjectMetadata: {}, // No metadata initially
  saveDialogOpen: false,
  loadDialogOpen: false,
  newProjectDialogOpen: false,
}

// Helper function to reset state to initial values
export const resetToInitialState = (): AppState => ({
  ...initialState,
  // Preserve some user preferences that shouldn't reset
  zoom: initialState.zoom,
  showFretboard: initialState.showFretboard,
  splitRatio: initialState.splitRatio,
  isVideoMuted: initialState.isVideoMuted,
  isSynthMuted: initialState.isSynthMuted,
})

// Helper function to create a new project state (keeps user preferences)
export const createNewProjectState = (preservePreferences: Partial<AppState> = {}): AppState => ({
  ...initialState,
  // Preserve specified user preferences
  ...preservePreferences,
  // Always reset these to defaults for new projects
  notes: [],
  cursor: { timeSlot: 0, stringIndex: 2 },
  selection: [],
  currentFretInput: '',
  customMeasureLines: [],
  isModified: false,
  currentProjectMetadata: {},
}) 