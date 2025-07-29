import { User } from "../types/user";

export function sanitizeUser(user: User) {
  const { password, ...safeUser } = user;
  return safeUser;
}
