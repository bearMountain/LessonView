import { test, expect } from '@playwright/test';

test.describe('Intelligent Measure Placement', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    
    // Wait for the page to fully load
    await page.waitForLoadState('networkidle');
    
    // Wait for React app to render - look for the main layout instead of .app
    await page.waitForSelector('.main-layout', { timeout: 30000 });
    
    // Wait for the professional toolbar to be ready
    await page.waitForSelector('.professional-toolbar', { timeout: 30000 });
    
    // Wait for the tab viewer SVG to be ready
    await page.waitForSelector('.tab-svg', { timeout: 30000 });
    
    // Additional wait for React components to initialize
    await page.waitForTimeout(1000);
  });

  test('should add eighth notes and create proper measure boundaries with visual spacing', async ({ page }) => {
    // Set up console logging to capture debug messages
    const consoleMessages: string[] = [];
    page.on('console', msg => {
      if (msg.text().includes('🎵') || msg.text().includes('VisualOffset') || msg.text().includes('Updating visual offsets')) {
        consoleMessages.push(msg.text());
      }
    });

    // Check that toolbar is visible
    await expect(page.locator('.professional-toolbar')).toBeVisible();

    // Find and click the eighth NOTE button (SVG image), not the rest button (𝄾 symbol)
    // The note buttons use SVG images with the filename containing "Eigth Note"
    const eighthNoteButton = page.locator('button img[src*="Eigth Note"]').first();
    if (await eighthNoteButton.count() > 0) {
      await eighthNoteButton.click();
      console.log('✅ Clicked eighth note button (SVG image)');
    } else {
      // Fallback: try to find the note button container
      const noteButton = page.locator('.note-value-pair').nth(3).locator('button').first(); // 4th pair (eighth), first button (note)
      if (await noteButton.count() > 0) {
        await noteButton.click();
        console.log('✅ Clicked eighth note button (by position)');
      } else {
        console.log('❌ Could not find eighth note button');
        
        // Debug: list all buttons with images
        const imageButtons = page.locator('button img');
        const imageCount = await imageButtons.count();
        console.log(`Found ${imageCount} image buttons:`);
        for (let i = 0; i < Math.min(imageCount, 10); i++) {
          const src = await imageButtons.nth(i).getAttribute('src');
          console.log(`  ${i}: ${src}`);
        }
        
        // Take screenshot for debugging
        await page.screenshot({ path: 'tests/screenshots/no-eighth-button.png', fullPage: true });
      }
    }
    
    // Wait for selection to be processed
    await page.waitForTimeout(500);

    // Add eighth notes using "0, Tab" pattern
    console.log('Adding eighth notes...');
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press('0');
      await page.waitForTimeout(100);
      await page.keyboard.press('Tab');
      await page.waitForTimeout(100);
      console.log(`Added note ${i + 1}/12`);
    }

    // Wait for measure lines to be processed
    await page.waitForTimeout(3000);

    // Skip screenshots for now to avoid hanging
    // await page.screenshot({ path: 'tests/screenshots/before-checks.png', fullPage: true });

    // Check that measure lines exist in the DOM  
    const measureLines = page.locator('line.measure-line');
    const measureLineCount = await measureLines.count();
    
    console.log(`Found ${measureLineCount} measure lines`);

    // Get all measure line positions
    const measureLinePositions: number[] = [];
    for (let i = 0; i < measureLineCount; i++) {
      const line = measureLines.nth(i);
      const position = await line.getAttribute('data-slot');
      if (position) {
        measureLinePositions.push(parseInt(position));
      }
    }

    console.log('Measure line positions:', measureLinePositions);

    // Count notes to verify we have enough
    const notes = page.locator('g.note-symbol');
    const noteCount = await notes.count();
    console.log(`Found ${noteCount} notes`);

    // Get note positions to verify they exist
    const notePositions: number[] = [];
    for (let i = 0; i < Math.min(noteCount, 15); i++) {
      const note = notes.nth(i);
      const position = await note.getAttribute('data-slot');
      if (position) {
        notePositions.push(parseInt(position));
      }
    }
    console.log('Note positions (first 15):', notePositions);

    // *** NEW: Check visual spacing by measuring actual X positions ***
    console.log('\n=== Visual Spacing Analysis ===');
    
    // Get the X positions of notes and measure lines
    const visualPositions: { slot: number; x: number; type: 'note' | 'measure' }[] = [];
    
    // Get note X positions
    for (let i = 0; i < Math.min(noteCount, 15); i++) {
      const note = notes.nth(i);
      const slot = await note.getAttribute('data-slot');
      // Notes use circle elements with cx/cy attributes, not transforms
      const circle = note.locator('circle').first();
      const cx = await circle.getAttribute('cx');
      if (slot && cx) {
        const x = parseFloat(cx);
        visualPositions.push({ slot: parseInt(slot), x, type: 'note' });
      }
    }
    
    // Get measure line X positions
    for (let i = 0; i < measureLineCount; i++) {
      const line = measureLines.nth(i);
      const slot = await line.getAttribute('data-slot');
      const x1 = await line.getAttribute('x1');
      if (slot && x1) {
        visualPositions.push({ slot: parseInt(slot), x: parseFloat(x1), type: 'measure' });
      }
    }
    
    // Sort by slot for analysis
    visualPositions.sort((a, b) => a.slot - b.slot);
    
    console.log('Visual positions by slot:');
    visualPositions.forEach(pos => {
      console.log(`  Slot ${pos.slot}: X=${pos.x.toFixed(1)} (${pos.type})`);
    });
    
    // Analyze spacing around measure lines
    const measureLineSlots = visualPositions.filter(p => p.type === 'measure').map(p => p.slot);
    if (measureLineSlots.length > 0) {
      const measureSlot = measureLineSlots[0];
      const measureX = visualPositions.find(p => p.slot === measureSlot && p.type === 'measure')?.x;
      
      // Find notes before and after the measure line
      const noteBefore = visualPositions.filter(p => p.type === 'note' && p.slot < measureSlot).pop();
      const noteAfter = visualPositions.find(p => p.type === 'note' && p.slot > measureSlot);
      
      if (noteBefore && noteAfter && measureX !== undefined) {
        const beforeSpacing = measureX - noteBefore.x;
        const afterSpacing = noteAfter.x - measureX;
        
        console.log(`\nSpacing Analysis around measure line at slot ${measureSlot}:`);
        console.log(`  Note before (slot ${noteBefore.slot}): X=${noteBefore.x.toFixed(1)}`);
        console.log(`  Measure line: X=${measureX.toFixed(1)}`);
        console.log(`  Note after (slot ${noteAfter.slot}): X=${noteAfter.x.toFixed(1)}`);
        console.log(`  Space before measure: ${beforeSpacing.toFixed(1)}px`);
        console.log(`  Space after measure: ${afterSpacing.toFixed(1)}px`);
        
        // Check if there's proper visual spacing after the measure line
        if (afterSpacing > beforeSpacing * 1.5) {
          console.log('✅ Visual spacing detected: [E-|-*-] pattern');
        } else if (afterSpacing < beforeSpacing * 0.5) {
          console.log('❌ No visual spacing: [E-|*-] pattern (notes too close to measure line)');
        } else {
          console.log('⚠️ Minimal visual spacing: between [E-|*-] and [E-|-*-]');
        }
        
        // Calculate expected positions based on slot spacing
        const expectedSlotSpacing = (noteAfter.x - noteBefore.x) / (noteAfter.slot - noteBefore.slot);
        console.log(`  Expected slot spacing: ${expectedSlotSpacing.toFixed(1)}px per slot`);
        
        // For intelligent measure placement, notes after the measure line should be shifted by exactly 1 slot
        const expectedNoteAfterX = measureX + (noteAfter.slot - measureSlot) * expectedSlotSpacing + expectedSlotSpacing; // +1 slot shift
        const actualOffset = noteAfter.x - (measureX + (noteAfter.slot - measureSlot) * expectedSlotSpacing); // offset from normal position
        console.log(`  Expected note after X (with 1-slot shift): ${expectedNoteAfterX.toFixed(1)}`);
        console.log(`  Actual note after X: ${noteAfter.x.toFixed(1)}`);
        console.log(`  Visual offset applied: ${actualOffset.toFixed(1)}px (should be ${expectedSlotSpacing.toFixed(1)}px for 1-slot shift)`);
        
        // Check if the offset is exactly 1 slot width (within small tolerance)
        const tolerance = expectedSlotSpacing * 0.1; // 10% tolerance
        const desiredOffset = expectedSlotSpacing; // Exactly 1 slot width
        
        if (Math.abs(actualOffset - desiredOffset) <= tolerance) {
          console.log('✅ Correct 1-slot shift detected - intelligent spacing working perfectly');
        } else if (actualOffset > desiredOffset + tolerance) {
          console.log(`❌ Too much offset: ${actualOffset.toFixed(1)}px vs expected ${desiredOffset.toFixed(1)}px - notes shifted too far`);
        } else if (actualOffset < desiredOffset - tolerance) {
          console.log(`❌ Too little offset: ${actualOffset.toFixed(1)}px vs expected ${desiredOffset.toFixed(1)}px - notes not shifted enough`);
        } else {
          console.log(`⚠️ Offset close but not exact: ${actualOffset.toFixed(1)}px vs expected ${desiredOffset.toFixed(1)}px`);
        }
        
        // Assertion: The offset should be exactly 1 slot width
        const offsetIsCorrect = Math.abs(actualOffset - desiredOffset) <= tolerance;
        if (!offsetIsCorrect) {
          console.log(`💥 TEST SHOULD FAIL: Expected 1-slot shift (${desiredOffset.toFixed(1)}px) but got ${actualOffset.toFixed(1)}px`);
        }
      }
    }

    // Print console messages for debugging
    console.log('\n=== Console messages ===');
    consoleMessages.forEach(msg => console.log(msg));

    // Check if we have enough notes to trigger measure boundaries
    if (noteCount >= 8) {
      console.log('✅ Have enough notes to trigger measure boundaries');
      
      if (measureLineCount > 0) {
        console.log('✅ Found measure lines');
        
        // For eighth note pattern, measure lines should be intelligently placed
        const firstBoundary = measureLinePositions[0];
        console.log(`First boundary at slot ${firstBoundary}`);
        
        // Check if the boundary is intelligently placed vs standard 16-slot interval
        if (firstBoundary !== 16) {
          console.log('✅ Boundary is intelligently placed (not at standard slot 16)');
        } else {
          console.log('⚠️ Boundary is at standard slot 16 - may not be using intelligent placement');
        }
      } else {
        console.log('❌ No measure lines found');
        console.log('Note positions:', notePositions);
        console.log('Tab data might not be long enough to trigger measure boundaries');
      }
    } else {
      console.log('❌ Not enough notes found to trigger measure boundaries');
    }

    // Skip final screenshot to avoid hanging
    // await page.screenshot({ path: 'tests/screenshots/eighth-note-measure-placement.png', fullPage: true });
    
    console.log('✅ Test completed');
    
    // Basic assertions
    expect(noteCount).toBeGreaterThan(5); // Should have added some notes
    
    // If we have enough notes for measure boundaries, they should exist
    if (noteCount >= 8) {
      expect(measureLineCount).toBeGreaterThan(0);
      
      // NEW: Assert that notes after measure lines are shifted by exactly 1 slot
      if (visualPositions.length > 0) {
        const measureLineSlots = visualPositions.filter(p => p.type === 'measure').map(p => p.slot);
        if (measureLineSlots.length > 0) {
          const measureSlot = measureLineSlots[0];
          const measureX = visualPositions.find(p => p.slot === measureSlot && p.type === 'measure')?.x;
          
          const noteBefore = visualPositions.filter(p => p.type === 'note' && p.slot < measureSlot).pop();
          const noteAfter = visualPositions.find(p => p.type === 'note' && p.slot > measureSlot);
          
          if (noteBefore && noteAfter && measureX !== undefined) {
            const expectedSlotSpacing = (noteAfter.x - noteBefore.x) / (noteAfter.slot - noteBefore.slot);
            const actualOffset = noteAfter.x - (measureX + (noteAfter.slot - measureSlot) * expectedSlotSpacing);
            const desiredOffset = expectedSlotSpacing; // Exactly 1 slot width
            const tolerance = expectedSlotSpacing * 0.1; // 10% tolerance
            
            // This assertion should FAIL until we fix the visual offset calculation
            expect(Math.abs(actualOffset - desiredOffset)).toBeLessThanOrEqual(tolerance);
          }
        }
      }
    }
  });

  test('debugging test - add just a few notes and inspect state', async ({ page }) => {
    // Set up console logging
    const consoleMessages: string[] = [];
    page.on('console', msg => {
      consoleMessages.push(msg.text());
    });

    // Get all available buttons first
    const allButtons = page.locator('button');
    const buttonCount = await allButtons.count();
    console.log(`Found ${buttonCount} buttons total`);
    
    for (let i = 0; i < Math.min(buttonCount, 20); i++) {
      const text = await allButtons.nth(i).textContent();
      console.log(`Button ${i}: "${text}"`);
    }

    // Try to find eighth note button (SVG image, not rest symbol)
    const eighthNoteButton = page.locator('button img[src*="Eigth Note"]').first();
    if (await eighthNoteButton.count() > 0) {
      await eighthNoteButton.click();
      console.log('✅ Clicked eighth note button (SVG image)');
    } else {
      console.log('❌ Eighth note button not found, trying position-based selection...');
      
      // Try clicking a note button by position (4th pair, first button = eighth note)
      const noteButton = page.locator('.note-value-pair').nth(3).locator('button').first();
      if (await noteButton.count() > 0) {
        await noteButton.click();
        console.log('✅ Clicked eighth note button (by position)');
      } else {
        // Try clicking a quarter note as fallback
        const quarterButton = page.locator('button img[src*="Quarter Note"]').first();
        if (await quarterButton.count() > 0) {
          await quarterButton.click();
          console.log('✅ Clicked quarter note button as fallback');
        }
      }
    }
    
    await page.waitForTimeout(500);

    // Add just 3 notes
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press('0');
      await page.waitForTimeout(200);
      await page.keyboard.press('Tab');
      await page.waitForTimeout(200);
    }

    await page.waitForTimeout(2000);

    // Check state
    const notes = page.locator('g.note-symbol');
    const noteCount = await notes.count();
    console.log(`Found ${noteCount} notes`);

    // Get note details
    for (let i = 0; i < noteCount; i++) {
      const note = notes.nth(i);
      const slot = await note.getAttribute('data-slot');
      const string = await note.getAttribute('data-string');
      console.log(`Note ${i}: slot=${slot}, string=${string}`);
    }

    // Skip the screenshot for now to avoid hanging
    // await page.screenshot({ path: 'tests/screenshots/debug-test.png', fullPage: true });
  });
}); 