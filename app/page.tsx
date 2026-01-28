"use client";

import React, { useRef, useState, useCallback, PropsWithChildren, Suspense, useEffect, useLayoutEffect } from "react";
import HTMLFlipBook from "react-pageflip";
import { useLiff } from "@/hooks/useLiff";
import * as gtag from "@/lib/gtag";
import { useSearchParams } from "next/navigation";
import { assetPrefixFullUrl } from '@/lib/setUrl';

// Extend Window type for LIFF
interface LiffType {
  login: () => void;
  isLoggedIn: () => boolean;
  isInClient: () => boolean;
  shareTargetPicker: (messages: Array<{type: string; originalContentUrl: string; previewImageUrl: string}>, options?: {isMultiple?: boolean}) => Promise<{length: number} | null>;
  sendMessages: (messages: Array<{type: string; originalContentUrl: string; previewImageUrl: string}>) => Promise<void>;
}

declare global {
  interface Window {
    liff: LiffType;
  }
}

const PageCover = React.forwardRef<HTMLDivElement, PropsWithChildren>(
  ({ children }, ref) => (
    <div
      ref={ref}
      data-density="hard"
      className="!w-full !h-full bg-[#f8e9e2] flex items-center justify-center overflow-hidden"
    >
      <h2 className="text-5xl font-NotoSansThai font-bold text-stone-800 text-center">
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
      className="page-root !w-full !h-full "
    >
      <div className="relative w-full h-full flex items-center justify-center">
        {imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={title || `Page ${number}`}
            className="w-full h-full object-fill"
          />
        )}
      </div>
    </div>
  )
);
Page.displayName = "Page";

