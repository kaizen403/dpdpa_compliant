# Deployment Guide (Render)

This application is configured for easy deployment on [Render](https://render.com).

## Prerequisites
- A GitHub repository containing this code.
- A [Render](https://render.com) account.
- A PostgreSQL database (you can create one on Render).

## Steps

1.  **Push to GitHub**: Ensure your code is pushed to your GitHub repository.
2.  **Create Database**:
    -   Go to Render Dashboard -> New -> PostgreSQL.
    -   Name: `datavault-db`.
    -   Copy the `Internal Database URL` (for backend).

3.  **Deploy via Blueprint**:
    -   Go to Render Dashboard -> Blueprints -> New Blueprint Instance.
    -   Connect your GitHub repo.
    -   Render will detect `render.yaml`. Click "Apply".
    -   **Database migrations and seeding run automatically** during the build process.

4.  **Configure Environment Variables**:
    -   Render will prompt you for missing environment variables.
    -   `DATABASE_URL`: Paste the Internal Database URL from step 2.
    -   `NEXT_PUBLIC_API_URL`: You need the Backend URL first.
        -   Allow the Backend service to deploy first (it might fail initially if DB isn't ready or URL isn't set).
        -   Get the Backend Service URL (e.g., `https://datavault-backend.onrender.com`).
        -   Set `NEXT_PUBLIC_API_URL` to: `https://datavault-backend.onrender.com/api` (Don't forget the `/api`!).

## Default Credentials
After deployment, you can login with:
-   **Email**: `sibisir@gmail.com`
-   **Password**: `sibi123`

## Important Notes
-   **Storage**: This deployment uses ephemeral disk for uploads. Files uploaded will disappear if the backend restarts. For permanent storage, configure S3 (requires code changes).
-   **Security**: Rate limiting and Headers are blocked.
-   **Cors**: The backend allows requests from `FRONTEND_URL`. Ensure this is set correctly in Backend environment variables (Render Blueprint handles basic setup, but double check).

## Local Production Test
To test the production build locally:
```bash
# Backend
cd be
pnpm build
pnpm start

# Frontend
cd fe
pnpm build
pnpm start
```
