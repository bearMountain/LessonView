# Test info

- Name: Intelligent Measure Placement >> debugging test - add just a few notes and inspect state
- Location: /Users/gizmo/strumstick-tab-viewer/tests/measure-placement.spec.ts:125:3

# Error details

```
Error: Timed out 5000ms waiting for expect(locator).toBeVisible()

Locator: locator('.app')
Expected: visible
Received: hidden
Call log:
  - expect.toBeVisible with timeout 5000ms
  - waiting for locator('.app')
    9 × locator resolved to <div class="app">…</div>
      - unexpected value "hidden"

    at /Users/gizmo/strumstick-tab-viewer/tests/measure-placement.spec.ts:9:40
```

# Page snapshot

```yaml
- banner:
  - text: File
  - button "📄 New"
  - button "📁 Open"
  - button "💾 Save"
  - button "💾 Save As..."
  - text: Edit
  - button "↶ Undo"
  - button "↷ Redo"
  - button "✂️ Cut"
  - button "📋 Copy"
  - button "📄 Paste"
  - text: "Notes Duration:"
  - button "Whole Note":
    - img "Whole note"
  - button "Whole Rest": 𝄻
  - button "Half Note":
    - img "Half note"
  - button "Half Rest": 𝄼
  - button "Quarter Note":
    - img "Quarter note"
  - button "Quarter Rest": 𝄽
  - button "Eighth Note":
    - img "Eighth note"
  - button "Eighth Rest": 𝄾
  - button "Sixteenth Note":
    - img "Sixteenth note"
  - button "Sixteenth Rest": 𝄿
  - button "Tie":
    - img
    - text: Tie
  - button "♪ Dotted" [disabled]
  - button "📏 Measure"
  - text: "Time Time:"
  - combobox "Time Signature":
    - option "4/4" [selected]
    - option "3/4"
    - option "2/4"
    - option "6/8"
    - option "12/8"
    - option "2/2"
  - text: "4/4 Tempo:"
  - button "−"
  - text: 120 BPM
  - button "+"
  - text: Layout
  - button "🔍 Zoom In"
  - button "🔍 Zoom Out"
  - button "↔️ Fit Width"
- main:
  - button "🔊"
  - button "🎵"
  - img: d A D
- img "Fretboard"
- img
- contentinfo:
  - button "Play":
    - img
  - text: Untitled Song 0:00 / 0:00
  - button "Toggle count-in":
    - img "Metronome"
  - button "Decrease tempo":
    - img
  - text: 120 BPM
  - button "Increase tempo":
    - img
  - button "Toggle loop":
    - img
    - text: Loop
  - button "Toggle fretboard":
    - img
    - text: Fretboard
```

# Test source

```ts
   1 | import { test, expect } from '@playwright/test';
   2 |
   3 | test.describe('Intelligent Measure Placement', () => {
   4 |   test.beforeEach(async ({ page }) => {
   5 |     // Navigate to the app
   6 |     await page.goto('/');
   7 |     
   8 |     // Wait for the app to load
>  9 |     await expect(page.locator('.app')).toBeVisible();
     |                                        ^ Error: Timed out 5000ms waiting for expect(locator).toBeVisible()
   10 |     
   11 |     // Wait for the tab viewer to be ready
   12 |     await expect(page.locator('.tab-svg')).toBeVisible();
   13 |   });
   14 |
   15 |   test('should add eighth notes and create proper measure boundaries with visual spacing', async ({ page }) => {
   16 |     // Set up console logging to capture debug messages
   17 |     const consoleMessages: string[] = [];
   18 |     page.on('console', msg => {
   19 |       if (msg.text().includes('🎵')) {
   20 |         consoleMessages.push(msg.text());
   21 |       }
   22 |     });
   23 |
   24 |     // Select eighth note duration from toolbar  
   25 |     await page.locator('button', { hasText: 'Eighth' }).click();
   26 |     
   27 |     // Wait for selection to be processed
   28 |     await page.waitForTimeout(100);
   29 |
   30 |     // Add eighth notes using "0, Tab" pattern to fill more than one measure
   31 |     // Each eighth note takes 2 slots, so we need 8+ notes to get to 16+ slots
   32 |     console.log('Adding eighth notes...');
   33 |     for (let i = 0; i < 12; i++) {
   34 |       await page.keyboard.press('0');
   35 |       await page.waitForTimeout(50);
   36 |       await page.keyboard.press('Tab');
   37 |       await page.waitForTimeout(50);
   38 |       console.log(`Added note ${i + 1}/12`);
   39 |     }
   40 |
   41 |     // Wait for measure lines to be processed
   42 |     await page.waitForTimeout(2000);
   43 |
   44 |     // Take a screenshot before checking
   45 |     await page.screenshot({ path: 'tests/screenshots/before-checks.png', fullPage: true });
   46 |
   47 |     // Check that measure lines exist in the DOM  
   48 |     const measureLines = page.locator('line.measure-line');
   49 |     const measureLineCount = await measureLines.count();
   50 |     
   51 |     console.log(`Found ${measureLineCount} measure lines`);
   52 |
   53 |     // Get all measure line positions
   54 |     const measureLinePositions: number[] = [];
   55 |     for (let i = 0; i < measureLineCount; i++) {
   56 |       const line = measureLines.nth(i);
   57 |       const position = await line.getAttribute('data-slot');
   58 |       if (position) {
   59 |         measureLinePositions.push(parseInt(position));
   60 |       }
   61 |     }
   62 |
   63 |     console.log('Measure line positions:', measureLinePositions);
   64 |
   65 |     // Count notes to verify we have enough
   66 |     const notes = page.locator('g.note-symbol');
   67 |     const noteCount = await notes.count();
   68 |     console.log(`Found ${noteCount} notes`);
   69 |
   70 |     // Get note positions to verify they exist
   71 |     const notePositions: number[] = [];
   72 |     for (let i = 0; i < Math.min(noteCount, 15); i++) {
   73 |       const note = notes.nth(i);
   74 |       const position = await note.getAttribute('data-slot');
   75 |       if (position) {
   76 |         notePositions.push(parseInt(position));
   77 |       }
   78 |     }
   79 |     console.log('Note positions (first 15):', notePositions);
   80 |
   81 |     // Print console messages for debugging
   82 |     console.log('\n=== Console messages ===');
   83 |     consoleMessages.forEach(msg => console.log(msg));
   84 |
   85 |     // Check if we have enough notes to trigger measure boundaries
   86 |     if (noteCount >= 8) {
   87 |       console.log('✅ Have enough notes to trigger measure boundaries');
   88 |       
   89 |       if (measureLineCount > 0) {
   90 |         console.log('✅ Found measure lines');
   91 |         
   92 |         // For eighth note pattern, measure lines should be intelligently placed
   93 |         const firstBoundary = measureLinePositions[0];
   94 |         console.log(`First boundary at slot ${firstBoundary}`);
   95 |         
   96 |         // Check if the boundary is intelligently placed vs standard 16-slot interval
   97 |         if (firstBoundary !== 16) {
   98 |           console.log('✅ Boundary is intelligently placed (not at standard slot 16)');
   99 |         } else {
  100 |           console.log('⚠️ Boundary is at standard slot 16 - may not be using intelligent placement');
  101 |         }
  102 |       } else {
  103 |         console.log('❌ No measure lines found');
  104 |         console.log('Note positions:', notePositions);
  105 |         console.log('Tab data might not be long enough to trigger measure boundaries');
  106 |       }
  107 |     } else {
  108 |       console.log('❌ Not enough notes found to trigger measure boundaries');
  109 |     }
```