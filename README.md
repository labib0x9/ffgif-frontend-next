# FFgif - Next.js Frontend Studio

A high-performance, modern Web Application frontend for **FFgif** — an asynchronous video-to-GIF conversion and media management platform. Built with **Next.js 15+ (App Router)**, **TypeScript**, **Tailwind CSS**, and **Lucide Icons**.

---

## 🌟 Key Features

- **Direct-to-Storage Uploads**: Uploads video files (`.mp4`, `.mov`, `.webm`, `.avi`) directly to MinIO S3 object storage via presigned `PUT` URLs with real-time percentage progress indicators.
- **Precision Video Trimmer**: Interactive dual-handle range timeline synchronized with an HTML5 video player, time display in `00:00.00` format, and loop slice playback preview.
- **Granular Conversion Controls**: Customizable framerate (1–30 FPS with quality badges), width resolution (100px–1920px with presets like 240p, 480p, 720p, 1080p), and infinite loop toggle.
- **Asynchronous Polling Engine**: Polls background conversion jobs (`POST /convert` ➔ `GET /convert/{jobId}/status` ➔ `GET /gifs/me/{id}`) with animated state transitions (`Queued` ➔ `Converting` ➔ `Completed`).
- **Complete GIF Library**: Filter by `All`, `Public`, `Private`, and `Recent Conversions` with real-time search, sorting, and hover-to-play animation.
- **Granular User-to-User Sharing**: Share GIFs by email with preset (1h, 24h, 7d, 30d) or custom expiration dates, live countdown timers, and single-click access revocation.
- **Visual Quota Monitoring**: Live storage capacity meters and active GIF counters.
- **Full Authentication Lifecycle**: Signup with live password complexity validation, email verification with resend support, login with demo prefill helper, password reset, and Redis blocklist logout.

---

## 🛠 Tech Stack

