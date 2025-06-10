// NoteStack Core Operations
// Based on Strumstick Tab Viewer Architecture Specification v2.0

import type { NoteStack, Tab, Duration } from '../types/notestack';
import { TICKS_PER_QUARTER, DURATION_TO_TICKS } from '../types/notestack';

// Utility function to generate unique IDs
const generateUniqueId = (): string => {
  return `stack-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// === Core Operations ===

/**
 * Add a note to a stack at a specific position
 * If no stack exists at the position, creates a new one
 * If a stack exists, adds/replaces the note on the specified string
 */
export const addNoteToStack = (
  tab: Tab, 
  position: number, 
  string: number, 
  fret: number, 
  duration: Duration
): Tab => {
  const existingStack = tab.find(stack => stack.musicalPosition === position);
  
  if (existingStack) {
    // Add note to existing stack (replace if string already has note)
    const updatedNotes = existingStack.notes.filter(note => note.string !== string);
    updatedNotes.push({ string, fret });
    
    return tab.map(stack => 
      stack.id === existingStack.id 
        ? { ...stack, notes: updatedNotes, duration }
        : stack
    );
  } else {
    // Create new stack
    const newStack: NoteStack = {
      id: generateUniqueId(),
      musicalPosition: position,
      duration,
      notes: [{ string, fret }]
    };
    
    return [...tab, newStack].sort((a, b) => a.musicalPosition - b.musicalPosition);
  }
};

/**
 * Remove a note from a specific string at a position
 * If the stack becomes empty, removes the entire stack
 */
export const removeNoteFromString = (tab: Tab, position: number, string: number): Tab => {
  return tab.map(stack => {
    if (stack.musicalPosition === position) {
      const updatedNotes = stack.notes.filter(note => note.string !== string);
      return updatedNotes.length > 0 ? { ...stack, notes: updatedNotes } : null;
    }
    return stack;
  }).filter(Boolean) as Tab;
};

/**
 * Find stack at specific position
 */
export const findStackAtPosition = (tab: Tab, position: number): NoteStack | undefined => {
  return tab.find(stack => stack.musicalPosition === position);
};

/**
 * Get note on specific string at position
 */
export const getNoteAt = (tab: Tab, position: number, string: number): { fret: number } | null => {
  const stack = findStackAtPosition(tab, position);
  if (!stack) return null;
  
  const note = stack.notes.find(note => note.string === string);
  return note ? { fret: note.fret } : null;
};

/**
 * Check if position has any notes
 */
export const hasNotesAtPosition = (tab: Tab, position: number): boolean => {
  const stack = findStackAtPosition(tab, position);
  return stack ? stack.notes.length > 0 : false;
};

/**
 * Get all stacks in a time range
 */
export const getStacksInRange = (tab: Tab, startPos: number, endPos: number): NoteStack[] => {
  return tab.filter(stack => 
    stack.musicalPosition >= startPos && stack.musicalPosition < endPos
  );
};

/**
 * Update stack duration
 */
export const updateStackDuration = (tab: Tab, stackId: string, duration: Duration): Tab => {
  return tab.map(stack => 
    stack.id === stackId ? { ...stack, duration } : stack
  );
};

/**
 * Move stack to new position
 */
export const moveStack = (tab: Tab, stackId: string, newPosition: number): Tab => {
  return tab.map(stack => 
    stack.id === stackId ? { ...stack, musicalPosition: newPosition } : stack
  ).sort((a, b) => a.musicalPosition - b.musicalPosition);
};

/**
 * Remove an entire stack
 */
export const removeStack = (tab: Tab, stackId: string): Tab => {
  return tab.filter(stack => stack.id !== stackId);
};

/**
 * Get the next available position for Tab key navigation
 * If cursor is on existing note stack, jump forward by that stack's duration
 * If cursor is not on a note stack, don't move (return current position)
 */
export const getNextAvailablePosition = (tab: Tab, fromPosition: number = 0): number => {
  // Check if there's a stack at the current cursor position
  const stackAtPosition = findStackAtPosition(tab, fromPosition);
  
  if (stackAtPosition) {
    // Cursor is on an existing note stack - jump forward by its duration
    const stackDurationTicks = DURATION_TO_TICKS[stackAtPosition.duration];
    return fromPosition + stackDurationTicks;
  } else {
    // Cursor is not on a note stack - don't move
    return fromPosition;
  }
};

/**
 * Get the previous note stack position for Shift+Tab navigation
 * Finds the closest note stack before the current position
 * If no previous stack exists, returns current position (don't move)
 */
export const getPreviousStackPosition = (tab: Tab, fromPosition: number): number => {
  // Find all stacks before the current position
  const stacksBeforePosition = tab
    .filter(stack => stack.musicalPosition < fromPosition)
    .sort((a, b) => b.musicalPosition - a.musicalPosition); // Sort descending (closest first)
  
  if (stacksBeforePosition.length === 0) {
    // No previous stacks - don't move
    return fromPosition;
  }
  
  // Return the position of the closest previous stack
  return stacksBeforePosition[0].musicalPosition;
};

/**
 * Validate that the tab data is consistent
 */
export const validateTab = (tab: Tab): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // Check for duplicate positions
  const positions = tab.map(stack => stack.musicalPosition);
  const uniquePositions = new Set(positions);
  if (positions.length !== uniquePositions.size) {
    errors.push('Duplicate musical positions found');
  }
  
  // Check for valid string indices
  for (const stack of tab) {
    for (const note of stack.notes) {
      if (note.string < 0 || note.string > 2) {
        errors.push(`Invalid string index: ${note.string} in stack ${stack.id}`);
      }
      if (note.fret < 0 || note.fret > 12) {
        errors.push(`Invalid fret number: ${note.fret} in stack ${stack.id}`);
      }
    }
  }
  
  // Check for duplicate strings within a stack
  for (const stack of tab) {
    const strings = stack.notes.map(note => note.string);
    const uniqueStrings = new Set(strings);
    if (strings.length !== uniqueStrings.size) {
      errors.push(`Duplicate strings in stack ${stack.id}`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Get the total duration of the tab in ticks
 */
export const getTotalDuration = (tab: Tab): number => {
  if (tab.length === 0) return 0;
  
  const lastStack = tab[tab.length - 1];
  return lastStack.musicalPosition + TICKS_PER_QUARTER; // Add one quarter note after the last stack
};

/**
 * Clone a tab (deep copy)
 */
export const cloneTab = (tab: Tab): Tab => {
  return tab.map(stack => ({
    ...stack,
    notes: [...stack.notes.map(note => ({ ...note }))]
  }));
}; 