"use client";

import React, { useRef, useState, useCallback, PropsWithChildren, Suspense } from "react";
import HTMLFlipBook from "react-pageflip";
import { useLiff } from "@/hooks/useLiff";
import * as gtag from "@/lib/gtag";
import { useSearchParams } from "next/navigation";

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
  ({ number, title, imageUrl }, ref) => (
    <div
      ref={ref}
      className="relative w-full h-full bg-[#f8e9e2]"
    >
      <div className="absolute inset-0 flex items-center justify-center">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title || `Page ${number}`}
            className="max-w-[70%] max-h-[70%] object-contain"
          />
        ) : (
          <div className="w-52 h-52 bg-[#f1dcd1] rounded flex items-center justify-center">
            <span className="text-red-600 text-xs font-serif text-center">
              Image {number}
            </span>
          </div>
        )}
      </div>
    </div>
  )
);
Page.displayName = "Page";

const assetPaths = (fileName: string) => ({
  productImage: `/step1/${fileName}`,
  messageBg: `/step2/${fileName}`,
  cardImage: `/step3/${fileName}`,
});

const PAGES_DATA = [
  {
    title: "Cartier Rings",
    fileName: "ring.webp",
    content: { heading: "", text: [] },
  },
  {
    title: "Cartier Bracelets",
    fileName: "bracelet.webp",
    content: { heading: "", text: [] },
  },
  {
    title: "Cartier Watches",
    fileName: "watche.webp",
    content: { heading: "", text: [] },
  },
  {
    title: "Cartier Perfumes",
    fileName: "perfume.webp",
    content: { heading: "", text: [] },
  },
].map((item) => ({
  ...item,
  ...assetPaths(item.fileName),
}));

