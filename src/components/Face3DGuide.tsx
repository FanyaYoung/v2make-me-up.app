import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Sphere } from '@react-three/drei';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Palette, Layers, Blend } from 'lucide-react';
import * as THREE from 'three';

interface Face3DGuideProps {
  primaryShade?: {
    name: string;
    color: string;
    brand: string;
  };
  contourShade?: {
    name: string;
    color: string;
    brand: string;
  };
}

// 3D Face Model Component with realistic wireframe
const FaceModel = ({ 
  primaryColor = '#F5DEB3', 
  contourColor = '#D2B48C',
  showPrimary = true,
  showContour = true,
  showBlending = false 
}: {
  primaryColor?: string;
  contourColor?: string;
  showPrimary?: boolean;
  showContour?: boolean;
  showBlending?: boolean;
}) => {
  const faceRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (faceRef.current) {
      faceRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.2;
    }
  });

  // Create wireframe face geometry
  const createFaceWireframe = () => {
    const geometry = new THREE.BufferGeometry();
    
    // Define face outline points (front view)
    const faceOutline = [
      // Forehead curve
      [-1.2, 2.0, 0], [-0.8, 2.1, 0], [-0.4, 2.15, 0], [0, 2.2, 0], [0.4, 2.15, 0], [0.8, 2.1, 0], [1.2, 2.0, 0],
      // Temple area
      [1.4, 1.5, 0], [1.5, 1.0, 0], [1.5, 0.5, 0], [1.5, 0, 0],
      // Jawline
      [1.4, -0.5, 0], [1.3, -1.0, 0], [1.1, -1.4, 0], [0.8, -1.7, 0], [0.4, -1.9, 0], [0, -2.0, 0],
      [-0.4, -1.9, 0], [-0.8, -1.7, 0], [-1.1, -1.4, 0], [-1.3, -1.0, 0], [-1.4, -0.5, 0],
      // Left temple area
      [-1.5, 0, 0], [-1.5, 0.5, 0], [-1.5, 1.0, 0], [-1.4, 1.5, 0]
    ];

    // Nose outline
    const noseOutline = [
      [0, 0.8, 0.3], [-0.15, 0.6, 0.35], [-0.2, 0.3, 0.4], [-0.15, 0, 0.35], [0, -0.2, 0.3],
      [0.15, 0, 0.35], [0.2, 0.3, 0.4], [0.15, 0.6, 0.35]
    ];

    // Eyes outline
    const leftEye = [
      [-0.6, 0.6, 0.2], [-0.4, 0.7, 0.25], [-0.2, 0.6, 0.2], [-0.4, 0.5, 0.2]
    ];
    
    const rightEye = [
      [0.6, 0.6, 0.2], [0.4, 0.7, 0.25], [0.2, 0.6, 0.2], [0.4, 0.5, 0.2]
    ];

    // Lips outline
    const lips = [
      [-0.3, -0.8, 0.15], [-0.15, -0.7, 0.2], [0, -0.75, 0.2], [0.15, -0.7, 0.2], [0.3, -0.8, 0.15],
      [0.15, -0.9, 0.18], [0, -0.95, 0.18], [-0.15, -0.9, 0.18]
    ];

    // Combine all points
    const allPoints = [
      ...faceOutline,
      ...noseOutline,
      ...leftEye,
      ...rightEye,
      ...lips
    ];

    const vertices = new Float32Array(allPoints.flat());
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));

    return geometry;
  };

  return (
    <group ref={faceRef}>
      {/* Wireframe face structure */}
      <points>
        <bufferGeometry attach="geometry" {...createFaceWireframe()} />
        <pointsMaterial attach="material" color="#666" size={0.05} />
      </points>

      {/* Face outline wireframe */}
      <mesh>
        <sphereGeometry args={[1.8, 16, 20, 0, Math.PI * 2, 0, Math.PI * 0.85]} />
        <meshBasicMaterial color="#ddd" wireframe transparent opacity={0.3} />
      </mesh>

      {/* Primary foundation areas */}
      {showPrimary && (
        <>
          {/* T-Zone - Forehead */}
          <mesh position={[0, 1.0, 0.1]}>
            <planeGeometry args={[1.5, 0.8]} />
            <meshBasicMaterial color={primaryColor} transparent opacity={0.6} side={THREE.DoubleSide} />
          </mesh>
          
          {/* T-Zone - Nose bridge */}
          <mesh position={[0, 0.2, 0.3]} rotation={[0, 0, 0]}>
            <planeGeometry args={[0.3, 0.8]} />
            <meshBasicMaterial color={primaryColor} transparent opacity={0.6} side={THREE.DoubleSide} />
          </mesh>

          {/* Center of cheeks */}
          <mesh position={[-0.7, 0.2, 0.15]} rotation={[0, 0.3, 0]}>
            <circleGeometry args={[0.4, 16]} />
            <meshBasicMaterial color={primaryColor} transparent opacity={0.6} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0.7, 0.2, 0.15]} rotation={[0, -0.3, 0]}>
            <circleGeometry args={[0.4, 16]} />
            <meshBasicMaterial color={primaryColor} transparent opacity={0.6} side={THREE.DoubleSide} />
          </mesh>

          {/* Chin */}
          <mesh position={[0, -1.2, 0.1]}>
            <circleGeometry args={[0.4, 16]} />
            <meshBasicMaterial color={primaryColor} transparent opacity={0.6} side={THREE.DoubleSide} />
          </mesh>
        </>
      )}

      {/* Contour areas */}
      {showContour && (
        <>
          {/* Temples */}
          <mesh position={[-1.1, 1.2, 0.05]} rotation={[0, 0.5, 0]}>
            <planeGeometry args={[0.6, 0.8]} />
            <meshBasicMaterial color={contourColor} transparent opacity={0.5} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[1.1, 1.2, 0.05]} rotation={[0, -0.5, 0]}>
            <planeGeometry args={[0.6, 0.8]} />
            <meshBasicMaterial color={contourColor} transparent opacity={0.5} side={THREE.DoubleSide} />
          </mesh>

          {/* Jawline */}
          <mesh position={[-1.0, -0.8, 0.05]} rotation={[0, 0.4, 0]}>
            <planeGeometry args={[0.5, 1.0]} />
            <meshBasicMaterial color={contourColor} transparent opacity={0.5} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[1.0, -0.8, 0.05]} rotation={[0, -0.4, 0]}>
            <planeGeometry args={[0.5, 1.0]} />
            <meshBasicMaterial color={contourColor} transparent opacity={0.5} side={THREE.DoubleSide} />
          </mesh>

          {/* Nose sides */}
          <mesh position={[-0.2, 0.1, 0.25]} rotation={[0, 0.8, 0]}>
            <planeGeometry args={[0.15, 0.6]} />
            <meshBasicMaterial color={contourColor} transparent opacity={0.5} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0.2, 0.1, 0.25]} rotation={[0, -0.8, 0]}>
            <planeGeometry args={[0.15, 0.6]} />
            <meshBasicMaterial color={contourColor} transparent opacity={0.5} side={THREE.DoubleSide} />
          </mesh>

          {/* Under cheekbones */}
          <mesh position={[-0.8, -0.1, 0.1]} rotation={[0, 0.3, 0]}>
            <planeGeometry args={[0.8, 0.3]} />
            <meshBasicMaterial color={contourColor} transparent opacity={0.5} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0.8, -0.1, 0.1]} rotation={[0, -0.3, 0]}>
            <planeGeometry args={[0.8, 0.3]} />
            <meshBasicMaterial color={contourColor} transparent opacity={0.5} side={THREE.DoubleSide} />
          </mesh>
        </>
      )}

      {/* Blending zones */}
      {showBlending && (
        <>
          {/* Blend areas between primary and contour */}
          <mesh position={[-0.5, 0.6, 0.12]} rotation={[0, 0.2, 0]}>
            <planeGeometry args={[0.4, 0.4]} />
            <meshBasicMaterial 
              color={new THREE.Color(primaryColor).lerp(new THREE.Color(contourColor), 0.5)} 
              transparent 
              opacity={0.4} 
              side={THREE.DoubleSide}
            />
          </mesh>
          <mesh position={[0.5, 0.6, 0.12]} rotation={[0, -0.2, 0]}>
            <planeGeometry args={[0.4, 0.4]} />
            <meshBasicMaterial 
              color={new THREE.Color(primaryColor).lerp(new THREE.Color(contourColor), 0.5)} 
              transparent 
              opacity={0.4} 
              side={THREE.DoubleSide}
            />
          </mesh>

          {/* Jawline blending */}
          <mesh position={[-0.6, -1.0, 0.08]} rotation={[0, 0.3, 0]}>
            <planeGeometry args={[0.3, 0.5]} />
            <meshBasicMaterial 
              color={new THREE.Color(primaryColor).lerp(new THREE.Color(contourColor), 0.5)} 
              transparent 
              opacity={0.4} 
              side={THREE.DoubleSide}
            />
          </mesh>
          <mesh position={[0.6, -1.0, 0.08]} rotation={[0, -0.3, 0]}>
            <planeGeometry args={[0.3, 0.5]} />
            <meshBasicMaterial 
              color={new THREE.Color(primaryColor).lerp(new THREE.Color(contourColor), 0.5)} 
              transparent 
              opacity={0.4} 
              side={THREE.DoubleSide}
            />
          </mesh>
        </>
      )}

      {/* Anatomical guidelines */}
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            array={new Float32Array([
              // Vertical center line
              0, 2.2, 0, 0, -2.0, 0,
              // Horizontal guidelines
              -1.5, 0.6, 0, 1.5, 0.6, 0,  // Eye line
              -1.5, -0.8, 0, 1.5, -0.8, 0, // Mouth line
            ])}
            count={6}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#999" opacity={0.3} transparent />
      </lineSegments>

      {/* Labels with better positioning */}
      {showPrimary && (
        <Text
          position={[0, 2.8, 0]}
          fontSize={0.25}
          color="#333"
          anchorX="center"
          anchorY="middle"
          font="/fonts/Inter-Bold.woff"
        >
          Foundation Application Areas
        </Text>
      )}

      {showContour && (
        <Text
          position={[0, -2.8, 0]}
          fontSize={0.25}
          color="#333"
          anchorX="center"
          anchorY="middle"
          font="/fonts/Inter-Bold.woff"
        >
          Contour & Sculpting Areas
        </Text>
      )}
    </group>
  );
};

