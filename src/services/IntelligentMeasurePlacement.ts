import { DURATION_SLOTS } from '../types';
import type { TabData, Note, NoteDuration, CustomMeasureLine } from '../types';

// Musical context classification for note patterns
export interface MusicContext {
  firstNoteType: NoteDuration | null;
  firstNoteSlot: number;
  secondNoteType: NoteDuration | null;
  secondNoteSlot: number;
  measureLinePosition: number;
  visualAdjustment: number; // Additional visual slots needed
}

// Result of measure placement analysis
export interface MeasurePlacementResult {
  measureLineSlot: number;
  visualAdjustments: Array<{
    fromSlot: number;
    visualOffset: number;
  }>;
  preservesPlayback: boolean;
}

/**
 * Musical Context Analyzer
 * Analyzes note patterns around potential measure boundaries
 */
export class MusicalContextAnalyzer {
  /**
   * Analyze the musical context around a specific time slot
   */
  static analyzeContext(
    tabData: TabData, 
    timeSlot: number, 
    stringIndex: number = 0
  ): MusicContext {
    const firstNote = this.findNoteAtOrBefore(tabData, timeSlot);
    const secondNote = this.findNoteAtOrAfter(tabData, timeSlot);
    
    return {
      firstNoteType: firstNote?.duration || null,
      firstNoteSlot: firstNote?.startSlot ?? timeSlot,
      secondNoteType: secondNote?.duration || null,
      secondNoteSlot: secondNote?.startSlot ?? timeSlot,
      measureLinePosition: timeSlot,
      visualAdjustment: 0
    };
  }

  /**
   * Find the note at or immediately before the given slot
   */
  private static findNoteAtOrBefore(tabData: TabData, timeSlot: number): Note | null {
    // Look backwards from the given slot to find any active note
    for (let slot = timeSlot; slot >= 0; slot--) {
      if (slot >= tabData.length) continue;
      
      // Check all notes that start at this slot
      for (const note of tabData[slot].notes) {
        const noteEndSlot = note.startSlot + DURATION_SLOTS[note.duration];
        // Check if this note is active at the timeSlot
        if (note.startSlot <= timeSlot && timeSlot < noteEndSlot) {
          return note;
        }
        // If we found a note that starts at or before timeSlot, but doesn't contain it,
        // it's still the most recent note before timeSlot
        if (note.startSlot <= timeSlot) {
          return note;
        }
      }
    }
    return null;
  }

  /**
   * Find the note at or immediately after the given slot
   */
  private static findNoteAtOrAfter(tabData: TabData, timeSlot: number): Note | null {
    for (let slot = timeSlot; slot < tabData.length; slot++) {
      if (tabData[slot] && tabData[slot].notes.length > 0) {
        // Return the first note that starts at or after the timeSlot
        const notes = tabData[slot].notes;
        for (const note of notes) {
          if (note.startSlot >= timeSlot) {
            return note;
          }
        }
      }
    }
    return null;
  }
}

/**
 * Measure Placement Engine
 * Determines measure line positions based on deterministic rules from use cases
 */
export class MeasurePlacementEngine {
  /**
   * Apply placement rules based on note types using the use case rules:
   * [W--------------|-*---------------] -> [W--------------|-*---------------]
   * [H-------*-------] -> [H------|-*-------]  
   * [Q---*---] -> [Q--|-*---]
   * [E-*-] -> [E-|-*-]
   * [S*] -> [S-|-*]
   */
  static calculatePlacement(context: MusicContext): MeasurePlacementResult {
    if (!context.firstNoteType) {
      // No note context - use default placement
      return {
        measureLineSlot: context.measureLinePosition,
        visualAdjustments: [],
        preservesPlayback: true
      };
    }

    const firstNoteEndSlot = context.firstNoteSlot + DURATION_SLOTS[context.firstNoteType];
    let measureLineSlot: number;
    let visualAdjustment = 0;

    switch (context.firstNoteType) {
      case 'whole':
        // [W--------------|-*] -> Line at end of whole note (no visual adjustment)
        measureLineSlot = firstNoteEndSlot;
        break;
        
      case 'half':
        // [H------|-*] -> Line 1 slot before end of half note
        measureLineSlot = firstNoteEndSlot - 1;
        break;
        
      case 'quarter':
        // [Q--|-*] -> Line 1 slot before end of quarter note
        measureLineSlot = firstNoteEndSlot - 1;
        break;
        
      case 'eighth':
        // [E-|-*] -> Line 1 slot after start of eighth note, with visual adjustment
        measureLineSlot = context.firstNoteSlot + 1;
        visualAdjustment = 1; // Add visual slot for spacing
        break;
        
      case 'sixteenth':
        // [S-|-*] -> Line 1 slot after start of sixteenth note
        measureLineSlot = context.firstNoteSlot + 1;
        visualAdjustment = 1; // Add visual slot for spacing
        break;
        
      default:
        measureLineSlot = context.measureLinePosition;
    }

    const visualAdjustments = visualAdjustment > 0 ? [{
      fromSlot: measureLineSlot,
      visualOffset: visualAdjustment
    }] : [];

    return {
      measureLineSlot,
      visualAdjustments,
      preservesPlayback: true // Visual adjustments don't affect playback timing
    };
  }
}

