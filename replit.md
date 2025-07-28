# Honolulu Private Residency Club CRM

## Overview

This is a comprehensive Customer Relationship Management (CRM) system designed for a boutique short-term rental operation managing two properties (P1 with 8 rooms, P2 with 10 rooms) in Honolulu. The application serves dual purposes: a private CRM for internal operations and a public membership inquiry portal for potential guests.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **UI Library**: Radix UI components with shadcn/ui design system
- **Styling**: Tailwind CSS with custom design tokens and Material Design-inspired color palette
- **State Management**: TanStack Query (React Query) for server state management
- **Forms**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Development**: Vite for development server with hot module replacement
- **Build System**: ESBuild for production builds
- **Language**: TypeScript throughout the entire stack

### Database Strategy
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Migration**: Drizzle Kit for schema management
- **Database Provider**: Configured for Neon Database (serverless PostgreSQL)
- **Schema Location**: Shared schema definitions in `/shared/schema.ts`

## Key Components

### Authentication & Authorization
- Custom JWT-based authentication system
- Role-based access control (admin, manager, helper)
- Property-specific access restrictions
- Session management with localStorage token storage

### Core Modules

#### 1. Property & Room Management
- Multi-property support (P1: 8 rooms, P2: 10 rooms)
- Room status tracking (available, occupied, cleaning, maintenance)
- Door code generation with configurable expiration periods
- Cleaning and linen status monitoring

#### 2. Guest & Booking Management
- Guest profile management with contact information
- Flexible booking plans (daily, weekly, monthly rates)
- Payment status tracking (paid, pending, overdue)
- Booking lifecycle management

#### 3. Cleaning & Maintenance
- Task assignment system for different user roles
- Priority-based task management (low, medium, high, critical)
- Progress tracking with completion timestamps
- Property-specific and room-specific task categorization

#### 4. Payment Processing
- Cash and Cash App payment method support
- Manual payment verification workflow
- Transaction logging with reference IDs
- Revenue tracking and reporting

#### 5. Public Inquiry System
- Membership inquiry form for potential guests
- Unique tracking tokens for inquiry status
- Multi-step approval workflow
- Public-facing tracker page for inquiry progress

### UI/UX Design
- Mobile-first responsive design
- Material Design-inspired component library
- Consistent color scheme with semantic status indicators
- Accessible form controls and navigation
- Touch-friendly interface for mobile property management

## Data Flow

### Authentication Flow
1. User submits credentials via login form
2. Server validates against user database
3. JWT token generated and returned to client
4. Token stored in localStorage for session persistence
5. Subsequent requests include Bearer token in Authorization header

### Booking Workflow
1. Guest inquiry submitted through public form
2. Admin reviews and approves inquiry
3. Booking created with room assignment
4. Door codes generated with appropriate expiration
5. Payment verification before code activation
6. Cleaning tasks automatically generated post-checkout

### Task Management Flow
1. Tasks created automatically (post-checkout cleaning) or manually
2. Assignment based on user roles and property access
3. Progress tracking through status updates
4. Completion logging with timestamps and user attribution

## External Dependencies

### Core Dependencies
- **Database**: `@neondatabase/serverless` for PostgreSQL connectivity
- **ORM**: `drizzle-orm` and `drizzle-zod` for type-safe database operations
- **UI Components**: Extensive Radix UI component suite
- **Validation**: Zod for runtime type checking and form validation
- **Styling**: Tailwind CSS with `class-variance-authority` for component variants

### Development Tools
- **Type Checking**: TypeScript with strict configuration
- **Build Tools**: Vite for development, ESBuild for production
- **Code Quality**: ESLint and Prettier (configured via editor)
- **Replit Integration**: Custom Vite plugins for Replit development environment

## Deployment Strategy

### Development Environment
- Replit-hosted development with hot module replacement
- Environment variable configuration for database connections
- Development-specific error overlays and debugging tools

### Production Considerations
- Single-page application build output to `dist/public`
- Server-side rendering disabled for simplified deployment
- Static asset serving through Express.js
- Environment-based configuration switching

### Database Management
- Migration-based schema management
- Seed data for initial property and user setup
- Connection pooling through Neon serverless architecture

### Security Measures
- Role-based route protection
- Input validation at API boundaries
- Secure password hashing with bcrypt
- Environment variable protection for sensitive configuration
- CORS and security headers configuration

The application is designed for single-developer operation with emphasis on rapid development, mobile accessibility, and discrete operation suitable for boutique hospitality management.

## Recent Changes

### January 28, 2025 - Critical Bug Fixes and Database Setup
- **Authentication System Fixed**: Resolved missing `isAuthenticated` method in AuthContext that was preventing proper authentication flow
- **Database Schema Updated**: Added missing properties (`allowedPages`, `masterCode`) to user and room schemas to match database requirements
- **Storage Interface Fixes**: Resolved type mismatches between storage interface and implementation, ensuring proper null handling for optional fields
- **PostgreSQL Integration**: Successfully created and connected to PostgreSQL database, ran migrations to establish proper table structure
- **TypeScript Errors Resolved**: Fixed all LSP diagnostics including syntax errors, type mismatches, and import issues
- **Application Status**: ✅ App now starts successfully without critical errors and serves both backend API and frontend React application

### January 28, 2025 - Code Quality and TypeScript Fixes
- **Test Suite Fixed**: Resolved syntax error in test-operations-dashboard.js where incomplete console log caused JavaScript parsing failure
- **Status Badge Enhancement**: Added explicit return type `{ label: string; className: string }` to getStatusConfig function for better type safety
- **AI Engine Types**: Added comprehensive TypeScript interfaces for all AI engine function parameters (RoomData, MarketData, HistoricalData, etc.)
- **Safe Property Access**: Verified task.assignedTo property is properly null-checked in task-list.tsx component to prevent runtime errors
- **Error Handling**: Confirmed error boundary components have proper JSX structure and closing tags

### Current Application State
- **Server**: Running successfully on port 5000 via Express.js
- **Frontend**: React application loading properly with Vite development server
- **Database**: PostgreSQL connected and migrated with proper schema
- **Authentication**: Context and JWT system properly configured
- **Storage**: In-memory storage with PostgreSQL fallback working correctly
- **Code Quality**: TypeScript errors resolved, proper type safety implemented across components