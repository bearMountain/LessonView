// Initial State - Default values for the NoteStack app state
import type { Tab, Duration } from '../types/notestack'
import type { NoteSelection } from '../services/NoteStackSelection'

// NoteStack-based app state interface
export interface NoteStackAppState {
  // === Musical Data (Core - NoteStack Architecture) ===
  tab: Tab; // Array of NoteStack objects
  timeSignature: { numerator: number; denominator: number };
  bpm: number;
  currentPosition: number; // Position in ticks (960 per quarter note)
  selectedStacks: string[]; // Selected stack IDs
  clipboardStacks: Array<{
    stackId: string;
    note: { string: number; fret: number };
  }>;
  
  // === UI State ===
  zoom: number;
  showFretboard: boolean;
  isPlaying: boolean;
  currentFretInput: string;
  
  // === Tool & Input State ===
  selectedDuration: Duration;
  selectedNoteType: 'note' | 'rest';
  currentToolMode: 'note' | 'measureLine' | 'select';
  
  // === Selection State (NoteStack-based) ===
  selection: NoteSelection; // String-based selection for NoteStack
  
  // === Visual & Layout State ===
  customMeasureLines: Array<{ position: number; measureNumber: number }>;
  
  // === Video Sync State ===
  videoSource: string;
  splitRatio: number; // 0-1, percentage for video vs tab viewer
  videoCurrentTime: number;
  videoPlaybackRate: number;
  
  // === Audio State ===
  isVideoMuted: boolean;
  isSynthMuted: boolean;
  
  // === File Management State ===
  isModified: boolean;
  currentProjectMetadata: {
    title?: string;
    artist?: string;
    album?: string;
    description?: string;
  };
  saveDialogOpen: boolean;
  loadDialogOpen: boolean;
  newProjectDialogOpen: boolean;
  
  // === Playback State ===
  isLooping: boolean;
  countIn: boolean;
  pausedAtPosition: number; // Position in ticks, -1 if not paused
}

// Default state using NoteStack architecture
export const initialState: NoteStackAppState = {
  // === Musical Data (NoteStack Architecture) ===
  tab: [], // Empty NoteStack array to start
  timeSignature: { numerator: 4, denominator: 4 }, // 4/4 time signature
  bpm: 120, // Default BPM
  currentPosition: 0, // Start at beginning (0 ticks)
  selectedStacks: [], // No stacks selected initially
  clipboardStacks: [], // Empty clipboard
  
  // === UI State ===
  zoom: 1.0, // Default zoom level
  showFretboard: true, // Fretboard visible by default
  isPlaying: false, // Not playing initially
  currentFretInput: '', // No fret input initially
  
  // === Tool & Input State ===
  selectedDuration: 'quarter', // Default note duration
  selectedNoteType: 'note', // Default to notes (not rests)
  currentToolMode: 'note', // Default to note tool
  
  // === Selection State (NoteStack-based) ===
  selection: [], // Empty string-based selection
  
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
  
  // === Playback State ===
  isLooping: false, // Loop disabled by default
  countIn: false, // Count-in disabled by default
  pausedAtPosition: -1, // No pause position initially
};

// Helper function to reset state to initial values
export const resetToInitialState = (): NoteStackAppState => ({
  ...initialState,
  // Preserve some user preferences that shouldn't reset
  zoom: initialState.zoom,
  showFretboard: initialState.showFretboard,
  splitRatio: initialState.splitRatio,
  isVideoMuted: initialState.isVideoMuted,
  isSynthMuted: initialState.isSynthMuted,
})

// Helper function to create a new project state (keeps user preferences)
export const createNewProjectState = (preservePreferences: Partial<NoteStackAppState> = {}): NoteStackAppState => ({
  ...initialState,
  // Preserve specified user preferences
  ...preservePreferences,
  // Always reset these to defaults for new projects
  tab: [],
  currentPosition: 0,
  selectedStacks: [],
  clipboardStacks: [],
  selection: [],
  currentFretInput: '',
  customMeasureLines: [],
  isModified: false,
  currentProjectMetadata: {},
  pausedAtPosition: -1,
})

// Helper function to create sample NoteStack data for testing
export const createSampleNoteStackState = (): NoteStackAppState => ({
  ...initialState,
  tab: [
    {
      id: 'stack-1',
      musicalPosition: 0,
      duration: 'quarter',
      notes: [{ string: 0, fret: 0 }] // Open low D
    },
    {
      id: 'stack-2',
      musicalPosition: 960, // 1 quarter note later
      duration: 'quarter',
      notes: [{ string: 1, fret: 2 }] // 2nd fret on A string
    },
    {
      id: 'stack-3',
      musicalPosition: 1920, // 2 quarter notes later
      duration: 'half',
      notes: [
        { string: 0, fret: 0 }, // Chord: open low D
        { string: 1, fret: 2 }, // + 2nd fret A
        { string: 2, fret: 2 }  // + 2nd fret high D
      ]
    }
  ],
  bpm: 120,
  isModified: true, // Mark as modified since it has sample data
  currentProjectMetadata: {
    title: 'Sample Song',
    artist: 'Demo Artist',
    description: 'Sample NoteStack data for testing'
  }
}) 