# Test info

- Name: Intelligent Measure Placement >> should add eighth notes and create proper measure boundaries with visual spacing
- Location: /Users/gizmo/strumstick-tab-viewer/tests/measure-placement.spec.ts:24:3

# Error details

```
Error: expect(received).toBeLessThanOrEqual(expected)

Expected: <= 2
Received:    30
    at /Users/gizmo/strumstick-tab-viewer/tests/measure-placement.spec.ts:293:60
```

# Page snapshot

```yaml
- banner:
  - text: File
  - button "📄 New"
  - button "📁 Open"
  - button "💾 Save*"
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
  - img: d A D 0 0 0 0 0 0 0 0 0 0 0 0
- img "Fretboard"
- img
- contentinfo:
  - button "Play":
    - img
  - text: Untitled Song 0:00 / 0:01
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
  193 |         const actualOffset = noteAfter.x - (measureX + (noteAfter.slot - measureSlot) * baseSlotWidth); // offset from normal position
  194 |         console.log(`  Expected note after X (with 1-slot shift): ${expectedNoteAfterX.toFixed(1)}`);
  195 |         console.log(`  Actual note after X: ${noteAfter.x.toFixed(1)}`);
  196 |         console.log(`  Visual offset applied: ${actualOffset.toFixed(1)}px (should be ${baseSlotWidth.toFixed(1)}px for 1-slot shift)`);
  197 |         
  198 |         // Check if the offset is exactly 1 slot width (within small tolerance)
  199 |         const tolerance = baseSlotWidth * 0.1; // 10% tolerance
  200 |         const desiredOffset = baseSlotWidth; // Exactly 1 slot width
  201 |         
  202 |         if (Math.abs(actualOffset - desiredOffset) <= tolerance) {
  203 |           console.log('✅ Correct 1-slot shift detected - intelligent spacing working perfectly');
  204 |         } else if (actualOffset > desiredOffset + tolerance) {
  205 |           console.log(`❌ Too much offset: ${actualOffset.toFixed(1)}px vs expected ${desiredOffset.toFixed(1)}px - notes shifted too far`);
  206 |         } else if (actualOffset < desiredOffset - tolerance) {
  207 |           console.log(`❌ Too little offset: ${actualOffset.toFixed(1)}px vs expected ${desiredOffset.toFixed(1)}px - notes not shifted enough`);
  208 |         } else {
  209 |           console.log(`⚠️ Offset close but not exact: ${actualOffset.toFixed(1)}px vs expected ${desiredOffset.toFixed(1)}px`);
  210 |         }
  211 |         
  212 |         // Assertion: The offset should be exactly 1 slot width
  213 |         const offsetIsCorrect = Math.abs(actualOffset - desiredOffset) <= tolerance;
  214 |         if (!offsetIsCorrect) {
  215 |           console.log(`💥 TEST SHOULD FAIL: Expected 1-slot shift (${desiredOffset.toFixed(1)}px) but got ${actualOffset.toFixed(1)}px`);
  216 |         }
  217 |       }
  218 |     }
  219 |
  220 |     // Print console messages for debugging
  221 |     console.log('\n=== Console messages ===');
  222 |     consoleMessages.forEach(msg => console.log(msg));
  223 |
  224 |     // Check if we have enough notes to trigger measure boundaries
  225 |     if (noteCount >= 8) {
  226 |       console.log('✅ Have enough notes to trigger measure boundaries');
  227 |       
  228 |       if (measureLineCount > 0) {
  229 |         console.log('✅ Found measure lines');
  230 |         
  231 |         // For eighth note pattern, measure lines should be intelligently placed
  232 |         const firstBoundary = measureLinePositions[0];
  233 |         console.log(`First boundary at slot ${firstBoundary}`);
  234 |         
  235 |         // Check if the boundary is intelligently placed vs standard 16-slot interval
  236 |         if (firstBoundary !== 16) {
  237 |           console.log('✅ Boundary is intelligently placed (not at standard slot 16)');
  238 |         } else {
  239 |           console.log('⚠️ Boundary is at standard slot 16 - may not be using intelligent placement');
  240 |         }
  241 |       } else {
  242 |         console.log('❌ No measure lines found');
  243 |         console.log('Note positions:', notePositions);
  244 |         console.log('Tab data might not be long enough to trigger measure boundaries');
  245 |       }
  246 |     } else {
  247 |       console.log('❌ Not enough notes found to trigger measure boundaries');
  248 |     }
  249 |
  250 |     // Take a final screenshot
  251 |     await page.screenshot({ path: 'tests/screenshots/eighth-note-measure-placement.png', fullPage: true });
  252 |     
  253 |     console.log('✅ Test completed - screenshots saved');
  254 |     
  255 |     // Basic assertions
  256 |     expect(noteCount).toBeGreaterThan(5); // Should have added some notes
  257 |     
  258 |     // If we have enough notes for measure boundaries, they should exist
  259 |     if (noteCount >= 8) {
  260 |       expect(measureLineCount).toBeGreaterThan(0);
  261 |       
  262 |       // NEW: Assert that notes after measure lines are shifted by exactly 1 slot
  263 |       if (visualPositions.length > 0) {
  264 |         const measureLineSlots = visualPositions.filter(p => p.type === 'measure').map(p => p.slot);
  265 |         if (measureLineSlots.length > 0) {
  266 |           const measureSlot = measureLineSlots[0];
  267 |           const measureX = visualPositions.find(p => p.slot === measureSlot && p.type === 'measure')?.x;
  268 |           
  269 |           // For eighth notes, the first note of the next measure should be shifted
  270 |           // This is the 9th note at slot 16, which is actually before the measure line at slot 17
  271 |           // Find the first note of the next measure (the 9th eighth note)
  272 |           const firstNoteOfNextMeasure = visualPositions.find(p => p.type === 'note' && p.slot === 16);
  273 |           const lastNoteOfFirstMeasure = visualPositions.filter(p => p.type === 'note' && p.slot < measureSlot).pop();
  274 |           
  275 |           if (firstNoteOfNextMeasure && lastNoteOfFirstMeasure && measureX !== undefined) {
  276 |             const baseSlotWidth = 20; // Base slot width in pixels (before zoom)
  277 |             
  278 |             // Calculate expected position of the 9th note without any visual offset
  279 |             const expectedNormalX = measureX + (firstNoteOfNextMeasure.slot - measureSlot) * baseSlotWidth;
  280 |             
  281 |             // Calculate the actual visual offset applied
  282 |             const actualOffset = firstNoteOfNextMeasure.x - expectedNormalX;
  283 |             const desiredOffset = baseSlotWidth; // Exactly 1 slot width
  284 |             const tolerance = baseSlotWidth * 0.1; // 10% tolerance
  285 |             
  286 |             console.log(`\n=== Checking 9th note (first note of next measure) ===`);
  287 |             console.log(`  9th note at slot ${firstNoteOfNextMeasure.slot}: X=${firstNoteOfNextMeasure.x.toFixed(1)}`);
  288 |             console.log(`  Expected normal position: ${expectedNormalX.toFixed(1)}`);
  289 |             console.log(`  Actual visual offset: ${actualOffset.toFixed(1)}px`);
  290 |             console.log(`  Desired offset: ${desiredOffset.toFixed(1)}px`);
  291 |             
  292 |             // This assertion should PASS now that we fixed the visual offset calculation
> 293 |             expect(Math.abs(actualOffset - desiredOffset)).toBeLessThanOrEqual(tolerance);
      |                                                            ^ Error: expect(received).toBeLessThanOrEqual(expected)
  294 |           }
  295 |         }
  296 |       }
  297 |     }
  298 |   });
  299 |
  300 |   test('debugging test - add just a few notes and inspect state', async ({ page }) => {
  301 |     // Set up console logging
  302 |     const consoleMessages: string[] = [];
  303 |     page.on('console', msg => {
  304 |       consoleMessages.push(msg.text());
  305 |     });
  306 |
  307 |     // Get all available buttons first
  308 |     const allButtons = page.locator('button');
  309 |     const buttonCount = await allButtons.count();
  310 |     console.log(`Found ${buttonCount} buttons total`);
  311 |     
  312 |     for (let i = 0; i < Math.min(buttonCount, 20); i++) {
  313 |       const text = await allButtons.nth(i).textContent();
  314 |       console.log(`Button ${i}: "${text}"`);
  315 |     }
  316 |
  317 |     // Try to find eighth note button (SVG image, not rest symbol)
  318 |     const eighthNoteButton = page.locator('button img[src*="Eigth Note"]').first();
  319 |     if (await eighthNoteButton.count() > 0) {
  320 |       await eighthNoteButton.click();
  321 |       console.log('✅ Clicked eighth note button (SVG image)');
  322 |     } else {
  323 |       console.log('❌ Eighth note button not found, trying position-based selection...');
  324 |       
  325 |       // Try clicking a note button by position (4th pair, first button = eighth note)
  326 |       const noteButton = page.locator('.note-value-pair').nth(3).locator('button').first();
  327 |       if (await noteButton.count() > 0) {
  328 |         await noteButton.click();
  329 |         console.log('✅ Clicked eighth note button (by position)');
  330 |       } else {
  331 |         // Try clicking a quarter note as fallback
  332 |         const quarterButton = page.locator('button img[src*="Quarter Note"]').first();
  333 |         if (await quarterButton.count() > 0) {
  334 |           await quarterButton.click();
  335 |           console.log('✅ Clicked quarter note button as fallback');
  336 |         }
  337 |       }
  338 |     }
  339 |     
  340 |     await page.waitForTimeout(500);
  341 |
  342 |     // Add just 3 notes
  343 |     for (let i = 0; i < 3; i++) {
  344 |       await page.keyboard.press('0');
  345 |       await page.waitForTimeout(200);
  346 |       await page.keyboard.press('Tab');
  347 |       await page.waitForTimeout(200);
  348 |     }
  349 |
  350 |     await page.waitForTimeout(2000);
  351 |
  352 |     // Check state
  353 |     const notes = page.locator('g.note-symbol');
  354 |     const noteCount = await notes.count();
  355 |     console.log(`Found ${noteCount} notes`);
  356 |
  357 |     // Get note details
  358 |     for (let i = 0; i < noteCount; i++) {
  359 |       const note = notes.nth(i);
  360 |       const slot = await note.getAttribute('data-slot');
  361 |       const string = await note.getAttribute('data-string');
  362 |       console.log(`Note ${i}: slot=${slot}, string=${string}`);
  363 |     }
  364 |
  365 |     // Check console messages
  366 |     console.log('\n=== All console messages ===');
  367 |     consoleMessages.forEach((msg, i) => console.log(`${i}: ${msg}`));
  368 |
  369 |     await page.screenshot({ path: 'tests/screenshots/debug-test.png', fullPage: true });
  370 |   });
  371 | }); 
```