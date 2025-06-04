// Architecture Bridge
// Conversion functions between old TabData structure and new NoteStack architecture
// This enables gradual migration from the existing system to the new NoteStack system

import type { TabData, Note, NoteDuration } from '../types';
import type { Tab, NoteStack, Duration } from '../types/notestack';
import { DURATION_TO_TICKS, TICKS_PER_QUARTER } from '../types/notestack';

// Mapping between old and new duration types
const OLD_TO_NEW_DURATION: Record<NoteDuration, Duration> = {
  'whole': 'whole',
  'half': 'half', 
  'quarter': 'quarter',
  'eighth': 'eighth',
  'sixteenth': 'sixteenth'
};

const NEW_TO_OLD_DURATION: Record<Duration, NoteDuration> = {
  'whole': 'whole',
  'half': 'half',
  'quarter': 'quarter', 
  'eighth': 'eighth',
  'sixteenth': 'sixteenth'
};

/**
 * Convert old TabData structure to new NoteStack Tab
 */
export const convertTabDataToNoteStack = (tabData: TabData): Tab => {
  const noteStacks: Map<number, NoteStack> = new Map();
  
  // Process each time slot
  tabData.forEach((gridCell, timeSlot) => {
    // Process each note that starts in this slot
    gridCell.notes.forEach(note => {
      if (note.startSlot !== timeSlot) return; // Only process notes that start here
      
      // Convert slot position to musical position (ticks)
      const musicalPosition = timeSlot * (TICKS_PER_QUARTER / 4); // Each slot is a sixteenth note (1/4 of quarter)
      
      // Get or create stack at this position
      let stack = noteStacks.get(musicalPosition);
      
      if (!stack) {
        // Create new stack
        stack = {
          id: `stack-${musicalPosition}-${Date.now()}`,
          musicalPosition,
          duration: OLD_TO_NEW_DURATION[note.duration],
          notes: []
        };
        noteStacks.set(musicalPosition, stack);
      }
      
      // Add note to stack (if it's not a rest)
      if (note.type === 'note' && note.fret !== null) {
        stack.notes.push({
          string: note.stringIndex,
          fret: note.fret
        });
        
        // Update stack duration to the longest note duration
        const newDuration = OLD_TO_NEW_DURATION[note.duration];
        if (DURATION_TO_TICKS[newDuration] > DURATION_TO_TICKS[stack.duration]) {
          stack.duration = newDuration;
        }
      }
    });
  });
  
  // Convert map to sorted array
  return Array.from(noteStacks.values()).sort((a, b) => a.musicalPosition - b.musicalPosition);
};

/**
 * Convert new NoteStack Tab to old TabData structure
 */
export const convertNoteStackToTabData = (tab: Tab): TabData => {
  const tabData: TabData = [];
  
  // Find the maximum time slot needed
  let maxTimeSlot = 0;
  tab.forEach(stack => {
    const timeSlot = Math.floor(stack.musicalPosition / (TICKS_PER_QUARTER / 4));
    const duration = DURATION_TO_TICKS[stack.duration];
    const endSlot = timeSlot + Math.floor(duration / (TICKS_PER_QUARTER / 4));
    maxTimeSlot = Math.max(maxTimeSlot, endSlot);
  });
  
  // Initialize empty grid
  for (let i = 0; i <= maxTimeSlot; i++) {
    tabData[i] = { notes: [] };
  }
  
  // Convert each stack to old format
  tab.forEach(stack => {
    const timeSlot = Math.floor(stack.musicalPosition / (TICKS_PER_QUARTER / 4));
    
    // Convert each note in the stack
    stack.notes.forEach(note => {
      const oldNote: Note = {
        type: 'note',
        fret: note.fret,
        duration: NEW_TO_OLD_DURATION[stack.duration],
        stringIndex: note.string,
        startSlot: timeSlot,
        isDotted: false
      };
      
      // Add to the appropriate time slot
      if (tabData[timeSlot]) {
        tabData[timeSlot].notes.push(oldNote);
      }
    });
  });
  
  return tabData;
};

/**
 * Convert a single old Note to NoteStack format (for adding individual notes)
 */
