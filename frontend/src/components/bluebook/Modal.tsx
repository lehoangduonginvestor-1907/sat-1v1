'use client';

import React, { useEffect } from 'react';

interface Props {
  title: string;
  children?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel?: () => void;
}

export default function Modal({ title, children, confirmLabel = 'OK', cancelLabel = 'Cancel', onConfirm, onCancel }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCancel?.();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  return (
    <div className="bb-modal-backdrop" role="dialog" aria-modal="true" aria-label={title}>
      <div className="bb-modal">
        <h2 className="text-xl font-bold mb-3">{title}</h2>
        {children && <div className="text-[15px] leading-relaxed text-[var(--bb-muted)] mb-6">{children}</div>}
        <div className="flex justify-end gap-3">
          {onCancel && <button className="bb-secondary" onClick={onCancel}>{cancelLabel}</button>}
          <button className="bb-primary" onClick={onConfirm} autoFocus>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
