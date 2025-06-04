// Visual Layout Selectors
// Pure functions that compute visual positioning and layout

import type { Note } from '../../types'
import type { MeasureBoundary, VisualLayout, VisualNote, VisualMeasure } from '../types'
import { getNoteDurationValue, DURATION_SLOTS } from '../../types'

// Visual constants that can be configured
const VISUAL_CONSTANTS = {
  STRING_SPACING: 60, // Base spacing between strings
  LEFT_MARGIN: 80,
  RIGHT_MARGIN: 80,
  TOP_MARGIN: 40,
  BOTTOM_MARGIN: 40,
  BASE_SLOT_WIDTH: 20, // Base width of each time slot
  MEASURE_LINE_EXTRA_SPACE: 20, // Extra space before measure lines
  MIN_NOTE_SPACING: 5, // Minimum space between notes
} as const

/**
 * Calculate Y position for a string based on its index
 */
export const selectStringY = (stringIndex: number, zoom: number = 1.0): number => {
  // Convert data index to display index (Hi D on top, Low D on bottom)
  const stringIndices = [2, 1, 0] // Display order: Hi D=2, A=1, Low D=0
  const displayIndex = stringIndices.indexOf(stringIndex)
  
  return (VISUAL_CONSTANTS.TOP_MARGIN + (displayIndex * VISUAL_CONSTANTS.STRING_SPACING)) * zoom
}

/**
 * Calculate all string Y positions
 */
export const selectStringPositions = (zoom: number = 1.0): number[] => {
  return [0, 1, 2].map(stringIndex => selectStringY(stringIndex, zoom))
}

/**
 * Calculate visual width for a note based on its duration
 */
export const selectNoteVisualWidth = (
  duration: Note['duration'], 
  isDotted: boolean = false,
  zoom: number = 1.0
): number => {
  const baseDuration = getNoteDurationValue(duration, isDotted)
  const baseWidth = baseDuration * VISUAL_CONSTANTS.BASE_SLOT_WIDTH
  return baseWidth * zoom
}

/**
 * Calculate intelligent visual offsets for better spacing
 * This replaces the VisualOffsetManager logic with pure functions
 */
export const selectVisualOffsets = (
  notes: Note[],
  measures: MeasureBoundary[],
  zoom: number = 1.0
): Map<number, number> => {
  const offsets = new Map<number, number>()
  let currentOffset = 0
  
  // Sort notes by start slot
  const sortedNotes = [...notes].sort((a, b) => a.startSlot - b.startSlot)
  
  // Find the maximum slot we need to consider
  const maxSlot = Math.max(
    sortedNotes.length > 0 
      ? Math.max(...sortedNotes.map(note => note.startSlot + DURATION_SLOTS[note.duration]))
      : 0,
    measures.length > 0 
      ? Math.max(...measures.map(m => m.startSlot))
      : 0
  )
  
  // Calculate offset for each slot
  for (let slot = 0; slot <= maxSlot; slot++) {
    // Check if this slot has a measure line
    const hasMeasureLine = measures.some(m => m.startSlot === slot)
    if (hasMeasureLine && slot > 0) {
      currentOffset += VISUAL_CONSTANTS.MEASURE_LINE_EXTRA_SPACE * zoom
    }
    
    // Set the offset for this slot
    offsets.set(slot, currentOffset)
    
    // Find notes that start at this slot to determine spacing for next slot
    const notesAtSlot = sortedNotes.filter(note => note.startSlot === slot)
    
    if (notesAtSlot.length > 0) {
      // Use the longest note duration at this slot to determine spacing
      const longestDuration = notesAtSlot.reduce((longest, note) => {
        const currentValue = getNoteDurationValue(note.duration, note.isDotted)
        const longestValue = getNoteDurationValue(longest.duration, longest.isDotted)
        return currentValue > longestValue ? note : longest
      })
      
      // Add spacing based on the note duration
      const noteWidth = selectNoteVisualWidth(longestDuration.duration, longestDuration.isDotted, zoom)
      currentOffset += Math.max(noteWidth, VISUAL_CONSTANTS.BASE_SLOT_WIDTH * zoom)
    } else {
      // No notes at this slot, use base spacing
      currentOffset += VISUAL_CONSTANTS.BASE_SLOT_WIDTH * zoom
    }
  }
  
  return offsets
}

/**
 * Calculate X position for a slot including visual offsets
 */
export const selectSlotX = (
  slot: number,
  offsets: Map<number, number>,
  zoom: number = 1.0
): number => {
  const leftMargin = VISUAL_CONSTANTS.LEFT_MARGIN * zoom
  const baseOffset = offsets.get(slot) || 0
  return leftMargin + baseOffset
}

/**
 * Calculate visual notes with positioning
 */
