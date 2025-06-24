# Instagram Clone

A feature-rich Instagram-like social media application built with React, Express.js, and PostgreSQL.

## Features

- **User Authentication**: Secure login with Replit Auth
- **Posts**: Create, view, like, and comment on posts
- **Stories**: 24-hour temporary content with view tracking
- **Real-time Messaging**: Direct messaging with WebSocket support
- **User Profiles**: Follow/unfollow users and view profiles
- **Feed**: Infinite scroll feed with posts from followed users
- **Mobile Responsive**: Instagram-like UI that works on all devices

## Tech Stack

- **Frontend**: React 18 + TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Replit Auth with OpenID Connect
- **Real-time**: WebSockets for messaging and notifications
- **Query Management**: TanStack Query (React Query)

## Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   └── lib/            # Utilities and configurations
├── server/                 # Express.js backend
│   ├── routes.ts           # API routes
│   ├── storage.ts          # Database operations
│   ├── db.ts               # Database connection
│   └── replitAuth.ts       # Authentication setup
├── shared/                 # Shared TypeScript types
│   └── schema.ts           # Database schema and types
└── package.json
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- Replit account (for authentication)

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd instagram-clone
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
DATABASE_URL=your_postgresql_connection_string
SESSION_SECRET=your_session_secret
REPL_ID=your_replit_app_id
REPLIT_DOMAINS=your_domain.replit.app
```

4. Push database schema:
```bash
npm run db:push
```

5. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## Database Schema

The application uses PostgreSQL with the following main tables:

- **users**: User profiles and authentication data
- **posts**: User posts with media and captions
- **comments**: Comments on posts
- **likes**: Post and comment likes
- **follows**: User follow relationships
- **messages**: Direct messages between users
- **stories**: Temporary 24-hour content
- **notifications**: User notifications
- **savedPosts**: User saved posts

## API Endpoints

### Authentication
- `GET /api/login` - Initiate login flow
- `GET /api/logout` - Logout user
- `GET /api/auth/user` - Get current user

### Posts
- `GET /api/posts/feed` - Get feed posts
- `POST /api/posts` - Create new post
- `POST /api/posts/:id/like` - Toggle like on post
- `GET /api/posts/:id/comments` - Get post comments

### Users
- `GET /api/users/:id` - Get user profile
- `POST /api/users/:id/follow` - Follow/unfollow user
- `GET /api/users/search` - Search users

### Messages
- `GET /api/messages/conversations` - Get user conversations
- `GET /api/messages/:userId` - Get conversation with user
- `POST /api/messages` - Send message

### Stories
- `GET /api/stories/following` - Get stories from followed users
- `POST /api/stories` - Create new story

## WebSocket Events

The application uses WebSockets for real-time features:

- **auth**: Authenticate WebSocket connection
- **message**: Send/receive messages
- **new_message**: Broadcast new messages
- **typing**: Typing indicators

## Deployment

The application is configured for deployment on Replit:

1. Set up environment variables in Replit Secrets
2. Configure database connection
3. Deploy using Replit's deployment system

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is open source and available under the MIT License.