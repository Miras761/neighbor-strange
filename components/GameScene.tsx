import React, { Suspense, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/cannon';
import { Sky, Stars, KeyboardControls, PointerLockControls } from '@react-three/drei';
import { Player } from './Player';
import { Level } from './Level';
import { Neighbor } from './Neighbor';
import { MultiplayerManager } from './Multiplayer';
import { useGameStore } from '../store';
import { Vector3 } from 'three';

export const GameScene = () => {
  const isPlaying = useGameStore((state) => state.isPlaying);
  const stopGame = useGameStore((state) => state.stopGame);
  
  // Shared reference for player position to avoid store updates every frame
  const playerPos = useRef(new Vector3(0,0,0));

  return (
    <KeyboardControls
      map={[
        { name: 'forward', keys: ['ArrowUp', 'w', 'W'] },
        { name: 'backward', keys: ['ArrowDown', 's', 'S'] },
        { name: 'left', keys: ['ArrowLeft', 'a', 'A'] },
        { name: 'right', keys: ['ArrowRight', 'd', 'D'] },
        { name: 'jump', keys: ['Space'] },
      ]}
    >
      <Canvas shadows camera={{ fov: 60 }}>
        <Sky sunPosition={[100, 20, 100]} turbidity={0.5} rayleigh={0.5} mieCoefficient={0.005} mieDirectionalG={0.8} />
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} castShadow intensity={1} />
        <pointLight position={[-10, 10, -10]} intensity={0.5} />

        <Suspense fallback={null}>
          <Physics gravity={[0, -9.8, 0]}>
            <Player playerPosRef={playerPos} />
            <Neighbor playerPositionRef={playerPos} />
            <MultiplayerManager playerPosRef={playerPos} />
            <Level />
          </Physics>
        </Suspense>

        {isPlaying && (
          <PointerLockControls 
            selector="#root"
            onUnlock={() => {
                // When user presses Escape, we stop the game to show menu
                stopGame();
            }} 
          />
        )}
      </Canvas>
    </KeyboardControls>
  );
};