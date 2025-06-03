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

    // Take a screenshot before checking
    await page.screenshot({ path: 'tests/screenshots/before-checks.png', fullPage: true });

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

    // Take a final screenshot
    await page.screenshot({ path: 'tests/screenshots/eighth-note-measure-placement.png', fullPage: true });
    
    console.log('✅ Test completed - screenshots saved');
    
    // Basic assertions
    expect(noteCount).toBeGreaterThan(5); // Should have added some notes
    
    // If we have enough notes for measure boundaries, they should exist
    if (noteCount >= 8) {
      expect(measureLineCount).toBeGreaterThan(0);
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

    // Check console messages
    console.log('\n=== All console messages ===');
    consoleMessages.forEach((msg, i) => console.log(`${i}: ${msg}`));

    await page.screenshot({ path: 'tests/screenshots/debug-test.png', fullPage: true });
  });
}); 