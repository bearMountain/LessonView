# Test info

- Name: Intelligent Measure Placement >> should add eighth notes and create proper measure boundaries with visual spacing
- Location: /Users/gizmo/strumstick-tab-viewer/tests/measure-placement.spec.ts:24:3

# Error details

```
Error: locator.getAttribute: Test timeout of 20000ms exceeded.
Call log:
  - waiting for locator('g.note-symbol').nth(2)

    at /Users/gizmo/strumstick-tab-viewer/tests/measure-placement.spec.ts:111:35
```

# Test source

```ts
   11 |     // Wait for React app to render - look for the main layout instead of .app
   12 |     await page.waitForSelector('.main-layout', { timeout: 30000 });
   13 |     
   14 |     // Wait for the professional toolbar to be ready
   15 |     await page.waitForSelector('.professional-toolbar', { timeout: 30000 });
   16 |     
   17 |     // Wait for the tab viewer SVG to be ready
   18 |     await page.waitForSelector('.tab-svg', { timeout: 30000 });
   19 |     
   20 |     // Additional wait for React components to initialize
   21 |     await page.waitForTimeout(1000);
   22 |   });
   23 |
   24 |   test('should add eighth notes and create proper measure boundaries with visual spacing', async ({ page }) => {
   25 |     // Set up console logging to capture debug messages
   26 |     const consoleMessages: string[] = [];
   27 |     page.on('console', msg => {
   28 |       if (msg.text().includes('🎵') || msg.text().includes('VisualOffset') || msg.text().includes('Updating visual offsets')) {
   29 |         consoleMessages.push(msg.text());
   30 |       }
   31 |     });
   32 |
   33 |     // Check that toolbar is visible
   34 |     await expect(page.locator('.professional-toolbar')).toBeVisible();
   35 |
   36 |     // Find and click the eighth NOTE button (SVG image), not the rest button (𝄾 symbol)
   37 |     // The note buttons use SVG images with the filename containing "Eigth Note"
   38 |     const eighthNoteButton = page.locator('button img[src*="Eigth Note"]').first();
   39 |     if (await eighthNoteButton.count() > 0) {
   40 |       await eighthNoteButton.click();
   41 |       console.log('✅ Clicked eighth note button (SVG image)');
   42 |     } else {
   43 |       // Fallback: try to find the note button container
   44 |       const noteButton = page.locator('.note-value-pair').nth(3).locator('button').first(); // 4th pair (eighth), first button (note)
   45 |       if (await noteButton.count() > 0) {
   46 |         await noteButton.click();
   47 |         console.log('✅ Clicked eighth note button (by position)');
   48 |       } else {
   49 |         console.log('❌ Could not find eighth note button');
   50 |         
   51 |         // Debug: list all buttons with images
   52 |         const imageButtons = page.locator('button img');
   53 |         const imageCount = await imageButtons.count();
   54 |         console.log(`Found ${imageCount} image buttons:`);
   55 |         for (let i = 0; i < Math.min(imageCount, 10); i++) {
   56 |           const src = await imageButtons.nth(i).getAttribute('src');
   57 |           console.log(`  ${i}: ${src}`);
   58 |         }
   59 |         
   60 |         // Take screenshot for debugging
   61 |         await page.screenshot({ path: 'tests/screenshots/no-eighth-button.png', fullPage: true });
   62 |       }
   63 |     }
   64 |     
   65 |     // Wait for selection to be processed
   66 |     await page.waitForTimeout(500);
   67 |
   68 |     // Add eighth notes using "0, Tab" pattern
   69 |     console.log('Adding eighth notes...');
   70 |     for (let i = 0; i < 12; i++) {
   71 |       await page.keyboard.press('0');
   72 |       await page.waitForTimeout(100);
   73 |       await page.keyboard.press('Tab');
   74 |       await page.waitForTimeout(100);
   75 |       console.log(`Added note ${i + 1}/12`);
   76 |     }
   77 |
   78 |     // Wait for measure lines to be processed
   79 |     await page.waitForTimeout(3000);
   80 |
   81 |     // Skip screenshots for now to avoid hanging
   82 |     // await page.screenshot({ path: 'tests/screenshots/before-checks.png', fullPage: true });
   83 |
   84 |     // Check that measure lines exist in the DOM  
   85 |     const measureLines = page.locator('line.measure-line');
   86 |     const measureLineCount = await measureLines.count();
   87 |     
   88 |     console.log(`Found ${measureLineCount} measure lines`);
   89 |
   90 |     // Get all measure line positions
   91 |     const measureLinePositions: number[] = [];
   92 |     for (let i = 0; i < measureLineCount; i++) {
   93 |       const line = measureLines.nth(i);
   94 |       const position = await line.getAttribute('data-slot');
   95 |       if (position) {
   96 |         measureLinePositions.push(parseInt(position));
   97 |       }
   98 |     }
   99 |
  100 |     console.log('Measure line positions:', measureLinePositions);
  101 |
  102 |     // Count notes to verify we have enough
  103 |     const notes = page.locator('g.note-symbol');
  104 |     const noteCount = await notes.count();
  105 |     console.log(`Found ${noteCount} notes`);
  106 |
  107 |     // Get note positions to verify they exist
  108 |     const notePositions: number[] = [];
  109 |     for (let i = 0; i < Math.min(noteCount, 15); i++) {
  110 |       const note = notes.nth(i);
> 111 |       const position = await note.getAttribute('data-slot');
      |                                   ^ Error: locator.getAttribute: Test timeout of 20000ms exceeded.
  112 |       if (position) {
  113 |         notePositions.push(parseInt(position));
  114 |       }
  115 |     }
  116 |     console.log('Note positions (first 15):', notePositions);
  117 |
  118 |     // *** NEW: Check visual spacing by measuring actual X positions ***
  119 |     console.log('\n=== Visual Spacing Analysis ===');
  120 |     
  121 |     // Get the X positions of notes and measure lines
  122 |     const visualPositions: { slot: number; x: number; type: 'note' | 'measure' }[] = [];
  123 |     
  124 |     // Get note X positions
  125 |     for (let i = 0; i < Math.min(noteCount, 15); i++) {
  126 |       const note = notes.nth(i);
  127 |       const slot = await note.getAttribute('data-slot');
  128 |       // Notes use circle elements with cx/cy attributes, not transforms
  129 |       const circle = note.locator('circle').first();
  130 |       const cx = await circle.getAttribute('cx');
  131 |       if (slot && cx) {
  132 |         const x = parseFloat(cx);
  133 |         visualPositions.push({ slot: parseInt(slot), x, type: 'note' });
  134 |       }
  135 |     }
  136 |     
  137 |     // Get measure line X positions
  138 |     for (let i = 0; i < measureLineCount; i++) {
  139 |       const line = measureLines.nth(i);
  140 |       const slot = await line.getAttribute('data-slot');
  141 |       const x1 = await line.getAttribute('x1');
  142 |       if (slot && x1) {
  143 |         visualPositions.push({ slot: parseInt(slot), x: parseFloat(x1), type: 'measure' });
  144 |       }
  145 |     }
  146 |     
  147 |     // Sort by slot for analysis
  148 |     visualPositions.sort((a, b) => a.slot - b.slot);
  149 |     
  150 |     console.log('Visual positions by slot:');
  151 |     visualPositions.forEach(pos => {
  152 |       console.log(`  Slot ${pos.slot}: X=${pos.x.toFixed(1)} (${pos.type})`);
  153 |     });
  154 |     
  155 |     // Analyze spacing around measure lines
  156 |     const measureLineSlots = visualPositions.filter(p => p.type === 'measure').map(p => p.slot);
  157 |     if (measureLineSlots.length > 0) {
  158 |       const measureSlot = measureLineSlots[0];
  159 |       const measureX = visualPositions.find(p => p.slot === measureSlot && p.type === 'measure')?.x;
  160 |       
  161 |       // Find notes before and after the measure line
  162 |       const noteBefore = visualPositions.filter(p => p.type === 'note' && p.slot < measureSlot).pop();
  163 |       const noteAfter = visualPositions.find(p => p.type === 'note' && p.slot > measureSlot);
  164 |       
  165 |       if (noteBefore && noteAfter && measureX !== undefined) {
  166 |         const beforeSpacing = measureX - noteBefore.x;
  167 |         const afterSpacing = noteAfter.x - measureX;
  168 |         
  169 |         console.log(`\nSpacing Analysis around measure line at slot ${measureSlot}:`);
  170 |         console.log(`  Note before (slot ${noteBefore.slot}): X=${noteBefore.x.toFixed(1)}`);
  171 |         console.log(`  Measure line: X=${measureX.toFixed(1)}`);
  172 |         console.log(`  Note after (slot ${noteAfter.slot}): X=${noteAfter.x.toFixed(1)}`);
  173 |         console.log(`  Space before measure: ${beforeSpacing.toFixed(1)}px`);
  174 |         console.log(`  Space after measure: ${afterSpacing.toFixed(1)}px`);
  175 |         
  176 |         // Check if there's proper visual spacing after the measure line
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
```