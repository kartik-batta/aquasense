import React, { useEffect, useRef } from 'react';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  /** id of the element that names the dialog (usually its heading) */
  labelledBy: string;
  /** Classes for the dialog panel itself */
  className?: string;
  /** 'modal' centers the panel over a backdrop; 'drawer' docks it to the right edge */
  variant?: 'modal' | 'drawer';
  children: React.ReactNode;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Accessible dialog shell: role="dialog", aria-modal, Escape to close,
 * focus moved inside on open, Tab trapped within, and focus restored on close.
 */
export const Dialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  labelledBy,
  className = '',
  variant = 'modal',
  children,
}) => {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const focusables = () => Array.from(panel?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []);

    (focusables()[0] ?? panel)?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab') return;
      const items = focusables();
      if (items.length === 0) {
        e.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const panel = (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
      tabIndex={-1}
      className={`focus:outline-none ${className}`}
    >
      {children}
    </div>
  );

  if (variant === 'drawer') {
    return (
      <>
        <div className="fixed inset-0 z-40 bg-slate-900/20" aria-hidden="true" onClick={onClose} />
        {panel}
      </>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="absolute inset-0" aria-hidden="true" onClick={onClose} />
      {panel}
    </div>
  );
};
