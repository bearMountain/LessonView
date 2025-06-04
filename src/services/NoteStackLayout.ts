// NoteStack Layout System
// Based on Strumstick Tab Viewer Architecture Specification v2.0

import type { Tab, LayoutItem, MeasureLine, Duration } from '../types/notestack';
import { 
  INITIAL_INDENT, 
  MEASURE_LINE_WIDTH, 
  MEASURE_LINE_SPACING, 
  PIXELS_PER_TICK,
  DURATION_TO_TICKS,
  TICKS_PER_MEASURE_4_4
} from '../types/notestack';

/**
 * Calculate display positions for all stacks in a tab
 */
export const calculateDisplayPositions = (tab: Tab): LayoutItem[] => {
  const sortedStacks = [...tab].sort((a, b) => a.musicalPosition - b.musicalPosition);
  const result: LayoutItem[] = [];
  
  let currentDisplayX = INITIAL_INDENT;
  
  for (let i = 0; i < sortedStacks.length; i++) {
    const currentStack = sortedStacks[i];
    const prevStack = sortedStacks[i - 1];
    
    // Add width of previous stack
    if (prevStack) {
      const prevStackWidth = durationToPixels(prevStack.duration);
      currentDisplayX += prevStackWidth;
      
      // Add measure lines and spacing
      const measureLinesInBetween = getMeasureLinesInRange(
        prevStack.musicalPosition, 
        currentStack.musicalPosition
      );
      
      measureLinesInBetween.forEach(() => {
        currentDisplayX += MEASURE_LINE_SPACING; // Before
        currentDisplayX += MEASURE_LINE_WIDTH;   // Line itself
        currentDisplayX += MEASURE_LINE_SPACING; // After
      });
      
      // Add intelligent spacing
      const intelligentSpacing = calculateIntelligentSpacing(
        prevStack, 
        currentStack, 
        measureLinesInBetween.length > 0
      );
      currentDisplayX += intelligentSpacing;
    }
    
    result.push({
      ...currentStack,
      displayX: currentDisplayX
    });
  }
  
  return result;
};

/**
 * Convert duration to pixel width
 */
export const durationToPixels = (duration: Duration): number => {
  return DURATION_TO_TICKS[duration] * PIXELS_PER_TICK;
};

/**
 * Get measure line positions in a range
 */
export const getMeasureLinesInRange = (startPos: number, endPos: number): number[] => {
  const measureLines: number[] = [];
  
  const firstMeasure = Math.ceil(startPos / TICKS_PER_MEASURE_4_4) * TICKS_PER_MEASURE_4_4;
  for (let pos = firstMeasure; pos < endPos; pos += TICKS_PER_MEASURE_4_4) {
    measureLines.push(pos);
  }
  
  return measureLines;
};

/**
 * Calculate intelligent spacing based on note durations
 * Implements the spacing rules from the original requirements
 */
export const calculateIntelligentSpacing = (
  prevStack: { duration: Duration },
  _currentStack: { musicalPosition: number },
  hasMeasureLineBetween: boolean
): number => {
  if (!hasMeasureLineBetween) return 0;
  
  // Apply spacing rules based on previous note duration
  switch (prevStack.duration) {
    case 'whole': return 0;        // [W--------------|-*---------------]
    case 'half': return 20;        // [H-------*-------] -> [H------|-*-------]  
    case 'quarter': return 20;     // [Q---*---] -> [Q--|-*---]
    case 'eighth': return 20;      // [E-*-] -> [E-|-*-]
    case 'sixteenth': return 20;   // [S*] -> [S-|-*]
    default: return 0;
  }
};

/**
 * Generate measure lines with their display positions
 */
export const generateMeasureLines = (tab: Tab): MeasureLine[] => {
  if (tab.length === 0) return [];
  
  const lastStack = tab[tab.length - 1];
  const totalDuration = lastStack.musicalPosition + DURATION_TO_TICKS[lastStack.duration];
  
  const measureLines: MeasureLine[] = [];
  
  // Generate measure lines at regular intervals
  for (let pos = TICKS_PER_MEASURE_4_4; pos < totalDuration; pos += TICKS_PER_MEASURE_4_4) {
    measureLines.push({
      id: `measure-${pos}`,
      type: 'measureLine',
      musicalPosition: pos,
      displayX: calculateMeasureLineDisplayX(pos, tab)
    });
  }
  
  return measureLines;
};

