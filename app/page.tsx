"use client";

import React, { useRef, useState, useCallback, PropsWithChildren } from "react";
import HTMLFlipBook from "react-pageflip";
import { useLiff } from "@/hooks/useLiff";
import * as gtag from "@/lib/gtag";

// Extend Window type for LIFF
declare global {
  interface Window {
    liff: any;
  }
}

const PageCover = React.forwardRef<HTMLDivElement, PropsWithChildren>(
  ({ children }, ref) => (
    <div
      ref={ref}
      data-density="hard"
      className="bg-gradient-to-b from-red-50 to-red-50 h-full flex flex-col justify-center items-center p-8"
    >
      <h2 className="text-5xl font-serif font-bold text-stone-800 text-center">
        {children}
      </h2>
    </div>
  )
);
PageCover.displayName = "PageCover";

interface PageProps extends PropsWithChildren {
  number: number;
  title?: string;
  imageUrl?: string;
}

const Page = React.forwardRef<HTMLDivElement, PageProps>(
  ({ number, title, imageUrl, children }, ref) => (
    <div
      ref={ref}
      className="bg-gradient-to-b from-red-50 to-red-50 h-full flex flex-col p-6"
    >
      <div className="border-b-2 border-red-200 pb-2 mb-3">
        <h3 className="text-sm font-serif font-bold text-stone-700 uppercase">
          {title || `Page ${number}`}
        </h3>
      </div>
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={`Page ${number}`}
          className="w-48 h-48 rounded mb-3 object-cover border border-red-300 mx-auto"
        />
      ) : (
        <div className="w-48 h-48 bg-gradient-to-r from-red-200 to-red-100 rounded mb-3 flex items-center justify-center border border-red-300 mx-auto">
          <span className="text-red-600 text-xs font-serif">
            Image {number}
          </span>
        </div>
      )}
      <div className="flex-1 overflow-y-auto text-stone-700 text-xs leading-relaxed">
        {children}
      </div>
      <div className="text-center text-stone-400 text-xs pt-2 border-t border-red-200 mt-2">
        {number}
      </div>
    </div>
  )
);
Page.displayName = "Page";

const PAGES_DATA = [
  {
    title: "Cartier Rings",
    imageUrl: "/products/ring.webp",
    content: {
      heading: "Timeless Elegance",
      text: [
        "Discover the iconic beauty of Cartier rings, masterpieces of craftsmanship and design.",
        "Each ring tells a story of love, commitment, and exceptional artistry.",
      ],
    },
  },
  {
    title: "Cartier Bracelets",
    imageUrl: "/products/bracelet.webp",
    content: {
      heading: "Luxury in Motion",
      text: [
        "Experience the sophistication of Cartier bracelets, where elegance meets everyday luxury.",
        "Handcrafted with precision, each piece reflects our commitment to perfection.",
      ],
    },
  },
  {
    title: "Cartier Watches",
    imageUrl: "/products/watche.webp",
    content: {
      heading: "Time in Perfection",
      text: [
        "Cartier watches combine technical innovation with timeless style and heritage.",
        "A symbol of sophistication and a companion for life's most precious moments.",
      ],
    },
  },
  {
    title: "Cartier Perfumes",
    imageUrl: "/products/perfume.webp",
    content: {
      heading: "Essence of Luxury",
      text: [
        "Cartier perfumes capture the essence of elegance in every spritz.",
        "Discover scents that define moments, evoke emotions, and express your unique style.",
      ],
    },
  },
];

