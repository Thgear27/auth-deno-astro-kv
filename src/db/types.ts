export type Result<T> = { error: { message: string }; value: null } | { error: null; value: T };

export type User = {
  id: string;
  name: string;
  email: string;
  googleId?: string;
  avatarURL?: string;
  passwordHash?: string;
  createdAt: Date;
};

export type Session = {
  id: string;
  userId: string;
  expiresAt: Date;
};
