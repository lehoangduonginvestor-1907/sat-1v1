import React from 'react';

// Định dạng trong dòng của bài học: **đậm**, *nghiêng*, [[gạch chân]] (phần câu đang xét, như trên Bluebook),
// ~~gạch bỏ~~, ____ (ô trống)
const TOKEN = /(\*\*.+?\*\*|\[\[.+?\]\]|~~.+?~~|\*[^*\s][^*]*?\*|_{4,})/g;

export function Inline({ text }: { text: string }) {
  const parts = text.split(TOKEN).filter(Boolean);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) return <strong key={i}><Inline text={part.slice(2, -2)} /></strong>;
        if (part.startsWith('[[') && part.endsWith(']]')) return <u key={i} className="decoration-[1.5px] underline-offset-[3px]"><Inline text={part.slice(2, -2)} /></u>;
        if (part.startsWith('~~') && part.endsWith('~~')) return <s key={i} className="text-[var(--bb-muted)]"><Inline text={part.slice(2, -2)} /></s>;
        if (/^_{4,}$/.test(part)) return <span key={i} className="lr-blank" aria-label="blank" />;
        if (part.length > 2 && part.startsWith('*') && part.endsWith('*')) return <em key={i}><Inline text={part.slice(1, -1)} /></em>;
        return <React.Fragment key={i}>{part}</React.Fragment>;
      })}
    </>
  );
}
