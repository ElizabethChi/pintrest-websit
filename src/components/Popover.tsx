import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';

interface PopoverProps {
  open: boolean;
  onClose: () => void;
  /** Element that opened the popover; focus returns to it on close. */
  anchorRef?: React.RefObject<HTMLElement | null>;
  children: ReactNode;
  style?: CSSProperties;
  labelledBy?: string;
}

/**
 * Small absolutely-positioned menu shell shared by the card, account, create
 * and settings menus. Closes on Escape or an outside click, moves focus into
 * the menu on open and returns it to the trigger on close.
 */
export function Popover({
  open,
  onClose,
  anchorRef,
  children,
  style,
  labelledBy,
}: PopoverProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const wasOpen = useRef(false);

  useEffect(() => {
    if (!open) {
      if (wasOpen.current) anchorRef?.current?.focus();
      wasOpen.current = false;
      return;
    }
    wasOpen.current = true;
    const node = ref.current;
    node?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (node?.contains(target) || anchorRef?.current?.contains(target)) return;
      onClose();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
      }
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
      document.removeEventListener('keydown', onKeyDown, true);
    };
  }, [open, onClose, anchorRef]);

  if (!open) return null;

  return (
    <div
      ref={ref}
      className="popover"
      role="menu"
      aria-labelledby={labelledBy}
      style={style}
    >
      {children}
    </div>
  );
}

interface MenuItemProps {
  onSelect: () => void;
  children: ReactNode;
  icon?: ReactNode;
  danger?: boolean;
}

export function MenuItem({ onSelect, children, icon, danger }: MenuItemProps) {
  return (
    <button
      type="button"
      role="menuitem"
      className="popover-item"
      data-danger={danger ? 'true' : undefined}
      onClick={(event) => {
        event.stopPropagation();
        onSelect();
      }}
    >
      {icon}
      <span>{children}</span>
    </button>
  );
}
