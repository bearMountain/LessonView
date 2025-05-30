// Note duration types
export type NoteDuration = 'whole' | 'half' | 'quarter' | 'eighth' | 'sixteenth';

// Note types - can be a note with fret or a rest
export type NoteType = 'note' | 'rest';

// Individual note/rest with duration
export interface Note {
  type: NoteType;
  fret: number | null; // null for rests, number for notes
  duration: NoteDuration;
  stringIndex: number; // which string this note is on (0=Low D, 1=A, 2=Hi D)
}

// Time position represents a specific time point that can have multiple notes on different strings
export interface TimePosition {
  notes: Note[]; // Array of notes at this time position (one per string max)
  duration: NoteDuration; // The duration that determines spacing (longest note at this position)
}

// Cursor position for navigation
export interface CursorPosition {
  timeIndex: number; // which time position in the sequence
  stringIndex: number; // which string (0=Low D, 1=A, 2=Hi D)
}

// Tab data is now a sequence of time positions
export type TabData = TimePosition[];

// Duration values in terms of quarter note beats
export const DURATION_VALUES: Record<NoteDuration, number> = {
  whole: 4,
  half: 2,
  quarter: 1,
  eighth: 0.5,
  sixteenth: 0.25,
};

// Visual properties for different note durations
export const DURATION_VISUALS: Record<NoteDuration, {
  stemHeight: number;
  hasFlag: boolean;
  flagCount: number;
  isOpen: boolean; // for whole and half notes
}> = {
  whole: { stemHeight: 0, hasFlag: false, flagCount: 0, isOpen: true },
  half: { stemHeight: 35, hasFlag: false, flagCount: 0, isOpen: true },
  quarter: { stemHeight: 35, hasFlag: false, flagCount: 0, isOpen: false },
  eighth: { stemHeight: 35, hasFlag: true, flagCount: 1, isOpen: false },
  sixteenth: { stemHeight: 35, hasFlag: true, flagCount: 2, isOpen: false },
};

// Calculate cumulative beat position for a time index
export const calculateTimePosition = (timePositions: TimePosition[], timeIndex: number): number => {
  let position = 0;
  for (let i = 0; i < timeIndex; i++) {
    position += DURATION_VALUES[timePositions[i].duration];
  }
  return position;
};

// Calculate total beats in the tab
export const getTotalBeats = (timePositions: TimePosition[]): number => {
  return timePositions.reduce((total, timePos) => total + DURATION_VALUES[timePos.duration], 0);
};

// Get measure boundaries (every 4 beats)
export const getMeasureBoundaries = (timePositions: TimePosition[]): number[] => {
  const boundaries: number[] = [];
  let currentMeasure = 4; // First measure boundary at 4 beats
  
  for (let i = 0; i < timePositions.length; i++) {
    const timePosition = calculateTimePosition(timePositions, i);
    
    // If we've crossed into a new measure, record the boundary
    while (timePosition >= currentMeasure) {
      boundaries.push(currentMeasure);
      currentMeasure += 4;
    }
  }
  
  return boundaries;
};

// Helper function to get the longest duration at a time position
export const getLongestDuration = (notes: Note[]): NoteDuration => {
  if (notes.length === 0) return 'quarter';
  
  const durations = notes.map(note => DURATION_VALUES[note.duration]);
  const maxDuration = Math.max(...durations);
  
  // Find the corresponding duration type
  for (const [durationType, value] of Object.entries(DURATION_VALUES)) {
    if (value === maxDuration) {
      return durationType as NoteDuration;
    }
  }
  
  return 'quarter'; // fallback
}; 