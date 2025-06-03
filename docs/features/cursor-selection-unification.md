# Cursor and Note Selection Unification Plan

## Overview

Currently, we have two separate concepts for position tracking and selection:
1. **Cursor** - for navigation, note placement, and playback starting
2. **Note Selection** - for editing existing notes (duration changes, dotted notes)

**The unified concept:** **Wherever the cursor is, that note should be selected.** 

This document outlines the plan to unify these concepts into a single, cohesive system where the cursor position IS the selected note. The **orange circle UI** will show your current position, and if there's a note at that position, it's automatically selected for editing.

## Current State Analysis

### Cursor System (`cursorPosition` state)

**Visual Representation:**
- Red circle with vertical line through it
- Renders as: circle + line stroke="#ff0000" 
- Always visible, shows current editing position

**Functionality:**
- ✅ Shows current position for editing/navigation
- ✅ Determines where new notes are placed when typing numbers  
- ✅ Used as the starting position for playback (`playFromPosition(cursorPosition.timeSlot)`)
- ✅ Can be moved with arrow keys (`onMoveCursor`)
- ✅ Shows where you are in the tab
- ✅ Auto-loads existing note fret values when moved to a position with a note
- ✅ Plays preview sounds when moving to existing notes
- ✅ Smart click positioning (moves to end of previous note when clicking in space)
- ✅ Used for note creation (`addNote` uses `cursorPosition`)
- ✅ Used for note removal (`removeNote` uses `cursorPosition`)
- ✅ Tab navigation (moves by selected duration)
- ✅ Integration with sync engine (`syncEngine.seekToSlot(timeSlot)`)

**State Management:**
```typescript
const [cursorPosition, setCursorPosition] = useState<CursorPosition>({ timeSlot: 0, stringIndex: 2 });
```

**Key Props/Functions:**
- `cursorPosition` prop to TabViewer
- `onMoveCursor` callback
- `onCursorClick` callback
- `moveCursor` function in App.tsx
- `handleCursorClick` function in App.tsx

### Note Selection System (`selectedNoteForEditing` state)

**Visual Representation:**
- Orange circle (`stroke="#ff6b35"`)
- Only visible when a note is selected
- Positioned using `getVisualSlotX` for consistent visual alignment

**Functionality:**
- ✅ Shows which note is selected for editing 
- ✅ Allows duration changes via toolbar (`handleDurationChange`)
- ✅ Allows dotted note toggling (`toggleDottedNote`)
- ✅ Automatically set when creating new notes
- ✅ Cleared when moving cursor manually
- ✅ Used by toolbar to enable/disable dotted note button

**State Management:**
```typescript
const [selectedNoteForEditing, setSelectedNoteForEditing] = useState<{ timeSlot: number; stringIndex: number } | null>(null);
```

**Key Props/Functions:**
- `selectedNoteForEditing` prop to TabViewer
- `setSelectedNoteForEditing` in various handlers
- Integration with ProfessionalToolbar for note editing

### Multi-Note Selection System (`selectedNotes` state)

**Visual Representation:**
- Blue dashed circles (`stroke="#007acc"`, `strokeDasharray="4,2"`)
- Used for tie creation between multiple notes

**Functionality:**
- ✅ Multi-select with Shift+Click
- ✅ Tie creation between selected notes
- ✅ Limited to 2 notes maximum

**State Management:**
```typescript
const [selectedNotes, setSelectedNotes] = useState<Array<{ timeSlot: number; stringIndex: number }>>([]);
```

**Note:** This system will remain **unchanged** - it serves a specific purpose for tie creation and doesn't conflict with the unified cursor/selection concept.

## Desired Unified State

### New Unified System (`currentPosition` state)

**Core Concept:** **Cursor position = Selected note** 
- The orange circle shows where you are
- If there's a note at that position, it's automatically "selected" for editing
- If there's no note, you can create one by typing
- All cursor functionality is preserved
- All note editing functionality is available

**Visual Representation:**
- **Orange circle** (inheriting from note selection: `stroke="#ff6b35"`)
- Always visible (inheriting from cursor behavior)
- Uses `getVisualSlotX` for consistent positioning

