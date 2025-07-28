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

// 3D Face Model Component
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
      faceRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
  });

  return (
    <group ref={faceRef}>
      {/* Base face shape */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[2, 32, 32]} />
        <meshPhongMaterial color="#F5DEB3" />
      </mesh>

      {/* Primary foundation areas */}
      {showPrimary && (
        <>
          {/* Forehead */}
          <mesh position={[0, 1.2, 1.8]}>
            <sphereGeometry args={[0.8, 16, 16]} />
            <meshPhongMaterial color={primaryColor} transparent opacity={0.7} />
          </mesh>
          
          {/* Cheeks */}
          <mesh position={[-1, 0.2, 1.6]}>
            <sphereGeometry args={[0.6, 16, 16]} />
            <meshPhongMaterial color={primaryColor} transparent opacity={0.7} />
          </mesh>
          <mesh position={[1, 0.2, 1.6]}>
            <sphereGeometry args={[0.6, 16, 16]} />
            <meshPhongMaterial color={primaryColor} transparent opacity={0.7} />
          </mesh>

          {/* Nose */}
          <mesh position={[0, 0.2, 1.9]}>
            <sphereGeometry args={[0.3, 16, 16]} />
            <meshPhongMaterial color={primaryColor} transparent opacity={0.7} />
          </mesh>

          {/* Chin */}
          <mesh position={[0, -1, 1.6]}>
            <sphereGeometry args={[0.5, 16, 16]} />
            <meshPhongMaterial color={primaryColor} transparent opacity={0.7} />
          </mesh>
        </>
      )}

      {/* Contour areas */}
      {showContour && (
        <>
          {/* Temples */}
          <mesh position={[-1.5, 0.8, 1.2]}>
            <sphereGeometry args={[0.4, 16, 16]} />
            <meshPhongMaterial color={contourColor} transparent opacity={0.6} />
          </mesh>
          <mesh position={[1.5, 0.8, 1.2]}>
            <sphereGeometry args={[0.4, 16, 16]} />
            <meshPhongMaterial color={contourColor} transparent opacity={0.6} />
          </mesh>

          {/* Jawline */}
          <mesh position={[-1.2, -0.8, 1.2]}>
            <sphereGeometry args={[0.5, 16, 16]} />
            <meshPhongMaterial color={contourColor} transparent opacity={0.6} />
          </mesh>
          <mesh position={[1.2, -0.8, 1.2]}>
            <sphereGeometry args={[0.5, 16, 16]} />
            <meshPhongMaterial color={contourColor} transparent opacity={0.6} />
          </mesh>

          {/* Nose sides */}
          <mesh position={[-0.3, 0.1, 1.8]}>
            <sphereGeometry args={[0.2, 16, 16]} />
            <meshPhongMaterial color={contourColor} transparent opacity={0.6} />
          </mesh>
          <mesh position={[0.3, 0.1, 1.8]}>
            <sphereGeometry args={[0.2, 16, 16]} />
            <meshPhongMaterial color={contourColor} transparent opacity={0.6} />
          </mesh>
        </>
      )}

      {/* Blending zones */}
      {showBlending && (
        <>
          {/* Blend zones between primary and contour */}
          <mesh position={[-0.8, 0.5, 1.7]}>
            <sphereGeometry args={[0.3, 16, 16]} />
            <meshPhongMaterial 
              color={new THREE.Color(primaryColor).lerp(new THREE.Color(contourColor), 0.5)} 
              transparent 
              opacity={0.5} 
            />
          </mesh>
          <mesh position={[0.8, 0.5, 1.7]}>
            <sphereGeometry args={[0.3, 16, 16]} />
            <meshPhongMaterial 
              color={new THREE.Color(primaryColor).lerp(new THREE.Color(contourColor), 0.5)} 
              transparent 
              opacity={0.5} 
            />
          </mesh>
        </>
      )}

      {/* Labels */}
      {showPrimary && (
        <Text
          position={[0, 2.8, 0]}
          fontSize={0.3}
          color="#333"
          anchorX="center"
          anchorY="middle"
        >
          Primary Foundation Areas
        </Text>
      )}

      {showContour && (
        <Text
          position={[0, -2.8, 0]}
          fontSize={0.3}
          color="#333"
          anchorX="center"
          anchorY="middle"
        >
          Contour Areas
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