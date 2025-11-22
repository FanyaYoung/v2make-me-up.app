import { env } from '@huggingface/transformers';

// Configure transformers.js
env.allowLocalModels = false;
env.useBrowserCache = true;

interface FaceLandmarks {
  forehead: { x: number; y: number }[];
  noseBridge: { x: number; y: number }[];
  chin: { x: number; y: number }[];
  leftCheek: { x: number; y: number }[];
  rightCheek: { x: number; y: number }[];
  jawline: { x: number; y: number }[];
}

export const detectFaceLandmarks = async (imageElement: HTMLImageElement): Promise<FaceLandmarks | null> => {
  try {
    console.log('Starting face landmark detection...');
    
    // Create canvas to process image
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');
    
    // Resize image for faster processing
    const MAX_SIZE = 512;
    let width = imageElement.naturalWidth;
    let height = imageElement.naturalHeight;
    
    if (width > height) {
      if (width > MAX_SIZE) {
        height = (height * MAX_SIZE) / width;
        width = MAX_SIZE;
      }
    } else {
      if (height > MAX_SIZE) {
        width = (width * MAX_SIZE) / height;
        height = MAX_SIZE;
      }
    }
    
    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(imageElement, 0, 0, width, height);
    
    // For now, return approximate landmark positions based on common face proportions
    // In a production app, you would use a proper face landmark detection model
    const landmarks: FaceLandmarks = {
      forehead: [
        { x: width * 0.5, y: height * 0.2 },
        { x: width * 0.4, y: height * 0.25 },
        { x: width * 0.6, y: height * 0.25 }
      ],
      noseBridge: [
        { x: width * 0.5, y: height * 0.35 },
        { x: width * 0.5, y: height * 0.45 },
        { x: width * 0.5, y: height * 0.55 }
      ],
      chin: [
        { x: width * 0.5, y: height * 0.8 },
        { x: width * 0.45, y: height * 0.75 },
        { x: width * 0.55, y: height * 0.75 }
      ],
      leftCheek: [
        { x: width * 0.3, y: height * 0.5 },
        { x: width * 0.25, y: height * 0.55 },
        { x: width * 0.3, y: height * 0.6 }
      ],
      rightCheek: [
        { x: width * 0.7, y: height * 0.5 },
        { x: width * 0.75, y: height * 0.55 },
        { x: width * 0.7, y: height * 0.6 }
      ],
      jawline: [
        { x: width * 0.35, y: height * 0.7 },
        { x: width * 0.5, y: height * 0.75 },
        { x: width * 0.65, y: height * 0.7 }
      ]
    };
    
    console.log('Face landmarks detected:', landmarks);
    return landmarks;
  } catch (error) {
    console.error('Error detecting face landmarks:', error);
    return null;
  }
};

export const applyMakeupOverlay = (
  canvas: HTMLCanvasElement,
  landmarks: FaceLandmarks,
  lightColor: string,
  darkColor: string
): void => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  
  // Apply light shade to highlight areas (forehead, nose bridge, chin)
  ctx.globalCompositeOperation = 'multiply';
  ctx.globalAlpha = 0.3;
  
  // Forehead
  const foreheadGradient = ctx.createRadialGradient(
    landmarks.forehead[0].x,
    landmarks.forehead[0].y,
    0,
    landmarks.forehead[0].x,
    landmarks.forehead[0].y,
    canvas.width * 0.15
  );
  foreheadGradient.addColorStop(0, lightColor + 'DD');
  foreheadGradient.addColorStop(1, 'transparent');
  ctx.fillStyle = foreheadGradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Nose bridge
  const noseGradient = ctx.createRadialGradient(
    landmarks.noseBridge[1].x,
    landmarks.noseBridge[1].y,
    0,
    landmarks.noseBridge[1].x,
    landmarks.noseBridge[1].y,
    canvas.width * 0.08
  );
  noseGradient.addColorStop(0, lightColor + 'DD');
  noseGradient.addColorStop(1, 'transparent');
  ctx.fillStyle = noseGradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Chin
  const chinGradient = ctx.createRadialGradient(
    landmarks.chin[0].x,
    landmarks.chin[0].y,
    0,
    landmarks.chin[0].x,
    landmarks.chin[0].y,
    canvas.width * 0.12
  );
  chinGradient.addColorStop(0, lightColor + 'DD');
  chinGradient.addColorStop(1, 'transparent');
  ctx.fillStyle = chinGradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Apply dark shade to contour areas (cheeks, jawline)
  ctx.globalAlpha = 0.25;
  
  // Left cheek
  const leftCheekGradient = ctx.createRadialGradient(
    landmarks.leftCheek[1].x,
    landmarks.leftCheek[1].y,
    0,
    landmarks.leftCheek[1].x,
    landmarks.leftCheek[1].y,
    canvas.width * 0.12
  );
  leftCheekGradient.addColorStop(0, darkColor + 'CC');
  leftCheekGradient.addColorStop(1, 'transparent');
  ctx.fillStyle = leftCheekGradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Right cheek
  const rightCheekGradient = ctx.createRadialGradient(
    landmarks.rightCheek[1].x,
    landmarks.rightCheek[1].y,
    0,
    landmarks.rightCheek[1].x,
    landmarks.rightCheek[1].y,
    canvas.width * 0.12
  );
  rightCheekGradient.addColorStop(0, darkColor + 'CC');
  rightCheekGradient.addColorStop(1, 'transparent');
  ctx.fillStyle = rightCheekGradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Jawline
  const jawlineGradient = ctx.createRadialGradient(
    landmarks.jawline[1].x,
    landmarks.jawline[1].y,
    0,
    landmarks.jawline[1].x,
    landmarks.jawline[1].y,
    canvas.width * 0.15
  );
  jawlineGradient.addColorStop(0, darkColor + 'CC');
  jawlineGradient.addColorStop(1, 'transparent');
  ctx.fillStyle = jawlineGradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Reset composite operation
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1.0;
};
