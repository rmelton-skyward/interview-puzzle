# Frontend Code Puzzle - Movie Explorer

## About This Assessment

This is a take-home coding challenge designed to evaluate your frontend engineering skills. Please complete the requirements appropriate for your position level.

## The Problem

Build a movie search and exploration application that allows users to discover films, view detailed information, and manage their watchlist. Users should be able to search for movies, browse popular titles, and save their favorites.

## Data Source

Use **The Movie Database (TMDB) API** for movie data:
- Website: https://www.themoviedb.org/settings/api
- Free tier: Unlimited requests (with rate limiting)
- Signup: Takes ~2 minutes, instant API key
- Documentation: https://developer.themoviedb.org/docs

**Endpoints you'll likely need:**
- Search movies: `https://api.themoviedb.org/3/search/movie`
- Popular movies: `https://api.themoviedb.org/3/movie/popular`
- Movie details: `https://api.themoviedb.org/3/movie/{movie_id}`
- Movie images: `https://image.tmdb.org/t/p/w500/{poster_path}`
- You can hardcode your API key for this challenge (we won't use it maliciously)

## Requirements by Position Level

### All Frontend Engineers (All Positions)

Build a movie explorer application with the following features:

- **Movie Search**: Allow users to search for movies by title
- **Movie List Display**: Show a grid/list of movies with:
  - Poster image
  - Title
  - Release year
  - Rating (if available)
- **Movie Details View**: Click on a movie to see detailed information:
  - Full poster
  - Title, tagline, overview
  - Release date
  - Runtime
  - Rating
  - Genres
- **Popular/Trending Section**: Display a section of popular or trending movies
- **Error Handling**: Handle invalid searches, API errors, and missing data gracefully
- **Loading States**: Show loading indicators while fetching data
- **Automated Tests**: Include component tests for key functionality
- **README Documentation**: Provide:
  - Description of your approach
  - Instructions to run the application locally
  - Instructions to run tests
  - Note about API key setup

**Technical Requirements:**
- Fetch data from TMDB API
- Display data in a clear, organized layout
- Handle asynchronous operations properly
- Basic routing or view management (search results, detail view)
- Submit via a private GitHub repository

### Mid-Level Positions - Additional Requirements

In addition to the base requirements above:

- **Watchlist/Favorites**: Allow users to save favorite movies (localStorage is fine)
  - Add/remove from watchlist
  - View all watchlist items
  - Persist across sessions
- **Filtering & Sorting**: Add ability to filter by genre AND sort by rating/popularity
- **Responsive Design**: Ensure the application works well on mobile and desktop
- **Accessibility**: Implement basic accessibility features:
  - Keyboard navigation
  - ARIA labels
  - Semantic HTML

### Senior Positions - Additional Requirements

In addition to all requirements above:

- **State Management Architecture**: Implement a robust state management solution
  - Document your choice (Context, Redux, Zustand, TanStack Query, etc.) and rationale
  - Show clear separation of concerns
- **Performance Optimization**: Implement at least two of:
  - Caching strategy to reduce API calls
  - Image lazy loading with placeholders
  - Memoization to optimize re-renders
  - Code splitting for routes
- **Integration Tests**: Include integration tests for critical user flows
- **Architecture Documentation**: In your README, discuss:
  - Your component architecture and rationale
  - Data flow and state management strategy
  - How you would scale this for production

## Technology Stack

Use whatever frontend technologies you're most comfortable with. This is a demonstration of your problem-solving ability and engineering practices, not a test of specific framework knowledge.

**For reference, Skyward's frontend stack includes:**
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
- **User experience** - Is the interface intuitive and visually appealing?
- **Best practices** - Do you follow industry standards and conventions?
- **API Integration** - Do you handle API calls, errors, and edge cases properly?
- **Testing** - Are your tests meaningful and comprehensive?
- **Documentation** - Can someone else understand and run your code?
- **Decision-making** - How well did you handle ambiguity and document your choices?

## Example User Flows

**Basic Flow (All Levels):**
1. User opens the app and sees popular movies
2. User searches for "Inception"
3. Search results appear showing matching movies
4. User clicks on a movie card
5. Movie detail view opens with full information
6. User navigates back to search results

**Mid-Level Flow:**
1. User searches for "Marvel"
2. User filters results by genre (Action)
3. User sorts by rating (highest first)
4. User adds "Avengers: Endgame" to watchlist
5. User navigates to watchlist to see saved movies
6. User removes a movie from watchlist
7. User refreshes page - watchlist persists

**Senior Flow:**
1. User opens app - cached popular movies load instantly
2. User types "The Matrix" - searches and sees results
3. User clicks movie - detail view loads quickly
4. User navigates entirely via keyboard
5. Images load progressively with smooth placeholders
6. Network goes offline - app shows appropriate error state
7. User experiences zero unnecessary re-renders or API calls

## Bonus Points (Optional)

These are completely optional enhancements. Only consider these if you've completed all requirements for your level and have extra time:

- **Demo Video or Screenshots**: Show your application in action
  - Video: Quick Loom or screen recording demonstrating key features
  - Screenshots: Key screens showing search, detail view, watchlist, etc.
  - Either format is appreciated but not required
- **Advanced Features**: Movie recommendations, watch history, search autocomplete, movie comparison
- **Visual Polish**: Smooth transitions, animations, hover effects, cohesive design system, empty states
- **Pagination/Infinite Scroll**: Handle large result sets efficiently
- **E2E Tests**: End-to-end tests for critical user flows
- **Accessibility Audit**: Screen reader testing, keyboard navigation throughout, color contrast compliance
- **Component Documentation**: Storybook, TSDoc, or similar documentation
- **Advanced Filtering**: Multiple search criteria and complex filters
- **Code Quality**: TypeScript strict mode, ESLint strict rules, error boundaries
- **Animations**: Sophisticated animations using Framer Motion, React Spring, or similar
- **Theme Support**: Implement dark mode or multiple theme options
- **PWA Features**: Make the app installable as a Progressive Web App
- **Service Workers**: Implement offline support
- **Deployment**: Deploy to a hosting provider (Vercel, Netlify, GitHub Pages, etc.) and include the URL
- **Additional API Integration**: Integrate with multiple movie APIs (OMDB, IMDB, etc.)
- **Social Features**: Allow users to share their watchlist or favorite movies
- **Analytics**: Track user interactions with proper analytics

**Note:** We review any additional work beyond the requirements. Feel free to showcase your skills in areas you're passionate about!

**AI Integration:** Skyward builds and ships AI systems. Clever integration of AI capabilities (LLM APIs, AI-powered features, intelligent automation) is always appreciated!

## Cost

**This challenge can be completed entirely for FREE:**
- **TMDB API**: Completely free (no credit card required, just email signup at themoviedb.org)
- **Development**: All local (no cloud costs)
- **Optional deployment**: Vercel, Netlify, GitHub Pages, Cloudflare Pages, Surge.sh (all free)
- **Storage**: Client-side only (localStorage) - no backend or database costs
- **CI/CD**: GitHub Actions (free tier), GitLab CI (free tier), Netlify CI (free)

## Submission

Please submit your solution as a private GitHub repository and grant access to the reviewers specified in your interview coordination email.

---

**Want to try a different track?**
- Fullstack: [README-FS.md](README-FS.md) - Build both backend and frontend
- Backend: [README-BE.md](README-BE.md) - Build a seat selection API
- DevOps: [README-DO.md](README-DO.md) - Deploy infrastructure as code
