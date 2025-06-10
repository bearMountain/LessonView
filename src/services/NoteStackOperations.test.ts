import { describe, it, expect } from '@jest/globals';
import {
  addNoteToStack,
  removeNoteFromString,
  findStackAtPosition,
  getNoteAt,
  updateStackDuration,
  moveStack,
  removeStack,
  getNextAvailablePosition,
  validateTab,
  getTotalDuration
} from './NoteStackOperations';
import type { Tab, NoteStack, Duration } from '../types/notestack';

describe('NoteStack Operations', () => {
  describe('addNoteToStack', () => {
    it('should create new stack when position is empty', () => {
      const tab: Tab = [];
      const result = addNoteToStack(tab, 0, 1, 5, 'quarter');
      
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        musicalPosition: 0,
        duration: 'quarter',
        notes: [{ string: 1, fret: 5 }]
      });
      expect(result[0].id).toBeDefined();
    });

    it('should add note to existing stack', () => {
      const existingStack: NoteStack = {
        id: 'stack-1',
        musicalPosition: 960,
        duration: 'quarter',
        notes: [{ string: 0, fret: 3 }]
      };
      const tab: Tab = [existingStack];
      
      const result = addNoteToStack(tab, 960, 1, 7, 'quarter');
      
      expect(result).toHaveLength(1);
      expect(result[0].notes).toHaveLength(2);
      expect(result[0].notes).toContainEqual({ string: 0, fret: 3 });
      expect(result[0].notes).toContainEqual({ string: 1, fret: 7 });
    });

    it('should replace note on same string in existing stack', () => {
      const existingStack: NoteStack = {
        id: 'stack-1',
        musicalPosition: 960,
        duration: 'quarter',
        notes: [{ string: 1, fret: 3 }]
      };
      const tab: Tab = [existingStack];
      
      const result = addNoteToStack(tab, 960, 1, 7, 'half');
      
      expect(result).toHaveLength(1);
      expect(result[0].notes).toHaveLength(1);
      expect(result[0].notes[0]).toEqual({ string: 1, fret: 7 });
      expect(result[0].duration).toBe('half');
    });

    it('should maintain temporal ordering', () => {
      const tab: Tab = [
        { id: 'stack-1', musicalPosition: 1920, duration: 'quarter', notes: [{ string: 0, fret: 2 }] },
        { id: 'stack-2', musicalPosition: 2880, duration: 'quarter', notes: [{ string: 1, fret: 4 }] }
      ];
      
      const result = addNoteToStack(tab, 960, 2, 6, 'eighth');
      
      expect(result).toHaveLength(3);
      expect(result.map(s => s.musicalPosition)).toEqual([960, 1920, 2880]);
    });

    it('should preserve immutability', () => {
      const tab: Tab = [
        { id: 'stack-1', musicalPosition: 0, duration: 'quarter', notes: [{ string: 0, fret: 1 }] }
      ];
      const originalLength = tab.length;
      
      const result = addNoteToStack(tab, 960, 1, 3, 'quarter');
      
      expect(tab).toHaveLength(originalLength); // Original unchanged
      expect(result).not.toBe(tab); // New array returned
    });
  });

  describe('removeNoteFromString', () => {
    it('should remove note from string', () => {
      const stack: NoteStack = {
        id: 'stack-1',
        musicalPosition: 960,
        duration: 'quarter',
        notes: [
          { string: 0, fret: 3 },
          { string: 1, fret: 5 },
          { string: 2, fret: 7 }
        ]
      };
      const tab: Tab = [stack];
      
      const result = removeNoteFromString(tab, 960, 1);
      
      expect(result).toHaveLength(1);
      expect(result[0].notes).toHaveLength(2);
      expect(result[0].notes).toContainEqual({ string: 0, fret: 3 });
      expect(result[0].notes).toContainEqual({ string: 2, fret: 7 });
      expect(result[0].notes).not.toContainEqual({ string: 1, fret: 5 });
    });

    it('should remove entire stack when last note is removed', () => {
      const stack: NoteStack = {
        id: 'stack-1',
        musicalPosition: 960,
        duration: 'quarter',
        notes: [{ string: 1, fret: 5 }]
      };
      const tab: Tab = [stack];
      
      const result = removeNoteFromString(tab, 960, 1);
      
      expect(result).toHaveLength(0);
    });

    it('should do nothing when position has no stack', () => {
      const tab: Tab = [
        { id: 'stack-1', musicalPosition: 960, duration: 'quarter', notes: [{ string: 0, fret: 3 }] }
      ];
      
      const result = removeNoteFromString(tab, 1920, 1);
      
      expect(result).toEqual(tab);
    });

    it('should do nothing when string has no note', () => {
      const stack: NoteStack = {
        id: 'stack-1',
        musicalPosition: 960,
        duration: 'quarter',
        notes: [{ string: 0, fret: 3 }]
      };
      const tab: Tab = [stack];
      
      const result = removeNoteFromString(tab, 960, 1);
      
      expect(result).toEqual(tab);
    });
  });

  describe('findStackAtPosition', () => {
    it('should find stack at exact position', () => {
      const stack: NoteStack = {
        id: 'stack-1',
        musicalPosition: 960,
        duration: 'quarter',
        notes: [{ string: 1, fret: 5 }]
      };
      const tab: Tab = [stack];
      
      const result = findStackAtPosition(tab, 960);
      
      expect(result).toBe(stack);
    });

    it('should return undefined when no stack at position', () => {
      const tab: Tab = [
        { id: 'stack-1', musicalPosition: 960, duration: 'quarter', notes: [{ string: 1, fret: 5 }] }
      ];
      
      const result = findStackAtPosition(tab, 1920);
      
      expect(result).toBeUndefined();
    });
  });

  describe('getNoteAt', () => {
    it('should get note on specific string at position', () => {
      const stack: NoteStack = {
        id: 'stack-1',
        musicalPosition: 960,
        duration: 'quarter',
        notes: [
          { string: 0, fret: 3 },
          { string: 1, fret: 5 },
          { string: 2, fret: 7 }
        ]
      };
      const tab: Tab = [stack];
      
      const result = getNoteAt(tab, 960, 1);
      
      expect(result).toEqual({ fret: 5 });
    });

    it('should return null when no note on string', () => {
      const stack: NoteStack = {
        id: 'stack-1',
        musicalPosition: 960,
        duration: 'quarter',
        notes: [{ string: 0, fret: 3 }]
      };
      const tab: Tab = [stack];
      
      const result = getNoteAt(tab, 960, 1);
      
      expect(result).toBeNull();
    });

    it('should return null when no stack at position', () => {
      const tab: Tab = [];
      
      const result = getNoteAt(tab, 960, 1);
      
      expect(result).toBeNull();
    });
  });

  describe('updateStackDuration', () => {
    it('should update duration of specific stack', () => {
      const stack: NoteStack = {
        id: 'stack-1',
        musicalPosition: 960,
        duration: 'quarter',
        notes: [{ string: 1, fret: 5 }]
      };
      const tab: Tab = [stack];
      
      const result = updateStackDuration(tab, 'stack-1', 'half');
      
      expect(result).toHaveLength(1);
      expect(result[0].duration).toBe('half');
      expect(result[0].id).toBe('stack-1');
    });

    it('should preserve other stacks unchanged', () => {
      const tab: Tab = [
        { id: 'stack-1', musicalPosition: 0, duration: 'quarter', notes: [{ string: 0, fret: 1 }] },
        { id: 'stack-2', musicalPosition: 960, duration: 'quarter', notes: [{ string: 1, fret: 3 }] },
        { id: 'stack-3', musicalPosition: 1920, duration: 'quarter', notes: [{ string: 2, fret: 5 }] }
      ];
      
      const result = updateStackDuration(tab, 'stack-2', 'eighth');
      
      expect(result[0].duration).toBe('quarter'); // unchanged
      expect(result[1].duration).toBe('eighth');   // changed
      expect(result[2].duration).toBe('quarter'); // unchanged
    });
  });

  describe('moveStack', () => {
    it('should move stack to new position and maintain temporal order', () => {
      const tab: Tab = [
        { id: 'stack-1', musicalPosition: 0, duration: 'quarter', notes: [{ string: 0, fret: 1 }] },
        { id: 'stack-2', musicalPosition: 960, duration: 'quarter', notes: [{ string: 1, fret: 3 }] },
        { id: 'stack-3', musicalPosition: 1920, duration: 'quarter', notes: [{ string: 2, fret: 5 }] }
      ];
      
      const result = moveStack(tab, 'stack-1', 2880);
      
      expect(result.map(s => s.id)).toEqual(['stack-2', 'stack-3', 'stack-1']);
      expect(result.map(s => s.musicalPosition)).toEqual([960, 1920, 2880]);
    });
  });

  describe('getNextAvailablePosition', () => {
    it('should stay in place when cursor is not on existing stack', () => {
      const tab: Tab = [
        { id: 'stack-1', musicalPosition: 0, duration: 'quarter', notes: [{ string: 0, fret: 1 }] },
        { id: 'stack-2', musicalPosition: 1920, duration: 'quarter', notes: [{ string: 1, fret: 3 }] }
      ];
      
      const result = getNextAvailablePosition(tab, 960);
      
      expect(result).toBe(960); // Stay in place - no stack at cursor position
    });

    it('should jump forward by note duration when cursor is on existing stack', () => {
      const tab: Tab = [
        { id: 'stack-1', musicalPosition: 960, duration: 'quarter', notes: [{ string: 0, fret: 1 }] },
        { id: 'stack-2', musicalPosition: 1920, duration: 'half', notes: [{ string: 1, fret: 3 }] }
      ];
      
      const result = getNextAvailablePosition(tab, 960);
      
      expect(result).toBe(1920); // Jump forward by quarter note duration (960 ticks)
    });
  });

  describe('validateTab', () => {
    it('should validate correct tab structure', () => {
      const tab: Tab = [
        { id: 'stack-1', musicalPosition: 0, duration: 'quarter', notes: [{ string: 0, fret: 1 }] },
        { id: 'stack-2', musicalPosition: 960, duration: 'half', notes: [{ string: 1, fret: 3 }] }
      ];
      
      const result = validateTab(tab);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect invalid fret numbers', () => {
      const tab: Tab = [
        { id: 'stack-1', musicalPosition: 0, duration: 'quarter', notes: [{ string: 0, fret: -1 }] },
        { id: 'stack-2', musicalPosition: 960, duration: 'quarter', notes: [{ string: 1, fret: 13 }] }
      ];
      
      const result = validateTab(tab);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid fret number: -1 in stack stack-1');
              expect(result.errors).toContain('Invalid fret number: 13 in stack stack-2');
    });

    it('should detect invalid string numbers', () => {
      const tab: Tab = [
        { id: 'stack-1', musicalPosition: 0, duration: 'quarter', notes: [{ string: -1, fret: 5 }] },
        { id: 'stack-2', musicalPosition: 960, duration: 'quarter', notes: [{ string: 3, fret: 5 }] }
      ];
      
      const result = validateTab(tab);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid string index: -1 in stack stack-1');
      expect(result.errors).toContain('Invalid string index: 3 in stack stack-2');
    });
  });

  describe('getTotalDuration', () => {
    it('should calculate total duration in ticks', () => {
      const tab: Tab = [
        { id: 'stack-1', musicalPosition: 0, duration: 'quarter', notes: [{ string: 0, fret: 1 }] },
        { id: 'stack-2', musicalPosition: 960, duration: 'half', notes: [{ string: 1, fret: 3 }] },
        { id: 'stack-3', musicalPosition: 2880, duration: 'quarter', notes: [{ string: 2, fret: 5 }] }
      ];
      
      const result = getTotalDuration(tab);
      
      expect(result).toBe(3840); // Last position (2880) + last duration (960) = 3840
    });

    it('should return 0 for empty tab', () => {
      const tab: Tab = [];
      
      const result = getTotalDuration(tab);
      
      expect(result).toBe(0);
    });
  });
}); 