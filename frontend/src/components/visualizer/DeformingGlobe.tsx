'use client';

import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

const vertexShader = `
  varying vec2 vUv;
  varying float vDisplacement;
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying float vNoise;
  
  uniform float uTime;
  uniform float uBass;
  uniform float uMid;
  uniform float uHigh;

  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
    const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy) );
    vec3 x0 =   v - i + dot(i, C.xxx) ;
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min( g.xyz, l.zxy );
    vec3 i2 = max( g.xyz, l.zxy );
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute( permute( permute(
               i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
             + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
             + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
    float n_ = 0.142857142857;
    vec3  ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_ );
    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4( x.xy, y.xy );
    vec4 b1 = vec4( x.zw, y.zw );
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
    vec3 p0 = vec3(a0.xy,h.x);
    vec3 p1 = vec3(a0.zw,h.y);
    vec3 p2 = vec3(a1.xy,h.z);
    vec3 p3 = vec3(a1.zw,h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) ) ;
  }

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    
    // More aggressive audio response
    float bassNoise = snoise(normal * 0.6 + uTime * 0.2) * (0.08 + uBass * 0.5);
    float midNoise = snoise(normal * 2.0 + uTime * 0.6) * (0.04 + uMid * 0.25);
    float highNoise = snoise(normal * 6.0 + uTime * 2.0) * (uHigh * 0.1);
    float noise = bassNoise + midNoise + highNoise;
    
    vNoise = noise;
    vDisplacement = noise;
    vec3 newPosition = position + normal * noise;
    vec4 mvPosition = modelViewMatrix * vec4(newPosition, 1.0);
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = `
  varying vec2 vUv;
  varying float vDisplacement;
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying float vNoise;
  
  uniform float uTime;
  uniform float uActivity;
  uniform vec3 uColorA; 
  uniform vec3 uColorB; 
  uniform vec3 uColorC; 
  uniform vec3 uColorD; 

  void main() {
    vec3 viewDir = normalize(vViewPosition);
    float fresnel = pow(1.0 - max(dot(vNormal, viewDir), 0.0), 2.5);
    
    float mixer1 = smoothstep(-0.5, 0.5, vNoise);
    float mixer2 = sin(vUv.x * 5.0 + uTime * 0.4) * 0.5 + 0.5;
    
    vec3 grad1 = mix(uColorA, uColorB, mixer1);
    vec3 grad2 = mix(uColorD, uColorC, mixer2);
    vec3 baseColor = mix(grad1, grad2, sin(uTime * 0.08) * 0.5 + 0.5);
    
    // Add glow based on activity
    vec3 glowColor = mix(uColorA, uColorB, uActivity);
    
    vec3 finalColor = mix(baseColor, glowColor, fresnel * (0.5 + uActivity * 0.5));
    finalColor += uColorA * max(0.0, vDisplacement) * 0.6;
    finalColor += uColorC * fresnel * 0.3;
    
    // Brighter core
    finalColor += vec3(0.1, 0.1, 0.15) * (1.0 - fresnel);

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

interface DeformingGlobeProps {
  audioLevel?: number;
  isActive?: boolean;
}

const DeformingGlobe: React.FC<DeformingGlobeProps> = ({ audioLevel = 0, isActive = false }) => {
  const meshRef = useRef<THREE.Mesh>(null!);
  const materialRef = useRef<THREE.ShaderMaterial>(null!);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uBass: { value: 0 },
    uMid: { value: 0 },
    uHigh: { value: 0 },
    uActivity: { value: 0 },
    uColorA: { value: new THREE.Color('#81d8d0') }, // Teal
    uColorB: { value: new THREE.Color('#22d3ee') }, // Cyan
    uColorC: { value: new THREE.Color('#a78bfa') }, // Purple
    uColorD: { value: new THREE.Color('#1e293b') }  // Dark slate
  }), []);

  useFrame((state) => {
    const { clock } = state;
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = clock.getElapsedTime();
      
      // More reactive audio levels
      const baseActivity = isActive ? 0.4 : 0.15;
      const audioEffect = audioLevel * 1.2;
      
      const targetBass = baseActivity + audioEffect;
      const targetMid = baseActivity + audioEffect * 0.9;
      const targetHigh = audioEffect * 0.6;
      const targetActivity = audioLevel;
      
      // Faster response
      materialRef.current.uniforms.uBass.value += (targetBass - materialRef.current.uniforms.uBass.value) * 0.15;
      materialRef.current.uniforms.uMid.value += (targetMid - materialRef.current.uniforms.uMid.value) * 0.15;
      materialRef.current.uniforms.uHigh.value += (targetHigh - materialRef.current.uniforms.uHigh.value) * 0.12;
      materialRef.current.uniforms.uActivity.value += (targetActivity - materialRef.current.uniforms.uActivity.value) * 0.1;
    }
  });

  return (
    <mesh ref={meshRef} scale={1.3}>
      <icosahedronGeometry args={[1, 80]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
      />
    </mesh>
  );
};

export default DeformingGlobe;
