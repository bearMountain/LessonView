import { VisualOffsetManager } from './services/VisualOffsetManager';
import { IntelligentMeasurePlacement } from './services/IntelligentMeasurePlacement';

// Note duration types
export type NoteDuration = 'whole' | 'half' | 'quarter' | 'eighth' | 'sixteenth';

// Note types - can be a note with fret or a rest
export type NoteType = 'note' | 'rest';

// Tool types for the toolbar
export type ToolMode = 'note' | 'measureLine';

// Custom measure line placement
export interface CustomMeasureLine {
  slot: number; // The slot where the measure line appears
  measureNumber: number; // Which measure this starts (1, 2, 3...)
  noteAtSlot?: { timeSlot: number; stringIndex: number }; // Note that was clicked to create this measure line
}

// Individual note/rest with duration and starting time slot
export interface Note {
  type: NoteType;
  fret: number | null; // null for rests, number for notes
  duration: NoteDuration;
  stringIndex: number; // which string this note is on (0=Low D, 1=A, 2=Hi D)
  startSlot: number; // which sixteenth-note slot this note starts on
  isTiedTo?: number; // time slot of the next note this is tied to (optional)
  isTiedFrom?: number; // time slot of the previous note this is tied from (optional)
  isDotted?: boolean; // whether this note is dotted (adds 50% duration)
}

// Grid cell - can contain one note per string
export interface GridCell {
  notes: Note[]; // Array of notes that START in this cell (one per string max)
}

// Tab data is now a 2D grid: [timeSlot][stringIndex]
// Each time slot represents a sixteenth note (the smallest division)
export type TabData = GridCell[];

// Cursor position for navigation  
export interface CursorPosition {
  timeSlot: number; // which sixteenth-note slot (column in the grid)
  stringIndex: number; // which string (0=Low D, 1=A, 2=Hi D)
}

// Duration values in terms of sixteenth note slots
export const DURATION_SLOTS: Record<NoteDuration, number> = {
  whole: 16,      // 16 sixteenth notes
  half: 8,        // 8 sixteenth notes
  quarter: 4,     // 4 sixteenth notes  
  eighth: 2,      // 2 sixteenth notes
  sixteenth: 1,   // 1 sixteenth note
};

// Duration values in terms of quarter note beats (for compatibility)
export const DURATION_VALUES: Record<NoteDuration, number> = {
  whole: 4,
  half: 2,
  quarter: 1,
  eighth: 0.5,
  sixteenth: 0.25,
};

// Calculate duration value including dotted notes
export const getNoteDurationValue = (duration: NoteDuration, isDotted?: boolean): number => {
  const baseDuration = DURATION_VALUES[duration];
  return isDotted ? baseDuration * 1.5 : baseDuration;
};

// Calculate slots needed for a note (including dotted notes)
export const getNoteDurationSlots = (duration: NoteDuration, isDotted?: boolean): number => {
  const baseDuration = DURATION_VALUES[duration];
  const actualDuration = isDotted ? baseDuration * 1.5 : baseDuration;
  return Math.round(actualDuration * 4); // Convert to sixteenth note slots
};

// Visual properties for different note durations
export const DURATION_VISUALS: Record<NoteDuration, {
  stemHeight: number;
  hasFlag: boolean;
  flagCount: number;
  isOpen: boolean; // for whole and half notes
}> = {
  whole: { stemHeight: 0, hasFlag: false, flagCount: 0, isOpen: true },
  half: { stemHeight: 35, hasFlag: false, flagCount: 0, isOpen: true },
  quarter: { stemHeight: 35, hasFlag: false, flagCount: 0, isOpen: false },
  eighth: { stemHeight: 35, hasFlag: true, flagCount: 1, isOpen: false },
  sixteenth: { stemHeight: 35, hasFlag: true, flagCount: 2, isOpen: false },
};

// Calculate X position for a time slot (simple multiplication with padding)
export const getSlotX = (timeSlot: number, leftMargin: number, slotWidth: number): number => {
  const padding = slotWidth * 1 ; // Add half a slot width as padding
  return leftMargin + padding + (timeSlot * slotWidth);
};

