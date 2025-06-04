// Playback Selectors
// Pure functions that compute audio events and playback-related calculations

import type { Note } from '../../types'
import type { AudioEvent } from '../types'
import { getNoteDurationValue, DURATION_SLOTS } from '../../types'

// Audio constants for strumstick tuning and timing
const AUDIO_CONSTANTS = {
  // Strumstick tuning: Low D, A, Hi D (in Hz)
  BASE_FREQUENCIES: [146.83, 220.00, 293.66], // D3, A3, D4
  BEATS_PER_MINUTE_TO_SECONDS: 60,
  SIXTEENTH_NOTE_BEATS: 0.25, // Sixteenth note = 0.25 beats
  DEFAULT_VELOCITY: 0.7,
  PREVIEW_NOTE_DURATION: 0.5, // Duration for preview notes in seconds
} as const

/**
 * Calculate frequency for a fret on a given string
 * Pure function for fret-to-frequency conversion
 */
export const selectNoteFrequency = (fret: number, stringIndex: number): number => {
  // Validate inputs
  if (stringIndex < 0 || stringIndex >= AUDIO_CONSTANTS.BASE_FREQUENCIES.length) {
    return AUDIO_CONSTANTS.BASE_FREQUENCIES[0] // Default to Low D
  }
  
  // Each fret is a semitone (12th root of 2)
  const basePitch = AUDIO_CONSTANTS.BASE_FREQUENCIES[stringIndex]
  return basePitch * Math.pow(2, fret / 12)
}

/**
 * Convert note duration to seconds based on tempo
 */
export const selectNoteDurationSeconds = (
  duration: Note['duration'],
  isDotted: boolean = false,
  tempo: number = 120
): number => {
  const beats = getNoteDurationValue(duration, isDotted)
  const secondsPerBeat = AUDIO_CONSTANTS.BEATS_PER_MINUTE_TO_SECONDS / tempo
  return beats * secondsPerBeat
}

/**
 * Calculate absolute time for a note based on its start slot and tempo
 */
export const selectNoteStartTime = (
  startSlot: number,
  tempo: number = 120
): number => {
  // Each slot is a sixteenth note
  const beats = startSlot * AUDIO_CONSTANTS.SIXTEENTH_NOTE_BEATS
  const secondsPerBeat = AUDIO_CONSTANTS.BEATS_PER_MINUTE_TO_SECONDS / tempo
  return beats * secondsPerBeat
}

/**
 * Convert a single note to an audio event
 */
export const selectNoteAudioEvent = (
  note: Note,
  tempo: number = 120,
  velocity: number = AUDIO_CONSTANTS.DEFAULT_VELOCITY
): AudioEvent | null => {
  // Skip rests and notes without frets
  if (note.type === 'rest' || note.fret === null) {
    return null
  }
  
  return {
    time: selectNoteStartTime(note.startSlot, tempo),
    frequency: selectNoteFrequency(note.fret, note.stringIndex),
    duration: selectNoteDurationSeconds(note.duration, note.isDotted, tempo),
    stringIndex: note.stringIndex,
    fret: note.fret,
    velocity
  }
}

/**
 * Convert all notes to audio events for playback
 */
export const selectAudioEvents = (
  notes: Note[],
  tempo: number = 120,
  startPosition: number = 0,
  velocity: number = AUDIO_CONSTANTS.DEFAULT_VELOCITY
): AudioEvent[] => {
  const startTime = selectNoteStartTime(startPosition, tempo)
  
  return notes
    .filter(note => note.startSlot >= startPosition) // Only notes at or after start position
    .map(note => selectNoteAudioEvent(note, tempo, velocity))
    .filter((event): event is AudioEvent => event !== null) // Remove null events
    .map(event => ({
      ...event,
      time: event.time - startTime // Adjust time relative to start position
    }))
    .sort((a, b) => a.time - b.time) // Sort by time
}

/**
 * Calculate total playback duration for a set of notes
 */
export const selectTotalPlaybackDuration = (
  notes: Note[],
  tempo: number = 120
): number => {
  if (notes.length === 0) return 0
  
  // Find the note that ends latest
  const lastEndTime = notes.reduce((maxTime, note) => {
    const noteStartTime = selectNoteStartTime(note.startSlot, tempo)
    const noteDuration = selectNoteDurationSeconds(note.duration, note.isDotted, tempo)
    const noteEndTime = noteStartTime + noteDuration
    return Math.max(maxTime, noteEndTime)
  }, 0)
  
  return lastEndTime
}

