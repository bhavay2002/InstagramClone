import { User } from "../types/user";

export function createSessionUser(user: User) {
  return {
    id: user.id,
    email: user.email ?? null,
    firstName: user.firstName ?? null,
    lastName: user.lastName ?? null,
    username: user.username,
    profileImageUrl: user.profileImageUrl ?? null,
    bio: user.bio ?? null,
    isPrivate: user.isPrivate ?? false,
    followerCount: user.followerCount ?? 0,
    followingCount: user.followingCount ?? 0,
    postCount: user.postCount ?? 0,
    createdAt: user.createdAt ?? null,
    updatedAt: user.updatedAt ?? null,
  };
}
