import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';
import { Text } from '@react-three/drei';
import { useGameStore, ChatMessage } from '../store';

// --- TYPES ---
type PlayerState = {
  id: string;
  position: [number, number, number];
  rotation: number; // Y rotation
  color: string;
  lastUpdate: number;
};

// --- FAKE BOTS (For ambiance) ---
const BOT_PROFILES = [
  { name: "xX_Slayer_Xx", color: "#60a5fa" },
  { name: "NoobMaster69", color: "#c084fc" },
  { name: "Glitch_Hunter", color: "#f472b6" }
];

const CHAT_PHRASES = [
  "Lag...", "Where key?", "Neighbor is camping", "run!!", "lol", "anyone in kitchen?"
];

const FakeBot = ({ name, color, startPos }: { name: string, color: string, startPos: number[] }) => {
  const ref = useRef<any>(null);
  const [target, setTarget] = useState(new Vector3(startPos[0], 1, startPos[2]));
  const addChatMessage = useGameStore(state => state.addChatMessage);
  const isPlaying = useGameStore(state => state.isPlaying);

  useFrame((state, delta) => {
    if (!ref.current || !isPlaying) return;
    const currentPos = ref.current.position;
    const direction = new Vector3().subVectors(target, currentPos);
    if (direction.length() < 0.5) {
      setTarget(new Vector3((Math.random() - 0.5) * 12, 1, (Math.random() - 0.5) * 8));
    } else {
      direction.normalize().multiplyScalar(3 * delta);
      ref.current.position.add(direction);
      ref.current.lookAt(target);
    }
  });

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      if (Math.random() > 0.8) {
        addChatMessage(name, CHAT_PHRASES[Math.floor(Math.random() * CHAT_PHRASES.length)], color);
      }
    }, 8000 + Math.random() * 15000);
    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <group ref={ref} position={[startPos[0], 1, startPos[2]]}>
      <mesh castShadow>
        <capsuleGeometry args={[0.4, 1, 4, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, 0.6, 0]}>
         <boxGeometry args={[0.3, 0.3, 0.3]} />
         <meshStandardMaterial color={color} />
      </mesh>
      <Text position={[0, 1.2, 0]} fontSize={0.25} color="white" outlineWidth={0.02} outlineColor="black">{name} [BOT]</Text>
    </group>
  );
};

// --- REAL REMOTE PLAYER ---
const RemotePlayer = ({ data }: { data: PlayerState }) => {
    const ref = useRef<any>(null);
    
    useFrame(() => {
        if(ref.current) {
            // Simple interpolation could go here, but direct set is fine for local tabs
            ref.current.position.set(...data.position);
            ref.current.rotation.set(0, data.rotation, 0);
        }
    });

    return (
        <group ref={ref}>
            <mesh castShadow position={[0,0,0]}>
                <capsuleGeometry args={[0.4, 1, 4, 8]} />
                <meshStandardMaterial color={data.color} />
            </mesh>
            <mesh position={[0, 0.6, 0.2]}>
                <boxGeometry args={[0.2, 0.1, 0.05]} />
                <meshStandardMaterial color="black" />
            </mesh>
            <mesh position={[0, 0.6, 0]}>
                <boxGeometry args={[0.35, 0.35, 0.35]} />
                <meshStandardMaterial color={data.color} />
            </mesh>
            <Text position={[0, 1.3, 0]} fontSize={0.3} color="white" outlineWidth={0.02} outlineColor="black">
                P-{data.id.substring(0,3)}
            </Text>
        </group>
    )
}

// --- MANAGER ---
export const MultiplayerManager = ({ playerPosRef }: { playerPosRef: React.MutableRefObject<Vector3> }) => {
  const { isPlaying, playerId, playerColor, lastOutgoingMessage, receiveChatMessage } = useGameStore();
  const [remotePlayers, setRemotePlayers] = useState<Record<string, PlayerState>>({});
  const channelRef = useRef<BroadcastChannel | null>(null);

  // Initialize BroadcastChannel
  useEffect(() => {
      const channel = new BroadcastChannel('hello_neighbor_parody_game');
      channelRef.current = channel;

      channel.onmessage = (event) => {
          const { type, payload } = event.data;
          
          if (type === 'PLAYER_UPDATE') {
              if (payload.id === playerId) return; // Ignore self
              setRemotePlayers(prev => ({
                  ...prev,
                  [payload.id]: { ...payload, lastUpdate: Date.now() }
              }));
          }
          
          if (type === 'CHAT') {
              if (payload.senderId === playerId) return;
              receiveChatMessage(payload.message);
          }
      };

      return () => {
          channel.close();
      };
  }, [playerId, receiveChatMessage]);

  // Broadcast Loop (Position)
  useFrame((state) => {
      if (!isPlaying || !channelRef.current || !playerPosRef.current) return;
      
      // Throttle broadcast slightly to save resources, but every frame is fine for local tabs
      channelRef.current.postMessage({
          type: 'PLAYER_UPDATE',
          payload: {
              id: playerId,
              position: playerPosRef.current.toArray(),
              rotation: state.camera.rotation.y, // Rough heading
              color: playerColor
          }
      });
  });

  // Cleanup stale players
  useEffect(() => {
      const interval = setInterval(() => {
          const now = Date.now();
          setRemotePlayers(prev => {
              const next = { ...prev };
              let changed = false;
              Object.keys(next).forEach(key => {
                  if (now - next[key].lastUpdate > 3000) {
                      delete next[key]; // Remove if no update for 3s
                      changed = true;
                  }
              });
              return changed ? next : prev;
          });
      }, 1000);
      return () => clearInterval(interval);
  }, []);

  // Broadcast Chat
  useEffect(() => {
      if (lastOutgoingMessage && channelRef.current) {
          channelRef.current.postMessage({
              type: 'CHAT',
              payload: { senderId: playerId, message: lastOutgoingMessage }
          });
      }
  }, [lastOutgoingMessage, playerId]);

  if (!isPlaying) return null;

  return (
    <>
      {/* Real Players */}
      {Object.values(remotePlayers).map(p => (
          <RemotePlayer key={p.id} data={p} />
      ))}
      
      {/* Fake Bots */}
      {BOT_PROFILES.map((bot, i) => (
        <FakeBot 
          key={bot.name} 
          name={bot.name} 
          color={bot.color} 
          startPos={[i * 3 - 6, 0, i * 3 + 2]} 
        />
      ))}
    </>
  );
};