import { describe, it, expect, beforeEach } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';
import { useNoteStackEditor } from './useNoteStackEditor';
import type { Tab, NoteStack } from '../types/notestack';

// Mock the layout services since we're testing the hook logic, not layout calculations
jest.mock('../services/NoteStackLayout', () => ({
  calculateDisplayPositions: jest.fn(() => []),
  getTotalTabWidth: jest.fn(() => 1000)
}));

describe('useNoteStackEditor Hook', () => {
  describe('Initial State', () => {
    it('should initialize with empty state', () => {
      const { result } = renderHook(() => useNoteStackEditor());
      
      expect(result.current.state.tab).toEqual([]);
      expect(result.current.state.currentPosition).toBe(0);
      expect(result.current.state.bpm).toBe(120);
      expect(result.current.state.selectedDuration).toBe('quarter');
      expect(result.current.state.selectedStacks).toEqual([]);
      expect(result.current.state.isPlaying).toBe(false);
      expect(result.current.state.isModified).toBe(false);
    });
  });

  describe('Note Management', () => {
    it('should add note to empty tab', () => {
      const { result } = renderHook(() => useNoteStackEditor());
      
      act(() => {
        result.current.addNote(0, 1, 5, 'quarter');
      });
      
      expect(result.current.state.tab).toHaveLength(1);
      expect(result.current.state.tab[0]).toMatchObject({
        musicalPosition: 0,
        duration: 'quarter',
        notes: [{ string: 1, fret: 5 }]
      });
      expect(result.current.state.isModified).toBe(true);
    });

    it('should use selectedDuration when duration not specified', () => {
      const { result } = renderHook(() => useNoteStackEditor());
      
      act(() => {
        result.current.setSelectedDuration('eighth');
      });
      
      act(() => {
        result.current.addNote(0, 1, 5); // No duration specified
      });
      
      expect(result.current.state.tab[0].duration).toBe('eighth');
    });

    it('should remove note from tab', () => {
      const { result } = renderHook(() => useNoteStackEditor());
      
      // Add a note first
      act(() => {
        result.current.addNote(960, 1, 5, 'quarter');
      });
      
      expect(result.current.state.tab).toHaveLength(1);
      
      // Remove the note
      act(() => {
        result.current.removeNote(960, 1);
      });
      
      expect(result.current.state.tab).toHaveLength(0);
      expect(result.current.state.isModified).toBe(true);
    });

    it('should update stack duration', () => {
      const { result } = renderHook(() => useNoteStackEditor());
      
      // Add a note first
      act(() => {
        result.current.addNote(0, 1, 5, 'quarter');
      });
      
      const stackId = result.current.state.tab[0].id;
      
      // Update duration
      act(() => {
        result.current.updateDuration(stackId, 'half');
      });
      
      expect(result.current.state.tab[0].duration).toBe('half');
      expect(result.current.state.isModified).toBe(true);
    });
  });

  describe('Cursor Navigation', () => {
    it('should set cursor position', () => {
      const { result } = renderHook(() => useNoteStackEditor());
      
      act(() => {
        result.current.setCursorPosition(1920);
      });
      
      expect(result.current.state.currentPosition).toBe(1920);
    });

    it('should move cursor left by quarter note', () => {
      const { result } = renderHook(() => useNoteStackEditor());
      
      // Set initial position
      act(() => {
        result.current.setCursorPosition(1920);
      });
      
      // Move left
      act(() => {
        result.current.moveCursorLeft();
      });
      
      expect(result.current.state.currentPosition).toBe(960); // 1920 - 960
    });

    it('should not move cursor left below 0', () => {
      const { result } = renderHook(() => useNoteStackEditor());
      
      // Already at 0
      expect(result.current.state.currentPosition).toBe(0);
      
      // Try to move left
      act(() => {
        result.current.moveCursorLeft();
      });
      
      expect(result.current.state.currentPosition).toBe(0);
    });

    it('should move cursor right by quarter note', () => {
      const { result } = renderHook(() => useNoteStackEditor());
      
      act(() => {
        result.current.moveCursorRight();
      });
      
      expect(result.current.state.currentPosition).toBe(960); // 0 + 960
    });
  });

  describe('Settings Management', () => {
    it('should update BPM', () => {
      const { result } = renderHook(() => useNoteStackEditor());
      
      act(() => {
        result.current.setBpm(140);
      });
      
      expect(result.current.state.bpm).toBe(140);
      expect(result.current.state.isModified).toBe(true);
    });

    it('should update time signature', () => {
      const { result } = renderHook(() => useNoteStackEditor());
      
      act(() => {
        result.current.setTimeSignature(3, 4);
      });
      
      expect(result.current.state.timeSignature).toEqual({
        numerator: 3,
        denominator: 4
      });
      expect(result.current.state.isModified).toBe(true);
    });

    it('should update selected duration', () => {
      const { result } = renderHook(() => useNoteStackEditor());
      
      act(() => {
        result.current.setSelectedDuration('eighth');
      });
      
      expect(result.current.state.selectedDuration).toBe('eighth');
    });
  });

  describe('UI State Management', () => {
    it('should update zoom', () => {
      const { result } = renderHook(() => useNoteStackEditor());
      
      act(() => {
        result.current.setZoom(1.5);
      });
      
      expect(result.current.state.zoom).toBe(1.5);
    });

    it('should toggle fretboard', () => {
      const { result } = renderHook(() => useNoteStackEditor());
      
      expect(result.current.state.showFretboard).toBe(false);
      
      act(() => {
        result.current.toggleFretboard();
      });
      
      expect(result.current.state.showFretboard).toBe(true);
      
      act(() => {
        result.current.toggleFretboard();
      });
      
      expect(result.current.state.showFretboard).toBe(false);
    });

    it('should set playing state', () => {
      const { result } = renderHook(() => useNoteStackEditor());
      
      act(() => {
        result.current.setPlaying(true);
      });
      
      expect(result.current.state.isPlaying).toBe(true);
      
      act(() => {
        result.current.setPlaying(false);
      });
      
      expect(result.current.state.isPlaying).toBe(false);
    });
  });

  describe('File Operations', () => {
    it('should load new tab', () => {
      const { result } = renderHook(() => useNoteStackEditor());
      
      const newTab: Tab = [
        {
          id: 'stack-1',
          musicalPosition: 0,
          duration: 'quarter',
          notes: [{ string: 0, fret: 3 }]
        },
        {
          id: 'stack-2',
          musicalPosition: 960,
          duration: 'half',
          notes: [{ string: 1, fret: 5 }]
        }
      ];
      
      act(() => {
        result.current.loadTab(newTab);
      });
      
      expect(result.current.state.tab).toEqual(newTab);
      expect(result.current.state.isModified).toBe(false); // Loading shouldn't mark as modified
    });

    it('should reset tab to empty state', () => {
      const { result } = renderHook(() => useNoteStackEditor());
      
      // Add some notes first
      act(() => {
        result.current.addNote(0, 1, 5, 'quarter');
        result.current.setBpm(140);
        result.current.setCursorPosition(1920);
      });
      
      expect(result.current.state.tab).toHaveLength(1);
      expect(result.current.state.bpm).toBe(140);
      
      // Reset
      act(() => {
        result.current.resetTab();
      });
      
      expect(result.current.state.tab).toHaveLength(0);
      expect(result.current.state.bpm).toBe(120); // Should reset to default
      expect(result.current.state.currentPosition).toBe(0);
      expect(result.current.state.isModified).toBe(false);
    });

    it('should mark and unmark as modified', () => {
      const { result } = renderHook(() => useNoteStackEditor());
      
      expect(result.current.state.isModified).toBe(false);
      
      act(() => {
        result.current.setModified(true);
      });
      
      expect(result.current.state.isModified).toBe(true);
      
      act(() => {
        result.current.setModified(false);
      });
      
      expect(result.current.state.isModified).toBe(false);
    });
  });

  describe('Query Functions', () => {
    it('should get note at position and string', () => {
      const { result } = renderHook(() => useNoteStackEditor());
      
      // Add a note
      act(() => {
        result.current.addNote(960, 1, 7, 'quarter');
      });
      
      const note = result.current.getNoteAtPosition(960, 1);
      expect(note).toEqual({ fret: 7 });
      
      const noNote = result.current.getNoteAtPosition(960, 0);
      expect(noNote).toBeNull();
    });

    it('should get stack at position', () => {
      const { result } = renderHook(() => useNoteStackEditor());
      
      // Add a note
      act(() => {
        result.current.addNote(960, 1, 7, 'quarter');
      });
      
      const stack = result.current.getStackAtPosition(960);
      expect(stack).toBeDefined();
      expect(stack?.notes).toContainEqual({ string: 1, fret: 7 });
      
      const noStack = result.current.getStackAtPosition(1920);
      expect(noStack).toBeUndefined();
    });
  });

  describe('Immutability', () => {
    it('should not mutate state directly', () => {
      const { result } = renderHook(() => useNoteStackEditor());
      
      const originalState = result.current.state;
      const originalTab = result.current.state.tab;
      
      act(() => {
        result.current.addNote(0, 1, 5, 'quarter');
      });
      
      // State reference should change
      expect(result.current.state).not.toBe(originalState);
      expect(result.current.state.tab).not.toBe(originalTab);
      
      // Original state should be unchanged
      expect(originalTab).toHaveLength(0);
      expect(result.current.state.tab).toHaveLength(1);
    });
  });

  describe('Derived State', () => {
    it('should provide memoized layout items', () => {
      const { result } = renderHook(() => useNoteStackEditor());
      
      expect(result.current.layoutItems).toBeDefined();
      expect(Array.isArray(result.current.layoutItems)).toBe(true);
    });

    it('should provide total width calculation', () => {
      const { result } = renderHook(() => useNoteStackEditor());
      
      expect(typeof result.current.totalWidth).toBe('number');
      expect(result.current.totalWidth).toBeGreaterThan(0);
    });
  });
}); 