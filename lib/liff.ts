import liff from '@line/liff';

export const LIFF_ID = process.env.NEXT_PUBLIC_LINE_LIFF_ID || process.env.NEXT_PUBLIC_LIFF_ID || '';

/**
 * Initialize LIFF
 * @returns Promise<boolean> - true if initialized successfully
 */
export const initializeLiff = async (): Promise<boolean> => {
  try {
    await liff.init({ liffId: LIFF_ID });
    return true;
  } catch (error) {
    console.error('LIFF initialization failed', error);
    return false;
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
export const getProfile = async () => {
  try {
    if (!liff.isLoggedIn()) {
      liff.login();
      return null;
    }
    return await liff.getProfile();
  } catch (error) {
    console.error('Failed to get profile', error);
    return null;
  }
};

/**
 * Send message to LINE chat
 */
export const sendMessages = async (messages: any[]) => {
  try {
    await liff.sendMessages(messages);
    return true;
  } catch (error) {
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
