async function proxy(request: Request, pathSegments: string[]) {
  const targetUrl = process.env.BACKEND_API_URL
    ? `${process.env.BACKEND_API_URL.replace(/\/$/, "")}/api/auth/${pathSegments.join("/")}`
    : new URL(`/api/proxy/auth/${pathSegments.join("/")}`, request.url).toString();

  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("content-length");

  const method = request.method.toUpperCase();
  const body = method === "GET" || method === "HEAD" ? undefined : await request.text();
  const response = await fetch(targetUrl, {
    method,
    headers,
    body,
    signal: AbortSignal.timeout(15000),
  });

  const responseHeaders = new Headers(response.headers);
  return new Response(response.body, {
    status: response.status,
    headers: responseHeaders,
  });
}

export async function GET(request: Request, context: any) {
  const params = await context.params;
  return proxy(request, params.path || []);
}

export async function POST(request: Request, context: any) {
  const params = await context.params;
  return proxy(request, params.path || []);
}

export async function PUT(request: Request, context: any) {
  const params = await context.params;
  return proxy(request, params.path || []);
}

export async function PATCH(request: Request, context: any) {
  const params = await context.params;
  return proxy(request, params.path || []);
}

export async function DELETE(request: Request, context: any) {
  const params = await context.params;
  return proxy(request, params.path || []);
}
