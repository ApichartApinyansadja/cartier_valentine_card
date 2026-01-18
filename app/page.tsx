"use client";

import React, { useRef, useState, PropsWithChildren } from "react";
import HTMLFlipBook from "react-pageflip";
import html2canvas from "html2canvas";
import { useLiff } from "@/hooks/useLiff";
import * as gtag from "@/lib/gtag";

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
    imageUrl:
      "https://www.cartier.com/dw/image/v2/BGTJ_PRD/on/demandware.static/-/Sites-cartier-master/default/dw84f25cc7/images/large/fe332aeba0c7541399fcf9a7e11f9924.png?sw=350&sh=350&sm=fit&sfrm=png",
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
    imageUrl:
      "https://www.cartier.com/dw/image/v2/BGTJ_PRD/on/demandware.static/-/Sites-cartier-master/default/dwa168da07/images/large/aa35bfeac8f057d89dc5916fad2fbb28.png?sw=750&sh=750&sm=fit&sfrm=png",
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
    imageUrl:
      "https://www.cartier.com/dw/image/v2/BGTJ_PRD/on/demandware.static/-/Sites-cartier-master/default/dwbb85beda/images/large/e595116d53265480a7df020d5d8e7d34.png?sw=750&sh=750&sm=fit&sfrm=png",
    content: {
      heading: "Time in Perfection",
      text: [
        "Cartier watches combine technical innovation with timeless style and heritage.",
        "A symbol of sophistication and a companion for life's most precious moments.",
      ],
    },
  },
  {
    title: "Cartier Fragrances",
    imageUrl:
      "https://www.cartier.com/dw/image/v2/BGTJ_PRD/on/demandware.static/-/Sites-cartier-master/default/dwddafea2d/images/large/564c3c12ecd95efa931df3b297d6a0e3.png?sw=750&sh=750&sm=fit&sfrm=png",
    content: {
      heading: "Essence of Luxury",
      text: [
        "Cartier fragrances capture the essence of elegance in every spritz.",
        "Discover scents that define moments, evoke emotions, and express your unique style.",
      ],
    },
  },
];

