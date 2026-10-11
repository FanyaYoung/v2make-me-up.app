export interface SkinRegion { x: number; y: number; width: number; height: number }
interface Point { x: number; y: number }
interface DetectedFace {
  boundingBox: SkinRegion;
  landmarks?: Array<{ type: string; locations: Point[] }>;
}
interface NativeFaceDetector {
  detect(source: HTMLCanvasElement): Promise<DetectedFace[]>;
}

// Require detection and eye landmarks rather than guessing from image dimensions.
export function skinRegionsForFaces(faces: DetectedFace[], width: number, height: number): SkinRegion[] {
  if (faces.length !== 1) throw new Error('Use a photo with exactly one clearly visible face.');
  const face = faces[0];
  const box = face.boundingBox;
  const eyes = (face.landmarks || []).filter(item => item.type === 'eye')
    .flatMap(item => item.locations);
  if (eyes.length < 2 || box.width < 60 || box.height < 60) {
    throw new Error('Try a clearer, front-facing photo with both eyes visible.');
  }
  const eyeY = eyes.reduce((sum, eye) => sum + eye.y, 0) / eyes.length;
  const regions = [
    { x: box.x + box.width * 0.35, y: eyeY - box.height * 0.22, width: box.width * 0.3, height: box.height * 0.1 },
    { x: box.x + box.width * 0.18, y: eyeY + box.height * 0.14, width: box.width * 0.16, height: box.height * 0.12 },
    { x: box.x + box.width * 0.66, y: eyeY + box.height * 0.14, width: box.width * 0.16, height: box.height * 0.12 },
  ];
  if (regions.some(region => !Object.values(region).every(Number.isFinite) || region.x < 0 || region.y < 0 ||
      region.x + region.width > width || region.y + region.height > height)) {
    throw new Error('Keep your whole face inside the photo and try again.');
  }
  return regions;
}

export async function detectSkinRegions(canvas: HTMLCanvasElement): Promise<SkinRegion[]> {
  const Detector = (globalThis as unknown as {
    FaceDetector?: new (options: { maxDetectedFaces: number; fastMode: boolean }) => NativeFaceDetector;
  }).FaceDetector;
  if (!Detector) throw new Error('Local face analysis is unavailable in this browser. Please retry cloud analysis.');
  const faces = await new Detector({ maxDetectedFaces: 2, fastMode: false }).detect(canvas);
  return skinRegionsForFaces(faces, canvas.width, canvas.height);
}
