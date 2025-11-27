import React from 'react';

export type CameraConstraints = MediaStreamConstraints['video'];

const DEFAULT_CONSTRAINTS: CameraConstraints = {
  facingMode: 'user',
  width: { ideal: 1280 },
  height: { ideal: 720 }
};

export async function startCameraStream(
  videoRef: React.RefObject<HTMLVideoElement>,
  constraints: CameraConstraints = DEFAULT_CONSTRAINTS
): Promise<MediaStream> {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error('Camera API not supported in this browser');
  }

  if (!window.isSecureContext) {
    throw new Error('Camera access requires HTTPS or localhost');
  }

  const stream = await navigator.mediaDevices.getUserMedia({
    video: constraints,
    audio: false
  });

  const video = videoRef.current;
  if (video) {
    // Set video attributes programmatically before attaching stream
    video.muted = true;
    video.autoplay = true;
    video.playsInline = true;
    
    video.srcObject = stream;
    
    await new Promise<void>((resolve, reject) => {
      const cleanup = () => {
        video.onloadedmetadata = null;
        video.onerror = null;
      };

      video.onloadedmetadata = () => {
        video.play().then(resolve).catch(reject);
        cleanup();
      };
      video.onerror = (event) => {
        cleanup();
        reject(event);
      };

      // If video is already ready, play immediately
      if (video.readyState >= 2) {
        video.play().then(resolve).catch(reject);
        cleanup();
      }
    });
  }

  return stream;
}

export function stopMediaStream(stream: MediaStream | null) {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
  }
}

export async function captureFrameFromVideo(
  videoRef: React.RefObject<HTMLVideoElement>,
  canvasRef: React.RefObject<HTMLCanvasElement>,
  { mirror } = { mirror: false }
): Promise<string | null> {
  const video = videoRef.current;
  const canvas = canvasRef.current;

  if (!video || !canvas) return null;

  if (video.readyState < 2) {
    await new Promise<void>((resolve) => {
      video.onloadeddata = () => resolve();
      video.onloadedmetadata = () => resolve();
    });
  }

  if (video.videoWidth === 0 || video.videoHeight === 0) {
    return null;
  }

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  if (mirror) {
    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
    ctx.restore();
  } else {
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  }

  return canvas.toDataURL('image/jpeg', 0.9);
}
