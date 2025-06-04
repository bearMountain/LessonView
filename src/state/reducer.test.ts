// Tests for Core Reducer and State Helpers
import { describe, it, expect, beforeEach } from '@jest/globals'
import { appReducer, actionCreators } from './reducer'
import { initialState } from './initialState'
import { 
  addNoteAtPosition, 
  removeNoteAtIndex, 
  calculateNewCursorPosition,
  toggleNoteInSelection,
  convertNotesToTabData,
  convertTabDataToNotes
} from './stateHelpers'
import type { AppState, AppAction } from './types'
import type { Note } from '../types'

describe('Core Reducer', () => {
  let state: AppState

  beforeEach(() => {
    state = { ...initialState }
  })

  describe('Note Management', () => {
    it('should add a note to empty state', () => {
      const note: Note = {
        type: 'note',
        fret: 5,
        duration: 'quarter',
        stringIndex: 2,
        startSlot: 0
      }

      const action: AppAction = {
        type: 'ADD_NOTE',
        payload: { note }
      }

      const newState = appReducer(state, action)

      expect(newState.notes).toHaveLength(1)
      expect(newState.notes[0].fret).toBe(5)
      expect(newState.notes[0].duration).toBe('quarter')
      expect(newState.notes[0].stringIndex).toBe(2)
      expect(newState.isModified).toBe(true)
    })

    it('should remove a note by index', () => {
      // Add a note first
      const note: Note = {
        type: 'note',
        fret: 5,
        duration: 'quarter',
        stringIndex: 2,
        startSlot: 0
      }
      state.notes = [note]

      const action: AppAction = {
        type: 'REMOVE_NOTE',
        payload: { index: 0 }
      }

      const newState = appReducer(state, action)

      expect(newState.notes).toHaveLength(0)
      expect(newState.isModified).toBe(true)
    })

    it('should update note properties', () => {
      const note: Note = {
        type: 'note',
        fret: 5,
        duration: 'quarter',
        stringIndex: 2,
        startSlot: 0
      }
      state.notes = [note]

      const action: AppAction = {
        type: 'UPDATE_NOTE',
        payload: { 
          index: 0, 
          note: { fret: 7, duration: 'eighth' }
        }
      }

      const newState = appReducer(state, action)

      expect(newState.notes[0].fret).toBe(7)
      expect(newState.notes[0].duration).toBe('eighth')
      expect(newState.notes[0].stringIndex).toBe(2) // Should preserve other properties
      expect(newState.isModified).toBe(true)
    })

    it('should toggle dotted note', () => {
      const note: Note = {
        type: 'note',
        fret: 5,
        duration: 'quarter',
        stringIndex: 2,
        startSlot: 0,
        isDotted: false
      }
      state.notes = [note]

      const action: AppAction = {
        type: 'TOGGLE_DOTTED_NOTE',
        payload: { index: 0 }
      }

      const newState = appReducer(state, action)

      expect(newState.notes[0].isDotted).toBe(true)
      expect(newState.isModified).toBe(true)

      // Toggle again
      const newState2 = appReducer(newState, action)
      expect(newState2.notes[0].isDotted).toBe(false)
    })
  })

  describe('Cursor Management', () => {
    it('should move cursor left', () => {
      state.cursor = { timeSlot: 5, stringIndex: 1 }

      const action = actionCreators.moveCursor('left')
      const newState = appReducer(state, action)

      expect(newState.cursor.timeSlot).toBe(4)
      expect(newState.cursor.stringIndex).toBe(1)
      expect(newState.currentFretInput).toBe('') // Should clear input
    })

    it('should move cursor right', () => {
      state.cursor = { timeSlot: 5, stringIndex: 1 }

      const action = actionCreators.moveCursor('right')
      const newState = appReducer(state, action)

      expect(newState.cursor.timeSlot).toBe(6)
      expect(newState.cursor.stringIndex).toBe(1)
    })

    it('should move cursor up and down within string bounds', () => {
      state.cursor = { timeSlot: 5, stringIndex: 1 }

      // Move up
      const upAction = actionCreators.moveCursor('up')
      const newState1 = appReducer(state, upAction)
      expect(newState1.cursor.stringIndex).toBe(0)

      // Move down from initial position
      const downAction = actionCreators.moveCursor('down')
      const newState2 = appReducer(state, downAction)
      expect(newState2.cursor.stringIndex).toBe(2)

      // Try to move up from string 0 (should stay at 0)
      state.cursor = { timeSlot: 5, stringIndex: 0 }
      const newState3 = appReducer(state, upAction)
      expect(newState3.cursor.stringIndex).toBe(0)

      // Try to move down from string 2 (should stay at 2)
      state.cursor = { timeSlot: 5, stringIndex: 2 }
      const newState4 = appReducer(state, downAction)
      expect(newState4.cursor.stringIndex).toBe(2)
    })

    it('should not allow cursor to move left below 0', () => {
      state.cursor = { timeSlot: 0, stringIndex: 1 }

      const action = actionCreators.moveCursor('left')
      const newState = appReducer(state, action)

      expect(newState.cursor.timeSlot).toBe(0)
    })

    it('should set absolute cursor position', () => {
      const action = actionCreators.setCursorPosition({ timeSlot: 10, stringIndex: 2 })
      const newState = appReducer(state, action)

      expect(newState.cursor.timeSlot).toBe(10)
      expect(newState.cursor.stringIndex).toBe(2)
    })
  })

  describe('Fret Input Management', () => {
    it('should update fret input', () => {
      const action = actionCreators.updateFretInput('12')
      const newState = appReducer(state, action)

      expect(newState.currentFretInput).toBe('12')
    })

    it('should clear fret input', () => {
      state.currentFretInput = '12'

      const action = actionCreators.clearFretInput()
      const newState = appReducer(state, action)

      expect(newState.currentFretInput).toBe('')
    })
  })

  describe('Playback Controls', () => {
    it('should toggle playback', () => {
      expect(state.isPlaying).toBe(false)

      const action = actionCreators.togglePlayback()
      const newState = appReducer(state, action)

      expect(newState.isPlaying).toBe(true)

      // Toggle again
      const newState2 = appReducer(newState, action)
      expect(newState2.isPlaying).toBe(false)
    })

    it('should set tempo with bounds checking', () => {
      // Normal tempo
      const action1 = actionCreators.setTempo(140)
      const newState1 = appReducer(state, action1)
      expect(newState1.tempo).toBe(140)
      expect(newState1.isModified).toBe(true)

      // Too low (should clamp to 30)
      const action2 = actionCreators.setTempo(10)
      const newState2 = appReducer(state, action2)
      expect(newState2.tempo).toBe(30)

      // Too high (should clamp to 300)
      const action3 = actionCreators.setTempo(500)
      const newState3 = appReducer(state, action3)
      expect(newState3.tempo).toBe(300)
    })

    it('should set playback position', () => {
      const action: AppAction = {
        type: 'SET_PLAYBACK_POSITION',
        payload: 42
      }

      const newState = appReducer(state, action)
      expect(newState.playbackPosition).toBe(42)
    })
  })

  describe('Selection Management', () => {
    it('should set selection', () => {
      const action: AppAction = {
        type: 'SET_SELECTION',
        payload: [0, 1, 2]
      }

      const newState = appReducer(state, action)
      expect(newState.selection).toEqual([0, 1, 2])
    })

    it('should clear selection', () => {
      state.selection = [0, 1, 2]
      state.firstSelectedNote = { timeSlot: 5, stringIndex: 1 }

      const action: AppAction = { type: 'CLEAR_SELECTION' }
      const newState = appReducer(state, action)

      expect(newState.selection).toEqual([])
      expect(newState.firstSelectedNote).toBeNull()
    })
  })

  describe('Visual Controls', () => {
    it('should set zoom with bounds checking', () => {
      // Normal zoom
      const action1: AppAction = { type: 'SET_ZOOM', payload: 1.5 }
      const newState1 = appReducer(state, action1)
      expect(newState1.zoom).toBe(1.5)

      // Too low (should clamp to 0.25)
      const action2: AppAction = { type: 'SET_ZOOM', payload: 0.1 }
      const newState2 = appReducer(state, action2)
      expect(newState2.zoom).toBe(0.25)

      // Too high (should clamp to 4.0)
      const action3: AppAction = { type: 'SET_ZOOM', payload: 10 }
      const newState3 = appReducer(state, action3)
      expect(newState3.zoom).toBe(4.0)
    })

    it('should toggle fretboard visibility', () => {
      expect(state.showFretboard).toBe(true)

      const action: AppAction = { type: 'TOGGLE_FRETBOARD' }
      const newState = appReducer(state, action)

      expect(newState.showFretboard).toBe(false)
    })
  })
})

