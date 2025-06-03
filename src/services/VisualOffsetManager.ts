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
    
    // For each boundary, check if it needs visual adjustments
    boundaries.forEach(boundarySlot => {
      // Calculate placement for this specific boundary
      const placement = this.intelligentPlacement.calculateSingleMeasurePlacement(
        tabData, 
        boundarySlot
      );
      
      // Apply any visual adjustments
      placement.visualAdjustments.forEach(adjustment => {
        // Apply visual offset to all slots at or after the adjustment point
        for (let slot = adjustment.fromSlot; slot < tabData.length; slot++) {
          const currentOffset = this.visualOffsets.get(slot) || 0;
          this.visualOffsets.set(slot, currentOffset + adjustment.visualOffset);
        }
      });
    });
  }

  /**
   * Get visual offset for a specific slot
   */
  getOffset(timeSlot: number): number {
    return this.visualOffsets.get(timeSlot) || 0;
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