# Contributing to ScopeGuard AI

Thanks for considering a contribution. Bug reports, reproducible test cases, accessibility improvements, and documentation updates are useful.

## Before opening an issue

- Search existing issues to avoid duplicates.
- Include the steps needed to reproduce the problem.
- For classification or evidence bugs, include a **fictional or sanitised** agreed scope, client request, actual result, and expected result.
- Never publish real client agreements, personal information, API keys, or other confidential data.

## Development setup

Follow the setup steps in [README.md](README.md). Run the backend and frontend locally before making changes.

## Pull requests

1. Create a focused branch for your change.
2. Explain the problem and the proposed solution.
3. Add or update regression tests when behaviour changes.
4. Run backend syntax checks and the frontend lint/build scripts available in `frontend/package.json`.
5. Include screenshots for user-interface changes where practical.
6. Document any known limitations; do not describe an untested behaviour as verified.

## Guidelines for scope-analysis changes

- Distinguish explicitly included, explicitly excluded, unmentioned, and ambiguous requirements.
- Do not treat omission alone as proof of exclusion.
- Keep quotations faithful to the source scope.
- Prefer a clarification result when the supplied agreement does not support a confident conclusion.
- Keep a human in control: the application must not send client messages automatically.
