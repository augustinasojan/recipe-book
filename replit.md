# Recipe Book

A responsive personal recipe collection for saving, browsing, and maintaining favorite meals with MongoDB Atlas persistence.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the Express API on its managed workflow
- `pnpm --filter @workspace/recipe-book run dev` — run the Vite web app on its managed workflow
- `pnpm run typecheck` — typecheck workspace libraries and artifacts
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI
- Required secret: `MONGODB_URI` — MongoDB Atlas connection string
- For local development outside Replit, copy `.env.example` to `.env` and add a MongoDB URI. Never commit `.env`.

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React, Vite, TanStack Query
- API: Express 5 REST endpoints
- Database: MongoDB Atlas via Mongoose
- Validation and API client: OpenAPI, generated Zod schemas, generated React Query hooks

## Where things live

- `artifacts/recipe-book` — recipe collection, creation, details, and editing UI
- `artifacts/api-server/src/routes/recipes.ts` — recipe CRUD endpoints
- `artifacts/api-server/src/models/recipe.ts` — Mongoose recipe model and category rules
- `artifacts/api-server/src/lib/mongodb.ts` — Atlas connection
- `lib/api-spec/openapi.yaml` — API contract and source for generated client validation

## Product

- Create recipes with a name, category, ingredients, preparation steps, and cooking time.
- Browse, search, and filter saved recipes.
- View complete recipe details and edit or delete saved recipes.
- Recipe changes persist in MongoDB Atlas and refresh in the UI without a manual page reload.