**Unified Functionality:**
- ✅ Shows current position for editing/navigation (from cursor)
- ✅ Determines where new notes are placed (from cursor)
- ✅ Used as starting position for playback (from cursor)
- ✅ Can be moved with arrow keys (from cursor)
- ✅ Shows where you are in the tab (from cursor)
- ✅ Allows duration changes via toolbar (automatically, if note exists at position)
- ✅ Allows dotted note toggling (automatically, if note exists at position)
- ✅ Auto-loads existing note values when moved (from cursor)
- ✅ Smart click positioning (from cursor)
- ✅ Tab navigation by duration (from cursor)
- ✅ Integration with sync engine (from cursor)

## Technical Implementation Plan

### Phase 1: State Consolidation

**1.1 Replace Multiple States with Single State**
```typescript
// Remove these:
// const [cursorPosition, setCursorPosition] = useState<CursorPosition>({ timeSlot: 0, stringIndex: 2 });
// const [selectedNoteForEditing, setSelectedNoteForEditing] = useState<{ timeSlot: number; stringIndex: number } | null>(null);

// Replace with:
const [currentPosition, setCurrentPosition] = useState<CursorPosition>({ timeSlot: 0, stringIndex: 2 });
```

**1.2 Update Type Definitions**
- Keep `CursorPosition` interface (already good)
- No new types needed

**1.3 Keep Multi-Note Selection Unchanged**
- `selectedNotes` state remains exactly as-is
- No changes to tie creation workflow
- Blue dashed circles continue to work for multi-select

### Phase 2: Function Consolidation

**2.1 Merge Position Management Functions**
- Remove separate note selection logic - selection is automatic based on position
- Ensure all cursor functionality is preserved
- Note editing features work automatically when position has a note

**2.2 Update Event Handlers**
```typescript
// Update handleCursorClick to:
const handlePositionClick = (timeSlot: number, stringIndex: number, shiftHeld?: boolean, clickedOnMeasureLine?: boolean) => {
  // Handle measure line mode
  // Handle tie selection mode (preserve selectedNotes for multi-select - unchanged)
  // Handle normal position setting (unified behavior)
  // Update sync engine
  // Clear paused state
  // NOTE: No need to manually set "selected note" - it's automatic based on position
}

// Update moveCursor to:
const movePosition = (direction: 'left' | 'right' | 'up' | 'down') => {
  // Move position
  // NOTE: Selection is automatic - if there's a note at new position, it's "selected"
  // Load existing note if present (existing behavior)
}
```

### Phase 3: UI Updates

