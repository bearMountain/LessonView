// Tests for Pure Audio Engine Functions

import {
  ticksToTransportTime,
  fretToNoteName,
  durationToToneNotation,
  noteStackToToneEvents,
  audioReducer,
  initialAudioState,
  calculateSequenceDuration,
  getStackAtPosition,
  validateNoteStacks
} from './audioEngine'
import type { NoteStack, Duration } from '../types/notestack'

describe('Audio Engine Pure Functions', () => {
  describe('ticksToTransportTime', () => {
    test('converts ticks to transport time correctly', () => {
      expect(ticksToTransportTime(0)).toBe('0:0:0')
      expect(ticksToTransportTime(240)).toBe('0:0:1') // 1 sixteenth
      expect(ticksToTransportTime(960)).toBe('0:1:0') // 1 quarter note
      expect(ticksToTransportTime(3840)).toBe('1:0:0') // 1 measure
      expect(ticksToTransportTime(4800)).toBe('1:1:0') // 1 measure + 1 quarter
    })
  })

  describe('fretToNoteName', () => {
    test('converts open strings to correct note names', () => {
      expect(fretToNoteName(0, 0)).toBe('D3') // Low D
      expect(fretToNoteName(0, 1)).toBe('A3') // A
      expect(fretToNoteName(0, 2)).toBe('D4') // High D
    })

    test('converts fretted notes correctly', () => {
      // Test some basic fret positions
      expect(fretToNoteName(1, 0)).toBe('D#3') // Low D string, 1st fret
      expect(fretToNoteName(2, 0)).toBe('E3')  // Low D string, 2nd fret
      expect(fretToNoteName(12, 0)).toBe('D4') // Low D string, 12th fret (octave)
      expect(fretToNoteName(12, 1)).toBe('A4') // A string, 12th fret (octave)
      expect(fretToNoteName(12, 2)).toBe('D5') // High D string, 12th fret (octave)
    })

    test('throws error for invalid string', () => {
      expect(() => fretToNoteName(0, -1)).toThrow('Invalid string index')
      expect(() => fretToNoteName(0, 3)).toThrow('Invalid string index')
    })

    test('throws error for invalid fret', () => {
      expect(() => fretToNoteName(-1, 0)).toThrow('Invalid fret')
      expect(() => fretToNoteName(25, 0)).toThrow('Invalid fret')
    })
  })

  describe('durationToToneNotation', () => {
    test('converts durations correctly', () => {
      expect(durationToToneNotation('whole')).toBe('1n')
      expect(durationToToneNotation('half')).toBe('2n')
      expect(durationToToneNotation('quarter')).toBe('4n')
      expect(durationToToneNotation('eighth')).toBe('8n')
      expect(durationToToneNotation('sixteenth')).toBe('16n')
    })
  })

  describe('noteStackToToneEvents', () => {
    test('converts note stacks to tone events', () => {
      const noteStacks: NoteStack[] = [
        {
          id: 'stack1',
          musicalPosition: 0,
          duration: 'quarter',
          notes: [{ string: 0, fret: 0 }, { string: 1, fret: 2 }]
        },
        {
          id: 'stack2', 
          musicalPosition: 960,
          duration: 'half',
          notes: [{ string: 2, fret: 5 }]
        }
      ]

      const events = noteStackToToneEvents(noteStacks)

      expect(events).toHaveLength(2)
      expect(events[0]).toEqual({
        time: '0:0:0',
        duration: '4n',
        notes: [
          { noteName: 'D3', string: 0, fret: 0 },
          { noteName: 'B3', string: 1, fret: 2 }
        ],
        stackId: 'stack1',
        originalPosition: 0
      })
      expect(events[1]).toEqual({
        time: '0:1:0',
        duration: '2n',
        notes: [
          { noteName: 'G4', string: 2, fret: 5 }
        ],
        stackId: 'stack2',
        originalPosition: 960
      })
    })
  })

  describe('audioReducer', () => {
    test('handles LOAD_SEQUENCE action', () => {
      const stacks: NoteStack[] = [
        { id: 'test', musicalPosition: 0, duration: 'quarter', notes: [{ string: 0, fret: 0 }] }
      ]
      
      const newState = audioReducer(initialAudioState, {
        type: 'LOAD_SEQUENCE',
        payload: stacks
      })

      expect(newState.sequence).toEqual(stacks)
      expect(newState.currentPosition).toBe(0) // Should reset position
    })

    test('handles PLAY action', () => {
      const newState = audioReducer(initialAudioState, { type: 'PLAY' })
      expect(newState.isPlaying).toBe(true)
    })

    test('handles STOP action', () => {
      const playingState = { ...initialAudioState, isPlaying: true, currentPosition: 1000 }
      const newState = audioReducer(playingState, { type: 'STOP' })
      
      expect(newState.isPlaying).toBe(false)
      expect(newState.currentPosition).toBe(0) // Should reset position
    })

    test('handles PAUSE action', () => {
      const playingState = { ...initialAudioState, isPlaying: true, currentPosition: 1000 }
      const newState = audioReducer(playingState, { type: 'PAUSE' })
      
      expect(newState.isPlaying).toBe(false)
      expect(newState.currentPosition).toBe(1000) // Should keep position
    })

    test('handles SET_TEMPO action with clamping', () => {
      expect(audioReducer(initialAudioState, { type: 'SET_TEMPO', payload: 120 }).tempo).toBe(120)
      expect(audioReducer(initialAudioState, { type: 'SET_TEMPO', payload: 50 }).tempo).toBe(60) // Clamped to min
      expect(audioReducer(initialAudioState, { type: 'SET_TEMPO', payload: 250 }).tempo).toBe(200) // Clamped to max
    })

    test('handles SET_VOLUME action with clamping', () => {
      expect(audioReducer(initialAudioState, { type: 'SET_VOLUME', payload: 0.5 }).volume).toBe(0.5)
      expect(audioReducer(initialAudioState, { type: 'SET_VOLUME', payload: -0.1 }).volume).toBe(0) // Clamped to min
      expect(audioReducer(initialAudioState, { type: 'SET_VOLUME', payload: 1.5 }).volume).toBe(1) // Clamped to max
    })

    test('handles TOGGLE_LOOP action', () => {
      const state1 = audioReducer(initialAudioState, { type: 'TOGGLE_LOOP' })
      expect(state1.isLooping).toBe(true)
      
      const state2 = audioReducer(state1, { type: 'TOGGLE_LOOP' })
      expect(state2.isLooping).toBe(false)
    })
  })

  describe('calculateSequenceDuration', () => {
    test('calculates duration correctly', () => {
      const stacks: NoteStack[] = [
        { id: '1', musicalPosition: 0, duration: 'quarter', notes: [{ string: 0, fret: 0 }] },
        { id: '2', musicalPosition: 960, duration: 'half', notes: [{ string: 1, fret: 2 }] },
        { id: '3', musicalPosition: 2880, duration: 'quarter', notes: [{ string: 2, fret: 5 }] }
      ]

      // Last stack starts at 2880 + quarter note duration (960) = 3840 total
      expect(calculateSequenceDuration(stacks)).toBe(3840)
    })

    test('returns 0 for empty sequence', () => {
      expect(calculateSequenceDuration([])).toBe(0)
    })
  })

  describe('getStackAtPosition', () => {
    const stacks: NoteStack[] = [
      { id: '1', musicalPosition: 0, duration: 'quarter', notes: [{ string: 0, fret: 0 }] },
      { id: '2', musicalPosition: 960, duration: 'quarter', notes: [{ string: 1, fret: 2 }] }
    ]

    test('finds stack at position', () => {
      const stack = getStackAtPosition(stacks, 960)
      expect(stack?.id).toBe('2')
    })

    test('returns undefined for non-existent position', () => {
      const stack = getStackAtPosition(stacks, 1920)
      expect(stack).toBeUndefined()
    })
  })

  describe('validateNoteStacks', () => {
    test('validates correct note stacks', () => {
      const validStacks: NoteStack[] = [
        { id: '1', musicalPosition: 0, duration: 'quarter', notes: [{ string: 0, fret: 0 }] }
      ]
      expect(() => validateNoteStacks(validStacks)).not.toThrow()
    })

    test('throws error for missing id', () => {
      const invalidStacks = [
        { musicalPosition: 0, duration: 'quarter', notes: [{ string: 0, fret: 0 }] }
      ] as NoteStack[]
      expect(() => validateNoteStacks(invalidStacks)).toThrow('missing required fields')
    })

    test('throws error for invalid string', () => {
      const invalidStacks: NoteStack[] = [
        { id: '1', musicalPosition: 0, duration: 'quarter', notes: [{ string: 3, fret: 0 }] }
      ]
      expect(() => validateNoteStacks(invalidStacks)).toThrow('Invalid string')
    })

    test('throws error for invalid fret', () => {
      const invalidStacks: NoteStack[] = [
        { id: '1', musicalPosition: 0, duration: 'quarter', notes: [{ string: 0, fret: 25 }] }
      ]
      expect(() => validateNoteStacks(invalidStacks)).toThrow('Invalid fret')
    })
  })
}) 