// Calculate visual X position for notes, accounting for pickup measure offset and intelligent spacing
export const getVisualNoteX = (note: Note, customMeasureLines: CustomMeasureLine[], leftMargin: number, slotWidth: number): number => {
  let visualOffset = 0;
  
  // Apply visual spacing for intelligent measure placement (convert slot units to pixels)
  visualOffset += getIntelligentVisualOffset(note.startSlot) * slotWidth;
  
  return getSlotX(note.startSlot, leftMargin, slotWidth) + visualOffset;
};

// Calculate visual X position for any slot position, accounting for pickup measure offset and intelligent spacing
export const getVisualSlotX = (timeSlot: number, customMeasureLines: CustomMeasureLine[], leftMargin: number, slotWidth: number): number => {
  let visualOffset = 0;
  
  // Apply visual spacing for intelligent measure placement (convert slot units to pixels)
  visualOffset += getIntelligentVisualOffset(timeSlot) * slotWidth;
  
  return getSlotX(timeSlot, leftMargin, slotWidth) + visualOffset;
};

// Calculate intelligent visual offset for a slot (returns offset in slot units, will be multiplied by slotWidth)
export const getIntelligentVisualOffset = (timeSlot: number): number => {
  try {
    const manager = VisualOffsetManager.getInstance();
    const offset = manager.getOffset(timeSlot);
    console.log(`🎵 getIntelligentVisualOffset(${timeSlot}) = ${offset} slot units`);
    return offset; // Return in slot units (1 = 1 slot width)
  } catch (error) {
    // Fallback to 0 if there's any issue
    console.warn('Unable to get intelligent visual offset:', error);
    return 0;
  }
};

// Calculate X position for measure lines - should stay at the original slot position
export const getMeasureLineX = (timeSlot: number, leftMargin: number, slotWidth: number, customMeasureLines: CustomMeasureLine[]): number => {
  // For custom measure lines, the line should stay at the exact original slot position
  // where the note was when clicked, not where the note gets visually shifted to
  if (customMeasureLines.length > 0) {
    const measureLine = customMeasureLines[0];
    if (measureLine.slot === timeSlot) {
      // This is the custom measure line we're positioning - place it at the original slot position
      // Don't apply any visual offset - this marks where the note originally was
      return getSlotX(timeSlot, leftMargin, slotWidth);
    }
  }
  
  // For regular measure lines, use the original calculation
  const padding = slotWidth * 1; // Same padding as notes for consistency
  return leftMargin + padding + (timeSlot * slotWidth) - (slotWidth * 1.5); // Move line further left for better visual separation
};

// Find the next available slot for a note of given duration
export const findNextAvailableSlot = (tabData: TabData, startSlot: number, stringIndex: number, duration: NoteDuration): number => {
  const slotsNeeded = DURATION_SLOTS[duration];
  
  // Start searching from the given slot
  for (let slot = startSlot; slot < startSlot + 100; slot++) { // Reasonable search limit
    let slotAvailable = true;
    
    // Check if all required slots are available for this string
    for (let i = 0; i < slotsNeeded; i++) {
      const checkSlot = slot + i;
      
      // Ensure the slot exists in tabData
      while (tabData.length <= checkSlot) {
        tabData.push({ notes: [] });
      }
      
      // Check if any note on this string occupies this slot
      const hasConflict = tabData[checkSlot].notes.some(note => {
        if (note.stringIndex !== stringIndex) return false;
        
        const noteEndSlot = note.startSlot + DURATION_SLOTS[note.duration];
        return checkSlot >= note.startSlot && checkSlot < noteEndSlot;
      });
      
      if (hasConflict) {
        slotAvailable = false;
        break;
      }
    }
    
    if (slotAvailable) {
      return slot;
    }
  }
  
  return startSlot; // Fallback to original slot if no space found
};

// Get all notes that occupy a specific slot on a specific string
export const getNotesAtSlot = (tabData: TabData, timeSlot: number, stringIndex: number): Note[] => {
  if (timeSlot >= tabData.length) return [];
  
  return tabData[timeSlot].notes.filter(note => {
    if (note.stringIndex !== stringIndex) return false;
    
    const noteEndSlot = note.startSlot + getNoteDurationSlots(note.duration, note.isDotted);
    return timeSlot >= note.startSlot && timeSlot < noteEndSlot;
  });
};

