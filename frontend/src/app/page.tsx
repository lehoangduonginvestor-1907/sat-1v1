'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession, signIn, signOut } from 'next-auth/react';
import io from 'socket.io-client';
import { Copy, Check, LogOut } from 'lucide-react';

let socket: any;

function LobbyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const joinCode = searchParams.get('join');
  const { data: session, status } = useSession();

  const [roomCode, setRoomCode] = useState('');
  const [joinedRoom, setJoinedRoom] = useState<string | null>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Chỉ kết nối socket khi đã đăng nhập
    if (!session?.user) return;

    socket = io(process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001');

    socket.on('playerJoined', (data: { players: any[] }) => {
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

    // Auto-join if URL has ?join=PIN
    if (joinCode && typeof window !== 'undefined') {
       socket.emit('joinRoom', { 
         roomCode: joinCode, 
         user: { name: session.user.name, image: session.user.image } 
       });
       setJoinedRoom(joinCode);
    }

    return () => {
      if (socket) socket.disconnect();
    };
  }, [joinCode, router, joinedRoom, session]);

  const handleJoin = () => {
    if (roomCode.trim() === '' || !session?.user) return;
    socket.emit('joinRoom', { 
      roomCode, 
      user: { name: session.user.name, image: session.user.image } 
    });
    setJoinedRoom(roomCode);
    setError('');
  };

  const handleCreate = () => {
    if (!session?.user) return;
    const randomCode = Math.floor(1000 + Math.random() * 9000).toString();
    setRoomCode(randomCode);
    socket.emit('joinRoom', { 
      roomCode: randomCode, 
      user: { name: session.user.name, image: session.user.image } 
    });
    setJoinedRoom(randomCode);
    setError('');
    // Xoá param join trên URL nếu có để tránh lỗi
    if (joinCode) {
      router.replace('/');
    }
  };

  const handleStartMatch = () => {
    if (players.length >= 2) {
      socket.emit('startMatch', joinedRoom);
    }
  };

  const inviteLink = typeof window !== 'undefined' ? `${window.location.origin}/?join=${joinedRoom}` : '';

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center font-bold text-gray-500">Loading Session...</div>;
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-black p-4">
        <div className="bg-white p-10 rounded-2xl shadow-xl w-full max-w-md text-center border border-gray-100">
          <h1 className="text-4xl font-black mb-3 tracking-tight text-gray-900">SAT Arena</h1>
          <p className="text-gray-500 mb-8 font-medium">Log in to enter the 1v1 battlefield.</p>
          <button 
            onClick={() => signIn('google')}
            className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-200 text-gray-700 px-6 py-4 rounded-xl font-bold hover:bg-gray-50 hover:border-gray-300 transition-all"
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-black p-4 relative">
      
      {/* Header Profile */}
      <div className="absolute top-4 right-4 flex items-center gap-3 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-200">
         <img src={session.user?.image || ''} alt="Avatar" className="w-8 h-8 rounded-full" />
         <span className="font-bold text-sm hidden sm:block">{session.user?.name}</span>
         <button onClick={() => signOut()} className="ml-2 text-gray-400 hover:text-red-500" title="Sign Out">
            <LogOut size={16} />
         </button>
      </div>

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
            <div className="p-6 bg-blue-50 rounded-lg border-2 border-blue-200 relative">
              <p className="text-sm text-gray-600 font-semibold mb-1">ROOM PIN</p>
              <p className="text-4xl font-black tracking-widest text-blue-700">{joinedRoom}</p>
              
              {/* Invite Link Section */}
              <div className="mt-4 pt-4 border-t border-blue-200">
                <p className="text-xs text-gray-500 font-semibold mb-2">INVITE LINK</p>
                <div className="flex items-center gap-2 bg-white border border-gray-300 rounded p-1.5">
                  <input 
                    type="text" 
                    readOnly 
                    value={inviteLink}
                    className="flex-1 text-xs text-gray-600 bg-transparent outline-none px-1"
                  />
                  <button 
                    onClick={copyToClipboard}
                    className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded text-gray-700 transition"
                    title="Copy Invite Link"
                  >
                    {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-gray-100 p-4 rounded-lg">
              <h3 className="font-bold mb-3">Players ({players.length}/2)</h3>
              <ul className="space-y-3">
                {players.map((p, index) => (
                  <li key={index} className="bg-white px-4 py-2 rounded-lg shadow-sm font-semibold flex items-center gap-3">
                    <img src={p.user?.image || 'https://www.gravatar.com/avatar/?d=mp'} alt="Avatar" className="w-8 h-8 rounded-full bg-gray-200" />
                    <span className="flex-1 text-left">{p.user?.name || `Player ${index + 1}`} {socket?.id === p.id && "(You)"}</span>
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
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

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <LobbyContent />
    </Suspense>
  );
}
