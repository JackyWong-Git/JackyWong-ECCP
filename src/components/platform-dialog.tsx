'use client';

import { X } from 'lucide-react';
import { type ReactNode, useEffect } from 'react';

interface PlatformDialogProps {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  width?: 'sm' | 'md' | 'lg';
}

const widthClass = {
  sm: 'max-w-[460px]',
  md: 'max-w-[620px]',
  lg: 'max-w-[760px]',
};

export function PlatformDialog({ open, title, description, onClose, children, footer, width = 'md' }: PlatformDialogProps) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#17232D]/30 p-4 backdrop-blur-[3px]" onMouseDown={event => { if (event.currentTarget === event.target) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="platform-dialog-title" className={`animate-slide-up flex max-h-[min(760px,calc(100dvh-32px))] w-full flex-col overflow-hidden rounded-2xl border border-[#DEE6EC] bg-white shadow-[0_24px_70px_rgba(31,50,68,0.22)] ${widthClass[width]}`}>
        <header className="flex items-start justify-between gap-4 border-b border-[#E8EDF1] px-5 py-4">
          <div>
            <h2 id="platform-dialog-title" className="text-[16px] font-semibold text-[#263640]">{title}</h2>
            {description ? <p className="mt-1 text-[10px] leading-5 text-[#7E8E99]">{description}</p> : null}
          </div>
          <button type="button" aria-label="关闭弹窗" onClick={onClose} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-[#71818D] hover:bg-[#F1F4F7] hover:text-[#5267E8]"><X className="h-4 w-4" /></button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-5">{children}</div>
        {footer ? <footer className="flex flex-wrap justify-end gap-2 border-t border-[#E8EDF1] bg-[#FAFBFC] px-5 py-3">{footer}</footer> : null}
      </section>
    </div>
  );
}