// Remove a note from the grid
export const removeNoteFromGrid = (tabData: TabData, note: Note): TabData => {
  const newTabData = [...tabData];
  
  if (note.startSlot < newTabData.length) {
    const cell = newTabData[note.startSlot];
    cell.notes = cell.notes.filter(n => 
      !(n.stringIndex === note.stringIndex && n.startSlot === note.startSlot)
    );
  }
  
  return newTabData;
};

// Add a note to the grid
export const addNoteToGrid = (tabData: TabData, note: Note): TabData => {
  const newTabData = [...tabData];
  
  // Ensure the grid is large enough
  while (newTabData.length <= note.startSlot) {
    newTabData.push({ notes: [] });
  }
  
  // Remove any existing note on this string that would conflict
  const slotsNeeded = getNoteDurationSlots(note.duration, note.isDotted);
  for (let i = 0; i < slotsNeeded; i++) {
    const slotIndex = note.startSlot + i;
    if (slotIndex < newTabData.length) {
      const cell = newTabData[slotIndex];
      cell.notes = cell.notes.filter(n => n.stringIndex !== note.stringIndex);
    }
  }
  
  // Add the new note to its starting slot
  const startCell = newTabData[note.startSlot];
  startCell.notes.push(note);
  
  return newTabData;
};

// Calculate total beats in the tab
export const getTotalBeats = (tabData: TabData): number => {
  return tabData.length * 0.25; // Each slot is a sixteenth note (0.25 beats)
};

// Get measure boundaries (every 16 slots = 4 beats)
export const getMeasureBoundaries = (tabData: TabData): number[] => {
  const boundaries: number[] = [];
  const slotsPerMeasure = 16; // 16 sixteenth notes per measure (4 beats)
  
  for (let slot = slotsPerMeasure; slot < tabData.length; slot += slotsPerMeasure) {
    boundaries.push(slot);
  }
  
  return boundaries;
};

// Get custom measure boundaries including pickup measure support
export const getCustomMeasureBoundaries = (tabData: TabData, customMeasureLines: CustomMeasureLine[]): number[] => {
  if (customMeasureLines.length === 0) {
    // Use intelligent measure placement for auto-generated boundaries
    try {
      console.log('🎵 getCustomMeasureBoundaries: Using intelligent placement, tabData length:', tabData.length);
      
      // Use a singleton instance to avoid creating new objects on every call
      const placement = getIntelligentPlacementInstance();
      const boundaries = placement.calculateMeasureBoundaries(tabData, customMeasureLines);
      console.log('🎵 getCustomMeasureBoundaries: Intelligent boundaries calculated:', boundaries);
      
      // Apply visual offsets from intelligent placement
      const visualOffsetManager = VisualOffsetManager.getInstance();
      visualOffsetManager.updateOffsets(tabData, customMeasureLines);
      console.log('🎵 getCustomMeasureBoundaries: Visual offsets updated');
      
      return boundaries;
    } catch (error) {
      console.warn('Unable to use intelligent measure placement, falling back to simple boundaries:', error);
      return getIntelligentMeasureBoundaries(tabData);
    }
  }
  
  // Sort custom measure lines by slot position
  const sortedLines = [...customMeasureLines].sort((a, b) => a.slot - b.slot);
  
  const boundaries: number[] = [];
  
  // Add all custom measure lines
  sortedLines.forEach(line => {
    boundaries.push(line.slot);
  });
  
  // TEMPORARILY DISABLED: Apply intelligent visual offsets even for custom measure lines
  // Custom measure lines may be auto-generated and need intelligent spacing
  // try {
  //   console.log('🎵 getCustomMeasureBoundaries: Applying intelligent visual offsets for custom measure lines');
  //   const visualOffsetManager = VisualOffsetManager.getInstance();
  //   visualOffsetManager.updateOffsets(tabData, customMeasureLines);
  //   console.log('🎵 getCustomMeasureBoundaries: Visual offsets applied for custom measures');
  // } catch (error) {
  //   console.warn('Unable to apply intelligent visual offsets for custom measure lines:', error);
  // }
  
  // Add intelligent boundaries after the last custom line
  const lastCustomSlot = sortedLines[sortedLines.length - 1]?.slot || 0;
  const slotsPerMeasure = 16;
  
  // Calculate subsequent measure boundaries starting from the custom measure line position
  // The custom measure line marks the start of the first full measure, so subsequent
  // measures should be at regular intervals from that point
  let nextBoundary = lastCustomSlot + slotsPerMeasure;
  
  while (nextBoundary < tabData.length) {
    boundaries.push(nextBoundary);
    nextBoundary += slotsPerMeasure;
  }
  
  return boundaries.filter((boundary, index, arr) => arr.indexOf(boundary) === index).sort((a, b) => a - b);
};

