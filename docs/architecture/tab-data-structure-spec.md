# Strumstick Tab Viewer Architecture Specification v2.0

## Overview
This document defines the refined architecture for the strumstick tab viewer using the `NoteStack` concept. The architecture separates musical content from visual layout while maintaining clean data structures and functional programming principles.

## Core Principles
- **NoteStack Concept**: Each moment in time is represented as a vertical stack of notes
- **Sequential Layout**: Array of note stacks represents left-to-right temporal flow
- **Musical vs Display Positions**: Separate concerns for playback timing and visual spacing
- **Functional Programming**: Immutable operations, pure functions
- **Tone.js Integration**: Native musical timing using Tone.js Transport system

## Data Types

### Core NoteStack Type
```typescript
type NoteStack = {
  id: string;                    // Unique identifier
  musicalPosition: number;       // Position in ticks (960 per quarter note)
  duration: Duration;            // Note duration for the entire stack
  notes: Array<{                 // Vertical stack of notes
    string: number;              // 0, 1, 2 for 3-string strumstick (Low D, A, Hi D)
    fret: number;                // 0-24 fret number
  }>;
  
  // Repeat markers (structural annotations)
  repeatStart?: boolean;         // Repeat section starts here
  repeatEnd?: {                  // Repeat section ends here
    jumpToStackId: string;       // ID of stack to jump back to
    timesToRepeat?: number;      // Default 1 (play twice total)
  };
};

type Duration = 'whole' | 'half' | 'quarter' | 'eighth' | 'sixteenth';

// Main data structure
type Tab = NoteStack[];          // Left-to-right sequence of vertical note stacks

// Application state
type AppState = {
  tab: Tab;                      // Musical content
  timeSignature: { numerator: number; denominator: number };
  bpm: number;
  currentPosition: number;       // Cursor position in ticks
  selectedStacks: string[];     // Selected stack IDs
  clipboardStacks: Array<{      // Cut/copy clipboard
    stackId: string;
    note: { string: number; fret: number };
  }>;
};
```

### Layout Types (for rendering)
```typescript
type LayoutItem = NoteStack & {
  displayX: number;              // Calculated screen position
};

type MeasureLine = {
  id: string;
  type: 'measureLine';
  musicalPosition: number;       // Where it falls musically
  displayX: number;              // Where it appears visually
};
```

## Position System

### Musical Position (Immutable Timing)
- **Unit**: Ticks (960 ticks per quarter note)
- **Purpose**: Playback timing, musical relationships
- **Examples**:
  - Position 0 = start of piece
  - Position 960 = 1 quarter note later
  - Position 3840 = 1 measure later (4/4 time)

### Display Position (Calculated Layout)
- **Unit**: Pixels
- **Purpose**: Visual rendering
- **Calculated from**: Musical position + spacing adjustments

## Sample Data Structure

### Simple Melody Example
```typescript
const tab: NoteStack[] = [
  // Single notes
  {
    id: "stack-1",
    musicalPosition: 0,
    duration: 'quarter',
    notes: [{ string: 0, fret: 0 }]  // Single note in stack
  },
  {
    id: "stack-2", 
    musicalPosition: 960,
    duration: 'quarter',
    notes: [{ string: 1, fret: 2 }]  // Different string
  },
  
  // Chord (multiple notes stacked vertically)
  {
    id: "stack-3",
    musicalPosition: 1920,
    duration: 'half',
    notes: [
      { string: 0, fret: 0 },        // Bottom of stack
      { string: 1, fret: 2 },        // Middle of stack
      { string: 2, fret: 2 }         // Top of stack
    ]
  },
  
  // Partial chord (some strings silent)
  {
    id: "stack-4",
    musicalPosition: 3840,
    duration: 'quarter', 
    notes: [
      { string: 0, fret: 3 },        // Only strings 0 and 2 played
      { string: 2, fret: 5 }         // String 1 is silent
    ]
  }
];
```

