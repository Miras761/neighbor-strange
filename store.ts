import { create } from 'zustand';

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  color: string;
}

interface GameState {
  playerId: string;
  playerName: string; // User defined name
  playerColor: string;
  connectedCount: number; // Number of other players found
  isPlaying: boolean;
  isCaught: boolean;
  isWon: boolean;
  hasKey: boolean;
  isChatting: boolean; 
  gameMessage: string;
  chatMessages: ChatMessage[];
  lastOutgoingMessage: ChatMessage | null;
  
  setPlayerName: (name: string) => void;
  setConnectedCount: (count: number) => void;
  startGame: () => void;
  stopGame: () => void;
  setChatting: (isChatting: boolean) => void;
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
  playerName: `Player ${SESSION_ID.substring(0,3)}`,
  playerColor: SESSION_COLOR,
  connectedCount: 0,
  isPlaying: false,
  isCaught: false,
  isWon: false,
  hasKey: false,
  isChatting: false,
  gameMessage: "Welcome to Hello Stranger!",
  chatMessages: [],
  lastOutgoingMessage: null,

  setPlayerName: (name) => set({ playerName: name }),
  setConnectedCount: (count) => set({ connectedCount: count }),

  startGame: () => set((state) => ({ 
    isPlaying: true, 
    isCaught: false, 
    isWon: false, 
    hasKey: false,
    isChatting: false,
    gameMessage: "Find the Golden Spatula!",
    chatMessages: [{ id: 'sys_start', sender: 'System', text: `Welcome ${state.playerName}! Open another tab to play with yourself.`, color: '#fbbf24' }]
  })),
  
  stopGame: () => set({ isPlaying: false, isChatting: false }),
  setChatting: (isChatting) => set({ isChatting }),
  
  catchPlayer: () => set((state) => ({ 
    isPlaying: false, 
    isCaught: true, 
    isChatting: false,
    gameMessage: "The Neighbor caught you!",
    chatMessages: [...state.chatMessages, { id: Date.now().toString(), sender: 'System', text: 'You were caught!', color: '#ef4444' }]
  })),
  
  winGame: () => set({ isPlaying: false, isWon: true, isChatting: false, gameMessage: "You found the secret stash! You win!" }),
  
  pickUpKey: () => set((state) => ({ 
    hasKey: true, 
    gameMessage: "You got the Golden Spatula! Find the Fridge!",
    chatMessages: [...state.chatMessages, { id: Date.now().toString(), sender: 'System', text: 'You found the Artifact!', color: '#fcd34d' }]
  })),
  
  reset: () => set({ isPlaying: false, isCaught: false, isWon: false, hasKey: false, isChatting: false, gameMessage: "Welcome to Hello Stranger!" }),
  
  addChatMessage: (sender, text, color = 'white') => set((state) => ({
    chatMessages: [...state.chatMessages.slice(-8), { id: Date.now().toString() + Math.random(), sender, text, color }]
  })),

  sendChatMessage: (text) => set((state) => {
    const msg = { id: Date.now().toString() + Math.random(), sender: state.playerName, text, color: state.playerColor };
    return {
      chatMessages: [...state.chatMessages.slice(-8), msg],
      lastOutgoingMessage: { ...msg, sender: state.playerName } 
    };
  }),

  receiveChatMessage: (msg) => set((state) => ({
    chatMessages: [...state.chatMessages.slice(-8), msg]
  })),
}));