# Test info

- Name: Intelligent Measure Placement >> should add eighth notes and create proper measure boundaries with visual spacing
- Location: /Users/gizmo/strumstick-tab-viewer/tests/measure-placement.spec.ts:24:3

# Error details

```
Error: expect(received).toBeLessThanOrEqual(expected)

Expected: <= 2
Received:    10
    at /Users/gizmo/strumstick-tab-viewer/tests/measure-placement.spec.ts:277:60
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
  - text: "Video error: DEMUXER_ERROR_NO_SUPPORTED_STREAMS: FFmpegDemuxer: no supported streams"
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
  177 |         if (afterSpacing > beforeSpacing * 1.5) {
  178 |           console.log('✅ Visual spacing detected: [E-|-*-] pattern');
  179 |         } else if (afterSpacing < beforeSpacing * 0.5) {
  180 |           console.log('❌ No visual spacing: [E-|*-] pattern (notes too close to measure line)');
  181 |         } else {
  182 |           console.log('⚠️ Minimal visual spacing: between [E-|*-] and [E-|-*-]');
  183 |         }
  184 |         
  185 |         // Calculate expected positions based on slot spacing
  186 |         const expectedSlotSpacing = (noteAfter.x - noteBefore.x) / (noteAfter.slot - noteBefore.slot);
  187 |         console.log(`  Expected slot spacing: ${expectedSlotSpacing.toFixed(1)}px per slot`);
  188 |         
  189 |         // For intelligent measure placement, notes after the measure line should be shifted by exactly 1 slot
  190 |         const expectedNoteAfterX = measureX + (noteAfter.slot - measureSlot) * expectedSlotSpacing + expectedSlotSpacing; // +1 slot shift
  191 |         const actualOffset = noteAfter.x - (measureX + (noteAfter.slot - measureSlot) * expectedSlotSpacing); // offset from normal position
  192 |         console.log(`  Expected note after X (with 1-slot shift): ${expectedNoteAfterX.toFixed(1)}`);
  193 |         console.log(`  Actual note after X: ${noteAfter.x.toFixed(1)}`);
  194 |         console.log(`  Visual offset applied: ${actualOffset.toFixed(1)}px (should be ${expectedSlotSpacing.toFixed(1)}px for 1-slot shift)`);
  195 |         
  196 |         // Check if the offset is exactly 1 slot width (within small tolerance)
  197 |         const tolerance = expectedSlotSpacing * 0.1; // 10% tolerance
  198 |         const desiredOffset = expectedSlotSpacing; // Exactly 1 slot width
  199 |         
  200 |         if (Math.abs(actualOffset - desiredOffset) <= tolerance) {
  201 |           console.log('✅ Correct 1-slot shift detected - intelligent spacing working perfectly');
  202 |         } else if (actualOffset > desiredOffset + tolerance) {
  203 |           console.log(`❌ Too much offset: ${actualOffset.toFixed(1)}px vs expected ${desiredOffset.toFixed(1)}px - notes shifted too far`);
  204 |         } else if (actualOffset < desiredOffset - tolerance) {
  205 |           console.log(`❌ Too little offset: ${actualOffset.toFixed(1)}px vs expected ${desiredOffset.toFixed(1)}px - notes not shifted enough`);
  206 |         } else {
  207 |           console.log(`⚠️ Offset close but not exact: ${actualOffset.toFixed(1)}px vs expected ${desiredOffset.toFixed(1)}px`);
  208 |         }
  209 |         
  210 |         // Assertion: The offset should be exactly 1 slot width
  211 |         const offsetIsCorrect = Math.abs(actualOffset - desiredOffset) <= tolerance;
  212 |         if (!offsetIsCorrect) {
  213 |           console.log(`💥 TEST SHOULD FAIL: Expected 1-slot shift (${desiredOffset.toFixed(1)}px) but got ${actualOffset.toFixed(1)}px`);
  214 |         }
  215 |       }
  216 |     }
  217 |
  218 |     // Print console messages for debugging
  219 |     console.log('\n=== Console messages ===');
  220 |     consoleMessages.forEach(msg => console.log(msg));
  221 |
  222 |     // Check if we have enough notes to trigger measure boundaries
  223 |     if (noteCount >= 8) {
  224 |       console.log('✅ Have enough notes to trigger measure boundaries');
  225 |       
  226 |       if (measureLineCount > 0) {
  227 |         console.log('✅ Found measure lines');
  228 |         
  229 |         // For eighth note pattern, measure lines should be intelligently placed
  230 |         const firstBoundary = measureLinePositions[0];
  231 |         console.log(`First boundary at slot ${firstBoundary}`);
  232 |         
  233 |         // Check if the boundary is intelligently placed vs standard 16-slot interval
  234 |         if (firstBoundary !== 16) {
  235 |           console.log('✅ Boundary is intelligently placed (not at standard slot 16)');
  236 |         } else {
  237 |           console.log('⚠️ Boundary is at standard slot 16 - may not be using intelligent placement');
  238 |         }
  239 |       } else {
  240 |         console.log('❌ No measure lines found');
  241 |         console.log('Note positions:', notePositions);
  242 |         console.log('Tab data might not be long enough to trigger measure boundaries');
  243 |       }
  244 |     } else {
  245 |       console.log('❌ Not enough notes found to trigger measure boundaries');
  246 |     }
  247 |
  248 |     // Take a final screenshot
  249 |     await page.screenshot({ path: 'tests/screenshots/eighth-note-measure-placement.png', fullPage: true });
  250 |     
  251 |     console.log('✅ Test completed - screenshots saved');
  252 |     
  253 |     // Basic assertions
  254 |     expect(noteCount).toBeGreaterThan(5); // Should have added some notes
  255 |     
  256 |     // If we have enough notes for measure boundaries, they should exist
  257 |     if (noteCount >= 8) {
  258 |       expect(measureLineCount).toBeGreaterThan(0);
  259 |       
  260 |       // NEW: Assert that notes after measure lines are shifted by exactly 1 slot
  261 |       if (visualPositions.length > 0) {
  262 |         const measureLineSlots = visualPositions.filter(p => p.type === 'measure').map(p => p.slot);
  263 |         if (measureLineSlots.length > 0) {
  264 |           const measureSlot = measureLineSlots[0];
  265 |           const measureX = visualPositions.find(p => p.slot === measureSlot && p.type === 'measure')?.x;
  266 |           
  267 |           const noteBefore = visualPositions.filter(p => p.type === 'note' && p.slot < measureSlot).pop();
  268 |           const noteAfter = visualPositions.find(p => p.type === 'note' && p.slot > measureSlot);
  269 |           
  270 |           if (noteBefore && noteAfter && measureX !== undefined) {
  271 |             const expectedSlotSpacing = (noteAfter.x - noteBefore.x) / (noteAfter.slot - noteBefore.slot);
  272 |             const actualOffset = noteAfter.x - (measureX + (noteAfter.slot - measureSlot) * expectedSlotSpacing);
  273 |             const desiredOffset = expectedSlotSpacing; // Exactly 1 slot width
  274 |             const tolerance = expectedSlotSpacing * 0.1; // 10% tolerance
  275 |             
  276 |             // This assertion should FAIL until we fix the visual offset calculation
> 277 |             expect(Math.abs(actualOffset - desiredOffset)).toBeLessThanOrEqual(tolerance);
      |                                                            ^ Error: expect(received).toBeLessThanOrEqual(expected)
  278 |           }
  279 |         }
  280 |       }
  281 |     }
  282 |   });
  283 |
  284 |   test('debugging test - add just a few notes and inspect state', async ({ page }) => {
  285 |     // Set up console logging
  286 |     const consoleMessages: string[] = [];
  287 |     page.on('console', msg => {
  288 |       consoleMessages.push(msg.text());
  289 |     });
  290 |
  291 |     // Get all available buttons first
  292 |     const allButtons = page.locator('button');
  293 |     const buttonCount = await allButtons.count();
  294 |     console.log(`Found ${buttonCount} buttons total`);
  295 |     
  296 |     for (let i = 0; i < Math.min(buttonCount, 20); i++) {
  297 |       const text = await allButtons.nth(i).textContent();
  298 |       console.log(`Button ${i}: "${text}"`);
  299 |     }
  300 |
  301 |     // Try to find eighth note button (SVG image, not rest symbol)
  302 |     const eighthNoteButton = page.locator('button img[src*="Eigth Note"]').first();
  303 |     if (await eighthNoteButton.count() > 0) {
  304 |       await eighthNoteButton.click();
  305 |       console.log('✅ Clicked eighth note button (SVG image)');
  306 |     } else {
  307 |       console.log('❌ Eighth note button not found, trying position-based selection...');
  308 |       
  309 |       // Try clicking a note button by position (4th pair, first button = eighth note)
  310 |       const noteButton = page.locator('.note-value-pair').nth(3).locator('button').first();
  311 |       if (await noteButton.count() > 0) {
  312 |         await noteButton.click();
  313 |         console.log('✅ Clicked eighth note button (by position)');
  314 |       } else {
  315 |         // Try clicking a quarter note as fallback
  316 |         const quarterButton = page.locator('button img[src*="Quarter Note"]').first();
  317 |         if (await quarterButton.count() > 0) {
  318 |           await quarterButton.click();
  319 |           console.log('✅ Clicked quarter note button as fallback');
  320 |         }
  321 |       }
  322 |     }
  323 |     
  324 |     await page.waitForTimeout(500);
  325 |
  326 |     // Add just 3 notes
  327 |     for (let i = 0; i < 3; i++) {
  328 |       await page.keyboard.press('0');
  329 |       await page.waitForTimeout(200);
  330 |       await page.keyboard.press('Tab');
  331 |       await page.waitForTimeout(200);
  332 |     }
  333 |
  334 |     await page.waitForTimeout(2000);
  335 |
  336 |     // Check state
  337 |     const notes = page.locator('g.note-symbol');
  338 |     const noteCount = await notes.count();
  339 |     console.log(`Found ${noteCount} notes`);
  340 |
  341 |     // Get note details
  342 |     for (let i = 0; i < noteCount; i++) {
  343 |       const note = notes.nth(i);
  344 |       const slot = await note.getAttribute('data-slot');
  345 |       const string = await note.getAttribute('data-string');
  346 |       console.log(`Note ${i}: slot=${slot}, string=${string}`);
  347 |     }
  348 |
  349 |     // Check console messages
  350 |     console.log('\n=== All console messages ===');
  351 |     consoleMessages.forEach((msg, i) => console.log(`${i}: ${msg}`));
  352 |
  353 |     await page.screenshot({ path: 'tests/screenshots/debug-test.png', fullPage: true });
  354 |   });
  355 | }); 
```