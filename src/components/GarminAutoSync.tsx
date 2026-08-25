'use client';

import { useEffect } from 'react';

export function GarminAutoSync() {
  useEffect(() => {
    const lastSync = sessionStorage.getItem('garmin_auto_synced');
    const now = Date.now();

    if (lastSync && now - Number(lastSync) < 10 * 60 * 1000) {
      return;
    }

    sessionStorage.setItem('garmin_auto_synced', String(now));

    fetch('/api/garmin/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ auto: true }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.ok) {
          window.dispatchEvent(new CustomEvent('garmin_sync_completed', { detail: data }));
        }
      })
      .catch(() => {});
  }, []);

  return null;
}
