# Fullstack Code Puzzle - Seat Selection System

## About This Assessment

This is a take-home coding challenge designed to evaluate your fullstack engineering skills. Please complete the requirements appropriate for your position level.

## The Problem

Build a complete seat selection system for a concert venue, including both a REST API backend and an interactive frontend interface. Users should be able to view the venue layout, see available seats, request the best seats for their party size, and complete a booking.

## Backend Requirements

Your backend should implement the seat selection API as described in the [Backend Challenge](README-BE.md). Specifically:

```
+----------------------------------+
|                                  |
|            STAGE                 |
|                                  |
+----------------------------------+

 +--+ +--+ +--+ +--+ +--+ +--+ +--+
 |A1| |A2| |A3| |A4| |A5| |A6| |A7|
 +--+ +--+ +--+ +--+ +--+ +--+ +--+
 +--+ +--+ +--+ +--+ +--+ +--+ +--+
 |B1| |B2| |B3| |B4| |B5| |B6| |B7|
 +--+ +--+ +--+ +--+ +--+ +--+ +--+
 +--+ +--+ +--+ +--+ +--+ +--+ +--+
 |C1| |C2| |C3| |C4| |C5| |C6| |C7|
 +--+ +--+ +--+ +--+ +--+ +--+ +--+
```

### Input/Output Format

**Input JSON:**
```json
{
    "venue": {
        "layout": {
            "rows": 10,
            "columns": 50
        }
    },
    "seats": {
        "a1": {
            "id": "a1",
            "row": "a",
            "column": 1,
            "status": "AVAILABLE"
        },
        "b5": {
            "id": "b5",
            "row": "b",
            "column": 5,
            "status": "AVAILABLE"
        }
    }
}
```

### Algorithm Requirements

The algorithm should find the best available seats (closest to front & middle) for a requested party size. **Any seat in a closer row is always preferred to a seat in a further row.** For groups, seats must be contiguous.

**Examples:**
- Venue with `10 rows` x `12 columns`, all open: best seat is `A6` or `A7`
- Same venue, `3 seats` requested: best is `A5`, `A6`, `A7` (contiguous center)
- `5 columns`, `2 seats`, row A occupied, row B open: best is `B2` and `B3`

## Requirements by Position Level

### All Fullstack Engineers (All Positions)

**Backend (API):**
- Implement the core seat selection algorithm
- Create REST API endpoints:
  - GET/POST endpoint to get best available seats given venue config and party size
  - GET endpoint to retrieve current venue status
- Include automated tests for algorithm and API
- Handle JSON input/output as specified above

**Frontend (Interface):**
- Display visual seat grid showing venue layout
- Show seat status (available, reserved, best available)
- Allow users to input party size
- Highlight the best available seats for the requested party size
- Allow users to "book" the highlighted seats
- Show loading states while communicating with API
- Handle errors gracefully

**Integration:**
- Frontend should call your backend API (not a mock)
- Properly handle async communication
- CORS configuration if needed

**Documentation:**
- README with setup instructions for both frontend and backend
- How to run the complete application locally
- How to run tests

### Mid-Level Positions - Additional Requirements

In addition to the base requirements above:

**Backend:**
- Error handling and validation for all endpoints
- One additional endpoint (book seats OR check availability)
- Integration tests
- API documentation (OpenAPI/Swagger or similar)

**Frontend:**
- Responsive design (mobile and desktop)
- Booking confirmation flow with summary
- Basic accessibility (keyboard navigation, ARIA labels)

**Data Persistence:**
- Store bookings in memory or simple file (SQLite/database is optional)
- Bookings should persist during the session

### Senior Positions - Additional Requirements

In addition to all requirements above:

**Backend:**
- Database schema with proper relationships (SQLite/PostgreSQL)
- Architectural documentation explaining design decisions
- Performance considerations for large venues in your README

**Frontend:**
- State management architecture (document your choice and rationale)
- At least one performance optimization (caching, memoization, or lazy loading)
- Integration tests for critical flows

**System Design:**
- Document in README:
  - Overall system architecture diagram
  - Data flow between frontend and backend
  - How you would deploy this to production

## Technology Stack

Use whatever technologies you're most comfortable with. This is a demonstration of your problem-solving ability and engineering practices.

**For reference, Skyward's fullstack includes:**

**Backend:**
- Languages: Python, TypeScript/Node.js
- Frameworks: FastAPI, Express
- Databases: PostgreSQL, MongoDB
- Infrastructure: Terraform, Jenkins, Docker

**Frontend:**
- Framework: React
- Build tool: Vite
- Language: TypeScript
- Styling: CSS Modules / Tailwind CSS
- Testing: Vitest, React Testing Library

You're welcome to use any of these technologies, but it's not required.

## Handling Ambiguity

**Real-world engineering often involves incomplete or unclear requirements.** When you encounter ambiguity in the challenge:

