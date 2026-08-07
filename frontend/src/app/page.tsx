'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import io from 'socket.io-client';
import { Copy, Check, Edit2, X } from 'lucide-react';

let socket: any;

function LobbyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const joinCode = searchParams.get('join');

  const [joinedRoom, setJoinedRoom] = useState<string | null>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [nickname, setNickname] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [matchSettings, setMatchSettings] = useState({
    subject: 'Verbal',
    domain: 'All',
    difficulty: 'All',
    questionCount: 20,
    timeLimit: 32
  });

  useEffect(() => {
    // Load nickname from localStorage
    const savedName = localStorage.getItem('sat_nickname');
    if (savedName) {
      setNickname(savedName);
    }
  }, []);

  useEffect(() => {
    if (!nickname) return;

    if (!socket) {
      socket = io(process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001');
    }

    const handlePlayerJoined = (data: { players: any[] }) => {
      setPlayers(data.players);
    };
    
    const handleRoomError = (msg: string) => {
      setError(msg);
    };
    
    const handleMatchStarted = () => {
      // Dùng window.location để redirect ngay lập tức để tránh phụ thuộc state
      if (typeof window !== 'undefined') {
        const currentParams = new URLSearchParams(window.location.search);
        const room = currentParams.get('join') || localStorage.getItem('current_room');
        if (room) {
          router.push(`/arena?room=${room}`);
        }
      }
    };

    socket.on('playerJoined', handlePlayerJoined);
    socket.on('roomError', handleRoomError);
    socket.on('matchStarted', handleMatchStarted);

    // Auto-join if URL has ?join=PIN and not already joined
    if (joinCode && !joinedRoom) {
       socket.emit('joinRoom', { 
         roomCode: joinCode, 
         user: { name: nickname, image: null } 
       });
       setJoinedRoom(joinCode);
       localStorage.setItem('current_room', joinCode);
    }

    return () => {
      if (socket) {
        socket.off('playerJoined', handlePlayerJoined);
        socket.off('roomError', handleRoomError);
        socket.off('matchStarted', handleMatchStarted);
      }
    };
  }, [joinCode, router, joinedRoom, nickname]);

  const handleCreate = () => {
    if (!nickname) return;
    setShowSettings(true);
  };

  const confirmCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    const randomCode = Math.floor(1000 + Math.random() * 9000).toString();
    socket.emit('joinRoom', { 
      roomCode: randomCode, 
      user: { name: nickname, image: null },
      settings: matchSettings
    });
    setJoinedRoom(randomCode);
    localStorage.setItem('current_room', randomCode);
    setError('');
    setShowSettings(false);
    // Xoá param join trên URL nếu có để tránh lỗi
    if (joinCode) {
      router.replace('/');
    }
  };

  const inviteLink = typeof window !== 'undefined' ? `${window.location.origin}/?join=${joinedRoom}` : '';

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveNickname = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const name = formData.get('nickname') as string;
    if (name.trim()) {
      setNickname(name.trim());
      localStorage.setItem('sat_nickname', name.trim());
      setIsEditingName(false);
    }
  };

  if (!nickname || isEditingName) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-black p-4">
        <div className="bg-white p-10 rounded-2xl shadow-xl w-full max-w-md text-center border border-gray-100">
          <h1 className="text-4xl font-black mb-3 tracking-tight text-gray-900">SAT Arena</h1>
          <p className="text-gray-500 mb-8 font-medium">Enter a badass nickname to join.</p>
          <form onSubmit={handleSaveNickname} className="space-y-4">
            <input 
              name="nickname"
              defaultValue={nickname}
              placeholder="e.g. Math Destroyer"
              autoFocus
              className="w-full border-2 border-gray-300 px-4 py-3 rounded-lg text-center font-bold outline-none focus:border-blue-500 text-lg"
              maxLength={20}
            />
            <button 
              type="submit"
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition-all"
            >
              Continue
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-black p-4 relative">
      
      {/* Header Profile */}
      <div className="absolute top-4 right-4 flex items-center gap-3 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-200">
         <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 text-white flex items-center justify-center font-bold">
           {nickname.charAt(0).toUpperCase()}
         </div>
         <span className="font-bold text-sm hidden sm:block">{nickname}</span>
         <button onClick={() => setIsEditingName(true)} className="ml-2 text-gray-400 hover:text-blue-500" title="Change Nickname">
            <Edit2 size={16} />
         </button>
      </div>

      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md text-center">
        <h1 className="text-3xl font-bold mb-2">SAT 1v1 Challenge</h1>
        <p className="text-gray-500 mb-8">Enter the arena and challenge your friends.</p>

        {error && <div className="text-red-500 mb-4 font-semibold">{error}</div>}

        {!joinedRoom ? (
          <div className="space-y-4">
            <button 
              onClick={handleCreate}
              className="w-full bg-gray-900 text-white px-6 py-4 rounded-lg font-bold text-xl hover:bg-black transition shadow-lg"
            >
              Create Match
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="p-6 bg-blue-50 rounded-lg border-2 border-blue-200 relative text-center">
              <p className="text-sm text-gray-600 font-semibold mb-2">Send this link to your friend to join</p>
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

            <div className="bg-gray-100 p-4 rounded-lg">
              <h3 className="font-bold mb-3">Players ({players.length}/2)</h3>
              <ul className="space-y-3">
                {players.map((p, index) => (
                  <li key={index} className="bg-white px-4 py-2 rounded-lg shadow-sm font-semibold flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-gray-400 to-gray-600 text-white flex items-center justify-center font-bold text-xs">
                       {p.user?.name?.charAt(0).toUpperCase() || '?'}
                    </div>
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

              <button 
                onClick={() => {
                  setJoinedRoom(null);
                  localStorage.removeItem('current_room');
                  if (socket) {
                    socket.disconnect();
                    socket = null;
                  }
                  if (joinCode) {
                    router.replace('/');
                  }
                }}
                className="w-full text-gray-500 font-semibold hover:text-black underline mt-2"
              >
                Leave Room
              </button>
          </div>
        )}
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative animate-in fade-in zoom-in duration-200">
            <button 
              onClick={() => setShowSettings(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-900"
            >
              <X size={24} />
            </button>
            
            <h2 className="text-2xl font-black mb-6 text-gray-900">Match Settings</h2>
            
            <form onSubmit={confirmCreateRoom} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Subject</label>
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" className={`py-2 rounded-lg font-bold border-2 ${matchSettings.subject === 'Verbal' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500'}`} onClick={() => setMatchSettings({...matchSettings, subject: 'Verbal'})}>
                    Reading & Writing
                  </button>
                  <button type="button" disabled className="py-2 rounded-lg font-bold border-2 border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed flex items-center justify-center gap-1">
                    Math <span className="text-[10px] bg-gray-200 px-1.5 py-0.5 rounded text-gray-500">SOON</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Domain</label>
                <select 
                  className="w-full border-2 border-gray-300 rounded-lg px-3 py-2.5 outline-none focus:border-blue-500 font-medium"
                  value={matchSettings.domain}
                  onChange={(e) => setMatchSettings({...matchSettings, domain: e.target.value})}
                >
                  <option value="All">All Domains</option>
                  <option value="Craft and Structure">Craft and Structure</option>
                  <option value="Information and Ideas">Information and Ideas</option>
                  <option value="Standard English Conventions">Standard English Conventions</option>
                  <option value="Expression of Ideas">Expression of Ideas</option>
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Difficulty</label>
                  <select 
                    className="w-full border-2 border-gray-300 rounded-lg px-3 py-2.5 outline-none focus:border-blue-500 font-medium"
                    value={matchSettings.difficulty}
                    onChange={(e) => setMatchSettings({...matchSettings, difficulty: e.target.value})}
                  >
                    <option value="All">Mixed</option>
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Questions</label>
                  <select 
                    className="w-full border-2 border-gray-300 rounded-lg px-3 py-2.5 outline-none focus:border-blue-500 font-medium"
                    value={matchSettings.questionCount}
                    onChange={(e) => setMatchSettings({...matchSettings, questionCount: Number(e.target.value)})}
                  >
                    <option value={10}>10 Questions</option>
                    <option value={15}>15 Questions</option>
                    <option value={20}>20 Questions</option>
                    <option value={27}>27 Questions</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Time Limit</label>
                <select 
                  className="w-full border-2 border-gray-300 rounded-lg px-3 py-2.5 outline-none focus:border-blue-500 font-medium"
                  value={matchSettings.timeLimit}
                  onChange={(e) => setMatchSettings({...matchSettings, timeLimit: Number(e.target.value)})}
                >
                  <option value={10}>10 Minutes</option>
                  <option value={15}>15 Minutes</option>
                  <option value={20}>20 Minutes</option>
                  <option value={32}>32 Minutes</option>
                </select>
              </div>

              <div className="pt-4">
                <button type="submit" className="w-full bg-blue-600 text-white font-bold text-lg py-3 rounded-xl hover:bg-blue-700 transition shadow-lg">
                  Generate Invite Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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
