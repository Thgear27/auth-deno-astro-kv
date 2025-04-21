export type User= {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
};

export type Session = {
  id: string;
  userId: string;
  expiresAt: Date;
};
