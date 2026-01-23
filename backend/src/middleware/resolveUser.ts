// middleware/resolveUser.ts
import { asyncHandler } from "../helpers/asyncHandler";
import { prisma } from "../lib/prisma";

export const resolveUser = asyncHandler(async (req, res, next) => {
  const { userId } = res.locals.params;

  const user = await prisma.user.findUnique({
    where: { opaqueId: userId },
    select: { id: true },
  });

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  res.locals.targetUser = user;
  return next();
});
