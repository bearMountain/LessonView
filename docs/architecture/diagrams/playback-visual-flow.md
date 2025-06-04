# Playback and Visual Flow Analysis

This sequence diagram shows how the current systems interact with playback and highlights the mismatches between logical and visual positioning.

## Playback-Visual Interaction Sequence

```mermaid
sequenceDiagram
    participant User
    participant TabViewer
    participant App
    participant VisualOffsetManager
    participant IntelligentMeasurePlacement
    participant Controls
    participant ToneJS
    participant SVG

    Note over User,SVG: Current Playback Position Flow

    User->>TabViewer: Adds 8th notes (0,2,4,6,8,10,12,14)
    TabViewer->>App: onAddNote calls
    App->>App: Updates tabData state
    
    App->>VisualOffsetManager: updateOffsets(tabData, customMeasureLines)
    VisualOffsetManager->>IntelligentMeasurePlacement: calculateMeasureBoundaries
    IntelligentMeasurePlacement->>VisualOffsetManager: Returns boundaries [17]
    VisualOffsetManager->>VisualOffsetManager: Applies visual adjustments from slot 18
    
    Note over VisualOffsetManager: PROBLEM: Should start from slot 16, not 18
    
    App->>TabViewer: Re-renders with updated tabData
    TabViewer->>SVG: Renders notes with getVisualNoteX
    SVG->>VisualOffsetManager: Gets offsets for each note
    VisualOffsetManager->>SVG: Returns incorrect offsets
    
    Note over SVG: Notes 0-8 render normally, notes 9+ shifted incorrectly
    
    User->>App: Starts playback
    App->>Controls: playFromPosition(currentPosition.timeSlot)
    Controls->>ToneJS: Schedules notes at LOGICAL positions
    ToneJS->>Controls: Plays notes every 16th note
    Controls->>App: Updates currentPlaybackTimeSlot
    App->>TabViewer: Updates playback indicator
    TabViewer->>SVG: Renders playback line at getSlotX (NOT visual position)
    
    Note over ToneJS,SVG: MISMATCH: Playback uses logical positions, display uses visual positions
```

## Coordinate System Conflicts

```mermaid
graph LR
    subgraph "Logical Coordinate System"
        L1[Slot 0: Note 1]
        L2[Slot 2: Note 2]
        L3[Slot 4: Note 3]
        L4[Slot 6: Note 4]
        L5[Slot 8: Note 5]
        L6[Slot 10: Note 6]
        L7[Slot 12: Note 7]
        L8[Slot 14: Note 8]
        L9[Slot 16: Note 9]
        L10[Slot 18: Note 10]
        
        L1 --- L2 --- L3 --- L4 --- L5 --- L6 --- L7 --- L8 --- L9 --- L10
    end
    
    subgraph "Visual Coordinate System (Current Broken)"
        V1[X: 100px - Note 1]
        V2[X: 120px - Note 2]
        V3[X: 140px - Note 3]
        V4[X: 160px - Note 4]
        V5[X: 180px - Note 5]
        V6[X: 200px - Note 6]
        V7[X: 220px - Note 7]
        V8[X: 240px - Note 8]
        V9[X: 260px - Note 9 NO OFFSET]
        V10[X: 300px - Note 10 WITH OFFSET]
        
        V1 --- V2 --- V3 --- V4 --- V5 --- V6 --- V7 --- V8 -.-> V9
        V9 -.->|20px gap| V10
    end
    
    subgraph "Visual Coordinate System (Expected)"
        E1[X: 100px - Note 1]
        E2[X: 120px - Note 2]
        E3[X: 140px - Note 3]
        E4[X: 160px - Note 4]
        E5[X: 180px - Note 5]
        E6[X: 200px - Note 6]
        E7[X: 220px - Note 7]
        E8[X: 240px - Note 8]
        E9[X: 280px - Note 9 WITH OFFSET]
        E10[X: 300px - Note 10 WITH OFFSET]
        
        E1 --- E2 --- E3 --- E4 --- E5 --- E6 --- E7 --- E8
        E8 -.->|20px gap| E9 --- E10
    end
    
    subgraph "Playback System"
        P1[Play Note 1 at time 0]
        P2[Play Note 2 at time 0.125s]
        P3[Play Note 3 at time 0.25s]
        P4[Play Note 4 at time 0.375s]
        P5[Play Note 5 at time 0.5s]
        P6[Play Note 6 at time 0.625s]
        P7[Play Note 7 at time 0.75s]
        P8[Play Note 8 at time 0.875s]
        P9[Play Note 9 at time 1.0s]
        P10[Play Note 10 at time 1.125s]
        
        P1 --> P2 --> P3 --> P4 --> P5 --> P6 --> P7 --> P8 --> P9 --> P10
    end
    
    %% Showing the misalignment
    L9 -.->|Uses logical slot 16| P9
    V9 -.->|Displays at wrong X| V10
    E9 -.->|Should display here| P9
```