### Repeat Section Example
```typescript
const tabWithRepeats: NoteStack[] = [
  // Intro
  {
    id: "intro-1",
    musicalPosition: 0,
    duration: 'quarter',
    notes: [{ string: 0, fret: 0 }]
  },
  
  // Repeat section starts
  {
    id: "repeat-start",
    musicalPosition: 960,
    duration: 'quarter',
    notes: [{ string: 1, fret: 2 }],
    repeatStart: true              // Repeat marker
  },
  {
    id: "repeat-middle",
    musicalPosition: 1920,
    duration: 'quarter',
    notes: [{ string: 2, fret: 3 }]
  },
  {
    id: "repeat-end",
    musicalPosition: 2880,
    duration: 'quarter',
    notes: [{ string: 0, fret: 5 }],
    repeatEnd: {                   // Jump back to repeat-start
      jumpToStackId: "repeat-start",
      timesToRepeat: 1
    }
  },
  
  // After repeat
  {
    id: "outro-1",
    musicalPosition: 3840,
    duration: 'quarter',
    notes: [{ string: 1, fret: 7 }]
  }
];
```

## Core Operations

### Adding Notes
```typescript
const addNoteToStack = (
  tab: Tab, 
  position: number, 
  string: number, 
  fret: number, 
  duration: Duration
): Tab => {
  const existingStack = tab.find(stack => stack.musicalPosition === position);
  
  if (existingStack) {
    // Add note to existing stack (replace if string already has note)
    const updatedNotes = existingStack.notes.filter(note => note.string !== string);
    updatedNotes.push({ string, fret });
    
    return tab.map(stack => 
      stack.id === existingStack.id 
        ? { ...stack, notes: updatedNotes, duration }
        : stack
    );
  } else {
    // Create new stack
    const newStack: NoteStack = {
      id: generateUniqueId(),
      musicalPosition: position,
      duration,
      notes: [{ string, fret }]
    };
    
    return [...tab, newStack].sort((a, b) => a.musicalPosition - b.musicalPosition);
  }
};
```

### Finding and Querying
```typescript
// Find stack at specific position
const findStackAtPosition = (tab: Tab, position: number): NoteStack | undefined => {
  return tab.find(stack => stack.musicalPosition === position);
};

// Get note on specific string at position
const getNoteAt = (tab: Tab, position: number, string: number): { fret: number } | null => {
  const stack = findStackAtPosition(tab, position);
  if (!stack) return null;
  
  const note = stack.notes.find(note => note.string === string);
  return note ? { fret: note.fret } : null;
};

// Check if position has any notes
const hasNotesAtPosition = (tab: Tab, position: number): boolean => {
  const stack = findStackAtPosition(tab, position);
  return stack ? stack.notes.length > 0 : false;
};

// Get all stacks in a time range
const getStacksInRange = (tab: Tab, startPos: number, endPos: number): NoteStack[] => {
  return tab.filter(stack => 
    stack.musicalPosition >= startPos && stack.musicalPosition < endPos
  );
};
```

### Editing Operations
```typescript
// Remove note from specific string
const removeNoteFromString = (tab: Tab, position: number, string: number): Tab => {
  return tab.map(stack => {
    if (stack.musicalPosition === position) {
      const updatedNotes = stack.notes.filter(note => note.string !== string);
      return updatedNotes.length > 0 ? { ...stack, notes: updatedNotes } : null;
    }
    return stack;
  }).filter(Boolean) as Tab;
};

// Update stack duration
const updateStackDuration = (tab: Tab, stackId: string, duration: Duration): Tab => {
  return tab.map(stack => 
    stack.id === stackId ? { ...stack, duration } : stack
  );
};

// Move stack to new position
const moveStack = (tab: Tab, stackId: string, newPosition: number): Tab => {
  return tab.map(stack => 
    stack.id === stackId ? { ...stack, musicalPosition: newPosition } : stack
  ).sort((a, b) => a.musicalPosition - b.musicalPosition);
};
```

## Selection and Clipboard Operations

