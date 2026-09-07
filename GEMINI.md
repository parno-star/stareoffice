# Project Instructions - Start App

## Basemind Integration Rules
- Always prioritize using Basemind MCP tools over raw file reads or terminal grep.
- Use `code.outline` and `code.symbols` to inspect file structure.
- Use `code.callers` and `code.references` to trace symbol usage across the repo.
- Use `graph.*` to analyze dependency paths and blast radius before refactoring.
- Use `git.*` to check recent churn, author history, and blame for specific symbols.
- Use `shell.*` to run build/test commands in background headless mode when validating code changes.
- Use `memory.*` to store and recall architectural decisions across sessions.