## Component Interaction Problems

```mermaid
flowchart TD
    subgraph "Rendering Issues"
        A[TabViewer renders notes]
        B[getVisualNoteX calculates position]
        C[VisualOffsetManager.getOffset]
        D[Returns offset for wrong slot]
        E[Note renders at incorrect X position]
        
        A --> B
        B --> C
        C --> D
        D --> E
    end
    
    subgraph "Playback Issues"
        F[Controls.tsx plays note]
        G[Uses logical timeSlot]
        H[TabViewer updates playback indicator]
        I[Uses getSlotX - logical position]
        J[Playback line appears disconnected from notes]
        
        F --> G
        G --> H
        H --> I
        I --> J
    end
    
    subgraph "User Experience Impact"
        K[User sees notes at visual positions]
        L[User sees playback line at logical position]
        M[Visual disconnect/confusion]
        N[Test failures]
        
        E --> K
        J --> L
        K --> M
        L --> M
        M --> N
    end
```

## State Management Timeline

```mermaid
gantt
    title State Update Timeline (Current Issues)
    dateFormat X
    axisFormat %s
    
    section User Action
    User types "0 Tab" for 8th note : milestone, m1, 0, 0
    
    section Immediate Updates
    TabViewer onAddNote      : active, t1, 0, 50
    App addNote function     : active, t2, 25, 75
    tabData state update     : active, t3, 50, 100
    
    section Measure Calculation
    getCustomMeasureBoundaries : active, t4, 75, 150
    IntelligentMeasurePlacement : active, t5, 100, 175
    calculateMeasureBoundaries : active, t6, 125, 200
    
    section Visual Offsets (PROBLEMATIC)
    VisualOffsetManager.updateOffsets : crit, t7, 150, 225
    Calculate boundaries [17]         : crit, t8, 175, 250
    Apply offsets from slot 18        : crit, t9, 200, 275
    
    section Rendering
    TabViewer re-render    : active, t10, 225, 300
    getVisualNoteX calls   : active, t11, 250, 325
    SVG position updates   : active, t12, 275, 350
    
    section Problems
    Wrong notes shifted    : crit, t13, 300, 350
    Visual-playback mismatch : crit, t14, 325, 350
```

## Key Issues Identified

### 1. **Timing Misalignment**
- Visual offsets are calculated after measure boundaries
- But visual offsets affect where measure boundaries should be placed
- Creates circular dependency and incorrect results

### 2. **Coordinate System Split**
- **Logical System**: Used by playback, data storage, and some rendering
- **Visual System**: Used by note positioning and user interface
- **No Translation Layer**: Systems don't properly communicate

### 3. **State Synchronization**
- Multiple components trigger visual offset updates
- Race conditions between updates
- Inconsistent state between components

### 4. **Testing Challenges**
- Integration tests fail due to coordinate system mismatches
- Unit tests difficult due to singleton patterns
- Complex dependencies make mocking challenging 