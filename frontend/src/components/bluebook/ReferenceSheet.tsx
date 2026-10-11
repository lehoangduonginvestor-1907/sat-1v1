'use client';

import React from 'react';
import DraggablePanel from './DraggablePanel';

const stroke = { fill: 'none', stroke: '#1e1e1e', strokeWidth: 1.4 };
const label = { fontFamily: 'var(--bb-serif)', fontStyle: 'italic' as const, fontSize: 12 };

function Figure({ children, formula, wide }: { children: React.ReactNode; formula: React.ReactNode; wide?: boolean }) {
  return (
    <figure className={`flex flex-col items-center gap-2 m-0 ${wide ? 'col-span-2' : ''}`}>
      <svg width={wide ? 220 : 110} height="80" viewBox={`0 0 ${wide ? 220 : 110} 80`}>{children}</svg>
      <figcaption className="text-[13px] text-center leading-snug" style={{ fontFamily: 'var(--bb-serif)' }}>{formula}</figcaption>
    </figure>
  );
}

const I = ({ children }: { children: React.ReactNode }) => <i>{children}</i>;

// Bảng công thức tham khảo của phần Math (vẽ lại bằng SVG)
export default function ReferenceSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <DraggablePanel title="Reference Sheet" initial={{ x: 120, y: 96 }} size={{ width: 760, height: 470 }} onClose={onClose}>
      <div className="p-6">
        <div className="grid grid-cols-6 gap-y-6 gap-x-2 justify-items-center">
          <Figure formula={<><I>A</I> = π<I>r</I><sup>2</sup><br /><I>C</I> = 2π<I>r</I></>}>
            <circle cx="55" cy="40" r="30" {...stroke} />
            <circle cx="55" cy="40" r="2" />
            <line x1="55" y1="40" x2="85" y2="40" {...stroke} />
            <text x="68" y="35" {...label}>r</text>
          </Figure>
          <Figure formula={<><I>A</I> = ℓ<I>w</I></>}>
            <rect x="15" y="25" width="80" height="36" {...stroke} />
            <text x="52" y="20" {...label}>ℓ</text>
            <text x="99" y="47" {...label}>w</text>
          </Figure>
          <Figure formula={<><I>A</I> = <sup>1</sup>⁄<sub>2</sub><I>bh</I></>}>
            <polygon points="10,68 100,68 55,12" {...stroke} />
            <line x1="55" y1="12" x2="55" y2="68" {...stroke} strokeDasharray="3 2" />
            <rect x="55" y="61" width="7" height="7" {...stroke} />
            <text x="58" y="44" {...label}>h</text>
            <text x="52" y="79" {...label}>b</text>
          </Figure>
          <Figure formula={<><I>c</I><sup>2</sup> = <I>a</I><sup>2</sup> + <I>b</I><sup>2</sup></>}>
            <polygon points="20,68 95,68 20,14" {...stroke} />
            <rect x="20" y="61" width="7" height="7" {...stroke} />
            <text x="10" y="44" {...label}>b</text>
            <text x="55" y="79" {...label}>a</text>
            <text x="61" y="36" {...label}>c</text>
          </Figure>
          <Figure wide formula={<>Special Right Triangles</>}>
            <polygon points="12,66 92,66 92,20" {...stroke} />
            <rect x="85" y="59" width="7" height="7" {...stroke} />
            <text x="40" y="38" {...label}>2x</text>
            <text x="96" y="46" {...label}>x</text>
            <text x="42" y="78" {...label}>x√3</text>
            <text x="20" y="63" fontSize="9">30°</text>
            <text x="77" y="34" fontSize="9">60°</text>
            <polygon points="130,66 190,66 190,16" {...stroke} />
            <rect x="183" y="59" width="7" height="7" {...stroke} />
            <text x="146" y="36" {...label}>s√2</text>
            <text x="194" y="44" {...label}>s</text>
            <text x="157" y="78" {...label}>s</text>
            <text x="138" y="63" fontSize="9">45°</text>
            <text x="175" y="30" fontSize="9">45°</text>
          </Figure>
          <Figure formula={<><I>V</I> = ℓ<I>wh</I></>}>
            <path d="M15 35h55v32H15z M15 35l18-14h55l-18 14 M88 21v32l-18 14" {...stroke} />
            <text x="40" y="78" {...label}>ℓ</text>
            <text x="83" y="66" {...label}>w</text>
            <text x="92" y="40" {...label}>h</text>
          </Figure>
          <Figure formula={<><I>V</I> = π<I>r</I><sup>2</sup><I>h</I></>}>
            <ellipse cx="55" cy="18" rx="30" ry="8" {...stroke} />
            <path d="M25 18v46a30 8 0 0 0 60 0V18" {...stroke} />
            <line x1="55" y1="18" x2="85" y2="18" {...stroke} />
            <text x="66" y="14" {...label}>r</text>
            <text x="90" y="45" {...label}>h</text>
          </Figure>
          <Figure formula={<><I>V</I> = <sup>4</sup>⁄<sub>3</sub>π<I>r</I><sup>3</sup></>}>
            <circle cx="55" cy="40" r="32" {...stroke} />
            <ellipse cx="55" cy="40" rx="32" ry="9" {...stroke} strokeDasharray="3 2" />
            <circle cx="55" cy="40" r="2" />
            <line x1="55" y1="40" x2="87" y2="40" {...stroke} />
            <text x="68" y="36" {...label}>r</text>
          </Figure>
          <Figure formula={<><I>V</I> = <sup>1</sup>⁄<sub>3</sub>π<I>r</I><sup>2</sup><I>h</I></>}>
            <path d="M25 64L55 8l30 56" {...stroke} />
            <ellipse cx="55" cy="64" rx="30" ry="8" {...stroke} />
            <line x1="55" y1="8" x2="55" y2="64" {...stroke} strokeDasharray="3 2" />
            <line x1="55" y1="64" x2="85" y2="64" {...stroke} />
            <text x="58" y="40" {...label}>h</text>
            <text x="68" y="61" {...label}>r</text>
          </Figure>
          <Figure formula={<><I>V</I> = <sup>1</sup>⁄<sub>3</sub>ℓ<I>wh</I></>}>
            <path d="M18 62h50l20-14H38z M18 62L55 10l13 52 M55 10l33 38 M55 10L38 48" {...stroke} />
            <line x1="55" y1="10" x2="55" y2="55" {...stroke} strokeDasharray="3 2" />
            <text x="58" y="38" {...label}>h</text>
            <text x="40" y="76" {...label}>ℓ</text>
            <text x="82" y="62" {...label}>w</text>
          </Figure>
        </div>
        <div className="mt-6 space-y-2 text-[14px]" style={{ fontFamily: 'var(--bb-serif)' }}>
          <p>The number of degrees of arc in a circle is 360.</p>
          <p>The number of radians of arc in a circle is 2π.</p>
          <p>The sum of the measures in degrees of the angles of a triangle is 180.</p>
        </div>
      </div>
    </DraggablePanel>
  );
}
