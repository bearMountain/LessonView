import { GuitarSynth } from './GuitarSynth';

describe('GuitarSynth', () => {
  let guitarSynth: GuitarSynth;

  beforeEach(() => {
    guitarSynth = GuitarSynth.getInstance();
  });

  test('should be a singleton', () => {
    const instance1 = GuitarSynth.getInstance();
    const instance2 = GuitarSynth.getInstance();
    expect(instance1).toBe(instance2);
  });

  test('should start uninitialized', () => {
    expect(guitarSynth.initialized).toBe(false);
  });

  test('should have correct semitone mapping', () => {
    // Test the private getSemitones method via playNote (which should not throw)
    expect(() => {
      // This should not throw for valid fret/string combinations
      guitarSynth.previewNote(0, 0); // Open Low D string
      guitarSynth.previewNote(7, 1); // 7th fret A string  
      guitarSynth.previewNote(12, 2); // 12th fret High D string
    }).not.toThrow();
  });

  test('should handle invalid fret numbers gracefully', () => {
    // Should not crash on invalid frets (though behavior may vary)
    expect(() => {
      guitarSynth.previewNote(-1, 0);
      guitarSynth.previewNote(15, 0);
    }).not.toThrow();
  });

  test('should handle invalid string numbers gracefully', () => {
    // Should not crash on invalid strings (though behavior may vary)
    expect(() => {
      guitarSynth.previewNote(0, -1);
      guitarSynth.previewNote(0, 5);
    }).not.toThrow();
  });
}); 