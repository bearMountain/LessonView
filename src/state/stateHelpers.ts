// Pure State Helper Functions
// These functions contain the core business logic for state transformations
// All functions are pure - no side effects, predictable outputs for given inputs

import type { Note, NoteDuration, CursorPosition } from '../types'
import { DURATION_SLOTS, findNextAvailableSlot } from '../types'
import type { AppState } from './types'

// === Note Management Helpers ===

/**
 * Add a note at the specified position in the notes array
 * Handles slot allocation and conflict resolution
 */
export const addNoteAtPosition = (notes: Note[], newNote: Note): Note[] => {
  // Find the appropriate slot for this note
  const availableSlot = findNextAvailableSlot(
    convertNotesToTabData(notes), 
    newNote.startSlot, 
    newNote.stringIndex, 
    newNote.duration
  )
  
  // Create the note with the available slot
  const noteToAdd: Note = {
    ...newNote,
    startSlot: availableSlot
  }
  
  // Add to notes array and sort by start slot for consistency
  const updatedNotes = [...notes, noteToAdd]
  return updatedNotes.sort((a, b) => a.startSlot - b.startSlot)
}

/**
 * Remove a note at the specified index
 */
export const removeNoteAtIndex = (notes: Note[], index: number): Note[] => {
  if (index < 0 || index >= notes.length) return notes
  return notes.filter((_, i) => i !== index)
}

/**
 * Update a note at the specified index with partial note data
 */
export const updateNoteAtIndex = (notes: Note[], index: number, updates: Partial<Note>): Note[] => {
  if (index < 0 || index >= notes.length) return notes
  
  const updatedNotes = [...notes]
  updatedNotes[index] = { ...updatedNotes[index], ...updates }
  
  // Re-sort if startSlot was changed
  if (updates.startSlot !== undefined) {
    return updatedNotes.sort((a, b) => a.startSlot - b.startSlot)
  }
  
  return updatedNotes
}

/**
 * Toggle the dotted state of a note
 */
export const toggleNoteDotted = (notes: Note[], index: number): Note[] => {
  if (index < 0 || index >= notes.length) return notes
  
  const updatedNotes = [...notes]
  const note = updatedNotes[index]
  updatedNotes[index] = { 
    ...note, 
    isDotted: !note.isDotted 
  }
  
  return updatedNotes
}

/**
 * Change the duration of a note at the specified index
 */
export const changeNoteDuration = (notes: Note[], index: number, newDuration: NoteDuration): Note[] => {
  if (index < 0 || index >= notes.length) return notes
  
  const updatedNotes = [...notes]
  updatedNotes[index] = { 
    ...updatedNotes[index], 
    duration: newDuration 
  }
  
  return updatedNotes
}

/**
 * Find a note at the specified position (timeSlot and stringIndex)
 */
export const findNoteAtPosition = (notes: Note[], timeSlot: number, stringIndex: number): Note | null => {
  return notes.find(note => 
    note.startSlot === timeSlot && note.stringIndex === stringIndex
  ) || null
}

// === Cursor Management Helpers ===

/**
 * Calculate new cursor position based on movement direction
 * Handles boundary checking and note-aware navigation
 */
export const calculateNewCursorPosition = (
  currentCursor: CursorPosition, 
  movement: 'left' | 'right' | 'up' | 'down' | { type: 'absolute'; position: CursorPosition },
  notes: Note[]
): CursorPosition => {
  
  if (typeof movement === 'object' && movement.type === 'absolute') {
    return movement.position
  }
  
  const { timeSlot, stringIndex } = currentCursor
  
  switch (movement) {
    case 'left':
      return { 
        ...currentCursor, 
        timeSlot: Math.max(0, timeSlot - 1) 
      }
    
    case 'right':
      return { 
        ...currentCursor, 
        timeSlot: timeSlot + 1 
      }
    
    case 'up':
      return { 
        ...currentCursor, 
        stringIndex: Math.max(0, stringIndex - 1) 
      }
    
    case 'down':
      return { 
        ...currentCursor, 
        stringIndex: Math.min(2, stringIndex + 1) // Max 3 strings (0, 1, 2)
      }
    
    default:
      return currentCursor
  }
}

