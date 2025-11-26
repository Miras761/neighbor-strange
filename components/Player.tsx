import React, { useRef, useEffect, useState } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { useSphere } from '@react-three/cannon';
import { Vector3 } from 'three';
import { useKeyboardControls } from '@react-three/drei';
import { useGameStore } from '../store';

const WALK_SPEED = 5;
const RUN_SPEED = 9;
const JUMP_FORCE = 5;

export const Player = ({ playerPosRef }: { playerPosRef: React.MutableRefObject<Vector3> }) => {
  const { camera } = useThree();
  const isChatting = useGameStore((state) => state.isChatting);
  
  const [ref, api] = useSphere(() => ({ 
    mass: 1, 
    type: 'Dynamic', 
    position: [0, 2, 10], 
    fixedRotation: true,
    args: [0.5]
  }));

  const velocity = useRef([0, 0, 0]);
  useEffect(() => api.velocity.subscribe((v) => (velocity.current = v)), [api.velocity]);

  const pos = useRef([0, 0, 0]);
  useEffect(() => api.position.subscribe((p) => {
      pos.current = p;
      // Sync to shared ref for multiplayer
      if (playerPosRef) {
          playerPosRef.current.set(p[0], p[1], p[2]);
      }
  }), [api.position, playerPosRef]);

  const [sub, get] = useKeyboardControls();
  const [isSprinting, setIsSprinting] = useState(false);

  useEffect(() => {
      const handleKeyDown = (e: any) => { if(e.key === 'Shift') setIsSprinting(true); };
      const handleKeyUp = (e: any) => { if(e.key === 'Shift') setIsSprinting(false); };
      (window as any).addEventListener('keydown', handleKeyDown);
      (window as any).addEventListener('keyup', handleKeyUp);
      return () => {
          (window as any).removeEventListener('keydown', handleKeyDown);
          (window as any).removeEventListener('keyup', handleKeyUp);
      }
  }, []);
  
  useFrame(() => {
    // Disable movement controls if chatting
    if (isChatting) {
        api.velocity.set(0, velocity.current[1], 0);
        return;
    }

    const { forward, backward, left, right, jump } = get();
    
    // Sync camera to physics body
    camera.position.copy(new Vector3(pos.current[0], pos.current[1] + 0.7, pos.current[2]));

    const direction = new Vector3();
    const frontVector = new Vector3(0, 0, Number(backward) - Number(forward));
    const sideVector = new Vector3(Number(left) - Number(right), 0, 0);

    const speed = isSprinting ? RUN_SPEED : WALK_SPEED;

    direction
      .subVectors(frontVector, sideVector)
      .normalize()
      .multiplyScalar(speed)
      .applyEuler(camera.rotation);

    api.velocity.set(direction.x, velocity.current[1], direction.z);

    if (jump && Math.abs(velocity.current[1]) < 0.05) {
      api.velocity.set(velocity.current[0], JUMP_FORCE, velocity.current[2]);
    }
  });

  return (
    <mesh ref={ref as any} />
  );
};