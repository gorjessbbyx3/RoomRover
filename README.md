
# Honolulu Private Residency Club CRM

A comprehensive Customer Relationship Management (CRM) system designed for boutique short-term rental operations managing multiple properties in Honolulu. The application serves as both a private CRM for internal operations and a public membership inquiry portal for potential guests.

## Features

- **Property Management**: Manage multiple properties with room-level control
- **Booking System**: Handle reservations, check-ins, and check-outs
- **Inquiry Portal**: Public-facing membership inquiry system with tracking
- **Cleaning Management**: Task management for housekeeping operations
- **Payment Tracking**: Monitor payments and financial transactions
- **Door Code Management**: Automated door code generation and management
- **Role-based Access**: Admin, manager, and staff role permissions
- **Reports**: Comprehensive reporting dashboard

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Wouter** for client-side routing
- **Radix UI** components with shadcn/ui design system
- **Tailwind CSS** for styling
- **TanStack Query** for server state management
- **React Hook Form** with Zod validation

### Backend
- **Node.js** with Express.js
- **TypeScript** throughout the entire stack
- **Drizzle ORM** with PostgreSQL
- **Passport.js** for authentication
- **Express Sessions** for session management

### Database
- **PostgreSQL** (Neon Database serverless)
- **Drizzle Kit** for migrations

## Development Setup on Replit

1. **Fork this Repl** or import from GitHub
2. **Install dependencies** (automatic on Replit)
3. **Set up environment variables** in the Secrets tab:
   ```
   DATABASE_URL=your_neon_database_url
   SESSION_SECRET=your_session_secret_key
   NODE_ENV=development
   ```
4. **Run the development server**:
   ```bash
   npm run dev
   ```
5. **Push database schema**:
   ```bash
   npm run db:push
   ```

## Environment Variables

Required environment variables for deployment:

- `DATABASE_URL`: PostgreSQL connection string (Neon Database recommended)
- `SESSION_SECRET`: Secret key for session encryption
- `NODE_ENV`: Set to "production" for production deployment
- `PORT`: Port number (automatically set by Replit)

## Deployment on Replit

### Quick Deploy

1. **Click the Deploy button** in your Repl
2. **Choose Autoscale deployment**
3. **Configure deployment settings**:
   - **Build command**: `npm run build`
   - **Run command**: `npm run start`
   - **Machine configuration**: Default (1vCPU, 2 GiB RAM)

### Manual Deployment Configuration

1. **Set up secrets** in the Replit Secrets tab:
   ```
   DATABASE_URL=your_production_database_url
   SESSION_SECRET=your_production_session_secret
   NODE_ENV=production
   ```

2. **Build the application**:
   ```bash
   npm run build
   ```

3. **Deploy using Replit's deployment feature**:
   - Navigate to the Deployments tab
   - Click "New Deployment"
   - Select "Autoscale"
   - Configure build and run commands as above

### Database Setup

1. **Create a Neon Database account** (free tier available)
2. **Create a new database project**
3. **Copy the connection string** to your environment variables
4. **Run migrations**:
   ```bash
   npm run db:push
   ```

## Project Structure

```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Route components
│   │   ├── lib/           # Utilities and configurations
│   │   └── hooks/         # Custom React hooks
├── server/                # Backend Express application
│   ├── index.ts          # Server entry point
│   ├── routes.ts         # API routes
│   └── storage.ts        # Database configuration
├── shared/               # Shared types and schemas
│   └── schema.ts         # Database schema definitions
└── package.json          # Dependencies and scripts
```

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run check` - Type checking
- `npm run db:push` - Push database schema changes

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/verify` - Verify authentication
- `POST /api/auth/logout` - User logout

### Properties & Rooms
- `GET /api/properties` - Get all properties
- `GET /api/rooms` - Get all rooms
- `PUT /api/rooms/:id` - Update room details
- `PUT /api/properties/:id/front-door-code` - Update front door code

### Bookings & Inquiries
- `GET /api/bookings` - Get all bookings
- `POST /api/bookings` - Create new booking
- `GET /api/inquiries` - Get all inquiries
- `POST /api/inquiries` - Create new inquiry

### Cleaning & Maintenance
- `GET /api/cleaning-tasks` - Get cleaning tasks
- `POST /api/cleaning-tasks` - Create cleaning task
- `PUT /api/cleaning-tasks/:id` - Update cleaning task

## Default Users

The system includes default admin users for initial setup:
- **Admin**: `admin@company.com` / `admin123`
- **Manager**: `manager@company.com` / `manager123`

## Security Features

- Password hashing with bcrypt
- Session-based authentication
- Role-based access control
- Input validation with Zod
- CORS protection
- Environment variable protection

## Support

For technical support or questions about deployment, refer to the Replit documentation or create an issue in the project repository.

## License

This project is licensed under the MIT License.
