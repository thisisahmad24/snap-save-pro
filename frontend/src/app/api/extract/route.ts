import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { url } = await request.json();
    
    if (!url) {
      return NextResponse.json({ success: false, error: "URL is required" }, { status: 400 });
    }

    // Master List of working public extraction engines (v10 & v7 mixed)
    const engines = [
      "https://cobalt.v-0.icu/api/json",
      "https://co.wuk.sh/api/json",
      "https://cobalt.shithouse.tv/api/json",
      "https://cobalt-api.zeat.me/api/json",
      "https://api.cobalt.tools/api/json",
      "https://cobalt.fly.dev/api/json",
      "https://cobalt.onrender.com/api/json"
    ];

    for (const engine of engines) {
      try {
        console.log(`Trying engine: ${engine}`);
        const response = await fetch(engine, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
          },
          body: JSON.stringify({ 
            url, 
            videoQuality: "720",
            vQuality: "720", // Compatibility for v7
            isNoAudio: false,
            isAudioOnly: false
          }),
          signal: AbortSignal.timeout(10000)
        });

        if (response.ok) {
          const data = await response.json();
          const downloadUrl = data.url || data.stream;
          if (downloadUrl) {
            return NextResponse.json({
              success: true,
              title: "Instagram Content",
              thumbnail: data.thumbnail || "",
              download_url: downloadUrl,
              platform: "instagram",
              ext: "mp4"
            });
          }
        }
      } catch (e) {
        console.error(`Engine ${engine} failed:`, e);
        continue;
      }
    }

    return NextResponse.json({ success: false, error: "All extraction engines are currently busy. Please try again." }, { status: 503 });

  } catch (error: any) {
    console.error("Vercel API Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
