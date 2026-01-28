import liff from '@line/liff';

export const LIFF_ID = process.env.NEXT_PUBLIC_LINE_LIFF_ID || process.env.NEXT_PUBLIC_LIFF_ID || '';

/**
 * Initialize LIFF
 * @returns Promise<{success: boolean, requiresLogin?: boolean}>
 */
export const initializeLiff = async (): Promise<{success: boolean; requiresLogin: boolean}> => {
  try {
    await liff.init({ liffId: LIFF_ID });
    return { success: true, requiresLogin: false };
  } catch (error: unknown) {
    console.error('LIFF initialization failed', error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    
    // Check if it's an authorization code expiration error
    if (errorMsg.includes('authorization code expired') || errorMsg.includes('incompatible')) {
      console.log('Authorization code expired or incompatible, will trigger login');
      return { success: false, requiresLogin: true };
    }
    return { success: false, requiresLogin: false };
  }
};

/**
 * Check if running in LIFF browser
 */
export const isInLiff = (): boolean => {
  return liff.isInClient();
};

/**
 * Get LINE user profile
 */
export const getProfile = async (): Promise<{userId: string; displayName: string; pictureUrl?: string; statusMessage?: string} | null> => {
  try {
    if (!liff.isLoggedIn()) {
      liff.login();
      return null;
    }
    return await liff.getProfile();
  } catch (error: unknown) {
    console.error('Failed to get profile', error);
    return null;
  }
};

/**
 * Send message to LINE chat
 */
export const sendMessages = async (messages: Array<{type: 'image' | 'text' | 'video'; originalContentUrl?: string; previewImageUrl?: string}>): Promise<boolean> => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await liff.sendMessages(messages as any);    
    return true;
  } catch (error: unknown) {
    console.error('Failed to send messages', error);
    return false;
  }
};

/**
 * Close LIFF window
 */
export const closeLiff = () => {
  liff.closeWindow();
};

export default liff;