/**
 * Calculate display X position for a measure line
 */
export const calculateMeasureLineDisplayX = (musicalPosition: number, tab: Tab): number => {
  const layoutItems = calculateDisplayPositions(tab);
  
  // Find the stack that comes before this measure line
  const stackBefore = layoutItems
    .filter(item => item.musicalPosition < musicalPosition)
    .sort((a, b) => b.musicalPosition - a.musicalPosition)[0];
  
  if (!stackBefore) {
    return INITIAL_INDENT + (musicalPosition * PIXELS_PER_TICK);
  }
  
  // Calculate position based on the stack before plus its duration
  const stackEndX = stackBefore.displayX + durationToPixels(stackBefore.duration);
  const remainingTicks = musicalPosition - (stackBefore.musicalPosition + DURATION_TO_TICKS[stackBefore.duration]);
  
  return stackEndX + (remainingTicks * PIXELS_PER_TICK) + MEASURE_LINE_SPACING;
};

/**
 * Get the total visual width of the tab
 */
export const getTotalTabWidth = (tab: Tab): number => {
  if (tab.length === 0) return INITIAL_INDENT;
  
  const layoutItems = calculateDisplayPositions(tab);
  const lastItem = layoutItems[layoutItems.length - 1];
  
  if (!lastItem) return INITIAL_INDENT;
  
  return lastItem.displayX + durationToPixels(lastItem.duration) + 40; // Add some padding at the end
};

/**
 * Find the stack at a specific display X position
 */
export const findStackAtDisplayX = (tab: Tab, displayX: number): LayoutItem | null => {
  const layoutItems = calculateDisplayPositions(tab);
  
  for (const item of layoutItems) {
    const stackWidth = durationToPixels(item.duration);
    if (displayX >= item.displayX && displayX <= item.displayX + stackWidth) {
      return item;
    }
  }
  
  return null;
};

/**
 * Convert display X position to musical position
 */
export const displayXToMusicalPosition = (tab: Tab, displayX: number): number => {
  const layoutItems = calculateDisplayPositions(tab);
  
  // Handle position before first stack
  if (layoutItems.length === 0 || displayX <= INITIAL_INDENT) {
    return 0;
  }
  
  // Find the closest stack
  for (let i = 0; i < layoutItems.length; i++) {
    const currentItem = layoutItems[i];
    const nextItem = layoutItems[i + 1];
    
    if (!nextItem || displayX <= nextItem.displayX) {
      // Position is within or after this stack
      if (displayX <= currentItem.displayX + durationToPixels(currentItem.duration)) {
        // Position is within this stack
        return currentItem.musicalPosition;
      } else {
        // Position is after this stack, interpolate
        const pixelsFromStackEnd = displayX - (currentItem.displayX + durationToPixels(currentItem.duration));
        const additionalTicks = pixelsFromStackEnd / PIXELS_PER_TICK;
        return currentItem.musicalPosition + DURATION_TO_TICKS[currentItem.duration] + additionalTicks;
      }
    }
  }
  
  // Position is after the last stack
  const lastItem = layoutItems[layoutItems.length - 1];
  const pixelsFromLastStack = displayX - (lastItem.displayX + durationToPixels(lastItem.duration));
  const additionalTicks = pixelsFromLastStack / PIXELS_PER_TICK;
  return lastItem.musicalPosition + DURATION_TO_TICKS[lastItem.duration] + additionalTicks;
};

/**
 * Snap a musical position to the nearest valid position
 */
export const snapToGrid = (position: number, snapToQuarterNotes: boolean = true): number => {
  if (!snapToQuarterNotes) return position;
  
  const quarterNoteTicks = DURATION_TO_TICKS.quarter;
  return Math.round(position / quarterNoteTicks) * quarterNoteTicks;
};

/**
 * Get Y positions for strings (for rendering)
 */
export const getStringPositions = (stringSpacing: number = 30, topMargin: number = 50): number[] => {
  return [
    topMargin + (stringSpacing * 2), // String 0 (Low D) - bottom
    topMargin + stringSpacing,       // String 1 (A) - middle  
    topMargin                        // String 2 (Hi D) - top
  ];
}; 