- **Framework**: [Next.js 15 (App Router)](https://nextjs.org/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with custom dark glassmorphism design tokens
- **Icons**: [Lucide Icons](https://lucide.dev/)
- **Linter**: [Oxlint](https://oxc.rs/)

---

## 🚀 Getting Started (Run Locally)

### Prerequisites

Ensure you have the following installed on your machine:
- **Node.js**: v18.18.0 or later (v20+ recommended)
- **npm**: v9+ (or `pnpm` / `yarn`)
- **FFgif Backend**: Running locally on `http://localhost:8080` (Go backend with RabbitMQ, Redis, and MinIO storage on `http://localhost:9000`)

---

### Step 1: Install Dependencies

In the project root directory, install all required dependencies:

```bash
npm install
```

---

### Step 2: Configure Environment Variables

Create a `.env.local` file in the root directory (or use default configuration):

```bash
touch .env.local
```

Add your backend API base URL:

```env
# URL where your FFgif Go backend server is running
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
```

> **Note**: If `NEXT_PUBLIC_API_BASE_URL` is omitted, the frontend defaults to `http://localhost:8080` during `npm run dev`, and uses same-origin relative requests (`""`) in production static builds served directly by your Go server.

---

### Step 3: Start the Development Server

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

---

## 📦 Generating Static `dist/` for Go Backend

The project is configured with `output: "export"` and `distDir: "dist"` in `next.config.mjs`. When built, it outputs all static HTML, CSS, JavaScript, and asset files directly into the **`dist/`** directory, which can be embedded or served directly by your Go backend.

### 1. Build the `dist/` Folder

Run:

```bash
npm run build
```

This compiles all routes into pure HTML/CSS/JS files inside `./dist`:
- `dist/index.html` (Landing page)
- `dist/studio.html` (Video Studio & Trimmer)
- `dist/library.html` (GIF Library)
- `dist/shared.html` (Shared Hub)
- `dist/settings.html` (Settings & Quotas)
- `dist/login.html` & `dist/signup.html` (Authentication)
- `dist/verify.html`, `dist/forgot-password.html`, `dist/reset-password.html`
- `dist/_next/` (JavaScript & CSS bundles)

---

### 2. Serving `dist/` from Go Backend

You can embed the `dist/` folder directly into your Go binary using `embed.FS` or serve it via `http.FileServer`:

#### Example A: Standard `net/http` with `embed.FS` (Single Binary)

```go
package main

import (
	"embed"
	"io/fs"
	"log"
	"net/http"
	"strings"
)

//go:embed dist/*
var distFS embed.FS

func main() {
	// Strip the "dist" prefix from embedded filesystem
	subFS, err := fs.Sub(distFS, "dist")
	if err != nil {
		log.Fatal(err)
	}

	fileServer := http.FileServer(http.FS(subFS))

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		// Don't intercept API routes
		if strings.HasPrefix(r.URL.Path, "/auth") ||
			strings.HasPrefix(r.URL.Path, "/users") ||
			strings.HasPrefix(r.URL.Path, "/uploads") ||
			strings.HasPrefix(r.URL.Path, "/convert") ||
			strings.HasPrefix(r.URL.Path, "/gifs") {
			http.DefaultServeMux.ServeHTTP(w, r)
			return
		}

		// Try serving file directly
		path := strings.TrimPrefix(r.URL.Path, "/")
		if path == "" {
			path = "index.html"
		}

		// If path doesn't have an extension, try appending .html (e.g. /studio -> studio.html)
		if !strings.Contains(path, ".") {
			if _, err := subFS.Open(path + ".html"); err == nil {
				r.URL.Path += ".html"
			}
		}

		fileServer.ServeHTTP(w, r)
	})

	log.Println("FFgif server running with embedded frontend on :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
```

#### Example B: Serving from Local `dist/` Directory

```go
package main

import (
	"net/http"
)

func main() {
	// Serve static frontend assets
	fs := http.FileServer(http.Dir("./dist"))
	http.Handle("/", fs)

	http.ListenAndServe(":8080", nil)
}
```

---

## 🏗 Scripts & Commands

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the Next.js development server on `http://localhost:3000` with Hot Module Replacement (HMR) |
| `npm run build` | Exports the static production build directly to the **`dist/`** directory for Go backend integration |
| `npm run start` | Starts the Next.js production server (if running standalone with Node.js) |
| `npm run lint` | Runs `oxlint` to perform fast static analysis across all files |

---

## 📁 Project Architecture & Route Map

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx             # Sign in with demo prefill button
│   │   ├── signup/page.tsx            # Sign up with real-time requirements checklist
│   │   ├── verify/page.tsx            # Reads ?token=, auto-verifies & resend email
│   │   ├── forgot-password/page.tsx   # Request reset password email
│   │   └── reset-password/page.tsx    # Sets new password using ?token=
│   ├── (dashboard)/
│   │   ├── layout.tsx                 # Protected Dashboard shell, Sidebar & Topbar with Quota pill
│   │   ├── studio/page.tsx            # Upload -> Trimmer -> Settings -> Convert -> Results
│   │   ├── library/page.tsx           # GIF Library grid, search, sort, filter tabs, detail drawer
│   │   ├── shared/page.tsx            # Shared Hub with expiration timers & access revocation
│   │   └── settings/page.tsx          # User profile, password update, quota meters, danger zone
│   ├── layout.tsx                     # Global Root Layout (Providers, Metadata, Viewport)
│   ├── page.tsx                       # High-converting Landing Page with Hero & Interactive Demo
│   ├── globals.css                    # Tailwind CSS, custom dark theme, glassmorphism
│   └── providers.tsx                  # ToastProvider and AuthProvider wrapper
├── components/
│   ├── auth/                          # AuthCard container with ambient neon effects
│   ├── layout/                        # Sidebar and Topbar navigation components
│   ├── library/                       # GifCard, GifDetailModal, ShareModal
│   ├── studio/                        # UploadDropzone, VideoTrimmer, ConversionSettings,
│   │                                  # ConvertingModal, GifResultViewer
│   └── ui/                            # Button, Input, Badge, Modal, ProgressBar, ConfirmModal
├── context/
│   ├── AuthContext.tsx                # Reactive auth, user profile & quota state
│   ├── ToastContext.tsx               # Floating glassmorphic toast notification system
│   └── index.ts                       # Context barrel exports
├── lib/
│   ├── api.ts                         # Complete typed API client (Auth, MinIO, Jobs, OCC, Shares)
│   ├── errors.ts                      # Centralized standardized error parsing & code mapping
│   └── utils.ts                       # Helpers, formatters (bytes, duration, dates, cn)
└── types/
    └── index.ts                       # Complete TypeScript definitions
```

---

## 🔌 API Endpoints Reference

The frontend interacts with the following backend REST routes:

### Authentication
- `POST /auth/signup` - Register a new account
- `GET /auth/verify?token=...` - Verify account email
- `POST /auth/verify/resend` - Resend verification email (202 Accepted)
- `POST /auth/login` - Sign in and retrieve JWT Bearer token
- `POST /auth/forgot-password` - Request password reset email (202 Accepted)
- `GET /auth/reset?token=...` - Validate reset token
- `POST /auth/reset` - Set new password
- `POST /auth/logout` - Invalidate token (Redis blocklist)

### User Profile & Quotas
- `GET /users/profile/me` - Fetch profile metadata with ETag
- `PATCH /users/profile/me` - Update profile with `If-Match: <updated_at>` (username, fullname, avatar_url)
- `GET /users/me/quota` - Fetch storage bytes & GIF count limits
- `PATCH /users/change-password` - Change account password
- `DELETE /users/me` - Delete account

### Video Ingestion & MinIO Storage
- `POST /uploads` - Generate presigned `PUT` upload URL
- `PUT <upload_url>` - Direct binary upload to MinIO object storage
- `GET /uploads/{key}/status` - Poll video preprocessing status
- `GET /uploads/{key}/stream` - Get streaming video playback URL
- `GET /uploads/last` - Get metadata of last uploaded video

### GIF Conversion Engine & Jobs
- `POST /jobs` - Submit conversion parameters (`upload_key`, `start_time`, `end_time`, `fps`, `width`, `loop`) -> 202 Accepted
- `GET /jobs/{jobId}/status` - Poll conversion status (`queued` | `converting` | `completed` | `failed`)

### Library & Sharing
- `GET /gifs/me?status=all` - Fetch user GIFs (`all`, `public`, `private`)
- `GET /gifs/me/recents` - Fetch recent conversions
- `GET /gifs/me/{key}` - Get single GIF metadata with ETag
- `GET /gifs/me/{key}/thumbnail` - Get presigned thumbnail image URL
- `GET /gifs/me/{key}/download` - Get presigned direct download URL
- `PATCH /gifs/me/{key}` - Partial update with `If-Match: <updated_at>` (`status`, `name`, `persist`)
- `DELETE /gifs/me/{key}` - Delete GIF
- `POST /gifs/me/recents/{key}/save` - Save temporary conversion into permanent library
- `POST /gifs/me/{key}/shares` - Share GIF with another user (upserts/renews expiration)
- `GET /gifs/me/shares` - List active shared GIF records
- `DELETE /gifs/me/{key}/shares/{userId}` - Revoke share access

---

## 📄 License

This project is proprietary and maintained by the FFgif Team.