function HomeContent() {
  const searchParams = useSearchParams();
  const isDesignMode = (searchParams?.get("mode") || "").toLowerCase() === "design";

  const bookRef = useRef<any>(null);
  const [page, setPage] = useState(0);
  const [totalPage, setTotalPage] = useState(0);
  const [productIndex, setProductIndex] = useState(1);
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
  const [showBadWordModal, setShowBadWordModal] = useState(false);

  // Cover animation state
  const [hiddenFrames, setHiddenFrames] = useState<number[]>([]); // frames that are hidden
  const [isPlayingCover, setIsPlayingCover] = useState(false);
  const [coverAnimationDone, setCoverAnimationDone] = useState(false);
  const TOTAL_COVER_FRAMES = 59;

  const { liffReady, profile, error: liffError } = useLiff({ skipInit: isDesignMode });

  React.useEffect(() => {
    if (profile) {
      console.log("LINE profile", profile);
    }
  }, [profile]);

  // Auto login if not logged in
  React.useEffect(() => {
    if (isDesignMode) return;
    if (liffReady && typeof window !== 'undefined' && window.liff) {
      if (!window.liff.isLoggedIn()) {
        console.log('User not logged in, redirecting to LINE login...');
        window.liff.login();
      }
    }
  }, [isDesignMode, liffReady]);

  // Minimum 3 second loading time
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setMinLoadingTime(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Preload all images
  React.useEffect(() => {
    Promise.all(PAGES_DATA.flatMap(p => {
      const productImg = new Image();
      productImg.src = p.productImage;

      const bgImg = new Image();
      bgImg.src = p.messageBg;

      const cardImg = new Image();
      cardImg.src = p.cardImage;

      return [productImg, bgImg, cardImg].map(img => new Promise(resolve => {
        img.onload = img.onerror = resolve;
      }));
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

  const containsBadWords = useCallback((text: string): boolean => {
    return badWords.some(w => new RegExp(w, "gi").test(text));
  }, []);

  const handleInit = () => {
    const pf = bookRef.current?.pageFlip();
    if (pf) {
      setTotalPage(pf.getPageCount());
      const current = pf.getCurrentPageIndex();
      setPage(current);
      if (current >= 1 && current <= PAGES_DATA.length) {
        setProductIndex(current);
      }
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
    if (productIndex >= 1 && productIndex <= 4) {
      setSelectedProduct(productIndex);
      trackingMap[productIndex]?.();
      setCurrentStep(2);
    }
  }, [productIndex]);

  const handleBackStep2 = useCallback(() => setCurrentStep(1), []);

  const handleConfirmStep2 = () => {
    if (formData.to && formData.from && formData.message) {
      if (
        containsBadWords(formData.to) ||
        containsBadWords(formData.from) ||
        containsBadWords(formData.message)
      ) {
        setShowBadWordModal(true);
        return;
      }

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
      const imageUrl = getSelectedProductData()!.cardImage!;
      
      // Load the image
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        // Create canvas - clean white card without border
        const canvas = document.createElement('canvas');
        canvas.width = 500;
        canvas.height = 700;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Draw white background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 500, 700);

        // Draw Cartier logo
        ctx.fillStyle = '#2c2c2c';
        ctx.font = 'italic 42px serif';
        ctx.textAlign = 'center';
        ctx.fillText('Cartier', 250, 60);

        // Draw product image
        ctx.drawImage(img, 40, 90, 420, 420);

        // Draw text below image
        ctx.fillStyle = '#2c2c2c';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;

        // To / Message / From with balanced vertical spacing
        const toY = 540;
        const spacingToMsg = 50;
        const lineHeight = 24;
        const spacingMsgFrom = 50;

        ctx.font = 'bold 18px sans-serif';
        ctx.fillText(`To. ${formData.to}`, 250, toY);

        const messageLines = (formData.message || '').split('\n');
        const messageStartY = toY + spacingToMsg;
        const lastLineY = messageStartY + (messageLines.length - 1) * lineHeight;

        ctx.font = '16px sans-serif';
        messageLines.forEach((line, idx) => {
          ctx.fillText(line, 250, messageStartY + idx * lineHeight);
        });

        ctx.font = 'bold 18px sans-serif';
        ctx.fillText(`From. ${formData.from}`, 250, lastLineY + spacingMsgFrom);

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

  const selectedProductData = getSelectedProductData();

  // Fullscreen background for step 2 on mobile
  const pageBgStyle = currentStep === 2 && selectedProductData
    ? {
        backgroundImage: `linear-gradient(180deg, rgba(20,16,14,0.7), rgba(20,16,14,0.9)), url(${selectedProductData.messageBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }
    : {};

  const readyForMain = imagesLoaded && coverFramesLoaded && !minLoadingTime && (isDesignMode || (liffReady && profile));

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-stone-900 to-stone-800 py-6 px-4 flex flex-col items-center justify-center"
      style={pageBgStyle}
    >
      {showBadWordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="relative w-80 max-w-sm bg-black border border-white/80 rounded shadow-2xl px-8 py-8 text-center">
            <button
              aria-label="Close"
              onClick={() => setShowBadWordModal(false)}
              className="absolute right-4 top-3 text-white hover:text-white/70 text-2xl"
            >
              ×
            </button>
            <h2 className="text-2xl font-serif font-bold mb-4 text-white">ขออภัย!</h2>
            <p className="text-base leading-relaxed text-white font-serif">
              ข้อความของคุณมีคำที่ไม่เหมาะสม<br />กรุณาพิมพ์ข้อความใหม่
            </p>
          </div>
        </div>
      )}
      {/* Loading Screen */}
      {!readyForMain && (
        <div className="flex flex-col items-center justify-center h-screen gap-6">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-red-600 border-t-red-100" />
            <p className="text-red-100 font-serif text-lg">Loading...</p>
          </div>
        </div>
      )}

      {/* Main App */}
      {readyForMain && (
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
              onFlip={(e: any) => {
                const nextPage = e.data;
                setPage(nextPage);
                if (nextPage >= 1 && nextPage <= PAGES_DATA.length) {
                  setProductIndex(nextPage);
                }
              }}
              className="shadow-2xl"
            >
              <PageCover>CARTIER</PageCover>

              {PAGES_DATA.map((pageData, idx) => (
                <Page
                  key={idx}
                  number={idx + 1}
                  title={pageData.title}
                  imageUrl={pageData.productImage}
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
            className="px-10 py-2.5 font-serif text-base text-white border border-white/80 rounded-sm bg-stone-900/40 hover:bg-white/10 shadow-[0_0_0_1px_rgba(255,255,255,0.2)] transition"
          >
            ตกลง
          </button>
        </>
      )}

      {/* Step 2: Form Input */}
      {currentStep === 2 && selectedProductData && (
        <div className="w-full max-w-md flex flex-col justify-between min-h-[520px]">
          <div className="px-7 pt-8 pb-4">
            <h1 className="font-serif font-bold text-white text-center mb-6">
              โปรดใส่ข้อความของคุณด้านล่าง
            </h1>

            <div className="space-y-6 text-white">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-base font-serif text-white">
                  <span className="font-semibold">To</span>
                  <span className="opacity-80">:</span>
                  <input
                    type="text"
                    placeholder="ใส่ชื่อผู้รับ"
                    value={formData.to}
                    onChange={(e) => setFormData({ ...formData, to: e.target.value })}
                    className="flex-1 bg-transparent text-white placeholder-white/70 border-b border-white/70 pb-2 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-base font-serif text-white">
                  <span className="font-semibold">From</span>
                  <span className="opacity-80">:</span>
                  <input
                    type="text"
                    placeholder="ใส่ชื่อผู้ส่ง"
                    value={formData.from}
                    onChange={(e) => setFormData({ ...formData, from: e.target.value })}
                    className="flex-1 bg-transparent text-white placeholder-white/70 border-b border-white/70 pb-2 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <span>Message</span>
                  <span className="opacity-80">:</span>
                  <span className="text-xs font-medium opacity-80">( จำกัดข้อความไม่เกิน 50 ตัวอักษร )</span>
                </div>
                <input
                  type="text"
                  value={formData.message}
                  placeholder="พิมพ์ข้อความของคุณที่นี่"
                  onChange={(e) => {
                    const text = e.target.value;
                    if (text.length <= 50) {
                      setFormData({ ...formData, message: text });
                    }
                  }}
                  maxLength={50}
                  className="w-full bg-transparent text-white placeholder-white/70 border-b border-white/70 pb-2 pt-3 focus:outline-none font-serif text-base text-center"
                />
                <div className="text-amber-100 text-xs">
                  {formData.message.length}/50
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4 justify-center px-7 pb-7">
            <button
              onClick={handleBackStep2}
              className="px-6 py-2.5 font-serif text-base text-white border border-white/80 rounded-sm bg-stone-900/40 hover:bg-white/10 shadow-[0_0_0_1px_rgba(255,255,255,0.2)] transition flex items-center gap-2"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-90"><path d="M15 18l-6-6 6-6"/><path d="M21 12H9"/></svg>
              <span>กลับ</span>
            </button>
            <button
              onClick={handleConfirmStep2}
              disabled={!formData.to || !formData.from || !formData.message}
              className="px-6 py-2.5 font-serif text-base text-white border border-white/80 rounded-sm bg-stone-900/40 hover:bg-white/10 shadow-[0_0_0_1px_rgba(255,255,255,0.2)] transition flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <span>เรียบร้อย</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-90"><path d="M9 18l6-6-6-6"/><path d="M3 12h12"/></svg>
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
              {cardImageDataUrl && (
                <div className="mb-6">
                  <img 
                    src={cardImageDataUrl}
                    alt="Valentine Card"
                    className="w-full rounded overflow-hidden"
                  />
                </div>
              )}

              <div className="flex gap-3 justify-center mt-6 text-base font-serif">
                <button
                  onClick={handleBackStep3}
                  className="px-8 py-2.5 bg-stone-900/40 hover:bg-white/10 text-white rounded-sm border border-white/80 shadow-[0_0_0_1px_rgba(255,255,255,0.2)] transition flex items-center gap-2"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-90"><path d="M15 18l-6-6 6-6"/></svg>
                  <span>กลับ</span>
                </button>
                <button 
                  onClick={handleSave}
                  disabled={!cardImageDataUrl}
                  className="px-8 py-2.5 bg-stone-900/40 hover:bg-white/10 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-sm border border-white/80 shadow-[0_0_0_1px_rgba(255,255,255,0.2)] transition flex items-center gap-2"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-90"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  <span>บันทึก</span>
                </button>
                <button 
                  onClick={handleShare}
                  className="px-8 py-2.5 bg-stone-900/40 hover:bg-white/10 text-white rounded-sm border border-white/80 shadow-[0_0_0_1px_rgba(255,255,255,0.2)] transition flex items-center gap-2"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-90"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.59 13.51l6.83 3.98"/><path d="M15.41 6.51 8.59 10.49"/></svg>
                  <span>แชร์</span>
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

export default function Home() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center h-screen gap-6">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-red-600 border-t-red-100" />
          <p className="text-red-100 font-serif text-lg">Loading...</p>
        </div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
