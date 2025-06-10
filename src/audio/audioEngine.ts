// Pure Functional Audio Engine
// Handles all audio logic through pure functions

import * as Tone from 'tone'
import type { NoteStack, Duration } from '../types/notestack'

// ===============================
// PURE CONVERSION FUNCTIONS
// ===============================

/**
 * Convert musical ticks to Tone.js transport time notation
 * @param ticks - Musical position in ticks (960 per quarter note)
 * @returns Tone.js time string like "4:2:3" (measures:beats:sixteenths)
 */
export const ticksToTransportTime = (ticks: number): string => {
  const measures = Math.floor(ticks / 3840) // 3840 ticks per measure in 4/4
  const beats = Math.floor((ticks % 3840) / 960) // 960 ticks per quarter note
  const sixteenths = Math.floor((ticks % 960) / 240) // 240 ticks per sixteenth note
  return `${measures}:${beats}:${sixteenths}`
}

/**
 * Convert fret/string to Tone.js note name
 * Uses Tone.js's built-in note name handling instead of manual frequency calculation
 * @param fret - Fret number (0-24)
 * @param string - String index (0=Low D, 1=A, 2=Hi D)
 * @returns Tone.js note name like "D3", "A#4", etc.
 */
export const fretToNoteName = (fret: number, string: number): string => {
  if (string < 0 || string > 2) {
    throw new Error(`Invalid string index: ${string}. Must be 0, 1, or 2`)
  }
  
  if (fret < 0 || fret > 12) {
    throw new Error(`Invalid fret: ${fret}. Must be 0-12`)
  }
  
  // Diatonic strumstick fret-to-note mapping
  // String 0 = D3 (Low D), String 1 = A4, String 2 = D4 (High D)
  const fretToNoteMap: Record<number, [string, string, string]> = {
    0:  ['D3', 'A4', 'D4'],   // Open strings
    1:  ['E3', 'B4', 'E4'],   // 2nd degree
    2:  ['F#3', 'C#5', 'F#4'], // 3rd degree
    3:  ['G3', 'D5', 'G4'],   // 4th degree
    4:  ['A3', 'E5', 'A4'],   // 5th degree
    5:  ['B3', 'F#5', 'B4'],  // 6th degree
    6:  ['C4', 'G5', 'C5'],   // b7th degree
    7:  ['C#4', 'G#5', 'C#5'], // 7th degree
    8:  ['D4', 'A5', 'D5'],   // Octave (8th/1st)
    9:  ['E4', 'B5', 'E5'],   // 9th (2nd)
    10: ['F#4', 'C#6', 'F#5'], // 10th (3rd)
    11: ['G4', 'D6', 'G5'],   // 11th (4th)
    12: ['A4', 'E6', 'A5']    // 12th (5th)
  }
  
  return fretToNoteMap[fret][string]
}

/**
 * Convert Duration enum to Tone.js notation
 * @param duration - Duration type
 * @returns Tone.js duration string
 */
export const durationToToneNotation = (duration: Duration): string => {
  const mapping: Record<Duration, string> = {
    'whole': '1n',
    'half': '2n', 
    'quarter': '4n',
    'eighth': '8n',
    'sixteenth': '16n'
  }
  return mapping[duration]
}

/**
 * Convert NoteStack array to Tone.js Part events
 * @param stacks - Array of NoteStack objects
 * @returns Array of Tone.js events with timing and note data
 */
export const noteStackToToneEvents = (stacks: NoteStack[]) => {
  return stacks.map(stack => ({
    time: ticksToTransportTime(stack.musicalPosition),
    duration: durationToToneNotation(stack.duration),
    notes: stack.notes.map(note => ({
      noteName: fretToNoteName(note.fret, note.string),
      string: note.string,
      fret: note.fret
    })),
    stackId: stack.id,
    originalPosition: stack.musicalPosition
  }))
}

// ===============================
// AUDIO STATE MANAGEMENT
// ===============================

export interface AudioState {
  sequence: NoteStack[]
  isPlaying: boolean
  currentPosition: number // in ticks
  tempo: number // BPM
  volume: number // 0-1
  isLooping: boolean
  loopStart: number // in ticks
  loopEnd: number // in ticks
}

export const initialAudioState: AudioState = {
  sequence: [],
  isPlaying: false,
  currentPosition: 0,
  tempo: 120,
  volume: 0.7,
  isLooping: false,
  loopStart: 0,
  loopEnd: 0
}

// ===============================
// AUDIO ACTIONS (PURE)
// ===============================

