# Skills Passport MVP

An AI-powered platform that transforms CVs into anonymized, skills-focused profiles with benchmarking and career pathway features.

## Project Structure

```
skills-passport/
├── frontend/          # React.js application with TypeScript
├── backend/           # Node.js/Express API with TypeScript
├── ai-services/       # AI/NLP processing modules
├── database/          # PostgreSQL schema & migrations
├── docs/              # API documentation
└── docker/            # Containerization configs
```

## Technology Stack

### Frontend
- React.js 18+ with TypeScript
- Tailwind CSS for styling
- React Router for navigation
- Recharts for data visualization
- React Hook Form for form management
- React Query for API state management

### Backend
- Node.js with Express.js and TypeScript
- PostgreSQL database with Prisma ORM
- JWT authentication
- Multer for file uploads
- Rate limiting and security middleware

### AI/NLP Services
- OpenAI GPT-4 API for CV parsing and skills extraction
- PDF.js and Mammoth.js for document processing
- Integration with O*NET skills taxonomy

## Core Features (Phase 1 MVP)

1. **CV Upload & Processing**
   - Multi-format CV upload (PDF, DOCX, TXT)
   - AI-powered parsing and skills extraction
   - Company name anonymization
   - Bias detection and removal

2. **Skills Extraction & Taxonomy**
   - Map extracted skills to O*NET Skills taxonomy
   - Categorize skills (technical, soft, industry-specific)
   - Proficiency level assessment

3. **Anonymized Profile Generation**
   - Create anonymized CV templates
   - Unique candidate IDs
   - Skills matrix with proficiency levels

4. **User Dashboard**
   - Upload interface
   - Profile preview and editing
   - Skills visualization
   - Export functionality

## Getting Started

1. Clone the repository
2. Set up environment variables
3. Install dependencies for frontend and backend
4. Run database migrations
5. Start the development servers

## Environment Variables

Create `.env` files in both frontend and backend directories:

### Backend (.env)
```
DATABASE_URL="postgresql://username:password@localhost:5432/skills_passport"
JWT_SECRET="your-jwt-secret"
OPENAI_API_KEY="your-openai-api-key"
NODE_ENV="development"
PORT=3001
```

### Frontend (.env)
```
REACT_APP_API_URL="http://localhost:3001/api"
```

## Development

```bash
# Install dependencies
cd frontend && npm install
cd ../backend && npm install

# Start development servers
npm run dev  # In both frontend and backend directories
```

## Security & Privacy

- GDPR-compliant data handling
- Encryption for sensitive data at rest
- Secure file upload with validation
- Rate limiting and input validation
- Audit logging for data access
