# Measure Placement Use Cases

## Overview

This document defines the behavior for automatic measure line placement between pairs of notes. There are two stages to the process:

1. **Find the placement**: Determine where the measure line goes between two notes (mathematical, based on time signature and note durations)
2. **Add line and adjust**: Insert the measure line and move the second note (and all subsequent notes) as needed to maintain proper visual spacing. These visual spacing adjustments do not affect the playback spacing.

## Notation System

### Note Duration Symbols
- **W**: Whole note (16 slots)
- **H**: Half note (8 slots) 
- **Q**: Quarter note (4 slots)
- **E**: Eighth note (2 slots)
- **S**: Sixteenth note (1 slot)

### Formatting Convention
- **`-`**: Empty slot
- **`|`**: Measure line placement
- **`[...]`**: Groups a snapshot of the two notes in question
- **`->`**: Transformation (before to after)

## Two-Note Combinations

### Starting Examples
```
[Q---Q] -> [Q--|-Q]
[E-E] -> [E-|-E] (here an extra slot was added visually only)
[W--------------|-*---------------] -> [W--------------|-*---------------] (here '*' applies as a wild card - i.e. applies to any type of note)
```

### All Note Type Combinations

```
[W--------------|-*---------------] -> [W--------------|-*---------------]
[H-------*-------] -> [H-------*-------]
[Q---*---] -> [Q---*---]
[E-*-] -> [E-*-]
[S*] -> [S*]
```

**Note**: The '*' wildcard represents any note type (W, H, Q, E, or S) since the measure line placement logic depends only on the first note type, not the second.

## Implementation Notes

- Transformations will be filled in manually to define desired behavior
- Visual spacing may differ from playback timing
- Some cases may require adding visual-only slots for proper spacing
- All subsequent notes after the second note move with the second note to maintain relative positioning

## Test Case Generation

Each use case above translates directly to unit tests:
- **Input**: Note pattern before processing
- **Expected Output**: Optimal measure line placement
- **Rule Validation**: Verify correct rule was applied
- **Performance**: Ensure fast calculation
- **Edge Case Coverage**: Handle unusual inputs

## Implementation Notes

This specification serves as both documentation and test case definition, ensuring consistent and musically appropriate measure placement behavior. 