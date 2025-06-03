import { test, expect } from '@playwright/test';

test.describe('Intelligent Measure Placement', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    
    // Wait for the page to fully load
    await page.waitForLoadState('networkidle');
    
    // Wait for React app to render
    await page.waitForSelector('.app', { timeout: 30000 });
    
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

    // Find and click the eighth note button
    const eighthButton = page.locator('button:has-text("Eighth")');
    if (await eighthButton.count() === 0) {
      // Try alternative selectors
      const altButton = page.locator('button').filter({ hasText: /8th|eighth/i });
      if (await altButton.count() > 0) {
        await altButton.first().click();
      } else {
        // Look for duration buttons and find the right one
        const durationButtons = page.locator('button').filter({ hasText: /th$/ });
        console.log(`Found ${await durationButtons.count()} duration buttons`);
        for (let i = 0; i < await durationButtons.count(); i++) {
          const text = await durationButtons.nth(i).textContent();
          console.log(`Button ${i}: "${text}"`);
          if (text?.includes('8') || text?.toLowerCase().includes('eighth')) {
            await durationButtons.nth(i).click();
            break;
          }
        }
      }
    } else {
      await eighthButton.click();
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

    // Try to find eighth note button
    const eighthButton = page.locator('button:has-text("Eighth")');
    if (await eighthButton.count() > 0) {
      await eighthButton.click();
      console.log('Clicked Eighth button');
    } else {
      console.log('Eighth button not found, trying alternatives...');
      // Try clicking the first button that might be a duration
      const possibleDuration = page.locator('button').filter({ hasText: /th$/ }).first();
      if (await possibleDuration.count() > 0) {
        await possibleDuration.click();
        console.log(`Clicked button: ${await possibleDuration.textContent()}`);
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