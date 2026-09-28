# Skyward IT Solutions - Coding Challenge

Welcome to Skyward IT Solutions' coding challenge! This is a take-home assessment designed to evaluate your engineering skills in a realistic problem-solving scenario.

## About Skyward IT Solutions

[Skyward IT Solutions](https://skywarditsolutions.com) is a people-centered IT solutions company dedicated to empowering government digital modernization. We pioneer federal AI solutions with proven results and purpose, combining cutting-edge technology and public sector expertise to drive government efficiency through passionate, humble service.

As federal AI implementation experts transforming CMS (Centers for Medicare & Medicaid Services) operations, we value engineers who can build scalable, secure, and accessible systems that serve the public sector.

## Our Interview Process

We want to be transparent about what to expect as you move through our interview process:

1. **Application** - You submit your application through our formalized system
2. **Initial Screen Call** - You will be contacted to schedule an initial phone screen (30 minutes) with our Head of Talent
3. **Coding Challenge** - Our Head of Talent will then send you a link to this repository with your specific track
4. **Tech Challenge Review** - Our engineering team reviews your submission for code quality, functionality, and adherence to requirements
5. **First Interview** - You'll have an interview with technical and behavioral components where we discuss your solution and work experience
6. **Deep Dive Interview** - A more in-depth technical conversation exploring your engineering approach and problem-solving
7. **Decision** - We'll make a final hiring decision within one week of your final interview

This coding challenge is step 3 in our process. We appreciate the time you're investing and have designed this to be a meaningful but respectful use of your time.

## Overview

This coding challenge is designed to evaluate your engineering skills through a practical problem-solving exercise. The specific challenge varies by track, but all are scoped to respect your time while demonstrating your abilities.

## This Repository

This checkout contains a completed full-stack venue seat-selection and booking application. The
browser client is built with React, TypeScript, and Vite; the API uses Express, Prisma, and
PostgreSQL. The deterministic selector recommends contiguous available seats, while the optional
AI assistant only extracts party-size preferences.

- [Setup and run instructions](Setup-Instructions.md)
- [System architecture and request flows](Architecture.md)
- [Backend implementation and API guide](backend/README.md)
- [Frontend components and state flow](frontend/README.md)

Venue names are limited to 30 characters and unique case-insensitively. Layouts allow up to 50 rows
and 1,000 columns. Docker Compose serves the frontend at `http://localhost:5173` by default; the
setup guide documents port overrides.

## Important Notes

- This is an **unpaid** take-home assessment - we respect your time and have scoped it accordingly
- **Following instructions is a critical part of our evaluation** - please read the requirements carefully for your level
- Use whatever technologies you're most comfortable with
- Focus on demonstrating your problem-solving approach and engineering practices
- Submit your solution as a **private GitHub repository**
- Include a README with instructions to run your code locally

### Handling Ambiguity

**Real-world engineering often involves incomplete or unclear requirements.** When you encounter ambiguity in the challenge:

- Use your best judgment to make reasonable decisions
- Document your assumptions and reasoning in your README
- Be prepared to explain your interpretation during the technical review

Part of what we're evaluating is your ability to handle ambiguity, make thoughtful decisions, and articulate your reasoning. There may not always be a single "correct" answer - we want to see how you think through problems and justify your approach.

**If something is truly blocking your progress**, reach out to your recruiting contact with specific questions.

### AI Usage Policy

**We encourage the use of AI coding assistants** (GitHub Copilot, Claude, ChatGPT, etc.) during this challenge. Modern software engineering involves leveraging all available tools effectively.

**However, be prepared to:**
- Explain and defend every line of code you submit
- Discuss the reasoning behind your architectural decisions
- Demonstrate deep understanding of how your implementation works
- Answer detailed questions about trade-offs and alternatives

During the technical review, we'll ask you to walk through your code and may ask questions like:
- "Why did you choose this approach?"
- "What does this function do and how does it work?"
- "What are the trade-offs of your implementation?"
- "How would you handle [specific edge case]?"

Using AI to help write code is fine - submitting code you don't understand is not.

### AI Integration

**Skyward builds, ships, and works with AI systems.** If you find clever ways to integrate AI capabilities into your solution (LLM APIs, AI-powered features, intelligent automation), we'd love to see it! This is always appreciated and demonstrates forward-thinking engineering.

## Questions?

If you have any questions about the requirements or need clarification, please reach out to your recruiting contact.

Good luck!

---

## License & Open Source

This coding challenge is open source and available under the MIT License. We believe in transparency and collaboration in hiring practices, and we'd be happy if other companies used this or created similar assessment frameworks.

**For other companies:** Feel free to fork this repository and adapt it for your own hiring process. We believe take-home assessments should:
- Respect candidates' time (2-6 hours max)
- Be doable for free
- Test real-world skills
- Have clear evaluation criteria
- Allow for creativity and additional work

If you use or adapt this framework, we'd love to hear about it! Reach out at [careers@skywarditsolutions.com](mailto:careers@skywarditsolutions.com).

© 2025 Skyward IT Solutions | [skywarditsolutions.com](https://skywarditsolutions.com)
