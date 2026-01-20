import { NextRequest, NextResponse } from 'next/server';

const LINE_MESSAGING_API_URL = 'https://api.line.me/v2/bot/message/push';
const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN || '';

export async function POST(request: NextRequest) {
  try {
    const { userId, imageDataUrl } = await request.json();

    if (!userId || !imageDataUrl) {
      return NextResponse.json(
        { error: 'Missing userId or imageDataUrl' },
        { status: 400 }
      );
    }

    if (!LINE_CHANNEL_ACCESS_TOKEN) {
      return NextResponse.json(
        { error: 'LINE_CHANNEL_ACCESS_TOKEN is not configured' },
        { status: 500 }
      );
    }

    // Send image directly via LINE Messaging API Push using data URL
    // LINE API will handle the base64 image
    const response = await fetch(LINE_MESSAGING_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        to: userId,
        messages: [
          {
            type: 'image',
            originalContentUrl: imageDataUrl,
            previewImageUrl: imageDataUrl,
          },
        ],
      }),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('LINE API Error:', responseData);
      return NextResponse.json(
        { 
          error: 'Failed to send image via LINE',
          details: responseData,
          status: response.status,
        },
        { status: response.status }
      );
    }

    console.log('✅ Image sent successfully to LINE:', responseData);
    return NextResponse.json({ 
      success: true, 
      message: 'Image sent successfully to LINE!' 
    });
  } catch (error) {
    console.error('Error in send-image API:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
