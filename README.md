# Letter Writer

A web application to help professors manage recommendation letter requests from students.

## Features

- **Student Portal**: Students enter a unique code to submit their information and supporting documents
- **Template System**: Rich text templates with variable interpolation (e.g., `{{student_name}}`)
- **Letter Generation**: Generate personalized letters from templates
- **PDF Export**: Generate professional PDFs of letters
- **Email Integration**: Send letters directly via email
- **Submission Tracking**: Track where letters need to be sent and their status

## Tech Stack

- **Backend**: Node.js + Express + TypeScript
- **Frontend**: React + Vite + TypeScript + Tailwind CSS
- **Database**: PostgreSQL with Prisma ORM
- **Rich Text Editor**: TipTap
- **PDF Generation**: Puppeteer
- **Email**: Nodemailer

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone <repo-url>
   cd LetterWriter
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up the backend environment:
   ```bash
   cp backend/.env.example backend/.env
   # Edit backend/.env with your database URL and other settings
   ```

4. Set up the database:
   ```bash
   npm run db:push
   ```

5. Start the development servers:
   ```bash
   npm run dev
   ```

   This starts both:
   - Backend: http://localhost:3001
   - Frontend: http://localhost:5173

## Project Structure

```
LetterWriter/
├── backend/           # Node.js + Express API
│   ├── src/
│   │   ├── config/    # Configuration
│   │   ├── routes/    # API routes
│   │   ├── controllers/
│   │   ├── services/  # Business logic
│   │   ├── middleware/
│   │   └── utils/
│   ├── prisma/        # Database schema
│   └── uploads/       # File storage
├── frontend/          # React + Vite app
│   └── src/
│       ├── api/       # API client
│       ├── components/
│       ├── pages/
│       ├── hooks/
│       └── context/
└── shared/            # Shared TypeScript types
```

## Available Scripts

- `npm run dev` - Start both frontend and backend in development mode
- `npm run dev:backend` - Start only the backend
- `npm run dev:frontend` - Start only the frontend
- `npm run build` - Build all packages for production
- `npm run db:migrate` - Run database migrations
- `npm run db:push` - Push schema to database (dev)
- `npm run db:studio` - Open Prisma Studio

## License

MIT
