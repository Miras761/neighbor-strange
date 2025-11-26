import React, { useState } from 'react';
import { useBox, usePlane } from '@react-three/cannon';
import { useGameStore } from '../store';
import { Text, Float } from '@react-three/drei';

const Wall = (props: any) => {
  const [ref] = useBox(() => ({ type: 'Static', ...props }));
  return (
    <mesh ref={ref as any} receiveShadow castShadow>
      <boxGeometry args={props.args} />
      <meshStandardMaterial color={props.color || "#e5e7eb"} />
    </mesh>
  );
};

const Floor = (props: any) => {
  const [ref] = usePlane(() => ({ rotation: [-Math.PI / 2, 0, 0], ...props }));
  return (
    <mesh ref={ref as any} receiveShadow>
      <planeGeometry args={[100, 100]} />
      <meshStandardMaterial color="#4ade80" />
    </mesh>
  );
};

const Furniture = ({ position, size, color }: any) => {
    const [ref] = useBox(() => ({ type: 'Static', position, args: size }));
    return (
        <mesh ref={ref as any} receiveShadow castShadow>
            <boxGeometry args={size} />
            <meshStandardMaterial color={color} />
        </mesh>
    );
}

const InteractableKey = () => {
  const pickUpKey = useGameStore((state) => state.pickUpKey);
  const hasKey = useGameStore((state) => state.hasKey);
  const [hovered, setHover] = useState(false);

  if (hasKey) return null;

  return (
    <group position={[-6, 1, 6]}>
        <Float speed={2} rotationIntensity={1} floatIntensity={1}>
            <mesh 
                onClick={(e) => {
                    e.stopPropagation();
                    if (e.distance < 4) pickUpKey();
                }}
                onPointerOver={() => setHover(true)}
                onPointerOut={() => setHover(false)}
            >
                <boxGeometry args={[0.5, 0.1, 0.8]} />
                <meshStandardMaterial color="gold" emissive="yellow" emissiveIntensity={hovered ? 1 : 0.2} />
            </mesh>
        </Float>
        <Text position={[0, 1, 0]} fontSize={0.5} color="black">
            Golden Spatula
        </Text>
    </group>
  );
};

const Fridge = () => {
    const hasKey = useGameStore((state) => state.hasKey);
    const winGame = useGameStore((state) => state.winGame);
    // Fridge logic
    const [hovered, setHover] = useState(false);
    // Fridge Box Physics - positioned visibly inside
    const [ref] = useBox(() => ({ type: 'Static', args:[1.5, 3, 1.5], position: [0, 1.5, -3.5] }));
    
    return (
        <group>
            <mesh 
                ref={ref as any} 
                onClick={(e) => {
                    e.stopPropagation();
                    if (e.distance < 4) {
                        if (hasKey) winGame();
                    }
                }}
                onPointerOver={() => setHover(true)}
                onPointerOut={() => setHover(false)}
            >
                <boxGeometry args={[1.5, 3, 1.5]} />
                <meshStandardMaterial color={hasKey ? "#60a5fa" : "#94a3b8"} />
            </mesh>
            {/* Fridge Handles */}
            <mesh position={[0.4, 2, -2.7]}>
                <boxGeometry args={[0.1, 0.5, 0.1]} />
                <meshStandardMaterial color="silver" />
            </mesh>
            <Text position={[0, 3.5, -3.5]} fontSize={0.4} color="white" anchorX="center" anchorY="middle" outlineWidth={0.02} outlineColor="black">
                {hasKey ? "CLICK TO OPEN" : "LOCKED FRIDGE"}
            </Text>
        </group>
    )
}

export const Level = () => {
  return (
    <group>
      <Floor />
      
      {/* --- HOUSE WALLS --- */}
      
      {/* Back Wall */}
      <Wall position={[0, 2.5, -5]} args={[15, 5, 0.5]} color="#fcd34d" />
      
      {/* Front Wall with Door Opening */}
      {/* Left side of door */}
      <Wall position={[-5, 2.5, 5]} args={[5, 5, 0.5]} color="#fcd34d" />
      {/* Right side of door */}
      <Wall position={[5, 2.5, 5]} args={[5, 5, 0.5]} color="#fcd34d" />
      {/* Top of door (lintel) */}
      <Wall position={[0, 4, 5]} args={[5, 2, 0.5]} color="#fcd34d" />
      
      {/* Left Wall */}
      <Wall position={[-7.5, 2.5, 0]} args={[0.5, 5, 10.5]} color="#fcd34d" />
      
      {/* Right Wall */}
      <Wall position={[7.5, 2.5, 0]} args={[0.5, 5, 10.5]} color="#fcd34d" />
      
      {/* Interior Walls */}
      <Wall position={[-2, 2.5, 0]} args={[0.5, 5, 6]} color="#f87171" />
      <Wall position={[3, 2.5, 2]} args={[4, 5, 0.5]} color="#60a5fa" />
      
      {/* Roof */}
      <Wall position={[0, 5.25, 0]} args={[16, 0.5, 11]} color="#9ca3af" />

      {/* Furniture */}
      <Furniture position={[4, 0.5, 3]} size={[2, 1, 1]} color="#8b5cf6" /> {/* Couch */}
      <Furniture position={[4, 0.5, 0]} size={[1.5, 0.8, 1]} color="#4b5563" /> {/* TV Stand */}
      <Furniture position={[-5, 0.5, -3]} size={[2, 1, 1]} color="#94a3b8" /> {/* Table */}
      <Furniture position={[0, 0.25, 2]} size={[0.5, 0.5, 0.5]} color="#a16207" /> {/* Box */}
      
      <InteractableKey />
      <Fridge />
    </group>
  );
};