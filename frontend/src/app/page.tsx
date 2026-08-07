'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import io from 'socket.io-client';

let socket: any;

export default function Home() {
  const router = useRouter();
  const [roomCode, setRoomCode] = useState('');
  const [joinedRoom, setJoinedRoom] = useState<string | null>(null);
  const [players, setPlayers] = useState<string[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    // Connect to backend
    socket = io(process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001');

    socket.on('playerJoined', (data: { players: string[] }) => {
      setPlayers(data.players);
    });

    socket.on('roomError', (msg: string) => {
      setError(msg);
    });

    socket.on('matchStarted', () => {
      // Both players redirect to Arena
      if (joinedRoom) {
        router.push(`/arena?room=${joinedRoom}`);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [joinedRoom, router]);

  const handleJoin = () => {
    if (roomCode.trim() === '') return;
    socket.emit('joinRoom', roomCode);
    setJoinedRoom(roomCode);
    setError('');
  };

  const handleCreate = () => {
    const randomCode = Math.floor(1000 + Math.random() * 9000).toString();
    setRoomCode(randomCode);
    socket.emit('joinRoom', randomCode);
    setJoinedRoom(randomCode);
    setError('');
  };

  const handleStartMatch = () => {
    if (players.length >= 2) {
      socket.emit('startMatch', joinedRoom);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-black p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md text-center">
        <h1 className="text-3xl font-bold mb-2">SAT 1v1 Challenge</h1>
        <p className="text-gray-500 mb-8">Enter the arena and challenge your friends.</p>

        {error && <div className="text-red-500 mb-4 font-semibold">{error}</div>}

        {!joinedRoom ? (
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <input 
                type="text" 
                placeholder="Enter 4-digit PIN"
                className="border-2 border-gray-300 px-4 py-3 rounded-lg text-center text-xl font-bold tracking-widest outline-none focus:border-blue-500"
                maxLength={4}
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
              />
              <button 
                onClick={handleJoin}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition"
              >
                Join Room
              </button>
            </div>
            
            <div className="relative flex items-center py-4">
              <div className="flex-grow border-t border-gray-300"></div>
              <span className="flex-shrink-0 mx-4 text-gray-400 font-semibold">OR</span>
              <div className="flex-grow border-t border-gray-300"></div>
            </div>

            <button 
              onClick={handleCreate}
              className="w-full bg-gray-900 text-white px-6 py-3 rounded-lg font-bold hover:bg-black transition"
            >
              Create New Room
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="p-6 bg-blue-50 rounded-lg border-2 border-blue-200">
              <p className="text-sm text-gray-600 font-semibold mb-1">ROOM PIN</p>
              <p className="text-4xl font-black tracking-widest text-blue-700">{joinedRoom}</p>
            </div>

            <div className="bg-gray-100 p-4 rounded-lg">
              <h3 className="font-bold mb-3">Players ({players.length}/2)</h3>
              <ul className="space-y-2">
                {players.map((id, index) => (
                  <li key={index} className="bg-white px-4 py-2 rounded shadow-sm font-semibold flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    Player {index + 1} {socket?.id === id && "(You)"}
                  </li>
                ))}
              </ul>
              {players.length < 2 && (
                <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500 font-semibold">
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                  Waiting for opponent...
                </div>
              )}
            </div>

            {players.length >= 2 ? (
              <button 
                onClick={handleStartMatch}
                className="w-full bg-red-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-red-700 transition text-lg animate-pulse"
              >
                START MATCH
              </button>
            ) : (
              <button 
                onClick={() => setJoinedRoom(null)}
                className="w-full text-gray-500 font-semibold hover:text-black underline mt-2"
              >
                Leave Room
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
