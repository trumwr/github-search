# GitHub Repository Search

## Features
- Search GitHub repositories by language (JavaScript/TypeScript/C#)
- Paginated results grid
- Repository details page
- Error handling for API limits
- Responsive design

## Technologies
- React + TypeScript
- Vite
- Axios for API calls
- @inovua/reactdatagrid-community
- React Router

## Design Decisions
- Chose Vite over CRA for faster dev experience
- Used TypeScript for type safety
- Implemented abort controllers to prevent race conditions

## Known Limitations
- GitHub API rate limits (60 req/hour unauthenticated)
- No search query parameter persistence

## Setup
npm install
npm run dev