/**
 * Note Movement System  
 * Handles note positioning adjustments around measure boundaries
 */
export class NoteMovementSystem {
  /**
   * Apply visual adjustments to notes without affecting playback timing
   */
  static applyVisualAdjustments(
    tabData: TabData,
    adjustments: Array<{ fromSlot: number; visualOffset: number }>
  ): Map<number, number> {
    const visualOffsets = new Map<number, number>();
    
    adjustments.forEach(adjustment => {
      // Apply visual offset to all notes at or after the adjustment point
      for (let slot = adjustment.fromSlot; slot < tabData.length; slot++) {
        const currentOffset = visualOffsets.get(slot) || 0;
        visualOffsets.set(slot, currentOffset + adjustment.visualOffset);
      }
    });
    
    return visualOffsets;
  }

  /**
   * Calculate the visual position for a note, including any adjustments
   */
  static getVisualPosition(
    note: Note,
    visualOffsets: Map<number, number>
  ): number {
    const offset = visualOffsets.get(note.startSlot) || 0;
    return note.startSlot + offset;
  }
}

/**
 * Visual-Playback Mapping
 * Maintains relationship between visual positions and playback timing
 */
export class VisualPlaybackMapper {
  private visualOffsets: Map<number, number> = new Map();
  
  constructor() {}
  
  /**
   * Set visual adjustments for the entire tab
   */
  setVisualAdjustments(adjustments: Array<{ fromSlot: number; visualOffset: number }>): void {
    this.visualOffsets = NoteMovementSystem.applyVisualAdjustments([], adjustments);
  }
  
  /**
   * Convert visual position to playback position
   */
  visualToPlayback(visualSlot: number): number {
    // Find the highest slot with offset <= visualSlot
    let playbackSlot = visualSlot;
    
    for (const [slot, offset] of this.visualOffsets.entries()) {
      if (slot + offset <= visualSlot) {
        playbackSlot = visualSlot - offset;
      }
    }
    
    return Math.max(0, playbackSlot);
  }
  
  /**
   * Convert playback position to visual position  
   */
  playbackToVisual(playbackSlot: number): number {
    const offset = this.visualOffsets.get(playbackSlot) || 0;
    return playbackSlot + offset;
  }
  
  /**
   * Get visual offset for a specific slot
   */
  getVisualOffset(slot: number): number {
    return this.visualOffsets.get(slot) || 0;
  }
}

/**
 * Main Intelligent Measure Placement System
 * Coordinates all components to provide intelligent measure placement
 */
export class IntelligentMeasurePlacement {
  private mapper: VisualPlaybackMapper;
  
  constructor() {
    this.mapper = new VisualPlaybackMapper();
  }
  
  /**
   * Calculate intelligent measure boundaries for the entire tab
   */
  calculateMeasureBoundaries(
    tabData: TabData, 
    customMeasureLines: CustomMeasureLine[] = [],
    timeSignature: string = '4/4'
  ): number[] {
    const boundaries: number[] = [];
    const slotsPerMeasure = 16; // 4 beats * 4 sixteenth notes per beat
    
    // Handle existing custom measure lines first
    if (customMeasureLines.length > 0) {
      customMeasureLines.forEach(line => boundaries.push(line.slot));
      
      // Add intelligent boundaries after the last custom line
      const lastCustomSlot = Math.max(...customMeasureLines.map(line => line.slot));
      this.addIntelligentBoundariesAfter(tabData, boundaries, lastCustomSlot, slotsPerMeasure);
    } else {
      // Add intelligent boundaries for the entire tab
      this.addIntelligentBoundariesAfter(tabData, boundaries, 0, slotsPerMeasure);
    }
    
    return boundaries.sort((a, b) => a - b);
  }
  
  /**
   * Add intelligent measure boundaries after a given slot
   */
  private addIntelligentBoundariesAfter(
    tabData: TabData,
    boundaries: number[],
    fromSlot: number,
    slotsPerMeasure: number
  ): void {
    let currentSlot = fromSlot + slotsPerMeasure;
    
    while (currentSlot < tabData.length) {
      // Analyze musical context around this potential boundary
      const context = MusicalContextAnalyzer.analyzeContext(tabData, currentSlot);
      
      // Apply intelligent placement rules
      const placement = MeasurePlacementEngine.calculatePlacement(context);
      
      // Use the calculated placement instead of rigid interval
      boundaries.push(placement.measureLineSlot);
      
      // Apply visual adjustments
      if (placement.visualAdjustments.length > 0) {
        this.mapper.setVisualAdjustments(placement.visualAdjustments);
      }
      
      // Move to next potential measure boundary
      currentSlot = placement.measureLineSlot + slotsPerMeasure;
    }
  }
  
  /**
   * Calculate intelligent placement for a single measure line
   */
  calculateSingleMeasurePlacement(
    tabData: TabData,
    targetSlot: number,
    stringIndex: number = 0
  ): MeasurePlacementResult {
    const context = MusicalContextAnalyzer.analyzeContext(tabData, targetSlot, stringIndex);
    return MeasurePlacementEngine.calculatePlacement(context);
  }
  
  /**
   * Get visual mapper for position calculations
   */
  getVisualMapper(): VisualPlaybackMapper {
    return this.mapper;
  }
} 