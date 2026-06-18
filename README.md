# GuJot

GuJot is a personal finance and expense-tracking application.

## Draft ADR

This section captures the current architectural direction for the project.

### Stack Decisions

- Monorepo structure
- Elysia for the backend
- SvelteKit with Svelte 5 runes for the frontend
- Docker for local development
- GitHub Actions pipeline for deployment

### Dependencies

- TanStack Query for Svelte
- Playwright for UI testing
- A component framework to be decided

### Architectural Patterns

- SvelteKit application patterns
- Elysia best practices for backend structure

### Development and Deployment

- Use Docker to provide a consistent local development environment
- Use GitHub Actions to build, test, and deploy the application

### Testing

- Use Playwright for end-to-end UI testing
