import { IntelligentMeasurePlacement, MusicalContextAnalyzer, MeasurePlacementEngine } from './IntelligentMeasurePlacement';
import type { TabData, Note } from '../types';

// Test helper to create a note
const createNote = (fret: number, stringIndex: number, startSlot: number, duration: 'whole' | 'half' | 'quarter' | 'eighth' | 'sixteenth'): Note => ({
  type: 'note',
  fret,
  duration,
  stringIndex,
  startSlot,
});

// Test helper to create tab data with notes
const createTabData = (notes: Note[]): TabData => {
  const tabData: TabData = [];
  
  notes.forEach(note => {
    // Ensure the tab data is large enough
    while (tabData.length <= note.startSlot) {
      tabData.push({ notes: [] });
    }
    
    tabData[note.startSlot].notes.push(note);
  });
  
  return tabData;
};

describe('IntelligentMeasurePlacement', () => {
  let placement: IntelligentMeasurePlacement;

  beforeEach(() => {
    placement = new IntelligentMeasurePlacement();
  });

  describe('MusicalContextAnalyzer', () => {
    test('should analyze eighth note context correctly', () => {
      // Create: [E-*-] (eighth note at slot 0-1)
      const notes = [createNote(0, 0, 0, 'eighth')];
      const tabData = createTabData(notes);
      
      // When analyzing at slot 1 (end of eighth note), should find the eighth note at slot 0
      const context = MusicalContextAnalyzer.analyzeContext(tabData, 1);
      
      expect(context.firstNoteType).toBe('eighth');
      expect(context.firstNoteSlot).toBe(0);
    });

    test('should analyze quarter note context correctly', () => {
      // Create: [Q---*] (quarter note at slot 0-3)
      const notes = [createNote(0, 0, 0, 'quarter')];
      const tabData = createTabData(notes);
      
      // When analyzing at slot 3 (end of quarter note), should find the quarter note at slot 0
      const context = MusicalContextAnalyzer.analyzeContext(tabData, 3);
      
      expect(context.firstNoteType).toBe('quarter');
      expect(context.firstNoteSlot).toBe(0);
    });
  });

  describe('MeasurePlacementEngine', () => {
    test('should place measure line for eighth note pattern: [E-*] -> [E-|-*]', () => {
      const context = {
        firstNoteType: 'eighth' as const,
        firstNoteSlot: 0,
        secondNoteType: null,
        secondNoteSlot: 2,
        measureLinePosition: 2,
        visualAdjustment: 0
      };
      
      const result = MeasurePlacementEngine.calculatePlacement(context);
      
      // According to use case: [E-|-*] means line at slot 1 (1 slot after start)
      expect(result.measureLineSlot).toBe(1);
      expect(result.visualAdjustments).toHaveLength(1);
      expect(result.visualAdjustments[0].visualOffset).toBe(1);
      expect(result.preservesPlayback).toBe(true);
    });

    test('should place measure line for quarter note pattern: [Q---*] -> [Q--|-*]', () => {
      const context = {
        firstNoteType: 'quarter' as const,
        firstNoteSlot: 0,
        secondNoteType: null,
        secondNoteSlot: 4,
        measureLinePosition: 4,
        visualAdjustment: 0
      };
      
      const result = MeasurePlacementEngine.calculatePlacement(context);
      
      // According to use case: [Q--|-*] means line at slot 3 (1 slot before end)
      expect(result.measureLineSlot).toBe(3);
      expect(result.visualAdjustments).toHaveLength(0); // Quarter notes don't need visual adjustment
      expect(result.preservesPlayback).toBe(true);
    });

    test('should place measure line for half note pattern: [H-------*] -> [H------|-*]', () => {
      const context = {
        firstNoteType: 'half' as const,
        firstNoteSlot: 0,
        secondNoteType: null,
        secondNoteSlot: 8,
        measureLinePosition: 8,
        visualAdjustment: 0
      };
      
      const result = MeasurePlacementEngine.calculatePlacement(context);
      
      // According to use case: [H------|-*] means line at slot 7 (1 slot before end)
      expect(result.measureLineSlot).toBe(7);
      expect(result.visualAdjustments).toHaveLength(0); // Half notes don't need visual adjustment
      expect(result.preservesPlayback).toBe(true);
    });
  });

  describe('IntelligentMeasurePlacement integration', () => {
    test('should create intelligent boundaries for eighth note sequence', () => {
      // Create a sequence of eighth notes filling more than one measure (16+ slots)
      const notes = [
        createNote(0, 0, 0, 'eighth'),   // Slot 0-1
        createNote(0, 0, 2, 'eighth'),   // Slot 2-3  
        createNote(0, 0, 4, 'eighth'),   // Slot 4-5
        createNote(0, 0, 6, 'eighth'),   // Slot 6-7
        createNote(0, 0, 8, 'eighth'),   // Slot 8-9
        createNote(0, 0, 10, 'eighth'),  // Slot 10-11
        createNote(0, 0, 12, 'eighth'),  // Slot 12-13
        createNote(0, 0, 14, 'eighth'),  // Slot 14-15 (end of first measure)
        createNote(0, 0, 16, 'eighth'),  // Slot 16-17 (start of second measure)
        createNote(0, 0, 18, 'eighth'),  // Slot 18-19
        createNote(0, 0, 20, 'eighth'),  // Slot 20-21
      ];
      const tabData = createTabData(notes);
      
      const boundaries = placement.calculateMeasureBoundaries(tabData);
      
      // Should have at least one boundary for the second measure
      expect(boundaries.length).toBeGreaterThan(0);
      
      // Log for debugging
      console.log('Calculated boundaries:', boundaries);
      console.log('Tab data length:', tabData.length);
    });

    test('should calculate single measure placement correctly', () => {
      // Create: [E-*-] at slot 14-15, analyzing where measure line should go at end of measure
      const notes = [createNote(0, 0, 14, 'eighth')];
      const tabData = createTabData(notes);
      
      // According to use case [E-*] -> [E-|-*], measure line should go 1 slot after start
      const result = placement.calculateSingleMeasurePlacement(tabData, 15); // Analyze at note end
      
      // Should place line at slot 15 (1 after start of eighth note at 14)
      expect(result.measureLineSlot).toBe(15);
      expect(result.visualAdjustments).toHaveLength(1);
      expect(result.visualAdjustments[0].visualOffset).toBe(1);
    });
  });
}); 