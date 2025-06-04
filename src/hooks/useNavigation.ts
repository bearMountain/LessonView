// Navigation Hook
// Handles mouse clicks, cursor positioning, and visual interactions

import { useCallback } from 'react'
import type { TabEditorAPI } from './useTabEditor'
import { selectClosestSlot, selectClosestString, selectNoteAtPosition } from '../state/selectors'

interface UseNavigationOptions {
  enabled?: boolean
}

/**
 * Hook for handling navigation and mouse interactions
 * Extracts cursor movement and click handling logic from components
 */
export const useNavigation = (
  tabEditor: TabEditorAPI,
  options: UseNavigationOptions = {}
) => {
  const { enabled = true } = options
  const { state, visualLayout, setCursorPosition, toggleNoteSelection } = tabEditor

  /**
   * Handle click on the tab display area
   */
  const handleTabClick = useCallback((event: React.MouseEvent<SVGElement>) => {
    if (!enabled) return

    const rect = event.currentTarget.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    // Check if we clicked on a note first
    const clickedNote = selectNoteAtPosition(x, y, visualLayout.notes, state.zoom)
    
    if (clickedNote) {
      // Clicked on a note - handle note selection
      const noteIndex = state.notes.findIndex(note => 
        note.startSlot === clickedNote.startSlot && 
        note.stringIndex === clickedNote.stringIndex
      )
      
      if (noteIndex >= 0) {
        const shiftHeld = event.shiftKey
        toggleNoteSelection(noteIndex, shiftHeld)
        
        // Also move cursor to the note position
        setCursorPosition({
          timeSlot: clickedNote.startSlot,
          stringIndex: clickedNote.stringIndex
        })
      }
    } else {
      // Clicked on empty space - find closest slot and string
      const closestSlot = selectClosestSlot(x, visualLayout.notes.reduce((offsets, note) => {
        offsets.set(note.slot, note.visualX)
        return offsets
      }, new Map()), state.zoom)
      
      const closestString = selectClosestString(y, state.zoom)
      
      // Move cursor to clicked position
      setCursorPosition({
        timeSlot: closestSlot,
        stringIndex: closestString
      })
    }
  }, [
    enabled, 
    state.notes, 
    state.zoom, 
    visualLayout, 
    setCursorPosition, 
    toggleNoteSelection
  ])

  /**
   * Handle click on a specific note
   */
  const handleNoteClick = useCallback((
    noteIndex: number, 
    event: React.MouseEvent
  ) => {
    if (!enabled) return

    event.stopPropagation() // Prevent tab click handler

    const note = state.notes[noteIndex]
    if (!note) return

    // Move cursor to note position
    setCursorPosition({
      timeSlot: note.startSlot,
      stringIndex: note.stringIndex
    })

    // Handle selection with shift key support
    const shiftHeld = event.shiftKey
    toggleNoteSelection(noteIndex, shiftHeld)
  }, [enabled, state.notes, setCursorPosition, toggleNoteSelection])

  /**
   * Handle click on a measure line
   */
  const handleMeasureClick = useCallback((
    measureSlot: number,
    event: React.MouseEvent
  ) => {
    if (!enabled) return

    event.stopPropagation() // Prevent tab click handler

    // Move cursor to measure position
    setCursorPosition({
      timeSlot: measureSlot,
      stringIndex: state.cursor.stringIndex // Keep current string
    })
  }, [enabled, state.cursor.stringIndex, setCursorPosition])

  /**
   * Navigate to a specific time position (for video sync, etc.)
   */
  const navigateToTime = useCallback((timeInSeconds: number) => {
    if (!enabled) return

    // Convert time to slot position based on tempo
    // Each slot is a sixteenth note = 0.25 beats
    const beatsPerSecond = state.tempo / 60
    const beats = timeInSeconds * beatsPerSecond
    const slot = Math.round(beats / 0.25)

    setCursorPosition({
      timeSlot: Math.max(0, slot),
      stringIndex: state.cursor.stringIndex
    })
  }, [enabled, state.tempo, state.cursor.stringIndex, setCursorPosition])

  /**
   * Navigate to a specific measure
   */
  const navigateToMeasure = useCallback((measureNumber: number) => {
    if (!enabled) return

    const targetMeasure = tabEditor.measures.find(m => m.measureNumber === measureNumber)
    if (targetMeasure) {
      setCursorPosition({
        timeSlot: targetMeasure.startSlot,
        stringIndex: state.cursor.stringIndex
      })
    }
  }, [enabled, tabEditor.measures, state.cursor.stringIndex, setCursorPosition])

  /**
   * Navigate to the next/previous note
   */
  const navigateToNote = useCallback((direction: 'next' | 'previous') => {
    if (!enabled || state.notes.length === 0) return

    const currentSlot = state.cursor.timeSlot
    const currentString = state.cursor.stringIndex

    if (direction === 'next') {
      // Find next note after current position
      const nextNote = state.notes.find(note => 
        note.startSlot > currentSlot ||
        (note.startSlot === currentSlot && note.stringIndex > currentString)
      )
      
      if (nextNote) {
        setCursorPosition({
          timeSlot: nextNote.startSlot,
          stringIndex: nextNote.stringIndex
        })
      }
    } else {
      // Find previous note before current position
      const previousNotes = state.notes.filter(note =>
        note.startSlot < currentSlot ||
        (note.startSlot === currentSlot && note.stringIndex < currentString)
      )
      
      if (previousNotes.length > 0) {
        const previousNote = previousNotes[previousNotes.length - 1]
        setCursorPosition({
          timeSlot: previousNote.startSlot,
          stringIndex: previousNote.stringIndex
        })
      }
    }
  }, [enabled, state.notes, state.cursor, setCursorPosition])

  /**
   * Navigate to the beginning or end of the tablature
   */
  const navigateToEdge = useCallback((edge: 'start' | 'end') => {
    if (!enabled) return

    if (edge === 'start') {
      setCursorPosition({ timeSlot: 0, stringIndex: state.cursor.stringIndex })
    } else {
      // Find the last note position
      if (state.notes.length > 0) {
        const lastNote = state.notes.reduce((latest, note) => 
          note.startSlot > latest.startSlot ? note : latest
        )
        setCursorPosition({
          timeSlot: lastNote.startSlot,
          stringIndex: state.cursor.stringIndex
        })
      }
    }
  }, [enabled, state.notes, state.cursor.stringIndex, setCursorPosition])

  return {
    // Click handlers
    handleTabClick: enabled ? handleTabClick : () => {},
    handleNoteClick: enabled ? handleNoteClick : () => {},
    handleMeasureClick: enabled ? handleMeasureClick : () => {},
    
    // Navigation methods
    navigateToTime,
    navigateToMeasure,
    navigateToNote,
    navigateToEdge,
    
    // Direct cursor control
    setCursorPosition: enabled ? setCursorPosition : () => {},
    
    // State
    enabled,
    currentPosition: state.cursor,
    selectedNotes: state.selection
  }
}

export type NavigationAPI = ReturnType<typeof useNavigation> 