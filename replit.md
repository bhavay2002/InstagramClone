# Instagram Clone - Social Media Application

## Overview
This is a modern Instagram-like social media application built with a full-stack TypeScript architecture. The application features user authentication, post creation and sharing, real-time messaging, stories, and social interactions including likes, comments, and follows.

## System Architecture

### Technology Stack
- **Frontend**: React 18 + TypeScript, Vite for bundling
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **UI Framework**: Tailwind CSS + shadcn/ui components
- **Authentication**: Replit Auth with OpenID Connect
- **Real-time Communication**: WebSockets
- **File Storage**: Cloudinary for media uploads
- **Query Management**: TanStack Query (React Query)

### Architecture Pattern
The application follows a monorepo structure with clear separation between client, server, and shared code:
- **Client**: React SPA served by Vite in development, static files in production
- **Server**: Express API server with middleware-based routing
- **Shared**: Common TypeScript types and database schema definitions

## Key Components

### Frontend Architecture
- **Component Library**: shadcn/ui provides consistent, accessible UI components
- **State Management**: TanStack Query for server state, React Context for auth state
- **Routing**: Wouter for lightweight client-side routing
- **Styling**: Tailwind CSS with custom Instagram-inspired color palette
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **API Design**: RESTful endpoints with consistent error handling
- **Authentication**: Session-based auth using Replit's OpenID Connect
- **Database Access**: Drizzle ORM with type-safe queries
- **Real-time Features**: WebSocket server for live messaging and notifications
- **File Upload**: Cloudinary integration for image/video processing

### Database Schema
- **Users**: Profile management with follower/following relationships
- **Posts**: Media posts with caption, location, and engagement metrics
- **Comments**: Threaded comments on posts
- **Messages**: Direct messaging between users
- **Stories**: Temporary content with view tracking
- **Social Features**: Likes, follows, saved posts, and notifications

## Data Flow

### Authentication Flow
1. User clicks login → redirects to Replit Auth
2. Successful auth creates/updates user in database
3. Session stored in PostgreSQL with automatic cleanup
4. Client receives user data and maintains auth state

### Post Creation Flow
1. User selects media files → preview generation
2. Client uploads to Cloudinary → receives URLs
3. Post data sent to API → stored in database
4. Real-time broadcast to followers via WebSocket
5. Feed queries invalidated to show new content

### Messaging Flow
1. WebSocket connection established on user login
2. Messages sent via WebSocket with database persistence
3. Real-time delivery to connected recipients
4. Message history loaded on conversation open

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL connection pooling
- **drizzle-orm**: Type-safe database operations
- **@tanstack/react-query**: Server state management
- **wouter**: Lightweight routing
- **openid-client**: Authentication handling
- **ws**: WebSocket implementation
- **cloudinary**: Media storage and processing

### UI Dependencies
- **@radix-ui/***: Accessible component primitives
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Type-safe component variants
- **lucide-react**: Icon library

## Deployment Strategy

### Development Environment
- Vite dev server with HMR for frontend development
- Express server with tsx for TypeScript execution
- PostgreSQL database provisioned through Replit
- Environment variables for database and auth configuration

### Production Build
- Frontend: Vite builds optimized static assets
- Backend: esbuild bundles server code with external packages
- Deployment: Replit's autoscale deployment target
- Database: Production PostgreSQL with connection pooling

### Configuration
- Port 5000 mapped to external port 80
- Session management with PostgreSQL store
- CORS configured for Replit domains
- WebSocket support on same port as HTTP server

## Changelog
- June 24, 2025. Initial setup

## User Preferences
Preferred communication style: Simple, everyday language.