describe('State Helpers', () => {
  describe('Note Management Helpers', () => {
    it('should add note at position', () => {
      const notes: Note[] = []
      const newNote: Note = {
        type: 'note',
        fret: 5,
        duration: 'quarter',
        stringIndex: 2,
        startSlot: 0
      }

      const result = addNoteAtPosition(notes, newNote)

      expect(result).toHaveLength(1)
      expect(result[0].fret).toBe(5)
      expect(result[0].duration).toBe('quarter')
      expect(result[0].stringIndex).toBe(2)
    })

    it('should remove note at index', () => {
      const notes: Note[] = [
        { type: 'note', fret: 5, duration: 'quarter', stringIndex: 2, startSlot: 0 },
        { type: 'note', fret: 7, duration: 'quarter', stringIndex: 1, startSlot: 4 }
      ]

      const result = removeNoteAtIndex(notes, 0)

      expect(result).toHaveLength(1)
      expect(result[0].fret).toBe(7)
    })

    it('should handle invalid indices gracefully', () => {
      const notes: Note[] = [
        { type: 'note', fret: 5, duration: 'quarter', stringIndex: 2, startSlot: 0 }
      ]

      // Negative index
      const result1 = removeNoteAtIndex(notes, -1)
      expect(result1).toEqual(notes)

      // Index too high
      const result2 = removeNoteAtIndex(notes, 10)
      expect(result2).toEqual(notes)
    })
  })

  describe('Cursor Helpers', () => {
    it('should calculate cursor movement', () => {
      const cursor = { timeSlot: 5, stringIndex: 1 }

      expect(calculateNewCursorPosition(cursor, 'left', [])).toEqual({
        timeSlot: 4, stringIndex: 1
      })

      expect(calculateNewCursorPosition(cursor, 'right', [])).toEqual({
        timeSlot: 6, stringIndex: 1
      })

      expect(calculateNewCursorPosition(cursor, 'up', [])).toEqual({
        timeSlot: 5, stringIndex: 0
      })

      expect(calculateNewCursorPosition(cursor, 'down', [])).toEqual({
        timeSlot: 5, stringIndex: 2
      })
    })

    it('should handle absolute cursor positioning', () => {
      const cursor = { timeSlot: 5, stringIndex: 1 }
      const newPosition = { timeSlot: 10, stringIndex: 2 }

      const result = calculateNewCursorPosition(
        cursor, 
        { type: 'absolute', position: newPosition }, 
        []
      )

      expect(result).toEqual(newPosition)
    })
  })

  describe('Selection Helpers', () => {
    it('should toggle note in selection', () => {
      // Add to empty selection
      const result1 = toggleNoteInSelection([], 5)
      expect(result1).toEqual([5])

      // Remove from selection
      const result2 = toggleNoteInSelection([5], 5)
      expect(result2).toEqual([])

      // Add to existing selection
      const result3 = toggleNoteInSelection([1, 3], 5)
      expect(result3).toEqual([1, 3, 5])
    })

    it('should handle shift selection for ranges', () => {
      // Start range selection
      const result1 = toggleNoteInSelection([3], 7, true)
      expect(result1).toEqual([3, 4, 5, 6, 7])

      // Reverse range
      const result2 = toggleNoteInSelection([7], 3, true)
      expect(result2).toEqual([3, 4, 5, 6, 7])

      // Empty selection with shift
      const result3 = toggleNoteInSelection([], 5, true)
      expect(result3).toEqual([5])
    })
  })

  describe('Conversion Helpers', () => {
    it('should convert notes to TabData format', () => {
      const notes: Note[] = [
        { type: 'note', fret: 5, duration: 'quarter', stringIndex: 2, startSlot: 0 },
        { type: 'note', fret: 7, duration: 'quarter', stringIndex: 1, startSlot: 4 }
      ]

      const tabData = convertNotesToTabData(notes)

      expect(tabData[0].notes).toHaveLength(1)
      expect(tabData[0].notes[0].fret).toBe(5)
      expect(tabData[4].notes).toHaveLength(1)
      expect(tabData[4].notes[0].fret).toBe(7)
    })

    it('should convert TabData to notes format', () => {
      const tabData = [
        { notes: [{ type: 'note' as const, fret: 5, duration: 'quarter' as const, stringIndex: 2, startSlot: 0 }] },
        { notes: [] },
        { notes: [] },
        { notes: [] },
        { notes: [{ type: 'note' as const, fret: 7, duration: 'quarter' as const, stringIndex: 1, startSlot: 4 }] }
      ]

      const notes = convertTabDataToNotes(tabData)

      expect(notes).toHaveLength(2)
      expect(notes[0].fret).toBe(5)
      expect(notes[0].startSlot).toBe(0)
      expect(notes[1].fret).toBe(7)
      expect(notes[1].startSlot).toBe(4)
    })
  })
}) 