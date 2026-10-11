import React from 'react';

type IconProps = { size?: number; className?: string };

export function BookmarkIcon({ size = 20, filled = false, className }: IconProps & { filled?: boolean }) {
  return (
    <svg width={size * 0.8} height={size} viewBox="0 0 16 20" className={className} aria-hidden="true">
      <path d="M2 1.5h12v17l-6-4.6-6 4.6z" fill={filled ? 'var(--bb-red)' : 'none'}
        stroke={filled ? 'var(--bb-red)' : 'currentColor'} strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

export function FlagIcon({ size = 14, className }: IconProps) {
  return (
    <svg width={size * 0.75} height={size} viewBox="0 0 12 16" className={className} aria-hidden="true">
      <path d="M0 0h12v16l-6-4.5L0 16z" fill="currentColor" />
    </svg>
  );
}

export function PinIcon({ size = 18, className }: IconProps) {
  return (
    <svg width={size * 0.78} height={size} viewBox="0 0 14 18" className={className} aria-hidden="true">
      <path d="M7 1a6 6 0 0 1 6 6c0 4.3-6 10-6 10S1 11.3 1 7a6 6 0 0 1 6-6z" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="7" cy="7" r="2.2" fill="currentColor" />
    </svg>
  );
}

// "ABC" gạch chéo: bật/tắt chế độ loại đáp án
export function StrikeAbcIcon({ className }: IconProps) {
  return (
    <svg width="22" height="14" viewBox="0 0 22 14" className={className} aria-hidden="true">
      <text x="11" y="10.5" textAnchor="middle" fontSize="9" fontWeight="700" fontFamily="Arial, sans-serif" fill="currentColor">ABC</text>
      <line x1="3" y1="12.5" x2="19" y2="1.5" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

export function AnnotateIcon({ size = 20, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" className={className} aria-hidden="true">
      <path d="M12.8 3.2l4 4L8 16H4v-4z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M3 18.5h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function CalculatorIcon({ size = 20, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" className={className} aria-hidden="true">
      <rect x="4" y="2" width="12" height="16" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <rect x="6.5" y="4.5" width="7" height="3" fill="currentColor" />
      {[0, 1, 2].map(r => [0, 1, 2].map(c => (
        <circle key={`${r}${c}`} cx={7 + c * 3} cy={10.5 + r * 2.6} r="0.9" fill="currentColor" />
      )))}
    </svg>
  );
}

export function ReferenceIcon({ className }: IconProps) {
  return (
    <span className={className} style={{ fontFamily: 'var(--bb-serif)', fontStyle: 'italic', fontWeight: 700, fontSize: 17, lineHeight: '20px' }} aria-hidden="true">
      x<sup style={{ fontSize: 10 }}>2</sup>
    </span>
  );
}

export function MoreIcon({ size = 20, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" className={className} aria-hidden="true">
      {[4, 10, 16].map(y => <circle key={y} cx="10" cy={y} r="1.7" fill="currentColor" />)}
    </svg>
  );
}

export function ExpandIcon({ size = 16, flip = false, className }: IconProps & { flip?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" className={className} aria-hidden="true"
      style={flip ? { transform: 'scaleX(-1)' } : undefined}>
      <rect x="1.5" y="1.5" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <path d="M8 1.5v13" stroke="currentColor" strokeWidth="1.3" />
      <path d="M10 6l2 2-2 2" fill="none" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

export function GripIcon({ className }: IconProps) {
  return (
    <svg width="20" height="12" viewBox="0 0 20 12" className={className} aria-hidden="true">
      {[3, 10, 17].map(x => [3, 9].map(y => <circle key={`${x}${y}`} cx={x} cy={y} r="1.6" fill="currentColor" />))}
    </svg>
  );
}
