# Backend Code Puzzle - Seat Selection API

## About This Assessment

This is a take-home coding challenge designed to evaluate your backend engineering skills. Please complete the requirements appropriate for your position level.

## The Problem

Write a REST API to return the best available seat (closest to the front & middle) given a list of open seats. Rows follow alphabetical order with `A` being the first row. Columns follow numerical order from left to right (starting with `1`).

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

### Input Format

Your API should accept JSON input describing the venue layout and available seats:

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
        },
        "h7": {
            "id": "h7",
            "row": "h",
            "column": 7,
            "status": "AVAILABLE"
        }
    }
}
```

### Algorithm Requirements

The solution should find the best open seat (closest to the front & middle) given the input JSON and number of requested seats. Imagine a concert - people want to be as close as possible to the stage. **To keep things simple, any seat in a closer row will always be preferred to a seat in a further row.**

**When multiple seats or seat groups are equidistant from the middle, prefer the option with the lower seat numbers (leftmost).**

**Examples:**
- For a venue with `10 rows` and `12 columns` with all seats open, the best seat would be `A6` (ties are possible; `A6` and `A7` are equidistant, but `A6` has the lower number)
- For `3 seats` requested in the same venue, the best would be `A5`, `A6`, and `A7` (contiguous)
- For `5 columns` and `2 requested seats` - assuming row `A` is fully occupied and row `B` is fully open - the best seats would be `B2` and `B3` (note: `B3` and `B4` are also equidistant from center, but `B2` and `B3` have lower numbers)

All results should be returned as JSON.

## Requirements by Position Level

### All Backend Engineers (All Positions)

- Implement the core seat selection algorithm
- Create a REST API with at least one endpoint that accepts:
  - Venue configuration (layout and available seats)
  - Number of seats requested
  - Returns the best available seats as JSON
- Include automated tests for your algorithm
- Provide a `README.md` with:
  - Description of your approach
  - Instructions to run the application locally
  - Instructions to run tests
- Submit via a private GitHub repository

**Example API Response:**
```json
{
  "seats": ["A5", "A6", "A7"]
}
```

Or with more detail:
```json
{
  "bestSeats": [
    {"id": "a5", "row": "a", "column": 5},
    {"id": "a6", "row": "a", "column": 6},
    {"id": "a7", "row": "a", "column": 7}
  ]
}
```

The exact format is up to you - these are just examples.

### Mid-Level Positions - Additional Requirements

In addition to the base requirements above:

- Implement proper error handling and validation
- Add at least one additional endpoint (e.g., check seat availability, book seats)
- Include integration/API tests in addition to unit tests
- Document your API (OpenAPI/Swagger spec, Postman collection, or similar)
- Consider edge cases in your implementation (no available seats, invalid requests, etc.)

### Senior Positions - Additional Requirements

In addition to all requirements above:

- Provide architectural documentation explaining your design decisions
- Discuss performance and scalability considerations in your README:
  - How would your solution handle a venue with 50,000+ seats?
  - What would you change for a production system?
- Design a database schema for persisting venues and bookings (implementation optional, but include the schema)

## Technology Stack

Use whatever technologies you're most comfortable with. This is a demonstration of your problem-solving ability and engineering practices, not a test of specific language knowledge.

**For reference, Skyward's backend stack includes:**
- Languages: Python, TypeScript/Node.js
- Frameworks: FastAPI, Express
- Infrastructure: Terraform, Jenkins
- Containerization: Docker

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
- **Best practices** - Do you follow industry standards and conventions?
- **Testing** - Are your tests meaningful and comprehensive?
- **Documentation** - Can someone else understand and run your code?
- **Decision-making** - How well did you handle ambiguity and document your choices?

## Bonus Points (Optional)

These are completely optional enhancements. Only consider these if you've completed all requirements for your level and have extra time:

- **Demo Video or Screenshots**: Record a video showing your API in action or provide screenshots
  - Video: Quick Loom recording or asciinema terminal recording showing API requests/responses
  - Screenshots: Postman/curl examples showing your API working
  - Either format is appreciated but not required
- **Observability**: Implement logging, error tracking, and metrics
- **Concurrent Booking Handling**: Implement race condition handling and locking mechanisms
- **Dockerization**: Provide a Dockerfile and docker-compose.yml for easy local setup
- **CI/CD Pipeline**: Include a GitHub Actions or similar CI configuration
- **API Documentation UI**: Host Swagger/OpenAPI docs in the running application
- **Rate Limiting**: Implement API rate limiting
- **Caching Layer**: Add Redis or in-memory caching for venue configurations
- **Database Implementation**: Actually implement the database schema with bookings
- **Deployment**: Deploy to a hosting provider (Heroku, Railway, Fly.io, AWS, etc.) and include the URL

**Note:** We review any additional work beyond the requirements. Feel free to showcase your skills in areas you're passionate about!

**AI Integration:** Skyward builds and ships AI systems. Clever integration of AI capabilities (LLM APIs, AI-powered features, intelligent automation) is always appreciated!

## Cost

**This challenge can be completed entirely for FREE:**
- All development is local (no cloud costs)
- **Optional deployment** (if you want to demo a live URL):
  - Free hosting: Fly.io, Railway, Render free tiers
  - Local + tunneling: ngrok, localtunnel, Cloudflare Tunnel (all free)
- **Database** (if implemented): SQLite (free), Supabase (free tier), PlanetScale (free tier), Neon (free tier)
- **CI/CD**: GitHub Actions (free tier), GitLab CI (free tier)

## Submission

Please submit your solution as a private GitHub repository and grant access to the reviewers specified in your interview coordination email.

---

**Want to try a different track?**
- Fullstack: [README-FS.md](README-FS.md) - Build both backend and frontend
- Frontend: [README-FE.md](README-FE.md) - Build a movie explorer app
- DevOps: [README-DO.md](README-DO.md) - Deploy infrastructure as code
