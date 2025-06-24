import type { NextApiHandler } from "next";

const handler: NextApiHandler = async (req, res) => {
  if (req.method === "GET") {
    const response = await fetch(`${process.env.NEXT_PUBLIC_WORLD_URL}/areas`);
    const data = await response.json();
    return res.status(response.status).json(data);
  }
  res.setHeader("Allow", ["GET"]);
  res.status(405).end("Method Not Allowed");
};

export default handler;