### String-Based Selection
```typescript
// Select notes on specific string across multiple stacks
const selectNotesOnString = (
  tab: Tab, 
  string: number, 
  startPos: number, 
  endPos: number
): Array<{ stackId: string; note: { string: number; fret: number } }> => {
  const stacksInRange = getStacksInRange(tab, startPos, endPos);
  const selection: Array<{ stackId: string; note: { string: number; fret: number } }> = [];
  
  stacksInRange.forEach(stack => {
    const noteOnString = stack.notes.find(note => note.string === string);
    if (noteOnString) {
      selection.push({ stackId: stack.id, note: noteOnString });
    }
  });
  
  return selection;
};

// Cut notes from selection
const cutNotesFromString = (
  tab: Tab, 
  selection: Array<{ stackId: string; note: { string: number; fret: number } }>
): { newTab: Tab; clipboard: typeof selection } => {
  const newTab = tab.map(stack => {
    const selectedNote = selection.find(sel => sel.stackId === stack.id);
    if (selectedNote) {
      const updatedNotes = stack.notes.filter(note => 
        note.string !== selectedNote.note.string
      );
      return updatedNotes.length > 0 ? { ...stack, notes: updatedNotes } : null;
    }
    return stack;
  }).filter(Boolean) as Tab;
  
  return { newTab, clipboard: selection };
};

// Paste notes to new string/position
const pasteNotesToString = (
  tab: Tab,
  clipboard: Array<{ stackId: string; note: { string: number; fret: number } }>,
  startPosition: number,
  targetString: number
): Tab => {
  if (clipboard.length === 0) return tab;
  
  // Calculate relative positions from clipboard
  const originalPositions = clipboard.map(item => {
    const originalStack = tab.find(stack => stack.id === item.stackId);
    return originalStack?.musicalPosition || 0;
  });
  
  const basePosition = Math.min(...originalPositions);
  
  // Create or update stacks for pasted notes
  let updatedTab = [...tab];
  
  clipboard.forEach(item => {
    const originalStack = tab.find(stack => stack.id === item.stackId);
    if (!originalStack) return;
    
    const relativeOffset = originalStack.musicalPosition - basePosition;
    const newPosition = startPosition + relativeOffset;
    
    updatedTab = addNoteToStack(
      updatedTab,
      newPosition,
      targetString,
      item.note.fret,
      originalStack.duration
    );
  });
  
  return updatedTab;
};
```

## Display Layout Generation

### Sequential Positioning
```typescript
const calculateDisplayPositions = (tab: Tab): LayoutItem[] => {
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

// Helper functions
const durationToPixels = (duration: Duration): number => {
  const ticksPerDuration = {
    'whole': 3840,      // 16 * 240 
    'half': 1920,       // 8 * 240
    'quarter': 960,     // 4 * 240  
    'eighth': 480,      // 2 * 240
    'sixteenth': 240    // 1 * 240
  };
  return ticksPerDuration[duration] * PIXELS_PER_TICK;
};

const getMeasureLinesInRange = (startPos: number, endPos: number): number[] => {
  const ticksPerMeasure = 3840; // 4/4 time
  const measureLines: number[] = [];
  
  const firstMeasure = Math.ceil(startPos / ticksPerMeasure) * ticksPerMeasure;
  for (let pos = firstMeasure; pos < endPos; pos += ticksPerMeasure) {
    measureLines.push(pos);
  }
  
  return measureLines;
};

// Intelligent spacing from original requirements
const calculateIntelligentSpacing = (
  prevStack: NoteStack, 
  currentStack: NoteStack, 
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
```

## Tone.js Integration

