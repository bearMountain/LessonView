// NoteStack Architecture Types
// Based on Strumstick Tab Viewer Architecture Specification v2.0

export type Duration = 'whole' | 'half' | 'quarter' | 'eighth' | 'sixteenth';

export type NoteStack = {
  id: string;                    // Unique identifier
  musicalPosition: number;       // Position in ticks (960 per quarter note)
  duration: Duration;            // Note duration for the entire stack
  notes: Array<{                 // Vertical stack of notes
    string: number;              // 0, 1, 2 for 3-string strumstick (Low D, A, Hi D)
    fret: number;                // 0-24 fret number
  }>;
  
  // Repeat markers (structural annotations)
  repeatStart?: boolean;         // Repeat section starts here
  repeatEnd?: {                  // Repeat section ends here
    jumpToStackId: string;       // ID of stack to jump back to
    timesToRepeat?: number;      // Default 1 (play twice total)
  };
};

// Main data structure
export type Tab = NoteStack[];          // Left-to-right sequence of vertical note stacks

// Application state
export type AppState = {
  tab: Tab;                      // Musical content
  timeSignature: { numerator: number; denominator: number };
  bpm: number;
  currentPosition: number;       // Cursor position in ticks
  selectedStacks: string[];     // Selected stack IDs
  clipboardStacks: Array<{      // Cut/copy clipboard
    stackId: string;
    note: { string: number; fret: number };
  }>;
};

// Layout types (for rendering)
export type LayoutItem = NoteStack & {
  displayX: number;              // Calculated screen position
};

export type MeasureLine = {
  id: string;
  type: 'measureLine';
  musicalPosition: number;       // Where it falls musically
  displayX: number;              // Where it appears visually
};

// Constants
export const TICKS_PER_QUARTER = 960;       // High resolution timing
export const TICKS_PER_MEASURE_4_4 = 3840;  // 4/4 time signature
export const STRING_TUNINGS = ['D3', 'A3', 'D4']; // Low D, A, Hi D
export const STRING_COUNT = 3;
export const MAX_FRET = 24;

// Layout constants
export const INITIAL_INDENT = 40;           // Initial left margin
export const MEASURE_LINE_WIDTH = 2;        // Width of measure line
export const MEASURE_LINE_SPACING = 20;     // Padding before/after measure lines
export const PIXELS_PER_TICK = 0.05;        // Base spacing conversion

// Duration mapping to ticks
export const DURATION_TO_TICKS: Record<Duration, number> = {
  whole: 3840,      // 16 * 240 
  half: 1920,       // 8 * 240
  quarter: 960,     // 4 * 240  
  eighth: 480,      // 2 * 240
  sixteenth: 240    // 1 * 240
}; 