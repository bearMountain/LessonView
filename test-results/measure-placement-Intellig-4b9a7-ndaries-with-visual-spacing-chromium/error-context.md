# Test info

- Name: Intelligent Measure Placement >> should add eighth notes and create proper measure boundaries with visual spacing
- Location: /Users/gizmo/strumstick-tab-viewer/tests/measure-placement.spec.ts:24:3

# Error details

```
Error: expect(received).toBeLessThanOrEqual(expected)

Expected: <= 2
Received:    30
    at /Users/gizmo/strumstick-tab-viewer/tests/measure-placement.spec.ts:279:60
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
  179 |         } else if (afterSpacing < beforeSpacing * 0.5) {
  180 |           console.log('❌ No visual spacing: [E-|*-] pattern (notes too close to measure line)');
  181 |         } else {
  182 |           console.log('⚠️ Minimal visual spacing: between [E-|*-] and [E-|-*-]');
  183 |         }
  184 |         
  185 |         // Calculate expected positions based on slot spacing
  186 |         // Use the base slot width (20px) instead of calculating from actual positions
  187 |         // because actual positions include visual offsets which would skew the calculation
  188 |         const baseSlotWidth = 20; // Base slot width in pixels (before zoom)
  189 |         console.log(`  Base slot width: ${baseSlotWidth}px per slot`);
  190 |         
  191 |         // For intelligent measure placement, notes after the measure line should be shifted by exactly 1 slot
  192 |         const expectedNoteAfterX = measureX + (noteAfter.slot - measureSlot) * baseSlotWidth + baseSlotWidth; // +1 slot shift
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
  269 |           const noteBefore = visualPositions.filter(p => p.type === 'note' && p.slot < measureSlot).pop();
  270 |           const noteAfter = visualPositions.find(p => p.type === 'note' && p.slot > measureSlot);
  271 |           
  272 |           if (noteBefore && noteAfter && measureX !== undefined) {
  273 |             const baseSlotWidth = 20; // Base slot width in pixels (before zoom)
  274 |             const actualOffset = noteAfter.x - (measureX + (noteAfter.slot - measureSlot) * baseSlotWidth);
  275 |             const desiredOffset = baseSlotWidth; // Exactly 1 slot width
  276 |             const tolerance = baseSlotWidth * 0.1; // 10% tolerance
  277 |             
  278 |             // This assertion should PASS now that we fixed the visual offset calculation
> 279 |             expect(Math.abs(actualOffset - desiredOffset)).toBeLessThanOrEqual(tolerance);
      |                                                            ^ Error: expect(received).toBeLessThanOrEqual(expected)
  280 |           }
  281 |         }
  282 |       }
  283 |     }
  284 |   });
  285 |
  286 |   test('debugging test - add just a few notes and inspect state', async ({ page }) => {
  287 |     // Set up console logging
  288 |     const consoleMessages: string[] = [];
  289 |     page.on('console', msg => {
  290 |       consoleMessages.push(msg.text());
  291 |     });
  292 |
  293 |     // Get all available buttons first
  294 |     const allButtons = page.locator('button');
  295 |     const buttonCount = await allButtons.count();
  296 |     console.log(`Found ${buttonCount} buttons total`);
  297 |     
  298 |     for (let i = 0; i < Math.min(buttonCount, 20); i++) {
  299 |       const text = await allButtons.nth(i).textContent();
  300 |       console.log(`Button ${i}: "${text}"`);
  301 |     }
  302 |
  303 |     // Try to find eighth note button (SVG image, not rest symbol)
  304 |     const eighthNoteButton = page.locator('button img[src*="Eigth Note"]').first();
  305 |     if (await eighthNoteButton.count() > 0) {
  306 |       await eighthNoteButton.click();
  307 |       console.log('✅ Clicked eighth note button (SVG image)');
  308 |     } else {
  309 |       console.log('❌ Eighth note button not found, trying position-based selection...');
  310 |       
  311 |       // Try clicking a note button by position (4th pair, first button = eighth note)
  312 |       const noteButton = page.locator('.note-value-pair').nth(3).locator('button').first();
  313 |       if (await noteButton.count() > 0) {
  314 |         await noteButton.click();
  315 |         console.log('✅ Clicked eighth note button (by position)');
  316 |       } else {
  317 |         // Try clicking a quarter note as fallback
  318 |         const quarterButton = page.locator('button img[src*="Quarter Note"]').first();
  319 |         if (await quarterButton.count() > 0) {
  320 |           await quarterButton.click();
  321 |           console.log('✅ Clicked quarter note button as fallback');
  322 |         }
  323 |       }
  324 |     }
  325 |     
  326 |     await page.waitForTimeout(500);
  327 |
  328 |     // Add just 3 notes
  329 |     for (let i = 0; i < 3; i++) {
  330 |       await page.keyboard.press('0');
  331 |       await page.waitForTimeout(200);
  332 |       await page.keyboard.press('Tab');
  333 |       await page.waitForTimeout(200);
  334 |     }
  335 |
  336 |     await page.waitForTimeout(2000);
  337 |
  338 |     // Check state
  339 |     const notes = page.locator('g.note-symbol');
  340 |     const noteCount = await notes.count();
  341 |     console.log(`Found ${noteCount} notes`);
  342 |
  343 |     // Get note details
  344 |     for (let i = 0; i < noteCount; i++) {
  345 |       const note = notes.nth(i);
  346 |       const slot = await note.getAttribute('data-slot');
  347 |       const string = await note.getAttribute('data-string');
  348 |       console.log(`Note ${i}: slot=${slot}, string=${string}`);
  349 |     }
  350 |
  351 |     // Check console messages
  352 |     console.log('\n=== All console messages ===');
  353 |     consoleMessages.forEach((msg, i) => console.log(`${i}: ${msg}`));
  354 |
  355 |     await page.screenshot({ path: 'tests/screenshots/debug-test.png', fullPage: true });
  356 |   });
  357 | }); 
```