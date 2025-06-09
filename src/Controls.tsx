import React, { forwardRef, useImperativeHandle } from 'react'
import { useAudio, useNotePreview } from './contexts/AudioContext'
import type { TabData } from './types'

// Legacy interface preserved for backward compatibility
interface ControlsProps {
  tabData: TabData
  currentPosition: { timeSlot: number; stringIndex: number }
  onNotesPlaying: (notes: { fret: number; stringIndex: number }[]) => void
  tempo: number
  onPlaybackStateChange?: (isPlaying: boolean) => void
  onCurrentTimeSlotChange?: (timeSlot: number) => void
  onCountInStateChange?: (isCountingIn: boolean, beat?: number, totalBeats?: number) => void
  onPlaybackComplete?: () => void
  countInEnabled?: boolean
  timeSignature?: string
  pickupBeats?: number
  isMuted?: boolean
}

export interface ControlsRef {
  playPreviewNote: (fret: number, stringIndex: number) => void
  playTab: () => void
  playFromPosition: (startPosition: number) => void
  stopPlayback: (clearVisualFeedback?: boolean) => void
}

/**
 * Controls Component - Functional Audio System Integration
 * 
 * Replaced setTimeout-based timing with functional audio system
 * Clean delegation to AudioContext - no more timing anti-patterns
 * Maintains backward compatibility with legacy TabViewer
 */
const Controls = forwardRef<ControlsRef, ControlsProps>(({ 
  tabData, 
  currentPosition, 
  onNotesPlaying, 
  tempo, 
  onPlaybackStateChange, 
  onCurrentTimeSlotChange, 
  onCountInStateChange, 
  onPlaybackComplete, 
  countInEnabled, 
  timeSignature, 
  pickupBeats, 
  isMuted 
}, ref) => {
  
  // === Functional Audio Integration ===
  const { play, stop, jumpTo, state } = useAudio()
  const { previewNote } = useNotePreview()

  // === Legacy API Implementation ===
  // Clean delegation to functional audio system
  
  const playPreviewNote = async (fret: number, stringIndex: number) => {
    console.log(`🎵 Preview: fret ${fret}, string ${stringIndex}`)
    
    // Use functional audio system for preview
    await previewNote(fret, stringIndex)
    
    // Legacy visual feedback
    onNotesPlaying([{ fret, stringIndex }])
    // Remove visual feedback after a short delay
    setTimeout(() => onNotesPlaying([]), 800)
  }

  const playTab = async () => {
    console.log('▶️ Playing tab from beginning')
    await play()
    onPlaybackStateChange?.(true)
  }

  const playFromPosition = async (startPosition: number) => {
    console.log(`▶️ Playing from position ${startPosition}`)
    
    // Convert time slot to ticks (960 ticks per quarter note)
    const tickPosition = startPosition * 960
    
    // Jump to position first, then play
    jumpTo(tickPosition)
    await play()
    onPlaybackStateChange?.(true)
  }

  const stopPlayback = (clearVisualFeedback: boolean = true) => {
    console.log(`🛑 Stopping playback`)
    
    stop()
    onPlaybackStateChange?.(false)
    
    if (clearVisualFeedback) {
      onCurrentTimeSlotChange?.(-1)
      onNotesPlaying([])
    }
  }

  // === React Integration ===
  
  useImperativeHandle(ref, () => ({
    playPreviewNote,
    playTab,
    playFromPosition,
    stopPlayback
  }), [play, stop, previewNote, onNotesPlaying, onPlaybackStateChange, onCurrentTimeSlotChange])

  // Sync playback state changes to legacy handlers
  React.useEffect(() => {
    onPlaybackStateChange?.(state.isPlaying)
  }, [state.isPlaying, onPlaybackStateChange])

  // Sync position changes to legacy handlers
  React.useEffect(() => {
    const timeSlot = Math.floor(state.currentPosition / 960)
    onCurrentTimeSlotChange?.(timeSlot)
  }, [state.currentPosition, onCurrentTimeSlotChange])

  // Handle playback completion
  React.useEffect(() => {
    if (state.isPlaying === false && state.currentPosition > 0) {
      // Playback stopped after playing - likely completion
      onPlaybackComplete?.()
    }
  }, [state.isPlaying, state.currentPosition, onPlaybackComplete])

  // No UI - pure imperative API
  return null
})

Controls.displayName = 'Controls'

export default Controls