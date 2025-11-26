import React, { useRef, useState, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useSphere } from '@react-three/cannon';
import { Vector3 } from 'three';
import { Text, Html } from '@react-three/drei';
import { useGameStore } from '../store';

const PATROL_POINTS = [
  new Vector3(0, 1, 0),
  new Vector3(5, 1, -5),
  new Vector3(-5, 1, -5),
  new Vector3(8, 1, 8),
  new Vector3(-8, 1, 8),
  new Vector3(4, 1, 4),
];

export const Neighbor = ({ playerPositionRef }: { playerPositionRef: React.MutableRefObject<Vector3> }) => {
  const catchPlayer = useGameStore((state) => state.catchPlayer);
  const isPlaying = useGameStore((state) => state.isPlaying);
  
  const [ref, api] = useSphere(() => ({
    mass: 1,
    type: 'Dynamic',
    position: [0, 3, 0], // Spawning higher to drop in safely
    fixedRotation: true,
    args: [0.6],
  }));

  const [state, setState] = useState<'IDLE' | 'PATROL' | 'CHASE'>('PATROL');
  const [targetIndex, setTargetIndex] = useState(0);
  const [shout, setShout] = useState("");
  
  const pos = useRef([0, 0, 0]);
  useEffect(() => api.position.subscribe((p) => (pos.current = p)), [api.position]);

  const thoughts = useMemo(() => [
      "I hear footsteps...", 
      "Where is my spatula?", 
      "These kids and their parkour...", 
      "Did I lock the fridge?", 
      "Hmm..."
  ], []);

  useFrame((sceneState, delta) => {
    if (!isPlaying) return;

    const currentPos = new Vector3(pos.current[0], pos.current[1], pos.current[2]);
    const actualPlayerPos = sceneState.camera.position.clone();
    
    const distToPlayer = currentPos.distanceTo(actualPlayerPos);
    
    // Line of sight check
    const detectionRange = 9;
    const catchRange = 1.3;

    if (distToPlayer < catchRange) {
        catchPlayer();
    }

    if (distToPlayer < detectionRange) {
        if (state !== 'CHASE') {
            setState('CHASE');
            setShout("I SEE YOU!");
        }
    } else if (state === 'CHASE' && distToPlayer > detectionRange * 1.5) {
        setState('PATROL');
        setShout("Lost him...");
    }

    let moveDir = new Vector3();

    if (state === 'CHASE') {
        moveDir.subVectors(actualPlayerPos, currentPos).normalize().multiplyScalar(5.2); 
    } else {
        const target = PATROL_POINTS[targetIndex];
        const distToTarget = currentPos.distanceTo(target);
        
        if (distToTarget < 1.5) {
             setTargetIndex((prev) => (prev + 1) % PATROL_POINTS.length);
             if (Math.random() > 0.6) setShout(thoughts[Math.floor(Math.random() * thoughts.length)]);
        }
        
        moveDir.subVectors(target, currentPos).normalize().multiplyScalar(2.5);
    }

    api.velocity.set(moveDir.x, -5, moveDir.z);

    if (ref.current) {
        ref.current.lookAt(actualPlayerPos.x, currentPos.y, actualPlayerPos.z);
    }
  });

  return (
    <group ref={ref as any}>
      {/* Body */}
      <mesh castShadow position={[0, 0, 0]}>
        <capsuleGeometry args={[0.5, 1.2, 4, 8]} />
        <meshStandardMaterial color="#b91c1c" />
      </mesh>
      {/* Head */}
      <mesh position={[0, 0.8, 0]}>
        <boxGeometry args={[0.45, 0.45, 0.45]} />
        <meshStandardMaterial color="#fca5a5" />
      </mesh>
      {/* Moustache */}
      <mesh position={[0, 0.7, 0.25]}>
        <boxGeometry args={[0.35, 0.08, 0.05]} />
        <meshStandardMaterial color="#1f2937" />
      </mesh>
      {/* Arms */}
      <mesh position={[0.4, 0.2, 0]}>
        <boxGeometry args={[0.2, 0.8, 0.2]} />
        <meshStandardMaterial color="#ef4444" />
      </mesh>
      <mesh position={[-0.4, 0.2, 0]}>
        <boxGeometry args={[0.2, 0.8, 0.2]} />
        <meshStandardMaterial color="#ef4444" />
      </mesh>

      {/* Speech Bubble */}
      {shout && (
          <Html position={[0, 2.2, 0]} center>
              <div className="bg-white border-2 border-black px-2 py-1 rounded-lg whitespace-nowrap text-sm font-bold animate-bounce shadow-xl">
                  {shout}
              </div>
          </Html>
      )}
    </group>
  );
};