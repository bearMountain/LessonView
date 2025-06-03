# Measure Placement Use Cases

## Overview

This document defines the behavior for automatic measure line placement between pairs of notes. There are two stages to the process:

1. **Find the placement**: Determine where the measure line goes between two notes (mathematical, based on time signature and note durations)
2. **Add line and adjust**: Insert the measure line and move the second note (and all subsequent notes) as needed to maintain proper visual spacing

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
```

### All Possible Combinations

#### Whole Note + Other Notes
```
[W---------------W---------------] -> 
[W---------------H-------] -> 
[W---------------Q---] -> 
[W---------------E-] -> 
[W---------------S] -> 
```

#### Half Note + Other Notes
```
[H-------W---------------] -> 
[H-------H-------] -> 
[H-------Q---] -> 
[H-------E-] -> 
[H-------S] -> 
```

#### Quarter Note + Other Notes
```
[Q---W---------------] -> 
[Q---H-------] -> 
[Q---Q---] -> 
[Q---E-] -> 
[Q---S] -> 
```

#### Eighth Note + Other Notes
```
[E-W---------------] -> 
[E-H-------] -> 
[E-Q---] -> 
[E-E-] -> 
[E-S] -> 
```

#### Sixteenth Note + Other Notes
```
[SW---------------] -> 
[SH-------] -> 
[SQ---] -> 
[SE-] -> 
[SS] -> 
```

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

## Priority Rules

### Precedence Order (Highest to Lowest)
1. **Never split tied notes**
2. **Preserve quarter note integrity** 
3. **Respect strong beat positions**
4. **Keep eighth note pairs together**
5. **Use beat subdivision boundaries**
6. **Maintain musical phrase integrity**

### Conflict Resolution
When multiple rules conflict, apply highest priority rule. If same priority, choose option that:
1. Creates most balanced measures
2. Preserves most note groupings
3. Follows standard musical notation practices

## Implementation Notes

### Visual vs. Playback
- Some cases may require visual-only slot adjustments (marked with `*`)
- Playback timing remains unchanged
- Visual spacing optimized for readability

### User Override
- All automatic placements can be manually overridden
- User placements take precedence over automatic rules
- System remembers user preferences for similar patterns

### Performance Considerations
- Rules should execute in < 5ms for typical measures
- Complex cases may take longer but should remain responsive
- Cache analysis results for repeated patterns

This specification serves as both documentation and test case definition, ensuring consistent and musically appropriate measure placement behavior. 