export default function Home() {
  const bookRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [page, setPage] = useState(0);
  const [totalPage, setTotalPage] = useState(0);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [minLoadingTime, setMinLoadingTime] = useState(true);

  // Step management
  const [currentStep, setCurrentStep] = useState<0 | 1 | 2 | 3>(0);
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    to: "You",
    from: "Me",
    message: "Happy Valentine's Day",
  });
  const [cardImageDataUrl, setCardImageDataUrl] = useState<string>('');
  const [merging, setMerging] = useState(false);

  const { liffReady, profile, error: liffError } = useLiff();

  React.useEffect(() => {
    if (profile) {
      console.log("LINE profile", profile);
    }
  }, [profile]);

  // Minimum 3 second loading time
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setMinLoadingTime(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Preload all images
  React.useEffect(() => {
    const imageUrls = PAGES_DATA.map((page) => page.imageUrl);
    let loadedCount = 0;

    const handleImageLoad = () => {
      loadedCount++;
      if (loadedCount === imageUrls.length) {
        setImagesLoaded(true);
      }
    };

    imageUrls.forEach((url) => {
      const img = new Image();
      img.onload = handleImageLoad;
      img.onerror = handleImageLoad; // Count as loaded even if error
      img.src = url;
    });
  }, []);

  const badWords = [
    "ไอ้",
    "อี",
    "มึง​",
    "กู",
    "ชั่ว",
    "เลว",
    "ควาย",
    "เหี้ย",
    "สัตว์",
    "ไม่ดี",
    "หยาบคาย",
    "shit",
    "damn",
    "hell",
    "fuck",
    "bitch",
    "ค*ย",
    "ห*ี",
    "แ*ตด",
    "เย็*ด",
  ];

  const censorBadWords = (text: string): string => {
    let result = text;
    badWords.forEach((word) => {
      const regex = new RegExp(word, "gi");
      result = result.replace(regex, "*".repeat(word.length));
    });
    return result;
  };

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

  const handleConfirmStep1 = () => {
    if (page >= 1 && page <= 4) {
      setSelectedProduct(page);
      // Track product selected
      switch (page) {
        case 1:
          gtag.trackRingsSelected();
          break;
        case 2:
          gtag.trackBraceletsSelected();
          break;
        case 3:
          gtag.trackWatchesSelected();
          break;
        case 4:
          gtag.trackFragrancesSelected();
          break;
      }
      setCurrentStep(2);
    }
  };

  const handleBackStep2 = () => {
    setCurrentStep(1);
  };

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
      
      // Create merged image on canvas
      setMerging(true);
      const productData = getSelectedProductData();
      if (productData) {
        mergeImageWithText(productData.imageUrl, censoredData, () => {
          setMerging(false);
          setCurrentStep(3);
        });
      }
    }
  };

  const mergeImageWithText = (imageUrl: string, data: typeof formData, onComplete: () => void) => {
    // Try CORS proxy first, then fallback to direct URL
    const corsProxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(imageUrl)}`;
    
    const tryLoadImage = (url: string, isFallback = false) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 400;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) return;
        
        // Draw image
        ctx.drawImage(img, 0, 0, 400, 400);
        
        // Draw semi-transparent overlay at bottom
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(0, 200, 400, 200);
        
        // Draw text
        ctx.fillStyle = 'white';
        ctx.font = 'bold 18px Georgia, serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 2;
        
        // To
        ctx.fillText(`To: ${data.to}`, 200, 240);
        
        // Message (smaller font)
        ctx.font = '16px Georgia, serif';
        const lines = data.message.split('\n');
        let yPos = 280;
        lines.forEach(line => {
          ctx.fillText(line, 200, yPos);
          yPos += 20;
        });
        
        // From
        ctx.font = 'bold 18px Georgia, serif';
        ctx.fillText(`From: ${data.from}`, 200, 360);
        
        // Convert to data URL
        const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
        setCardImageDataUrl(dataUrl);
        console.log('✅ Card image merged on canvas');
        onComplete();
      };
      
      img.onerror = () => {
        if (!isFallback) {
          console.warn('⚠️ CORS proxy failed, trying direct URL');
          // Try direct URL as fallback
          tryLoadImage(imageUrl, true);
        } else {
          console.warn('⚠️ Image load failed, using gradient fallback');
          // Final fallback: gradient + text
          createFallbackImage(data, onComplete);
        }
      };
      
      img.src = url;
    };
    
    // Start with CORS proxy
    tryLoadImage(corsProxyUrl);
  };

  const createFallbackImage = (data: typeof formData, onComplete: () => void) => {
    const productIdx = selectedProduct ? selectedProduct - 1 : 0;
    const colors = [
      { start: '#c084fc', end: '#7c3aed' }, // Rings
      { start: '#f87171', end: '#dc2626' }, // Bracelets
      { start: '#fbbf24', end: '#f59e0b' }, // Watches
      { start: '#a78bfa', end: '#8b5cf6' }, // Fragrances
    ];
    const color = colors[productIdx] || colors[0];
    
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    // Draw gradient fallback
    const gradient = ctx.createLinearGradient(0, 0, 400, 400);
    gradient.addColorStop(0, color.start);
    gradient.addColorStop(1, color.end);
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 400, 400);
    
    // Draw overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(0, 200, 400, 200);
    
    // Draw text
    ctx.fillStyle = 'white';
    ctx.font = 'bold 18px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 2;
    
    ctx.fillText(`To: ${data.to}`, 200, 240);
    
    ctx.font = '16px Georgia, serif';
    const lines = data.message.split('\n');
    let yPos = 280;
    lines.forEach(line => {
      ctx.fillText(line, 200, yPos);
      yPos += 20;
    });
    
    ctx.font = 'bold 18px Georgia, serif';
    ctx.fillText(`From: ${data.from}`, 200, 360);
    
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    setCardImageDataUrl(dataUrl);
    onComplete();
  };

  const handleBackStep3 = () => {
    setCurrentStep(2);
  };

  const handleSave = async () => {
    // Track download event
    gtag.trackDownload();
    
    if (!cardImageDataUrl) {
      alert('Card image not ready');
      return;
    }
    
    try {
      // Fetch the data URL as blob
      const response = await fetch(cardImageDataUrl);
      const blob = await response.blob();
      
      console.log('✅ Blob created:', blob.size, 'bytes');
      
      // Download
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'cartier-valentine-card.jpg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 100);
      
      console.log('✅ Download triggered');
    } catch (error) {
      console.error('❌ Error downloading:', error);
      alert('Error: ' + (error instanceof Error ? error.message : 'Unknown'));
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
      {(!liffReady || !imagesLoaded || minLoadingTime) && (
        <div className="flex flex-col items-center justify-center h-screen gap-6">
          {/* <h1 className="text-5xl font-serif font-bold text-red-100 text-center mb-6">CARTIER</h1> */}
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-red-600 border-t-red-100" />
            <p className="text-red-100 font-serif text-lg">Loading...</p>
            {!liffReady && (
              <p className="text-amber-300 font-serif text-sm text-center">
                กำลังจะเข้า Login ด้วย LINE...
              </p>
            )}
          </div>
        </div>
      )}

      {/* Main App */}
      {liffReady && imagesLoaded && !minLoadingTime && (
        <>
          {/* Step 0: Welcome Screen */}
          {currentStep === 0 && (
            <div className="flex flex-col items-center justify-center h-screen">
              <h1 className="text-5xl font-serif font-bold text-red-100 text-center mb-6">CARTIER</h1>
              <h2 className="text-3xl font-serif font-bold text-red-100 text-center mb-12">Valentine's Card</h2>
              <button
                onClick={() => {
                  gtag.trackEngagedUser();
                  setCurrentStep(1);
                }}
                className="px-8 py-4 bg-red-600 hover:bg-red-700 text-white rounded font-serif text-lg"
              >
                คลิกเพื่อรังสรรค์การ์ดอวยพร
              </button>
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
      {currentStep === 2 && (
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-serif font-bold text-red-100 text-center mb-6">
            กรอกข้อมูล
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
              เรียบร้อย
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Display Result */}
      {currentStep === 3 && getSelectedProductData() && (
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-serif font-bold text-red-100 text-center mb-6">
            การ์ดของคุณ
          </h1>

          {/* Card with Product as Background */}
          <div
            id="valentine-card"
            className="relative w-full aspect-square rounded overflow-hidden border border-red-600"
            style={{
              backgroundImage: `url(${getSelectedProductData()!.imageUrl})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            {/* Text overlay */}
            <div className="absolute inset-0 flex flex-col justify-end p-6 bg-black/30 space-y-2">
              {/* To */}
              <div className="text-center">
                <p className="text-white font-serif text-lg drop-shadow-lg">
                  To: {formData.to}
                </p>
              </div>

              {/* Message */}
              <div className="text-center">
                <p className="text-white font-serif text-base drop-shadow-lg whitespace-pre-wrap">
                  {formData.message}
                </p>
              </div>

              {/* From */}
              <div className="text-center">
                <p className="text-white font-serif text-lg drop-shadow-lg">
                  From: {formData.from}
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-4 justify-center mt-6">
            <button
              onClick={handleBackStep3}
              className="px-6 py-2 bg-stone-600 hover:bg-stone-700 text-white rounded font-serif"
            >
              กลับ
            </button>
            <button 
              onClick={handleSave}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-serif"
            >
              บันทึก
            </button>
            <button 
              onClick={() => gtag.trackShare()}
              className="px-6 py-2 bg-stone-600 hover:bg-stone-700 text-white rounded font-serif"
            >
              แชร์ให้เพื่อน
            </button>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}