export default function Home() {
  const bookRef = useRef<any>(null);
  const [page, setPage] = useState(0);
  const [totalPage, setTotalPage] = useState(0);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [coverFramesLoaded, setCoverFramesLoaded] = useState(false);
  const [minLoadingTime, setMinLoadingTime] = useState(true);

  // Step management
  const [currentStep, setCurrentStep] = useState<0 | 1 | 2 | 3>(0);
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    to: "You",
    from: "Me",
    message: "Happy Valentine's Day",
  });
  const [cardImageDataUrl, setCardImageDataUrl] = useState<string>("");
  const [merging, setMerging] = useState(false);

  // Cover animation state
  const [hiddenFrames, setHiddenFrames] = useState<number[]>([]); // frames that are hidden
  const [isPlayingCover, setIsPlayingCover] = useState(false);
  const [coverAnimationDone, setCoverAnimationDone] = useState(false);
  const TOTAL_COVER_FRAMES = 59;

  const { liffReady, profile, error: liffError } = useLiff();

  React.useEffect(() => {
    if (profile) {
      console.log("LINE profile", profile);
    }
  }, [profile]);

  // Auto login if not logged in
  React.useEffect(() => {
    if (liffReady && typeof window !== 'undefined' && window.liff) {
      if (!window.liff.isLoggedIn()) {
        console.log('User not logged in, redirecting to LINE login...');
        window.liff.login();
      }
    }
  }, [liffReady]);

  // Minimum 3 second loading time
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setMinLoadingTime(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Preload all images
  React.useEffect(() => {
    Promise.all(PAGES_DATA.map(p => {
      const img = new Image();
      img.src = p.imageUrl;
      return new Promise(resolve => { img.onload = img.onerror = resolve; });
    })).then(() => setImagesLoaded(true));
  }, []);

  // Cover animation effect - hide frames one by one
  React.useEffect(() => {
    if (!isPlayingCover) return;
    
    // If all frames except last are hidden, animation is done
    if (hiddenFrames.length >= TOTAL_COVER_FRAMES - 1) {
      setCoverAnimationDone(true);
      setIsPlayingCover(false);
      setCurrentStep(1);
      return;
    }

    const timer = setTimeout(() => {
      // Hide the next frame (1, 2, 3... up to 58)
      const nextFrameToHide = hiddenFrames.length + 1;
      setHiddenFrames(prev => [...prev, nextFrameToHide]);
    }, 50); // 0.05 second per frame (~20fps)

    return () => clearTimeout(timer);
  }, [isPlayingCover, hiddenFrames]);

  // Preload cover frames (video)
  React.useEffect(() => {
    const framePromises = [];
    for (let i = 1; i <= TOTAL_COVER_FRAMES; i++) {
      framePromises.push(new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => resolve();
        img.src = `/cover/${i}.webp`;
      }));
    }
    Promise.all(framePromises).then(() => setCoverFramesLoaded(true));
  }, []);

  const handleStartCoverAnimation = () => {
    gtag.trackEngagedUser();
    setHiddenFrames([]); // Reset hidden frames
    setIsPlayingCover(true);
  };

  const badWords = ["ไอ้","อี","มึง​","กู","ชั่ว","เลว","ควาย","เหี้ย","สัตว์","ไม่ดี","หยาบคาย","shit","damn","hell","fuck","bitch","ค*ย","ห*ี","แ*ตด","เย็*ด"];

  const censorBadWords = useCallback((text: string): string => 
    badWords.reduce((r, w) => r.replace(new RegExp(w, "gi"), "*".repeat(w.length)), text), []);

  const handleInit = () => {
    const pf = bookRef.current?.pageFlip();
    if (pf) {
      setTotalPage(pf.getPageCount());
      setPage(pf.getCurrentPageIndex());
    }
  };

  React.useEffect(() => {
    if (currentStep === 1 && selectedProduct) {
      setTimeout(() => {
        const pf = bookRef.current?.pageFlip();
        if (pf) {
          pf.turnToPage(selectedProduct);
        }
      }, 20);
    }
  }, [currentStep, selectedProduct]);

  const trackingMap: Record<number, () => void> = {
    1: gtag.trackRingsSelected,
    2: gtag.trackBraceletsSelected,
    3: gtag.trackWatchesSelected,
    4: gtag.trackPerfumesSelected,
  };

  const handleConfirmStep1 = useCallback(() => {
    if (page >= 1 && page <= 4) {
      setSelectedProduct(page);
      trackingMap[page]?.();
      setCurrentStep(2);
    }
  }, [page]);

  const handleBackStep2 = useCallback(() => setCurrentStep(1), []);

  const handleConfirmStep2 = () => {
    if (formData.to && formData.from && formData.message) {
      const censoredData = {
        to: censorBadWords(formData.to),
        from: censorBadWords(formData.from),
        message: censorBadWords(formData.message),
      };
      setFormData(censoredData);
      
      // Track complete (user finished creating card)
      gtag.trackComplete();
      
      // Move to step 3 and trigger merge
      setCurrentStep(3);
      setTimeout(() => {
        mergeImageWithText();
      }, 100);
    }
  };

  const mergeImageWithText = async () => {
    try {
      setMerging(true);
      const imageUrl = getSelectedProductData()!.imageUrl!;
      
      // Load the image
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        // Create canvas
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 400;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Draw image
        ctx.drawImage(img, 0, 0, 400, 400);

        // Draw semi-transparent overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(0, 0, 400, 400);

        // Draw text
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 4;

        // To - positioned at bottom area
        ctx.font = 'bold 22px serif';
        ctx.fillText(`To: ${formData.to}`, 200, 310);

        // Message - centered at bottom area with spacing
        ctx.font = '18px serif';
        const messageLines = formData.message.split('\n');
        const messageStartY = 340;
        messageLines.forEach((line, idx) => {
          ctx.fillText(line, 200, messageStartY + idx * 25);
        });

        // From - at very bottom
        ctx.font = 'bold 22px serif';
        ctx.fillText(`From: ${formData.from}`, 200, 375);

        // Convert to JPEG
        const dataUrl = canvas.toDataURL('image/jpeg', 1.0);
        
        // Delay 3 seconds before showing
        setTimeout(() => {
          setCardImageDataUrl(dataUrl);
          setMerging(false);
        }, 2000);
      };
      img.onerror = () => {
        console.error('Failed to load image');
        alert('ไม่สามารถโหลดรูปได้');
        setMerging(false);
      };
      img.src = imageUrl;
    } catch (error) {
      console.error('Error merging card:', error);
      alert('ไม่สามารถประมวลผลการ์ดได้');
      setMerging(false);
    }
  };

  const handleShare = async () => {
    gtag.trackShare();
    
    try {
      if (!cardImageDataUrl) {
        alert('รูปยังไม่พร้อม กรุณารอสักครู่');
        return;
      }

      // Check if LIFF is available
      if (typeof window !== 'undefined' && window.liff && window.liff.isInClient()) {
        try {
          // Use shareTargetPicker - select multiple friends and share
          const result = await window.liff.shareTargetPicker([
            {
              type: 'image',
              originalContentUrl: cardImageDataUrl,
              previewImageUrl: cardImageDataUrl,
            },
          ], {
            isMultiple: true,
          });
          
          if (result) {
            console.log('✅ Image shared successfully to', result.length, 'contacts');
            alert('แชร์รูปสำเร็จแล้ว! 🎉');
          } else {
            console.log('User cancelled share');
          }
        } catch (error: any) {
          console.error('❌ LIFF shareTargetPicker error:', error);
          alert('ไม่สามารถแชร์ผ่าน LINE ได้ กรุณาลองใหม่อีกครั้ง');
        }
      } else {
        alert('กรุณาเปิดแอปจาก LINE เพื่อแชร์ให้เพื่อน');
      }
    } catch (error) {
      console.error('❌ Error sharing:', error);
      alert('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    }
  };

  const handleBackStep3 = useCallback(() => {
    setCardImageDataUrl(''); // Clear old image to prevent flickering
    setCurrentStep(2);
  }, []);

  const handleSave = async () => {
    // Track download event
    gtag.trackDownload();
    
    try {
      if (!cardImageDataUrl) {
        alert('รูปยังไม่พร้อม กรุณารอสักครู่');
        return;
      }

      // Check if LIFF is available
      if (typeof window !== 'undefined' && window.liff) {
        if (!window.liff.isLoggedIn()) {
          alert('กรุณาเข้าสู่ระบบ LINE');
          return;
        }

        try {
          // Send image via LIFF sendMessages
          await window.liff.sendMessages([
            {
              type: 'image',
              originalContentUrl: cardImageDataUrl,
              previewImageUrl: cardImageDataUrl,
            },
          ]);
          
          console.log('✅ Image sent successfully via LIFF');
          alert('ส่งรูปสำเร็จแล้ว! กรุณาตรวจสอบใน LINE Chat');
        } catch (error: any) {
          console.error('❌ LIFF sendMessages error:', error);
          
          // Fallback to download
          const link = document.createElement('a');
          link.href = cardImageDataUrl;
          link.download = 'cartier-valentine-card.jpg';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          alert('ไม่สามารถส่งผ่าน LINE ได้ ดาวน์โหลดรูปแล้วแชร์เองนะครับ 😊\n\n(ต้อง deploy ก่อนถึงจะส่งได้)');
        }
      } else {
        // Not in LIFF - just download
        const link = document.createElement('a');
        link.href = cardImageDataUrl;
        link.download = 'cartier-valentine-card.jpg';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        alert('ดาวน์โหลดรูปเรียบร้อย คุณสามารถแชร์ต่อได้เลยครับ 😊');
      }
    } catch (error) {
      console.error('❌ Error saving:', error);
      alert('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    }
  };

  const getSelectedProductData = () => {
    if (selectedProduct && selectedProduct >= 1 && selectedProduct <= 4) {
      return PAGES_DATA[selectedProduct - 1];
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-900 to-stone-800 py-6 px-4 flex flex-col items-center justify-center">
      {/* Loading Screen */}
      {(!liffReady || !imagesLoaded || !coverFramesLoaded || minLoadingTime || !profile) && (
        <div className="flex flex-col items-center justify-center h-screen gap-6">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-red-600 border-t-red-100" />
            <p className="text-red-100 font-serif text-lg">Loading...</p>
          </div>
        </div>
      )}

      {/* Main App */}
      {liffReady && imagesLoaded && coverFramesLoaded && !minLoadingTime && profile && (
        <>
          {/* Step 0: Welcome Screen */}
          {currentStep === 0 && (
            <div className="flex flex-col items-center justify-center h-screen w-full max-w-md relative">
              {/* Stack all frames - always rendered, hidden by opacity */}
              <div className="relative w-full h-full">
                <img src="/cover/1.webp" className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 59, opacity: !isPlayingCover ? 0 : (hiddenFrames.includes(1) ? 0 : 1), pointerEvents: 'none', transform: 'translateZ(0)', willChange: 'opacity' }} />
                <img src="/cover/2.webp" className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 58, opacity: !isPlayingCover ? 0 : (hiddenFrames.includes(2) ? 0 : 1), pointerEvents: 'none', transform: 'translateZ(0)', willChange: 'opacity' }} />
                <img src="/cover/3.webp" className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 57, opacity: !isPlayingCover ? 0 : (hiddenFrames.includes(3) ? 0 : 1), pointerEvents: 'none', transform: 'translateZ(0)', willChange: 'opacity' }} />
                <img src="/cover/4.webp" className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 56, opacity: !isPlayingCover ? 0 : (hiddenFrames.includes(4) ? 0 : 1), pointerEvents: 'none', transform: 'translateZ(0)', willChange: 'opacity' }} />
                <img src="/cover/5.webp" className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 55, opacity: !isPlayingCover ? 0 : (hiddenFrames.includes(5) ? 0 : 1), pointerEvents: 'none', transform: 'translateZ(0)', willChange: 'opacity' }} />
                <img src="/cover/6.webp" className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 54, opacity: !isPlayingCover ? 0 : (hiddenFrames.includes(6) ? 0 : 1), pointerEvents: 'none', transform: 'translateZ(0)', willChange: 'opacity' }} />
                <img src="/cover/7.webp" className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 53, opacity: !isPlayingCover ? 0 : (hiddenFrames.includes(7) ? 0 : 1), pointerEvents: 'none', transform: 'translateZ(0)', willChange: 'opacity' }} />
                <img src="/cover/8.webp" className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 52, opacity: !isPlayingCover ? 0 : (hiddenFrames.includes(8) ? 0 : 1), pointerEvents: 'none', transform: 'translateZ(0)', willChange: 'opacity' }} />
                <img src="/cover/9.webp" className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 51, opacity: !isPlayingCover ? 0 : (hiddenFrames.includes(9) ? 0 : 1), pointerEvents: 'none', transform: 'translateZ(0)', willChange: 'opacity' }} />
                <img src="/cover/10.webp" className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 50, opacity: !isPlayingCover ? 0 : (hiddenFrames.includes(10) ? 0 : 1), pointerEvents: 'none', transform: 'translateZ(0)', willChange: 'opacity' }} />
                <img src="/cover/11.webp" className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 49, opacity: !isPlayingCover ? 0 : (hiddenFrames.includes(11) ? 0 : 1), pointerEvents: 'none', transform: 'translateZ(0)', willChange: 'opacity' }} />
                <img src="/cover/12.webp" className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 48, opacity: !isPlayingCover ? 0 : (hiddenFrames.includes(12) ? 0 : 1), pointerEvents: 'none', transform: 'translateZ(0)', willChange: 'opacity' }} />
                <img src="/cover/13.webp" className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 47, opacity: !isPlayingCover ? 0 : (hiddenFrames.includes(13) ? 0 : 1), pointerEvents: 'none', transform: 'translateZ(0)', willChange: 'opacity' }} />
                <img src="/cover/14.webp" className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 46, opacity: !isPlayingCover ? 0 : (hiddenFrames.includes(14) ? 0 : 1), pointerEvents: 'none', transform: 'translateZ(0)', willChange: 'opacity' }} />
                <img src="/cover/15.webp" className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 45, opacity: !isPlayingCover ? 0 : (hiddenFrames.includes(15) ? 0 : 1), pointerEvents: 'none', transform: 'translateZ(0)', willChange: 'opacity' }} />
                <img src="/cover/16.webp" className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 44, opacity: !isPlayingCover ? 0 : (hiddenFrames.includes(16) ? 0 : 1), pointerEvents: 'none', transform: 'translateZ(0)', willChange: 'opacity' }} />
                <img src="/cover/17.webp" className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 43, opacity: !isPlayingCover ? 0 : (hiddenFrames.includes(17) ? 0 : 1), pointerEvents: 'none', transform: 'translateZ(0)', willChange: 'opacity' }} />
                <img src="/cover/18.webp" className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 42, opacity: !isPlayingCover ? 0 : (hiddenFrames.includes(18) ? 0 : 1), pointerEvents: 'none', transform: 'translateZ(0)', willChange: 'opacity' }} />
                <img src="/cover/19.webp" className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 41, opacity: !isPlayingCover ? 0 : (hiddenFrames.includes(19) ? 0 : 1), pointerEvents: 'none', transform: 'translateZ(0)', willChange: 'opacity' }} />
                <img src="/cover/20.webp" className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 40, opacity: !isPlayingCover ? 0 : (hiddenFrames.includes(20) ? 0 : 1), pointerEvents: 'none', transform: 'translateZ(0)', willChange: 'opacity' }} />
                <img src="/cover/21.webp" className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 39, opacity: !isPlayingCover ? 0 : (hiddenFrames.includes(21) ? 0 : 1), pointerEvents: 'none', transform: 'translateZ(0)', willChange: 'opacity' }} />
                <img src="/cover/22.webp" className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 38, opacity: !isPlayingCover ? 0 : (hiddenFrames.includes(22) ? 0 : 1), pointerEvents: 'none', transform: 'translateZ(0)', willChange: 'opacity' }} />
                <img src="/cover/23.webp" className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 37, opacity: !isPlayingCover ? 0 : (hiddenFrames.includes(23) ? 0 : 1), pointerEvents: 'none', transform: 'translateZ(0)', willChange: 'opacity' }} />
                <img src="/cover/24.webp" className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 36, opacity: !isPlayingCover ? 0 : (hiddenFrames.includes(24) ? 0 : 1), pointerEvents: 'none', transform: 'translateZ(0)', willChange: 'opacity' }} />
                <img src="/cover/25.webp" className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 35, opacity: !isPlayingCover ? 0 : (hiddenFrames.includes(25) ? 0 : 1), pointerEvents: 'none', transform: 'translateZ(0)', willChange: 'opacity' }} />
                <img src="/cover/26.webp" className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 34, opacity: !isPlayingCover ? 0 : (hiddenFrames.includes(26) ? 0 : 1), pointerEvents: 'none', transform: 'translateZ(0)', willChange: 'opacity' }} />
                <img src="/cover/27.webp" className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 33, opacity: !isPlayingCover ? 0 : (hiddenFrames.includes(27) ? 0 : 1), pointerEvents: 'none', transform: 'translateZ(0)', willChange: 'opacity' }} />
                <img src="/cover/28.webp" className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 32, opacity: !isPlayingCover ? 0 : (hiddenFrames.includes(28) ? 0 : 1), pointerEvents: 'none', transform: 'translateZ(0)', willChange: 'opacity' }} />
                <img src="/cover/29.webp" className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 31, opacity: !isPlayingCover ? 0 : (hiddenFrames.includes(29) ? 0 : 1), pointerEvents: 'none', transform: 'translateZ(0)', willChange: 'opacity' }} />
                <img src="/cover/30.webp" className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 30, opacity: !isPlayingCover ? 0 : (hiddenFrames.includes(30) ? 0 : 1), pointerEvents: 'none', transform: 'translateZ(0)', willChange: 'opacity' }} />
                <img src="/cover/31.webp" className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 29, opacity: !isPlayingCover ? 0 : (hiddenFrames.includes(31) ? 0 : 1), pointerEvents: 'none', transform: 'translateZ(0)', willChange: 'opacity' }} />
                <img src="/cover/32.webp" className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 28, opacity: !isPlayingCover ? 0 : (hiddenFrames.includes(32) ? 0 : 1), pointerEvents: 'none', transform: 'translateZ(0)', willChange: 'opacity' }} />
                <img src="/cover/33.webp" className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 27, opacity: !isPlayingCover ? 0 : (hiddenFrames.includes(33) ? 0 : 1), pointerEvents: 'none', transform: 'translateZ(0)', willChange: 'opacity' }} />
                <img src="/cover/34.webp" className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 26, opacity: !isPlayingCover ? 0 : (hiddenFrames.includes(34) ? 0 : 1), pointerEvents: 'none', transform: 'translateZ(0)', willChange: 'opacity' }} />
                <img src="/cover/35.webp" className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 25, opacity: !isPlayingCover ? 0 : (hiddenFrames.includes(35) ? 0 : 1), pointerEvents: 'none', transform: 'translateZ(0)', willChange: 'opacity' }} />
                <img src="/cover/36.webp" className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 24, opacity: !isPlayingCover ? 0 : (hiddenFrames.includes(36) ? 0 : 1), pointerEvents: 'none', transform: 'translateZ(0)', willChange: 'opacity' }} />
                <img src="/cover/37.webp" className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 23, opacity: !isPlayingCover ? 0 : (hiddenFrames.includes(37) ? 0 : 1), pointerEvents: 'none', transform: 'translateZ(0)', willChange: 'opacity' }} />
                <img src="/cover/38.webp" className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 22, opacity: !isPlayingCover ? 0 : (hiddenFrames.includes(38) ? 0 : 1), pointerEvents: 'none', transform: 'translateZ(0)', willChange: 'opacity' }} />
                <img src="/cover/39.webp" className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 21, opacity: !isPlayingCover ? 0 : (hiddenFrames.includes(39) ? 0 : 1), pointerEvents: 'none', transform: 'translateZ(0)', willChange: 'opacity' }} />
                <img src="/cover/40.webp" className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 20, opacity: !isPlayingCover ? 0 : (hiddenFrames.includes(40) ? 0 : 1), pointerEvents: 'none', transform: 'translateZ(0)', willChange: 'opacity' }} />
                <img src="/cover/41.webp" className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 19, opacity: !isPlayingCover ? 0 : (hiddenFrames.includes(41) ? 0 : 1), pointerEvents: 'none', transform: 'translateZ(0)', willChange: 'opacity' }} />
                <img src="/cover/42.webp" className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 18, opacity: !isPlayingCover ? 0 : (hiddenFrames.includes(42) ? 0 : 1), pointerEvents: 'none', transform: 'translateZ(0)', willChange: 'opacity' }} />
                <img src="/cover/43.webp" className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 17, opacity: !isPlayingCover ? 0 : (hiddenFrames.includes(43) ? 0 : 1), pointerEvents: 'none', transform: 'translateZ(0)', willChange: 'opacity' }} />
                <img src="/cover/44.webp" className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 16, opacity: !isPlayingCover ? 0 : (hiddenFrames.includes(44) ? 0 : 1), pointerEvents: 'none', transform: 'translateZ(0)', willChange: 'opacity' }} />
                <img src="/cover/45.webp" className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 15, opacity: !isPlayingCover ? 0 : (hiddenFrames.includes(45) ? 0 : 1), pointerEvents: 'none', transform: 'translateZ(0)', willChange: 'opacity' }} />
                <img src="/cover/46.webp" className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 14, opacity: !isPlayingCover ? 0 : (hiddenFrames.includes(46) ? 0 : 1), pointerEvents: 'none', transform: 'translateZ(0)', willChange: 'opacity' }} />
                <img src="/cover/47.webp" className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 13, opacity: !isPlayingCover ? 0 : (hiddenFrames.includes(47) ? 0 : 1), pointerEvents: 'none', transform: 'translateZ(0)', willChange: 'opacity' }} />
                <img src="/cover/48.webp" className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 12, opacity: !isPlayingCover ? 0 : (hiddenFrames.includes(48) ? 0 : 1), pointerEvents: 'none', transform: 'translateZ(0)', willChange: 'opacity' }} />
                <img src="/cover/49.webp" className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 11, opacity: !isPlayingCover ? 0 : (hiddenFrames.includes(49) ? 0 : 1), pointerEvents: 'none', transform: 'translateZ(0)', willChange: 'opacity' }} />
                <img src="/cover/50.webp" className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 10, opacity: !isPlayingCover ? 0 : (hiddenFrames.includes(50) ? 0 : 1), pointerEvents: 'none', transform: 'translateZ(0)', willChange: 'opacity' }} />
                <img src="/cover/51.webp" className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 9, opacity: !isPlayingCover ? 0 : (hiddenFrames.includes(51) ? 0 : 1), pointerEvents: 'none', transform: 'translateZ(0)', willChange: 'opacity' }} />
                <img src="/cover/52.webp" className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 8, opacity: !isPlayingCover ? 0 : (hiddenFrames.includes(52) ? 0 : 1), pointerEvents: 'none', transform: 'translateZ(0)', willChange: 'opacity' }} />
                <img src="/cover/53.webp" className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 7, opacity: !isPlayingCover ? 0 : (hiddenFrames.includes(53) ? 0 : 1), pointerEvents: 'none', transform: 'translateZ(0)', willChange: 'opacity' }} />
                <img src="/cover/54.webp" className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 6, opacity: !isPlayingCover ? 0 : (hiddenFrames.includes(54) ? 0 : 1), pointerEvents: 'none', transform: 'translateZ(0)', willChange: 'opacity' }} />
                <img src="/cover/55.webp" className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 5, opacity: !isPlayingCover ? 0 : (hiddenFrames.includes(55) ? 0 : 1), pointerEvents: 'none', transform: 'translateZ(0)', willChange: 'opacity' }} />
                <img src="/cover/56.webp" className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 4, opacity: !isPlayingCover ? 0 : (hiddenFrames.includes(56) ? 0 : 1), pointerEvents: 'none', transform: 'translateZ(0)', willChange: 'opacity' }} />
                <img src="/cover/57.webp" className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 3, opacity: !isPlayingCover ? 0 : (hiddenFrames.includes(57) ? 0 : 1), pointerEvents: 'none', transform: 'translateZ(0)', willChange: 'opacity' }} />
                <img src="/cover/58.webp" className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 2, opacity: !isPlayingCover ? 0 : (hiddenFrames.includes(58) ? 0 : 1), pointerEvents: 'none', transform: 'translateZ(0)', willChange: 'opacity' }} />
                <img src="/cover/59.webp" className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 1, opacity: !isPlayingCover ? 0 : (hiddenFrames.includes(59) ? 0 : 1), pointerEvents: 'none', transform: 'translateZ(0)', willChange: 'opacity' }} />
              </div>

              {/* Button overlay - only show when not playing */}
              {!isPlayingCover && (
                <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ zIndex: 100 }}>
                  <h1 className="text-5xl font-serif font-bold text-red-100 text-center mb-6">CARTIER</h1>
                  <h2 className="text-3xl font-serif font-bold text-red-100 text-center mb-12">Valentine's Card</h2>
                  <button
                    onClick={handleStartCoverAnimation}
                    className="px-8 py-4 bg-red-600 hover:bg-red-700 text-white rounded font-serif text-lg"
                  >
                    คลิกเพื่อรังสรรค์การ์ดอวยพร
                  </button>
                </div>
              )}
            </div>
          )}
        
      {/* Step 1: Product Selection */}
      {currentStep === 1 && (
        <>
          <div className="mb-4">
            <h1 className="text-3xl font-serif font-bold text-red-100 text-center">
              CARTIER V-DAY
            </h1>
            <div className="h-1 w-32 bg-gradient-to-r from-red-400 to-red-300 mx-auto mt-2" />
          </div>

          <div className="flex-1 flex items-center justify-center mb-4">
            <HTMLFlipBook
              ref={bookRef}
              width={400}
              height={500}
              size="fixed"
              minWidth={300}
              maxWidth={600}
              minHeight={400}
              maxHeight={700}
              showCover={false}
              flippingTime={1000}
              usePortrait
              mobileScrollSupport={false}
              drawShadow
              clickEventForward
              useMouseEvents={false}
              swipeDistance={0}
              maxShadowOpacity={0.5}
              startZIndex={1}
              autoSize={false}
              style={{}}
              startPage={1}
              showPageCorners
              disableFlipByClick={false}
              onInit={handleInit}
              onFlip={(e: any) => setPage(e.data)}
              className="shadow-2xl"
            >
              <PageCover>CARTIER</PageCover>

              {PAGES_DATA.map((pageData, idx) => (
                <Page
                  key={idx}
                  number={idx + 1}
                  title={pageData.title}
                  imageUrl={pageData.imageUrl}
                >
                  <h4 className="font-bold mb-2">{pageData.content.heading}</h4>
                  {pageData.content.text.map((p, i) => (
                    <p key={i} className="mb-2">
                      {p}
                    </p>
                  ))}
                </Page>
              ))}

              <PageCover>THE END</PageCover>
            </HTMLFlipBook>
          </div>

          <div className="flex gap-4 items-center justify-center mb-4">
            <button
              onClick={() => bookRef.current?.pageFlip().flipPrev("top")}
              hidden={page <= 1}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-stone-600 text-white rounded font-serif text-sm"
            >
              ← Previous
            </button>
            <span className="text-red-100 font-serif min-w-20 text-center">
              [{page} of {totalPage - 2}]
            </span>
            <button
              onClick={() => bookRef.current?.pageFlip().flipNext("top")}
              hidden={page >= totalPage - 2}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-stone-600 text-white rounded font-serif text-sm"
            >
              Next →
            </button>
          </div>

          <button
            onClick={handleConfirmStep1}
            className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-serif"
          >
            ตกลง
          </button>
        </>
      )}

      {/* Step 2: Form Input */}
      {currentStep === 2 && getSelectedProductData() && (
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-serif font-bold text-red-100 text-center mb-6">
            กรอกข้อมูลของคุณ
          </h1>

          <div className="bg-stone-800/50 border border-red-600 rounded p-6 space-y-4">
            <div>
              <label className="block text-red-100 font-serif text-sm mb-2">
                To:
              </label>
              <input
                type="text"
                value={formData.to}
                onChange={(e) =>
                  setFormData({ ...formData, to: e.target.value })
                }
                className="w-full px-3 py-2 bg-stone-900 border border-red-600 text-red-100 rounded font-serif text-sm"
              />
            </div>

            <div>
              <label className="block text-red-100 font-serif text-sm mb-2">
                From:
              </label>
              <input
                type="text"
                value={formData.from}
                onChange={(e) =>
                  setFormData({ ...formData, from: e.target.value })
                }
                className="w-full px-3 py-2 bg-stone-900 border border-red-600 text-red-100 rounded font-serif text-sm"
              />
            </div>

            <div>
              <label className="block text-red-100 font-serif text-sm mb-2">
                Message (limit 50 ตัวอักษร):
              </label>
              <div className="relative">
                <textarea
                  value={formData.message}
                  onChange={(e) => {
                    const text = e.target.value;
                    if (text.length <= 50) {
                      setFormData({ ...formData, message: text });
                    }
                  }}
                  maxLength={50}
                  className="w-full px-3 bg-stone-900 border border-red-600 text-red-100 rounded font-serif text-sm h-24 resize-none text-center flex items-center justify-center"
                  style={{ paddingTop: "2.5rem", paddingBottom: "2.5rem" }}
                />
              </div>
              <div className="text-amber-100 text-xs mt-1">
                {formData.message.length}/50
              </div>
            </div>
          </div>

          <div className="flex gap-4 justify-center mt-6">
            <button
              onClick={handleBackStep2}
              className="px-6 py-2 bg-stone-600 hover:bg-stone-700 text-white rounded font-serif"
            >
              กลับ
            </button>
            <button
              onClick={handleConfirmStep2}
              disabled={!formData.to || !formData.from || !formData.message}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-stone-600 disabled:cursor-not-allowed text-white rounded font-serif"
            >
              ยืนยัน
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Display Result (merged image) */}
      {currentStep === 3 && getSelectedProductData() && (
        <div className="w-full max-w-md">
          {(merging || !cardImageDataUrl) ? (
            <div className="flex flex-col items-center justify-center gap-4 py-24">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-red-600 border-t-red-100" />
              <p className="text-red-100 font-serif text-lg">กำลังสร้างการ์ด...</p>
            </div>
          ) : (
            <>
              <h1 className="text-3xl font-serif font-bold text-red-100 text-center mb-6">
                การ์ดของคุณ
              </h1>

              {cardImageDataUrl && (
                <div className="mb-6">
                  <img 
                    src={cardImageDataUrl}
                    alt="Valentine Card"
                    className="w-full rounded overflow-hidden border border-red-600"
                  />
                </div>
              )}

              <div className="flex gap-4 justify-center mt-6">
                <button
                  onClick={handleBackStep3}
                  className="px-6 py-2 bg-stone-600 hover:bg-stone-700 text-white rounded font-serif"
                >
                  กลับ
                </button>
                <button 
                  onClick={handleSave}
                  disabled={!cardImageDataUrl}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-stone-600 text-white rounded font-serif"
                >
                  บันทึก
                </button>
                <button 
                  onClick={handleShare}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-serif"
                >
                  แชร์ให้เพื่อน
                </button>
              </div>
            </>
          )}
        </div>
      )}
        </>
      )}
    </div>
  );
}
