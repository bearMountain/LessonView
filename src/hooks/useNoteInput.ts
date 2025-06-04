// Note Input Hook
// Handles fret input, keyboard interactions, and note creation

import { useCallback, useEffect } from 'react'
import type { TabEditorAPI } from './useTabEditor'
import type { Note, NoteDuration, NoteType } from '../types'

interface UseNoteInputOptions {
  enabled?: boolean // Allow disabling input when in playback mode, etc.
}

/**
 * Hook for handling note input and keyboard interactions
 * Extracts the complex input logic from components
 */
export const useNoteInput = (
  tabEditor: TabEditorAPI, 
  options: UseNoteInputOptions = {}
) => {
  const { enabled = true } = options
  const { state, addNote, updateFretInput, clearFretInput, moveCursor } = tabEditor

  /**
   * Create a note at the current cursor position
   */
  const createNoteAtCursor = useCallback((
    fret: number | null,
    duration?: NoteDuration,
    noteType?: NoteType
  ) => {
    const note: Note = {
      type: noteType || state.selectedNoteType,
      fret,
      duration: duration || state.selectedDuration,
      stringIndex: state.cursor.stringIndex,
      startSlot: state.cursor.timeSlot,
      isDotted: false // Default to non-dotted, can be toggled later
    }

    addNote(note)
  }, [state.cursor, state.selectedDuration, state.selectedNoteType, addNote])

  /**
   * Add a note with the current fret input and move cursor
   */
  const commitFretInput = useCallback(() => {
    if (!state.currentFretInput || !enabled) return

    const fret = parseInt(state.currentFretInput)
    if (isNaN(fret) || fret < 0 || fret > 24) {
      // Invalid fret number, just clear input
      clearFretInput()
      return
    }

    // Create the note
    createNoteAtCursor(fret)
    
    // Clear input and move cursor right
    clearFretInput()
    moveCursor('right')
  }, [state.currentFretInput, enabled, createNoteAtCursor, clearFretInput, moveCursor])

  /**
   * Add a rest at the current cursor position
   */
  const addRest = useCallback((duration?: NoteDuration) => {
    createNoteAtCursor(null, duration, 'rest')
    moveCursor('right')
  }, [createNoteAtCursor, moveCursor])

  /**
   * Quick note entry - add note with specific fret and advance cursor
   */
  const addQuickNote = useCallback((fret: number, duration?: NoteDuration) => {
    createNoteAtCursor(fret, duration, 'note')
    moveCursor('right')
  }, [createNoteAtCursor, moveCursor])

  /**
   * Handle numeric key input for fret numbers
   * Modified to create notes immediately (like original behavior)
   */
  const handleNumericKey = useCallback((key: string) => {
    if (!enabled) return false

    if (key >= '0' && key <= '9') {
      const fret = parseInt(key)
      
      // Validate fret number
      if (fret >= 0 && fret <= 24) {
        // Create note immediately and advance cursor
        createNoteAtCursor(fret, undefined, 'note')
        moveCursor('right')
        return true
      }
    }
    return false
  }, [enabled, createNoteAtCursor, moveCursor])

  /**
   * Handle multi-digit fret input (for frets 10-24)
   * Press 1, then 0-4 for frets 10-14, etc.
   */
  const handleMultiDigitFret = useCallback((key: string) => {
    if (!enabled) return false

    if (key >= '0' && key <= '9') {
      const newInput = state.currentFretInput + key
      const fretValue = parseInt(newInput)
      
      if (fretValue <= 24) {
        if (newInput.length === 1) {
          // First digit: store for potential multi-digit fret
          updateFretInput(newInput)
          return true
        } else if (newInput.length === 2) {
          // Second digit: create the note with two-digit fret
          createNoteAtCursor(fretValue, undefined, 'note')
          moveCursor('right')
          clearFretInput()
          return true
        }
      } else {
        // Invalid fret, clear input
        clearFretInput()
      }
    }
    return false
  }, [enabled, state.currentFretInput, updateFretInput, createNoteAtCursor, moveCursor, clearFretInput])

  /**
   * Handle special key inputs
   */
  const handleSpecialKey = useCallback((event: KeyboardEvent) => {
    if (!enabled) return false

    const key = event.key
    
    switch (key) {
      case 'Enter':
        if (state.currentFretInput) {
          event.preventDefault()
          // Complete multi-digit fret input
          const fret = parseInt(state.currentFretInput)
          if (!isNaN(fret) && fret >= 0 && fret <= 24) {
            createNoteAtCursor(fret, undefined, 'note')
            moveCursor('right')
          }
          clearFretInput()
          return true
        }
        break

      case 'Escape':
        if (state.currentFretInput) {
          event.preventDefault()
          clearFretInput()
          return true
        }
        break

      case 'Backspace':
        if (state.currentFretInput) {
          event.preventDefault()
          const newInput = state.currentFretInput.slice(0, -1)
          updateFretInput(newInput)
          return true
        }
        break

      case ' ': // Spacebar for rest
        event.preventDefault()
        addRest()
        return true

      case 'Delete':
        // TODO: Delete note at cursor position
        event.preventDefault()
        return true

      default:
        return false
    }
    return false
  }, [enabled, state.currentFretInput, createNoteAtCursor, moveCursor, clearFretInput, updateFretInput, addRest])

  /**
   * Handle arrow key navigation
   */
  const handleNavigationKey = useCallback((event: KeyboardEvent) => {
    if (!enabled) return false

    const key = event.key
    
    switch (key) {
      case 'ArrowLeft':
        event.preventDefault()
        moveCursor('left')
        return true

      case 'ArrowRight':
        event.preventDefault()
        moveCursor('right')
        return true

      case 'ArrowUp':
        event.preventDefault()
        moveCursor('up')
        return true

      case 'ArrowDown':
        event.preventDefault()
        moveCursor('down')
        return true

      default:
        return false
    }
  }, [enabled, moveCursor])

  /**
   * Main keyboard event handler
   * Modified for immediate note creation
   */
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Check for special keys first
    if (handleSpecialKey(event)) return
    if (handleNavigationKey(event)) return
    
    // For immediate note creation: single digit = immediate note
    // For multi-digit frets: Hold Shift while typing for input mode
    if (event.shiftKey && event.key >= '1' && event.key <= '2') {
      // Shift+1 or Shift+2 starts multi-digit input for 10-24 range
      if (handleMultiDigitFret(event.key)) {
        event.preventDefault()
        return
      }
    } else if (event.key >= '0' && event.key <= '9') {
      // Regular number keys create notes immediately
      if (handleNumericKey(event.key)) {
        event.preventDefault()
        return
      }
    }
  }, [handleSpecialKey, handleNavigationKey, handleNumericKey, handleMultiDigitFret])

  /**
   * Handle key press events (for character input)
   */
  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    if (handleNumericKey(event.key)) {
      event.preventDefault()
    }
  }, [handleNumericKey])

  // Set up global keyboard listeners
  useEffect(() => {
    if (!enabled) return

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keypress', handleKeyPress)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keypress', handleKeyPress)
    }
  }, [enabled, handleKeyDown, handleKeyPress])

  return {
    // Input state
    currentFretInput: state.currentFretInput,
    isInputValid: state.currentFretInput !== '' && !isNaN(parseInt(state.currentFretInput)),
    
    // Note creation methods
    createNoteAtCursor,
    commitFretInput,
    addRest,
    addQuickNote,
    
    // Input methods
    updateFretInput: enabled ? updateFretInput : () => {},
    clearFretInput: enabled ? clearFretInput : () => {},
    
    // Event handlers for manual attachment
    handleKeyDown: enabled ? handleKeyDown : () => {},
    handleKeyPress: enabled ? handleKeyPress : () => {},
    
    // State
    enabled
  }
}

export type NoteInputAPI = ReturnType<typeof useNoteInput> 