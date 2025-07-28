# Instagram Clone - Full-Stack Social Media Application

A comprehensive Instagram-like social media platform built with modern web technologies. This application provides a complete social media experience with photo/video sharing, real-time messaging, stories, and advanced social features.

## ✨ Features

### Core Social Features
- **User Authentication**: Multi-provider auth (Replit Auth + Local registration)
- **Posts & Media**: Photo/video posts with captions, locations, and filters
- **Stories**: 24-hour temporary content with view tracking and engagement
- **Real-time Messaging**: Direct messaging with typing indicators and read receipts
- **Social Interactions**: Like, comment, share, and save posts
- **User Profiles**: Customizable profiles with post grids and follower management
- **Feed Algorithm**: Intelligent timeline with posts from followed users
- **Explore Page**: Discover trending content and new users
- **Notifications**: Real-time activity notifications
- **Search**: Advanced user and content discovery

### Technical Features
- **Real-time Updates**: WebSocket-powered live messaging and notifications
- **Mobile Responsive**: Instagram-like UI optimized for all devices
- **Image Processing**: Cloudinary integration for media optimization
- **Security**: Rate limiting, input validation, and secure sessions
- **Performance**: Optimized queries and infinite scroll pagination
- **Dark Mode**: System-aware theme switching

## 🛠 Tech Stack

### Frontend
- **React 18** + **TypeScript** - Modern component-based UI
- **Vite** - Lightning-fast build tool and dev server
- **Tailwind CSS** - Utility-first styling framework
- **shadcn/ui** - Accessible component library
- **TanStack Query** - Server state management and caching
- **Wouter** - Lightweight routing solution
- **Framer Motion** - Smooth animations and transitions

### Backend
- **Express.js** + **TypeScript** - RESTful API server
- **Drizzle ORM** - Type-safe database operations
- **PostgreSQL** - Robust relational database
- **Passport.js** - Authentication middleware
- **WebSocket (ws)** - Real-time communication
- **Cloudinary** - Media storage and processing
- **bcrypt** - Password hashing

### Development & Deployment
- **ESBuild** - Fast JavaScript bundling
- **Drizzle Kit** - Database migrations
- **Replit** - Cloud development and deployment

## 📁 Project Architecture

```
instagram-clone/
├── client/                     # Frontend React Application
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   │   ├── ui/            # shadcn/ui components
│   │   │   ├── forms/         # Form components
│   │   │   ├── layout/        # Layout components
│   │   │   └── feed/          # Feed-specific components
│   │   ├── pages/             # Page components
│   │   │   ├── auth/          # Authentication pages
│   │   │   ├── feed/          # Main feed and timeline
│   │   │   ├── profile/       # User profiles
│   │   │   ├── messages/      # Direct messaging
│   │   │   ├── explore/       # Content discovery
│   │   │   └── notifications/ # Activity notifications
│   │   ├── hooks/             # Custom React hooks
│   │   ├── lib/               # Utilities and configurations
│   │   └── types/             # Frontend-specific types
│   └── index.html             # HTML template
├── server/                     # Backend Express API
│   ├── auth/                  # Authentication configuration
│   │   ├── passport.ts        # Passport strategies
│   │   └── session.ts         # Session management
│   ├── controllers/           # Business logic controllers
│   │   ├── auth.controller.ts    # Authentication logic
│   │   ├── posts.controller.ts   # Post management
│   │   ├── users.controller.ts   # User management
│   │   ├── messages.controller.ts # Messaging logic
│   │   ├── comments.controller.ts # Comment system
│   │   ├── follows.controller.ts  # Social relationships
│   │   ├── stories.controller.ts  # Stories feature
│   │   └── notifications.controller.ts # Notifications
│   ├── routes/                # API route definitions
│   │   ├── auth.routes.ts     # Authentication endpoints
│   │   ├── posts.routes.ts    # Post-related endpoints
│   │   ├── users.routes.ts    # User management endpoints
│   │   ├── messages.routes.ts # Messaging endpoints
│   │   └── index.ts           # Route aggregation
│   ├── middleware/            # Express middleware
│   │   ├── isAuthenticated.ts # Auth protection
│   │   ├── validate.ts        # Request validation
│   │   ├── rateLimiter.ts     # Rate limiting
│   │   ├── errorHandler.ts    # Error handling
│   │   └── logger.ts          # Request logging
│   ├── db/                    # Database configuration
│   │   └── db.ts              # Connection and setup
│   ├── socket/                # WebSocket implementation
│   │   └── index.ts           # Real-time communication
│   ├── types/                 # Backend-specific types
│   ├── utils/                 # Utility functions
│   ├── validators/            # Zod validation schemas
│   ├── storage.ts             # Data access layer
│   ├── index.ts               # Application entry point
│   └── vite.ts                # Vite integration
├── shared/                     # Shared TypeScript definitions
│   └── schema.ts              # Database schema and types
├── attached_assets/           # Static assets and uploads
└── Configuration files
    ├── package.json           # Dependencies and scripts
    ├── tsconfig.json          # TypeScript configuration
    ├── vite.config.ts         # Vite bundler config
    ├── tailwind.config.ts     # Tailwind CSS config
    ├── drizzle.config.ts      # Database ORM config
    └── postcss.config.js      # PostCSS configuration
```

