import React, { useRef, useEffect, useState } from 'react';
import './VideoPlayer.css';

interface VideoPlayerProps {
  source?: string | File;
  currentTime?: number;
  isPlaying?: boolean;
  playbackRate?: number;
  isMuted?: boolean;
  onTimeUpdate?: (time: number) => void;
  onDurationChange?: (duration: number) => void;
  onPlayStateChange?: (isPlaying: boolean) => void;
  onMuteToggle?: () => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  source,
  currentTime = 0,
  isPlaying = false,
  playbackRate = 1.0,
  isMuted = false,
  onTimeUpdate,
  onDurationChange,
  onPlayStateChange,
  onMuteToggle,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [videoSrc, setVideoSrc] = useState<string>('');
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);

  // Handle video source changes
  useEffect(() => {
    if (!source) {
      setVideoSrc('');
      return;
    }

    if (source instanceof File) {
      // Create object URL for File
      const url = URL.createObjectURL(source);
      setVideoSrc(url);
      
      // Cleanup
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      // Direct string URL
      setVideoSrc(source);
    }
  }, [source]);

  // Handle play/pause state
  useEffect(() => {
    if (!videoRef.current) return;

    setIsTransitioning(true);
    
    if (isPlaying) {
      videoRef.current.play().catch(err => {
        console.error('Error playing video:', err);
        onPlayStateChange?.(false);
      }).finally(() => {
        // Allow seeks after a brief transition period
        setTimeout(() => setIsTransitioning(false), 200);
      });
    } else {
      videoRef.current.pause();
      setTimeout(() => setIsTransitioning(false), 100);
    }
  }, [isPlaying, onPlayStateChange]);

  // Handle playback rate
  useEffect(() => {
    if (!videoRef.current) return;
    videoRef.current.playbackRate = playbackRate;
  }, [playbackRate]);

  // Handle external time updates with improved seeking logic
  useEffect(() => {
    if (!videoRef.current || isTransitioning) return;
    
    const timeDiff = Math.abs(videoRef.current.currentTime - currentTime);
    
    // Only seek if the difference is significant (more than 0.2 seconds)
    // and we're not in the middle of a play/pause transition
    if (timeDiff > 0.2) {
      videoRef.current.currentTime = currentTime;
    }
  }, [currentTime, isTransitioning]);

  // Handle mute state
  useEffect(() => {
    if (!videoRef.current) return;
    videoRef.current.muted = isMuted;
  }, [isMuted]);

  // Video event handlers
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    onTimeUpdate?.(videoRef.current.currentTime);
  };

  const handleDurationChange = () => {
    if (!videoRef.current) return;
    const dur = videoRef.current.duration;
    onDurationChange?.(dur);
  };

  const handleError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const video = e.target as HTMLVideoElement;
    const error = video.error;
    
    if (error) {
      setVideoError(`Video error: ${error.message}`);
    }
  };

  const handleLoadedMetadata = () => {
    setVideoError(null);
  };

  return (
    <div className="video-player">
      {videoSrc ? (
        <>
          <video
            ref={videoRef}
            src={videoSrc}
            className="video-player__video"
            onTimeUpdate={handleTimeUpdate}
            onDurationChange={handleDurationChange}
            onError={handleError}
            onLoadedMetadata={handleLoadedMetadata}
            controls={false} // We'll use custom controls
          />
          
          {/* Video Mute Button - Bottom Right */}
          {onMuteToggle && (
            <button
              className="video-player__mute-button"
              onClick={onMuteToggle}
              title={isMuted ? 'Unmute Video' : 'Mute Video'}
            >
              {isMuted ? '🔇' : '🔊'}
            </button>
          )}
          
          {videoError && (
            <div className="video-player__error">
              {videoError}
            </div>
          )}
        </>
      ) : (
        <div className="video-player__placeholder">
          <div className="video-player__placeholder-content">
            <span className="video-player__placeholder-icon">🎬</span>
            <p>No video loaded</p>
            <p className="video-player__placeholder-hint">
              Add a video file to begin
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer; 