'use client';

import { useState, useEffect } from 'react';
import { initializeLiff, isInLiff, getProfile } from '@/lib/liff';

interface LiffProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
}

export const useLiff = () => {
  const [liffReady, setLiffReady] = useState(false);
  const [profile, setProfile] = useState<LiffProfile | null>(null);
  const [isInClient, setIsInClient] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initLiff = async () => {
      try {
        const initialized = await initializeLiff();
        if (initialized) {
          setLiffReady(true);
          setIsInClient(isInLiff());
          
          // Get user profile
          const userProfile = await getProfile();
          if (userProfile) {
            setProfile(userProfile);
          }
        } else {
          setError('Failed to initialize LIFF');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    };

    initLiff();
  }, []);

  return { liffReady, profile, isInClient, error };
};