export type AudioAction = 
  | { type: 'LOAD_SEQUENCE'; payload: NoteStack[] }
  | { type: 'PLAY' }
  | { type: 'STOP' }
  | { type: 'PAUSE' }
  | { type: 'SET_TEMPO'; payload: number }
  | { type: 'SET_POSITION'; payload: number }
  | { type: 'SET_VOLUME'; payload: number }
  | { type: 'TOGGLE_LOOP' }
  | { type: 'SET_LOOP_POINTS'; payload: { start: number; end: number } }
  | { type: 'TRANSPORT_POSITION_UPDATE'; payload: number }

/**
 * Pure reducer for audio state management
 * @param state - Current audio state
 * @param action - Action to process
 * @returns New audio state (immutable)
 */
export const audioReducer = (state: AudioState, action: AudioAction): AudioState => {
  switch (action.type) {
    case 'LOAD_SEQUENCE':
      return { 
        ...state, 
        sequence: action.payload,
        // Reset position when loading new sequence
        currentPosition: 0
      }
      
    case 'PLAY':
      return { ...state, isPlaying: true }
      
    case 'STOP':
      return { 
        ...state, 
        isPlaying: false,
        currentPosition: 0 // Reset to beginning on stop
      }
      
    case 'PAUSE':
      return { ...state, isPlaying: false }
      
    case 'SET_TEMPO':
      // Clamp tempo to reasonable range
      const clampedTempo = Math.max(60, Math.min(200, action.payload))
      return { ...state, tempo: clampedTempo }
      
    case 'SET_POSITION':
      // Ensure position is non-negative
      const clampedPosition = Math.max(0, action.payload)
      return { ...state, currentPosition: clampedPosition }
      
    case 'SET_VOLUME':
      // Clamp volume to 0-1 range
      const clampedVolume = Math.max(0, Math.min(1, action.payload))
      return { ...state, volume: clampedVolume }
      
    case 'TOGGLE_LOOP':
      return { ...state, isLooping: !state.isLooping }
      
    case 'SET_LOOP_POINTS':
      const { start, end } = action.payload
      return { 
        ...state, 
        loopStart: Math.max(0, start),
        loopEnd: Math.max(start, end)
      }
      
    case 'TRANSPORT_POSITION_UPDATE':
      return { ...state, currentPosition: action.payload }
      
    default:
      return state
  }
}

// ===============================
// UTILITY FUNCTIONS
// ===============================

/**
 * Calculate the total duration of a sequence in ticks
 * @param stacks - Array of NoteStack objects
 * @returns Total duration in ticks
 */
export const calculateSequenceDuration = (stacks: NoteStack[]): number => {
  if (stacks.length === 0) return 0
  
  // Find the stack with the highest musical position + its duration
  return stacks.reduce((maxEnd, stack) => {
    const stackEnd = stack.musicalPosition + (stack.duration === 'whole' ? 3840 :
                     stack.duration === 'half' ? 1920 :
                     stack.duration === 'quarter' ? 960 :
                     stack.duration === 'eighth' ? 480 : 240)
    return Math.max(maxEnd, stackEnd)
  }, 0)
}

/**
 * Get the note stack at a specific musical position
 * @param stacks - Array of NoteStack objects
 * @param position - Musical position in ticks
 * @returns NoteStack if found, undefined otherwise
 */
export const getStackAtPosition = (stacks: NoteStack[], position: number): NoteStack | undefined => {
  return stacks.find(stack => stack.musicalPosition === position)
}

/**
 * Validate that a NoteStack array is properly formatted
 * @param stacks - Array to validate
 * @returns True if valid, throws error if invalid
 */
export const validateNoteStacks = (stacks: NoteStack[]): boolean => {
  for (const stack of stacks) {
    // Check required fields
    if (!stack.id || typeof stack.musicalPosition !== 'number' || !stack.duration) {
      throw new Error(`Invalid NoteStack: missing required fields in stack ${stack.id}`)
    }
    
    // Check position is non-negative
    if (stack.musicalPosition < 0) {
      throw new Error(`Invalid musical position: ${stack.musicalPosition} in stack ${stack.id}`)
    }
    
    // Check notes array
    if (!Array.isArray(stack.notes) || stack.notes.length === 0) {
      throw new Error(`Invalid notes array in stack ${stack.id}`)
    }
    
    // Check each note
    for (const note of stack.notes) {
      if (typeof note.string !== 'number' || note.string < 0 || note.string > 2) {
        throw new Error(`Invalid string ${note.string} in stack ${stack.id}`)
      }
      if (typeof note.fret !== 'number' || note.fret < 0 || note.fret > 12) {
        throw new Error(`Invalid fret ${note.fret} in stack ${stack.id}`)
      }
    }
  }
  
  return true
} 