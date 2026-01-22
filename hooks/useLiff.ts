'use client';

import { useState, useEffect } from 'react';
import { initializeLiff, isInLiff, getProfile } from '@/lib/liff';

interface LiffProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
}

interface UseLiffOptions {
  skipInit?: boolean;
}

export const useLiff = (options?: UseLiffOptions) => {
  const [liffReady, setLiffReady] = useState(false);
  const [profile, setProfile] = useState<LiffProfile | null>(null);
  const [isInClient, setIsInClient] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const skipInit = options?.skipInit ?? false;

  useEffect(() => {
    if (skipInit) {
      setLiffReady(false);
      setProfile(null);
      setIsInClient(false);
      setError(null);
      return;
    }

    const initLiff = async () => {
      try {
        const result = await initializeLiff();
        if (result.success) {
          setLiffReady(true);
          setIsInClient(isInLiff());
          
          // Get user profile
          const userProfile = await getProfile();
          if (userProfile) {
            setProfile(userProfile);
          }
        } else if (result.requiresLogin) {
          // Authorization code expired or incompatible - trigger login
          setError('Authorization code expired. Redirecting to LINE login...');
          if (typeof window !== 'undefined' && window.liff) {
            setTimeout(() => {
              console.log('Triggering LINE login due to expired auth code');
              window.liff.login();
            }, 500);
          }
        } else {
          setError('Failed to initialize LIFF');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    };

    initLiff();
  }, [skipInit]);

  return { liffReady, profile, isInClient, error };
};
