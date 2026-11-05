# QuickConnect — WiFi QR Code & Printable Guest Card Generator

**QuickConnect** is a privacy-first web application that generates printable WiFi QR Code "Guest Cards" for visitors.

> **Built by Osman Abdullahi Ahmed - ID BSW01085171**

---

## Key Features

- **Privacy-First Architecture**: WiFi credentials are never written to disk. QR codes are generated strictly in server memory (`Buffer`) using the `qrcode` library and returned immediately as a Base64-encoded PNG stream with `Cache-Control: no-store`.
- **Deep Ocean Blue & Teal Glassmorphism UI**: Built with Tailwind CSS via CDN, featuring frosted-glass form controls and a high-contrast printable Guest Card.
- **Instant Printable Guest Card**: Includes a dedicated `@media print` stylesheet and default card headline: *"Osman's Secure WiFi Access - Scan to join instantly"*.
- **Modern Zero-Build TypeScript Execution**: Runs `server.ts` directly on `node:23` using Node's native `--experimental-strip-types` flag—no `tsc` build step required.

---

## Project Structure

```text
.
├── public/
│   └── index.html       # Single-page Glassmorphism UI & Printable Guest Card
├── server.ts            # Express + TypeScript backend (in-memory QR Buffer -> Base64)
├── Dockerfile           # Modern node:23 container running --experimental-strip-types
├── package.json         # Dependencies & scripts
└── tsconfig.json        # TypeScript IDE/typecheck configuration (noEmit)
```

---

## Running Locally

```bash
npm install
npm start
```

The server starts at `http://localhost:3000`.

---

## Running with Docker

```bash
docker build -t quickconnect .
docker run -p 3000:3000 quickconnect
```
