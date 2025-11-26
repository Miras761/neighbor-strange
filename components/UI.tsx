import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../store';
import { Key, Skull, Trophy, Users, Send } from 'lucide-react';

const ChatBox = () => {
  const { chatMessages, sendChatMessage } = useGameStore();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      sendChatMessage(input);
      setInput("");
    }
  };

  useEffect(() => {
    (messagesEndRef.current as any)?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  return (
    <div className="absolute bottom-4 left-4 w-80 pointer-events-auto">
      <div className="bg-black/60 rounded-t-lg p-2 h-48 overflow-y-auto flex flex-col gap-1 backdrop-blur-sm">
        {chatMessages.map((msg) => (
          <div key={msg.id} className="text-sm break-words shadow-sm">
            <span style={{ color: msg.color || 'white', fontWeight: 'bold' }}>{msg.sender}: </span>
            <span className="text-white">{msg.text}</span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSubmit} className="flex bg-black/80 rounded-b-lg p-1">
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput((e.target as any).value)}
          placeholder="Say something..."
          className="flex-1 bg-transparent border-none outline-none text-white text-sm px-2"
          onKeyDown={(e) => e.stopPropagation()} // Prevent walking while typing
        />
        <button type="submit" className="text-white p-1 hover:text-green-400">
          <Send size={16} />
        </button>
      </form>
    </div>
  );
};

export const UI = () => {
  const { isPlaying, isCaught, isWon, hasKey, gameMessage, startGame, reset } = useGameStore();

  if (!isPlaying && !isCaught && !isWon) {
    return (
      <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 text-white p-4">
        <h1 className="text-6xl font-black text-yellow-400 mb-4 tracking-tighter transform -rotate-2">
          HELLO STRANGER
        </h1>
        <p className="text-xl mb-4 text-gray-300">Parody Edition</p>
        <div className="flex flex-col items-center gap-2 mb-8 bg-green-900/50 px-6 py-2 rounded-full border border-green-500/50">
           <div className="flex items-center gap-2">
              <Users size={16} className="text-green-400" />
              <span className="text-sm font-mono text-green-300 font-bold">Multiplayer Ready</span>
           </div>
           <span className="text-xs text-green-400/80">Open this game in 2+ tabs to play together!</span>
        </div>
        
        <div className="bg-gray-800 p-6 rounded-lg max-w-md text-center border-4 border-yellow-400">
          <p className="mb-4">Your neighbor, Mr. Peterson, has hidden a Golden Spatula in his house.</p>
          <ul className="text-left space-y-2 mb-6 text-sm text-gray-300">
            <li>🕵️ <b>WASD</b> to Move</li>
            <li>🏃 <b>Shift</b> to Sprint</li>
            <li>✨ <b>Space</b> to Jump</li>
            <li>💬 <b>Chat</b> with other players</li>
          </ul>
          <button 
            onClick={startGame}
            className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-3 px-6 rounded text-xl transition-transform hover:scale-105"
          >
            ENTER WORLD
          </button>
        </div>
      </div>
    );
  }

  if (isCaught) {
    return (
      <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-red-900/90 text-white pointer-events-auto">
        <Skull size={120} className="text-red-500 mb-4 animate-pulse" />
        <h1 className="text-8xl font-black mb-2">CAUGHT!</h1>
        <p className="text-2xl mb-8">{gameMessage}</p>
        <button 
          onClick={reset}
          className="bg-white text-red-900 font-bold py-3 px-8 rounded-full text-xl hover:bg-gray-200 transition"
        >
          Respawn
        </button>
      </div>
    );
  }

  if (isWon) {
    return (
      <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-green-900/90 text-white pointer-events-auto">
        <Trophy size={120} className="text-yellow-400 mb-4 animate-bounce" />
        <h1 className="text-6xl font-black mb-2">VICTORY!</h1>
        <p className="text-2xl mb-8">You found the stash!</p>
        <button 
          onClick={reset}
          className="bg-white text-green-900 font-bold py-3 px-8 rounded-full text-xl hover:bg-gray-200 transition"
        >
          Play Again
        </button>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      {/* Crosshair */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-white/50 rounded-full border border-black/50 mix-blend-difference" />
      
      {/* HUD */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
         <div className="bg-black/50 backdrop-blur text-white p-3 rounded-xl border border-white/20 max-w-xs">
             <h2 className="font-bold text-yellow-400 text-xs uppercase tracking-widest mb-1">Current Objective</h2>
             <p className="font-mono text-sm leading-tight">{gameMessage}</p>
         </div>
      </div>

      {/* Inventory */}
      <div className="absolute bottom-4 right-4 flex gap-2">
         {hasKey && (
             <div className="bg-yellow-400 text-black p-3 rounded-full animate-bounce shadow-lg border-2 border-white">
                 <Key size={32} />
             </div>
         )}
      </div>

      {/* Chat */}
      <ChatBox />
    </div>
  );
};