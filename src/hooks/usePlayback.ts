// Playback Hook
// Handles audio synthesis, Tone.js integration, and playback control

import { useCallback, useEffect, useRef, useState } from 'react'
import * as Tone from 'tone'
import type { TabEditorAPI } from './useTabEditor'
import { 
  selectPreviewNoteEvent, 
  selectSyncedTempo, 
  selectSchedulingInfo 
} from '../state/selectors'

interface UsePlaybackOptions {
  enabled?: boolean
  enableEffects?: boolean
}

/**
 * Hook for handling audio playback and synthesis
 * Manages Tone.js integration and audio scheduling
 */
export const usePlayback = (
  tabEditor: TabEditorAPI,
  options: UsePlaybackOptions = {}
) => {
  const { enabled = true, enableEffects = true } = options
  const { state, audioEvents, countInEvents, startPlayback, stopPlayback, setPlaybackPosition } = tabEditor

  // Audio engine refs
  const synthRef = useRef<Tone.Synth | null>(null)
  const reverbRef = useRef<Tone.Reverb | null>(null)
  const distortionRef = useRef<Tone.Distortion | null>(null)
  const filterRef = useRef<Tone.Filter | null>(null)
  const chorusRef = useRef<Tone.Chorus | null>(null)
  const vibratoRef = useRef<Tone.Vibrato | null>(null)
  
  // Playback state
  const [isInitialized, setIsInitialized] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const scheduledEventsRef = useRef<number[]>([]) // Track scheduled event IDs
  const playbackStartTimeRef = useRef<number>(0)

  /**
   * Initialize audio context and create synth chain
   */
  const initializeAudio = useCallback(async () => {
    if (isInitialized || !enabled) return

    try {
      // Ensure audio context is started
      if (Tone.context.state !== 'running') {
        await Tone.start()
      }

      // Create synth
      synthRef.current = new Tone.Synth({
        oscillator: {
          type: 'triangle'
        },
        envelope: {
          attack: 0.02,
          decay: 0.1,
          sustain: 0.3,
          release: 1
        }
      })

      if (enableEffects) {
        // Create effects chain
        reverbRef.current = new Tone.Reverb({
          decay: 2,
          wet: 0.2
        })

        distortionRef.current = new Tone.Distortion({
          distortion: 0.4,
          wet: 0.1
        })

        filterRef.current = new Tone.Filter({
          frequency: 1200,
          type: 'lowpass',
          rolloff: -12
        })

        chorusRef.current = new Tone.Chorus({
          frequency: 1.5,
          delayTime: 3.5,
          depth: 0.7,
          wet: 0.3
        })

        vibratoRef.current = new Tone.Vibrato({
          frequency: 5,
          depth: 0.1,
          wet: 0.2
        })

        // Connect effects chain
        synthRef.current
          .connect(vibratoRef.current)
          .connect(chorusRef.current)
          .connect(distortionRef.current)
          .connect(filterRef.current)
          .connect(reverbRef.current)
          .toDestination()

        // Start time-based effects
        chorusRef.current.start()
      } else {
        // Direct connection without effects
        synthRef.current.toDestination()
      }

      setIsInitialized(true)
    } catch (error) {
      console.error('Failed to initialize audio:', error)
    }
  }, [enabled, enableEffects, isInitialized])

  /**
   * Cleanup audio resources
   */
  const cleanupAudio = useCallback(() => {
    // Stop any scheduled events
    scheduledEventsRef.current.forEach(eventId => {
      Tone.Transport.clear(eventId)
    })
    scheduledEventsRef.current = []

    // Dispose of audio nodes
    if (synthRef.current) {
      synthRef.current.dispose()
      synthRef.current = null
    }
    if (reverbRef.current) {
      reverbRef.current.dispose()
      reverbRef.current = null
    }
    if (distortionRef.current) {
      distortionRef.current.dispose()
      distortionRef.current = null
    }
    if (filterRef.current) {
      filterRef.current.dispose()
      filterRef.current = null
    }
    if (chorusRef.current) {
      chorusRef.current.dispose()
      chorusRef.current = null
    }
    if (vibratoRef.current) {
      vibratoRef.current.dispose()
      vibratoRef.current = null
    }

    setIsInitialized(false)
  }, [])

  /**
   * Schedule audio events for playback
   */
  const scheduleAudioEvents = useCallback((events: typeof audioEvents) => {
    if (!synthRef.current || !enabled) return

    // Clear previously scheduled events
    scheduledEventsRef.current.forEach(eventId => {
      Tone.Transport.clear(eventId)
    })
    scheduledEventsRef.current = []

    // Schedule new events
    events.forEach(event => {
      if (event.stringIndex >= 0) { // Skip count-in events
        const eventId = Tone.Transport.schedule((time) => {
          if (synthRef.current && !state.isSynthMuted) {
            synthRef.current.triggerAttackRelease(
              event.frequency,
              event.duration,
              time,
              event.velocity
            )
          }
        }, event.time)
        
        scheduledEventsRef.current.push(eventId as number)
      }
    })
  }, [enabled, state.isSynthMuted])

  /**
   * Start playback with optional count-in
   */
  const play = useCallback(async () => {
    if (!enabled || !isInitialized) {
      await initializeAudio()
      if (!isInitialized) return
    }

    // Calculate synced tempo for video playback
    const syncedTempo = selectSyncedTempo(state.tempo, state.videoPlaybackRate)
    Tone.Transport.bpm.value = syncedTempo

    // Prepare audio events
    const eventsToSchedule = state.countIn 
      ? [...countInEvents, ...audioEvents]
      : audioEvents

    // Schedule events
    scheduleAudioEvents(eventsToSchedule)

    // Set transport position
    const startTime = state.countIn ? countInEvents[0]?.time || 0 : 0
    Tone.Transport.seconds = Math.max(0, startTime)

    // Start playback
    playbackStartTimeRef.current = Tone.now()
    startPlayback()
    Tone.Transport.start()

  }, [
    enabled, 
    isInitialized, 
    initializeAudio, 
    state.tempo, 
    state.videoPlaybackRate, 
    state.countIn,
    audioEvents, 
    countInEvents, 
    scheduleAudioEvents, 
    startPlayback
  ])

  /**
   * Stop playback
   */
  const stop = useCallback(() => {
    Tone.Transport.stop()
    Tone.Transport.cancel() // Clear all scheduled events
    
    // Clear our tracked events
    scheduledEventsRef.current = []
    
    stopPlayback()
    setCurrentTime(0)
  }, [stopPlayback])

  /**
   * Pause playback
   */
  const pause = useCallback(() => {
    Tone.Transport.pause()
    // Don't clear events, so we can resume
  }, [])

  /**
   * Resume playback
   */
  const resume = useCallback(() => {
    if (state.isPlaying) {
      Tone.Transport.start()
    }
  }, [state.isPlaying])

  /**
   * Preview a single note
   */
  const previewNote = useCallback(async (fret: number, stringIndex: number) => {
    if (!enabled || !synthRef.current) return

    if (!isInitialized) {
      await initializeAudio()
      if (!isInitialized) return
    }

    const previewEvent = selectPreviewNoteEvent(fret, stringIndex)
    
    if (!state.isSynthMuted) {
      synthRef.current.triggerAttackRelease(
        previewEvent.frequency,
        previewEvent.duration,
        Tone.now(),
        previewEvent.velocity
      )
    }
  }, [enabled, isInitialized, initializeAudio, state.isSynthMuted])

  /**
   * Update effects parameters
   */
  const updateEffects = useCallback((effectsConfig: {
    reverb?: { decay?: number; wet?: number }
    distortion?: { distortion?: number; wet?: number }
    filter?: { frequency?: number; type?: 'lowpass' | 'highpass' | 'bandpass' }
    chorus?: { frequency?: number; depth?: number; wet?: number }
    vibrato?: { frequency?: number; depth?: number; wet?: number }
  }) => {
    if (!enableEffects) return

    if (effectsConfig.reverb && reverbRef.current) {
      if (effectsConfig.reverb.decay !== undefined) {
        reverbRef.current.decay = effectsConfig.reverb.decay
      }
      if (effectsConfig.reverb.wet !== undefined) {
        reverbRef.current.wet.value = effectsConfig.reverb.wet
      }
    }

    if (effectsConfig.distortion && distortionRef.current) {
      if (effectsConfig.distortion.distortion !== undefined) {
        distortionRef.current.distortion = effectsConfig.distortion.distortion
      }
      if (effectsConfig.distortion.wet !== undefined) {
        distortionRef.current.wet.value = effectsConfig.distortion.wet
      }
    }

    if (effectsConfig.filter && filterRef.current) {
      if (effectsConfig.filter.frequency !== undefined) {
        filterRef.current.frequency.value = effectsConfig.filter.frequency
      }
      if (effectsConfig.filter.type !== undefined) {
        filterRef.current.type = effectsConfig.filter.type
      }
    }

    if (effectsConfig.chorus && chorusRef.current) {
      if (effectsConfig.chorus.frequency !== undefined) {
        chorusRef.current.frequency.value = effectsConfig.chorus.frequency
      }
      if (effectsConfig.chorus.depth !== undefined) {
        chorusRef.current.depth.value = effectsConfig.chorus.depth
      }
      if (effectsConfig.chorus.wet !== undefined) {
        chorusRef.current.wet.value = effectsConfig.chorus.wet
      }
    }

    if (effectsConfig.vibrato && vibratoRef.current) {
      if (effectsConfig.vibrato.frequency !== undefined) {
        vibratoRef.current.frequency.value = effectsConfig.vibrato.frequency
      }
      if (effectsConfig.vibrato.depth !== undefined) {
        vibratoRef.current.depth.value = effectsConfig.vibrato.depth
      }
      if (effectsConfig.vibrato.wet !== undefined) {
        vibratoRef.current.wet.value = effectsConfig.vibrato.wet
      }
    }
  }, [enableEffects])

  // Update current time for visual feedback
  useEffect(() => {
    if (!state.isPlaying) return

    const updateTime = () => {
      const now = Tone.Transport.seconds
      setCurrentTime(now)
      
      // Update playback position in state for visual feedback
      const slot = Math.floor((now * state.tempo / 60) / 0.25) // Convert to slots
      setPlaybackPosition(slot)
    }

    const intervalId = setInterval(updateTime, 16) // ~60fps updates
    return () => clearInterval(intervalId)
  }, [state.isPlaying, state.tempo, setPlaybackPosition])

  // Cleanup on unmount
  useEffect(() => {
    return cleanupAudio
  }, [cleanupAudio])

  // Initialize audio when hook is first used
  useEffect(() => {
    if (enabled && !isInitialized) {
      initializeAudio()
    }
  }, [enabled, initializeAudio, isInitialized])

  return {
    // Playback controls
    play,
    stop,
    pause,
    resume,
    
    // Note preview
    previewNote,
    
    // Effects control
    updateEffects,
    
    // Audio initialization
    initializeAudio,
    cleanupAudio,
    
    // State
    isInitialized,
    isPlaying: state.isPlaying,
    currentTime,
    isMuted: state.isSynthMuted,
    
    // Enabled state
    enabled
  }
}

export type PlaybackAPI = ReturnType<typeof usePlayback> 