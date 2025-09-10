# Express App

This repository contains the API Server built using Node.js and Express. The project follows best practices for structuring an Express application and includes scripts for setup, running, and development.

---

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (latest LTS recommended)
- npm (comes with Node.js)

### Installation
1. Clone the repository:
   ```bash
   git clone <repo-url>
   cd <repo-folder>
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

This will install all dependencies listed in `package.json` and lock their versions in `package-lock.json`.

---

## Package Configuration

### `package.json`
The `package.json` file defines project metadata and dependencies. Key sections include:

- **Dependencies**: External libraries required for the app to run. Examples:
  - `express`: Core web framework.
  - `dotenv`: For managing environment variables.
  - `cors`: Enables cross-origin requests.

- **DevDependencies**: Tools for development, not needed in production. Examples:
  - `nodemon`: Auto-restarts the server on file changes.
  - `eslint`: Linting tool for code quality.

- **Scripts**: Custom commands for running the app:
  - `start`: Runs the server with Node.
  - `dev`: Runs the server with Nodemon for hot-reloading.
  - `lint`: Runs ESLint checks.

### `package-lock.json`
This file locks the versions of all installed packages (including sub-dependencies). It ensures consistency across different environments. Any changes to installed packages (via `npm install`) will update this file.

---

## Running the App

- Start the server:
  ```bash
  npm start
  ```

- Run in development mode with hot reload:
  ```bash
  npm run dev
  ```

- Run lint checks:
  ```bash
  npm run lint
  ```

The server will typically start on the port defined in `.env` (default: `3000`).

---

## Environment Variables

Create a `.env` file in the root directory. 
Example:
```env
LOG_LEVEL=debug
```

---

## Notes
- Any new dependencies installed via `npm install <package>` will update both `package.json` and `package-lock.json`.
- Always commit all changes made to files to ensure the latest version of your files are accessible.

---

## Author
- [Aydin Arif]