## 🚀 Getting Started

### Prerequisites

- **Node.js 18+** - JavaScript runtime
- **PostgreSQL** - Database (automatically provisioned in Replit)
- **Replit Account** - For authentication and deployment

### Installation & Setup

1. **Clone or Fork the Repository**:
```bash
git clone <repository-url>
cd instagram-clone
```

2. **Install Dependencies**:
```bash
npm install
```

3. **Database Setup**:
   - PostgreSQL database is automatically created in Replit environment
   - Push the schema to initialize tables:
```bash
npm run db:push
```

4. **Environment Configuration**:
   The following environment variables are automatically configured in Replit:
   - `DATABASE_URL` - PostgreSQL connection string
   - `REPL_ID` - Replit application identifier
   - `REPLIT_DOMAINS` - Authorized domains for CORS

5. **Start Development Server**:
```bash
npm run dev
```

6. **Access the Application**:
   - Local: `http://localhost:5000`
   - Replit: Your repl's public URL

### Development Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build optimized production bundle |
| `npm run start` | Start production server |
| `npm run check` | Run TypeScript type checking |
| `npm run db:push` | Push schema changes to database |

### First Run Setup

1. **Create User Account**: Register with username/password or use Replit Auth
2. **Upload Profile Picture**: Customize your profile
3. **Create First Post**: Share content to test the feed
4. **Follow Users**: Build your social network
5. **Send Messages**: Test real-time messaging features

## 🗄️ Database Schema

The application uses PostgreSQL with comprehensive relational schema:

### Core Tables
| Table | Purpose | Key Features |
|-------|---------|-------------|
| `users` | User profiles and authentication | Unique usernames, profile data, follower counts |
| `posts` | User posts with media | JSON media arrays, engagement metrics |
| `comments` | Post comments and replies | Nested structure for threaded conversations |
| `likes` | Post and comment likes | Separate tracking for posts vs comments |
| `follows` | User relationships | Follower/following connections with indexes |
| `messages` | Direct messaging | Real-time chat with read status |
| `stories` | Temporary content | 24-hour expiration with view tracking |
| `notifications` | Activity feed | Real-time updates for user interactions |
| `story_views` | Story analytics | Track who viewed each story |
| `sessions` | User sessions | Secure session management for auth |

### Database Relationships
- Users have many posts, stories, messages, and notifications
- Posts have many comments and likes
- Comments support nested replies (self-referential)
- Follows create many-to-many user relationships
- Messages create conversations between users

## 🔗 API Reference

### Authentication Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Create new user account |
| `POST` | `/api/auth/login` | Authenticate user |
| `GET` | `/api/auth/user` | Get current user data |
| `POST` | `/api/auth/logout` | End user session |

### Post Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/posts` | Get paginated feed posts |
| `POST` | `/api/posts` | Create new post with media |
| `GET` | `/api/posts/:id` | Get specific post details |
| `DELETE` | `/api/posts/:id` | Delete user's post |
| `POST` | `/api/posts/:id/like` | Toggle like on post |

