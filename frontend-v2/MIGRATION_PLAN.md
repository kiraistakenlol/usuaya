# Migration Plan: Next.js Frontend to Vite Frontend (frontend-v2)

This document outlines the steps to migrate the existing Next.js frontend (`frontend`) to a new Vite-based
frontend (`frontend-v2`), focusing on Client-Side Rendering (CSR) with React, TypeScript, MUI, and Tailwind CSS.

**Goal:** Create a fast, maintainable, purely client-side rendered frontend application, simplifying the build process
and avoiding potential SSR complexities encountered with Next.js. Styling should be clean and functional, not
necessarily identical to the original.

**Core Stack:** Vite, React, TypeScript, `react-router-dom`, MUI, Emotion, Tailwind CSS, `@usuaya/shared-types`.

---

## Migration Steps

**Phase 1: Project Setup & Configuration**

*Note: Root `package.json` and `amplify.yml` were updated early (before Phase 1 completion) to target `frontend-v2` and
configure the build/deployment process for iterative checks.*

1. **Initialize Vite Project:**
    *   [x] Navigate to the `frontend-v2` directory.
    *   [x] Run `npm create vite@latest . -- --template react-ts` (or equivalent yarn/pnpm command) to scaffold a new
        Vite project with React and TypeScript in the current directory.
    *   [x] Accept adding `@vitejs/plugin-react`.

2. **Install Core Dependencies:**
    *   [ ] Add production
        dependencies: `npm install react-router-dom @mui/material @emotion/react @emotion/styled @mui/icons-material clsx tailwind-merge`
    *   [ ] Add development dependencies: `npm install -D tailwindcss postcss autoprefixer @types/react-router-dom`
    *   [x] Add shared types workspace dependency: `npm install ../packages/shared-types` (Adjust path if needed, or
        rely on root `npm install`). Verify workspace linking works.

3. **Configure Tailwind CSS:**
    *   [x] Run `npx tailwindcss init -p` to create `tailwind.config.js` and `postcss.config.js`.
    *   [x] Configure `tailwind.config.js`:
        *   [x] Set `content` to include `./index.html` and `./src/**/*.{js,ts,jsx,tsx}`.
        *   [ ] Add any necessary plugins or theme customizations (keep simple initially).
    *   [x] Create `./src/index.css` (or similar) and add Tailwind directives:
          ```css
          @tailwind base;
          @tailwind components;
          @tailwind utilities;
          ```
    *   [x] Import the CSS file in the main entry point (`./src/main.tsx`).

4. **Configure Vite (`vite.config.ts`):**
    *   [x] Ensure `@vitejs/plugin-react` is included.
    *   [ ] Add any necessary path aliases if desired (e.g., `@/*` pointing to `./src/*`).

5. **Configure TypeScript (`tsconfig.json`):**
    *   [x] Review the Vite-generated `tsconfig.json`.
    *   [x] Ensure `jsx` is set to `react-jsx`.
    *   [ ] Add `baseUrl` and `paths` if using aliases.
    *   [x] Ensure `esModuleInterop` and `isolatedModules` are appropriately set.

**Phase 2: Basic Structure & Layout**

6. **Set up Main Entry Point (`src/main.tsx`):**
    *   [x] Import necessary styles (`index.css`).
    *   [x] Wrap the application in `React.StrictMode`.
    *   [x] Wrap the application in `BrowserRouter` from `react-router-dom`.
    *   [x] Integrate MUI Theme provider (copy or adapt `ThemeRegistry` from `frontend/src/components` or create a
        simpler setup).

7. **Implement Basic Routing (`src/App.tsx` or similar):**
    *   [ ] Create a main `App` component.
    *   [ ] Define routes using `<Routes>` and `<Route>` from `react-router-dom`.
        * Route `/`: Placeholder for the main view (e.g., Vocabulary).
        * Route `/texts`: Placeholder for the Texts List view.
        * Route `/texts/:textId`: Placeholder for the Text Detail view.
        * Consider a 404 route.

8. **Integrate App Layout:**
    *   [ ] Copy `AppLayout.tsx` from `frontend/src/components` to `frontend-v2/src/components`.
    *   [ ] Adapt `AppLayout.tsx`:
        * Replace `next/link` imports/usage with `react-router-dom/Link`.
        * Ensure MUI components (`Drawer`, `AppBar`, etc.) are correctly imported and styled. Simplify if desired.
        * Remove any Next.js specific hooks/logic (`usePathname` if used, replace with `useLocation`
          from `react-router-dom`).
    *   [ ] Wrap the `<Routes>` in `src/App.tsx` with the `<AppLayout>` component.

**Phase 3: Component & View Migration**

9. **Migrate Core Components:**
    *   [x] Copy reusable components from `frontend/src/components` (e.g., `AudioPlayer`, `RelativeTimeDisplay` if
        keeping) to `frontend-v2/src/components`.
        * `AudioPlayer.tsx` copied.
    *   [ ] Update imports within these components (e.g., remove Next.js imports, ensure local/MUI imports are correct).
        * `AudioPlayer.tsx` checked, no changes needed.
    *   [ ] Test components in isolation if possible (e.g., using Storybook, or simple test pages).

10. **Recreate Views/Pages:**
    *   [x] **Texts List View (`/texts`):**
        *   [x] Create a component (e.g., `src/pages/TextsListPage.tsx`).
        *   [x] Implement `useEffect` to fetch the list of texts from the backend API (`/api/texts`).
        *   [x] Display texts, possibly using MUI `List` or `Table`.
        *   [x] Use `react-router-dom/Link` to link to detail pages.
    *   [ ] **Text Detail View (`/texts/:textId`):**
        *   [x] Create a component (e.g., `src/pages/TextDetailPage.tsx`).
        *   [x] Use `useParams` from `react-router-dom` to get `textId`.
        *   [x] Implement `useEffect` to fetch text details from `/api/texts/:textId`.
        *   [ ] Implement logic to display Spanish text, English translation, vocabulary.
        *   [ ] Integrate `AudioPlayer` component if applicable, handling audio fetching and state management within
            this component.
        *   [ ] Adapt interaction logic (word click, hover).
    *   [x] **Main View (`/`):**
        *   [ ] Decide on content (e.g., Vocabulary list, dashboard).
        *   [x] Create component (e.g., `src/pages/HomePage.tsx`).
        *   [x] Implement necessary fetching and display logic.

11. **API Client & Static Assets:**
    *   [x] Copy `frontend/src/utils/api.ts` to `frontend-v2/src/utils/api.ts`. Verify imports.
    *   [x] Copy contents of `frontend/public` to `frontend-v2/public`.

**Phase 4: Refinement & Integration**

12. **Styling Review:**
    *   [ ] Ensure MUI and Tailwind styles are applied correctly.
    *   [ ] Refine the look and feel, focusing on simplicity and usability.

13. **Update Root Build Scripts:**
    *   [ ] Modify scripts in the root `package.json`:
        * `

15. **Cleanup (Post-Verification):**
    *   [x] Once `frontend-v2` is stable and confirmed working, remove the old `frontend` directory.
    *   [x] Update any documentation (e.g., root `README.md`, Terraform config) to reflect the new frontend setup.

---

*This plan will be iterated upon. Checked items indicate completion.*