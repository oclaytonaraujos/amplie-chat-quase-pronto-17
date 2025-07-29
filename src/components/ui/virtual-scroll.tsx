/**
 * Componente de scroll virtual otimizado para listas grandes
 */
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface VirtualScrollProps<T> {
  items: T[];
  itemHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
  containerHeight?: number;
  overscan?: number;
  onScroll?: (scrollTop: number) => void;
  keyExtractor?: (item: T, index: number) => string | number;
}

export function VirtualScroll<T>({
  items,
  itemHeight,
  renderItem,
  className,
  containerHeight = 400,
  overscan = 5,
  onScroll,
  keyExtractor = (_, index) => index
}: VirtualScrollProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calcular itens visíveis
  const visibleRange = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight),
      items.length - 1
    );

    return {
      start: Math.max(0, startIndex - overscan),
      end: Math.min(items.length - 1, endIndex + overscan)
    };
  }, [scrollTop, itemHeight, containerHeight, overscan, items.length]);

  // Itens a renderizar
  const visibleItems = useMemo(() => {
    const result = [];
    for (let i = visibleRange.start; i <= visibleRange.end; i++) {
      if (items[i]) {
        result.push({
          index: i,
          item: items[i],
          key: keyExtractor(items[i], i)
        });
      }
    }
    return result;
  }, [items, visibleRange, keyExtractor]);

  // Handler de scroll otimizado
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = e.currentTarget.scrollTop;
    setScrollTop(newScrollTop);
    onScroll?.(newScrollTop);
  }, [onScroll]);

  // Altura total da lista
  const totalHeight = items.length * itemHeight;

  // Offset do primeiro item visível
  const offsetY = visibleRange.start * itemHeight;

  return (
    <div
      ref={containerRef}
      className={cn(
        "overflow-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-background",
        className
      )}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0
          }}
        >
          {visibleItems.map(({ item, index, key }) => (
            <div
              key={key}
              style={{
                height: itemHeight,
                overflow: 'hidden'
              }}
            >
              {renderItem(item, index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Hook para scroll virtual com estado gerenciado
export function useVirtualScroll<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number = 400
) {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleRange = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight),
      items.length - 1
    );

    return { start: startIndex, end: endIndex };
  }, [scrollTop, itemHeight, containerHeight, items.length]);

  const scrollToItem = useCallback((index: number) => {
    const newScrollTop = index * itemHeight;
    setScrollTop(newScrollTop);
  }, [itemHeight]);

  const scrollToTop = useCallback(() => {
    setScrollTop(0);
  }, []);

  return {
    scrollTop,
    visibleRange,
    scrollToItem,
    scrollToTop,
    setScrollTop
  };
}

// Componente especializado para lista de mensagens
interface VirtualMessageListProps<T> {
  messages: T[];
  renderMessage: (message: T, index: number) => React.ReactNode;
  className?: string;
  estimatedHeight?: number;
  autoScrollToBottom?: boolean;
  keyExtractor?: (message: T, index: number) => string | number;
}

export function VirtualMessageList<T>({
  messages,
  renderMessage,
  className,
  estimatedHeight = 60,
  autoScrollToBottom = true,
  keyExtractor = (_, index) => index
}: VirtualMessageListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(400);

  // Auto-scroll para o final quando novas mensagens chegam
  useEffect(() => {
    if (autoScrollToBottom && containerRef.current) {
      const container = containerRef.current;
      container.scrollTop = container.scrollHeight;
    }
  }, [messages.length, autoScrollToBottom]);

  // Observar mudanças no tamanho do container
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  return (
    <div ref={containerRef} className={cn("flex-1", className)}>
      <VirtualScroll
        items={messages}
        itemHeight={estimatedHeight}
        renderItem={renderMessage}
        containerHeight={containerHeight}
        keyExtractor={keyExtractor}
      />
    </div>
  );
}