// NoteStack Selection and Clipboard Operations
// Based on Strumstick Tab Viewer Architecture Specification v2.0

import type { NoteStack, Tab } from '../types/notestack';
import { getStacksInRange, addNoteToStack } from './NoteStackOperations';

// Selection types
export type NoteSelection = Array<{
  stackId: string;
  note: { string: number; fret: number };
}>;

export type StringSelection = {
  string: number;
  startPosition: number;
  endPosition: number;
};

/**
 * Select notes on specific string across multiple stacks
 */
export const selectNotesOnString = (
  tab: Tab, 
  string: number, 
  startPos: number, 
  endPos: number
): NoteSelection => {
  const stacksInRange = getStacksInRange(tab, startPos, endPos);
  const selection: NoteSelection = [];
  
  stacksInRange.forEach(stack => {
    const noteOnString = stack.notes.find(note => note.string === string);
    if (noteOnString) {
      selection.push({ stackId: stack.id, note: noteOnString });
    }
  });
  
  return selection;
};

/**
 * Select all notes in a range (all strings)
 */
export const selectNotesInRange = (
  tab: Tab,
  startPos: number,
  endPos: number
): NoteSelection => {
  const stacksInRange = getStacksInRange(tab, startPos, endPos);
  const selection: NoteSelection = [];
  
  stacksInRange.forEach(stack => {
    stack.notes.forEach(note => {
      selection.push({ stackId: stack.id, note });
    });
  });
  
  return selection;
};

/**
 * Select notes in a specific stack
 */
export const selectNotesInStack = (
  tab: Tab,
  stackId: string
): NoteSelection => {
  const stack = tab.find(s => s.id === stackId);
  if (!stack) return [];
  
  return stack.notes.map(note => ({
    stackId: stack.id,
    note
  }));
};

/**
 * Cut notes from selection
 * Returns updated tab and clipboard data
 */
export const cutNotesFromString = (
  tab: Tab, 
  selection: NoteSelection
): { newTab: Tab; clipboard: NoteSelection } => {
  const newTab = tab.map(stack => {
    const selectedNote = selection.find(sel => sel.stackId === stack.id);
    if (selectedNote) {
      const updatedNotes = stack.notes.filter(note => 
        note.string !== selectedNote.note.string
      );
      return updatedNotes.length > 0 ? { ...stack, notes: updatedNotes } : null;
    }
    return stack;
  }).filter(Boolean) as Tab;
  
  return { newTab, clipboard: selection };
};

/**
 * Copy notes from selection
 * Returns clipboard data without modifying the tab
 */
export const copyNotesFromSelection = (
  tab: Tab,
  selection: NoteSelection
): NoteSelection => {
  // Validate that all selected notes still exist
  const validSelection = selection.filter(item => {
    const stack = tab.find(s => s.id === item.stackId);
    return stack && stack.notes.some(note => 
      note.string === item.note.string && note.fret === item.note.fret
    );
  });
  
  return validSelection;
};

/**
 * Paste notes to new string/position
 */
export const pasteNotesToString = (
  tab: Tab,
  clipboard: NoteSelection,
  startPosition: number,
  targetString: number
): Tab => {
  if (clipboard.length === 0) return tab;
  
  // Calculate relative positions from clipboard
  const originalPositions = clipboard.map(item => {
    const originalStack = tab.find(stack => stack.id === item.stackId);
    return originalStack?.musicalPosition || 0;
  });
  
  const basePosition = Math.min(...originalPositions);
  
  // Create or update stacks for pasted notes
  let updatedTab = [...tab];
  
  clipboard.forEach(item => {
    const originalStack = tab.find(stack => stack.id === item.stackId);
    if (!originalStack) return;
    
    const relativeOffset = originalStack.musicalPosition - basePosition;
    const newPosition = startPosition + relativeOffset;
    
    updatedTab = addNoteToStack(
      updatedTab,
      newPosition,
      targetString,
      item.note.fret,
      originalStack.duration
    );
  });
  
  return updatedTab;
};

/**
 * Paste notes preserving their original string positions
 */
export const pasteNotesPreservingStrings = (
  tab: Tab,
  clipboard: NoteSelection,
  startPosition: number
): Tab => {
  if (clipboard.length === 0) return tab;
  
  // Calculate relative positions from clipboard
  const originalPositions = clipboard.map(item => {
    const originalStack = tab.find(stack => stack.id === item.stackId);
    return originalStack?.musicalPosition || 0;
  });
  
  const basePosition = Math.min(...originalPositions);
  
  // Create or update stacks for pasted notes
  let updatedTab = [...tab];
  
  clipboard.forEach(item => {
    const originalStack = tab.find(stack => stack.id === item.stackId);
    if (!originalStack) return;
    
    const relativeOffset = originalStack.musicalPosition - basePosition;
    const newPosition = startPosition + relativeOffset;
    
    updatedTab = addNoteToStack(
      updatedTab,
      newPosition,
      item.note.string, // Keep original string
      item.note.fret,
      originalStack.duration
    );
  });
  
  return updatedTab;
};

/**
 * Delete notes from selection
 */
export const deleteNotesFromSelection = (
  tab: Tab,
  selection: NoteSelection
): Tab => {
  return tab.map(stack => {
    const selectedNotes = selection.filter(sel => sel.stackId === stack.id);
    if (selectedNotes.length === 0) return stack;
    
    const updatedNotes = stack.notes.filter(note => 
      !selectedNotes.some(sel => 
        sel.note.string === note.string && sel.note.fret === note.fret
      )
    );
    
    return updatedNotes.length > 0 ? { ...stack, notes: updatedNotes } : null;
  }).filter(Boolean) as Tab;
};

/**
 * Get selected stacks (stacks that have selected notes)
 */
export const getSelectedStacks = (
  tab: Tab,
  selection: NoteSelection
): NoteStack[] => {
  const selectedStackIds = [...new Set(selection.map(sel => sel.stackId))];
  return tab.filter(stack => selectedStackIds.includes(stack.id));
};

/**
 * Get the time range covered by a selection
 */
export const getSelectionTimeRange = (
  tab: Tab,
  selection: NoteSelection
): { startPos: number; endPos: number } | null => {
  if (selection.length === 0) return null;
  
  const positions = selection.map(item => {
    const stack = tab.find(s => s.id === item.stackId);
    return stack?.musicalPosition || 0;
  });
  
  return {
    startPos: Math.min(...positions),
    endPos: Math.max(...positions)
  };
};

/**
 * Expand selection to include entire stacks
 */
export const expandSelectionToStacks = (
  tab: Tab,
  selection: NoteSelection
): NoteSelection => {
  const selectedStackIds = [...new Set(selection.map(sel => sel.stackId))];
  const expandedSelection: NoteSelection = [];
  
  selectedStackIds.forEach(stackId => {
    const stack = tab.find(s => s.id === stackId);
    if (stack) {
      stack.notes.forEach(note => {
        expandedSelection.push({ stackId, note });
      });
    }
  });
  
  return expandedSelection;
}; 