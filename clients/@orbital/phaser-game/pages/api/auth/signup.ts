import { NextApiRequest, NextApiResponse } from "next";

// TODO: Configure the actual Gateway URL
const GATEWAY_URL =
  process.env.NEXT_PUBLIC_GATEWAY_URL || "http://gateway:5010";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const { username, password } = req.body;

    const gatewayRes = await fetch(`${GATEWAY_URL}/api/auth/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    const data = await gatewayRes.json();

    // Handle invalid credentials or gateway errors
    if (!gatewayRes.ok || data.error) {
      return res.status(400).json({
        message: data.error || data.message || "Signup failed",
      });
    }

    // Forward the access token from the gateway
    res.status(201).json({ access_token: data.access_token });
  } catch (error: any) {
    console.error("Error proxying signup request:", error);
    res.status(500).json({ message: error.message || "Internal Server Error" });
  }
}
