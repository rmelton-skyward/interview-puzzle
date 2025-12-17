# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is the Skyward IT Solutions interview coding challenge repository - a multi-track take-home assessment for evaluating candidates at different engineering positions (Backend, Frontend, Fullstack, DevOps). The repository is open source under MIT License and designed to be used by other companies as a hiring template.

## Project Structure

The repository contains multiple challenge tracks, each with position-level requirements (Junior, Mid-Level, Senior):

- `README.md` - Main entry point explaining the interview process and track selection
- `README-BE.md` - Backend challenge: Seat selection REST API with algorithm implementation
- `README-FE.md` - Frontend challenge: Movie explorer application using TMDB API
- `README-FS.md` - Fullstack challenge: Complete seat selection system (API + UI)
- `README-DO.md` - DevOps challenge: Infrastructure as Code deployment
- `sample-app/` - Sample Python Flask application for DevOps challenge deployment
- `LICENSE` - MIT License for open source sharing

## Understanding the Requirements Format

All challenge READMEs use a **stacked requirements format**:

- Base requirements apply to ALL position levels
- Mid-Level sections are ADDITIVE (base + mid-level requirements)
- Senior sections are ADDITIVE (base + mid-level + senior requirements)

When making changes to requirements, maintain this stacked structure so candidates applying for senior positions understand they need to implement all three levels.

## Key Architectural Concepts

### Backend Challenge (README-BE.md)

The seat selection algorithm must:

- Find best available seat(s) closest to front (row A) and middle
- **Critical rule**: Any seat in a closer row is ALWAYS preferred over seats in further rows
- **Tie-breaking rule**: When equidistant from middle, prefer lower seat numbers (leftmost)
- Groups require contiguous seating
- Input: JSON with venue layout and available seats
- Output: JSON with best available seats

Example tie-breaking: For 12 columns, seats A6 and A7 are equidistant from middle, but A6 wins (lower number).

### Frontend Challenge (README-FE.md)

Uses TMDB API (The Movie Database) - requires free API key signup. Core features progress by level:

- All levels: Search, display grid, detail view, popular section, loading/error states
- Mid-level adds: Watchlist (localStorage), filtering/sorting, responsive design, accessibility
- Senior adds: State management, performance optimization (caching/lazy loading/memoization), integration tests

### Fullstack Challenge (README-FS.md)

Combines backend seat selection API with frontend seat grid interface. Integration between frontend and backend is critical - must use real API calls, not mocks.

### DevOps Challenge (README-DO.md)

Deploy the sample Flask app (or custom app) with IaC. Emphasizes **cost-free completion** using free tiers or local alternatives:

- Oracle Cloud always-free tier recommended
- Local options: Docker Compose + ngrok/localtunnel for public access
- SQLite database satisfies database requirement without separate DB instance

## Sample Application (sample-app/)

Simple Python Flask web app for DevOps challenge:

- Run locally: `pip install -r requirements.txt && python app.py`
- Build Docker image: `docker build -t devops-challenge .`
- Run container: `docker run -p 8080:8080 devops-challenge`
- Environment variables: `ENVIRONMENT`, `PORT`, `DB_PATH`, `CLOUD_PROVIDER`, `CLOUD_REGION`
- Endpoints: `/` (web page), `/api/health` (health check JSON)
- Database: Uses SQLite (file-based, no separate DB server needed)

## Common Operations

### Testing Sample App

```bash
cd sample-app
pip install -r requirements.txt
python app.py
# Access at http://localhost:8080
```

### Docker Operations

```bash
cd sample-app
docker build -t devops-sample .
docker run -p 8080:8080 -e ENVIRONMENT=dev devops-sample
```

## Important Policies

### Handling Ambiguity

All challenges now include guidance that **requirements may be unclear or incomplete** (reflecting real-world engineering). Candidates are encouraged to:

- Use best judgment when encountering ambiguity
- Document assumptions and reasoning in their README
- Be prepared to explain their interpretation during technical review
- Only reach out if something is truly blocking their progress

This is explicitly evaluated as "Decision-making" in all challenge evaluation criteria. The philosophy: there may not be a single "correct" answer - we evaluate how candidates think through problems and justify approaches. Candidates should work through ambiguity independently rather than seeking clarification for every unclear point.

### AI Usage Policy

The challenges **encourage AI usage** (Copilot, Claude, ChatGPT) but candidates must be able to explain every line. Technical reviews will probe understanding with questions about trade-offs, alternatives, and edge cases.

### Cost Policy

All challenges are designed to be **completely free** to complete:

- Use free tiers, local development, or free hosting options
- Document cost considerations in challenge descriptions
- Never require paid services for base requirements

### Evaluation Criteria

Consistent across all tracks:

1. Following instructions (completing requirements for specified level)
2. Code quality (clean, readable, well-organized)
3. Best practices (industry standards and conventions)
4. Testing (meaningful and comprehensive)
5. Documentation (clear setup and execution instructions)

## Editing Guidelines

When updating challenge requirements:

- Maintain stacked format (base → mid-level → senior)
- Keep bonus points clearly optional and separate
- Ensure free completion paths for all requirements
- Update evaluation criteria if adding new requirement categories
- Keep examples concrete and clear (avoid ambiguity)
- Always ensure markdown list formatting has blank lines before and after lists

## Branding

- Company: Skyward IT Solutions (skywarditsolutions.com)
- Contact: careers@skywarditsolutions.com
- Focus: Federal AI solutions, government digital modernization, CMS operations
- Never add Claude branding to this work