// === Selection Management Helpers ===

/**
 * Toggle a note index in the selection array
 * Handles shift-selection for range selection
 */
export const toggleNoteInSelection = (
  currentSelection: number[], 
  noteIndex: number, 
  shiftHeld: boolean = false
): number[] => {
  
  if (!shiftHeld) {
    // Simple toggle
    if (currentSelection.includes(noteIndex)) {
      return currentSelection.filter(i => i !== noteIndex)
    } else {
      return [...currentSelection, noteIndex]
    }
  } else {
    // Range selection with shift
    if (currentSelection.length === 0) {
      return [noteIndex]
    }
    
    const lastSelected = currentSelection[currentSelection.length - 1]
    const start = Math.min(lastSelected, noteIndex)
    const end = Math.max(lastSelected, noteIndex)
    
    // Create range from start to end (inclusive)
    const range = Array.from({ length: end - start + 1 }, (_, i) => start + i)
    
    // Merge with existing selection (remove duplicates)
    const merged = [...new Set([...currentSelection, ...range])]
    return merged.sort((a, b) => a - b)
  }
}

// === Conversion Helpers ===

/**
 * Convert flat notes array back to TabData grid format for compatibility
 * Used when interfacing with existing functions that expect TabData
 */
export const convertNotesToTabData = (notes: Note[]): import('../types').TabData => {
  const tabData: import('../types').TabData = []
  
  // Find the maximum slot needed
  const maxSlot = notes.reduce((max, note) => {
    const noteEnd = note.startSlot + DURATION_SLOTS[note.duration]
    return Math.max(max, noteEnd)
  }, 0)
  
  // Initialize grid
  for (let i = 0; i <= maxSlot; i++) {
    tabData[i] = { notes: [] }
  }
  
  // Place notes in grid
  notes.forEach(note => {
    if (tabData[note.startSlot]) {
      tabData[note.startSlot].notes.push(note)
    }
  })
  
  return tabData
}

/**
 * Convert TabData grid format to flat notes array
 * Used when migrating from old format to new flat array
 */
export const convertTabDataToNotes = (tabData: import('../types').TabData): Note[] => {
  const notes: Note[] = []
  
  tabData.forEach((cell, timeSlot) => {
    cell.notes.forEach(note => {
      // Ensure the note has the correct startSlot from its position
      notes.push({
        ...note,
        startSlot: timeSlot
      })
    })
  })
  
  // Sort by start slot for consistency
  return notes.sort((a, b) => a.startSlot - b.startSlot)
}

// === Validation Helpers ===

/**
 * Validate that a note doesn't conflict with existing notes
 */
export const isNotePositionValid = (
  notes: Note[], 
  newNote: Note, 
  excludeNoteIndex?: number
): boolean => {
  const notesToCheck = excludeNoteIndex !== undefined 
    ? notes.filter((_, i) => i !== excludeNoteIndex)
    : notes
  
  const newNoteEnd = newNote.startSlot + DURATION_SLOTS[newNote.duration]
  
  return !notesToCheck.some(existingNote => {
    if (existingNote.stringIndex !== newNote.stringIndex) return false
    
    const existingEnd = existingNote.startSlot + DURATION_SLOTS[existingNote.duration]
    
    // Check for overlap
    return !(newNote.startSlot >= existingEnd || newNoteEnd <= existingNote.startSlot)
  })
}

/**
 * Get the total duration in slots for all notes
 */
export const getTotalDurationSlots = (notes: Note[]): number => {
  if (notes.length === 0) return 0
  
  return notes.reduce((max, note) => {
    const noteEnd = note.startSlot + DURATION_SLOTS[note.duration]
    return Math.max(max, noteEnd)
  }, 0)
} 