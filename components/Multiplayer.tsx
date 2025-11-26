import React, { useRef, useState, useEffect, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';
import { Text } from '@react-three/drei';
import { useGameStore } from '../store';
import Peer, { DataConnection } from 'peerjs';

// --- TYPES ---
type PlayerState = {
  id: string;
  name: string;
  position: [number, number, number];
  rotation: number;
  color: string;
  lastUpdate: number;
};

// Protocol: { type: string, payload: any }
// Types: 'HELLO', 'UPDATE_ME', 'WORLD_STATE', 'CHAT'

// --- FAKE BOTS (Only if not in room or for flavor) ---
const BOT_PROFILES = [
  { name: "Bot_Alice", color: "#60a5fa" },
  { name: "Bot_Bob", color: "#c084fc" }
];

const FakeBot = ({ name, color, startPos }: { name: string, color: string, startPos: number[] }) => {
  const ref = useRef<any>(null);
  const [target, setTarget] = useState(new Vector3(startPos[0], 1, startPos[2]));
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
      <Text position={[0, 1.4, 0]} fontSize={0.3} color="white" outlineWidth={0.02} outlineColor="black">
        {name} [BOT]
      </Text>
    </group>
  );
};

// --- REAL REMOTE PLAYER ---
const RemotePlayer = ({ data }: { data: PlayerState }) => {
    const ref = useRef<any>(null);
    const dataRef = useRef(data);

    useLayoutEffect(() => {
        dataRef.current = data;
    }, [data]);
    
    useFrame((state, delta) => {
        if(ref.current) {
            const targetPos = new Vector3(...dataRef.current.position);
            ref.current.position.lerp(targetPos, 15 * delta); // Higher lerp for network lag compensation
            ref.current.rotation.set(0, dataRef.current.rotation, 0);
        }
    });

    return (
        <group ref={ref} position={data.position}>
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
            <Text position={[0, 1.4, 0]} fontSize={0.4} color="white" outlineWidth={0.04} outlineColor="black">
                {data.name}
            </Text>
        </group>
    )
}

