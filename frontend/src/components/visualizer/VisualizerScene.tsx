'use client';

import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import DeformingGlobe from './DeformingGlobe';

interface VisualizerSceneProps {
  audioLevel?: number;
  isActive?: boolean;
}

const VisualizerScene: React.FC<VisualizerSceneProps> = ({ audioLevel = 0, isActive = false }) => {
  return (
    <Canvas 
      shadows 
      dpr={[1, 2]} 
      gl={{ antialias: true, alpha: true, stencil: false, depth: true }}
      camera={{ position: [0, 0, 4.5], fov: 40 }}
      style={{ background: 'transparent' }}
    >
      {/* Light gradient background for white theme */}
      <color attach="background" args={['#f8fafc']} />
      
      {/* Soft ambient fill */}
      <ambientLight intensity={1.2} />
      
      {/* Teal accent light - primary brand color */}
      <pointLight 
        position={[-6, 4, -3]} 
        intensity={2.5} 
        color="#81d8d0" 
        distance={20}
      />
      
      {/* Purple accent for depth */}
      <pointLight 
        position={[6, -2, 4]} 
        intensity={2} 
        color="#a78bfa" 
        distance={20}
      />
      
      {/* Warm fill light from front */}
      <pointLight 
        position={[0, 3, 8]} 
        intensity={1.5} 
        color="#fef3c7" 
        distance={15}
      />

      <Suspense fallback={null}>
        <DeformingGlobe audioLevel={audioLevel} isActive={isActive} />
        <Environment preset="city" blur={0.6} />
      </Suspense>

      {/* Subtle shadow */}
      <ContactShadows 
        position={[0, -1.8, 0]} 
        opacity={0.2} 
        scale={5} 
        blur={2} 
        far={3} 
        color="#64748b"
      />

      <OrbitControls 
        enablePan={false} 
        enableZoom={false} 
        autoRotate 
        autoRotateSpeed={0.6} 
        maxPolarAngle={Math.PI / 1.6}
        minPolarAngle={Math.PI / 2.4}
      />
    </Canvas>
  );
};

export default VisualizerScene;
