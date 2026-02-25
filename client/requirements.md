## Packages
react-markdown | For rendering markdown in chat messages
remark-gfm | For GitHub Flavored Markdown support (tables, strikethrough)
react-syntax-highlighter | For beautiful code block highlighting in My Ai Coder
clsx | Utility for constructing className strings conditionally
tailwind-merge | Utility for merging tailwind classes without style conflicts

## Notes
- Ensure `@assets/MyAiGpt_1772000395528.webp` is available for the logo.
- The `api` object from `@shared/routes` and schemas from `@shared/schema` are used for all TanStack Query hooks.
- Wouter handles routing between the general AI (/), coder AI (/coder), and specific chat history (/chat/:id).
