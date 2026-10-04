import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  /** Narrow dialogs read better centred; wide ones get more room. */
  width?: number;
}

/** Modal shell: focus trap, Escape, backdrop dismiss, focus restore. */
export function Dialog({ open, onClose, title, children, footer, width = 460 }: DialogProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    restoreRef.current = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const focusables = panel?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    (focusables?.[0] ?? panel)?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !focusables || focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown, true);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      document.body.style.overflow = previousOverflow;
      restoreRef.current?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{ gridTemplateColumns: '1fr', width: `min(${width}px, 100%)` }}
        tabIndex={-1}
      >
        <button type="button" className="modal-close" onClick={onClose} aria-label="Close dialog">
          <X size={18} strokeWidth={2.2} />
        </button>
        <div className="modal-side" style={{ paddingTop: 44 }}>
          <h2 className="modal-title">{title}</h2>
          {children}
          {footer && <div className="modal-actions">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
