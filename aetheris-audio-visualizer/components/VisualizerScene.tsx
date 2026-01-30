
import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, PerspectiveCamera, ContactShadows } from '@react-three/drei';
import DeformingGlobe from './DeformingGlobe';

interface VisualizerSceneProps {
  analyser: AnalyserNode | null;
  isPlaying: boolean;
}

const VisualizerScene: React.FC<VisualizerSceneProps> = ({ analyser, isPlaying }) => {
  return (
    <Canvas 
      shadows 
      dpr={[1, 2]} 
      gl={{ antialias: true, alpha: true, stencil: false, depth: true }}
      camera={{ position: [0, 0, 8], fov: 30 }}
    >
      {/* High-Key Studio Background */}
      <color attach="background" args={['#f8fafc']} />
      
      {/* Bright Ambient Fill */}
      <ambientLight intensity={1.5} />
      
      {/* Cold Rim Light 1 */}
      <pointLight 
        position={[-10, 5, -5]} 
        intensity={2.5} 
        color="#00D1FF" 
        distance={30}
      />
      
      {/* Icy Fill Light */}
      <pointLight 
        position={[10, -5, 5]} 
        intensity={2} 
        color="#0070FF" 
        distance={30}
      />
      
      {/* Central Key Light */}
      <spotLight 
        position={[0, 15, 0]} 
        angle={0.4} 
        penumbra={1} 
        intensity={2} 
        color="#ffffff"
        castShadow 
      />

      <Suspense fallback={null}>
        <DeformingGlobe analyser={analyser} isPlaying={isPlaying} />
        <Environment preset="dawn" blur={1} />
      </Suspense>

      {/* Soft, low-contrast shadows for light mode */}
      <ContactShadows 
        position={[0, -3, 0]} 
        opacity={0.15} 
        scale={12} 
        blur={3} 
        far={6} 
        color="#475569"
      />

      <OrbitControls 
        enablePan={false} 
        enableZoom={false} 
        autoRotate 
        autoRotateSpeed={0.3} 
        maxPolarAngle={Math.PI / 1.6}
        minPolarAngle={Math.PI / 2.4}
      />
    </Canvas>
  );
};

export default VisualizerScene;