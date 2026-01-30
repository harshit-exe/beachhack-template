
import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import DeformingGlobe from './DeformingGlobe';

interface VisualizerSceneProps {
    analyser: AnalyserNode | null;
    isPlaying: boolean;
    isCustomerSpeaking?: boolean;
}

const VisualizerScene: React.FC<VisualizerSceneProps> = ({ analyser, isPlaying, isCustomerSpeaking }) => {
    return (
        <Canvas
            shadows
            dpr={[1, 2]}
            gl={{ antialias: true, alpha: true, stencil: false, depth: true }}
            camera={{ position: [0, 0, 8], fov: 30 }}
            className="w-full h-full"
        >
            <color attach="background" args={['#F8FAFC']} />

            <ambientLight intensity={1.5} />

            <pointLight
                position={[-10, 5, -5]}
                intensity={2.5}
                color="#00D1FF"
                distance={30}
            />

            <pointLight
                position={[10, -5, 5]}
                intensity={2}
                color="#0070FF"
                distance={30}
            />

            <spotLight
                position={[0, 15, 0]}
                angle={0.4}
                penumbra={1}
                intensity={2}
                color="#ffffff"
                castShadow
            />

            <Suspense fallback={null}>
                <group position={[0, 0, 0]}>
                    <DeformingGlobe analyser={analyser} isPlaying={isPlaying} isCustomerSpeaking={isCustomerSpeaking} />
                </group>
                <Environment preset="dawn" blur={1} />
            </Suspense>

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
