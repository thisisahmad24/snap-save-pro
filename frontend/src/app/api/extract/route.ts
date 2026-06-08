import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { url, userId } = await request.json();
    
    if (!url) {
      return NextResponse.json({ success: false, error: "URL is required" }, { status: 400 });
    }

    const backendUrl = process.env.BACKEND_API_URL
      ? `${process.env.BACKEND_API_URL.replace(/\/$/, "")}/api/v1/media-query`
      : new URL("/api/proxy/v1/media-query", request.url).toString();
    
    // 1. Attempt to call the Python backend first for full quota tracking, db logging, and extraction
    try {
      console.log(`Forwarding extraction request to backend: ${backendUrl}`);
      const authorization = request.headers.get("authorization");
      const response = await fetch(backendUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authorization ? { Authorization: authorization } : {}),
        },
        body: JSON.stringify({ url, userId }),
        // Timeout after 15 seconds for backend response
        signal: AbortSignal.timeout(15000)
      });
      
      const data = await response.json();
      if (response.ok && data.success) {
        return NextResponse.json(data);
      } else if (data.error && data.error.includes("limit reached")) {
        // Quota limit hit: return immediately so monetization works
        return NextResponse.json(data);
      }
      console.warn("Backend extraction unsuccessful, attempting local scraping fallback...", data);
    } catch (backendError) {
      console.error("FastAPI Backend connection failed or timed out, falling back to Next.js direct scraping:", backendError);
    }

    // 2. FALLBACK: Direct scraping via 2026 working public Cobalt v10 engines (strictly Turnstile-free open instances)
    const engines = [
      "https://dog.kittycat.boo/",
      "https://cobaltapi.squair.xyz/",
      "https://api.dl.woof.monster/",
      "https://api.cobalt.liubquanti.click/",
      "https://cobaltapi.kittycat.boo/",
      "https://fox.kittycat.boo/"
    ];

    for (const engine of engines) {
      try {
        console.log(`Attempting direct extraction with engine: ${engine}`);
        const response = await fetch(engine, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
          },
          body: JSON.stringify({ url, videoQuality: "720" }),
          // Timeout after 8 seconds per engine
          signal: AbortSignal.timeout(8000)
        });

        if (response.ok) {
          const data = await response.json();
          const picker = data.picker;
          const firstPicker = picker && Array.isArray(picker) && picker.length > 0 ? picker[0] : {};
          const downloadUrl = data.url || data.stream || firstPicker.url;
          
          if (downloadUrl) {
            const isPhoto = firstPicker.type === "photo";
            return NextResponse.json({
              success: true,
              title: data.filename || "Instagram Content",
              thumbnail: data.thumbnail || firstPicker.thumb || "",
              download_url: downloadUrl,
              platform: "instagram",
              ext: isPhoto ? "jpg" : "mp4"
            });
          }
        }
      } catch (e) {
        console.error(`Local scraping engine ${engine} failed:`, e);
        continue;
      }
    }

    return NextResponse.json({ success: false, error: "All extraction engines are currently busy. Please try again." }, { status: 503 });

  } catch (error: any) {
    console.error("Vercel API Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