export const selectVisualNotes = (
  notes: Note[],
  selection: number[],
  offsets: Map<number, number>,
  zoom: number = 1.0
): VisualNote[] => {
  return notes.map((note, index) => ({
    ...note,
    visualX: selectSlotX(note.startSlot, offsets, zoom),
    visualY: selectStringY(note.stringIndex, zoom),
    slot: note.startSlot,
    isSelected: selection.includes(index)
  }))
}

/**
 * Calculate visual measures with positioning
 */
export const selectVisualMeasures = (
  measures: MeasureBoundary[],
  offsets: Map<number, number>,
  zoom: number = 1.0
): VisualMeasure[] => {
  return measures.map(measure => ({
    ...measure,
    visualX: selectSlotX(measure.startSlot, offsets, zoom)
  }))
}

/**
 * Calculate total visual width needed for the layout
 */
export const selectTotalWidth = (
  notes: Note[],
  measures: MeasureBoundary[],
  offsets: Map<number, number>,
  zoom: number = 1.0
): number => {
  const leftMargin = VISUAL_CONSTANTS.LEFT_MARGIN * zoom
  const rightMargin = VISUAL_CONSTANTS.RIGHT_MARGIN * zoom
  
  // Find the rightmost position
  let maxX = leftMargin
  
  // Check notes
  notes.forEach(note => {
    const noteX = selectSlotX(note.startSlot, offsets, zoom)
    const noteWidth = selectNoteVisualWidth(note.duration, note.isDotted, zoom)
    maxX = Math.max(maxX, noteX + noteWidth)
  })
  
  // Check measures
  measures.forEach(measure => {
    const measureX = selectSlotX(measure.startSlot, offsets, zoom)
    maxX = Math.max(maxX, measureX)
  })
  
  return maxX + rightMargin
}

/**
 * Calculate total visual height needed for the layout
 */
export const selectTotalHeight = (zoom: number = 1.0): number => {
  const topMargin = VISUAL_CONSTANTS.TOP_MARGIN * zoom
  const bottomMargin = VISUAL_CONSTANTS.BOTTOM_MARGIN * zoom
  const stringHeight = 2 * VISUAL_CONSTANTS.STRING_SPACING * zoom // 3 strings = 2 gaps
  
  return topMargin + stringHeight + bottomMargin
}

/**
 * Main visual layout selector - combines all visual calculations
 */
export const selectVisualLayout = (
  notes: Note[],
  measures: MeasureBoundary[],
  selection: number[],
  zoom: number = 1.0
): VisualLayout => {
  // Calculate visual offsets for intelligent spacing
  const offsets = selectVisualOffsets(notes, measures, zoom)
  
  // Calculate positioned elements
  const visualNotes = selectVisualNotes(notes, selection, offsets, zoom)
  const visualMeasures = selectVisualMeasures(measures, offsets, zoom)
  
  // Calculate layout dimensions
  const totalWidth = selectTotalWidth(notes, measures, offsets, zoom)
  const stringPositions = selectStringPositions(zoom)
  
  return {
    notes: visualNotes,
    measures: visualMeasures,
    totalWidth,
    stringPositions
  }
}

/**
 * Find the closest slot to a given X coordinate
 */
export const selectClosestSlot = (
  x: number,
  offsets: Map<number, number>,
  zoom: number = 1.0
): number => {
  const leftMargin = VISUAL_CONSTANTS.LEFT_MARGIN * zoom
  const relativeX = x - leftMargin
  
  let closestSlot = 0
  let minDistance = Infinity
  
  // Check each slot offset
  for (const [slot, offset] of offsets.entries()) {
    const distance = Math.abs(offset - relativeX)
    if (distance < minDistance) {
      minDistance = distance
      closestSlot = slot
    }
  }
  
  return Math.max(0, closestSlot)
}

/**
 * Find the closest string to a given Y coordinate
 */
export const selectClosestString = (
  y: number,
  zoom: number = 1.0
): number => {
  const stringPositions = selectStringPositions(zoom)
  
  let closestString = 2 // Default to Hi D string
  let minDistance = Infinity
  
  stringPositions.forEach((stringY, index) => {
    const distance = Math.abs(y - stringY)
    if (distance < minDistance) {
      minDistance = distance
      closestString = index
    }
  })
  
  return closestString
}

/**
 * Check if a point (x, y) is within a reasonable click distance of a note
 */
export const selectNoteAtPosition = (
  x: number,
  y: number,
  visualNotes: VisualNote[],
  zoom: number = 1.0
): VisualNote | null => {
  const clickRadius = 15 * zoom // Reasonable click target size
  
  return visualNotes.find(note => {
    const dx = x - note.visualX
    const dy = y - note.visualY
    const distance = Math.sqrt(dx * dx + dy * dy)
    return distance <= clickRadius
  }) || null
} 