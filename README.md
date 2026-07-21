# Admin Dashboard

A full-stack admin/user management dashboard:

- **Backend:** ASP.NET Core 10 Web API, EF Core + SQLite, ASP.NET Core Identity, JWT bearer auth, role-based authorization (`Admin` / `User`), xUnit test suite.
- **Frontend:** React 18 + TypeScript + Vite, React Router, Axios (with silent token refresh), Vitest + React Testing Library test suite.

## Project layout

```
AdminDashboard.sln
AdminDashboard.Api/           ASP.NET Core Web API
AdminDashboard.Api.Tests/     xUnit unit tests
admin-dashboard-frontend/     React app (Vite)
```

## Backend — run it

Requires the .NET 10 SDK.

```bash
cd AdminDashboard.Api
dotnet restore
dotnet run
```

The API listens on `http://localhost:5080` (see `Properties/launchSettings.json`) and serves Swagger UI at `/swagger` in Development.

On first run it creates a SQLite database (`admindashboard.db`) via `EnsureCreatedAsync`, seeds the `Admin`/`User` roles, and seeds a default admin account from `appsettings.json`:

- Email: `admin@admindashboard.local`
- Password: `Admin#12345`

**Change these before deploying anywhere real**, along with `Jwt:Key` in `appsettings.json` (use a long random secret, e.g. `openssl rand -base64 48`), ideally via user-secrets or environment variables rather than committing them.

If you want proper EF Core migrations instead of `EnsureCreated`, run:

```bash
dotnet tool install --global dotnet-ef   # once
dotnet ef migrations add InitialCreate
```

then swap `EnsureCreatedAsync()` for `MigrateAsync()` in `Program.cs`.

### Backend — run tests

```bash
cd AdminDashboard.Api.Tests
dotnet test
```

Covers `TokenService` (JWT claims, expiry, refresh token generation) and the `Auth`/`Users` controllers (register/login/refresh flows, role validation, self-delete protection) using mocked `UserManager<T>` and an EF Core InMemory database — no real database or network calls required.

## Frontend — run it

Requires Node.js 20+.

```bash
cd admin-dashboard-frontend
npm install
npm run dev
```

Opens on `http://localhost:5173`. API calls to `/api/*` are proxied to `http://localhost:5080` in `vite.config.ts`, so run the backend alongside it.

Sign in with the seeded admin account above, or use **Create an account** to self-register (new accounts get the `User` role; promote them to `Admin` from the Users page while signed in as an admin).

### Frontend — run tests

```bash
cd admin-dashboard-frontend
npm test
```

Covers the auth context (login/logout/session restore), route guards (`ProtectedRoute` / `AdminRoute`), the login form, and the admin users table (listing, create flow, self-delete protection).

## Auth model

- Register/Login return a short-lived JWT **access token** (30 min default) plus a longer-lived opaque **refresh token** (7 days default), stored server-side so it can be revoked.
- The Axios client attaches the access token to every request and, on a `401`, transparently calls `/api/auth/refresh` once and retries the original request before giving up and redirecting to `/login`.
- `[Authorize(Roles = "Admin")]` protects all `UsersController` endpoints; any authenticated user can hit `DashboardController`.
- On the frontend, `<ProtectedRoute>` gates any authenticated page and `<AdminRoute>` additionally requires the `Admin` role — both are enforced again server-side, since client-side route guards are only a UX convenience.

## Configuration

| Setting | Where | Purpose |
|---|---|---|
| `Jwt:Key` / `Issuer` / `Audience` | `appsettings.json` | JWT signing config — **replace the key** |
| `Jwt:AccessTokenMinutes` / `RefreshTokenDays` | `appsettings.json` | Token lifetimes |
| `ConnectionStrings:DefaultConnection` | `appsettings.json` | SQLite file path |
| `Cors:AllowedOrigins` | `appsettings.json` | Origins allowed to call the API (defaults to the Vite dev server) |
| `SeedAdmin:*` | `appsettings.json` | Default admin account created on first run |
