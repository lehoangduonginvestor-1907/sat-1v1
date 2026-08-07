'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Bookmark, ChevronDown, ChevronUp, MoreVertical, Highlighter, CircleSlash, Calculator, X, User } from 'lucide-react';
import io from 'socket.io-client';

let socket: any;

// Khai báo global interface cho Desmos
declare global {
  interface Window {
    Desmos: any;
  }
}

// Mock Data
const MOCK_QUESTIONS = [
  {
    id: 'q1',
    passage: "In recommending Bao Phi's collection <span class='italic'>Sông I Sing</span>, a librarian noted that pieces by the spoken-word poet don't lose their <span class='inline-block w-16 border-b border-black'></span> nature when printed: the language has the same pleasant musical quality on the page as it does when performed by Phi.",
    question: "Which choice completes the text with the most logical and precise word or phrase?",
    options: ['scholarly', 'melodic', 'jarring', 'personal']
  },
  {
    id: 'q2',
    passage: "The following text is from Herman Melville's 1854 novel <span class='italic'>The Lightning-rod Man</span>.\n\nThe stranger still stood in the exact middle of the cottage, where he had first planted himself. <u class='font-semibold'>His singularity impelled a closer scrutiny.</u> A lean, gloomy figure. Hair dark and lank, mattedly streaked over his brow. His sunken pitfalls of eyes were ringed by indigo halos, and played with an innocuous sort of lightning...",
    question: "Which choice best states the function of the underlined sentence in the overall structure of the text?",
    options: [
      "It elaborates on the previous sentence's description of the character.",
      "It introduces the setting that is described in the sentences that follow.",
      "It establishes a contrast with the description in the previous sentence.",
      "It sets up the character description presented in the sentences that follow."
    ]
  },
  {
    id: 'q3',
    passage: "A researcher is studying the effects of temperature on the growth rate of a specific type of algae. They notice that the algae grows fastest at 25°C, but its growth rate drops significantly when the temperature exceeds 30°C.",
    question: "Based on the text, what can be reasonably inferred about the algae's growth?",
    options: [
      "It cannot survive at temperatures below 20°C.",
      "It thrives best in a warm, but not excessively hot, environment.",
      "Its growth rate is entirely dependent on sunlight rather than temperature.",
      "It requires a constant temperature of exactly 25°C to survive."
    ]
  }
];