### Playback System
```typescript
class StrumstickPlayer {
  private synth: Tone.PolySynth;
  private currentPart: Tone.Part | null = null;

  constructor() {
    this.synth = new Tone.PolySynth().toDestination();
  }

  loadTab(tab: Tab) {
    // Clear existing part
    if (this.currentPart) {
      this.currentPart.dispose();
    }

    // Generate playback sequence (handles repeats)
    const playbackSequence = this.generatePlaybackSequence(tab);
    
    // Convert to Tone.js events
    const events = playbackSequence
      .filter(stack => stack.notes.length > 0)
      .map(stack => ({
        time: this.positionToToneTime(stack.musicalPosition),
        pitches: stack.notes.map(note => this.fretToPitch(note.fret, note.string)),
        duration: this.durationToToneNotation(stack.duration)
      }));

    // Create Tone.js Part
    this.currentPart = new Tone.Part((time, event) => {
      this.synth.triggerAttackRelease(event.pitches, event.duration, time);
    }, events);

    this.currentPart.start(0);
  }

  // Transport controls
  async play() {
    await Tone.start();
    Tone.Transport.start();
  }

  pause() { Tone.Transport.pause(); }
  stop() { Tone.Transport.stop(); }
  
  jumpTo(musicalPosition: number) {
    Tone.Transport.position = this.positionToToneTime(musicalPosition);
  }
  
  setBPM(bpm: number) {
    Tone.Transport.bpm.value = bpm;
  }

  // Helper methods
  private positionToToneTime(position: number): string {
    const measures = Math.floor(position / 3840);
    const beats = Math.floor((position % 3840) / 960);
    const sixteenths = Math.floor((position % 960) / 240);
    return `${measures}:${beats}:${sixteenths}`;
  }

  private durationToToneNotation(duration: Duration): string {
    const mapping = { 'whole': '1n', 'half': '2n', 'quarter': '4n', 'eighth': '8n', 'sixteenth': '16n' };
    return mapping[duration];
  }

  private fretToPitch(fret: number, string: number): string {
    const openPitches = ['D3', 'A3', 'D4']; // Strumstick tuning
    const baseMidi = Tone.Frequency(openPitches[string]).toMidi();
    return Tone.Frequency(baseMidi + fret, 'midi').toNote();
  }

  private generatePlaybackSequence(tab: Tab): NoteStack[] {
    // Handle repeats by expanding the sequence
    const playbackSequence: NoteStack[] = [];
    const sortedStacks = [...tab].sort((a, b) => a.musicalPosition - b.musicalPosition);
    
    let i = 0;
    const repeatStack: { startStackId: string; timesPlayed: number; maxRepeats: number }[] = [];
    
    while (i < sortedStacks.length) {
      const stack = sortedStacks[i];
      playbackSequence.push(stack);
      
      // Handle repeat end
      if (stack.repeatEnd) {
        const activeRepeat = repeatStack.find(r => r.startStackId === stack.repeatEnd!.jumpToStackId);
        
        if (!activeRepeat) {
          // First time hitting repeat end
          repeatStack.push({
            startStackId: stack.repeatEnd.jumpToStackId,
            timesPlayed: 1,
            maxRepeats: stack.repeatEnd.timesToRepeat || 1
          });
          
          // Jump back
          i = sortedStacks.findIndex(s => s.id === stack.repeatEnd!.jumpToStackId);
          continue;
        } else if (activeRepeat.timesPlayed < activeRepeat.maxRepeats) {
          // Repeat again
          activeRepeat.timesPlayed++;
          i = sortedStacks.findIndex(s => s.id === stack.repeatEnd!.jumpToStackId);
          continue;
        } else {
          // Done repeating
          const stackIndex = repeatStack.indexOf(activeRepeat);
          repeatStack.splice(stackIndex, 1);
        }
      }
      
      i++;
    }
    
    return playbackSequence;
  }
}
```

## Constants and Configuration

```typescript
// Layout constants
const INITIAL_INDENT = 40;           // Initial left margin
const MEASURE_LINE_WIDTH = 2;        // Width of measure line
const MEASURE_LINE_SPACING = 20;     // Padding before/after measure lines
const PIXELS_PER_TICK = 0.05;        // Base spacing conversion

// Musical constants  
const TICKS_PER_QUARTER = 960;       // High resolution timing
const TICKS_PER_MEASURE_4_4 = 3840;  // 4/4 time signature

// Strumstick tuning
const STRING_TUNINGS = ['D3', 'A3', 'D4']; // Low D, A, Hi D
const STRING_COUNT = 3;
const MAX_FRET = 24;
```

## Benefits of This Architecture

1. **Clear Conceptual Model**: NoteStack represents vertical stacking, array represents horizontal flow
2. **Flexible Note Operations**: Easy to add/remove notes from any string at any position
3. **Clean Repeat Handling**: Repeats are structural annotations on note stacks
4. **Efficient Cut/Copy/Paste**: String-based selection works naturally with stack structure
5. **Separation of Concerns**: Musical timing separate from visual spacing
6. **Tone.js Integration**: Natural mapping to Tone.js Part and Transport system
7. **Functional Approach**: All operations return new data structures
8. **Type Safety**: TypeScript ensures correct usage of data structures

## Usage Examples

```typescript
// Create new tab
let tab: Tab = [];

// Add single notes
tab = addNoteToStack(tab, 0, 0, 0, 'quarter');      // Fret 0, string 0
tab = addNoteToStack(tab, 960, 1, 2, 'quarter');    // Fret 2, string 1

// Add chord
tab = addNoteToStack(tab, 1920, 0, 0, 'half');      // Add to stack at position 1920
tab = addNoteToStack(tab, 1920, 1, 2, 'half');      // Add to same stack
tab = addNoteToStack(tab, 1920, 2, 2, 'half');      // Add to same stack

// Add repeats
tab = tab.map(stack => 
  stack.musicalPosition === 960 ? { ...stack, repeatStart: true } : stack
);

// Generate layout and play
const player = new StrumstickPlayer();
player.loadTab(tab);
player.setBPM(120);
player.play();
```

This architecture provides a robust, scalable foundation for the strumstick tab editor with clear separation of musical content, visual layout, and playback functionality.