export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || '';

interface WindowWithGtag extends Window {
  gtag?: (...args: unknown[]) => void;
}

// https://developers.google.com/analytics/devguides/collection/gtagjs/pages
export const pageview = (url: string) => {
  if (typeof window !== 'undefined' && (window as WindowWithGtag).gtag) {
    (window as WindowWithGtag).gtag?.('config', GA_MEASUREMENT_ID, {
      page_path: url,
    });
  }
};

// https://developers.google.com/analytics/devguides/collection/gtagjs/events
export const event = (action: string, params?: Record<string, unknown>) => {
  if (typeof window !== 'undefined' && (window as WindowWithGtag).gtag) {
    (window as WindowWithGtag).gtag?.('event', action, params);
  }
};

// Custom events for Cartier Valentine Card
// Engaged users: เมื่อกด "คลิกเพื่อรังสรรค์การ์ดอวยพร"
export const trackEngagedUser = () => {
  event('engaged_user', {
    event_category: 'engagement',
    event_label: 'user_started_playing',
  });
};

// Product Selected: Version of video - คนเลือกเวอร์ชั่นไหนบ้างค่า
export const trackRingsSelected = () => {
  event('rings_selected', {
    event_category: 'selection',
    event_label: 'Cartier Rings',
    product_name: 'Rings',
    version: 'Rings',
  });
};

export const trackBraceletsSelected = () => {
  event('bracelets_selected', {
    event_category: 'selection',
    event_label: 'Cartier Bracelets',
    product_name: 'Bracelets',
    version: 'Bracelets',
  });
};

export const trackWatchesSelected = () => {
  event('watches_selected', {
    event_category: 'selection',
    event_label: 'Cartier Watches',
    product_name: 'Watches',
    version: 'Watches',
  });
};

export const trackPerfumesSelected = () => {
  event('perfumes_selected', {
    event_category: 'selection',
    event_label: 'Cartier Perfumes',
    product_name: 'Perfumes',
    version: 'Perfumes',
  });
};

// Complete: คนเล่นจนจบ (กรอกข้อมูลเสร็จแล้วไปถึง step 3)
export const trackComplete = () => {
  event('complete', {
    event_category: 'engagement',
    event_label: 'user_completed',
  });
};

// Download: คนกดดาวน์โหลด (บันทึก) - ส่งในไลน์ตัวเอง
export const trackDownload = () => {
  event('download', {
    event_category: 'action',
    event_label: 'save_card',
  });
};

// Share: คนกดแชร์ให้เพื่อน
export const trackShare = () => {
  event('share', {
    event_category: 'action',
    event_label: 'share_to_friend',
  });
};

