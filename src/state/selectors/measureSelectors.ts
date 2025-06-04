// Measure Calculation Selectors
// Pure functions that compute measure boundaries and related calculations

import type { Note } from '../../types'
import type { MeasureBoundary, AppState } from '../types'
import { DURATION_VALUES, getNoteDurationValue } from '../../types'

/**
 * Calculate measure boundaries based on time signature and note durations
 * Pure function - no side effects, deterministic output
 */
export const selectMeasures = (
  notes: Note[], 
  timeSignature: [number, number]
): MeasureBoundary[] => {
  const [beatsPerMeasure, beatNote] = timeSignature
  const measures: MeasureBoundary[] = []
  
  if (notes.length === 0) {
    return measures
  }
  
  let currentBeat = 0
  let currentMeasure = 1
  let lastSlotChecked = -1
  
  // Sort notes by start slot to ensure proper ordering
  const sortedNotes = [...notes].sort((a, b) => a.startSlot - b.startSlot)
  
  // Process each note to find measure boundaries
  sortedNotes.forEach((note, index) => {
    const noteStart = note.startSlot
    const noteDuration = getNoteDurationValue(note.duration, note.isDotted)
    const noteBeats = noteDuration * (4 / beatNote) // Convert to beats based on beat note
    
    // If there's a gap between notes, account for empty time
    if (noteStart > lastSlotChecked + 1) {
      const gapSlots = noteStart - lastSlotChecked - 1
      const gapBeats = gapSlots * 0.25 * (4 / beatNote) // Each slot is a sixteenth note
      currentBeat += gapBeats
    }
    
    // Check if we need to start a new measure before this note
    while (currentBeat >= beatsPerMeasure) {
      measures.push({
        startSlot: noteStart,
        beat: currentBeat % beatsPerMeasure,
        type: 'calculated',
        measureNumber: currentMeasure
      })
      currentBeat -= beatsPerMeasure
      currentMeasure++
    }
    
    // Add the note's duration to our beat count
    currentBeat += noteBeats
    lastSlotChecked = noteStart + Math.round(noteDuration * 4) // Duration in slots
  })
  
  return measures
}

/**
 * Calculate custom measure boundaries from user-placed measure lines
 */
export const selectCustomMeasures = (
  customMeasureLines: AppState['customMeasureLines']
): MeasureBoundary[] => {
  return customMeasureLines.map((line, index) => ({
    startSlot: line.slot,
    beat: 0, // Custom measures start at beat 0
    type: 'custom' as const,
    measureNumber: line.measureNumber || index + 1
  })).sort((a, b) => a.startSlot - b.startSlot)
}

/**
 * Combine automatic and custom measures, with custom taking precedence
 */
export const selectAllMeasures = (
  notes: Note[],
  timeSignature: [number, number],
  customMeasureLines: AppState['customMeasureLines']
): MeasureBoundary[] => {
  const customMeasures = selectCustomMeasures(customMeasureLines)
  
  // If we have custom measures, use those and disable automatic calculation
  if (customMeasures.length > 0) {
    return customMeasures
  }
  
  // Otherwise, use automatic measure calculation
  return selectMeasures(notes, timeSignature)
}

/**
 * Calculate pickup measure information
 * Returns the number of beats before the first measure line
 */
export const selectPickupBeats = (
  measures: MeasureBoundary[],
  timeSignature: [number, number]
): number => {
  if (measures.length === 0) return 0
  
  const firstMeasure = measures[0]
  const [beatsPerMeasure] = timeSignature
  
  // If the first measure doesn't start at slot 0, we have a pickup
  if (firstMeasure.startSlot > 0) {
    const pickupSlots = firstMeasure.startSlot
    const pickupBeats = pickupSlots * 0.25 // Each slot is a sixteenth note (0.25 beats)
    return Math.min(pickupBeats, beatsPerMeasure - 1)
  }
  
  return 0
}

/**
 * Get the measure number for a given time slot
 */
export const selectMeasureAtSlot = (
  timeSlot: number,
  measures: MeasureBoundary[]
): number => {
  if (measures.length === 0) return 1
  
  // Find the last measure that starts at or before this slot
  let measureNumber = 1
  for (const measure of measures) {
    if (measure.startSlot <= timeSlot) {
      measureNumber = measure.measureNumber || measureNumber
    } else {
      break
    }
  }
  
  return measureNumber
}

/**
 * Calculate the total number of measures in the tablature
 */
export const selectTotalMeasures = (
  notes: Note[],
  measures: MeasureBoundary[],
  timeSignature: [number, number]
): number => {
  if (notes.length === 0) return 1
  if (measures.length === 0) return 1
  
  // Find the last note
  const lastNote = notes.reduce((latest, note) => {
    const noteEnd = note.startSlot + Math.round(getNoteDurationValue(note.duration, note.isDotted) * 4)
    const latestEnd = latest.startSlot + Math.round(getNoteDurationValue(latest.duration, latest.isDotted) * 4)
    return noteEnd > latestEnd ? note : latest
  })
  
  const lastSlot = lastNote.startSlot + Math.round(getNoteDurationValue(lastNote.duration, lastNote.isDotted) * 4)
  
  // Count measures up to the last note
  return selectMeasureAtSlot(lastSlot, measures)
}

/**
 * Check if a given slot position is at the start of a measure
 */
export const selectIsSlotAtMeasureStart = (
  timeSlot: number,
  measures: MeasureBoundary[]
): boolean => {
  return measures.some(measure => measure.startSlot === timeSlot)
}

/**
 * Get the distance in slots to the next measure boundary
 */
export const selectSlotsToNextMeasure = (
  timeSlot: number,
  measures: MeasureBoundary[]
): number => {
  const nextMeasure = measures.find(measure => measure.startSlot > timeSlot)
  return nextMeasure ? nextMeasure.startSlot - timeSlot : Infinity
}

/**
 * Get the distance in slots to the previous measure boundary
 */
export const selectSlotsToPreviousMeasure = (
  timeSlot: number,
  measures: MeasureBoundary[]
): number => {
  const previousMeasures = measures.filter(measure => measure.startSlot < timeSlot)
  if (previousMeasures.length === 0) return timeSlot
  
  const lastMeasure = previousMeasures[previousMeasures.length - 1]
  return timeSlot - lastMeasure.startSlot
} 