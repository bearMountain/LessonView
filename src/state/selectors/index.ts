// Selector Index - Centralized exports with memoization utilities
// This file provides memoized versions of all selectors for optimal performance

import { useMemo } from 'react'
import type { AppState } from '../types'

// Export all selectors
export * from './measureSelectors'
export * from './visualSelectors'
export * from './playbackSelectors'

// Import selectors for memoization
import {
  selectMeasures,
  selectCustomMeasures,
  selectAllMeasures,
  selectPickupBeats,
  selectTotalMeasures
} from './measureSelectors'

import {
  selectVisualLayout,
  selectVisualOffsets,
  selectStringPositions,
  selectClosestSlot,
  selectClosestString
} from './visualSelectors'

import {
  selectAudioEvents,
  selectTotalPlaybackDuration,
  selectNotesPlayingAtTime,
  selectCountInEvents,
  selectPlaybackSlot,
  selectCurrentlyPlayingNotes
} from './playbackSelectors'

// Memoized selector hooks for React components
// These hooks automatically memoize selector results based on dependencies

/**
 * Memoized measure calculations
 */
export const useMemoizedMeasures = (
  notes: AppState['notes'],
  timeSignature: AppState['timeSignature'],
  customMeasureLines: AppState['customMeasureLines']
) => {
  return useMemo(() => {
    return selectAllMeasures(notes, timeSignature, customMeasureLines)
  }, [notes, timeSignature, customMeasureLines])
}

/**
 * Memoized visual layout calculations
 */
export const useMemoizedVisualLayout = (
  notes: AppState['notes'],
  measures: ReturnType<typeof selectAllMeasures>,
  selection: AppState['selection'],
  zoom: AppState['zoom']
) => {
  return useMemo(() => {
    return selectVisualLayout(notes, measures, selection, zoom)
  }, [notes, measures, selection, zoom])
}

/**
 * Memoized audio events for playback
 */
export const useMemoizedAudioEvents = (
  notes: AppState['notes'],
  tempo: AppState['tempo'],
  playbackPosition: AppState['playbackPosition']
) => {
  return useMemo(() => {
    return selectAudioEvents(notes, tempo, playbackPosition)
  }, [notes, tempo, playbackPosition])
}

/**
 * Memoized playback duration calculation
 */
export const useMemoizedPlaybackDuration = (
  notes: AppState['notes'],
  tempo: AppState['tempo']
) => {
  return useMemo(() => {
    return selectTotalPlaybackDuration(notes, tempo)
  }, [notes, tempo])
}

/**
 * Memoized string positions for consistent layout
 */
export const useMemoizedStringPositions = (zoom: AppState['zoom']) => {
  return useMemo(() => {
    return selectStringPositions(zoom)
  }, [zoom])
}

/**
 * Memoized pickup beats calculation
 */
export const useMemoizedPickupBeats = (
  measures: ReturnType<typeof selectAllMeasures>,
  timeSignature: AppState['timeSignature']
) => {
  return useMemo(() => {
    return selectPickupBeats(measures, timeSignature)
  }, [measures, timeSignature])
}

/**
 * Memoized count-in events
 */
export const useMemoizedCountInEvents = (
  timeSignature: AppState['timeSignature'],
  tempo: AppState['tempo'],
  countInEnabled: AppState['countIn']
) => {
  return useMemo(() => {
    if (!countInEnabled) return []
    return selectCountInEvents(timeSignature, tempo)
  }, [timeSignature, tempo, countInEnabled])
}

/**
 * Memoized currently playing notes for visual feedback
 */
export const useMemoizedCurrentlyPlayingNotes = (
  audioEvents: ReturnType<typeof selectAudioEvents>,
  currentTime: number
) => {
  return useMemo(() => {
    return selectCurrentlyPlayingNotes(audioEvents, currentTime)
  }, [audioEvents, currentTime])
}

// Utility type for memoized selector dependencies
export type SelectorDependencies = {
  notes: AppState['notes']
  tempo: AppState['tempo']
  timeSignature: AppState['timeSignature']
  customMeasureLines: AppState['customMeasureLines']
  selection: AppState['selection']
  zoom: AppState['zoom']
  playbackPosition: AppState['playbackPosition']
  countIn: AppState['countIn']
  isPlaying: AppState['isPlaying']
}

/**
 * Master memoized selector that combines commonly used calculations
 * This is useful for components that need multiple related calculations
 */
export const useMemoizedAppSelectors = (state: AppState) => {
  // Calculate measures first (other selectors depend on this)
  const measures = useMemoizedMeasures(
    state.notes, 
    state.timeSignature, 
    state.customMeasureLines
  )
  
  // Calculate visual layout
  const visualLayout = useMemoizedVisualLayout(
    state.notes,
    measures,
    state.selection,
    state.zoom
  )
  
  // Calculate audio events
  const audioEvents = useMemoizedAudioEvents(
    state.notes,
    state.tempo,
    state.playbackPosition
  )
  
  // Calculate playback duration
  const playbackDuration = useMemoizedPlaybackDuration(
    state.notes,
    state.tempo
  )
  
  // Calculate pickup beats
  const pickupBeats = useMemoizedPickupBeats(
    measures,
    state.timeSignature
  )
  
  // Calculate count-in events
  const countInEvents = useMemoizedCountInEvents(
    state.timeSignature,
    state.tempo,
    state.countIn
  )
  
  return {
    measures,
    visualLayout,
    audioEvents,
    playbackDuration,
    pickupBeats,
    countInEvents
  }
}

// Performance monitoring utilities (development only)
const isDevelopment = process.env.NODE_ENV === 'development'

/**
 * Utility to measure selector performance in development
 */
export const measureSelectorPerformance = <T>(
  selectorName: string,
  selectorFn: () => T
): T => {
  if (!isDevelopment) {
    return selectorFn()
  }
  
  const startTime = performance.now()
  const result = selectorFn()
  const endTime = performance.now()
  const duration = endTime - startTime
  
  if (duration > 10) { // Log slow selectors (>10ms)
    console.warn(`Selector ${selectorName} took ${duration.toFixed(2)}ms`)
  }
  
  return result
}

/**
 * Wrapper for memoized selectors with performance monitoring
 */
export const createMemoizedSelector = <Args extends readonly unknown[], Return>(
  selectorFn: (...args: Args) => Return,
  selectorName: string
) => {
  return (...args: Args): Return => {
    return useMemo(() => {
      return measureSelectorPerformance(selectorName, () => selectorFn(...args))
    }, [...args])
  }
} 