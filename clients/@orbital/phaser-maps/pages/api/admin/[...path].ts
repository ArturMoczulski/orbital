import type { NextApiHandler } from "next";

const handler: NextApiHandler = async (req, res) => {
  const { path } = req.query;
  // Build the target URL by appending the captured path segments
  const segments = Array.isArray(path) ? path : [path as string];
  const targetUrl = `${
    process.env.NEXT_PUBLIC_ADMIN_GATEWAY_URL
  }/${segments.join("/")}`;

  // Proxy the incoming request to the Admin Gateway
  // Build and sanitize headers
  const proxyHeaders = new Headers();
  Object.entries(req.headers).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((v) => proxyHeaders.append(key, v));
    } else if (value) {
      proxyHeaders.append(key, value);
    }
  });
  // Override host header
  const gatewayUrl = process.env.NEXT_PUBLIC_ADMIN_GATEWAY_URL!;
  proxyHeaders.set("host", new URL(gatewayUrl).host);

  const response = await fetch(targetUrl, {
    method: req.method,
    headers: proxyHeaders,
    body:
      req.method === "GET" || req.method === "HEAD"
        ? undefined
        : JSON.stringify(req.body),
  });

  // Relay status and JSON response
  const responseData = await response.json();
  res.status(response.status).json(responseData);
};

export default handler;