- Use your best judgment to make reasonable decisions
- Document your assumptions and reasoning in your README
- Be prepared to explain your interpretation during the technical review

Part of what we're evaluating is your ability to handle ambiguity, make thoughtful decisions, and articulate your reasoning. There may not always be a single "correct" answer - we want to see how you think through problems and justify your approach.

**If something is truly blocking your progress**, reach out to your recruiting contact with specific questions.

## Evaluation Criteria

We will review your submission based on:

- **Following instructions** - Did you complete the requirements for your level?
- **Code quality** - Is your code clean, readable, and well-organized?
- **Architecture** - How well do your frontend and backend work together?
- **Best practices** - Do you follow industry standards and conventions?
- **User experience** - Is the interface intuitive and functional?
- **Testing** - Are your tests meaningful and comprehensive?
- **Documentation** - Can someone else understand and run your complete system?
- **Decision-making** - How well did you handle ambiguity and document your choices?

## Example User Flow

**Basic Flow (All Levels):**
1. User opens the frontend application
2. Venue layout displays with all available seats
3. User enters party size: 3
4. Frontend calls API to get best seats
5. Seats A5, A6, A7 highlight as "best available"
6. User clicks "Book These Seats"
7. Frontend calls booking API
8. Confirmation message displays
9. Seats update to "reserved" status

**Mid-Level Flow:**
1. User opens app on mobile device - responsive layout
2. User requests 2 seats
3. User sees best seats highlighted
4. User confirms booking - sees summary modal
5. User completes booking - gets confirmation
6. User refreshes page - booking persists

**Senior Flow:**
1. User opens app - interface loads with optimized performance
2. User requests 4 seats
3. Frontend efficiently renders seat grid for large venue
4. User books seats - data persists in database
5. User views architecture diagram in README
6. Reviewer examines clean component structure and state management
7. System demonstrates production-ready code quality

## Bonus Points (Optional)

These are completely optional. Only consider if you've completed all requirements for your level and have extra time:

- **Demo Video or Screenshots**: Show your complete system in action
  - Video: Quick Loom or screen recording demonstrating booking flow from frontend to backend
  - Screenshots: Key screens showing seat selection, booking process, confirmation
  - Either format is appreciated but not required
- **Concurrent Booking Handling**: Implement race condition handling and locking mechanisms
- **Real-time Updates**: WebSocket implementation for live seat availability across clients
- **Booking Expiration**: Implement timeout that holds seats for X minutes
- **Multiple Venues**: Support multiple venue configurations
- **Admin Interface**: Venue management interface
- **Observability**: Comprehensive logging, metrics, and error tracking
- **E2E Testing**: End-to-end tests for critical user flows
- **Advanced Accessibility**: Screen reader testing, full keyboard navigation
- **Component Documentation**: Storybook or similar documentation
- **Authentication**: User accounts and login system
- **Payment Integration**: Mock payment flow
- **Email Notifications**: Booking confirmation emails
- **QR Codes**: Generate QR codes for tickets
- **Analytics Dashboard**: Admin view of bookings, popular seats, etc.
- **Dockerization**: Complete docker-compose setup for entire stack
- **CI/CD Pipeline**: Automated testing and deployment
- **Deployment**: Deploy complete system and include URL

**Note:** We review any additional work beyond the requirements. Feel free to showcase your skills in areas you're passionate about!

**AI Integration:** Skyward builds and ships AI systems. Clever integration of AI capabilities (LLM APIs, AI-powered features, intelligent automation) is always appreciated!

## Cost

**This challenge can be completed entirely for FREE:**
- All development is local (no cloud costs)
- **Database options**: SQLite (free), PostgreSQL via Docker (free), Supabase (free tier), PlanetScale (free tier), Neon (free tier)
- **Optional deployment** (if you want to demo a live URL):
  - Backend: Fly.io, Railway, Render free tiers
  - Frontend: Vercel, Netlify, GitHub Pages, Cloudflare Pages
  - Local + tunneling: ngrok, localtunnel, Cloudflare Tunnel (all free) for backend
- **CI/CD**: GitHub Actions (free tier), GitLab CI (free tier)

## Submission

Please submit your solution as a private GitHub repository with:
- Clear folder structure (e.g., `/backend` and `/frontend` directories)
- Root README with instructions to run the complete system
- Grant access to the reviewers specified in your interview coordination email

## Project Structure Suggestion

```
/
├── README.md (how to run everything)
├── backend/
│   ├── README.md
│   ├── src/
│   ├── tests/
│   └── requirements.txt or package.json
├── frontend/
│   ├── README.md
│   ├── src/
│   ├── tests/
│   └── package.json
└── docker-compose.yml (optional)
```

---

**Want to try a different track?**
- Backend only: [README-BE.md](README-BE.md) - Build a seat selection API
- Frontend only: [README-FE.md](README-FE.md) - Build a movie explorer app
- DevOps: [README-DO.md](README-DO.md) - Deploy infrastructure as code