**3.1 TabViewer Visual Changes**
- Remove red cursor rendering (`{/* Cursor */}` section)
- Show orange circle at `currentPosition` (always visible)
- Use `getVisualSlotX(currentPosition.timeSlot, ...)` for positioning
- Remove separate "selected note for editing" rendering (it's the same as cursor position now)

**3.2 Toolbar Integration**
- Update ProfessionalToolbar to use `currentPosition` 
- Duration and dotted buttons enabled based on whether there's a note at `currentPosition`
- Show current note's duration/dotted state when position has a note

### Phase 4: Props and Interface Updates

**4.1 TabViewer Props**
```typescript
interface TabViewerProps {
  // Remove:
  // cursorPosition: CursorPosition;
  // selectedNoteForEditing?: { timeSlot: number; stringIndex: number } | null;
  
  // Replace with:
  currentPosition: CursorPosition;
  
  // Keep unchanged:
  selectedNotes?: Array<{ timeSlot: number; stringIndex: number }>; // For ties
  
  // Update callbacks:
  onMovePosition: (direction: 'left' | 'right' | 'up' | 'down') => void;
  onPositionClick: (timeSlot: number, stringIndex: number, shiftHeld?: boolean, clickedOnMeasureLine?: boolean) => void;
}
```

**4.2 Controls Integration**
- Update Controls to use `currentPosition` for playback starting
- No functional changes needed, just prop name

**4.3 ProfessionalToolbar Props**
```typescript
interface ProfessionalToolbarProps {
  // Remove:
  // selectedNoteForEditing?: { timeSlot: number; stringIndex: number } | null;
  
  // Replace with:
  currentPosition: CursorPosition;
  noteAtCurrentPosition?: Note; // Helper for determining what editing options to show
}
```

### Phase 5: Behavior Preservation

**5.1 Note Creation Flow**
1. User types number at `currentPosition`
2. Note created at `currentPosition`
3. `currentPosition` stays at same location (no auto-advance)
4. Orange circle remains visible showing where note was created
5. **Automatically "selected"** since cursor is at that position

**5.2 Navigation Flow**
1. Arrow keys move `currentPosition`
2. If new position has existing note, it's automatically "selected" and fret value loaded
3. Orange circle moves to new position
4. Toolbar automatically updates to show note's duration/dotted state if applicable

**5.3 Playback Integration**
1. Play button starts from `currentPosition.timeSlot`
2. Playback indicator separate from position indicator
3. When playback stops, `currentPosition` remains where user left it

**5.4 Multi-Select Tie Mode (Unchanged)**
- Keep `selectedNotes` array exactly as-is for tie creation
- Blue dashed circles for multi-select (unchanged)
- Orange circle for current position
- Both can be visible simultaneously (unchanged)

## Migration Checklist

### Code Files to Update

**Core State Management:**
- [ ] `src/App.tsx` - Replace state variables and handlers
- [ ] `src/TabViewer.tsx` - Update props, visual rendering, and event handling
- [ ] `src/types.ts` - Update interface exports if needed

**Component Integration:**
- [ ] `src/components/toolbar/ProfessionalToolbar.tsx` - Update props and note editing logic
- [ ] `src/Controls.tsx` - Update playback starting position logic

**Event Handling:**
- [ ] Update all `onMoveCursor` callbacks to `onMovePosition`
- [ ] Update all `onCursorClick` callbacks to `onPositionClick`
- [ ] Ensure keyboard navigation still works
- [ ] Ensure Tab key navigation preserved
- [ ] **Leave tie selection completely unchanged**

**Visual Consistency:**
- [ ] Remove red cursor rendering
- [ ] Show orange circle at current position (always visible)
- [ ] Remove separate selected note rendering (redundant now)
- [ ] Ensure consistent positioning with `getVisualSlotX`
- [ ] Test visual alignment with measure lines

### Testing Requirements

**Functional Testing:**
- [ ] Arrow key navigation works
- [ ] Number typing creates notes at correct position
- [ ] Tab key moves by selected duration
- [ ] Click positioning works (including smart positioning)
- [ ] Playback starts from correct position
- [ ] Duration changes work via toolbar (when note exists at position)
- [ ] Dotted note toggling works (when note exists at position)
- [ ] Measure line placement works
- [ ] **Tie creation still works exactly as before (unchanged)**

**Visual Testing:**
- [ ] Orange circle always visible and positioned correctly
- [ ] No red cursor remnants
- [ ] Position indicator distinct from playback indicator
- [ ] Multi-select ties still show blue circles (unchanged)
- [ ] Toolbar buttons enable/disable based on note existence at position

**Edge Cases:**
- [ ] Empty positions (no notes) - toolbar buttons disabled
- [ ] Positions with notes - toolbar shows note properties
- [ ] Measure line offset positioning
- [ ] Zoom in/out behavior
- [ ] Reset cursor functionality (Cmd+Enter)

## Benefits of Unification

1. **Simplified Mental Model**: **Cursor position = Selected note** (automatic)
2. **Consistent Visual Language**: Orange circle always shows where you are
3. **Reduced Complexity**: One concept instead of two separate systems
4. **Better UX**: Always visible position indicator with automatic note editing
5. **Maintainability**: Less code duplication, clearer responsibilities
6. **Intuitive Behavior**: No manual selection needed - editing works based on position

## Risks and Considerations

1. **Regression Risk**: Cursor functionality is complex and well-tested
2. **Visual Changes**: Users familiar with red cursor may need adjustment
3. **State Synchronization**: Ensure all components updated consistently
4. **Toolbar Logic**: Must properly handle enable/disable based on note existence

## Implementation Priority

1. **High Priority**: Core position management and navigation
2. **High Priority**: Note creation and editing functionality  
3. **Medium Priority**: Visual consistency and orange circle rendering
4. **Medium Priority**: Toolbar integration and automatic enable/disable
5. **Low Priority**: Code cleanup and documentation updates

---

This unified system provides the **clearest possible mental model**: wherever the orange circle is, that's your current position, and if there's a note there, it's automatically available for editing. No separate selection step needed. 