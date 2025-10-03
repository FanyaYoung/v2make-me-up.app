import React, { useRef, useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';

interface FaceColorResult {
  lightest: { r: number; g: number; b: number; hex: string };
  darkest: { r: number; g: number; b: number; hex: string };
}

interface FaceColorPickerProps {
  imageUrl: string;
  onColorsPicked?: (result: FaceColorResult) => void;
  showControls?: boolean;
}

export const FaceColorPicker: React.FC<FaceColorPickerProps> = ({
  imageUrl,
  onColorsPicked,
  showControls = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<SVGSVGElement>(null);
  const [result, setResult] = useState<FaceColorResult | null>(null);
  const [ellipse, setEllipse] = useState({ cx: 0, cy: 0, rx: 100, ry: 130 });
  const [percentile, setPercentile] = useState(1);
  const [step, setStep] = useState(2);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Load image and center ellipse
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      // Center ellipse on face area (upper-middle portion)
      setEllipse({
        cx: img.width / 2,
        cy: img.height * 0.4,
        rx: Math.min(img.width, img.height) * 0.25,
        ry: Math.min(img.width, img.height) * 0.32,
      });
    };
    img.src = imageUrl;
  }, [imageUrl]);

  const srgbToLinear = (c: number) => {
    c /= 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };

  const relativeLuminance = (r: number, g: number, b: number) => {
    const R = srgbToLinear(r);
    const G = srgbToLinear(g);
    const B = srgbToLinear(b);
    return 0.2126 * R + 0.7152 * G + 0.0722 * B;
  };

  const toHex = (r: number, g: number, b: number) => {
    const h = (n: number) => n.toString(16).padStart(2, '0').toUpperCase();
    return `#${h(r)}${h(g)}${h(b)}`;
  };

  const pointInEllipse = (x: number, y: number, e: typeof ellipse) => {
    const dx = x - e.cx;
    const dy = y - e.cy;
    return (dx * dx) / (e.rx * e.rx) + (dy * dy) / (e.ry * e.ry) <= 1.0;
  };

  const analyzeColors = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const samples: Array<{ Y: number; r: number; g: number; b: number }> = [];

    const minX = Math.max(0, Math.floor(ellipse.cx - ellipse.rx));
    const maxX = Math.min(canvas.width - 1, Math.ceil(ellipse.cx + ellipse.rx));
    const minY = Math.max(0, Math.floor(ellipse.cy - ellipse.ry));
    const maxY = Math.min(canvas.height - 1, Math.ceil(ellipse.cy + ellipse.ry));

    const imageData = ctx.getImageData(minX, minY, maxX - minX + 1, maxY - minY + 1);
    const data = imageData.data;
    const width = imageData.width;

    for (let y = minY; y <= maxY; y += step) {
      for (let x = minX; x <= maxX; x += step) {
        if (pointInEllipse(x, y, ellipse)) {
          const localX = x - minX;
          const localY = y - minY;
          const idx = (localY * width + localX) * 4;

          if (data[idx + 3] >= 1) {
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            const Y = relativeLuminance(r, g, b);
            samples.push({ Y, r, g, b });
          }
        }
      }
    }

    if (samples.length < 20) {
      console.warn('Not enough pixels sampled');
      return;
    }

    samples.sort((a, b) => a.Y - b.Y);
    const k = Math.max(1, Math.floor(samples.length * (percentile / 100)));

    const darkest = samples.slice(0, k);
    const lightest = samples.slice(-k);

    const avg = (arr: typeof samples) => {
      let R = 0, G = 0, B = 0;
      arr.forEach(p => { R += p.r; G += p.g; B += p.b; });
      const n = arr.length;
      return { r: Math.round(R / n), g: Math.round(G / n), b: Math.round(B / n) };
    };

    const dark = avg(darkest);
    const light = avg(lightest);

    const colors = {
      darkest: { ...dark, hex: toHex(dark.r, dark.g, dark.b) },
      lightest: { ...light, hex: toHex(light.r, light.g, light.b) },
    };

    setResult(colors);
    onColorsPicked?.(colors);
  };

  const handleEllipseDrag = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!isDragging) return;

    const svg = overlayRef.current;
    if (!svg) return;

    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setEllipse(prev => ({
      ...prev,
      cx: x - dragOffset.x,
      cy: y - dragOffset.y,
    }));
  };

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    const svg = overlayRef.current;
    if (!svg) return;

    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDragging(true);
    setDragOffset({ x: x - ellipse.cx, y: y - ellipse.cy });
    svg.setPointerCapture(e.pointerId);
  };

  const handlePointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    setIsDragging(false);
    overlayRef.current?.releasePointerCapture(e.pointerId);
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="relative inline-block">
          <canvas ref={canvasRef} className="max-w-full rounded-lg" />
          <svg
            ref={overlayRef}
            className="absolute inset-0 w-full h-full cursor-move"
            onPointerDown={handlePointerDown}
            onPointerMove={handleEllipseDrag}
            onPointerUp={handlePointerUp}
          >
            <ellipse
              cx={ellipse.cx}
              cy={ellipse.cy}
              rx={ellipse.rx}
              ry={ellipse.ry}
              fill="rgba(64, 148, 255, 0.1)"
              stroke="rgba(64, 148, 255, 0.9)"
              strokeWidth="2"
            />
          </svg>
        </div>

        {showControls && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Sample Percentile: {percentile}%</Label>
              <Slider
                value={[percentile]}
                onValueChange={([v]) => setPercentile(v)}
                min={0.1}
                max={10}
                step={0.1}
              />
            </div>

            <div className="space-y-2">
              <Label>Downsample Step: {step}px</Label>
              <Slider
                value={[step]}
                onValueChange={([v]) => setStep(v)}
                min={1}
                max={8}
                step={1}
              />
            </div>

            <Button onClick={analyzeColors} className="w-full">
              Analyze Face Colors
            </Button>
          </div>
        )}

        {result && (
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="space-y-2">
              <Label>Lightest (Highlight)</Label>
              <div
                className="h-16 rounded-lg border"
                style={{ backgroundColor: result.lightest.hex }}
              />
              <p className="text-sm text-muted-foreground">{result.lightest.hex}</p>
            </div>
            <div className="space-y-2">
              <Label>Darkest (Contour)</Label>
              <div
                className="h-16 rounded-lg border"
                style={{ backgroundColor: result.darkest.hex }}
              />
              <p className="text-sm text-muted-foreground">{result.darkest.hex}</p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