const assetPaths = (fileName: string) => ({
  productImage: assetPrefixFullUrl(`/step1/${fileName}`),
  messageBg: assetPrefixFullUrl(`/step2/${fileName}`),
  cardImage: assetPrefixFullUrl(`/step3/${fileName}`),
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

  // Helper to get asset URL with prefix
  const getAssetUrl = (path: string) => assetPrefixFullUrl(path);

  const bookRef = useRef<{pageFlip: () => {getPageCount: () => number; getCurrentPageIndex: () => number; turnToPage: (page: number) => void; flipPrev: (direction: string) => void; flipNext: (direction: string) => void; flip: (page: number) => void}} | null>(null);
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
  const TOTAL_COVER_FRAMES = 59;

  const { liffReady, profile } = useLiff({ skipInit: isDesignMode });

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
        img.src = assetPrefixFullUrl(`/cover/${i}.webp`);
      }));
    }
    Promise.all(framePromises).then(() => setCoverFramesLoaded(true));
  }, []);

  const handleStartCoverAnimation = () => {
    gtag.trackEngagedUser();
    setHiddenFrames([]); // Reset hidden frames
    setIsPlayingCover(true);
  };

  const containsBadWords = useCallback((text: string): boolean => {
    const badWords = ["ไอ้","อี","มึง​","กู","ชั่ว","เลว","ควาย","เหี้ย","สัตว์","ไม่ดี","หยาบคาย","shit","damn","hell","fuck","bitch","ค*ย","ห*ี","แ*ตด","เย็*ด"];
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

  const handleConfirmStep1 = useCallback(() => {
    const trackingMap: Record<number, () => void> = {
      1: gtag.trackRingsSelected,
      2: gtag.trackBraceletsSelected,
      3: gtag.trackWatchesSelected,
      4: gtag.trackPerfumesSelected,
    };
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
        canvas.height = 840;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Draw white background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 500, 840);

        // Draw Cartier logo
        ctx.fillStyle = '#2c2c2c';
        ctx.font = 'italic 52px serif';
        ctx.textAlign = 'center';
        ctx.fillText('Cartier', 250, 60);

        // Draw product image
        ctx.drawImage(img, 40, 90, 420, 560);

        // Draw text below image
        ctx.fillStyle = '#2c2c2c';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;

        // To / Message / From with balanced vertical spacing
        const toY = 700;
        const spacingToMsg = 50;
        const lineHeight = 24;
        const spacingMsgFrom = 50;

        ctx.font = 'bold 20px font-NotoSansThai';
        ctx.fillText(`To. ${formData.to}`, 250, toY);

        const messageLines = (formData.message || '').split('\n');
        const messageStartY = toY + spacingToMsg;
        const lastLineY = messageStartY + (messageLines.length - 1) * lineHeight;

        ctx.font = '22px font-NotoSansThai';
        messageLines.forEach((line, idx) => {
          ctx.fillText(line, 250, messageStartY + idx * lineHeight);
        });

        ctx.font = 'bold 20px font-NotoSansThai';
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
        } catch (error: unknown) {
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
        } catch (error: unknown) {
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


  const [showSecond, setShowSecond] = useState(false);
  useEffect(() => {
    const img = new Image();
    img.src = getAssetUrl("/step1/select_bg.webp");
    
    const timer = setTimeout(() => setShowSecond(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  const [actualSize, setActualSize] = useState({ width: 0, height: 0 });
  const [isReady, setIsReady] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const updateSize = () => {
      let finalW = 0;
      let finalH = 0;

      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        if (rect.width >= 448) {
          finalW = 448; 
        } else {
          finalW = Math.ceil(rect.width); 
        }    
        finalH = Math.ceil(rect.height);
      }

      if (finalW === 0 || finalH === 0) {
        const vh = window.innerHeight;
        const vw = window.innerWidth;
        finalH = Math.ceil(vh * 0.70); 
        
        if(window.innerWidth >= 375 && window.innerWidth < 448 ) {
          if((window.innerHeight >= 750)){
            finalW = Math.ceil(vw * 1);
          } else {
            finalW = Math.ceil(vw * 0.89);
          }
        } else if((window.innerWidth >= 400 && window.innerWidth < 448 )) {
          if((window.innerHeight >= 800)){
            finalW = Math.ceil(vw * 1);
          } else {
            finalW = Math.ceil(vw * 0.89);
          }
        } else if((window.innerWidth >= 448) && window.innerWidth < 768 ) {
            finalW = 448;
        } else if((window.innerWidth >= 768) && window.innerWidth < 820) {
            finalW = Math.ceil(600 * 0.89);
        } else if((window.innerWidth >= 820) && window.innerWidth < 1025) {
            finalW = Math.ceil(600 * 0.98);
        } else if((window.innerWidth >= 1536)) {
            finalW = Math.ceil(500 * 0.89);
        }
        else {
          finalW = Math.ceil(600 * 0.89); 
        }
      }

      if (finalW > 0 && finalH > 0) {
        setActualSize({ width: finalW, height: finalH });

        document.documentElement.style.setProperty('--book-w', `${finalW}px`);
        document.documentElement.style.setProperty('--book-h', `${finalH}px`);
        
        setIsReady(true);
        console.log("📏 [Box Green Size]:", finalW, "x", finalH);
      }
    };

    const observer = new ResizeObserver(() => {
      window.requestAnimationFrame(updateSize);
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    updateSize();

    const timer = setTimeout(updateSize, 150);
    window.addEventListener('resize', updateSize);
    
    return () => {
      observer.disconnect();
      clearTimeout(timer);
      window.removeEventListener('resize', updateSize);
    };
  }, [showSecond]); 

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center"
      style={pageBgStyle}
    >
      {showBadWordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="relative w-80 max-w-sm border border-white/50 shadow-2xl px-8 py-8 text-center bg-black/10">
            <button
              aria-label="Close"
              onClick={() => setShowBadWordModal(false)}
              className="absolute right-3 top-3 text-white hover:text-white/70 text-2xl"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={getAssetUrl("/icons/close.webp")} className="w-[14px] h-auto" alt="Close" />
            </button>
            <h2 className="text-2xl font-NotoSansThai font-bold mb-4 text-white">ขออภัย!</h2>
            <p className="text-base leading-relaxed text-white font-NotoSansThai">
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
            <p className="text-red-100 font-NotoSansThai text-lg">Loading...</p>
          </div>
        </div>
      )}

      {/* Main App */}
      {readyForMain && (
        <>
          {/* Step 0: Welcome Screen */}
          {currentStep === 0 && (
            <div className="flex flex-col items-center justify-center h-screen w-full relative">
              {/* Stack all frames - always rendered, hidden by opacity */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <div className="relative w-full h-full">
                <img src={getAssetUrl("/cover/1.webp")} className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 59, opacity: !isPlayingCover ? 0 : (hiddenFrames.includes(1) ? 0 : 1), pointerEvents: 'none', transform: 'translateZ(0)', willChange: 'opacity' }} alt="" />
                <img src={getAssetUrl("/cover/2.webp")} className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 58, opacity: !isPlayingCover ? 0 : (hiddenFrames.includes(2) ? 0 : 1), pointerEvents: 'none', transform: 'translateZ(0)', willChange: 'opacity' }} alt="" />
                <img src={getAssetUrl("/cover/3.webp")} className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 57, opacity: !isPlayingCover ? 0 : (hiddenFrames.includes(3) ? 0 : 1), pointerEvents: 'none', transform: 'translateZ(0)', willChange: 'opacity' }} alt="" />
                <img src={getAssetUrl("/cover/4.webp")} className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 56, opacity: !isPlayingCover ? 0 : (hiddenFrames.includes(4) ? 0 : 1), pointerEvents: 'none', transform: 'translateZ(0)', willChange: 'opacity' }} alt="" />
                <img src={getAssetUrl("/cover/5.webp")} className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 55, opacity: !isPlayingCover ? 0 : (hiddenFrames.includes(5) ? 0 : 1), pointerEvents: 'none', transform: 'translateZ(0)', willChange: 'opacity' }} alt="" />
                <img src={getAssetUrl("/cover/6.webp")} className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 54, opacity: !isPlayingCover ? 0 : (hiddenFrames.includes(6) ? 0 : 1), pointerEvents: 'none', transform: 'translateZ(0)', willChange: 'opacity' }} alt="" />
                <img src={getAssetUrl("/cover/7.webp")} className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 53, opacity: !isPlayingCover ? 0 : (hiddenFrames.includes(7) ? 0 : 1), pointerEvents: 'none', transform: 'translateZ(0)', willChange: 'opacity' }} alt="" />
                <img src={getAssetUrl("/cover/8.webp")} className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 52, opacity: !isPlayingCover ? 0 : (hiddenFrames.includes(8) ? 0 : 1), pointerEvents: 'none', transform: 'translateZ(0)', willChange: 'opacity' }} alt="" />
                <img src={getAssetUrl("/cover/9.webp")} className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 51, opacity: !isPlayingCover ? 0 : (hiddenFrames.includes(9) ? 0 : 1), pointerEvents: 'none', transform: 'translateZ(0)', willChange: 'opacity' }} alt="" />
                <img src={getAssetUrl("/cover/10.webp")} className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 50, opacity: !isPlayingCover ? 0 : (hiddenFrames.includes(10) ? 0 : 1), pointerEvents: 'none', transform: 'translateZ(0)', willChange: 'opacity' }} alt="" />
                <img src={getAssetUrl("/cover/11.webp")} className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 49, opacity: !isPlayingCover ? 0 : (hiddenFrames.includes(11) ? 0 : 1), pointerEvents: 'none', transform: 'translateZ(0)', willChange: 'opacity' }} alt="" />
                <img src={getAssetUrl("/cover/12.webp")} className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 48, opacity: !isPlayingCover ? 0 : (hiddenFrames.includes(12) ? 0 : 1), pointerEvents: 'none', transform: 'translateZ(0)', willChange: 'opacity' }} alt="" />
                <img src={getAssetUrl("/cover/13.webp")} className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 47, opacity: !isPlayingCover ? 0 : (hiddenFrames.includes(13) ? 0 : 1), pointerEvents: 'none', transform: 'translateZ(0)', willChange: 'opacity' }} alt="" />
                <img src={getAssetUrl("/cover/14.webp")} className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 46, opacity: !isPlayingCover ? 0 : (hiddenFrames.includes(14) ? 0 : 1), pointerEvents: 'none', transform: 'translateZ(0)', willChange: 'opacity' }} alt="" />
                <img src={getAssetUrl("/cover/15.webp")} className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 45, opacity: !isPlayingCover ? 0 : (hiddenFrames.includes(15) ? 0 : 1), pointerEvents: 'none', transform: 'translateZ(0)', willChange: 'opacity' }} alt="" />
                <img src={getAssetUrl("/cover/16.webp")} className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 44, opacity: !isPlayingCover ? 0 : (hiddenFrames.includes(16) ? 0 : 1), pointerEvents: 'none', transform: 'translateZ(0)', willChange: 'opacity' }} alt="" />
                <img src={getAssetUrl("/cover/17.webp")} className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 43, opacity: !isPlayingCover ? 0 : (hiddenFrames.includes(17) ? 0 : 1), pointerEvents: 'none', transform: 'translateZ(0)', willChange: 'opacity' }} alt="" />
                <img src={getAssetUrl("/cover/18.webp")} className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 42, opacity: !isPlayingCover ? 0 : (hiddenFrames.includes(18) ? 0 : 1), pointerEvents: 'none', transform: 'translateZ(0)', willChange: 'opacity' }} alt="" />
                <img src={getAssetUrl("/cover/19.webp")} className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 41, opacity: !isPlayingCover ? 0 : (hiddenFrames.includes(19) ? 0 : 1), pointerEvents: 'none', transform: 'translateZ(0)', willChange: 'opacity' }} alt="" />
                <img src={getAssetUrl("/cover/20.webp")} className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 40, opacity: !isPlayingCover ? 0 : (hiddenFrames.includes(20) ? 0 : 1), pointerEvents: 'none', transform: 'translateZ(0)', willChange: 'opacity' }} alt="" />
                <img src={getAssetUrl("/cover/21.webp")} className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 39, opacity: !isPlayingCover ? 0 : (hiddenFrames.includes(21) ? 0 : 1), pointerEvents: 'none', transform: 'translateZ(0)', willChange: 'opacity' }} alt="" />
                <img src={getAssetUrl("/cover/22.webp")} className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 38, opacity: !isPlayingCover ? 0 : (hiddenFrames.includes(22) ? 0 : 1), pointerEvents: 'none', transform: 'translateZ(0)', willChange: 'opacity' }} alt="" />
                <img src={getAssetUrl("/cover/23.webp")} className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 37, opacity: !isPlayingCover ? 0 : (hiddenFrames.includes(23) ? 0 : 1), pointerEvents: 'none', transform: 'translateZ(0)', willChange: 'opacity' }} alt="" />
                <img src={getAssetUrl("/cover/24.webp")} className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 36, opacity: !isPlayingCover ? 0 : (hiddenFrames.includes(24) ? 0 : 1), pointerEvents: 'none', transform: 'translateZ(0)', willChange: 'opacity' }} alt="" />
                <img src={getAssetUrl("/cover/25.webp")} className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 35, opacity: !isPlayingCover ? 0 : (hiddenFrames.includes(25) ? 0 : 1), pointerEvents: 'none', transform: 'translateZ(0)', willChange: 'opacity' }} alt="" />
                <img src={getAssetUrl("/cover/26.webp")} className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 34, opacity: !isPlayingCover ? 0 : (hiddenFrames.includes(26) ? 0 : 1), pointerEvents: 'none', transform: 'translateZ(0)', willChange: 'opacity' }} alt="" />
                <img src={getAssetUrl("/cover/27.webp")} className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 33, opacity: !isPlayingCover ? 0 : (hiddenFrames.includes(27) ? 0 : 1), pointerEvents: 'none', transform: 'translateZ(0)', willChange: 'opacity' }} alt="" />
                <img src={getAssetUrl("/cover/28.webp")} className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 32, opacity: !isPlayingCover ? 0 : (hiddenFrames.includes(28) ? 0 : 1), pointerEvents: 'none', transform: 'translateZ(0)', willChange: 'opacity' }} alt="" />
                <img src={getAssetUrl("/cover/29.webp")} className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 31, opacity: !isPlayingCover ? 0 : (hiddenFrames.includes(29) ? 0 : 1), pointerEvents: 'none', transform: 'translateZ(0)', willChange: 'opacity' }} alt="" />
                <img src={getAssetUrl("/cover/30.webp")} className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 30, opacity: !isPlayingCover ? 0 : (hiddenFrames.includes(30) ? 0 : 1), pointerEvents: 'none', transform: 'translateZ(0)', willChange: 'opacity' }} alt="" />
                <img src={getAssetUrl("/cover/31.webp")} className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 29, opacity: !isPlayingCover ? 0 : (hiddenFrames.includes(31) ? 0 : 1), pointerEvents: 'none', transform: 'translateZ(0)', willChange: 'opacity' }} alt="" />
                <img src={getAssetUrl("/cover/32.webp")} className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 28, opacity: !isPlayingCover ? 0 : (hiddenFrames.includes(32) ? 0 : 1), pointerEvents: 'none', transform: 'translateZ(0)', willChange: 'opacity' }} alt="" />
                <img src={getAssetUrl("/cover/33.webp")} className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 27, opacity: !isPlayingCover ? 0 : (hiddenFrames.includes(33) ? 0 : 1), pointerEvents: 'none', transform: 'translateZ(0)', willChange: 'opacity' }} alt="" />
                <img src={getAssetUrl("/cover/34.webp")} className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 26, opacity: !isPlayingCover ? 0 : (hiddenFrames.includes(34) ? 0 : 1), pointerEvents: 'none', transform: 'translateZ(0)', willChange: 'opacity' }} alt="" />
                <img src={getAssetUrl("/cover/35.webp")} className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 25, opacity: !isPlayingCover ? 0 : (hiddenFrames.includes(35) ? 0 : 1), pointerEvents: 'none', transform: 'translateZ(0)', willChange: 'opacity' }} alt="" />
                <img src={getAssetUrl("/cover/36.webp")} className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 24, opacity: !isPlayingCover ? 0 : (hiddenFrames.includes(36) ? 0 : 1), pointerEvents: 'none', transform: 'translateZ(0)', willChange: 'opacity' }} alt="" />
                <img src={getAssetUrl("/cover/37.webp")} className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 23, opacity: !isPlayingCover ? 0 : (hiddenFrames.includes(37) ? 0 : 1), pointerEvents: 'none', transform: 'translateZ(0)', willChange: 'opacity' }} alt="" />
                <img src={getAssetUrl("/cover/38.webp")} className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 22, opacity: !isPlayingCover ? 0 : (hiddenFrames.includes(38) ? 0 : 1), pointerEvents: 'none', transform: 'translateZ(0)', willChange: 'opacity' }} alt="" />
                <img src={getAssetUrl("/cover/39.webp")} className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 21, opacity: !isPlayingCover ? 0 : (hiddenFrames.includes(39) ? 0 : 1), pointerEvents: 'none', transform: 'translateZ(0)', willChange: 'opacity' }} alt="" />
                <img src={getAssetUrl("/cover/40.webp")} className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 20, opacity: !isPlayingCover ? 0 : (hiddenFrames.includes(40) ? 0 : 1), pointerEvents: 'none', transform: 'translateZ(0)', willChange: 'opacity' }} alt="" />
                <img src={getAssetUrl("/cover/41.webp")} className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 19, opacity: !isPlayingCover ? 0 : (hiddenFrames.includes(41) ? 0 : 1), pointerEvents: 'none', transform: 'translateZ(0)', willChange: 'opacity' }} alt="" />
                <img src={getAssetUrl("/cover/42.webp")} className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 18, opacity: !isPlayingCover ? 0 : (hiddenFrames.includes(42) ? 0 : 1), pointerEvents: 'none', transform: 'translateZ(0)', willChange: 'opacity' }} alt="" />
                <img src={getAssetUrl("/cover/43.webp")} className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 17, opacity: !isPlayingCover ? 0 : (hiddenFrames.includes(43) ? 0 : 1), pointerEvents: 'none', transform: 'translateZ(0)', willChange: 'opacity' }} alt="" />
                <img src={getAssetUrl("/cover/44.webp")} className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 16, opacity: !isPlayingCover ? 0 : (hiddenFrames.includes(44) ? 0 : 1), pointerEvents: 'none', transform: 'translateZ(0)', willChange: 'opacity' }} alt="" />
                <img src={getAssetUrl("/cover/45.webp")} className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 15, opacity: !isPlayingCover ? 0 : (hiddenFrames.includes(45) ? 0 : 1), pointerEvents: 'none', transform: 'translateZ(0)', willChange: 'opacity' }} alt="" />
                <img src={getAssetUrl("/cover/46.webp")} className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 14, opacity: !isPlayingCover ? 0 : (hiddenFrames.includes(46) ? 0 : 1), pointerEvents: 'none', transform: 'translateZ(0)', willChange: 'opacity' }} alt="" />
                <img src={getAssetUrl("/cover/47.webp")} className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 13, opacity: !isPlayingCover ? 0 : (hiddenFrames.includes(47) ? 0 : 1), pointerEvents: 'none', transform: 'translateZ(0)', willChange: 'opacity' }} alt="" />
                <img src={getAssetUrl("/cover/48.webp")} className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 12, opacity: !isPlayingCover ? 0 : (hiddenFrames.includes(48) ? 0 : 1), pointerEvents: 'none', transform: 'translateZ(0)', willChange: 'opacity' }} alt="" />
                <img src={getAssetUrl("/cover/49.webp")} className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 11, opacity: !isPlayingCover ? 0 : (hiddenFrames.includes(49) ? 0 : 1), pointerEvents: 'none', transform: 'translateZ(0)', willChange: 'opacity' }} alt="" />
                <img src={getAssetUrl("/cover/50.webp")} className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 10, opacity: !isPlayingCover ? 0 : (hiddenFrames.includes(50) ? 0 : 1), pointerEvents: 'none', transform: 'translateZ(0)', willChange: 'opacity' }} alt="" />
                <img src={getAssetUrl("/cover/51.webp")} className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 9, opacity: !isPlayingCover ? 0 : (hiddenFrames.includes(51) ? 0 : 1), pointerEvents: 'none', transform: 'translateZ(0)', willChange: 'opacity' }} alt="" />
                <img src={getAssetUrl("/cover/52.webp")} className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 8, opacity: !isPlayingCover ? 0 : (hiddenFrames.includes(52) ? 0 : 1), pointerEvents: 'none', transform: 'translateZ(0)', willChange: 'opacity' }} alt="" />
                <img src={getAssetUrl("/cover/53.webp")} className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 7, opacity: !isPlayingCover ? 0 : (hiddenFrames.includes(53) ? 0 : 1), pointerEvents: 'none', transform: 'translateZ(0)', willChange: 'opacity' }} alt="" />
                <img src={getAssetUrl("/cover/54.webp")} className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 6, opacity: !isPlayingCover ? 0 : (hiddenFrames.includes(54) ? 0 : 1), pointerEvents: 'none', transform: 'translateZ(0)', willChange: 'opacity' }} alt="" />
                <img src={getAssetUrl("/cover/55.webp")} className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 5, opacity: !isPlayingCover ? 0 : (hiddenFrames.includes(55) ? 0 : 1), pointerEvents: 'none', transform: 'translateZ(0)', willChange: 'opacity' }} alt="" />
                <img src={getAssetUrl("/cover/56.webp")} className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 4, opacity: !isPlayingCover ? 0 : (hiddenFrames.includes(56) ? 0 : 1), pointerEvents: 'none', transform: 'translateZ(0)', willChange: 'opacity' }} alt="" />
                <img src={getAssetUrl("/cover/57.webp")} className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 3, opacity: !isPlayingCover ? 0 : (hiddenFrames.includes(57) ? 0 : 1), pointerEvents: 'none', transform: 'translateZ(0)', willChange: 'opacity' }} alt="" />
                <img src={getAssetUrl("/cover/58.webp")} className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 2, opacity: !isPlayingCover ? 0 : (hiddenFrames.includes(58) ? 0 : 1), pointerEvents: 'none', transform: 'translateZ(0)', willChange: 'opacity' }} alt="" />
                <img src={getAssetUrl("/cover/59.webp")} className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 1, opacity: !isPlayingCover ? 0 : (hiddenFrames.includes(59) ? 0 : 1), pointerEvents: 'none', transform: 'translateZ(0)', willChange: 'opacity' }} alt="" />
              </div>

              {/* Button overlay - only show when not playing */}
              {!isPlayingCover && (
                <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ zIndex: 100 }}>
                  <h1 className="text-5xl font-NotoSansThai font-bold text-red-100 text-center mb-6">CARTIER</h1>
                  <h2 className="text-3xl font-NotoSansThai font-bold text-red-100 text-center mb-12">Valentine's Card</h2>
                  <button
                    onClick={handleStartCoverAnimation}
                    className="px-8 py-4 bg-red-600 hover:bg-red-700 text-white rounded font-NotoSansThai text-lg"
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
            <div className={`relative w-full h-screen overflow-hidden flex items-center justify-center bg-black transition-opacity duration-[3000ms] ease-in-out`}>
              <div className="relative aspect-[1080/1920] min-w-full min-h-full shrink-0 bg-top_center bg-no-repeat transition-opacity duration-[2000ms]" style={{ backgroundImage: `url(${getAssetUrl("/cover/59.webp")})`, backgroundSize: '100% 100%' }}>
                
                <div className="cartier-logo w-[40%] max-w-[200px] mx-auto mt-[7.5%]">
                  <img src={getAssetUrl("/step1/cartier_logo.webp")} alt="Cartier Logo" />
                </div>
                <div ref={containerRef} className="green-box absolute top-[13.5%] left-[5%] md:left-[6%] w-[89%] md:w-[100%] h-[70%] flex items-center justify-center"
                >
                  <div className={`w-full h-full flex items-center justify-center transition-opacity duration-[3000ms] ease-in-out ${isReady && showSecond ? 'opacity-100' : 'opacity-0'}`}>
                  {isReady ? (
                    <>
                      <div style={{  width: `${actualSize.width}px`, height: `${actualSize.height}px`, position: 'relative', }}>
                        <HTMLFlipBook
                          ref={bookRef}
                          width={actualSize.width}
                          height={actualSize.height}
                          size="stretch"
                          minWidth={actualSize.width}
                          minHeight={actualSize.height}
                          maxWidth={actualSize.width}
                          maxHeight={actualSize.height}
                          showCover={false}
                          flippingTime={800}
                          startPage={1}
                          usePortrait={true}
                          drawShadow={false} 
                          autoSize={true}
                          useMouseEvents={false}
                          clickEventForward={false}
                          swipeDistance={30} 
                          showPageCorners={false}
                          startZIndex={0}
                          maxShadowOpacity={0.2}
                          mobileScrollSupport={true}
                          disableFlipByClick={false}
                          onInit={handleInit}
                          onFlip={(e: any) => {
                            setPage(e.data);
                            if (e.data >= 1 && e.data <= PAGES_DATA.length) {
                              setProductIndex(e.data);
                            }
                          }}
                          className="stf__parent" 
                          style={{ backgroundColor: 'transparent' }}
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
                                <p key={i} className="mb-2 text-sm">
                                  {p}
                                </p>
                              ))}
                            </Page>
                          ))}

                          <PageCover>THE END</PageCover>
                        </HTMLFlipBook>
                    
                        <div className="absolute w-full top-[10%] mb-4 abolute z-50 font-NotoSansThai">
                            <p className="text-center text-black font-bold text-[20px]">เลือกชิ้นงาน</p>
                            <p className="text-center text-black font-bold text-[20px]">เพื่อเป็นตัวแทนแห่งความรัก</p>
                        </div>
                        
                        <div className="absolute h-full w-full top-1/2 -translate-y-1/2  mb-4 abolute z-50">
                          <button
                            onClick={() => bookRef.current?.pageFlip().flipPrev("top")}
                            hidden={page <= 1}
                            className="px-4 py-2 bg-transparent hover:bg-white/20 disabled:bg-transparent text-white rounded text-sm h-full absolute left-0 min-w-[100px]"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={getAssetUrl("/step1/arrow-left.webp")} className="w-[30%] mx-auto" alt="" />
                          </button>
                          {/* <span className="text-red-100 font-NotoSansThai min-w-20 text-center">
                            [{page} of {totalPage - 2}]
                          </span> */}
                          
                          <button
                            onClick={() => bookRef.current?.pageFlip().flipNext("top")}
                            hidden={page >= totalPage - 2}
                            className="px-4 py-2 bg-transparent hover:bg-white/20 disabled:bg-transparent text-white rounded text-sm h-full absolute right-0 min-w-[100px]"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={getAssetUrl("/step1/arrow-right.webp")} className="w-[30%] mx-auto" alt="" />
                          </button>
                        </div>
                      </div>
                    

                    <nav className="flex justify-center gap-[0.75rem] mt-4 absolute bottom-[15%] w-full">
                      {Array.from({ length: totalPage - 2 }).map((_, i) => (
                        <button
                          key={i}
                          onClick={() => bookRef.current?.pageFlip().flip(i + 1)}
                          className={`
                            w-2 h-2 rotate-45 transition-all duration-300 transform
                            ${page === i + 1 
                              ? 'bg-[#c10016] scale-100 shadow-[0_0_8px_rgba(193,0,22,0.4)]' 
                              : 'bg-[#a48f72] hover:bg-[#c10016]/50'
                            }
                          `}
                          aria-label={`Go to page ${i + 1}`}
                        />
                      ))}
                    </nav>
                    </>
                  ) 
                  :
                  (
                    <div className="text-white">Loading Book...</div> 
                  )}
                  </div>
                  </div>
                </div>
              </div>
            
            <div className="flex flex-col items-center mb-4 absolute bottom-[3.5%] z-50 ">
                <button
                  onClick={handleConfirmStep1}
                  className="px-10 py-2.5 font-NotoSansThai text-base text-white border border-white/80 bg-stone-900/40 hover:bg-white/10 shadow-[0_0_0_1px_rgba(255,255,255,0.2)] transition"
                >
                  ตกลง
                </button>
            </div>
        </>
      )}

      {/* Step 2: Form Input */}
      {currentStep === 2 && selectedProductData && (
        <div className="w-full max-w-md  flex flex-col justify-between min-h-[520px]">
            <div className="cartier-logo w-[40%] md:w-[35%] max-w-[200px] mx-auto absolute left-1/2 -translate-x-1/2 top-[7.5%] z-50">
              <img src={getAssetUrl("/step1/cartier_logo.webp")} alt="Cartier Logo" />
            </div>
          <div className="px-7 pt-8 pb-4">
            <h1 className="font-bold text-white text-center mb-12 mt-8 font-NotoSansThai text-[20px]">
              โปรดใส่ข้อความของคุณด้านล่าง
            </h1>

            <div className="space-y-6 text-white">
              <div className="space-y-1">
                <div className="flex gap-2 text-base font-NotoSansThai text-white border-b border-white/70 pb-2 items-baseline">
                  <span className="font-semibold w-[22.5%] font-BrilliantCutPro">To</span>
                  <span className="opacity-80 mr-[5%]">:</span>
                  <input
                    type="text"
                    placeholder="ใส่ชื่อผู้รับ"
                    value={formData.to}
                    onChange={(e) => setFormData({ ...formData, to: e.target.value })}
                    className="flex-1 bg-transparent text-white placeholder-white/70 focus:outline-none font-NotoSansThai"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex gap-2 text-base font-NotoSansThai text-white border-b border-white/70 pb-2 items-baseline">
                  <span className="font-semibold w-[22.5%] font-BrilliantCutPro">From</span>
                  <span className="opacity-80 mr-[5%]">:</span>
                  <input
                    type="text"
                    placeholder="ใส่ชื่อผู้ส่ง"
                    value={formData.from}
                    onChange={(e) => setFormData({ ...formData, from: e.target.value })}
                    className="flex-1 bg-transparent text-white placeholder-white/70 focus:outline-none font-NotoSansThai"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex gap-2 text-sm font-semibold border-b border-white/70 pb-2 items-baseline">
                  <span className="font-semibold w-[22.5%] font-BrilliantCutPro">Message</span>
                  <span className="opacity-80 mr-[5%]">:</span>
                  <span className="text-white font-medium opacity-80 font-NotoSansThai">( จำกัดข้อความไม่เกิน 50 ตัวอักษร )</span>
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
                  className="w-full bg-transparent text-white placeholder-white/70 focus:outline-none font-NotoSansThai text-base text-center mt-4 border-b border-white/70 pb-2 items-baseline font-NotoSansThai"
                />
                <div className="text-amber-100 text-xs text-white font-NotoSansThai">
                  ( {formData.message.length} / 50 )
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4 justify-around absolute bottom-[7.5%] w-full left-1/2 -translate-x-1/2 max-w-md ">
            <button
              onClick={handleBackStep2}
              className="w-[35%] px-4 flex justify-center items-center py-2.5 bg-stone-900/40 hover:bg-white/10 text-white border border-white/80 shadow-[0_0_0_1px_rgba(255,255,255,0.2)] transition flex items-center gap-2"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={getAssetUrl("/icons/prev.webp")} className="h-[20px] mr-2" alt="" />
              <span className="font-NotoSansThai mr-4">กลับ</span>
            </button>
            <button
              onClick={handleConfirmStep2}
              disabled={!formData.to || !formData.from || !formData.message}
              className="w-[35%] px-4 flex justify-center items-center py-2.5 bg-stone-900/40 hover:bg-white/10 text-white border border-white/80 shadow-[0_0_0_1px_rgba(255,255,255,0.2)] transition flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <span className="font-NotoSansThai ml-4">เรียบร้อย</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={getAssetUrl("/icons/next.webp")} className="h-[20px] ml-2" alt="" />
              {/* <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-90"><path d="M9 18l6-6-6-6"/></svg> */}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Display Result (merged image) */}
      {currentStep === 3 && getSelectedProductData() && (
        <>
          <div style={{ backgroundImage: `url(${getAssetUrl("/step3/step-3-bg.webp")})` }} className="absolute flex justify-center items-center top-0 bottom-0 left-0 right-0 bg-cover bg-center mx-auto max-w-[500px]">
            <div className="w-11/12 mx-auto max-w-md  relative h-full flex flex-col justify-center">
              {(merging || !cardImageDataUrl) ? (
                <div className="flex flex-col items-center justify-center gap-4 py-24">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-red-600 border-t-red-100" />
                  <p className="text-red-100 font-NotoSansThai text-lg">กำลังสร้างการ์ด...</p>
                </div>
              ) : (
                <>
                  {cardImageDataUrl && (
                    <div className="mb-6 h-[70%] max-h-[720px]">
                      <img 
                        src={cardImageDataUrl}
                        alt="Valentine Card"
                        className="w-auto h-full rounded overflow-hidden mx-auto"
                      />
                    </div>
                  )}

                  <div className="flex gap-3 justify-center mt-6 text-base absolute bottom-[7.5%] w-full">
                    <button
                      onClick={handleBackStep3}
                      className="w-[30%] px-4 flex justify-center items-center py-2.5 bg-stone-900/40 hover:bg-white/10 text-white border border-white/80 shadow-[0_0_0_1px_rgba(255,255,255,0.2)] transition flex items-center gap-2"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={getAssetUrl("/icons/prev.webp")} className="h-[20px] mr-2" alt="" />
                      <span className="font-NotoSansThai">กลับ</span>
                    </button>
                    <button 
                      onClick={handleSave}
                      disabled={!cardImageDataUrl}
                      className="w-[30%] px-4 flex justify-center items-center py-2.5 bg-stone-900/40 hover:bg-white/10 disabled:opacity-60 disabled:cursor-not-allowed text-white border border-white/80 shadow-[0_0_0_1px_rgba(255,255,255,0.2)] transition flex items-center gap-2"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={getAssetUrl("/icons/save.webp")} className="h-[20px] mr-2" alt="" />
                      <span className="font-NotoSansThai">บันทึก</span>
                    </button>
                    <button 
                      onClick={handleShare}
                      className="w-[30%] px-4 flex justify-center items-center py-2.5 bg-stone-900/40 hover:bg-white/10 text-white border border-white/80 shadow-[0_0_0_1px_rgba(255,255,255,0.2)] transition flex items-center gap-2"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={getAssetUrl("/icons/share.webp")} className="h-[20px] mr-2" alt="" />
                      <span className="font-NotoSansThai">แชร์</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </>
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
          <p className="text-red-100 font-NotoSansThai text-lg">Loading...</p>
        </div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
