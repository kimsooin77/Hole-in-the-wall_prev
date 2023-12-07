import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import prisma from "@/db";
import { CommentApiResponse, CommentInterface } from "@/interface";

interface ResponseType {
  page?: string;
  limit?: string;
  storeId: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CommentInterface | CommentApiResponse>
) {
  const session = await getServerSession(req, res, authOptions);
  const { page = "1", limit = "10", storeId = "" }: ResponseType = req.query;

  if (req.method === "POST") {
    // 댓글 생성
    if (!session?.user) {
      return res.status(401);
    }

    const { storeId, body }: { storeId: number; body: string } = req.body;
    const comment = await prisma.comment.create({
      data: {
        storeId,
        body,
        userId: session.user.id,
      },
    });

    return res.status(200).json(comment);
  } else if (req.method === "DELETE") {
    // 댓글 삭제
  } else {
    // 댓글 가져오기
    const skipPage = parseInt(page) - 1;
    const count = await prisma.comment.count({
      where: {
        storeId: storeId ? parseInt(storeId) : {},
      },
    });

    const comments = await prisma.comment.findMany({
      orderBy: { createdAt: "desc" },
      where: {
        storeId: storeId ? parseInt(storeId) : {},
      },
      skip: skipPage * parseInt(limit),
      take: parseInt(limit),
    });

    return res.status(200).json({
      data: comments,
      page: parseInt(page),
      totalPage: Math.ceil(count / parseInt(limit)),
    });
  }
}