// Singleton instance for IntelligentMeasurePlacement to avoid creating new instances
let intelligentPlacementInstance: IntelligentMeasurePlacement | null = null;
const getIntelligentPlacementInstance = (): IntelligentMeasurePlacement => {
  if (!intelligentPlacementInstance) {
    intelligentPlacementInstance = new IntelligentMeasurePlacement();
  }
  return intelligentPlacementInstance;
};

// Basic intelligent measure boundaries implementation
export const getIntelligentMeasureBoundaries = (tabData: TabData): number[] => {
  const boundaries: number[] = [];
  const slotsPerMeasure = 16; // 4 beats * 4 sixteenth notes per beat
  
  let currentSlot = slotsPerMeasure;
  
  while (currentSlot < tabData.length) {
    // Find note at or before the current slot to determine placement
    let placementSlot = currentSlot;
    
    // Look for notes around the current slot
    for (let searchSlot = currentSlot - 4; searchSlot <= currentSlot + 4; searchSlot++) {
      if (searchSlot >= 0 && searchSlot < tabData.length) {
        const cell = tabData[searchSlot];
        if (cell && cell.notes.length > 0) {
          const note = cell.notes[0];
          if (note.startSlot <= currentSlot) {
            // Apply intelligent placement rules based on note type
            const noteEndSlot = note.startSlot + DURATION_SLOTS[note.duration];
            
            switch (note.duration) {
              case 'whole':
                placementSlot = noteEndSlot;
                break;
              case 'half':
                placementSlot = noteEndSlot - 1;
                break;
              case 'quarter':
                placementSlot = noteEndSlot - 1;
                break;
              case 'eighth':
              case 'sixteenth':
                placementSlot = note.startSlot + 1;
                break;
              default:
                placementSlot = currentSlot;
            }
            break;
          }
        }
      }
    }
    
    boundaries.push(placementSlot);
    currentSlot = placementSlot + slotsPerMeasure;
  }
  
  return boundaries;
};

// Calculate pickup measure beats for count-in
export const getPickupBeats = (customMeasureLines: CustomMeasureLine[], timeSignature: string = '4/4'): number => {
  if (customMeasureLines.length === 0) {
    return 0; // No pickup measure
  }
  
  // Get the first (and only) measure line
  const firstMeasureLine = customMeasureLines[0];
  if (!firstMeasureLine) {
    return 0;
  }
  
  const [numerator] = timeSignature.split('/').map(Number);
  const beatsPerMeasure = numerator || 4;
  const slotsPerBeat = 4; // 4 sixteenth notes per beat
  
  // Calculate how many beats the pickup measure contains
  // The pickup measure goes from slot 0 to the measure line slot
  const pickupSlots = firstMeasureLine.slot;
  const pickupBeats = Math.ceil(pickupSlots / slotsPerBeat);
  
  // Count-in beats are the remaining beats to complete a full measure
  return Math.max(0, beatsPerMeasure - pickupBeats);
};

// Helper function to get the longest duration at a time position
export const getLongestDuration = (notes: Note[]): NoteDuration => {
  if (notes.length === 0) return 'quarter';
  
  const durations = notes.map(note => DURATION_VALUES[note.duration]);
  const maxDuration = Math.max(...durations);
  
  // Find the corresponding duration type
  for (const [durationType, value] of Object.entries(DURATION_VALUES)) {
    if (value === maxDuration) {
      return durationType as NoteDuration;
    }
  }
  
  return 'quarter'; // fallback
};

