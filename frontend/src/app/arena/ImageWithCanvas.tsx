import React, { useRef, useEffect, useState } from 'react';
import { MessageSquare } from 'lucide-react';

export type Point = { x: number, y: number };
export type Stroke = { points: Point[], note?: string };

interface ImageWithCanvasProps {
  src: string;
  questionId: string;
  annotations: Record<string, Stroke[]>;
  setAnnotations: React.Dispatch<React.SetStateAction<Record<string, Stroke[]>>>;
  isDrawingMode: boolean;
  onError: () => void;
}

export default function ImageWithCanvas({ src, questionId, annotations, setAnnotations, isDrawingMode, onError }: ImageWithCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<Point[]>([]);
  const [showNotePopup, setShowNotePopup] = useState(false);
  const [noteData, setNoteData] = useState<{strokeIdx: number, x: number, y: number} | null>(null);
  const [noteText, setNoteText] = useState("");

  const strokes = annotations[questionId] || [];

  // Redraw canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 16;

    // Draw saved strokes
    strokes.forEach(stroke => {
      if (stroke.points.length === 0) return;
      ctx.beginPath();
      ctx.strokeStyle = stroke.note ? 'rgba(56, 189, 248, 0.4)' : 'rgba(253, 224, 71, 0.4)'; // Blue if noted, Yellow otherwise
      const first = stroke.points[0];
      ctx.moveTo(first.x * canvas.width, first.y * canvas.height);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x * canvas.width, stroke.points[i].y * canvas.height);
      }
      ctx.stroke();
    });

    // Draw current stroke
    if (currentStroke.length > 0) {
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(253, 224, 71, 0.4)';
      const first = currentStroke[0];
      ctx.moveTo(first.x * canvas.width, first.y * canvas.height);
      for (let i = 1; i < currentStroke.length; i++) {
        ctx.lineTo(currentStroke[i].x * canvas.width, currentStroke[i].y * canvas.height);
      }
      ctx.stroke();
    }
  }, [strokes, currentStroke, src]);

  // Adjust canvas size
  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;
    const observer = new ResizeObserver(() => {
      if (containerRef.current && canvasRef.current) {
        canvasRef.current.width = containerRef.current.clientWidth;
        canvasRef.current.height = containerRef.current.clientHeight;
        // Trigger a re-render to draw strokes at new size
        setCurrentStroke([...currentStroke]); 
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const getCoordinates = (e: React.PointerEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / canvasRef.current!.width,
      y: (e.clientY - rect.top) / canvasRef.current!.height
    };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (!isDrawingMode || !canvasRef.current) return;
    setIsDrawing(true);
    setCurrentStroke([getCoordinates(e)]);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDrawing || !isDrawingMode || !canvasRef.current) return;
    setCurrentStroke(prev => [...prev, getCoordinates(e)]);
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!isDrawing || !isDrawingMode) return;
    setIsDrawing(false);
    
    if (currentStroke.length > 2) {
      const newStrokes = [...strokes, { points: currentStroke }];
      setAnnotations(prev => ({ ...prev, [questionId]: newStrokes }));
      
      const rect = canvasRef.current!.getBoundingClientRect();
      setNoteData({
        strokeIdx: newStrokes.length - 1,
        x: e.clientX,
        y: e.clientY
      });
      setShowNotePopup(true);
    }
    setCurrentStroke([]);
  };

  const handleSaveNote = () => {
    if (noteData && noteText.trim()) {
      const updatedStrokes = [...strokes];
      updatedStrokes[noteData.strokeIdx].note = noteText;
      setAnnotations(prev => ({ ...prev, [questionId]: updatedStrokes }));
    }
    setShowNotePopup(false);
    setNoteText("");
    setNoteData(null);
  };

  return (
    <div ref={containerRef} className="relative inline-block w-full">
      <img 
        src={src} 
        alt="Question text" 
        className="max-w-full h-auto rounded border border-gray-200 select-none"
        onError={onError}
        draggable={false}
      />
      <canvas
        ref={canvasRef}
        className={`absolute top-0 left-0 w-full h-full ${isDrawingMode ? 'cursor-crosshair' : 'pointer-events-none'}`}
        style={{ touchAction: 'none' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      />
      
      {/* Markers for Notes */}
      {!isDrawingMode && strokes.map((stroke, idx) => {
        if (!stroke.note) return null;
        const first = stroke.points[0];
        return (
          <div 
            key={idx}
            className="absolute bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center cursor-pointer shadow-md text-xs hover:scale-110 transition-transform -translate-x-1/2 -translate-y-1/2 pointer-events-auto"
            style={{
              left: `${first.x * 100}%`,
              top: `${first.y * 100}%`
            }}
            title={stroke.note}
            onClick={() => alert(`Your Note: ${stroke.note}`)}
          >
            <MessageSquare size={14} />
          </div>
        );
      })}

      {/* Note Input Popup */}
      {showNotePopup && noteData && (
        <div 
          className="fixed z-50 bg-white p-3 rounded-lg shadow-xl border border-gray-200 animate-in fade-in zoom-in duration-200"
          style={{ 
            top: `${noteData.y}px`, 
            left: `${noteData.x}px`,
            transform: 'translate(-50%, -100%)'
          }}
        >
          <div className="flex flex-col gap-2">
            <textarea
              autoFocus
              className="w-64 h-24 p-2 text-sm border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Add a note to this highlight... (optional)"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSaveNote();
                }
              }}
            />
            <div className="flex justify-end gap-2">
              <button 
                onClick={() => { setShowNotePopup(false); setNoteData(null); }}
                className="px-3 py-1 text-sm text-gray-500 hover:bg-gray-100 rounded"
              >
                Skip
              </button>
              <button 
                onClick={handleSaveNote}
                className="px-3 py-1 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded"
              >
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
