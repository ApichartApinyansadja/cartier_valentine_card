import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { fontFullUrl } from "@/lib/setUrl";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cartier Valentine Card",
  description: "Cartier Valentine Card - LINE LIFF App",
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

// Generate font face styles with SUB_URL support
const generateFontFaces = () => {
  const fonts = [
    // BrilliantCutPro
    { name: 'BrilliantCutPro', weights: [
      { weight: 100, file: 'BrilliantCutPro-Thin.ttf' },
      { weight: 300, file: 'BrilliantCutPro-Light.ttf' },
      { weight: 400, file: 'BrilliantCutPro-Regular.ttf' },
      { weight: 500, file: 'BrilliantCutPro-Medium.ttf' },
      { weight: 700, file: 'BrilliantCutPro-Bold.ttf' },
      { weight: 900, file: 'BrilliantCutPro-Black.ttf' },
    ]},
    // NotoSansThai
    { name: 'NotoSansThai', weights: [
      { weight: 100, file: 'NotoSansThai-Thin.ttf' },
      { weight: 300, file: 'NotoSansThai-Light.ttf' },
      { weight: 400, file: 'NotoSansThai-Regular.ttf' },
      { weight: 500, file: 'NotoSansThai-Medium.ttf' },
      { weight: 700, file: 'NotoSansThaiUI-Bold.ttf' },
      { weight: 900, file: 'NotoSansThaiUI-Black.ttf' },
    ]},
  ];

  return fonts.map(font =>
    font.weights.map(w => `
      @font-face {
        font-family: '${font.name}';
        src: url('${fontFullUrl(`/fonts/${font.name === 'BrilliantCutPro' ? 'BrilliantCutPro_font' : 'NotoSansThai-Font'}/${w.file}`)}') format('truetype');
        font-weight: ${w.weight};
        font-style: normal;
      }
    `).join('\n')
  ).join('\n');
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        {/* Google Analytics */}
        <script async src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`} />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}');
            `,
          }}
        />
        {/* Dynamic Font Faces with SUB_URL support */}
        <style dangerouslySetInnerHTML={{ __html: generateFontFaces() }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}
      >
        <div className="max-w-md mx-auto md:max-w-[600px] 2xl:max-w-[500px]">
          {children}
        </div>
      </body>
    </html>
  );
}