// Tie between two notes
export interface Tie {
  fromSlot: number;
  toSlot: number;
  stringIndex: number;
  fret: number;
}

// Create a tie between two notes
export const createTie = (tabData: TabData, fromSlot: number, toSlot: number, stringIndex: number): TabData => {
  const newTabData = [...tabData];
  
  // Find the notes to tie
  const fromNotes = getNotesAtSlot(newTabData, fromSlot, stringIndex);
  const toNotes = getNotesAtSlot(newTabData, toSlot, stringIndex);
  
  if (fromNotes.length === 0 || toNotes.length === 0) {
    return tabData; // Can't tie if notes don't exist
  }
  
  const fromNote = fromNotes[0];
  const toNote = toNotes[0];
  
  // Can only tie notes of the same fret/pitch
  if (fromNote.fret !== toNote.fret || fromNote.type !== 'note' || toNote.type !== 'note') {
    return tabData;
  }
  
  // Update the notes with tie information
  if (fromNote.startSlot < newTabData.length) {
    const fromCell = newTabData[fromNote.startSlot];
    fromCell.notes = fromCell.notes.map(n => 
      n.stringIndex === stringIndex && n.startSlot === fromSlot
        ? { ...n, isTiedTo: toSlot }
        : n
    );
  }
  
  if (toNote.startSlot < newTabData.length) {
    const toCell = newTabData[toNote.startSlot];
    toCell.notes = toCell.notes.map(n => 
      n.stringIndex === stringIndex && n.startSlot === toSlot
        ? { ...n, isTiedFrom: fromSlot }
        : n
    );
  }
  
  return newTabData;
};

// Remove a tie between two notes
export const removeTie = (tabData: TabData, fromSlot: number, toSlot: number, stringIndex: number): TabData => {
  const newTabData = [...tabData];
  
  // Remove tie information from both notes
  if (fromSlot < newTabData.length) {
    const fromCell = newTabData[fromSlot];
    fromCell.notes = fromCell.notes.map(n => 
      n.stringIndex === stringIndex && n.startSlot === fromSlot
        ? { ...n, isTiedTo: undefined }
        : n
    );
  }
  
  if (toSlot < newTabData.length) {
    const toCell = newTabData[toSlot];
    toCell.notes = toCell.notes.map(n => 
      n.stringIndex === stringIndex && n.startSlot === toSlot
        ? { ...n, isTiedFrom: undefined }
        : n
    );
  }
  
  return newTabData;
};

// Get all ties in the tab data
export const getAllTies = (tabData: TabData): Tie[] => {
  const ties: Tie[] = [];
  
  tabData.forEach((cell, timeSlot) => {
    cell.notes.forEach(note => {
      if (note.isTiedTo !== undefined && note.fret !== null) {
        ties.push({
          fromSlot: timeSlot,
          toSlot: note.isTiedTo,
          stringIndex: note.stringIndex,
          fret: note.fret
        });
      }
    });
  });
  
  return ties;
};

// Get total duration of a note including ties (in quarter note beats)
export const getTotalNoteDuration = (tabData: TabData, timeSlot: number, stringIndex: number): number => {
  if (timeSlot >= tabData.length) return 0;
  
  // Find the note at this position
  const notes = tabData[timeSlot].notes.filter(n => 
    n.stringIndex === stringIndex && n.startSlot === timeSlot
  );
  
  if (notes.length === 0) return 0;
  
  const note = notes[0];
  let totalDuration = getNoteDurationValue(note.duration, note.isDotted);
  
  // Follow ties to add durations
  let currentSlot = timeSlot;
  while (note.isTiedTo !== undefined) {
    currentSlot = note.isTiedTo;
    if (currentSlot >= tabData.length) break;
    
    const tiedNotes = tabData[currentSlot].notes.filter(n => 
      n.stringIndex === stringIndex && n.startSlot === currentSlot
    );
    
    if (tiedNotes.length === 0) break;
    
    const tiedNote = tiedNotes[0];
    totalDuration += getNoteDurationValue(tiedNote.duration, tiedNote.isDotted);
    
    // Update note reference for next iteration
    Object.assign(note, tiedNote);
  }
  
  return totalDuration;
}; 