const Face3DGuide: React.FC<Face3DGuideProps> = ({ primaryShade, contourShade }) => {
  const [activeView, setActiveView] = useState<'primary' | 'contour' | 'blending'>('primary');

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">3D Application Guide</h3>
          <p className="text-sm text-muted-foreground">
            Interactive guide showing where and how to apply your foundation shades
          </p>
        </div>

        {/* Shade Information */}
        {(primaryShade || contourShade) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {primaryShade && (
              <div className="flex items-center gap-3 p-3 bg-accent/20 rounded-lg">
                <div 
                  className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                  style={{ backgroundColor: primaryShade.color }}
                />
                <div>
                  <p className="font-medium text-sm">{primaryShade.brand}</p>
                  <p className="text-xs text-muted-foreground">{primaryShade.name}</p>
                </div>
                <Badge variant="secondary">Primary</Badge>
              </div>
            )}
            
            {contourShade && (
              <div className="flex items-center gap-3 p-3 bg-accent/20 rounded-lg">
                <div 
                  className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                  style={{ backgroundColor: contourShade.color }}
                />
                <div>
                  <p className="font-medium text-sm">{contourShade.brand}</p>
                  <p className="text-xs text-muted-foreground">{contourShade.name}</p>
                </div>
                <Badge variant="outline">Contour</Badge>
              </div>
            )}
          </div>
        )}

        {/* 3D Visualization */}
        <div className="h-96 border rounded-lg overflow-hidden bg-gradient-to-b from-background to-accent/10">
          <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
            <ambientLight intensity={0.6} />
            <directionalLight position={[10, 10, 5]} intensity={1} />
            <pointLight position={[-10, -10, -5]} intensity={0.5} />
            
            <FaceModel
              primaryColor={primaryShade?.color || '#F5DEB3'}
              contourColor={contourShade?.color || '#D2B48C'}
              showPrimary={activeView === 'primary' || activeView === 'blending'}
              showContour={activeView === 'contour' || activeView === 'blending'}
              showBlending={activeView === 'blending'}
            />
            
            <OrbitControls 
              enableZoom={true}
              enablePan={false}
              minDistance={5}
              maxDistance={12}
            />
          </Canvas>
        </div>

        {/* View Controls */}
        <Tabs value={activeView} onValueChange={(value) => setActiveView(value as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="primary" className="flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Primary
            </TabsTrigger>
            <TabsTrigger value="contour" className="flex items-center gap-2">
              <Layers className="w-4 h-4" />
              Contour
            </TabsTrigger>
            <TabsTrigger value="blending" className="flex items-center gap-2">
              <Blend className="w-4 h-4" />
              Blending
            </TabsTrigger>
          </TabsList>

          <TabsContent value="primary" className="space-y-3">
            <h4 className="font-medium">Primary Foundation Application</h4>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>Apply your primary foundation to the highlighted areas:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Center of forehead</li>
                <li>Bridge of nose</li>
                <li>Center of cheeks</li>
                <li>Center of chin</li>
              </ul>
              <p className="text-xs bg-accent/20 p-2 rounded">
                💡 Use dotting motions, then blend outward for even coverage
              </p>
            </div>
          </TabsContent>

          <TabsContent value="contour" className="space-y-3">
            <h4 className="font-medium">Contour Application</h4>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>Apply your contour shade to create depth:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Temples and hairline</li>
                <li>Sides of nose</li>
                <li>Jawline and under chin</li>
                <li>Hollow of cheeks</li>
              </ul>
              <p className="text-xs bg-accent/20 p-2 rounded">
                💡 Use a smaller brush and build color gradually
              </p>
            </div>
          </TabsContent>

          <TabsContent value="blending" className="space-y-3">
            <h4 className="font-medium">Blending Technique</h4>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>Seamlessly blend the two shades:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Use circular motions where colors meet</li>
                <li>Work in thin layers for natural gradation</li>
                <li>Pay special attention to the transition zones</li>
                <li>Set with powder for lasting wear</li>
              </ul>
              <p className="text-xs bg-accent/20 p-2 rounded">
                💡 Different brands may have varying blend times - work quickly but patiently
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Card>
  );
};

export default Face3DGuide;