// --- MANAGER ---
export const MultiplayerManager = ({ playerPosRef }: { playerPosRef: React.MutableRefObject<Vector3> }) => {
  const { 
      isPlaying, playerId, playerName, playerColor, 
      lastOutgoingMessage, receiveChatMessage, setConnectedCount, 
      isHost, roomId, setRoomId, addChatMessage
  } = useGameStore();

  const [remotePlayers, setRemotePlayers] = useState<Record<string, PlayerState>>({});
  
  // PeerJS refs
  const peerRef = useRef<Peer | null>(null);
  const connectionsRef = useRef<DataConnection[]>([]);
  const lastBroadcastTime = useRef(0);

  // Setup PeerJS
  useEffect(() => {
      if (!isPlaying) return;

      // Import dynamically or assume it's globally available via index.html script if types fail, 
      // but we use "peerjs" module from importmap which works with ES6 imports.
      
      const initPeer = async () => {
          // If we are host, we don't pass ID (let server generate), or we generate a random string
          // To make it easy to type, let's try to request a short ID if possible, but PeerJS cloud often requires unique.
          // We'll let PeerJS generate a UUID, but we could try a random 4-char if we ran our own server.
          // Using default public cloud server.
          
          const peer = new Peer(isHost ? undefined : undefined); // Undefined = random ID
          peerRef.current = peer;

          peer.on('open', (id) => {
              console.log('My Peer ID is: ' + id);
              if (isHost) {
                  setRoomId(id);
                  addChatMessage('System', `Room Created! Share ID: ${id}`, '#22c55e');
              } else {
                  // If joining, we now connect to the roomId provided in store
                  if (roomId) {
                      addChatMessage('System', `Connecting to ${roomId}...`, '#fbbf24');
                      const conn = peer.connect(roomId);
                      setupConnection(conn);
                  }
              }
          });

          peer.on('connection', (conn) => {
              // Only Host handles incoming connections logic usually, 
              // but P2P might receive them too. 
              // In our Star topology, only Host receives connections from new players.
              if (isHost) {
                  console.log("New connection from " + conn.peer);
                  setupConnection(conn);
                  addChatMessage('System', 'A player joined!', '#22c55e');
              } else {
                  // A joiner usually doesn't accept incoming connections in Star topology,
                  // unless we do mesh. We'll stick to Star.
              }
          });

          peer.on('error', (err) => {
              console.error(err);
              addChatMessage('System', `Connection Error: ${err.type}`, '#ef4444');
          });
      };

      initPeer();

      return () => {
          peerRef.current?.destroy();
          connectionsRef.current = [];
      };
  }, [isPlaying, isHost]); // Re-init if gamemode restarts (but usually we just unmount)

  const setupConnection = (conn: DataConnection) => {
      connectionsRef.current.push(conn);
      
      conn.on('open', () => {
          // Send initial Hello
          conn.send({
              type: 'HELLO',
              payload: { id: playerId, name: playerName, color: playerColor }
          });
          setConnectedCount(connectionsRef.current.length);
      });

      conn.on('data', (data: any) => {
          handleData(data, conn);
      });

      conn.on('close', () => {
          connectionsRef.current = connectionsRef.current.filter(c => c !== conn);
          setConnectedCount(connectionsRef.current.length);
          // If we track players by conn, remove them. 
          // But we track by ID in payload. 
          // We'll rely on timeout cleanup for removing players from state.
      });
  };

  const handleData = (data: any, conn: DataConnection) => {
      if (data.type === 'UPDATE_ME') {
          // Client -> Host: Player Update
          const p = data.payload;
          setRemotePlayers(prev => ({
              ...prev,
              [p.id]: { ...p, lastUpdate: Date.now() }
          }));
      }
      else if (data.type === 'WORLD_STATE') {
          // Host -> Client: Full State Update
          // This payload contains ALL players the host knows about
          const allPlayers = data.payload;
          setRemotePlayers(prev => {
              const next = { ...prev };
              Object.values(allPlayers).forEach((p: any) => {
                  if (p.id !== playerId) { // Don't overwrite self with lagged data
                       next[p.id] = { ...p, lastUpdate: Date.now() };
                  }
              });
              return next;
          });
      }
      else if (data.type === 'CHAT') {
          // Received chat, display it
          if (data.payload.senderId !== playerId) {
              receiveChatMessage(data.payload.message);
              // If Host, relay to others
              if (isHost) {
                  connectionsRef.current.forEach(c => {
                      if (c.peer !== conn.peer) { // Don't echo back to sender if possible, or simple echo is fine
                          c.send(data); 
                      }
                  });
              }
          }
      }
  };

  // --- GAME LOOP ---

  // Host: Broadcast World State to all clients
  // Client: Send My Position to Host
  useFrame((state) => {
      if (!isPlaying || !playerPosRef.current) return;

      const now = Date.now();
      if (now - lastBroadcastTime.current > 50) { // 20hz
          lastBroadcastTime.current = now;

          const myData = {
              id: playerId,
              name: playerName,
              position: playerPosRef.current.toArray(),
              rotation: state.camera.rotation.y,
              color: playerColor,
              lastUpdate: now
          };

          if (isHost) {
              // Host Logic:
              // 1. Update self in the "World State"
              const fullState = { ...remotePlayers, [playerId]: myData };
              
              // 2. Broadcast full state to all connected clients
              connectionsRef.current.forEach(conn => {
                  if (conn.open) {
                      conn.send({
                          type: 'WORLD_STATE',
                          payload: fullState
                      });
                  }
              });
          } else {
              // Client Logic:
              // 1. Send update to Host
              // We usually only have 1 connection (to Host)
              connectionsRef.current.forEach(conn => {
                  if (conn.open) {
                      conn.send({
                          type: 'UPDATE_ME',
                          payload: myData
                      });
                  }
              });
          }
      }
  });

  // Cleanup Loop
  useEffect(() => {
      const interval = setInterval(() => {
          const now = Date.now();
          setRemotePlayers(prev => {
              const next = { ...prev };
              let changed = false;
              Object.keys(next).forEach(key => {
                  // If no update for 4 seconds, remove
                  if (now - next[key].lastUpdate > 4000) {
                      delete next[key];
                      changed = true;
                  }
              });
              return changed ? next : prev;
          });
      }, 1000);
      return () => clearInterval(interval);
  }, []);

  // Send Chat
  useEffect(() => {
      if (lastOutgoingMessage) {
          connectionsRef.current.forEach(conn => {
              if (conn.open) {
                  conn.send({
                      type: 'CHAT',
                      payload: { senderId: playerId, message: lastOutgoingMessage }
                  });
              }
          });
      }
  }, [lastOutgoingMessage, playerId]);

  if (!isPlaying) return null;

  return (
    <>
      {Object.values(remotePlayers).map(p => (
          <RemotePlayer key={p.id} data={p} />
      ))}
      
      {/* Show fake bots only if no one connected yet to make it feel alive? Or always? */}
      {/* Let's show them always for chaos */}
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