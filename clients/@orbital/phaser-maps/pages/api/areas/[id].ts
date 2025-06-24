import type { NextApiHandler } from "next";

const handler: NextApiHandler = async (req, res) => {
  const {
    query: { id },
    method,
  } = req;

  if (method === "GET") {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_WORLD_URL}/areas/${id}`
    );
    const data = await response.json();
    return res.status(response.status).json(data);
  }

  res.setHeader("Allow", ["GET"]);
  res.status(405).end(`Method ${method} Not Allowed`);
};

export default handler;