### User & Social Features
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/users/:id` | Get user profile |
| `PUT` | `/api/users/:id` | Update user profile |
| `GET` | `/api/users/search` | Search users by username |
| `POST` | `/api/users/:id/follow` | Follow user |
| `DELETE` | `/api/users/:id/follow` | Unfollow user |
| `GET` | `/api/users/:id/followers` | Get followers list |
| `GET` | `/api/users/:id/following` | Get following list |

### Comments & Interactions
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/posts/:id/comments` | Get post comments |
| `POST` | `/api/posts/:id/comments` | Add comment to post |
| `DELETE` | `/api/comments/:id` | Delete comment |
| `POST` | `/api/comments/:id/like` | Like comment |

### Real-time Messaging
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/messages` | Get user conversations |
| `GET` | `/api/messages/:userId` | Get conversation with user |
| `POST` | `/api/messages` | Send message |
| `PUT` | `/api/messages/:id/read` | Mark message as read |

### Stories & Temporary Content
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/stories` | Get current stories |
| `POST` | `/api/stories` | Create new story |
| `POST` | `/api/stories/:id/view` | Mark story as viewed |

### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/notifications` | Get user notifications |
| `PUT` | `/api/notifications/:id/read` | Mark notification as read |

## ⚡ WebSocket Events

Real-time communication powered by WebSocket:

### Connection Events
- `connection` - New client connection
- `disconnect` - Client disconnection
- `auth` - Authenticate WebSocket connection

### Messaging Events
- `message` - Send/receive direct messages
- `typing` - Typing indicator updates
- `read` - Message read receipts

### Social Events
- `notification` - Real-time activity notifications
- `post_update` - Live post engagement updates
- `user_status` - Online/offline status changes

## 🚀 Deployment

### Development Environment
- Automatic setup in Replit environment
- Hot reload for frontend and backend
- PostgreSQL database provisioning
- Environment variable management

### Production Deployment
1. **Build Application**:
```bash
npm run build
```

2. **Set Production Environment**:
```bash
NODE_ENV=production
```

3. **Deploy to Replit**:
   - Use Replit's one-click deployment
   - Automatic scaling and SSL certificates
   - Custom domain support available

### Environment Variables
| Variable | Purpose | Auto-configured |
|----------|---------|----------------|
| `DATABASE_URL` | PostgreSQL connection | ✅ |
| `NODE_ENV` | Environment mode | ✅ |
| `REPL_ID` | Replit application ID | ✅ |
| `REPLIT_DOMAINS` | CORS allowed domains | ✅ |
| `SESSION_SECRET` | Session encryption | ✅ |

## 📊 Performance & Optimization

### Frontend Optimizations
- **Code Splitting**: Route-based lazy loading
- **Image Optimization**: Cloudinary transformations
- **Caching**: TanStack Query with intelligent cache invalidation
- **Bundle Size**: Tree shaking and modern ES modules

### Backend Optimizations
- **Database Indexing**: Optimized queries for social features
- **Connection Pooling**: Efficient PostgreSQL connections
- **Rate Limiting**: API protection against abuse
- **Compression**: Gzip response compression

## 🔒 Security Features

### Authentication Security
- **Session-based Auth**: Secure server-side sessions
- **Password Hashing**: bcrypt with salt rounds
- **CSRF Protection**: Cross-site request forgery prevention
- **Rate Limiting**: Login attempt protection

### Data Protection
- **Input Validation**: Zod schema validation
- **SQL Injection Prevention**: Parameterized queries
- **XSS Protection**: Input sanitization
- **CORS Configuration**: Restricted cross-origin requests

## 🤝 Contributing

### Development Workflow
1. **Fork Repository**: Create your own copy
2. **Create Feature Branch**: `git checkout -b feature/amazing-feature`
3. **Make Changes**: Follow the existing code style
4. **Test Thoroughly**: Ensure all features work
5. **Submit Pull Request**: Detailed description of changes

### Code Standards
- **TypeScript**: Strict type checking enabled
- **ESLint**: Code quality enforcement
- **Prettier**: Consistent code formatting
- **Conventional Commits**: Standardized commit messages

### Testing Guidelines
- Write unit tests for utilities and controllers
- Test API endpoints with proper error handling
- Verify frontend components render correctly
- Test real-time features with WebSocket connections

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

### Open Source Components
This project uses various open-source libraries and frameworks. All dependencies are listed in `package.json` with their respective licenses.

## 📞 Support

For questions, issues, or contributions:
- **Issues**: GitHub Issues for bug reports
- **Discussions**: GitHub Discussions for feature requests
- **Documentation**: Check `working.md` for detailed implementation guide