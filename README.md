# Auth Deno KV

This project is an authentication system built with Deno, leveraging `Deno.Kv` for data storage. It provides user and session management functionalities, with comprehensive unit tests written using Vitest.

# 🚀 Features

- User Management: Add, update, retrieve, and delete users.
- Session Management: Create, update, retrieve, and delete sessions.
- In-Memory Testing: Uses an in-memory Deno.Kv for isolated and fast tests.
- Astro Integration: Configured for server-side rendering with Astro and Deno.

# Setup

1. Clone the repository:

   ```bash
   git clone
   cd auth-deno-kv
   ```

2. Install dependencies:

   ```bash
   deno install
   ```

3. Download Deno types:

   ```bash
   deno task generate:types:deno
   ```

4. Start the development server:

   ```bash
   deno task dev
   ```

# 📦 Scripts

| Command                         | Description                                |
| ------------------------------- | ------------------------------------------ |
| `deno task dev`                 | Start Astro dev server with Deno + KV      |
| `deno task build`               | Build site with Astro                      |
| `deno task preview`             | Run built server output in Deno            |
| `deno task astro`               | Run Astro CLI                              |
| `deno task test`                | Run test suite using Vitest in Deno        |
| `deno task format`              | Format code with Prettier and Astro plugin |
| `deno task check:format`        | Check formatting without modifying files   |
| `deno task generate:types:deno` | Export Deno’s type declarations            |

---
