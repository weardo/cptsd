# CPTSD Journal - AI-Assisted Mental Health Journaling

A chat-first AI-assisted mental health journaling and insights product built with Next.js 16, React 19, TypeScript, and Tailwind 4.

## Features

- **Chat-First UI**: Natural conversation interface for journaling
- **Daily Check-ins**: Guided check-in flow to track mood, energy, sleep, stressors, and positives
- **Free Writing**: Long-form journaling with AI support
- **AI Analysis**: Automatic analysis of journal entries (emotions, themes, stressors, sentiment)
- **Weekly Insights**: AI-generated weekly summaries and trends
- **Safety Layer**: Crisis detection with emergency resources
- **Background Processing**: Asynchronous job processing for analysis and insights

## Architecture

### Monorepo Structure

```
apps/cptsd-journal/          # Next.js application (port 3003)
services/worker/             # Background job processor
packages/db/                 # Shared MongoDB models
packages/ai/                 # Shared AI adapters and safety
```

### Data Models

- **JournalConversation**: User conversations
- **JournalMessage**: Individual messages (user/assistant)
- **JournalEntry**: Derived entries from messages
- **EntryAnalysis**: AI analysis of entries
- **WeeklyInsight**: Weekly summaries and trends
- **SafetyEvent**: Safety flagging events
- **Job**: Background job queue

### API Routes

- `POST /api/v1/chat/send` - Send chat message
- `GET /api/v1/chat/history` - Get conversation history
- `GET /api/v1/journal/entries` - List journal entries
- `GET /api/v1/journal/entry/:id` - Get entry details
- `POST /api/v1/insights/weekly/generate` - Enqueue weekly insight
- `GET /api/v1/insights/weekly` - List weekly insights

## Setup

### Prerequisites

- Node.js 20+
- MongoDB (shared with other apps)
- OpenAI API key
- Docker and Docker Compose (for deployment)

### Local Development

1. **Install dependencies**:

   ```bash
   cd apps/cptsd-journal
   npm install
   ```

2. **Set up environment variables**:

   ```bash
   cp .env.example .env.local
   # Edit .env.local with your values
   ```

3. **Start MongoDB** (if not already running):

   ```bash
   docker-compose up -d mongodb
   ```

4. **Run the development server**:

   ```bash
   npm run dev
   ```

5. **Start the worker** (in a separate terminal):
   ```bash
   cd services/worker
   npm install
   npm run dev
   ```

### Docker Deployment

1. **Build and start services**:

   ```bash
   docker-compose up -d
   ```

2. **Set up Caddy reverse proxy**:

   ```bash
   ./scripts/setup-caddy.sh
   ```

3. **Configure DNS**:
   - Add A record: `ai` → `37.27.39.20` (or your server IP)

## Environment Variables

```env
# Database
MONGODB_URI=mongodb://admin:changeme@mongodb:27017/cptsd-journal?authSource=admin

# NextAuth
NEXTAUTH_URL=http://localhost:3003
NEXTAUTH_SECRET=your-secret-key-min-32-chars

# Authentication
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=changeme

# OpenAI
OPENAI_API_KEY=sk-proj-...
OPENAI_MODEL=gpt-4o-mini
OPENAI_BASE_URL= # Optional
```

## Safety Features

- **Keyword Detection**: Fast heuristic-based detection of crisis language
- **LLM Classification**: Optional LLM-based classification for ambiguous cases
- **Safe Responses**: Automatic safe response templates for high-risk content
- **Emergency Resources**: India-specific crisis resources displayed when needed
- **Safety Events**: All safety events are logged for review

## Job Queue

The worker service processes background jobs:

- **ENTRY_ANALYSIS**: Analyzes journal entries asynchronously
- **WEEKLY_INSIGHT**: Generates weekly insights from entries

Jobs use exponential backoff for retries and are processed with atomic locking to prevent duplicate processing.

## Future Roadmap

- [ ] RAG integration with vector search
- [ ] Mobile app support (API-ready)
- [ ] Scheduled insight generation
- [ ] Data export/deletion (privacy)
- [ ] Encryption at rest for sensitive data
- [ ] Advanced analytics dashboard
- [ ] Multi-language support

## Security & Privacy

- All routes except `/login` and `/api/auth` require authentication
- Rate limiting: 30 requests per minute per user
- Logging redaction: Sensitive journal content is redacted from logs
- No medical claims or clinical diagnosis
- Clear disclaimers about non-emergency nature

## Testing

```bash
# Type checking
npm run type-check

# Linting
npm run lint
```

## License

Private - CPTSD Project