function ArenaContent() {
  const searchParams = useSearchParams();
  const roomCode = searchParams.get('room');

  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  
  // State: Answers and Eliminations (Dictionary keyed by question index)
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [eliminations, setEliminations] = useState<Record<number, string[]>>({});
  const [bookmarks, setBookmarks] = useState<Record<number, boolean>>({});

  // Opponent state
  const [opponentAnswers, setOpponentAnswers] = useState<Record<number, boolean>>({});

  // Timer State
  const [timeLeft, setTimeLeft] = useState(30 * 60); // 30 minutes in seconds
  const [timerHidden, setTimerHidden] = useState(false);

  // Notes State
  const [notesOpen, setNotesOpen] = useState(false);
  const [notesText, setNotesText] = useState("");

  // Calculator State
  const [calcOpen, setCalcOpen] = useState(false);
  const calcRef = useRef<HTMLDivElement>(null);
  const calcInstanceRef = useRef<any>(null);

  // Text Selection / Highlight State
  const [selectionMenu, setSelectionMenu] = useState<{ x: number, y: number, range: Range | null } | null>(null);

  const q = MOCK_QUESTIONS[currentQuestionIdx];
  const selectedOption = answers[currentQuestionIdx] || null;
  const eliminated = eliminations[currentQuestionIdx] || [];
  const isBookmarked = bookmarks[currentQuestionIdx] || false;

  // Timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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

  // Socket effect
  useEffect(() => {
    if (roomCode) {
      socket = io(process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001');
      socket.emit('joinRoom', roomCode);

      socket.on('opponentProgress', (data: { questionIdx: number, isCorrect: boolean }) => {
        setOpponentAnswers(prev => ({ ...prev, [data.questionIdx]: true }));
      });
    }

    return () => {
      if (socket) socket.disconnect();
    };
  }, [roomCode]);

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

  const toggleBookmark = () => {
    setBookmarks({ ...bookmarks, [currentQuestionIdx]: !isBookmarked });
  };

  // Handle Text Selection for Highlight
  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 0) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setSelectionMenu({
        x: rect.left + rect.width / 2,
        y: rect.top - 40,
        range: range
      });
    } else {
      setSelectionMenu(null);
    }
  };

  const applyHighlightAndNote = () => {
    if (selectionMenu?.range) {
      try {
        const span = document.createElement('span');
        span.className = 'bg-yellow-300 border-b-2 border-yellow-500 cursor-pointer';
        span.title = "Click to remove highlight";
        // Gỡ highlight khi click vào
        span.addEventListener('click', function() {
          if (this.parentNode) {
            this.outerHTML = this.innerHTML;
          }
        });

        // Note: surroundContents might fail if selection crosses elements, 
        // but works well for basic text selection
        selectionMenu.range.surroundContents(span);
        
        // Clear selection menu and open notes
        window.getSelection()?.removeAllRanges();
        setSelectionMenu(null);
        setNotesOpen(true);
      } catch (e) {
        console.error("Highlight failed (likely crossed HTML elements):", e);
        setSelectionMenu(null);
      }
    }
  };

  // Ẩn menu khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (selectionMenu) setSelectionMenu(null);
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, [selectionMenu]);

  return (
    <div className="flex flex-col h-screen w-full bg-white overflow-hidden text-black font-sans selection:bg-blue-200">
      
      {/* ProgressBar Area (New) */}
      <div className="bg-gray-100 flex items-center justify-between px-8 py-1.5 border-b border-gray-300 text-xs font-semibold">
        <div className="flex items-center gap-2 w-1/3">
           <User size={14} className="text-blue-600" />
           <span className="w-16">You:</span>
           <div className="flex-1 flex gap-1 h-2">
             {MOCK_QUESTIONS.map((_, i) => (
                <div key={i} className={`flex-1 rounded-sm ${answers[i] ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
             ))}
           </div>
           <span className="w-8 text-right">{Object.keys(answers).length}/{MOCK_QUESTIONS.length}</span>
        </div>
        <div className="text-gray-400 font-bold tracking-widest text-[10px]">1V1 ARENA</div>
        <div className="flex items-center gap-2 w-1/3 flex-row-reverse">
           <User size={14} className="text-red-500" />
           <span className="w-16 text-right">Opponent:</span>
           <div className="flex-1 flex gap-1 h-2 flex-row-reverse">
             {MOCK_QUESTIONS.map((_, i) => (
                <div key={i} className={`flex-1 rounded-sm ${opponentAnswers[i] ? 'bg-red-500' : 'bg-gray-300'}`}></div>
             ))}
           </div>
           <span className="w-8 text-left">{Object.keys(opponentAnswers).length}/{MOCK_QUESTIONS.length}</span>
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
            onClick={() => setNotesOpen(!notesOpen)}
            className={`flex flex-col items-center hover:text-black ${notesOpen ? 'text-blue-600' : 'text-gray-600'}`}
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
            <Highlighter size={14} /> Annotate
            {/* Pointer triangle */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-black"></div>
          </div>
        )}

        {/* Left Column: Passage */}
        <div className="w-1/2 p-10 overflow-y-auto border-r-2 border-gray-300 relative" onMouseUp={handleTextSelection}>
          <div className="max-w-2xl mx-auto text-[17px] leading-relaxed text-gray-900" 
               dangerouslySetInnerHTML={{ __html: q.passage.replace(/\n/g, '<br/>') }}>
          </div>
          
          {/* Resize handle visual */}
          <div className="absolute top-1/2 right-[-10px] w-5 h-8 bg-gray-600 text-white flex items-center justify-center rounded-sm cursor-col-resize z-10 transform -translate-y-1/2">
            <div className="flex gap-0.5">
              <div className="w-0.5 h-3 bg-white"></div>
              <div className="w-0.5 h-3 bg-white"></div>
            </div>
          </div>
        </div>

        {/* Right Column: Question & Options */}
        <div className="w-1/2 p-10 overflow-y-auto bg-gray-50/30">
          <div className="max-w-2xl mx-auto">
            
            {/* Question Header */}
            <div className="flex justify-between items-center mb-4 border-b-2 border-black border-dashed pb-2">
              <div className="flex items-center gap-3">
                <div className="bg-black text-white font-bold w-6 h-6 flex items-center justify-center text-sm">
                  {currentQuestionIdx + 1}
                </div>
                <button 
                  onClick={toggleBookmark}
                  className={`flex items-center text-sm font-semibold hover:text-black group transition ${isBookmarked ? 'text-black' : 'text-gray-600'}`}
                >
                  <Bookmark size={16} fill={isBookmarked ? 'black' : 'none'} className={`mr-1.5 ${isBookmarked ? 'text-black' : 'text-gray-400 group-hover:text-black'}`} />
                  Mark for Review
                </button>
              </div>
              <div className="bg-blue-600 text-white rounded-sm px-1.5 py-0.5 text-xs font-bold line-through cursor-pointer select-none">
                ABC
              </div>
            </div>

            {/* Question Text */}
            <p className="text-[17px] mb-6 text-gray-900 font-medium">
              {q.question}
            </p>

            {/* Options */}
            <div className="space-y-4">
              {q.options.map((text, idx) => {
                const label = String.fromCharCode(65 + idx); // A, B, C, D
                const isSelected = selectedOption === label;
                const isEliminated = eliminated.includes(label);

                return (
                  <div key={label} className="flex items-center gap-4">
                    <button
                      onClick={() => handleSelectOption(label)}
                      disabled={isEliminated}
                      className={`flex-1 flex items-center p-3 rounded-lg border-2 text-left transition-all
                        ${isEliminated ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed' : 
                          isSelected ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600' : 'border-gray-300 hover:border-gray-400 bg-white'
                        }
                      `}
                    >
                      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold mr-4 flex-shrink-0
                        ${isSelected ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-400 text-gray-600'}
                      `}>
                        {label}
                      </div>
                      <span className={`text-[17px] leading-relaxed ${isEliminated ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                        {text}
                      </span>
                    </button>
                    
                    {/* Eliminate Toggle Button */}
                    <button 
                      onClick={() => toggleEliminate(label)}
                      className="text-gray-400 hover:text-gray-700 p-1 group relative"
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
            Question {currentQuestionIdx + 1} of {MOCK_QUESTIONS.length} <ChevronUp size={16} className="ml-2" />
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
          <button 
            onClick={() => setCurrentQuestionIdx(prev => Math.min(MOCK_QUESTIONS.length - 1, prev + 1))}
            disabled={currentQuestionIdx === MOCK_QUESTIONS.length - 1}
            className="px-6 py-1.5 font-bold bg-[#1d4ed8] text-white hover:bg-blue-700 disabled:bg-gray-400 rounded text-sm transition shadow-sm"
          >
            Next
          </button>
        </div>
      </footer>
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
