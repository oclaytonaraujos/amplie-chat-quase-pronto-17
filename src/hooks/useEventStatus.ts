import { useState, useEffect, useCallback } from 'react';
import { EventsService } from '@/services/EventsService';
import type { IntegrationEvent } from '@/types/integration-events';

export interface EventStatusHook {
  event: IntegrationEvent | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useEventStatus(correlationId: string | null): EventStatusHook {
  const [event, setEvent] = useState<IntegrationEvent | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!correlationId) return;

    setLoading(true);
    setError(null);

    try {
      const eventData = await EventsService.getEventStatus(correlationId);
      setEvent(eventData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar status do evento');
    } finally {
      setLoading(false);
    }
  }, [correlationId]);

  useEffect(() => {
    if (!correlationId) {
      setEvent(null);
      setError(null);
      return;
    }

    refresh();

    // Subscribe to real-time updates
    const unsubscribe = EventsService.subscribeToEvent(correlationId, (updatedEvent) => {
      setEvent(updatedEvent);
    });

    return unsubscribe;
  }, [correlationId, refresh]);

  return {
    event,
    loading,
    error,
    refresh
  };
}

export interface EventListHook {
  events: IntegrationEvent[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  hasMore: boolean;
}

export function useEventList(filters?: {
  eventType?: string;
  status?: string;
  limit?: number;
}): EventListHook {
  const [events, setEvents] = useState<IntegrationEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const limit = filters?.limit || 20;

  const loadEvents = useCallback(async (resetOffset = false) => {
    setLoading(true);
    setError(null);

    const currentOffset = resetOffset ? 0 : offset;

    try {
      const newEvents = await EventsService.getEvents({
        ...filters,
        limit,
        offset: currentOffset
      });

      if (resetOffset) {
        setEvents(newEvents);
        setOffset(newEvents.length);
      } else {
        setEvents(prev => [...prev, ...newEvents]);
        setOffset(prev => prev + newEvents.length);
      }

      setHasMore(newEvents.length === limit);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar eventos');
    } finally {
      setLoading(false);
    }
  }, [filters, limit, offset]);

  const refresh = useCallback(() => loadEvents(true), [loadEvents]);
  const loadMore = useCallback(() => loadEvents(false), [loadEvents]);

  useEffect(() => {
    refresh();
  }, [filters?.eventType, filters?.status]);

  return {
    events,
    loading,
    error,
    refresh,
    loadMore,
    hasMore
  };
}