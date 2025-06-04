// Tests for Selector Functions
import { describe, it, expect } from '@jest/globals'
import {
  selectMeasures,
  selectCustomMeasures,
  selectAllMeasures,
  selectPickupBeats
} from './measureSelectors'
import {
  selectVisualLayout,
  selectStringY,
  selectNoteVisualWidth,
  selectClosestSlot,
  selectClosestString
} from './visualSelectors'
import {
  selectNoteFrequency,
  selectAudioEvents,
  selectTotalPlaybackDuration,
  selectPlaybackSlot,
  selectCountInEvents
} from './playbackSelectors'
import type { Note, CustomMeasureLine } from '../../types'
import type { MeasureBoundary } from '../types'

describe('Measure Selectors', () => {
  describe('selectMeasures', () => {
    it('should calculate measure boundaries for 4/4 time', () => {
      const notes: Note[] = [
        { type: 'note', fret: 5, duration: 'whole', stringIndex: 2, startSlot: 0 },
        { type: 'note', fret: 7, duration: 'whole', stringIndex: 1, startSlot: 16 }
      ]
      
      const measures = selectMeasures(notes, [4, 4])
      
      expect(measures).toHaveLength(1)
      expect(measures[0].startSlot).toBe(16)
      expect(measures[0].measureNumber).toBe(1)
    })

    it('should handle empty notes array', () => {
      const measures = selectMeasures([], [4, 4])
      expect(measures).toHaveLength(0)
    })

    it('should calculate measures for 3/4 time', () => {
      const notes: Note[] = [
        { type: 'note', fret: 5, duration: 'quarter', stringIndex: 2, startSlot: 0 },
        { type: 'note', fret: 7, duration: 'quarter', stringIndex: 1, startSlot: 4 },
        { type: 'note', fret: 3, duration: 'quarter', stringIndex: 0, startSlot: 8 },
        { type: 'note', fret: 5, duration: 'quarter', stringIndex: 2, startSlot: 12 }
      ]
      
      const measures = selectMeasures(notes, [3, 4])
      
      expect(measures).toHaveLength(1)
      expect(measures[0].startSlot).toBe(12)
    })
  })

  describe('selectCustomMeasures', () => {
    it('should convert custom measure lines to boundaries', () => {
      const customLines: CustomMeasureLine[] = [
        { slot: 8, measureNumber: 2 },
        { slot: 16, measureNumber: 3 }
      ]
      
      const measures = selectCustomMeasures(customLines)
      
      expect(measures).toHaveLength(2)
      expect(measures[0].startSlot).toBe(8)
      expect(measures[0].type).toBe('custom')
      expect(measures[1].startSlot).toBe(16)
    })

    it('should sort custom measures by slot', () => {
      const customLines: CustomMeasureLine[] = [
        { slot: 16, measureNumber: 3 },
        { slot: 8, measureNumber: 2 }
      ]
      
      const measures = selectCustomMeasures(customLines)
      
      expect(measures[0].startSlot).toBe(8)
      expect(measures[1].startSlot).toBe(16)
    })
  })

  describe('selectPickupBeats', () => {
    it('should calculate pickup beats when first measure starts after slot 0', () => {
      const measures: MeasureBoundary[] = [
        { startSlot: 2, beat: 0, type: 'custom', measureNumber: 1 }
      ]
      
      const pickupBeats = selectPickupBeats(measures, [4, 4])
      
      expect(pickupBeats).toBe(0.5) // 2 slots = 0.5 beats
    })

    it('should return 0 when no pickup', () => {
      const measures: MeasureBoundary[] = [
        { startSlot: 0, beat: 0, type: 'custom', measureNumber: 1 }
      ]
      
      const pickupBeats = selectPickupBeats(measures, [4, 4])
      
      expect(pickupBeats).toBe(0)
    })
  })
})

describe('Visual Selectors', () => {
  describe('selectStringY', () => {
    it('should calculate Y positions for strings', () => {
      // Hi D string (index 2) should be on top
      expect(selectStringY(2, 1.0)).toBe(40) // TOP_MARGIN
      
      // A string (index 1) should be in middle  
      expect(selectStringY(1, 1.0)).toBe(100) // TOP_MARGIN + STRING_SPACING
      
      // Low D string (index 0) should be on bottom
      expect(selectStringY(0, 1.0)).toBe(160) // TOP_MARGIN + 2 * STRING_SPACING
    })

    it('should scale with zoom', () => {
      const baseY = selectStringY(2, 1.0)
      const zoomedY = selectStringY(2, 2.0)
      
      expect(zoomedY).toBe(baseY * 2)
    })
  })

  describe('selectNoteVisualWidth', () => {
    it('should calculate width based on duration', () => {
      const quarterWidth = selectNoteVisualWidth('quarter', false, 1.0)
      const halfWidth = selectNoteVisualWidth('half', false, 1.0)
      
      expect(halfWidth).toBe(quarterWidth * 2)
    })

    it('should increase width for dotted notes', () => {
      const normalWidth = selectNoteVisualWidth('quarter', false, 1.0)
      const dottedWidth = selectNoteVisualWidth('quarter', true, 1.0)
      
      expect(dottedWidth).toBe(normalWidth * 1.5)
    })
  })

  describe('selectVisualLayout', () => {
    it('should create visual layout with positioned notes', () => {
      const notes: Note[] = [
        { type: 'note', fret: 5, duration: 'quarter', stringIndex: 2, startSlot: 0 }
      ]
      const measures: MeasureBoundary[] = []
      const selection = [0]
      
      const layout = selectVisualLayout(notes, measures, selection, 1.0)
      
      expect(layout.notes).toHaveLength(1)
      expect(layout.notes[0].visualX).toBeGreaterThan(0)
      expect(layout.notes[0].visualY).toBe(40) // Hi D string
      expect(layout.notes[0].isSelected).toBe(true)
      expect(layout.totalWidth).toBeGreaterThan(0)
      expect(layout.stringPositions).toHaveLength(3)
    })
  })

  describe('selectClosestSlot', () => {
    it('should find closest slot to X coordinate', () => {
      const offsets = new Map([
        [0, 0],
        [1, 20],
        [2, 40],
        [3, 60]
      ])
      
      expect(selectClosestSlot(10 + 80, offsets, 1.0)).toBe(0)
      expect(selectClosestSlot(30 + 80, offsets, 1.0)).toBe(1)
      expect(selectClosestSlot(50 + 80, offsets, 1.0)).toBe(2)
    })
  })

  describe('selectClosestString', () => {
    it('should find closest string to Y coordinate', () => {
      // Test Y positions around string lines
      expect(selectClosestString(40, 1.0)).toBe(2) // Hi D
      expect(selectClosestString(100, 1.0)).toBe(1) // A
      expect(selectClosestString(160, 1.0)).toBe(0) // Low D
      
      // Test positions between strings
      expect(selectClosestString(70, 1.0)).toBe(1)
      expect(selectClosestString(130, 1.0)).toBe(0)
    })
  })
})

