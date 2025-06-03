# Measure Placement Use Cases

## Overview

This document defines specific use cases for intelligent measure placement behavior. Each case shows the desired transformation from input notes to output with optimal measure line placement. These cases serve as both specification and test case definitions.

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
- **`[...]`**: Measure boundary
- **`->`**: Transformation (before to after)

## Basic Quarter Note Cases

### Case 1: Quarter Note Boundary
**Scenario**: Two quarter notes with natural 4-beat boundary
```
Input:  [Q---Q---]
Output: [Q---|---Q]
```
**Rule**: Place measure line at natural quarter note boundary

### Case 2: Quarter Note Split Prevention
**Scenario**: Measure line would split quarter note
```
Input:  [Q---Q---]
Output: [Q---|---Q] 
```
**Rule**: Never split quarter notes - move boundary to note edges

### Case 3: Multiple Quarter Notes
**Scenario**: Four quarter notes forming complete measure
```
Input:  [Q---Q---Q---Q---]
Output: [Q---Q---Q---Q---|]
```
**Rule**: Complete 4/4 measure gets boundary at end

## Eighth Note Cases

### Case 4: Eighth Note Pairs - Beat Boundary
**Scenario**: Eighth note pairs at beat boundaries
```
Input:  [E-E-E-E-]
Output: [E-E-|E-E-]
```
**Rule**: Split eighth pairs at beat boundaries (every 4 slots)

### Case 5: Eighth Note Pairs - Natural Grouping
**Scenario**: Preserve eighth note beam groupings
```
Input:  [E-E-Q---]
Output: [E-E-|Q---] 
```
**Rule**: Keep eighth pairs together when possible

### Case 6: Mixed Eighth and Quarter
**Scenario**: Eighth notes followed by quarter note
```
Input:  [E-E-Q---E-E-]
Output: [E-E-Q---|E-E-]
```
**Rule**: Favor quarter note boundaries over eighth splits

## Sixteenth Note Cases

### Case 7: Sixteenth Note Groups
**Scenario**: Sixteenth note groupings within beats
```
Input:  [SSSSSSSS]
Output: [SSSS|SSSS]
```
**Rule**: Split sixteenth groups at beat subdivisions

### Case 8: Mixed Sixteenth and Larger Notes
**Scenario**: Sixteenths mixed with quarter notes
```
Input:  [SSSSQ---]
Output: [SSSS|Q---]
```
**Rule**: Prefer larger note boundaries over sixteenth splits

## Pickup Measure Cases

### Case 9: Single Quarter Pickup
**Scenario**: One quarter note pickup to full measure
```
Input:  [Q---Q---Q---Q---]
Output: [Q---|Q---Q---Q---]
```
**Rule**: Pickup measure ends at first strong beat

### Case 10: Eighth Note Pickup
**Scenario**: Two eighth notes as pickup
```
Input:  [E-E-Q---Q---Q---]
Output: [E-E-|Q---Q---Q---]
```
**Rule**: Short pickup preserves note groupings

### Case 11: Complex Pickup
**Scenario**: Mixed durations in pickup
```
Input:  [E-Q-E-Q---Q---Q---]
Output: [E-Q-E-|Q---Q---Q---]
```
**Rule**: Pickup ends at next quarter note downbeat

## Tied Note Cases

### Case 12: Tied Quarter Notes
**Scenario**: Quarter notes tied across potential boundary
```
Input:  [Q---Q---] (tied)
Output: [Q---Q---] (no boundary - preserve tie)
```
**Rule**: Never split tied notes with measure lines

### Case 13: Long Tied Notes
**Scenario**: Whole note tied across measures
```
Input:  [W---------------W---------------]
Output: [W-------|-------W-------]
```
**Rule**: Split long tied notes but maintain tie notation

## Syncopation Cases

### Case 14: Syncopated Quarter Notes
**Scenario**: Off-beat quarter note emphasis
```
Input:  [--Q---Q-E-E-]
Output: [--Q---|Q-E-E-]
```
**Rule**: Respect syncopated patterns, place boundary at strong beats

### Case 15: Complex Syncopation
**Scenario**: Mixed syncopated rhythms
```
Input:  [E---E-Q---E-]
Output: [E---E-|Q---E-]
```
**Rule**: Preserve syncopated groupings when possible

## Rest Cases

### Case 16: Quarter Rest Boundaries
**Scenario**: Quarter rests at natural boundaries
```
Input:  [Q---R---Q---] (R = rest)
Output: [Q---|R---Q---]
```
**Rule**: Use rests as natural boundary points

### Case 17: Mixed Rests and Notes
**Scenario**: Various rest durations
```
Input:  [R-R-Q---E-E-]
Output: [R-R-|Q---E-E-]
```
**Rule**: Rests provide flexible boundary options

## Complex Pattern Cases

### Case 18: Dotted Rhythms
**Scenario**: Dotted quarter notes
```
Input:  [Q.--E-Q.--E-] (Q. = dotted quarter)
Output: [Q.--E-|Q.--E-]
```
**Rule**: Respect dotted note groupings

### Case 19: Triplets
**Scenario**: Quarter note triplets
```
Input:  [QQQ-QQQ-] (triplets)
Output: [QQQ-|QQQ-]
```
**Rule**: Keep triplet groups intact

### Case 20: Dense Notation
**Scenario**: Many short notes
```
Input:  [SSSSSSSSSSSSSSSS]
Output: [SSSSSSSS|SSSSSSSS]
```
**Rule**: Use beat boundaries for dense notation

## Edge Cases

### Case 21: Empty Measures
**Scenario**: No notes in time span
```
Input:  [----------------]
Output: [--------|--------]
```
**Rule**: Use standard measure divisions for empty space

### Case 22: Single Long Note
**Scenario**: One note spanning multiple measures
```
Input:  [W---------------W---------------]
Output: [W-------|-------W-------]
```
**Rule**: Split long notes at measure boundaries with ties

### Case 23: Irregular Groupings
**Scenario**: Non-standard note combinations
```
Input:  [Q-E-Q-E-E-Q-]
Output: [Q-E-Q-|E-E-Q-]
```
**Rule**: Find best musical grouping point

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

## Test Case Generation

Each use case above translates directly to unit tests:
- **Input**: Note pattern before processing
- **Expected Output**: Optimal measure line placement
- **Rule Validation**: Verify correct rule was applied
- **Performance**: Ensure fast calculation
- **Edge Case Coverage**: Handle unusual inputs

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