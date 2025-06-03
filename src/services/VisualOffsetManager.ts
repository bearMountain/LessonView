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
        // Apply visual offset to all slots AFTER the adjustment point (not including the adjustment point itself)
        // This ensures notes after the measure line are shifted, but the measure line position stays fixed
        for (let slot = adjustment.fromSlot + 1; slot < tabData.length; slot++) {
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