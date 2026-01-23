export const userSelect = {
  id: false,
  opaqueId: true,
  name: true,
  email: true,
  phone: true,
  userType: true,
} as const;

export const formatUser = (user: {
  opaqueId: string;
  name: string;
  email: string | null;
  phone?: string | null;
  userType: string;
}) => ({
  id: user.opaqueId,
  name: user.name,
  email: user.email,
  ...(user.phone !== undefined && { phone: user.phone }),
  userType: user.userType,
});

export type FormattedUser = ReturnType<typeof formatUser>;
