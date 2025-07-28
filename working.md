# Instagram Clone - Complete Working Guide

## Table of Contents
1. [Application Overview](#application-overview)
2. [Architecture Explanation](#architecture-explanation)
3. [File Structure and Working](#file-structure-and-working)
4. [Data Flow](#data-flow)
5. [API Endpoints](#api-endpoints)
6. [Frontend Components](#frontend-components)
7. [Database Schema](#database-schema)
8. [Authentication System](#authentication-system)
9. [Real-time Features](#real-time-features)
10. [Development Workflow](#development-workflow)

## Application Overview

This is a full-stack Instagram clone built with modern technologies. The application provides core social media features including user authentication, photo/video posting, stories, real-time messaging, comments, likes, and following system.

### Key Features
- User registration and authentication (Replit Auth + Local)
- Photo and video posts with captions and locations
- Stories with 24-hour expiration
- Real-time direct messaging
- Like and comment system
- Follow/unfollow functionality
- User profiles with post grids
- Notifications system
- Explore page for content discovery
- Mobile-responsive design

## Architecture Explanation

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Replit Auth (OpenID Connect) + Passport.js
- **Real-time**: WebSocket (ws library)
- **File Storage**: Cloudinary
- **UI Library**: shadcn/ui + Tailwind CSS
- **State Management**: TanStack Query + React Context

### Project Structure
```
├── client/                 # Frontend React application
├── server/                 # Backend Express API
├── shared/                 # Shared TypeScript types and schemas
├── attached_assets/        # Static assets
└── Configuration files
```

## File Structure and Working

### Root Level Files

#### `package.json`
- **Purpose**: Defines project dependencies and scripts
- **Key Scripts**:
  - `npm run dev`: Starts development server with tsx
  - `npm run build`: Builds production bundle
  - `npm run db:push`: Pushes schema changes to database
- **Dependencies**: All project dependencies for both frontend and backend

#### `vite.config.ts`
- **Purpose**: Vite bundler configuration
- **Features**:
  - React plugin for JSX transformation
  - Path aliases (@, @shared, @assets)
  - Proxy configuration for API routes
  - Development server settings

#### `tsconfig.json`
- **Purpose**: TypeScript configuration
- **Settings**:
  - Modern ES modules support
  - Strict type checking
  - Path mapping for imports
  - JSX configuration for React

#### `tailwind.config.ts`
- **Purpose**: Tailwind CSS configuration
- **Customizations**:
  - Instagram-inspired color palette
  - Custom animations
  - shadcn/ui integration
  - Dark mode support

#### `drizzle.config.ts`
- **Purpose**: Database ORM configuration
- **Settings**:
  - PostgreSQL connection
  - Schema file location
  - Migration settings

### Server Directory (`server/`)

#### `server/index.ts`
- **Purpose**: Main application entry point
- **Responsibilities**:
  - Express server initialization
  - Middleware setup (CORS, sessions, parsing)
  - Route registration
  - WebSocket server setup
  - Database connection
  - Port binding and startup

#### `server/vite.ts`
- **Purpose**: Vite integration for serving frontend
- **Function**: Serves React app in development mode

#### `server/storage.ts`
- **Purpose**: Data access layer interface
- **Features**:
  - Abstract storage interface definition
  - In-memory and database implementations
  - CRUD operations for all entities
  - Type-safe data operations

### Authentication (`server/auth/`)

#### `server/auth/passport.ts`
- **Purpose**: Passport.js authentication strategies
- **Strategies**:
  - Local strategy (username/password)
  - Google OAuth 2.0 strategy
  - User serialization/deserialization
- **Working**:
  1. Configures authentication methods
  2. Handles user login verification
  3. Manages user sessions

#### `server/auth/session.ts`
- **Purpose**: Session configuration
- **Features**:
  - PostgreSQL session store
  - Session security settings
  - Cookie configuration
  - Session cleanup

### Database (`server/db/`)

#### `server/db/db.ts`
- **Purpose**: Database connection and setup
- **Working**:
  1. Reads DATABASE_URL environment variable
  2. Creates PostgreSQL connection pool
  3. Initializes Drizzle ORM with schema
  4. Handles connection lifecycle

### Controllers (`server/controllers/`)

Controllers handle business logic for different features:

#### `auth.controller.ts`
- **Purpose**: Authentication logic
- **Functions**:
  - User registration
  - Login/logout
  - Session management
  - Profile updates

#### `posts.controller.ts`
- **Purpose**: Post management
- **Functions**:
  - Create posts with media
  - Fetch user feed
  - Get post details
  - Delete posts
  - Media upload handling

#### `comments.controller.ts`
- **Purpose**: Comment system
- **Functions**:
  - Add comments to posts
  - Reply to comments (nested)
  - Delete comments
  - Fetch comment threads

#### `follows.controller.ts`
- **Purpose**: Social relationships
- **Functions**:
  - Follow/unfollow users
  - Get followers/following lists
  - Check follow status

#### `messages.controller.ts`
- **Purpose**: Direct messaging
- **Functions**:
  - Send messages
  - Fetch conversations
  - Mark messages as read
  - Get message history

#### `notifications.controller.ts`
- **Purpose**: Notification system
- **Functions**:
  - Create notifications
  - Fetch user notifications
  - Mark as read
  - Real-time delivery

#### `stories.controller.ts`
- **Purpose**: Stories feature
- **Functions**:
  - Create stories
  - View stories
  - Track story views
  - Auto-expire after 24h

#### `users.controller.ts`
- **Purpose**: User management
- **Functions**:
  - Get user profiles
  - Update profiles
  - Search users
  - User statistics

### Routes (`server/routes/`)

Route files define API endpoints and connect them to controllers:

#### `auth.routes.ts`
- **Endpoints**:
  - `POST /api/auth/register` - User registration
  - `POST /api/auth/login` - User login
  - `POST /api/auth/logout` - User logout
  - `GET /api/auth/user` - Get current user

#### `posts.routes.ts`
- **Endpoints**:
  - `GET /api/posts` - Get feed posts
  - `POST /api/posts` - Create new post
  - `GET /api/posts/:id` - Get specific post
  - `DELETE /api/posts/:id` - Delete post
  - `POST /api/posts/:id/like` - Like/unlike post

#### `comments.routes.ts`
- **Endpoints**:
  - `GET /api/posts/:id/comments` - Get post comments
  - `POST /api/posts/:id/comments` - Add comment
  - `DELETE /api/comments/:id` - Delete comment

#### `follows.routes.ts`
- **Endpoints**:
  - `POST /api/users/:id/follow` - Follow user
  - `DELETE /api/users/:id/follow` - Unfollow user
  - `GET /api/users/:id/followers` - Get followers
  - `GET /api/users/:id/following` - Get following

### Middleware (`server/middleware/`)

#### `isAuthenticated.ts`
- **Purpose**: Authentication middleware
- **Function**: Checks if user is logged in before allowing access

#### `validate.ts`
- **Purpose**: Request validation
- **Function**: Validates request data against Zod schemas

#### `rateLimiter.ts`
- **Purpose**: Rate limiting
- **Function**: Prevents API abuse with request limits

#### `errorHandler.ts`
- **Purpose**: Global error handling
- **Function**: Catches and formats errors consistently

#### `logger.ts`
- **Purpose**: Request logging
- **Function**: Logs all API requests for debugging

### WebSocket (`server/socket/`)

#### `server/socket/index.ts`
- **Purpose**: Real-time communication
- **Features**:
  - WebSocket server setup
  - Connection management
  - Message broadcasting
  - User presence tracking
- **Events**:
  - `message` - Direct messages
  - `notification` - Real-time notifications
  - `typing` - Typing indicators

### Client Directory (`client/`)

#### `client/index.html`
- **Purpose**: HTML template for React app
- **Features**: Basic HTML structure, React root mounting

#### `client/src/main.tsx`
- **Purpose**: React application entry point
- **Responsibilities**:
  - React app initialization
  - React Query setup
  - Theme provider setup
  - Router mounting

#### `client/src/App.tsx`
- **Purpose**: Main application component
- **Features**:
  - Route definitions
  - Authentication context
  - Layout structure
  - Navigation setup

### Frontend Pages (`client/src/pages/`)

#### Authentication (`auth/`)
- **LoginPage.tsx**: User login interface
- **RegisterPage.tsx**: User registration form

#### Social Features (`feed/`)
- **FeedPage.tsx**: Main timeline with posts and stories
- **ProfilePage.tsx**: User profile with posts grid
- **ExplorePage.tsx**: Content discovery

#### Communication (`messages/`)
- **MessagesPage.tsx**: Direct messaging interface

#### Notifications (`notifications/`)
- **NotificationsPage.tsx**: Activity feed

### Shared Directory (`shared/`)

#### `shared/schema.ts`
- **Purpose**: Database schema and types
- **Contents**:
  - Drizzle table definitions
  - TypeScript types
  - Zod validation schemas
  - Database relationships

## Data Flow

### Authentication Flow
1. User clicks login → redirects to authentication
2. Credentials verified against database
3. Session created and stored in PostgreSQL
4. User redirected to feed with session cookie
5. Frontend receives user data and updates state

### Post Creation Flow
1. User selects media files
2. Files uploaded to Cloudinary
3. Post data (caption, location, media URLs) sent to API
4. Post stored in database
5. Real-time notification sent to followers
6. Feed cache invalidated to show new post

### Real-time Messaging Flow
1. WebSocket connection established on login
2. Messages sent through WebSocket
3. Messages stored in database
4. Real-time delivery to recipients
5. Read receipts updated

### Notification System
1. User action triggers notification creation
2. Notification stored in database
3. Real-time broadcast via WebSocket
4. Frontend updates notification count
5. User can mark as read

## API Endpoints

### Authentication Endpoints
- `POST /api/auth/register` - Create new user account
- `POST /api/auth/login` - Authenticate user
- `GET /api/auth/user` - Get current user data
- `POST /api/auth/logout` - End user session

### User Management
- `GET /api/users/:id` - Get user profile
- `PUT /api/users/:id` - Update user profile
- `GET /api/users/search` - Search users

### Posts
- `GET /api/posts` - Get feed posts (paginated)
- `POST /api/posts` - Create new post
- `GET /api/posts/:id` - Get specific post
- `DELETE /api/posts/:id` - Delete post
- `POST /api/posts/:id/like` - Toggle like on post

### Comments
- `GET /api/posts/:id/comments` - Get post comments
- `POST /api/posts/:id/comments` - Add comment
- `DELETE /api/comments/:id` - Delete comment

### Social Features
- `POST /api/users/:id/follow` - Follow user
- `DELETE /api/users/:id/follow` - Unfollow user
- `GET /api/users/:id/followers` - Get followers list
- `GET /api/users/:id/following` - Get following list

### Messages
- `GET /api/messages` - Get conversations
- `GET /api/messages/:userId` - Get conversation with user
- `POST /api/messages` - Send message

### Stories
- `GET /api/stories` - Get current stories
- `POST /api/stories` - Create story
- `POST /api/stories/:id/view` - Mark story as viewed

### Notifications
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/:id/read` - Mark notification as read

## Database Schema

### Core Tables

#### `users`
- User account information
- Profile data (username, bio, avatar)
- Follower/following counts
- Account settings

#### `posts`
- Post content and metadata
- Media URLs and types
- Engagement metrics
- Timestamps

#### `comments`
- Comment content
- Nested replies support
- Like counts
- User references

#### `likes`
- Like relationships
- Post and comment likes
- User tracking

#### `follows`
- User relationship tracking
- Follower/following connections
- Indexed for performance

#### `messages`
- Direct message content
- Sender/receiver tracking
- Read status
- Message types

#### `stories`
- Temporary content
- Expiration tracking
- View counts
- Media URLs

#### `notifications`
- Activity tracking
- Notification types
- Read status
- Related content references

#### `sessions`
- User session storage
- Required for authentication
- Automatic cleanup

## Authentication System

### Replit Auth Integration
- OpenID Connect provider
- Automatic user creation
- Session management
- Secure token handling

### Local Authentication
- Username/password login
- Password hashing with bcrypt
- Session-based authentication
- Remember me functionality

### Security Features
- CSRF protection
- Session encryption
- Rate limiting
- Input validation

## Real-time Features

### WebSocket Implementation
- Connection management
- User presence tracking
- Message broadcasting
- Event handling

### Real-time Events
- Direct messages
- Notifications
- Typing indicators
- User status updates

## Development Workflow

### Getting Started
1. Install dependencies: `npm install`
2. Set up database: `npm run db:push`
3. Start development: `npm run dev`
4. Access app at http://localhost:5000

### Development Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run check` - Type checking
- `npm run db:push` - Update database schema

### Code Organization
- Follow TypeScript strict mode
- Use Zod for validation
- Implement proper error handling
- Write type-safe database queries
- Maintain consistent code style

### Testing Considerations
- API endpoint testing
- Frontend component testing
- Database integration testing
- WebSocket functionality testing
- Authentication flow testing

This working guide provides a comprehensive understanding of how the Instagram clone application functions, from the high-level architecture down to individual file purposes and implementation details.