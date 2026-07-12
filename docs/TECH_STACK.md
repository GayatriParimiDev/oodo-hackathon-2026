# TransitOps - Technology Stack

This project is a monorepo containing the frontend and backend services for the TransitOps transit operations manager.

## Core Stack Overview

### Frontend
- **Framework**: React (bootstrapped with Vite)
- **Language**: JavaScript (ES6+)
- **Styling**: Tailwind CSS
- **Routing**: React Router (`react-router-dom`)
- **API Client**: Axios
- **Visualization/Charts**: Recharts
- **Iconography**: Lucide React

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: JavaScript (CommonJS)
- **Database ORM**: Prisma ORM
- **Database Engine**: PostgreSQL
- **CSV Export**: `csv-writer` (fully local file generation)

### Authentication & Security
- **Mechanism**: JSON Web Tokens (JWT) using `jsonwebtoken`
- **Password Hashing**: `bcryptjs`

## Deployment & Setup Strategy
- **Local/Offline Focus**: The application operates fully offline with local configurations. There are zero cloud dependencies, software-as-a-service integrations, or third-party web services required to host, develop, or run the app.
