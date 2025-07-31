import { UserRepository } from '../repositories/user.repository';
import type { User, UpsertUser } from '@shared/schema';
import { UnauthorizedError, NotFoundError, ValidationError } from '../../middleware/errorHandler';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

// Service layer for user business logic
export class UserService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  async createUser(userData: Omit<UpsertUser, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    // Validate required fields
    if (!userData.email) {
      throw new ValidationError('Email is required');
    }
    
    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(userData.email);
    if (existingUser) {
      throw new ValidationError('User with this email already exists');
    }

    // Check username availability
    if (userData.username) {
      const existingUsername = await this.userRepository.findByUsername(userData.username);
      if (existingUsername) {
        throw new ValidationError('Username is already taken');
      }
    }

    // Ensure username is provided
    if (!userData.username) {
      throw new ValidationError('Username is required');
    }

    // Hash password if provided
    let hashedPassword: string | undefined;
    if ('password' in userData && userData.password) {
      hashedPassword = await bcrypt.hash(userData.password, 12);
    }

    const newUser: UpsertUser = {
      id: crypto.randomUUID(),
      ...userData,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return await this.userRepository.create(newUser);
  }

  async authenticateUser(email: string, password: string): Promise<User> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (!user.password) {
      throw new UnauthorizedError('Account not set up for password login');
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new UnauthorizedError('Invalid email or password');
    }

    return user;
  }

  async getUserById(id: string): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundError('User');
    }
    return user;
  }

  async getUserByUsername(username: string): Promise<User> {
    const user = await this.userRepository.findByUsername(username);
    if (!user) {
      throw new NotFoundError('User');
    }
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    // Validate user exists
    await this.getUserById(id);

    // Validate username uniqueness if changing
    if (updates.username) {
      const existingUser = await this.userRepository.findByUsername(updates.username);
      if (existingUser && existingUser.id !== id) {
        throw new ValidationError('Username is already taken');
      }
    }

    // Hash password if updating
    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 12);
    }

    return await this.userRepository.update(id, updates);
  }

  async searchUsers(query: string, currentUserId: string, limit: number = 20): Promise<User[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    return await this.userRepository.search(query.trim(), currentUserId, limit);
  }

  async getSuggestedUsers(currentUserId: string, limit: number = 10): Promise<User[]> {
    return await this.userRepository.getSuggestedUsers(currentUserId, limit);
  }

  async followUser(followerId: string, followingId: string): Promise<void> {
    if (followerId === followingId) {
      throw new ValidationError('Cannot follow yourself');
    }

    // Validate both users exist
    await this.getUserById(followerId);
    await this.getUserById(followingId);

    // Check if already following
    const isAlreadyFollowing = await this.userRepository.isFollowing(followerId, followingId);
    if (isAlreadyFollowing) {
      throw new ValidationError('Already following this user');
    }

    await this.userRepository.followUser(followerId, followingId);
  }

  async unfollowUser(followerId: string, followingId: string): Promise<void> {
    if (followerId === followingId) {
      throw new ValidationError('Cannot unfollow yourself');
    }

    // Check if actually following
    const isFollowing = await this.userRepository.isFollowing(followerId, followingId);
    if (!isFollowing) {
      throw new ValidationError('Not following this user');
    }

    await this.userRepository.unfollowUser(followerId, followingId);
  }

  async getFollowers(userId: string): Promise<User[]> {
    // Validate user exists
    await this.getUserById(userId);
    return await this.userRepository.getFollowers(userId);
  }

  async getFollowing(userId: string): Promise<User[]> {
    // Validate user exists
    await this.getUserById(userId);
    return await this.userRepository.getFollowing(userId);
  }

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    return await this.userRepository.isFollowing(followerId, followingId);
  }

  // Helper method to remove sensitive data from user object
  sanitizeUser(user: User): Omit<User, 'password'> {
    const { password, ...sanitizedUser } = user;
    return sanitizedUser;
  }
}