import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../store';
import { Key, Skull, Trophy, Users, Send, MessageSquare, User } from 'lucide-react';

const ChatBox = () => {
  const { chatMessages, sendChatMessage, isChatting, setChatting } = useGameStore();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      sendChatMessage(input);
      setInput("");
    }
    setChatting(false);
  };

  useEffect(() => {
    if (isChatting) {
      setTimeout(() => inputRef.current?.focus(), 10);
    } else {
        inputRef.current?.blur();
    }
  }, [isChatting]);

  useEffect(() => {
    (messagesEndRef.current as any)?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  return (
    <div className={`absolute bottom-4 left-4 w-80 transition-opacity duration-300 ${isChatting ? 'opacity-100' : 'opacity-70'}`}>
      <div className="bg-black/60 rounded-t-lg p-2 h-48 overflow-y-auto flex flex-col gap-1 backdrop-blur-sm pointer-events-auto">
        {chatMessages.map((msg) => (
          <div key={msg.id} className="text-sm break-words shadow-sm">
            <span style={{ color: msg.color || 'white', fontWeight: 'bold' }}>{msg.sender}: </span>
            <span className="text-white">{msg.text}</span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      {isChatting ? (
        <form onSubmit={handleSubmit} className="flex bg-black/90 rounded-b-lg p-1 border border-white/20 pointer-events-auto">
          <input 
            ref={inputRef}
            type="text" 
            value={input}
            onChange={(e) => setInput((e.target as any).value)}
            placeholder="Type message..."
            className="flex-1 bg-transparent border-none outline-none text-white text-sm px-2"
            onKeyDown={(e) => e.stopPropagation()} 
          />
          <button type="submit" className="text-white p-1 hover:text-green-400">
            <Send size={16} />
          </button>
        </form>
      ) : (
        <div className="bg-black/40 rounded-b-lg p-1 text-xs text-gray-400 px-2 flex items-center gap-2">
            <MessageSquare size={12} />
            <span>Press <kbd className="bg-gray-700 px-1 rounded text-white">Enter</kbd> to chat</span>
        </div>
      )}
    </div>
  );
};

export const UI = () => {
  const { isPlaying, isCaught, isWon, hasKey, gameMessage, startGame, reset, isChatting, setChatting, playerName, setPlayerName, connectedCount } = useGameStore();

  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if (e.code === 'Enter' && isPlaying) {
              setChatting(!isChatting);
          }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, isChatting, setChatting]);

  if (!isPlaying && !isCaught && !isWon) {
    return (
      <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 text-white p-4">
        <h1 className="text-6xl font-black text-yellow-400 mb-4 tracking-tighter transform -rotate-2">
          HELLO STRANGER
        </h1>
        <p className="text-xl mb-4 text-gray-300">Parody Edition</p>
        
        {/* Connection Status */}
        <div className="flex flex-col items-center gap-2 mb-6 bg-green-900/50 px-6 py-2 rounded-full border border-green-500/50">
           <div className="flex items-center gap-2">
              <Users size={16} className={connectedCount > 0 ? "text-green-400 animate-pulse" : "text-gray-400"} />
              <span className="text-sm font-mono text-green-300 font-bold">
                  {connectedCount > 0 ? `${connectedCount} Friends Online` : "Searching for players..."}
              </span>
           </div>
           <span className="text-xs text-green-400/80">
               {connectedCount > 0 ? "Join them now!" : "Open a second tab to see multiplayer!"}
           </span>
        </div>
        
        <div className="bg-gray-800 p-6 rounded-lg max-w-md text-center border-4 border-yellow-400 w-full">
          <p className="mb-4 text-gray-300">Mr. Peterson has the Golden Spatula. Go get it.</p>
          
          <div className="mb-6 text-left">
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Your Name</label>
            <div className="flex items-center bg-gray-900 rounded border border-gray-600 focus-within:border-yellow-400 transition-colors p-2">
                <User size={18} className="text-gray-400 mr-2"/>
                <input 
                    type="text" 
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    maxLength={12}
                    className="bg-transparent border-none outline-none text-white w-full font-bold"
                    placeholder="Enter Name"
                />
            </div>
          </div>

          <ul className="text-left space-y-2 mb-6 text-sm text-gray-300">
            <li>🕵️ <b>WASD</b> to Move</li>
            <li>🏃 <b>Shift</b> to Sprint</li>
            <li>✨ <b>Space</b> to Jump</li>
            <li>💬 <b>Enter</b> to Chat</li>
          </ul>
          <button 
            onClick={startGame}
            className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-3 px-6 rounded text-xl transition-transform hover:scale-105 shadow-[0_4px_0_rgb(180,83,9)] hover:shadow-[0_2px_0_rgb(180,83,9)] hover:translate-y-[2px]"
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
      {!isChatting && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-white/50 rounded-full border border-black/50 mix-blend-difference" />
      )}
      
      <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
         <div className="bg-black/50 backdrop-blur text-white p-3 rounded-xl border border-white/20 max-w-xs">
             <h2 className="font-bold text-yellow-400 text-xs uppercase tracking-widest mb-1">Objective</h2>
             <p className="font-mono text-sm leading-tight">{gameMessage}</p>
         </div>
         {isChatting && (
             <div className="bg-blue-500/80 text-white px-4 py-1 rounded-full text-sm font-bold animate-pulse">
                 CHAT MODE
             </div>
         )}
      </div>

      <div className="absolute bottom-4 right-4 flex gap-2">
         {hasKey && (
             <div className="bg-yellow-400 text-black p-3 rounded-full animate-bounce shadow-lg border-2 border-white">
                 <Key size={32} />
             </div>
         )}
      </div>

      <ChatBox />
    </div>
  );
};