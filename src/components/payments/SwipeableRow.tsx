import { useState, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Check, RotateCcw } from 'lucide-react';

interface SwipeableRowProps {
  children: React.ReactNode;
  onSwipeRight?: () => void;
  onSwipeLeft?: () => void;
  rightLabel?: string;
  leftLabel?: string;
  disabled?: boolean;
  isPaid?: boolean;
}

const THRESHOLD = 80;

export function SwipeableRow({
  children,
  onSwipeRight,
  onSwipeLeft,
  rightLabel = 'Pagado',
  leftLabel = 'Pendiente',
  disabled = false,
  isPaid = false,
}: SwipeableRowProps) {
  const [offsetX, setOffsetX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const currentX = useRef(0);
  const isHorizontal = useRef<boolean | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled) return;
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    currentX.current = 0;
    isHorizontal.current = null;
    setIsDragging(true);
  }, [disabled]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (disabled || !isDragging) return;
    const dx = e.touches[0].clientX - startX.current;
    const dy = e.touches[0].clientY - startY.current;

    // Determine swipe direction on first significant move
    if (isHorizontal.current === null) {
      if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
        isHorizontal.current = Math.abs(dx) > Math.abs(dy);
      }
      return;
    }

    if (!isHorizontal.current) return;

    e.preventDefault();

    // Restrict direction: paid items can only swipe left (to mark pending)
    // unpaid items can only swipe right (to mark paid)
    let clampedDx = dx;
    if (isPaid) {
      clampedDx = Math.min(0, dx); // only left
    } else {
      clampedDx = Math.max(0, dx); // only right
    }

    // Apply rubber-band effect past threshold
    const maxOffset = 120;
    if (Math.abs(clampedDx) > THRESHOLD) {
      const over = Math.abs(clampedDx) - THRESHOLD;
      clampedDx = Math.sign(clampedDx) * (THRESHOLD + over * 0.3);
    }
    clampedDx = Math.max(-maxOffset, Math.min(maxOffset, clampedDx));

    currentX.current = clampedDx;
    setOffsetX(clampedDx);
  }, [disabled, isDragging, isPaid]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    if (Math.abs(currentX.current) >= THRESHOLD) {
      if (currentX.current > 0 && onSwipeRight) {
        onSwipeRight();
      } else if (currentX.current < 0 && onSwipeLeft) {
        onSwipeLeft();
      }
    }
    setOffsetX(0);
    currentX.current = 0;
    isHorizontal.current = null;
  }, [onSwipeRight, onSwipeLeft]);

  const progress = Math.min(Math.abs(offsetX) / THRESHOLD, 1);
  const isTriggered = progress >= 1;
  const showRight = offsetX > 0;
  const showLeft = offsetX < 0;

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Background action indicator */}
      {showRight && (
        <div className={cn(
          'absolute inset-y-0 left-0 flex items-center pl-4 transition-colors rounded-xl',
          isTriggered ? 'bg-paid/20' : 'bg-paid/10',
        )} style={{ width: Math.abs(offsetX) }}>
          <div className={cn(
            'flex items-center gap-1.5 transition-all',
            isTriggered ? 'scale-110 text-paid' : 'scale-90 text-paid/60',
          )}>
            <Check className="w-4 h-4" />
            <span className="text-xs font-semibold whitespace-nowrap">{rightLabel}</span>
          </div>
        </div>
      )}
      {showLeft && (
        <div className={cn(
          'absolute inset-y-0 right-0 flex items-center justify-end pr-4 transition-colors rounded-xl',
          isTriggered ? 'bg-muted' : 'bg-muted/60',
        )} style={{ width: Math.abs(offsetX) }}>
          <div className={cn(
            'flex items-center gap-1.5 transition-all',
            isTriggered ? 'scale-110 text-foreground' : 'scale-90 text-muted-foreground',
          )}>
            <span className="text-xs font-semibold whitespace-nowrap">{leftLabel}</span>
            <RotateCcw className="w-4 h-4" />
          </div>
        </div>
      )}

      {/* Swipeable content */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: `translateX(${offsetX}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        }}
        className="relative z-10"
      >
        {children}
      </div>
    </div>
  );
}