describe('Playback Selectors', () => {
  describe('selectNoteFrequency', () => {
    it('should calculate correct frequencies for strumstick tuning', () => {
      // Test open strings (fret 0)
      expect(selectNoteFrequency(0, 0)).toBeCloseTo(146.83, 1) // Low D
      expect(selectNoteFrequency(0, 1)).toBeCloseTo(220.00, 1) // A
      expect(selectNoteFrequency(0, 2)).toBeCloseTo(293.66, 1) // Hi D
      
      // Test fretted notes (12th fret = octave)
      expect(selectNoteFrequency(12, 0)).toBeCloseTo(146.83 * 2, 1) // Low D octave
    })

    it('should handle invalid string indices', () => {
      expect(selectNoteFrequency(0, -1)).toBe(146.83) // Default to Low D
      expect(selectNoteFrequency(0, 5)).toBe(146.83) // Default to Low D
    })
  })

  describe('selectAudioEvents', () => {
    it('should convert notes to audio events', () => {
      const notes: Note[] = [
        { type: 'note', fret: 5, duration: 'quarter', stringIndex: 2, startSlot: 0 },
        { type: 'rest', fret: null, duration: 'quarter', stringIndex: 1, startSlot: 4 },
        { type: 'note', fret: 7, duration: 'quarter', stringIndex: 1, startSlot: 8 }
      ]
      
      const events = selectAudioEvents(notes, 120, 0)
      
      expect(events).toHaveLength(2) // Rests should be filtered out
      expect(events[0].time).toBe(0) // First note starts immediately
      expect(events[0].fret).toBe(5)
      expect(events[1].time).toBe(1.0) // Second note at 8 slots = 2 beats = 1 second at 120 BPM
      expect(events[1].fret).toBe(7)
    })

    it('should adjust times relative to start position', () => {
      const notes: Note[] = [
        { type: 'note', fret: 5, duration: 'quarter', stringIndex: 2, startSlot: 8 }
      ]
      
      const events = selectAudioEvents(notes, 120, 4)
      
      expect(events).toHaveLength(1)
      expect(events[0].time).toBe(0.5) // (8-4) slots = 1 beat = 0.5 seconds at 120 BPM
    })
  })

  describe('selectTotalPlaybackDuration', () => {
    it('should calculate total duration including note lengths', () => {
      const notes: Note[] = [
        { type: 'note', fret: 5, duration: 'quarter', stringIndex: 2, startSlot: 0 },
        { type: 'note', fret: 7, duration: 'whole', stringIndex: 1, startSlot: 4 }
      ]
      
      const duration = selectTotalPlaybackDuration(notes, 120)
      
      // Note at slot 4 with whole duration = 1 + 4 = 5 beats = 2.5 seconds at 120 BPM
      expect(duration).toBe(2.5)
    })

    it('should return 0 for empty notes', () => {
      expect(selectTotalPlaybackDuration([], 120)).toBe(0)
    })
  })

  describe('selectPlaybackSlot', () => {
    it('should calculate current slot from playback time', () => {
      // At 120 BPM: 1 beat = 0.5 seconds, 1 slot = 0.125 seconds
      expect(selectPlaybackSlot(0, 120)).toBe(0)
      expect(selectPlaybackSlot(0.125, 120)).toBe(1)
      expect(selectPlaybackSlot(0.5, 120)).toBe(4) // 1 beat = 4 slots
      expect(selectPlaybackSlot(1.0, 120)).toBe(8) // 2 beats = 8 slots
    })
  })

  describe('selectCountInEvents', () => {
    it('should create count-in events with correct timing', () => {
      const events = selectCountInEvents([4, 4], 120, 4)
      
      expect(events).toHaveLength(4)
      expect(events[0].time).toBe(-2.0) // 4 beats before start at 120 BPM
      expect(events[1].time).toBe(-1.5) // 3 beats before start
      expect(events[2].time).toBe(-1.0) // 2 beats before start
      expect(events[3].time).toBe(-0.5) // 1 beat before start
      
      // First beat should be accented
      expect(events[0].frequency).toBe(880)
      expect(events[1].frequency).toBe(440)
    })
  })
}) 