import type { TabData, CustomMeasureLine } from '../types';
import { IntelligentMeasurePlacement } from './IntelligentMeasurePlacement';

/**
 * Manages visual offsets for the entire application
 * Ensures intelligent measure placement visual adjustments are applied consistently
 */
export class VisualOffsetManager {
  private static instance: VisualOffsetManager | null = null;
  private visualOffsets: Map<number, number> = new Map();
  private intelligentPlacement: IntelligentMeasurePlacement;

  private constructor() {
    this.intelligentPlacement = new IntelligentMeasurePlacement();
  }

  static getInstance(): VisualOffsetManager {
    if (!VisualOffsetManager.instance) {
      VisualOffsetManager.instance = new VisualOffsetManager();
    }
    return VisualOffsetManager.instance;
  }

  /**
   * Update visual offsets based on current tab data and measure lines
   */
  updateOffsets(tabData: TabData, customMeasureLines: CustomMeasureLine[] = []): void {
    this.visualOffsets.clear();
    
    // Get intelligent measure boundaries which include visual adjustments
    const boundaries = this.intelligentPlacement.calculateMeasureBoundaries(tabData, customMeasureLines);
    console.log('🎵 VisualOffsetManager: Calculated boundaries:', boundaries);
    
    // For each boundary, check if it needs visual adjustments
    boundaries.forEach(boundarySlot => {
      // Calculate placement for this specific boundary
      const placement = this.intelligentPlacement.calculateSingleMeasurePlacement(
        tabData, 
        boundarySlot
      );
      
      console.log(`🎵 VisualOffsetManager: Boundary ${boundarySlot} placement:`, placement);
      
      // Apply any visual adjustments
      placement.visualAdjustments.forEach(adjustment => {
        console.log(`🎵 VisualOffsetManager: Applying adjustment:`, adjustment);
        
        // For eighth notes, we want to shift notes starting from the first note of the next measure.
        // In a standard eighth note sequence:
        // - First measure: notes at slots 0,2,4,6,8,10,12,14 (8 notes)
        // - Measure line: placed after the last note of the measure
        // - Next measure starts: at slot 16 (the 9th note)
        // - Visual offset should apply: starting at slot 16, not after the measure line
        
        let offsetStartSlot = adjustment.fromSlot + 1; // Default behavior
        
        // Check if this is an eighth note pattern by looking for notes every 2 slots
        let isEighthNotePattern = false;
        let eighthNoteCount = 0;
        for (let slot = 0; slot < Math.min(16, tabData.length); slot += 2) {
          if (slot < tabData.length && tabData[slot] && tabData[slot].notes.length > 0) {
            const note = tabData[slot].notes[0];
            if (note && note.duration === 'eighth') {
              eighthNoteCount++;
            }
          }
        }
        
        // If we have 8 eighth notes in the first measure, this is a typical eighth note pattern
        if (eighthNoteCount >= 6) { // At least 6 eighth notes suggests a pattern
          isEighthNotePattern = true;
          // For eighth note patterns, start the offset at the first note of the next measure
          // which should be at slot 16 (after 8 eighth notes at slots 0,2,4,6,8,10,12,14)
          offsetStartSlot = 16;
          console.log(`🎵 VisualOffsetManager: Detected eighth note pattern, starting offset at slot ${offsetStartSlot}`);
        }
        
        for (let slot = offsetStartSlot; slot < tabData.length; slot++) {
          const currentOffset = this.visualOffsets.get(slot) || 0;
          this.visualOffsets.set(slot, currentOffset + adjustment.visualOffset);
        }
      });
    });
    
    console.log('🎵 VisualOffsetManager: Final offsets:', Array.from(this.visualOffsets.entries()));
  }

  /**
   * Get visual offset for a specific slot
   */
  getOffset(timeSlot: number): number {
    const offset = this.visualOffsets.get(timeSlot) || 0;
    if (offset > 0) {
      console.log(`🎵 VisualOffsetManager.getOffset(${timeSlot}) = ${offset}`);
    }
    return offset;
  }

  /**
   * Clear all offsets
   */
  clearOffsets(): void {
    this.visualOffsets.clear();
  }

  /**
   * Get all current offsets (for debugging)
   */
  getAllOffsets(): Map<number, number> {
    return new Map(this.visualOffsets);
  }
} 