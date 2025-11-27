import { RefObject } from 'react';

/**
 * Starts the camera stream and attaches it to the video element
 */
export async function startCameraStream(
  videoRef: RefObject<HTMLVideoElement>,
  constraints?: MediaTrackConstraints
): Promise<MediaStream> {
  const defaultConstraints: MediaStreamConstraints = {
    video: constraints || {
      facingMode: 'user',
      width: { ideal: 1280 },
      height: { ideal: 720 }
    }
  };

  try {
    const stream = await navigator.mediaDevices.getUserMedia(defaultConstraints);
    
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.muted = true;
      videoRef.current.autoplay = true;
      videoRef.current.playsInline = true;
      
      await videoRef.current.play();
    }
    
    return stream;
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'NotAllowedError') {
        throw new Error('Camera permission denied. Please allow camera access in your browser settings.');
      } else if (error.name === 'NotFoundError') {
        throw new Error('No camera found on this device.');
      } else if (error.name === 'NotReadableError') {
        throw new Error('Camera is already in use by another application.');
      } else {
        throw new Error(`Camera error: ${error.message}`);
      }
    }
    throw error;
  }
}

/**
 * Stops the media stream and releases camera resources
 */
export function stopMediaStream(stream: MediaStream | null): void {
  if (stream) {
    stream.getTracks().forEach(track => {
      track.stop();
    });
  }
}

/**
 * Captures a frame from the video element and returns it as a base64 data URL
 */
export async function captureFrameFromVideo(
  videoRef: RefObject<HTMLVideoElement>,
  canvasRef: RefObject<HTMLCanvasElement>
): Promise<string | null> {
  const video = videoRef.current;
  const canvas = canvasRef.current;
  
  if (!video || !canvas) {
    throw new Error('Video or canvas element not available');
  }
  
  if (video.readyState !== video.HAVE_ENOUGH_DATA) {
    throw new Error('Video stream not ready');
  }
  
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not get canvas context');
  }
  
  // Draw the current video frame to canvas
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  
  // Convert to data URL
  return canvas.toDataURL('image/jpeg', 0.95);
}
