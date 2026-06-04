import { NextResponse } from "next/server";

function safeFilename(value: string) {
  return value
    .trim()
    .replace(/[\\/:*?"<>|]+/g, "_")
    .replace(/\s+/g, " ")
    .slice(0, 120) || "download";
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sourceUrl = searchParams.get("url");
    const title = searchParams.get("title") || "download";
    const ext = (searchParams.get("ext") || "mp4").replace(/^\./, "");

    if (!sourceUrl) {
      return NextResponse.json({ success: false, error: "Missing download URL" }, { status: 400 });
    }

    const upstream = await fetch(sourceUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
      },
      signal: AbortSignal.timeout(20000),
    });

    if (!upstream.ok || !upstream.body) {
      return NextResponse.json(
        { success: false, error: "Unable to fetch the media file" },
        { status: 502 }
      );
    }

    const contentType = upstream.headers.get("content-type") || "application/octet-stream";
    const contentLength = upstream.headers.get("content-length") || undefined;
    const filename = `${safeFilename(title)}.${ext}`;

    return new Response(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        ...(contentLength ? { "Content-Length": contentLength } : {}),
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Download proxy error:", error);
    return NextResponse.json({ success: false, error: "Download failed" }, { status: 500 });
  }
}