export const convertNoteToNoteStack = (note: Note): { musicalPosition: number; string: number; fret: number; duration: Duration } => {
  const musicalPosition = note.startSlot * (TICKS_PER_QUARTER / 4);
  
  return {
    musicalPosition,
    string: note.stringIndex,
    fret: note.fret || 0,
    duration: OLD_TO_NEW_DURATION[note.duration]
  };
};

/**
 * Convert NoteStack back to old Note format (for backward compatibility)
 */
export const convertNoteStackToNote = (
  stack: NoteStack, 
  noteInStack: { string: number; fret: number }
): Note => {
  const timeSlot = Math.floor(stack.musicalPosition / (TICKS_PER_QUARTER / 4));
  
  return {
    type: 'note',
    fret: noteInStack.fret,
    duration: NEW_TO_OLD_DURATION[stack.duration],
    stringIndex: noteInStack.string,
    startSlot: timeSlot,
    isDotted: false
  };
};

/**
 * Get time slot from musical position (for cursor positioning)
 */
export const musicalPositionToTimeSlot = (musicalPosition: number): number => {
  return Math.floor(musicalPosition / (TICKS_PER_QUARTER / 4));
};

/**
 * Get musical position from time slot
 */
export const timeSlotToMusicalPosition = (timeSlot: number): number => {
  return timeSlot * (TICKS_PER_QUARTER / 4);
};

/**
 * Convert musical position to display-friendly format
 */
export const formatMusicalPosition = (position: number): string => {
  const measures = Math.floor(position / (TICKS_PER_QUARTER * 4));
  const beats = Math.floor((position % (TICKS_PER_QUARTER * 4)) / TICKS_PER_QUARTER);
  const ticks = position % TICKS_PER_QUARTER;
  
  return `${measures + 1}:${beats + 1}:${ticks}`;
};

/**
 * Create sample data in NoteStack format for testing
 */
export const createSampleNoteStackTab = (): Tab => {
  return [
    // Single notes
    {
      id: "sample-stack-1",
      musicalPosition: 0,
      duration: 'quarter',
      notes: [{ string: 0, fret: 0 }]  // Open Low D
    },
    {
      id: "sample-stack-2", 
      musicalPosition: TICKS_PER_QUARTER,
      duration: 'quarter',
      notes: [{ string: 1, fret: 2 }]  // B on A string
    },
    
    // Chord (multiple notes stacked vertically)
    {
      id: "sample-stack-3",
      musicalPosition: TICKS_PER_QUARTER * 2,
      duration: 'half',
      notes: [
        { string: 0, fret: 0 },        // Low D
        { string: 1, fret: 2 },        // B
        { string: 2, fret: 2 }         // E
      ]
    },
    
    // Partial chord (some strings silent)
    {
      id: "sample-stack-4",
      musicalPosition: TICKS_PER_QUARTER * 4,
      duration: 'quarter', 
      notes: [
        { string: 0, fret: 3 },        // F
        { string: 2, fret: 5 }         // G
      ]
    }
  ];
};

/**
 * Validate converted data
 */
export const validateConversion = (originalTabData: TabData, convertedTab: Tab): { 
  isValid: boolean; 
  errors: string[] 
} => {
  const errors: string[] = [];
  
  // Convert back to TabData for comparison
  const reconvertedTabData = convertNoteStackToTabData(convertedTab);
  
  // Count notes in original vs reconverted
  const originalNoteCount = originalTabData.reduce((count, cell) => count + cell.notes.length, 0);
  const reconvertedNoteCount = reconvertedTabData.reduce((count, cell) => count + cell.notes.length, 0);
  
  if (originalNoteCount !== reconvertedNoteCount) {
    errors.push(`Note count mismatch: original ${originalNoteCount}, reconverted ${reconvertedNoteCount}`);
  }
  
  // Check for duration preservation
  for (let i = 0; i < Math.min(originalTabData.length, reconvertedTabData.length); i++) {
    const originalCell = originalTabData[i];
    const reconvertedCell = reconvertedTabData[i];
    
    if (originalCell.notes.length !== reconvertedCell.notes.length) {
      errors.push(`Slot ${i}: note count mismatch`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}; 