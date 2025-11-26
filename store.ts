import { create } from 'zustand';

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  color: string;
}

interface GameState {
  playerId: string;
  playerColor: string;
  isPlaying: boolean;
  isCaught: boolean;
  isWon: boolean;
  hasKey: boolean;
  gameMessage: string;
  chatMessages: ChatMessage[];
  lastOutgoingMessage: ChatMessage | null; // For broadcasting
  
  startGame: () => void;
  stopGame: () => void;
  catchPlayer: () => void;
  winGame: () => void;
  pickUpKey: () => void;
  reset: () => void;
  addChatMessage: (sender: string, text: string, color?: string) => void;
  sendChatMessage: (text: string) => void;
  receiveChatMessage: (msg: ChatMessage) => void;
}

// Generate a random ID and Color for this session (Tab)
const SESSION_ID = Math.random().toString(36).substring(7);
const SESSION_COLOR = `hsl(${Math.random() * 360}, 70%, 50%)`;

export const useGameStore = create<GameState>((set) => ({
  playerId: SESSION_ID,
  playerColor: SESSION_COLOR,
  isPlaying: false,
  isCaught: false,
  isWon: false,
  hasKey: false,
  gameMessage: "Welcome to Hello Stranger!",
  chatMessages: [],
  lastOutgoingMessage: null,

  startGame: () => set({ 
    isPlaying: true, 
    isCaught: false, 
    isWon: false, 
    hasKey: false, 
    gameMessage: "Find the Golden Spatula!",
    chatMessages: [{ id: 'sys_start', sender: 'System', text: 'Multiplayer Active: Open 2 tabs to play!', color: '#fbbf24' }]
  }),
  
  stopGame: () => set({ isPlaying: false }),
  
  catchPlayer: () => set((state) => ({ 
    isPlaying: false, 
    isCaught: true, 
    gameMessage: "The Neighbor caught you!",
    chatMessages: [...state.chatMessages, { id: Date.now().toString(), sender: 'System', text: 'You were caught!', color: '#ef4444' }]
  })),
  
  winGame: () => set({ isPlaying: false, isWon: true, gameMessage: "You found the secret stash! You win!" }),
  
  pickUpKey: () => set((state) => ({ 
    hasKey: true, 
    gameMessage: "You got the Golden Spatula! Find the Fridge!",
    chatMessages: [...state.chatMessages, { id: Date.now().toString(), sender: 'System', text: 'You found the Artifact!', color: '#fcd34d' }]
  })),
  
  reset: () => set({ isPlaying: false, isCaught: false, isWon: false, hasKey: false, gameMessage: "Welcome to Hello Stranger!" }),
  
  // Internal/System chat add
  addChatMessage: (sender, text, color = 'white') => set((state) => ({
    chatMessages: [...state.chatMessages.slice(-8), { id: Date.now().toString() + Math.random(), sender, text, color }]
  })),

  // User sending a chat (triggers broadcast)
  sendChatMessage: (text) => set((state) => {
    const msg = { id: Date.now().toString() + Math.random(), sender: 'You', text, color: state.playerColor };
    return {
      chatMessages: [...state.chatMessages.slice(-8), msg],
      lastOutgoingMessage: { ...msg, sender: `Player ${state.playerId.substring(0,3)}` } // Change sender name for network
    };
  }),

  // Receiving a chat from network
  receiveChatMessage: (msg) => set((state) => ({
    chatMessages: [...state.chatMessages.slice(-8), msg]
  })),
}));