/**
 * Calculate which slot should be highlighted during playback at a given time
 */
export const selectPlaybackSlot = (
  currentTime: number,
  tempo: number = 120
): number => {
  const secondsPerBeat = AUDIO_CONSTANTS.BEATS_PER_MINUTE_TO_SECONDS / tempo
  const beats = currentTime / secondsPerBeat
  const slots = beats / AUDIO_CONSTANTS.SIXTEENTH_NOTE_BEATS
  return Math.floor(slots)
}

/**
 * Get notes that should be visually highlighted during playback
 */
export const selectNotesPlayingAtTime = (
  notes: Note[],
  currentTime: number,
  tempo: number = 120
): Note[] => {
  return notes.filter(note => {
    const noteStartTime = selectNoteStartTime(note.startSlot, tempo)
    const noteDuration = selectNoteDurationSeconds(note.duration, note.isDotted, tempo)
    const noteEndTime = noteStartTime + noteDuration
    
    return currentTime >= noteStartTime && currentTime < noteEndTime
  })
}

/**
 * Calculate count-in audio events
 */
export const selectCountInEvents = (
  timeSignature: [number, number] = [4, 4],
  tempo: number = 120,
  countInBeats: number = 4
): AudioEvent[] => {
  const events: AudioEvent[] = []
  const secondsPerBeat = AUDIO_CONSTANTS.BEATS_PER_MINUTE_TO_SECONDS / tempo
  const [beatsPerMeasure] = timeSignature
  
  // Create click events for count-in
  for (let i = 0; i < countInBeats; i++) {
    const isAccented = i % beatsPerMeasure === 0 // Accent first beat of measure
    
    events.push({
      time: -((countInBeats - i) * secondsPerBeat), // Negative time for count-in
      frequency: isAccented ? 880 : 440, // Higher pitch for accented beats
      duration: 0.1, // Short click sound
      stringIndex: -1, // Special value for count-in
      fret: -1, // Special value for count-in
      velocity: isAccented ? 0.8 : 0.6
    })
  }
  
  return events
}

/**
 * Calculate loop boundaries for looped playback
 */
export const selectLoopBoundaries = (
  notes: Note[],
  startSlot: number = 0,
  endSlot?: number
): { start: number; end: number } => {
  if (notes.length === 0) {
    return { start: 0, end: 16 } // Default to one measure
  }
  
  const actualEndSlot = endSlot ?? Math.max(...notes.map(note => 
    note.startSlot + DURATION_SLOTS[note.duration]
  ))
  
  return {
    start: startSlot,
    end: Math.max(actualEndSlot, startSlot + 1) // Ensure at least one slot
  }
}

/**
 * Calculate playback tempo adjustments for video sync
 */
export const selectSyncedTempo = (
  baseTempo: number,
  videoPlaybackRate: number = 1.0
): number => {
  return baseTempo * videoPlaybackRate
}

/**
 * Calculate audio events for preview note playback
 */
export const selectPreviewNoteEvent = (
  fret: number,
  stringIndex: number,
  velocity: number = AUDIO_CONSTANTS.DEFAULT_VELOCITY
): AudioEvent => {
  return {
    time: 0, // Immediate playback
    frequency: selectNoteFrequency(fret, stringIndex),
    duration: AUDIO_CONSTANTS.PREVIEW_NOTE_DURATION,
    stringIndex,
    fret,
    velocity
  }
}

/**
 * Calculate which notes are currently being played for visual feedback
 */
export const selectCurrentlyPlayingNotes = (
  audioEvents: AudioEvent[],
  currentTime: number
): AudioEvent[] => {
  return audioEvents.filter(event => {
    const eventEndTime = event.time + event.duration
    return currentTime >= event.time && currentTime < eventEndTime
  })
}

/**
 * Calculate scheduling information for audio engine
 */
export const selectSchedulingInfo = (
  audioEvents: AudioEvent[],
  currentTime: number,
  lookAheadTime: number = 0.1 // 100ms look-ahead
): {
  eventsToSchedule: AudioEvent[]
  eventsToStop: AudioEvent[]
} => {
  const scheduleWindow = currentTime + lookAheadTime
  
  const eventsToSchedule = audioEvents.filter(event => 
    event.time >= currentTime && event.time <= scheduleWindow
  )
  
  const eventsToStop = audioEvents.filter(event => {
    const eventEndTime = event.time + event.duration
    return eventEndTime >= currentTime && eventEndTime <= scheduleWindow
  })
  
  return { eventsToSchedule, eventsToStop }
} 