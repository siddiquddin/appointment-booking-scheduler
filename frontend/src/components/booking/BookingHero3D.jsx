import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import * as THREE from 'three';
import { useReducedMotion } from '../../hooks/useReducedMotion.js';

function ClockworkAssembly({ scrollProgressRef, isDark }) {
  const rootRef = useRef(null);
  const dialGroupRef = useRef(null);
  const outerBezelRef = useRef(null);
  const ring1Ref = useRef(null);
  const ring2Ref = useRef(null);
  const ring3Ref = useRef(null);
  const hourHandRef = useRef(null);
  const minuteHandRef = useRef(null);

  const hourMarkers = useMemo(() => {
    return Array.from({ length: 12 }).map((_, i) => {
      const angle = (i / 12) * Math.PI * 2;
      const radius = 1.48;
      return {
        key: i,
        position: [Math.sin(angle) * radius, Math.cos(angle) * radius, 0.11],
        rotation: [0, 0, -angle],
        isMajor: i % 3 === 0
      };
    });
  }, []);

  const slotNodes = useMemo(() => {
    return [
      { ring: 1, angles: [0.4, 2.2, 4.3], radius: 2.08 },
      { ring: 2, angles: [1.1, 3.5, 5.2], radius: 2.52 },
      { ring: 3, angles: [0.2, 2.8, 4.9], radius: 2.95 }
    ];
  }, []);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const p = scrollProgressRef.current || 0;
    const smoothStep = Math.min(delta * 5, 0.15);

    if (rootRef.current) {
      // Shift slightly left on deeper scroll and tilt gracefully
      const targetRotY = -0.28 + p * Math.PI * 1.15 + Math.sin(t * 0.25) * 0.06;
      const targetRotX = 0.18 + p * 0.48 + Math.cos(t * 0.2) * 0.04;
      const targetPosX = state.viewport.width > 6 ? 1.55 - p * 1.15 : 0;
      const targetPosY = 0.15 - p * 0.35;

      rootRef.current.rotation.y = THREE.MathUtils.lerp(rootRef.current.rotation.y, targetRotY, smoothStep);
      rootRef.current.rotation.x = THREE.MathUtils.lerp(rootRef.current.rotation.x, targetRotX, smoothStep);
      rootRef.current.position.x = THREE.MathUtils.lerp(rootRef.current.position.x, targetPosX, smoothStep);
      rootRef.current.position.y = THREE.MathUtils.lerp(rootRef.current.position.y, targetPosY, smoothStep);
    }

    // Separate frosted-glass layers in depth as user scrolls
    if (dialGroupRef.current) {
      dialGroupRef.current.position.z = THREE.MathUtils.lerp(dialGroupRef.current.position.z, p * 0.65, smoothStep);
    }
    if (outerBezelRef.current) {
      outerBezelRef.current.position.z = THREE.MathUtils.lerp(outerBezelRef.current.position.z, -p * 0.3, smoothStep);
    }

    // Floating translucent time-slot rings peel forward/backward in depth and spin smoothly
    if (ring1Ref.current) {
      ring1Ref.current.position.z = THREE.MathUtils.lerp(ring1Ref.current.position.z, -0.35 + p * 1.35, smoothStep);
      ring1Ref.current.rotation.z = t * 0.14 + p * 1.4;
      ring1Ref.current.rotation.x = 0.35 + p * 0.45;
    }
    if (ring2Ref.current) {
      ring2Ref.current.position.z = THREE.MathUtils.lerp(ring2Ref.current.position.z, -0.75 - p * 0.7, smoothStep);
      ring2Ref.current.rotation.z = -t * 0.1 - p * 1.8;
      ring2Ref.current.rotation.y = -0.4 + p * 0.6;
    }
    if (ring3Ref.current) {
      ring3Ref.current.position.z = THREE.MathUtils.lerp(ring3Ref.current.position.z, -1.15 + p * 0.55, smoothStep);
      ring3Ref.current.rotation.z = t * 0.08 + p * 0.9;
      ring3Ref.current.rotation.x = -0.45 + p * 0.85;
    }

    // Clockwork hands advance smoothly with time + scroll progress
    if (minuteHandRef.current) {
      minuteHandRef.current.rotation.z = -(t * 0.35 + p * Math.PI * 2);
    }
    if (hourHandRef.current) {
      hourHandRef.current.rotation.z = -(t * 0.06 + p * Math.PI * 0.5);
    }
  });

  const bezelColor = isDark ? '#e2b76f' : '#8b6f47';
  const glassColor = isDark ? '#b7d4ff' : '#cbd5e1';
  const ringSkyColor = isDark ? '#8ab4f8' : '#3b82f6';
  const nodeGlowColor = isDark ? '#f6d58e' : '#c46d4e';

  return (
    <group ref={rootRef} scale={0.95}>
      {/* Outer Calibrated Metallic Bezel */}
      <group ref={outerBezelRef}>
        <mesh>
          <torusGeometry args={[1.66, 0.045, 24, 96]} />
          <meshStandardMaterial color={bezelColor} metalness={0.85} roughness={0.22} />
        </mesh>
        <mesh position={[0, 0, -0.06]}>
          <torusGeometry args={[1.78, 0.014, 16, 96]} />
          <meshStandardMaterial color={ringSkyColor} metalness={0.5} roughness={0.35} transparent opacity={0.45} />
        </mesh>
      </group>

      {/* Frosted Glass Clock Dial & Hands */}
      <group ref={dialGroupRef}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[1.6, 1.6, 0.08, 64]} />
          <meshPhysicalMaterial
            color={glassColor}
            roughness={0.2}
            metalness={0.05}
            transmission={0.55}
            thickness={0.45}
            transparent
            opacity={0.72}
            ior={1.45}
          />
        </mesh>

        {/* 12 Hour/Slot Tick Markers */}
        {hourMarkers.map((m) => (
          <mesh key={m.key} position={m.position} rotation={m.rotation}>
            <boxGeometry args={[m.isMajor ? 0.045 : 0.022, m.isMajor ? 0.16 : 0.09, 0.03]} />
            <meshStandardMaterial color={bezelColor} metalness={0.75} roughness={0.25} />
          </mesh>
        ))}

        {/* Center Pivot Hub */}
        <mesh position={[0, 0, 0.11]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.11, 0.11, 0.08, 32]} />
          <meshStandardMaterial color={bezelColor} metalness={0.9} roughness={0.18} />
        </mesh>

        {/* Hour Hand */}
        <group ref={hourHandRef} position={[0, 0, 0.12]}>
          <mesh position={[0, 0.36, 0]}>
            <boxGeometry args={[0.055, 0.72, 0.025]} />
            <meshStandardMaterial color={bezelColor} metalness={0.88} roughness={0.2} />
          </mesh>
        </group>

        {/* Minute Hand */}
        <group ref={minuteHandRef} position={[0, 0, 0.15]}>
          <mesh position={[0, 0.56, 0]}>
            <boxGeometry args={[0.032, 1.12, 0.02]} />
            <meshStandardMaterial color="#f8fafc" metalness={0.65} roughness={0.25} />
          </mesh>
        </group>
      </group>

      {/* Orbital Ring 1 */}
      <group ref={ring1Ref}>
        <mesh>
          <torusGeometry args={[2.08, 0.024, 18, 100]} />
          <meshPhysicalMaterial color={ringSkyColor} roughness={0.18} metalness={0.25} transparent opacity={0.55} />
        </mesh>
        {slotNodes[0].angles.map((a, idx) => (
          <mesh key={idx} position={[Math.cos(a) * 2.08, Math.sin(a) * 2.08, 0]}>
            <sphereGeometry args={[0.075, 20, 20]} />
            <meshStandardMaterial color={nodeGlowColor} emissive={nodeGlowColor} emissiveIntensity={0.45} roughness={0.2} />
          </mesh>
        ))}
      </group>

      {/* Orbital Ring 2 */}
      <group ref={ring2Ref}>
        <mesh>
          <torusGeometry args={[2.52, 0.018, 16, 110]} />
          <meshPhysicalMaterial color={bezelColor} roughness={0.24} metalness={0.55} transparent opacity={0.42} />
        </mesh>
        {slotNodes[1].angles.map((a, idx) => (
          <mesh key={idx} position={[Math.cos(a) * 2.52, Math.sin(a) * 2.52, 0]}>
            <octahedronGeometry args={[0.085, 0]} />
            <meshStandardMaterial color={ringSkyColor} emissive={ringSkyColor} emissiveIntensity={0.35} roughness={0.25} />
          </mesh>
        ))}
      </group>

      {/* Orbital Ring 3 */}
      <group ref={ring3Ref}>
        <mesh>
          <torusGeometry args={[2.95, 0.014, 14, 120]} />
          <meshPhysicalMaterial color={glassColor} roughness={0.25} metalness={0.15} transparent opacity={0.3} />
        </mesh>
        {slotNodes[2].angles.map((a, idx) => (
          <mesh key={idx} position={[Math.cos(a) * 2.95, Math.sin(a) * 2.95, 0]}>
            <sphereGeometry args={[0.055, 16, 16]} />
            <meshStandardMaterial color={bezelColor} emissive={bezelColor} emissiveIntensity={0.3} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

export function BookingHero3D({ scrollProgressRef, isDark = true }) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return (
      <div className="pointer-events-none fixed inset-0 z-0 flex items-center justify-end pr-12 opacity-40" aria-hidden="true">
        <svg viewBox="0 0 320 320" className="h-80 w-80 text-amber-300/60">
          <circle cx="160" cy="160" r="130" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="160" cy="160" r="95" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="5 5" />
          <line x1="160" y1="160" x2="160" y2="75" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="160" y1="160" x2="220" y2="160" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 7.2], fov: 42 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      >
        <ambientLight intensity={isDark ? 0.55 : 0.85} />
        <directionalLight position={[5, 6, 5]} intensity={isDark ? 1.8 : 1.5} color="#fff7ed" />
        <directionalLight position={[-5, -4, 3]} intensity={0.9} color="#93c5fd" />
        <pointLight position={[2, 2, 4]} intensity={1.2} color="#e2b76f" />

        {/* Procedural offline-safe studio reflections (no remote HDR fetch) */}
        <Environment resolution={256}>
          <group rotation={[-Math.PI / 3, 0, 1]}>
            <Lightformer form="circle" intensity={3.5} position={[0, 5, -9]} scale={8} color="#fde68a" />
            <Lightformer form="ring" intensity={2} position={[-5, 2, -1]} scale={10} color="#93c5fd" />
            <Lightformer form="rect" intensity={2.2} position={[10, 1, 2]} scale={[12, 3, 1]} color="#ffffff" />
          </group>
        </Environment>

        <ClockworkAssembly scrollProgressRef={scrollProgressRef} isDark={isDark} />
      </Canvas>
    </div>
  );
}
