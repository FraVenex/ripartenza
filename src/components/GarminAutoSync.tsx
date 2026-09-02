'use client';

import { useEffect, useRef } from 'react';

export function GarminAutoSync() {
  const isSyncingRef = useRef(false);

  useEffect(() => {
    if (isSyncingRef.current) return;

    const lastSync = sessionStorage.getItem('garmin_auto_synced');
    const now = Date.now();

    if (lastSync && now - Number(lastSync) < 45 * 1000) {
      return;
    }

    isSyncingRef.current = true;
    sessionStorage.setItem('garmin_auto_synced', String(now));

    fetch('/api/garmin/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ auto: true }),
    })
      .then((res) => res.json())
      .then((data) => {
        isSyncingRef.current = false;
        if (data?.ok) {
          window.dispatchEvent(new CustomEvent('garmin_sync_completed', { detail: data }));
        }
      })
      .catch(() => {
        isSyncingRef.current = false;
      });
  }, []);

  return null;
}
