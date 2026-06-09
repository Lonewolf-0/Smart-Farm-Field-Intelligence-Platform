# Contributing to Smart Farm Field Intelligence Platform

First off, thank you for considering contributing to the Smart Farm Field Intelligence Platform! It's people like you that make this tool such a powerful asset for modern agriculture.

## 1. Branch Naming Conventions

To keep our repository organized, please follow these branch naming conventions:

- `feature/<issue-number>-<short-description>`: For new features (e.g., `feature/42-add-ndvi-layer`)
- `bugfix/<issue-number>-<short-description>`: For bug fixes (e.g., `bugfix/89-fix-soil-trend-calculation`)
- `hotfix/<short-description>`: For urgent production fixes
- `docs/<short-description>`: For documentation updates
- `refactor/<short-description>`: For code refactoring without behavior changes

## 2. Commit Message Format

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification. This leads to more readable messages that are easy to follow when looking through the project history.

**Format**: `<type>(<scope>): <subject>`

**Types**:
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code (white-space, formatting, etc)
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing or correcting existing tests
- `chore`: Changes to the build process or auxiliary tools and libraries

**Example**:
`feat(weather): add 7-day precipitation forecast`
`fix(soil): resolve null pointer in trend analysis`

## 3. Pull Request (PR) Process

1. **Fork the repo** and create your branch from `main`.
2. **Ensure tests pass**: Run `npm test` locally. Your PR will not be merged if the CI build fails.
3. **Update Documentation**: If you've changed APIs or added features, update `README.md` or `API_DOCS.md` accordingly.
4. **Draft the PR**: Provide a clear description of what the PR does, referencing the issue it resolves (e.g., `Fixes #42`).
5. **Code Review**: Assign at least one reviewer. Address any feedback provided.
6. **Merge**: Once approved, the maintainers will squash and merge your PR.

## 4. Code Style Guidelines

- **TypeScript**: Use strict typing. Avoid `any` whenever possible.
- **Formatting**: We use Prettier and ESLint. Run `npm run lint` before committing.
- **Architecture**: Follow the established `Controller -> Service -> Repository` pattern for the backend.
- **Comments**: Write JSDoc comments for complex logic (especially heuristics and mathematical algorithms).

Thank you for your contributions!
