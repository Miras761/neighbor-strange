import React from 'react';
import { GameScene } from './components/GameScene';
import { UI } from './components/UI';

export default function App() {
  return (
    <div className="w-full h-screen relative bg-gray-900 select-none">
      <UI />
      <GameScene />
    </div>
  );
}