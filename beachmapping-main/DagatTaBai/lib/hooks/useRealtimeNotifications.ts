'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface Notification {
  id: string;
  type: 'review' | 'application' | 'beach_update' | 'system';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

export function useRealtimeNotifications(beachId?: string) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  useEffect(() => {
    const supabase = createClient();

    console.log('Setting up realtime notifications for beach:', beachId);

    // Subscribe to reviews for the beach
    let reviewsChannel: RealtimeChannel | null = null;

    if (beachId) {
      reviewsChannel = supabase
        .channel(`beach_reviews:${beachId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'beach_reviews',
            filter: `beach_id=eq.${beachId}`,
          },
          (payload) => {
            console.log('New review received:', payload);
            const newNotification: Notification = {
              id: payload.new.id,
              type: 'review',
              title: 'New Review Received',
              message: `A customer left a review for your beach.`,
              timestamp: new Date(),
              read: false,
            };
            setNotifications((prev) => [newNotification, ...prev]);
            setUnreadCount((prev) => prev + 1);
          }
        )
        .subscribe((status) => {
          console.log('Subscription status:', status);
          if (status === 'SUBSCRIBED') {
            console.log('Successfully subscribed to beach_reviews for beach:', beachId);
          } else if (status === 'CHANNEL_ERROR') {
            console.error('Channel error for beach_reviews subscription');
          }
        });
    } else {
      console.log('No beachId provided, skipping realtime subscription');
    }

    setChannel(reviewsChannel);

    return () => {
      if (reviewsChannel) {
        supabase.removeChannel(reviewsChannel);
      }
    };
  }, [beachId]);

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
  };
}
