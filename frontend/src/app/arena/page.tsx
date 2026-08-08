'use client';

import React, { useState, useEffect, useRef, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import { Bookmark, ChevronDown, ChevronUp, MoreVertical, Highlighter, CircleSlash, Calculator, X, CheckCircle2 } from 'lucide-react';
import io from 'socket.io-client';
import ImageWithCanvas, { Stroke } from './ImageWithCanvas';

let socket: any;

// Khai báo global interface cho Desmos
declare global {
  interface Window {
    Desmos: any;
  }
}



function ArenaContent() {
  const searchParams = useSearchParams();
  const roomCode = searchParams.get('room');

  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  
  // State: Answers and Eliminations (Dictionary keyed by question index)
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [eliminations, setEliminations] = useState<Record<number, string[]>>({});
  const [bookmarks, setBookmarks] = useState<Record<number, boolean>>({});

  // Opponent state
  const [opponentAnswers, setOpponentAnswers] = useState<Record<number, boolean>>({});
  const [players, setPlayers] = useState<any[]>([]);

  // Timer State
  const [timeLeft, setTimeLeft] = useState(30 * 60); // 30 minutes in seconds
  const [timerHidden, setTimerHidden] = useState(false);

  // Notes State
  const [notesOpen, setNotesOpen] = useState(false);
  const [notesText, setNotesText] = useState("");
  const [isStarted, setIsStarted] = useState(false);
  const [matchMode, setMatchMode] = useState('1v1');
  const [showReviewMap, setShowReviewMap] = useState(false);

  // Calculator State
  const [calcOpen, setCalcOpen] = useState(false);
  const calcRef = useRef<HTMLDivElement>(null);
  const calcInstanceRef = useRef<any>(null);

  // Text Selection / Highlight State
  const [annotations, setAnnotations] = useState<Record<string, Stroke[]>>({});
  const [isDrawingMode, setIsDrawingMode] = useState(false);

  // Post-match states
  const [isFinished, setIsFinished] = useState(false);
  const [isOpponentFinished, setIsOpponentFinished] = useState(false);
  const [matchResults, setMatchResults] = useState<any>(null);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [leftPaneWidth, setLeftPaneWidth] = useState(50);
  const [isResizing, setIsResizing] = useState(false);

  // ...
  const [explanationError, setExplanationError] = useState(false);
  const [selectionMenu, setSelectionMenu] = useState<{x: number, y: number, range: Range} | null>(null);

  useEffect(() => {
    setImageError(false);
    setExplanationError(false);
  }, [currentQuestionIdx]);
  const { width, height } = useWindowSize();


  // Timer effect
  useEffect(() => {
    if (isFinished || isReviewMode) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          if (!isFinished) {
            if (socket) socket.emit('finishMatch', { roomCode, answers });
            setIsFinished(true);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isFinished, isReviewMode, roomCode, answers]);

  // Calculator effect
  useEffect(() => {
    if (calcOpen && calcRef.current && window.Desmos) {
      if (!calcInstanceRef.current) {
        calcInstanceRef.current = window.Desmos.GraphingCalculator(calcRef.current, {
          keypad: true,
          expressions: true,
          settingsMenu: false,
          zoomButtons: true,
          expressionsTopbar: true
        });
      }
    }
  }, [calcOpen]);

  // Handle Pane Resizing
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    const newWidth = (e.clientX / window.innerWidth) * 100;
    if (newWidth > 20 && newWidth < 80) {
      setLeftPaneWidth(newWidth);
    }
  }, [isResizing]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      // add a class to body to prevent text selection while dragging
      document.body.classList.add('select-none', 'cursor-col-resize');
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.classList.remove('select-none', 'cursor-col-resize');
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.classList.remove('select-none', 'cursor-col-resize');
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  // Socket effect
  useEffect(() => {
    const savedName = localStorage.getItem('sat_nickname') || 'Player';

    if (roomCode) {
      socket = io(process.env.NEXT_PUBLIC_BACKEND_URL || 'https://sat-1v1.onrender.com');
      socket.emit('joinRoom', { 
        roomCode, 
        user: { name: savedName, image: null } 
      });

      socket.on('playerJoined', (data: { players: any[] }) => {
        setPlayers(data.players);
      });

      socket.on('opponentProgress', (data: { questionIdx: number, isCorrect: boolean }) => {
        setOpponentAnswers(prev => ({ ...prev, [data.questionIdx]: true }));
      });

      
      socket.on('opponentFinished', () => {
        setIsOpponentFinished(true);
      });

      socket.on('matchEnded', (data: { results: any[] }) => {
        setMatchResults(data.results);
      });

      socket.on('matchStarted', (data: { questions: any[], timeLimit?: number, mode?: string }) => {
        setQuestions(data.questions);
        if (data.mode) {
          setMatchMode(data.mode);
        }
        if (data.timeLimit) {
          setTimeLeft(data.timeLimit * 60);
        }
      });
    }

    return () => {
      if (socket) socket.disconnect();
    };
  }, [roomCode]);

  // Ẩn menu khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (selectionMenu) setSelectionMenu(null);
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, [selectionMenu]);

  if (!questions || questions.length === 0) {
    return <div className="min-h-screen flex items-center justify-center font-bold text-gray-500">Loading Question Bank...</div>;
  }

  const currentQuestion = questions[currentQuestionIdx];
  const selectedOption = answers[currentQuestionIdx] || null;
  const eliminated = eliminations[currentQuestionIdx] || [];
  const isBookmarked = bookmarks[currentQuestionIdx] || false;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleSelectOption = (label: string) => {
    if (eliminated.includes(label)) return;
    setAnswers({ ...answers, [currentQuestionIdx]: label });
    
    if (socket && roomCode) {
      socket.emit('submitAnswer', {
        roomCode,
        questionIdx: currentQuestionIdx,
        isCorrect: true // Mock logic, ideally check against correct answer
      });
    }
  };

  const toggleEliminate = (label: string) => {
    if (isReviewMode) return;
    const currentEliminated = [...eliminated];
    if (currentEliminated.includes(label)) {
      setEliminations({ ...eliminations, [currentQuestionIdx]: currentEliminated.filter(e => e !== label) });
    } else {
      setEliminations({ ...eliminations, [currentQuestionIdx]: [...currentEliminated, label] });
      // If the eliminated option was selected, unselect it
      if (selectedOption === label) {
        setAnswers({ ...answers, [currentQuestionIdx]: '' });
      }
    }
  };

  const formatPassage = (text: string) => {
    if (!text) return '';
    let formatted = text;
    // Break paragraphs for Text 1 and Text 2
    if (formatted.includes('Text 1') && formatted.includes('Text 2')) {
      formatted = formatted.replace(/Text 1/g, '<br/><strong>Text 1</strong><br/>');
      formatted = formatted.replace(/Text 2/g, '<br/><br/><strong>Text 2</strong><br/>');
    }
    // Highlight "Connections" if it exists
    formatted = formatted.replace(/^Connections/, '<strong>Connections</strong>');
    // Ensure regular newlines are rendered
    formatted = formatted.replace(/\n/g, '<br/>');
    // Clean up leading BRs
    formatted = formatted.replace(/^(<br\/>)+/, '');
    return formatted;
  };

  // Deprecated text selection logic - removed
  const applyHighlightAndNote = () => {};

  const me = players.find(p => p.id === socket?.id);
  const opponent = matchMode === 'practice' ? null : players.find(p => p.id !== socket?.id);

  if (isReviewMode) {
    // Review mode content...
  }

  return (
    <div className="flex flex-col h-screen w-full bg-white overflow-hidden text-black font-sans selection:bg-blue-200">
      
      {/* ProgressBar Area (New) */}
      <div className="bg-gray-100 flex items-center justify-between px-8 py-1.5 border-b border-gray-300 text-xs font-semibold">
        <div className="flex items-center gap-2 w-1/3">
           <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 text-white flex items-center justify-center font-bold text-[10px]">
             {me?.user?.name?.charAt(0).toUpperCase() || 'Y'}
           </div>
           <span className="w-auto truncate max-w-[100px]">{me?.user?.name || 'You'}</span>
           <div className="flex-1 flex gap-1 h-2 ml-2">
             {questions.map((_, i) => (
                <div key={i} className={`flex-1 rounded-sm ${answers[i] ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
             ))}
           </div>
           <span className="w-8 text-right">{Object.keys(answers).length}/{questions.length}</span>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center">
          <h2 className="text-xl font-black text-gray-900 tracking-tight">
            {matchMode === 'practice' ? 'PRACTICE MODE' : '1V1 ARENA'}
          </h2>
          <div className="text-sm font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-full mt-1 border border-gray-200 shadow-inner">
            Room: {roomCode}
          </div>
        </div>
        
        <div className={`flex items-center gap-2 w-1/3 flex-row-reverse ${matchMode === 'practice' ? 'opacity-0 pointer-events-none' : ''}`}>
           <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-red-500 to-orange-500 text-white flex items-center justify-center font-bold text-[10px]">
             {opponent?.user?.name?.charAt(0).toUpperCase() || 'O'}
           </div>
           <span className="w-auto text-right truncate max-w-[100px]">{opponent?.user?.name || 'Opponent'}</span>
           <div className="flex-1 flex gap-1 h-2 flex-row-reverse mr-2">
             {questions.map((_, i) => (
                <div key={i} className={`flex-1 rounded-sm ${opponentAnswers[i] ? 'bg-red-500' : 'bg-gray-300'}`}></div>
             ))}
           </div>
           <span className="w-8 text-left">{Object.keys(opponentAnswers).length}/{questions.length}</span>
        </div>
      </div>

      {/* 1. Header (White) */}
      <header className="flex justify-between items-center px-6 py-2 bg-white border-b border-gray-200">
        <div className="w-1/3">
          <h1 className="font-bold text-lg">Section 1: Reading and Writing</h1>
          <button className="text-sm text-gray-700 flex items-center hover:text-black mt-1">
            Directions <ChevronDown size={16} className="ml-1" />
          </button>
        </div>

        <div className="w-1/3 flex flex-col items-center justify-center">
          <div className="font-bold text-xl tracking-wider mb-1">
            {timerHidden ? (
               <span className="text-gray-400 border border-gray-300 rounded px-3 py-1 cursor-pointer" onClick={() => setTimerHidden(false)}>
                 Show Timer
               </span>
            ) : formatTime(timeLeft)}
          </div>
          {!timerHidden && (
            <button 
              onClick={() => setTimerHidden(true)}
              className="text-xs font-semibold px-3 py-0.5 rounded-full border border-gray-400 hover:bg-gray-100 transition"
            >
              Hide
            </button>
          )}
        </div>

        <div className="w-1/3 flex justify-end items-center gap-6 relative">
          <button 
            onClick={() => setCalcOpen(!calcOpen)}
            className={`flex flex-col items-center hover:text-black ${calcOpen ? 'text-blue-600' : 'text-gray-600'}`}
          >
            <Calculator size={20} className="mb-1" />
            <span className="text-[10px] font-semibold uppercase">Calculator</span>
          </button>
          <button 
            className={`flex flex-col items-center px-2 py-1 rounded transition-colors ${isDrawingMode ? 'bg-blue-100 text-blue-700 shadow-sm' : 'text-gray-600 hover:text-blue-600'}`}
            onClick={() => setIsDrawingMode(!isDrawingMode)}
          >
            <Highlighter size={20} className="mb-1" />
            <span className="text-[10px] font-semibold uppercase">Highlights & Notes</span>
          </button>
          <button className="flex flex-col items-center text-gray-600 hover:text-black">
            <MoreVertical size={20} className="mb-1" />
            <span className="text-[10px] font-semibold uppercase">More</span>
          </button>

          {/* Calculator Popup */}
          {calcOpen && (
            <div className="absolute top-12 right-24 bg-white border border-gray-300 shadow-2xl rounded-md z-50 overflow-hidden flex flex-col" style={{ width: 600, height: 450 }}>
               <div className="bg-gray-100 px-3 py-2 flex justify-between items-center border-b border-gray-300 cursor-move">
                  <span className="font-bold text-sm text-gray-700">Desmos Calculator</span>
                  <button onClick={() => setCalcOpen(false)} className="text-gray-500 hover:text-black">
                    <X size={16} />
                  </button>
               </div>
               <div ref={calcRef} className="w-full flex-1"></div>
            </div>
          )}

          {/* Notes Popup */}
          {notesOpen && (
            <div className="absolute top-12 right-12 w-64 bg-yellow-100 border border-yellow-300 shadow-lg rounded-md p-3 z-50">
               <textarea 
                  className="w-full bg-transparent resize-none outline-none text-sm h-32 text-gray-800"
                  placeholder="Type your notes here..."
                  value={notesText}
                  onChange={(e) => setNotesText(e.target.value)}
                  autoFocus
               ></textarea>
            </div>
          )}
        </div>
      </header>

      {/* 2. Blue Strip */}
      <div className="bg-[#20275c] text-white text-center py-1.5 text-xs font-bold uppercase tracking-[0.2em]">
        THIS IS A TEST PREVIEW
      </div>

      {/* 3. Main Content Split */}
      <main className="flex-1 flex overflow-hidden relative">
        
        {/* Floating Selection Menu (Annotate Tooltip) */}
        {selectionMenu && (
          <div 
            className="fixed z-50 bg-black text-white px-3 py-1.5 rounded shadow-lg text-sm font-semibold cursor-pointer hover:bg-gray-800 transition transform -translate-x-1/2 flex items-center gap-2"
            style={{ left: selectionMenu.x, top: selectionMenu.y }}
            onMouseDown={(e) => { e.stopPropagation(); applyHighlightAndNote(); }}
          >
            <button 
            className={`flex flex-col items-center gap-1 transition-colors px-2 rounded ${isDrawingMode ? 'text-white bg-blue-600 shadow-sm' : 'text-gray-500 hover:text-blue-600'}`}
            onClick={() => setIsDrawingMode(!isDrawingMode)}
          >
            <Highlighter size={14} /> {isDrawingMode ? 'Drawing...' : 'Annotate'}
          </button>
            {/* Pointer triangle */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-black"></div>
          </div>
        )}

        {/* Left Column: Passage */}
        <div 
          className="p-10 overflow-auto border-r-2 border-gray-300 relative bg-white flex-shrink-0"
          style={{ width: `${leftPaneWidth}%` }}
        >
          {!imageError ? (
            <div className="block w-full min-h-full">
              <ImageWithCanvas 
                src={`${process.env.NEXT_PUBLIC_BACKEND_URL || 'https://sat-1v1.onrender.com'}/images/${currentQuestion.id}.png`}
                questionId={currentQuestion.id}
                annotations={annotations}
                setAnnotations={setAnnotations}
                isDrawingMode={isDrawingMode}
                onError={() => setImageError(true)}
              />
            </div>
          ) : (
            <div className="prose prose-sm max-w-none text-base leading-relaxed text-gray-800 font-serif">
              {currentQuestion.passage && <p className="mb-4" dangerouslySetInnerHTML={{ __html: currentQuestion.passage }}></p>}
              <p className="font-semibold text-black">{currentQuestion.question}</p>
            </div>
          )}
        </div>

        {/* Drag Handle */}
        <div 
          className="w-1.5 bg-gray-200 hover:bg-blue-500 cursor-col-resize transition-colors flex items-center justify-center relative z-10"
          onMouseDown={(e) => {
            e.preventDefault();
            setIsResizing(true);
          }}
        >
          <div className="flex gap-0.5 pointer-events-none">
            <div className="w-px h-8 bg-gray-400"></div>
            <div className="w-px h-8 bg-gray-400"></div>
          </div>
        </div>

        {/* Right Column: Question & Options */}
        <div 
          className="p-10 overflow-y-auto bg-gray-50/30 flex-1"
          style={{ width: `calc(${100 - leftPaneWidth}% - 6px)` }}
        >
          <div className="max-w-2xl mx-auto">
            
            {/* Question Header & Navigation */}
            <div className="flex justify-between items-center text-sm font-bold bg-white text-gray-800 px-4 py-3 shadow-md rounded-lg mb-6">
              <button className="flex items-center gap-2 font-bold px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-black transition-colors" disabled={currentQuestionIdx === 0} onClick={() => setCurrentQuestionIdx(prev => Math.max(0, prev - 1))}>
                <ChevronUp size={20} /> Back
              </button>
              
              <button 
                onClick={() => setBookmarks(prev => ({...prev, [currentQuestionIdx]: !prev[currentQuestionIdx]}))}
                className="flex items-center gap-2 font-bold px-4 py-2 hover:bg-gray-100 rounded-lg text-black transition-colors"
              >
                <Bookmark size={18} className={bookmarks[currentQuestionIdx] ? 'fill-black' : ''} />
                {bookmarks[currentQuestionIdx] ? 'Bookmarked' : 'Mark for Review'}
              </button>

              <button className="flex items-center gap-2 font-bold px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors shadow-sm" disabled={currentQuestionIdx === questions.length - 1} onClick={() => setCurrentQuestionIdx(prev => Math.min(questions.length - 1, prev + 1))}>
                Next <ChevronDown size={20} />
              </button>
            </div>

            <div className="font-bold flex items-center gap-2 mb-4">
              <span className="text-blue-600">Question {currentQuestionIdx + 1}</span>
              {bookmarks[currentQuestionIdx] && <Bookmark size={14} className="text-red-500 fill-red-500" />}
            </div>

            {/* Options */}
            <div className="space-y-4">
              {currentQuestion.options.map((text: string, idx: number) => {
                const label = String.fromCharCode(65 + idx); // A, B, C, D
                const isSelected = selectedOption === label;
                const isEliminated = eliminated.includes(label);
                
                const isCorrect = idx === currentQuestion.correctAnswer;
                const showAsCorrect = isReviewMode && isCorrect;
                const showAsWrong = isReviewMode && isSelected && !isCorrect;

                return (
                  <div key={label} className="flex items-center gap-4">
                    <button
                      onClick={() => !isReviewMode && handleSelectOption(label)}
                      disabled={isEliminated || isReviewMode}
                      className={`flex-1 flex items-center p-3 rounded-lg border-2 text-left transition-all font-serif
                        ${showAsCorrect ? 'border-green-500 bg-green-50 ring-1 ring-green-500' :
                          showAsWrong ? 'border-red-500 bg-red-50 ring-1 ring-red-500' :
                          isEliminated ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed' : 
                          isSelected ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600' : 'border-gray-300 hover:border-gray-400 bg-white'
                        }
                      `}
                    >
                      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold mr-4 flex-shrink-0
                        ${showAsCorrect ? 'border-green-500 bg-green-500 text-white' :
                          showAsWrong ? 'border-red-500 bg-red-500 text-white' :
                          isSelected ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-400 text-gray-600'}
                      `}>
                        {label}
                      </div>
                      <span className={`text-[17px] leading-relaxed ${isEliminated && !isReviewMode ? 'line-through text-gray-400' : 
                        isSelected ? 'text-blue-900 font-medium' : 'text-gray-700'
                      }`}>
                        {imageError ? text : `Option ${label}`}
                      </span>

                    </button>
                    
                    {/* Eliminate Toggle Button */}
                    <button 
                      onClick={() => toggleEliminate(label)}
                      disabled={isReviewMode}
                      className={`text-gray-400 hover:text-gray-700 p-1 group relative ${isReviewMode ? 'opacity-50 cursor-not-allowed' : ''}`}
                      title="Eliminate option"
                    >
                      <div className="absolute inset-0 flex items-center justify-center">
                         <span className={`text-xs font-bold ${isEliminated ? 'text-red-500' : ''}`}>{label}</span>
                      </div>
                      <CircleSlash size={28} strokeWidth={1.5} className={isEliminated ? 'text-red-500' : ''} />
                    </button>
                  </div>
                );
              })}
              
              {/* Review Explanation */}
              {isReviewMode && (
                <div className="mt-6 p-5 bg-blue-50 rounded-xl border border-blue-200 shadow-sm animate-in fade-in zoom-in-95 duration-300">
                  <h4 className="font-bold text-blue-900 flex items-center gap-2 mb-2">
                    <CheckCircle2 size={20} className="text-blue-600" /> Explanation
                  </h4>
                  <div className="text-blue-800 leading-relaxed text-sm">
                    {!explanationError ? (
                      <img 
                        src={`${process.env.NEXT_PUBLIC_BACKEND_URL || 'https://sat-1v1.onrender.com'}/explanations/${currentQuestion.id}.png`} 
                        alt="Explanation" 
                        className="max-w-full h-auto rounded border border-gray-200"
                        onError={() => setExplanationError(true)}
                      />
                    ) : (
                      <p>
                        {currentQuestion.explanation || 
                         `The correct answer is Option ${String.fromCharCode(65 + currentQuestion.correctAnswer)}. ` +
                         `Option ${String.fromCharCode(65 + currentQuestion.correctAnswer)} best satisfies the requirement of the question based on the provided text.`
                        }
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </main>

      {/* 4. Footer */}
      <footer className="flex justify-between items-center px-6 py-3 bg-[#f2f4f8] border-t border-gray-300">
        <div className="font-semibold text-gray-700 w-1/3">
          Duong Le Hoang
        </div>
        
        <div className="w-1/3 flex justify-center">
          <button className="bg-black text-white px-4 py-1.5 rounded flex items-center font-semibold text-sm hover:bg-gray-800">
            Question {currentQuestionIdx + 1} of {questions.length} <ChevronUp size={16} className="ml-2" />
          </button>
        </div>

        <div className="w-1/3 flex justify-end gap-3">
          <button 
            onClick={() => setCurrentQuestionIdx(prev => Math.max(0, prev - 1))}
            disabled={currentQuestionIdx === 0}
            className="px-6 py-1.5 font-bold text-blue-700 hover:bg-blue-100 disabled:text-gray-400 disabled:hover:bg-transparent rounded text-sm transition"
          >
            Back
          </button>
          {isReviewMode ? (
            <button 
              onClick={() => {
                 setMatchResults(null);
                 setIsReviewMode(false);
                 window.location.href = '/';
              }}
              className="px-6 py-1.5 font-bold bg-gray-800 text-white hover:bg-black rounded text-sm transition shadow-sm ml-2"
            >
              Exit Review
            </button>
          ) : currentQuestionIdx === questions.length - 1 ? (
            <button 
              onClick={() => {
                if (confirm("Are you sure you want to submit your test?")) {
                  setIsFinished(true);
                  if (socket && roomCode) socket.emit('finishMatch', { roomCode, answers });
                }
              }}
              className="px-6 py-1.5 font-bold bg-red-600 text-white hover:bg-red-700 rounded text-sm transition shadow-sm"
            >
              Submit Test
            </button>
          ) : (
            <button 
              onClick={() => setCurrentQuestionIdx(prev => Math.min(questions.length - 1, prev + 1))}
              disabled={currentQuestionIdx === questions.length - 1}
              className="px-6 py-1.5 font-bold bg-[#1d4ed8] text-white hover:bg-blue-700 disabled:bg-gray-400 rounded text-sm transition shadow-sm"
            >
              Next
            </button>
          )}
        </div>
      </footer>

      {/* Result Modal & Waiting Screen */}
      {isFinished && !isReviewMode && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          {!matchResults ? (
            <div className="bg-white p-10 rounded-2xl shadow-2xl text-center max-w-sm w-full animate-in zoom-in">
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
              <h2 className="text-2xl font-black mb-2 text-gray-900">Test Submitted!</h2>
              <p className="text-gray-500 font-medium">
                {matchMode === 'practice' ? 'Calculating your score...' : (isOpponentFinished ? "Opponent has also finished. Waiting for results..." : "Waiting for your opponent to finish...")}
              </p>
              
              {isOpponentFinished && matchMode !== 'practice' && (
                <div className="bg-green-100 text-green-700 text-sm font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 mt-4">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  Opponent has finished
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-lg relative animate-in zoom-in fade-in duration-300 text-center">
              {(() => {
                // Determine if current user won (highest score and not a tie unless both max)
                const sorted = [...matchResults].sort((a: any,b: any) => b.score - a.score);
                const isWinner = sorted[0].id === socket?.id;
                if (isWinner) {
                  return <Confetti width={width} height={height} recycle={false} numberOfPieces={500} />;
                }
                return null;
              })()}
              <h2 className="text-4xl font-black mb-6 text-gray-900">Match Results</h2>
              <div className="space-y-4 mb-8">
                {matchResults.sort((a: any, b: any) => b.score - a.score).map((p: any, idx: number) => (
                  <div key={p.id} className={`flex justify-between items-center p-4 rounded-xl border-2 ${p.id === socket?.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-black text-gray-400">#{idx + 1}</span>
                      <span className="text-xl font-bold text-gray-900">{p.name} {p.id === socket?.id && '(You)'}</span>
                    </div>
                    <span className="text-2xl font-black text-blue-600">{p.score} <span className="text-sm text-gray-500">/ {questions.length}</span></span>
                  </div>
                ))}
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={() => setIsReviewMode(true)}
                  className="flex-1 bg-gray-100 text-gray-900 px-4 py-3 rounded-xl font-bold hover:bg-gray-200 transition"
                >
                  Review Answers
                </button>
                <button 
                  onClick={() => window.location.href = '/'}
                  className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg"
                >
                  Return to Lobby
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ArenaPage() {
  return (
    <Suspense fallback={<div>Loading Arena...</div>}>
      <ArenaContent />
    </Suspense>
  );
}
