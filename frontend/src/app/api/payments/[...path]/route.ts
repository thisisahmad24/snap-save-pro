async function proxy(request: Request, pathSegments: string[]) {
  const targetUrl = process.env.BACKEND_API_URL
    ? `${process.env.BACKEND_API_URL.replace(/\/$/, "")}/api/payments/${pathSegments.join("/")}`
    : new URL(`/api/proxy/payments/${pathSegments.join("/")}`, request.url).toString();

  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("content-length");

  const method = request.method.toUpperCase();
  const body = method === "GET" || method === "HEAD" ? undefined : await request.text();
  const response = await fetch(targetUrl, {
    method,
    headers,
    body,
    signal: AbortSignal.timeout(20000),
  });

  return new Response(response.body, {
    status: response.status,
    headers: response.headers,
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
