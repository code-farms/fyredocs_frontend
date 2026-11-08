// ⚠️  THIS FILE IS SHIPPED TO THE BROWSER.
//
// The developer-docs route is gated by RoleRoute, but that gates RENDERING, not
// DELIVERY: the lazy-loaded chunk containing this content is a static asset any
// visitor can fetch directly. Treat everything here as public.
//
// Therefore it must never contain: real secrets or credentials, internal
// host:port topology, infrastructure addresses, or anything else whose value to
// an attacker is knowing how the inside is wired. Placeholder examples
// (localhost, "your-secret-here") are fine. If a document genuinely needs
// internal detail, it belongs in docs/developer/ in the backend repo, which is
// never served to browsers.

import type { DocSection } from '@/config/docs';
import { mermaidDiagrams } from '@/config/mermaidDiagrams';

/** Convert mermaid diagram entries into DocSection objects */
const getMermaidSections = (slug: string): DocSection[] =>
  (mermaidDiagrams[slug] ?? []).map(({ heading, content }) => ({
    heading,
    content,
    type: 'mermaid' as const,
  }));

// ============================================================================
// DEVELOPER DOCS - Super-admin only
// ============================================================================

export interface DevDocEntry {
  slug: string;
  title: string;
  description: string;
  category: DevDocCategory;
  sections: DocSection[];
}

export type DevDocCategory =
  | 'overview'
  | 'api'
  | 'services'
  | 'architecture'
  | 'guides'
  | 'frontend'
  | 'howto'
  | 'flows';

export interface DevDocNavGroup {
  title: string;
  color: string;
  items: { slug: string; title: string }[];
}

export const devDocNavGroups: DevDocNavGroup[] = [
  {
    title: 'Overview',
    color: 'text-primary',
    items: [
      { slug: 'architecture', title: 'Architecture Overview' },
      { slug: 'getting-started', title: 'Local Setup' },
      { slug: 'request-flow', title: 'Request Flow' },
    ],
  },
  {
    title: 'Service Flows',
    color: 'text-category-optimize',
    items: [
      { slug: 'flow-overview', title: 'System Overview' },
      { slug: 'flow-api-gateway', title: 'API Gateway Flow' },
      { slug: 'flow-auth', title: 'Auth Service Flow' },
      { slug: 'flow-job', title: 'Job Service Flow' },
      { slug: 'flow-convert-to-pdf', title: 'Convert to PDF Flow' },
      { slug: 'flow-convert-from-pdf', title: 'Convert from PDF Flow' },
      { slug: 'flow-organize-pdf', title: 'Organize PDF Flow' },
      { slug: 'flow-optimize-pdf', title: 'Optimize PDF Flow' },
      { slug: 'flow-analytics', title: 'Analytics Flow' },
      { slug: 'flow-cleanup', title: 'Cleanup Worker Flow' },
    ],
  },
  {
    title: 'API Reference',
    color: 'text-info',
    items: [
      { slug: 'api-auth', title: 'Auth API' },
      { slug: 'api-upload', title: 'Upload API' },
      { slug: 'api-jobs', title: 'Jobs API' },
      { slug: 'api-convert-to-pdf', title: 'Convert to PDF API' },
      { slug: 'api-convert-from-pdf', title: 'Convert from PDF API' },
      { slug: 'api-organize-pdf', title: 'Organize PDF API' },
      { slug: 'api-optimize-pdf', title: 'Optimize PDF API' },
    ],
  },
  {
    title: 'Services',
    color: 'text-category-organize',
    items: [
      { slug: 'svc-api-gateway', title: 'API Gateway' },
      { slug: 'svc-auth', title: 'Auth Service' },
      { slug: 'svc-job', title: 'Job Service' },
      { slug: 'svc-convert-to-pdf', title: 'Convert to PDF' },
      { slug: 'svc-convert-from-pdf', title: 'Convert from PDF' },
      { slug: 'svc-organize-pdf', title: 'Organize PDF' },
      { slug: 'svc-optimize-pdf', title: 'Optimize PDF' },
      { slug: 'svc-analytics', title: 'Analytics Service' },
      { slug: 'svc-cleanup', title: 'Cleanup Worker' },
    ],
  },
  {
    title: 'Architecture',
    color: 'text-category-convert-from',
    items: [
      { slug: 'arch-redis', title: 'Redis Architecture' },
      { slug: 'arch-base-image', title: 'Base Image Setup' },
      { slug: 'arch-db-practices', title: 'DB Best Practices' },
    ],
  },
  {
    title: 'Guides',
    color: 'text-success',
    items: [
      { slug: 'guide-hardening', title: 'Backend Hardening' },
      { slug: 'guide-deployment', title: 'Deployment Review' },
    ],
  },
  {
    title: 'Frontend',
    color: 'text-category-libreoffice',
    items: [
      { slug: 'frontend-overview', title: 'Frontend Overview' },
      { slug: 'frontend-auth', title: 'Authentication Flow' },
      { slug: 'frontend-uploads', title: 'File Upload System' },
      { slug: 'frontend-jobs', title: 'Job Tracking' },
      { slug: 'frontend-api-client', title: 'API Client Patterns' },
      { slug: 'frontend-tools-config', title: 'Tool Configuration' },
      { slug: 'frontend-activity', title: 'Activity Tracking SDK' },
    ],
  },
  {
    title: 'How-To Guides',
    color: 'text-warning',
    items: [
      { slug: 'howto-add-tool', title: 'Adding a New Tool' },
      { slug: 'howto-add-service', title: 'Adding a New Service' },
      { slug: 'howto-testing', title: 'Testing Patterns' },
    ],
  },
];

// ============================================================================
// DEVELOPER DOCS CONTENT
// ============================================================================

export const developerDocs: DevDocEntry[] = [
  // ── Overview ──────────────────────────
  {
    slug: 'architecture',
    title: 'Architecture Overview',
    description: 'High-level system architecture and microservice boundaries.',
    category: 'overview',
    sections: [
      {
        heading: 'Microservices Architecture',
        content: 'Fyredocs uses a true microservices architecture. Each service is independently deployable with its own database, configuration, and API contract. Strict boundary rules apply: no cross-service imports, no shared models, no shared database access. The only shared code lives in the /shared/ directory, which contains logging, tracing, metrics, config loading, and queue client utilities.',
        type: 'paragraph',
      },
      {
        heading: 'Standard Response Format',
        content: '{\n  "success": true,\n  "message": "Operation completed",\n  "data": { ... },\n  "error": null,\n  "metadata": {\n    "requestId": "req_abc123",\n    "timestamp": "2025-01-15T10:30:00Z"\n  }\n}',
        type: 'code',
        language: 'JSON',
      },
      {
        heading: 'Microservice Boundary Rules',
        content: '',
        type: 'list',
        items: [
          'No cross-service imports: services must never import packages from another service',
          'No shared models: each service defines its own domain types, even if they overlap',
          'No shared database: every service owns its schema exclusively; data is exchanged only via APIs or NATS events',
          '/shared/ is the only exception: it contains logging (slog wrappers), distributed tracing (OpenTelemetry), Prometheus metrics, config loading, and NATS/Redis client factories',
        ],
      },
      {
        heading: 'Services',
        content: '',
        type: 'table',
        tableData: {
          headers: ['Service', 'Port', 'Description'],
          rows: [
            ['Caddy Edge', '80/443', 'Public entrypoint — TLS, SPA static files, object-byte routing to MinIO, API proxy'],
            ['API Gateway', 'internal', 'CORS, auth middleware, reverse proxy — reachable only via the Caddy edge'],
            ['Job Service', 'internal', 'Job orchestration, file uploads, job lifecycle management'],
            ['Convert From PDF', 'internal', 'PDF to Word, Excel, PPT, Image, HTML, Text conversions'],
            ['Convert To PDF', 'internal', 'Word, Excel, PPT, HTML, Image to PDF conversions'],
            ['Organize PDF', 'internal', 'Merge, split, rotate, extract, watermark, sign, edit'],
            ['Optimize PDF', 'internal', 'Compress, repair, OCR operations'],
            ['Auth Service', 'internal', 'User registration, login, JWT token management'],
            ['Analytics Service', 'internal', 'Usage metrics and analytics tracking'],
            ['Cleanup Worker', '—', 'Job-service’s cleanup binary — background TTL sweep of expired files/jobs'],
          ],
        },
      },
      {
        heading: 'Communication patterns',
        content: '',
        type: 'steps',
        items: [
          'Client to Services: The Caddy edge (:80/:443) is the only public entrypoint — it serves the SPA, routes presigned /uploads/* and /outputs/* object traffic directly to MinIO, and proxies /api/*, /auth/*, and /admin/* to the internal API Gateway, which reverse-proxies to backend services based on route prefix.',
          'Service to Service: NATS JetStream for async job processing. Each worker service subscribes to tool-specific subjects within a durable consumer group.',
          'Caching/State: Redis for upload chunk storage, rate limiting counters, guest token sessions, and token denylist.',
          'Persistence: PostgreSQL with GORM. Each service owns its own schema and connection pool. No cross-service DB queries.',
        ],
      },
      {
        heading: 'Tech stack',
        content: '',
        type: 'table',
        tableData: {
          headers: ['Layer', 'Technology'],
          rows: [
            ['Backend', 'Go 1.25, Gin framework'],
            ['Database', 'PostgreSQL 15, GORM'],
            ['Cache', 'Redis 7'],
            ['Message Queue', 'NATS JetStream'],
            ['Doc Processing', 'LibreOffice, pdfcpu, Poppler, Ghostscript, Tesseract OCR'],
            ['Frontend', 'React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui'],
            ['Auth', 'JWT (HS256) with HTTP-only cookies'],
            ['Observability', 'OpenTelemetry, Prometheus, structured logging (slog)'],
          ],
        },
      },
    ],
  },
  {
    slug: 'getting-started',
    title: 'Local Development Setup',
    description: 'Set up your local development environment.',
    category: 'overview',
    sections: [
      {
        heading: 'Prerequisites',
        content: '',
        type: 'steps',
        items: [
          'Go 1.25+',
          'Docker & Docker Compose',
          'PostgreSQL 15',
          'Redis 7',
          'NATS Server with JetStream enabled',
          'LibreOffice, Ghostscript, Poppler, Tesseract OCR (for document processing services)',
        ],
      },
      {
        heading: 'Clone and configure',
        content: 'git clone <repo-url> && cd fyredocs/fyredocs_backend\ncp .env.example .env',
        type: 'code',
        language: 'Bash',
      },
      {
        heading: 'Environment variables',
        content: '# Database\nDB_HOST=localhost\nDB_PORT=5432\nDB_USER=fyredocs\nDB_PASSWORD=fyredocs_secret\nDB_NAME=fyredocs\n\n# Redis\nREDIS_HOST=localhost\nREDIS_PORT=6379\nREDIS_PASSWORD=\n\n# NATS\nNATS_URL=nats://localhost:4222\n\n# JWT\nJWT_SECRET=your-secret-min-32-chars-long-here\nJWT_ACCESS_EXPIRY=15m\nJWT_REFRESH_EXPIRY=168h\n\n# CORS\nCORS_ORIGINS=http://localhost:5173\n\n# File storage\nUPLOAD_DIR=./uploads\nOUTPUT_DIR=./outputs',
        type: 'code',
        language: 'Environment',
      },
      {
        heading: 'Start infrastructure',
        content: '# Start PostgreSQL, Redis, and NATS via Docker Compose\ndocker compose -f deployment/docker-compose.essentials.yml up -d',
        type: 'code',
        language: 'Bash',
      },
      {
        heading: 'Infrastructure components',
        content: '',
        type: 'table',
        tableData: {
          headers: ['Component', 'Container', 'Purpose'],
          rows: [
            ['PostgreSQL', 'fyredocs-postgres', 'Primary data store. Each service auto-migrates its own tables on startup via GORM AutoMigrate.'],
            ['Redis', 'fyredocs-redis', 'Upload chunk storage, rate limiting, guest sessions, token denylist.'],
            ['NATS', 'fyredocs-nats', 'JetStream-enabled message broker. Streams and consumers are created on first service startup.'],
          ],
        },
      },
      {
        heading: 'Run a single service',
        content: 'cd api-gateway && go run main.go',
        type: 'code',
        language: 'Bash',
      },
      {
        heading: 'Run all services',
        content: './deploy.sh',
        type: 'code',
        language: 'Bash',
      },
      {
        heading: 'Running tests',
        content: '# Single service\ncd job-service && go test ./...\n\n# All services\nfor dir in api-gateway auth-service job-service convert-to-pdf-service \\\n  convert-from-pdf-service organize-pdf-service optimize-pdf-service \\\n  analytics-service cleanup-worker; do\n  echo "Testing $dir..." && cd "$dir" && go test ./... && cd ..\ndone',
        type: 'code',
        language: 'Bash',
      },
      {
        heading: 'Project rules',
        content: 'All development must follow the rules in CLAUDE.md: microservice boundaries (no cross-service imports, no shared models, no shared DB), standard response format on every endpoint, mandatory documentation updates, and mandatory test updates after every code change.',
        type: 'tip',
      },
    ],
  },
  {
    slug: 'request-flow',
    title: 'Request Flow',
    description: 'How a request travels through the system from browser to result.',
    category: 'overview',
    sections: [
      {
        heading: 'End-to-end request lifecycle',
        content: '',
        type: 'steps',
        items: [
          'CORS check: API Gateway validates the Origin header against the configured allow-list. If the origin is not allowed, the request is rejected with 403 before reaching any middleware.',
          'Auth middleware: The gateway checks for credentials in 3 sources, in order: (1) access_token cookie, (2) Authorization: Bearer header, (3) X-Guest-Token header/cookie. If none are found, a guest token is auto-issued and set as a cookie.',
          'Token validation: JWT is decoded and verified (HS256). The jti claim is checked against the Redis denylist (SET denylist:{jti}). If the token is expired or denylisted, a 401 is returned.',
          'Plan enforcement: The user plan (guest/free/pro) is extracted from the JWT and forwarded as the X-Plan header to downstream services. Services use this to enforce plan-based limits (file size, concurrent jobs, retention period).',
          'Rate limiting: The gateway increments a Redis counter (INCR ratelimit:{ip}:{endpoint}:{window}) and checks against per-endpoint thresholds. If exceeded, 429 Too Many Requests is returned.',
          'Reverse proxy: The request is forwarded to the target service based on route prefix. The proxy uses response streaming (ResponseHeaderTimeout 5min) to support long-running conversions.',
          'Service processing: The target service handles the request, interacts with its own database/Redis/NATS as needed, and returns the standard JSON response envelope.',
          'Error propagation: If the downstream service is unreachable, the gateway returns 502 Bad Gateway. If the service returns an error, it is passed through with the original status code.',
        ],
      },
      {
        heading: 'Route mapping',
        content: '',
        type: 'table',
        tableData: {
          headers: ['Route prefix', 'Target service', 'Purpose'],
          rows: [
            ['/auth/*', 'Auth Service (8086)', 'Authentication endpoints'],
            ['/api/upload/*', 'Job Service (8081)', 'Chunked file upload'],
            ['/api/jobs/*', 'Job Service (8081)', 'Job management'],
            ['/api/convert-from-pdf/*', 'Job Service (8081)', 'PDF conversions'],
            ['/api/convert-to-pdf/*', 'Job Service (8081)', 'Document to PDF'],
            ['/api/organize-pdf/*', 'Job Service (8081)', 'PDF manipulation'],
            ['/api/optimize-pdf/*', 'Job Service (8081)', 'PDF optimization'],
            ['/api/analytics/*', 'Analytics Service (8087)', 'Analytics data'],
          ],
        },
      },
      {
        heading: 'Job lifecycle',
        content: '',
        type: 'steps',
        items: [
          'Client initiates chunked file upload: POST /api/upload/init returns uploadId and recommended chunkSize',
          'Client uploads chunks: POST /api/upload/chunk with multipart/form-data. Each chunk is stored in Redis (HASH upload:{uploadId}:meta). Chunks must arrive in order; out-of-order chunks return CHUNK_OUT_OF_ORDER error.',
          'Client finalizes upload: POST /api/upload/complete triggers atomic chunk assembly via a Redis Lua script, then writes the assembled file to disk. Returns fileId.',
          'Client creates job: POST /api/jobs with fileId, toolType, and tool-specific options. Job Service creates a ProcessingJob record (status: pending), then publishes a JobEvent to the tool-specific NATS subject.',
          'Worker consumes event: The appropriate worker service (e.g., convert-to-pdf-service) picks up the message from its NATS consumer group and begins processing. Job status moves to processing.',
          'Worker completes or fails: On success, the worker writes the output file, updates job status to completed, and publishes a completion event. On failure, the NATS message is redelivered up to 3 times before going to the dead letter queue.',
          'Client polls or streams: Client polls GET /api/jobs/:jobId for status, or connects to the SSE endpoint (GET /api/jobs/:jobId/events) for real-time updates.',
          'Client downloads: GET /api/jobs/:jobId/download serves the output file. Download links expire based on the user plan.',
        ],
      },
      {
        heading: 'Security layers',
        content: '',
        type: 'list',
        items: [
          'CORS enforcement at API Gateway with strict origin allow-list',
          'JWT token validation (HS256) from cookie, header, or guest token (checked in that order)',
          'Guest token auto-issuance: if no auth credentials found, a guest token is generated and returned as a cookie',
          'Token denylist via Redis SET for logged-out or rotated tokens',
          'Request body size limiting: 1 MB for non-upload requests',
          'Security headers: X-Content-Type-Options: nosniff, X-Frame-Options: DENY, X-XSS-Protection: 1; mode=block',
        ],
      },
    ],
  },

  // ── API Reference ─────────────────────
  {
    slug: 'api-auth',
    title: 'Auth API',
    description: 'Authentication and user management endpoints.',
    category: 'api',
    sections: [
      {
        heading: 'Endpoints',
        content: '',
        type: 'table',
        tableData: {
          headers: ['Method', 'Path', 'Rate Limit', 'Description'],
          rows: [
            ['POST', '/auth/signup', '10 req/min', 'Register a new user'],
            ['POST', '/auth/login', '20 req/min', 'Login and receive JWT tokens'],
            ['POST', '/auth/logout', '—', 'Clear session tokens and denylist current JWT'],
            ['POST', '/auth/refresh', '—', 'Refresh access token using refresh token'],
            ['GET', '/auth/me', '—', 'Get current user profile'],
          ],
        },
      },
      {
        heading: 'Signup request',
        content: 'POST /auth/signup\nContent-Type: application/json\n\n{\n  "email": "user@example.com",\n  "password": "securePassword123",\n  "name": "John Doe"\n}',
        type: 'code',
        language: 'HTTP',
      },
      {
        heading: 'Signup response (201)',
        content: '{\n  "success": true,\n  "message": "User created successfully",\n  "data": {\n    "user": {\n      "id": "01902a4b-5c6d-7e8f-9a0b-1c2d3e4f5a6b",\n      "email": "user@example.com",\n      "name": "John Doe",\n      "role": "user",\n      "plan": "free"\n    }\n  }\n}',
        type: 'code',
        language: 'JSON',
      },
      {
        heading: 'Login request',
        content: 'POST /auth/login\nContent-Type: application/json\n\n{\n  "email": "user@example.com",\n  "password": "securePassword123"\n}',
        type: 'code',
        language: 'HTTP',
      },
      {
        heading: 'Login response (200)',
        content: '// Response body:\n{\n  "success": true,\n  "message": "Login successful",\n  "data": {\n    "user": {\n      "id": "01902a4b-5c6d-7e8f-9a0b-1c2d3e4f5a6b",\n      "email": "user@example.com",\n      "name": "John Doe",\n      "role": "user",\n      "plan": "free"\n    },\n    "accessToken": "eyJhbGciOiJIUzI1NiIs...",\n    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."\n  }\n}\n\n// Set-Cookie header:\n// Set-Cookie: access_token=eyJhbG...; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=900',
        type: 'code',
        language: 'JSON',
      },
      {
        heading: 'Cookie behavior',
        content: 'On successful login or signup, the server sets an HTTP-only cookie named access_token. The cookie flags are: HttpOnly (not accessible via JavaScript), Secure (HTTPS only in production), SameSite=Lax (sent on top-level navigations), Max-Age=900 (15 minutes, matching the access token lifetime). Clients using fetch or XMLHttpRequest must include credentials: "include" to send the cookie.',
        type: 'paragraph',
      },
      {
        heading: 'Authentication methods (priority order)',
        content: '',
        type: 'steps',
        items: [
          'Cookie: access_token HTTP-only cookie (highest priority, recommended for browser clients)',
          'Header: Authorization: Bearer <JWT_TOKEN> (for programmatic clients)',
          'Guest token: X-Guest-Token header or cookie. If no auth is found at all, a guest token is auto-issued. Guest jobs expire after 2 hours.',
        ],
      },
      {
        heading: 'JWT claims',
        content: '{\n  "sub": "01902a4b-5c6d-7e8f-9a0b-1c2d3e4f5a6b",\n  "email": "user@example.com",\n  "role": "user",\n  "plan": "free",\n  "jti": "unique-token-id",\n  "iss": "fyredocs-auth",\n  "aud": "fyredocs",\n  "exp": 1700000000,\n  "iat": 1699999100\n}',
        type: 'code',
        language: 'JSON',
      },
      {
        heading: 'Error codes',
        content: '',
        type: 'table',
        tableData: {
          headers: ['Code', 'HTTP Status', 'Description'],
          rows: [
            ['USER_EXISTS', '409 Conflict', 'Email is already registered'],
            ['INVALID_CREDENTIALS', '401 Unauthorized', 'Wrong email or password'],
            ['VALIDATION_ERROR', '400 Bad Request', 'Missing or malformed fields (email format, password min 8 chars)'],
            ['TOKEN_EXPIRED', '401 Unauthorized', 'Access token has expired; use /auth/refresh'],
            ['TOKEN_DENYLISTED', '401 Unauthorized', 'Token was invalidated by logout'],
          ],
        },
      },
    ],
  },
  {
    slug: 'api-upload',
    title: 'Upload API',
    description: 'Chunked file upload endpoints.',
    category: 'api',
    sections: [
      {
        heading: 'Endpoints',
        content: '',
        type: 'table',
        tableData: {
          headers: ['Method', 'Path', 'Description'],
          rows: [
            ['POST', '/api/upload/init', 'Initialize a chunked upload session'],
            ['POST', '/api/upload/chunk', 'Upload a single chunk (multipart/form-data)'],
            ['POST', '/api/upload/complete', 'Finalize upload and assemble file'],
            ['GET', '/api/upload/status/:uploadId', 'Check upload progress'],
          ],
        },
      },
      {
        heading: 'Init request',
        content: 'POST /api/upload/init\nContent-Type: application/json\n\n{\n  "filename": "document.docx",\n  "fileSize": 5242880,\n  "toolType": "word-to-pdf"\n}',
        type: 'code',
        language: 'HTTP',
      },
      {
        heading: 'Init response (200)',
        content: '{\n  "success": true,\n  "data": {\n    "uploadId": "upl_a1b2c3d4e5f6",\n    "chunkSize": 1048576,\n    "totalChunks": 5\n  }\n}',
        type: 'code',
        language: 'JSON',
      },
      {
        heading: 'Chunk upload',
        content: 'Each chunk is sent as multipart/form-data. The request must include the uploadId field, the chunkIndex field (zero-based), and the chunk field containing the binary data. Chunks must be uploaded in order; the server rejects out-of-order chunks with CHUNK_OUT_OF_ORDER.',
        type: 'paragraph',
      },
      {
        heading: 'Chunk upload request',
        content: 'POST /api/upload/chunk\nContent-Type: multipart/form-data\n\n--boundary\nContent-Disposition: form-data; name="uploadId"\n\nupl_a1b2c3d4e5f6\n--boundary\nContent-Disposition: form-data; name="chunkIndex"\n\n0\n--boundary\nContent-Disposition: form-data; name="chunk"; filename="chunk_0"\nContent-Type: application/octet-stream\n\n<binary data>\n--boundary--',
        type: 'code',
        language: 'HTTP',
      },
      {
        heading: 'Complete response (200)',
        content: '{\n  "success": true,\n  "message": "Upload completed successfully",\n  "data": {\n    "fileId": "file_x1y2z3w4v5u6",\n    "filename": "document.docx",\n    "fileSize": 5242880\n  }\n}',
        type: 'code',
        language: 'JSON',
      },
      {
        heading: 'Upload session storage',
        content: 'Upload sessions are stored in Redis as a HASH at key upload:{uploadId}:meta with fields: filename, fileSize, totalChunks, uploadedChunks, toolType, userId, createdAt. Chunk binary data is stored at upload:{uploadId}:chunks as a sorted set. Sessions have a TTL of 30 minutes; if the upload is not completed within that time, the session and all chunks are automatically deleted. On /complete, chunks are assembled atomically using a Redis Lua script that reads all chunk data and concatenates it, ensuring no partial assembly on failure.',
        type: 'paragraph',
      },
      {
        heading: 'Error codes',
        content: '',
        type: 'table',
        tableData: {
          headers: ['Code', 'HTTP Status', 'Description'],
          rows: [
            ['UPLOAD_NOT_FOUND', '404', 'Upload session does not exist or has expired'],
            ['CHUNK_OUT_OF_ORDER', '400', 'Chunk index does not match the next expected index'],
            ['UPLOAD_EXPIRED', '410', 'Upload session TTL exceeded (30 min)'],
            ['FILE_TOO_LARGE', '413', 'File exceeds the plan-based size limit'],
          ],
        },
      },
    ],
  },
  {
    slug: 'api-jobs',
    title: 'Jobs API',
    description: 'Job creation, status, and download endpoints.',
    category: 'api',
    sections: [
      {
        heading: 'Endpoints',
        content: '',
        type: 'table',
        tableData: {
          headers: ['Method', 'Path', 'Description'],
          rows: [
            ['POST', '/api/jobs', 'Create a new processing job'],
            ['GET', '/api/jobs/:jobId', 'Get job status and metadata'],
            ['GET', '/api/jobs/:jobId/download', 'Download job output file'],
            ['GET', '/api/jobs/:jobId/events', 'SSE endpoint for real-time status updates'],
            ['GET', '/api/jobs', 'List current user\'s jobs'],
            ['DELETE', '/api/jobs/:jobId', 'Cancel or delete a job'],
          ],
        },
      },
      {
        heading: 'Create job request',
        content: 'POST /api/jobs\nContent-Type: application/json\n\n{\n  "fileId": "file_x1y2z3w4v5u6",\n  "toolType": "word-to-pdf",\n  "options": {\n    "quality": "high"\n  }\n}',
        type: 'code',
        language: 'HTTP',
      },
      {
        heading: 'Create job response (201)',
        content: '{\n  "success": true,\n  "data": {\n    "jobId": "job_m1n2o3p4q5r6",\n    "status": "pending",\n    "toolType": "word-to-pdf",\n    "createdAt": "2025-01-15T10:30:00Z"\n  }\n}',
        type: 'code',
        language: 'JSON',
      },
      {
        heading: 'Job status response',
        content: '{\n  "success": true,\n  "data": {\n    "jobId": "job_m1n2o3p4q5r6",\n    "status": "completed",\n    "toolType": "word-to-pdf",\n    "progress": 100,\n    "createdAt": "2025-01-15T10:30:00Z",\n    "completedAt": "2025-01-15T10:30:04Z",\n    "metadata": {\n      "inputFilename": "document.docx",\n      "inputFileSize": 5242880,\n      "outputFilename": "document.pdf",\n      "outputFileSize": 1048576,\n      "pageCount": 12,\n      "processingTimeMs": 3850\n    },\n    "downloadUrl": "/api/jobs/job_m1n2o3p4q5r6/download",\n    "expiresAt": "2025-01-15T12:30:00Z"\n  }\n}',
        type: 'code',
        language: 'JSON',
      },
      {
        heading: 'Job states',
        content: '',
        type: 'table',
        tableData: {
          headers: ['State', 'Description'],
          rows: [
            ['pending', 'Job created, not yet submitted to NATS queue'],
            ['queued', 'Published to NATS, waiting for a worker to pick it up'],
            ['processing', 'Worker is actively processing the file'],
            ['completed', 'Finished successfully, output available for download'],
            ['failed', 'Processing failed. Error details in metadata. May be retried up to 3 times.'],
          ],
        },
      },
      {
        heading: 'Polling strategy',
        content: 'The recommended polling intervals depend on how long the job has been running. Over-polling wastes bandwidth; under-polling delays the user experience.',
        type: 'paragraph',
      },
      {
        heading: 'Recommended polling intervals',
        content: '',
        type: 'table',
        tableData: {
          headers: ['Job Age', 'Poll Interval', 'Rationale'],
          rows: [
            ['< 2 minutes', 'Every 2 seconds', 'Most jobs complete within this window'],
            ['2 - 10 minutes', 'Every 5 seconds', 'Larger files or complex conversions'],
            ['> 10 minutes', 'Every 10 seconds', 'Very large files; reduces server load'],
          ],
        },
      },
      {
        heading: 'SSE real-time updates',
        content: 'Connect to GET /api/jobs/:jobId/events for server-sent events. The endpoint emits events with type "status" containing the full job status JSON. The connection is kept alive with periodic heartbeat comments. The stream closes automatically when the job reaches a terminal state (completed or failed).',
        type: 'paragraph',
      },
      {
        heading: 'Download link expiry',
        content: 'Download URLs are available from the moment a job completes until the job\'s expiresAt timestamp. For guest users, this is 2 hours. For free-plan users, 24 hours. For pro-plan users, 7 days. After expiry, the file is deleted by the cleanup worker and the download returns 410 Gone.',
        type: 'paragraph',
      },
    ],
  },
  {
    slug: 'api-convert-to-pdf',
    title: 'Convert to PDF API',
    description: 'Endpoints for converting documents to PDF format.',
    category: 'api',
    sections: [
      {
        heading: 'Tool types and NATS subjects',
        content: '',
        type: 'table',
        tableData: {
          headers: ['Tool type', 'Input formats', 'NATS Subject', 'Engine'],
          rows: [
            ['word-to-pdf', 'DOC, DOCX', 'jobs.convert-to-pdf.word-to-pdf', 'LibreOffice'],
            ['excel-to-pdf', 'XLS, XLSX', 'jobs.convert-to-pdf.excel-to-pdf', 'LibreOffice'],
            ['powerpoint-to-pdf', 'PPT, PPTX', 'jobs.convert-to-pdf.powerpoint-to-pdf', 'LibreOffice'],
            ['html-to-pdf', 'HTML, HTM', 'jobs.convert-to-pdf.html-to-pdf', 'LibreOffice'],
            ['image-to-pdf', 'JPG, PNG, WebP', 'jobs.convert-to-pdf.image-to-pdf', 'pdfcpu'],
          ],
        },
      },
      {
        heading: 'Processing engines',
        content: 'LibreOffice is used for all office document conversions (Word, Excel, PowerPoint, HTML). It runs in headless mode via the command line (soffice --headless --convert-to pdf). pdfcpu is used for image-to-pdf conversion, embedding images directly into a PDF container with configurable page dimensions.',
        type: 'paragraph',
      },
      {
        heading: 'Processing time estimates',
        content: '',
        type: 'table',
        tableData: {
          headers: ['Document Size', 'Approximate Time'],
          rows: [
            ['1 page', '~2 seconds'],
            ['10 pages', '~5 seconds'],
            ['100 pages', '~30 seconds'],
          ],
        },
      },
      {
        heading: 'Create conversion job',
        content: 'POST /api/convert-to-pdf\nContent-Type: application/json\n\n{\n  "fileId": "file_x1y2z3w4v5u6",\n  "toolType": "word-to-pdf"\n}',
        type: 'code',
        language: 'HTTP',
      },
      {
        heading: 'Response (201)',
        content: '{\n  "success": true,\n  "data": {\n    "jobId": "job_m1n2o3p4q5r6",\n    "status": "pending",\n    "toolType": "word-to-pdf"\n  }\n}',
        type: 'code',
        language: 'JSON',
      },
    ],
  },
  {
    slug: 'api-convert-from-pdf',
    title: 'Convert from PDF API',
    description: 'Endpoints for converting PDF to other formats.',
    category: 'api',
    sections: [
      {
        heading: 'Tool types and engines',
        content: '',
        type: 'table',
        tableData: {
          headers: ['Tool type', 'Aliases', 'Output', 'Engine'],
          rows: [
            ['pdf-to-word', 'pdf-to-docx', 'DOCX', 'LibreOffice (headless)'],
            ['pdf-to-excel', 'pdf-to-xlsx', 'XLSX', 'LibreOffice (headless)'],
            ['pdf-to-powerpoint', 'pdf-to-pptx', 'PPTX', 'LibreOffice (headless)'],
            ['pdf-to-image', 'pdf-to-img', 'PNG', 'Poppler pdftoppm'],
            ['pdf-to-html', '—', 'HTML', 'Poppler pdftohtml'],
            ['pdf-to-text', 'pdf-to-txt', 'TXT', 'Poppler pdftotext'],
            ['pdf-to-pdfa', '—', 'PDF/A-2b', 'Ghostscript'],
          ],
        },
      },
      {
        heading: 'Processing time estimates',
        content: '',
        type: 'table',
        tableData: {
          headers: ['Tool', '1 Page', '10 Pages', '100 Pages'],
          rows: [
            ['pdf-to-word', '~3s', '~8s', '~45s'],
            ['pdf-to-excel', '~3s', '~10s', '~60s'],
            ['pdf-to-powerpoint', '~3s', '~8s', '~45s'],
            ['pdf-to-image', '~1s', '~5s', '~40s'],
            ['pdf-to-html', '~1s', '~3s', '~20s'],
            ['pdf-to-text', '~0.5s', '~1s', '~5s'],
            ['pdf-to-pdfa', '~2s', '~5s', '~30s'],
          ],
        },
      },
      {
        heading: 'Limitations',
        content: '',
        type: 'list',
        items: [
          'pdf-to-word: Complex layouts with multi-column text, overlapping images, or custom fonts may shift during conversion. Best results with simple, single-column documents.',
          'pdf-to-excel: Works best with PDFs containing clearly structured tables. Free-form text or merged cells may not convert accurately.',
          'pdf-to-powerpoint: Slide boundaries are inferred from page breaks. Complex animations or transitions in the original are not preserved.',
          'pdf-to-image: Multi-page PDFs produce a ZIP archive of PNG images. DPI defaults to 150 but can be configured via options.',
          'pdf-to-html: CSS positioning is approximate. Very large PDFs may produce oversized HTML files.',
        ],
      },
      {
        heading: 'Create conversion job',
        content: 'POST /api/convert-from-pdf\nContent-Type: application/json\n\n{\n  "fileId": "file_x1y2z3w4v5u6",\n  "toolType": "pdf-to-word"\n}',
        type: 'code',
        language: 'HTTP',
      },
      {
        heading: 'Response (201)',
        content: '{\n  "success": true,\n  "data": {\n    "jobId": "job_m1n2o3p4q5r6",\n    "status": "pending",\n    "toolType": "pdf-to-word"\n  }\n}',
        type: 'code',
        language: 'JSON',
      },
    ],
  },
  {
    slug: 'api-organize-pdf',
    title: 'Organize PDF API',
    description: 'Endpoints for PDF manipulation operations.',
    category: 'api',
    sections: [
      {
        heading: 'All 13 tool types with NATS subjects',
        content: '',
        type: 'table',
        tableData: {
          headers: ['Tool type', 'NATS Subject', 'Description'],
          rows: [
            ['merge-pdf', 'jobs.organize-pdf.merge-pdf', 'Combine multiple PDFs into one'],
            ['split-pdf', 'jobs.organize-pdf.split-pdf', 'Split PDF by page ranges or equal chunks'],
            ['rotate-pdf', 'jobs.organize-pdf.rotate-pdf', 'Rotate pages by 90/180/270 degrees'],
            ['remove-pages', 'jobs.organize-pdf.remove-pages', 'Remove specific pages'],
            ['extract-pages', 'jobs.organize-pdf.extract-pages', 'Extract specific pages into new PDF'],
            ['organize-pdf', 'jobs.organize-pdf.organize-pdf', 'Reorder pages'],
            ['watermark-pdf', 'jobs.organize-pdf.watermark-pdf', 'Add text or image watermarks'],
            ['protect-pdf', 'jobs.organize-pdf.protect-pdf', 'Add password encryption'],
            ['unlock-pdf', 'jobs.organize-pdf.unlock-pdf', 'Remove password protection'],
            ['sign-pdf', 'jobs.organize-pdf.sign-pdf', 'Add visual signature'],
            ['edit-pdf', 'jobs.organize-pdf.edit-pdf', 'Add text annotations'],
            ['add-page-numbers', 'jobs.organize-pdf.add-page-numbers', 'Insert page numbering'],
            ['scan-to-pdf', 'jobs.organize-pdf.scan-to-pdf', 'Convert scanned images to PDF'],
          ],
        },
      },
      {
        heading: 'Processing engine',
        content: 'All organize-pdf operations use the pdfcpu library (Go-native PDF processor). No external binaries are needed for these operations.',
        type: 'paragraph',
      },
      {
        heading: 'Merge: file ordering',
        content: 'When merging multiple PDFs, the order is determined by the metadata.fileOrder array in the job options. Each entry references a fileId. Files are merged in the array order.',
        type: 'paragraph',
      },
      {
        heading: 'Split: 4 modes',
        content: '',
        type: 'table',
        tableData: {
          headers: ['Mode', 'Options', 'Description'],
          rows: [
            ['all', '—', 'Split every page into a separate PDF'],
            ['range', 'ranges: "1-3,5-7"', 'Split by specified page ranges, each range becomes a separate PDF'],
            ['extract', 'pages: "1,3,5"', 'Extract listed pages into a single new PDF'],
            ['equal', 'chunkSize: 10', 'Split into equal chunks of N pages each'],
          ],
        },
      },
      {
        heading: 'Create organize job',
        content: 'POST /api/organize-pdf\nContent-Type: application/json\n\n{\n  "fileId": "file_x1y2z3w4v5u6",\n  "toolType": "split-pdf",\n  "options": {\n    "mode": "range",\n    "ranges": "1-3,5-7"\n  }\n}',
        type: 'code',
        language: 'HTTP',
      },
    ],
  },
  {
    slug: 'api-optimize-pdf',
    title: 'Optimize PDF API',
    description: 'Endpoints for PDF optimization operations.',
    category: 'api',
    sections: [
      {
        heading: 'Tool types',
        content: '',
        type: 'table',
        tableData: {
          headers: ['Tool type', 'Engine', 'Description'],
          rows: [
            ['compress-pdf', 'Ghostscript', 'Reduce file size with configurable quality presets'],
            ['repair-pdf', 'pdfcpu', 'Validate and fix corrupted PDF structure'],
            ['ocr-pdf', 'Tesseract OCR', 'Add searchable text layer to scanned PDFs'],
          ],
        },
      },
      {
        heading: 'Compress: Ghostscript quality presets',
        content: '',
        type: 'table',
        tableData: {
          headers: ['Quality Level', 'Ghostscript Preset', 'DPI', 'Use Case'],
          rows: [
            ['extreme', '/screen', '72', 'Smallest file size, screen-only viewing'],
            ['low', '/ebook', '150', 'Good for email attachments and web viewing'],
            ['medium', '/printer', '300', 'Suitable for standard printing'],
            ['high', '/prepress', '300+', 'Highest quality, pre-press and archival'],
          ],
        },
      },
      {
        heading: 'Compress request',
        content: 'POST /api/optimize-pdf\nContent-Type: application/json\n\n{\n  "fileId": "file_x1y2z3w4v5u6",\n  "toolType": "compress-pdf",\n  "options": {\n    "quality": "low"\n  }\n}',
        type: 'code',
        language: 'HTTP',
      },
      {
        heading: 'OCR: Tesseract configuration',
        content: 'The OCR tool accepts a language parameter (tesseract codes: eng, hin, or eng+hin for mixed English/Hindi) and a dpi option (150, 200, 300, 600). Higher DPI improves recognition accuracy but increases processing time. Default is language: "eng" and dpi: 300.',
        type: 'paragraph',
      },
      {
        heading: 'OCR request',
        content: 'POST /api/optimize-pdf\nContent-Type: application/json\n\n{\n  "fileId": "file_x1y2z3w4v5u6",\n  "toolType": "ocr-pdf",\n  "options": {\n    "language": "eng",\n    "dpi": 300\n  }\n}',
        type: 'code',
        language: 'HTTP',
      },
      {
        heading: 'Repair',
        content: 'The repair tool runs pdfcpu validation first. If validation finds structural errors, it attempts automatic repair (fixing xref tables, object streams, and page trees). If the PDF is beyond repair, the job fails with CONVERSION_FAILED.',
        type: 'paragraph',
      },
    ],
  },

  // ── Services ──────────────────────────
  {
    slug: 'svc-api-gateway',
    title: 'API Gateway',
    description: 'Internal routing hub for all API traffic, behind the Caddy edge.',
    category: 'services',
    sections: [
      {
        heading: 'Responsibility',
        content: 'The API Gateway (:8080) is internal-only — public traffic enters through the Caddy edge (:80/:443), which serves the SPA, routes presigned /uploads/* and /outputs/* object traffic directly to MinIO, and proxies /api/*, /auth/*, and /admin/* to the gateway. The gateway handles CORS, authentication verification, request routing via reverse proxy, rate limiting, and security headers. It does not serve the SPA, does not relay object bytes, and does not contain business logic; it only orchestrates middleware and forwards requests.',
        type: 'paragraph',
      },
      {
        heading: 'Proxy transport configuration',
        content: 'The reverse proxy uses a custom http.Transport to handle long-running conversions that may stream data for several minutes.',
        type: 'paragraph',
      },
      {
        heading: 'Transport settings',
        content: '&http.Transport{\n  ResponseHeaderTimeout: 5 * time.Minute,  // wait up to 5min for first response byte\n  IdleConnTimeout:       90 * time.Second,  // close idle connections after 90s\n  MaxIdleConnsPerHost:   100,               // connection pool per backend service\n  TLSHandshakeTimeout:   10 * time.Second,\n}',
        type: 'code',
        language: 'Go',
      },
      {
        heading: 'Why response streaming is needed',
        content: 'Document conversions (especially large files or batch operations) can take minutes. The gateway must keep the connection open while the downstream service processes the file. The 5-minute ResponseHeaderTimeout prevents premature 504s for legitimate long-running jobs.',
        type: 'paragraph',
      },
      {
        heading: 'Auth middleware flow',
        content: '',
        type: 'steps',
        items: [
          'Check for access_token cookie. If present and valid, extract claims and continue.',
          'Check for Authorization: Bearer header. If present and valid, extract claims and continue.',
          'Check for X-Guest-Token header or guest_token cookie. If present and valid, set guest context and continue.',
          'If no auth found at all, auto-issue a guest token: generate a UUID, store in Redis with 2hr TTL, set as guest_token cookie, and continue with guest context.',
          'For all valid tokens, check the jti against the Redis denylist (SET denylist:{jti}). If found, return 401.',
        ],
      },
      {
        heading: 'Token denylist',
        content: 'When a user logs out, their token\'s jti is added to a Redis SET key denylist:{jti} with a TTL equal to the remaining token lifetime. On every request, the middleware checks this SET. This ensures logged-out tokens cannot be reused even if they have not yet expired.',
        type: 'paragraph',
      },
      {
        heading: 'Health endpoints',
        content: '',
        type: 'table',
        tableData: {
          headers: ['Endpoint', 'Type', 'Checks'],
          rows: [
            ['/healthz', 'Liveness', 'Returns 200 if the process is alive. No dependency checks. Used by container orchestrators for restart decisions.'],
            ['/readyz', 'Readiness', 'Returns 200 only if PostgreSQL, Redis, and NATS are all reachable. Used by load balancers to route traffic.'],
          ],
        },
      },
      {
        heading: 'Troubleshooting',
        content: '',
        type: 'table',
        tableData: {
          headers: ['Symptom', 'Cause', 'Fix'],
          rows: [
            ['401 Unauthorized', 'Token expired or denylisted', 'Call /auth/refresh to obtain a new access token. If refresh also fails, re-login.'],
            ['CORS error in browser', 'Origin not in CORS_ORIGINS env var', 'Add the frontend origin to the CORS_ORIGINS comma-separated list and restart the gateway.'],
            ['502 Bad Gateway', 'Downstream service is unreachable', 'Check that the target service is running on its expected port. Verify with /readyz.'],
            ['Cookie not sent by browser', 'Missing credentials: "include"', 'Ensure fetch calls use credentials: "include". Verify the cookie domain and SameSite settings.'],
            ['504 Gateway Timeout', 'Conversion exceeded 5 minutes', 'Check if the file is unusually large. Consider splitting large PDFs before processing.'],
          ],
        },
      },
    ],
  },
  {
    slug: 'svc-auth',
    title: 'Auth Service',
    description: 'User registration, login, and token management.',
    category: 'services',
    sections: [
      {
        heading: 'Responsibility',
        content: 'Manages user accounts, authentication, and JWT token lifecycle. Owns the users, auth_metadata, subscription_plans, and user_sessions tables. All passwords are bcrypt-hashed with a minimum length of 8 characters.',
        type: 'paragraph',
      },
      {
        heading: 'Users table schema',
        content: 'CREATE TABLE users (\n  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n  email         VARCHAR(255) UNIQUE NOT NULL,\n  password_hash VARCHAR(255) NOT NULL,\n  name          VARCHAR(255) NOT NULL,\n  role          VARCHAR(50)  NOT NULL DEFAULT \'user\',\n  plan          VARCHAR(50)  NOT NULL DEFAULT \'free\',\n  is_active     BOOLEAN      NOT NULL DEFAULT true,\n  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),\n  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),\n  deleted_at    TIMESTAMPTZ\n);\n\nCREATE INDEX idx_users_email ON users(email);\nCREATE INDEX idx_users_role ON users(role);',
        type: 'code',
        language: 'SQL',
      },
      {
        heading: 'Token lifecycle',
        content: '',
        type: 'table',
        tableData: {
          headers: ['Token Type', 'Lifetime', 'Storage', 'Rotation'],
          rows: [
            ['Access token', '15 minutes', 'HTTP-only cookie + response body', 'Issued on login, signup, and refresh'],
            ['Refresh token', '7 days', 'Response body only (client stores securely)', 'Single-use; a new refresh token is issued on each refresh call'],
          ],
        },
      },
      {
        heading: 'Session tracking',
        content: 'The user_sessions table tracks active sessions. Each login creates a session record with the refresh token\'s jti, user agent, IP address, and expiry time. On logout, the session is deleted and the access token\'s jti is added to the Redis denylist. On refresh, the old session is replaced with a new one.',
        type: 'paragraph',
      },
      {
        heading: 'Password security',
        content: 'Passwords are hashed using bcrypt with a cost factor of 10. Minimum password length is 8 characters. The service never stores or logs plaintext passwords.',
        type: 'paragraph',
      },
      {
        heading: 'Database tables',
        content: '',
        type: 'table',
        tableData: {
          headers: ['Table', 'Purpose'],
          rows: [
            ['users', 'User profiles: email, name, password_hash, role (user/admin/super-admin), plan (guest/free/pro)'],
            ['auth_metadata', 'OAuth provider tracking (provider name, external ID, linked user)'],
            ['subscription_plans', 'Plan definitions with limits: max file size, max concurrent jobs, retention period'],
            ['user_sessions', 'Active refresh token sessions: jti, user_agent, ip_address, expires_at'],
          ],
        },
      },
    ],
  },
  {
    slug: 'svc-job',
    title: 'Job Service',
    description: 'Job orchestration, file uploads, and job lifecycle.',
    category: 'services',
    sections: [
      {
        heading: 'Responsibility',
        content: 'The Job Service is the central orchestrator. It handles chunked file uploads, creates processing jobs, dispatches work to NATS queues via tool-specific subjects, serves job status and downloads, and provides SSE endpoints for real-time updates.',
        type: 'paragraph',
      },
      {
        heading: 'ToolServiceMap routing',
        content: 'var ToolServiceMap = map[string]string{\n  // Convert to PDF\n  "word-to-pdf":       "jobs.convert-to-pdf.word-to-pdf",\n  "excel-to-pdf":      "jobs.convert-to-pdf.excel-to-pdf",\n  "powerpoint-to-pdf": "jobs.convert-to-pdf.powerpoint-to-pdf",\n  "html-to-pdf":       "jobs.convert-to-pdf.html-to-pdf",\n  "image-to-pdf":      "jobs.convert-to-pdf.image-to-pdf",\n\n  // Convert from PDF\n  "pdf-to-word":       "jobs.convert-from-pdf.pdf-to-word",\n  "pdf-to-excel":      "jobs.convert-from-pdf.pdf-to-excel",\n  "pdf-to-powerpoint": "jobs.convert-from-pdf.pdf-to-powerpoint",\n  "pdf-to-image":      "jobs.convert-from-pdf.pdf-to-image",\n  "pdf-to-html":       "jobs.convert-from-pdf.pdf-to-html",\n  "pdf-to-text":       "jobs.convert-from-pdf.pdf-to-text",\n  "pdf-to-pdfa":       "jobs.convert-from-pdf.pdf-to-pdfa",\n\n  // Organize PDF\n  "merge-pdf":         "jobs.organize-pdf.merge-pdf",\n  "split-pdf":         "jobs.organize-pdf.split-pdf",\n  "rotate-pdf":        "jobs.organize-pdf.rotate-pdf",\n  "remove-pages":      "jobs.organize-pdf.remove-pages",\n  "extract-pages":     "jobs.organize-pdf.extract-pages",\n  "organize-pdf":      "jobs.organize-pdf.organize-pdf",\n  "watermark-pdf":     "jobs.organize-pdf.watermark-pdf",\n  "protect-pdf":       "jobs.organize-pdf.protect-pdf",\n  "unlock-pdf":        "jobs.organize-pdf.unlock-pdf",\n  "sign-pdf":          "jobs.organize-pdf.sign-pdf",\n  "edit-pdf":          "jobs.organize-pdf.edit-pdf",\n  "add-page-numbers":  "jobs.organize-pdf.add-page-numbers",\n  "scan-to-pdf":       "jobs.organize-pdf.scan-to-pdf",\n\n  // Optimize PDF\n  "compress-pdf":      "jobs.optimize-pdf.compress-pdf",\n  "repair-pdf":        "jobs.optimize-pdf.repair-pdf",\n  "ocr-pdf":           "jobs.optimize-pdf.ocr-pdf",\n}',
        type: 'code',
        language: 'Go',
      },
      {
        heading: 'NATS JobEvent schema',
        content: '{\n  "jobId": "job_m1n2o3p4q5r6",\n  "userId": "01902a4b-5c6d-7e8f-9a0b-1c2d3e4f5a6b",\n  "toolType": "word-to-pdf",\n  "inputFilePath": "/uploads/01902a4b/document.docx",\n  "outputDir": "/outputs/01902a4b/",\n  "options": {\n    "quality": "high"\n  },\n  "metadata": {\n    "filename": "document.docx",\n    "fileSize": 5242880,\n    "mimeType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document"\n  },\n  "createdAt": "2025-01-15T10:30:00Z"\n}',
        type: 'code',
        language: 'JSON',
      },
      {
        heading: 'Redis key patterns',
        content: '',
        type: 'table',
        tableData: {
          headers: ['Key Pattern', 'Type', 'TTL', 'Purpose'],
          rows: [
            ['upload:{uploadId}:meta', 'HASH', '30 min', 'Upload session metadata: filename, fileSize, totalChunks, uploadedChunks'],
            ['upload:{uploadId}:chunks', 'SORTED SET', '30 min', 'Binary chunk data keyed by chunk index'],
            ['job:{jobId}:status', 'STRING', '60 sec', 'Cached job status JSON to reduce DB reads during polling'],
          ],
        },
      },
      {
        heading: 'Dead letter queue behavior',
        content: 'NATS JetStream is configured with MaxDeliver: 3. If a message fails processing 3 times (worker crashes, timeout, or explicit NAK), the message is moved to a dead letter subject (dlq.{original-subject}). Dead letter messages are logged with full context and can be manually replayed. On each failed delivery, the job status is updated to show the retry count.',
        type: 'paragraph',
      },
      {
        heading: 'File cleanup on job failure',
        content: 'When a job fails permanently (exhausted retries or unrecoverable error), the Job Service removes the input object from the uploads bucket immediately. Partial output objects, if any, are also removed. The job record remains in the database with status "failed" for observability until the cleanup worker purges it.',
        type: 'paragraph',
      },
      {
        heading: 'Database tables',
        content: '',
        type: 'table',
        tableData: {
          headers: ['Table', 'Purpose'],
          rows: [
            ['processing_jobs', 'Job records: id, user_id, tool_type, status, progress, error_message, metadata (JSONB), created_at, completed_at, expires_at'],
            ['file_metadata', 'Input/output file records: id, job_id, file_type (input/output), filename, file_path, file_size, mime_type'],
          ],
        },
      },
      {
        heading: 'Plan-based limits enforcement',
        content: 'The API Gateway extracts the user plan (guest, free, or pro) from the JWT and forwards it as the X-Plan header to the Job Service. The Job Service uses this header to enforce plan-specific limits: maximum file size per upload, maximum concurrent active jobs, and file retention period (2 hours for guests, 24 hours for free, 7 days for pro). When a limit is exceeded, the service returns a 403 with an error code indicating which limit was hit. This approach keeps plan logic centralized in the Job Service while letting the Gateway handle authentication.',
        type: 'paragraph',
      },
      {
        heading: 'SSE implementation',
        content: 'The Job Service exposes a GET /api/jobs/:jobId/events endpoint that uses Server-Sent Events (SSE) to push real-time status updates to the client. When a worker service updates a job via NATS (status change, progress update), the Job Service receives the event and broadcasts it to any connected SSE clients for that jobId. Events use the "job-update" event type with a JSON payload containing jobId, status, progress, toolType, and optional fileSize. A "done" event is sent when the job reaches a terminal state (completed or failed), after which the server closes the connection. The SSE endpoint requires the same authentication as other API endpoints — the access_token cookie or guest_token must be present.',
        type: 'paragraph',
      },
    ],
  },
  {
    slug: 'svc-convert-to-pdf',
    title: 'Convert to PDF Service',
    description: 'Converts office documents and images to PDF.',
    category: 'services',
    sections: [
      {
        heading: 'Responsibility',
        content: 'Consumes jobs from NATS JetStream and converts documents (Word, Excel, PowerPoint, HTML, images) to PDF format. Runs as a stateless worker that can be horizontally scaled.',
        type: 'paragraph',
      },
      {
        heading: 'Internal package structure',
        content: 'convert-to-pdf-service/\n  main.go              # Entry point, NATS consumer setup\n  internal/\n    converter/\n      libreoffice.go   # LibreOffice headless conversion\n      image.go         # pdfcpu image-to-pdf\n      router.go        # Routes toolType to converter function\n    handler/\n      nats_handler.go  # Message handler, ack/nak logic\n    config/\n      config.go        # Service-specific config',
        type: 'code',
        language: 'Directory',
      },
      {
        heading: 'NATS consumer configuration',
        content: '',
        type: 'table',
        tableData: {
          headers: ['Setting', 'Value'],
          rows: [
            ['Stream', 'JOBS'],
            ['Consumer group', 'convert-to-pdf-workers'],
            ['Subjects', 'jobs.convert-to-pdf.*'],
            ['MaxDeliver', '3'],
            ['AckWait', '5 minutes'],
          ],
        },
      },
      {
        heading: 'Supported conversions',
        content: '',
        type: 'table',
        tableData: {
          headers: ['Tool type', 'Engine', 'Processing Timeout'],
          rows: [
            ['word-to-pdf', 'LibreOffice', '5 min'],
            ['excel-to-pdf', 'LibreOffice', '5 min'],
            ['powerpoint-to-pdf', 'LibreOffice', '5 min'],
            ['html-to-pdf', 'LibreOffice', '5 min'],
            ['image-to-pdf', 'pdfcpu', '2 min'],
          ],
        },
      },
      {
        heading: 'Retry logic',
        content: 'On processing failure, the NATS message is NAK\'d with a backoff delay. First retry after 5 seconds, second retry after 30 seconds, third retry after 2 minutes. After 3 failed deliveries, the message goes to the dead letter queue.',
        type: 'paragraph',
      },
      {
        heading: 'Error classification',
        content: '',
        type: 'table',
        tableData: {
          headers: ['Error Code', 'Retryable', 'Description'],
          rows: [
            ['UNSUPPORTED_TOOL', 'No', 'Tool type not recognized by this service'],
            ['CONVERSION_FAILED', 'Yes', 'LibreOffice/pdfcpu returned a non-zero exit code'],
            ['FILE_TOO_LARGE', 'No', 'Input file exceeds the maximum size for the tool'],
            ['TIMEOUT', 'Yes', 'Processing exceeded the per-operation timeout'],
          ],
        },
      },
      {
        heading: 'CLI commands used internally',
        content: '# LibreOffice headless conversion (Word, Excel, PPT, HTML to PDF)\nsoffice --headless --convert-to pdf --outdir /outputs/ /uploads/document.docx\n\n# pdfcpu image import (Image to PDF)\npdfcpu import /outputs/output.pdf /uploads/image.jpg',
        type: 'code',
        language: 'Bash',
      },
    ],
  },
  {
    slug: 'svc-convert-from-pdf',
    title: 'Convert from PDF Service',
    description: 'Converts PDF to other document formats.',
    category: 'services',
    sections: [
      {
        heading: 'Responsibility',
        content: 'Consumes jobs from NATS JetStream and converts PDFs to various output formats using LibreOffice, Poppler utilities, and Ghostscript.',
        type: 'paragraph',
      },
      {
        heading: 'Internal package structure',
        content: 'convert-from-pdf-service/\n  main.go              # Entry point, NATS consumer setup\n  internal/\n    converter/\n      libreoffice.go   # PDF to Word/Excel/PPT via LibreOffice\n      poppler.go       # pdftoppm, pdftohtml, pdftotext\n      ghostscript.go   # PDF to PDF/A\n      router.go        # Routes toolType to converter function\n    handler/\n      nats_handler.go  # Message handler, ack/nak logic\n    config/\n      config.go        # Service-specific config',
        type: 'code',
        language: 'Directory',
      },
      {
        heading: 'NATS consumer configuration',
        content: '',
        type: 'table',
        tableData: {
          headers: ['Setting', 'Value'],
          rows: [
            ['Stream', 'JOBS'],
            ['Consumer group', 'convert-from-pdf-workers'],
            ['Subjects', 'jobs.convert-from-pdf.*'],
            ['MaxDeliver', '3'],
            ['AckWait', '5 minutes'],
          ],
        },
      },
      {
        heading: 'Supported conversions',
        content: '',
        type: 'table',
        tableData: {
          headers: ['Tool type', 'Output', 'Engine', 'Timeout'],
          rows: [
            ['pdf-to-word', 'DOCX', 'LibreOffice (headless)', '5 min'],
            ['pdf-to-excel', 'XLSX', 'LibreOffice (headless)', '5 min'],
            ['pdf-to-powerpoint', 'PPTX', 'LibreOffice (headless)', '5 min'],
            ['pdf-to-image', 'PNG', 'Poppler pdftoppm', '5 min'],
            ['pdf-to-html', 'HTML', 'Poppler pdftohtml', '3 min'],
            ['pdf-to-text', 'TXT', 'Poppler pdftotext', '2 min'],
            ['pdf-to-pdfa', 'PDF/A-2b', 'Ghostscript', '5 min'],
          ],
        },
      },
      {
        heading: 'Retry logic',
        content: 'Same as convert-to-pdf: NAK with backoff (5s, 30s, 2min). After 3 failed deliveries, message goes to dead letter queue.',
        type: 'paragraph',
      },
      {
        heading: 'Error classification',
        content: '',
        type: 'table',
        tableData: {
          headers: ['Error Code', 'Retryable', 'Description'],
          rows: [
            ['UNSUPPORTED_TOOL', 'No', 'Tool type not recognized by this service'],
            ['CONVERSION_FAILED', 'Yes', 'Underlying tool returned a non-zero exit code'],
            ['FILE_TOO_LARGE', 'No', 'Input file exceeds the maximum size for the tool'],
            ['TIMEOUT', 'Yes', 'Processing exceeded the per-operation timeout'],
          ],
        },
      },
      {
        heading: 'CLI commands used internally',
        content: '# Poppler: PDF to PNG images (one per page)\npdftoppm -png -r 150 /uploads/input.pdf /outputs/page\n\n# Poppler: PDF to HTML with embedded images\npdftohtml -noframes -enc UTF-8 /uploads/input.pdf /outputs/output.html\n\n# Poppler: PDF to plain text\npdftotext -layout /uploads/input.pdf /outputs/output.txt\n\n# Ghostscript: PDF to PDF/A-2b archival format\ngs -dPDFA=2 -dBATCH -dNOPAUSE -sColorConversionStrategy=RGB \\\n  -sDEVICE=pdfwrite -dPDFACompatibilityPolicy=1 \\\n  -sOutputFile=/outputs/output.pdf /uploads/input.pdf',
        type: 'code',
        language: 'Bash',
      },
    ],
  },
  {
    slug: 'svc-organize-pdf',
    title: 'Organize PDF Service',
    description: 'PDF manipulation — merge, split, rotate, watermark, sign, edit.',
    category: 'services',
    sections: [
      {
        heading: 'Responsibility',
        content: 'Handles all PDF manipulation operations using the pdfcpu library (Go-native, no external binary dependency). Consumes jobs from NATS JetStream.',
        type: 'paragraph',
      },
      {
        heading: 'Internal package structure',
        content: 'organize-pdf-service/\n  main.go              # Entry point, NATS consumer setup\n  internal/\n    organizer/\n      merge.go         # Multi-file merge with ordering\n      split.go         # 4 split modes (all, range, extract, equal)\n      rotate.go        # Page rotation\n      pages.go         # Remove/extract/reorder pages\n      watermark.go     # Text and image watermarks\n      security.go      # Protect/unlock operations\n      sign.go          # Visual signature placement\n      edit.go          # Text annotations\n      numbering.go     # Page number insertion\n      scan.go          # Scanned image to PDF\n      router.go        # Routes toolType to organizer function\n    handler/\n      nats_handler.go  # Message handler, ack/nak logic',
        type: 'code',
        language: 'Directory',
      },
      {
        heading: 'NATS consumer configuration',
        content: '',
        type: 'table',
        tableData: {
          headers: ['Setting', 'Value'],
          rows: [
            ['Stream', 'JOBS'],
            ['Consumer group', 'organize-pdf-workers'],
            ['Subjects', 'jobs.organize-pdf.*'],
            ['MaxDeliver', '3'],
            ['AckWait', '5 minutes'],
          ],
        },
      },
      {
        heading: 'Operations and timeouts',
        content: '',
        type: 'table',
        tableData: {
          headers: ['Operation', 'Processing Timeout', 'Notes'],
          rows: [
            ['merge-pdf', '5 min', 'File order from metadata.fileOrder array'],
            ['split-pdf', '5 min', '4 modes: all, range, extract, equal'],
            ['rotate-pdf', '2 min', 'Degrees: 90, 180, 270'],
            ['remove-pages', '2 min', 'Page list in options.pages'],
            ['extract-pages', '2 min', 'Page list in options.pages'],
            ['organize-pdf', '2 min', 'New page order in options.pageOrder'],
            ['watermark-pdf', '3 min', 'Text or image, configurable position/opacity'],
            ['protect-pdf', '2 min', 'Owner and user passwords'],
            ['unlock-pdf', '2 min', 'Requires current password'],
            ['sign-pdf', '2 min', 'Visual signature image placement'],
            ['edit-pdf', '2 min', 'Text annotation overlay'],
            ['add-page-numbers', '2 min', 'Position: top/bottom, left/center/right'],
            ['scan-to-pdf', '3 min', 'Image preprocessing + PDF creation'],
          ],
        },
      },
      {
        heading: 'Error classification',
        content: '',
        type: 'table',
        tableData: {
          headers: ['Error Code', 'Retryable', 'Description'],
          rows: [
            ['UNSUPPORTED_TOOL', 'No', 'Tool type not recognized by this service'],
            ['CONVERSION_FAILED', 'Yes', 'pdfcpu returned an error during processing'],
            ['FILE_TOO_LARGE', 'No', 'Input file exceeds maximum size'],
            ['TIMEOUT', 'Yes', 'Processing exceeded the per-operation timeout'],
          ],
        },
      },
      {
        heading: 'pdfcpu operations',
        content: '# Merge multiple PDFs into one\npdfcpu merge /outputs/merged.pdf /uploads/file1.pdf /uploads/file2.pdf /uploads/file3.pdf\n\n# Split every page into a separate PDF\npdfcpu split /uploads/input.pdf /outputs/\n\n# Rotate pages 90 degrees clockwise\npdfcpu rotate -pages 1-5 90 /uploads/input.pdf /outputs/rotated.pdf\n\n# Remove specific pages\npdfcpu remove-pages /uploads/input.pdf /outputs/trimmed.pdf 3,5,7\n\n# Extract specific pages into a new PDF\npdfcpu extract -mode page -pages 1-3,5 /uploads/input.pdf /outputs/\n\n# Add text watermark\npdfcpu stamp add -mode text -- "CONFIDENTIAL" "sc:1.0, rot:45, op:0.3" /uploads/input.pdf /outputs/watermarked.pdf\n\n# Encrypt with password\npdfcpu encrypt -opw owner123 -upw user123 /uploads/input.pdf /outputs/protected.pdf\n\n# Decrypt (remove password)\npdfcpu decrypt -opw owner123 /uploads/input.pdf /outputs/unlocked.pdf',
        type: 'code',
        language: 'Bash',
      },
    ],
  },
  {
    slug: 'svc-optimize-pdf',
    title: 'Optimize PDF Service',
    description: 'PDF compression, repair, and OCR.',
    category: 'services',
    sections: [
      {
        heading: 'Responsibility',
        content: 'Handles PDF optimization operations. Compression uses Ghostscript with quality presets. OCR uses Tesseract for text layer extraction. Repair uses pdfcpu for structural validation and fixing.',
        type: 'paragraph',
      },
      {
        heading: 'Internal package structure',
        content: 'optimize-pdf-service/\n  main.go              # Entry point, NATS consumer setup\n  internal/\n    optimizer/\n      compress.go      # Ghostscript quality presets\n      ocr.go           # Tesseract language/DPI config\n      repair.go        # pdfcpu validate + repair\n      router.go        # Routes toolType to optimizer function\n    handler/\n      nats_handler.go  # Message handler, ack/nak logic\n    config/\n      config.go        # Service-specific config',
        type: 'code',
        language: 'Directory',
      },
      {
        heading: 'NATS consumer configuration',
        content: '',
        type: 'table',
        tableData: {
          headers: ['Setting', 'Value'],
          rows: [
            ['Stream', 'JOBS'],
            ['Consumer group', 'optimize-pdf-workers'],
            ['Subjects', 'jobs.optimize-pdf.*'],
            ['MaxDeliver', '3'],
            ['AckWait', '10 minutes'],
          ],
        },
      },
      {
        heading: 'Operations detail',
        content: '',
        type: 'table',
        tableData: {
          headers: ['Operation', 'Engine', 'Timeout', 'Notes'],
          rows: [
            ['compress-pdf', 'Ghostscript', '10 min', 'Presets: /screen (72dpi), /ebook (150dpi), /printer (300dpi), /prepress (300+dpi)'],
            ['ocr-pdf', 'Tesseract', '10 min', 'Languages: eng, hin, eng+hin. DPI: 150-600'],
            ['repair-pdf', 'pdfcpu', '5 min', 'Runs validation first, then attempts structural repair'],
          ],
        },
      },
      {
        heading: 'Retry and error handling',
        content: 'Same retry logic as other worker services: NAK with backoff (5s, 30s, 2min), dead letter queue after 3 failures. OCR jobs have a longer AckWait (10 minutes) because Tesseract processing is CPU-intensive on large documents.',
        type: 'paragraph',
      },
      {
        heading: 'Error classification',
        content: '',
        type: 'table',
        tableData: {
          headers: ['Error Code', 'Retryable', 'Description'],
          rows: [
            ['UNSUPPORTED_TOOL', 'No', 'Tool type not recognized by this service'],
            ['CONVERSION_FAILED', 'Yes', 'Underlying tool returned a non-zero exit code'],
            ['FILE_TOO_LARGE', 'No', 'Input file exceeds the maximum size for the operation'],
            ['TIMEOUT', 'Yes', 'Processing exceeded the per-operation timeout'],
          ],
        },
      },
      {
        heading: 'CLI commands used internally',
        content: '# Ghostscript: compress PDF with quality presets\n# /screen = 72dpi, /ebook = 150dpi, /printer = 300dpi, /prepress = 300+dpi\ngs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 \\\n  -dPDFSETTINGS=/ebook -dNOPAUSE -dBATCH \\\n  -sOutputFile=/outputs/compressed.pdf /uploads/input.pdf\n\n# Tesseract OCR: add searchable text layer to scanned PDF\n# First convert PDF pages to images, then run OCR\ntesseract /uploads/page.png /outputs/page -l eng --dpi 300 pdf',
        type: 'code',
        language: 'Bash',
      },
    ],
  },
  {
    slug: 'svc-analytics',
    title: 'Analytics Service',
    description: 'Usage metrics and analytics tracking.',
    category: 'services',
    sections: [
      {
        heading: 'Responsibility',
        content: 'Tracks usage metrics, job statistics, and system health data. Powers the admin dashboard with business, growth, engagement, reliability, and system performance metrics.',
        type: 'paragraph',
      },
      {
        heading: 'Admin dashboard metrics',
        content: '',
        type: 'table',
        tableData: {
          headers: ['Category', 'Metrics'],
          rows: [
            ['Business', 'Total jobs, jobs per tool, revenue per plan, conversion rates'],
            ['Growth', 'New signups per day/week/month, active users, retention cohorts'],
            ['Engagement', 'Jobs per user, most-used tools, session duration, return frequency'],
            ['Reliability', 'Job success/failure rates, average processing time, error distribution by type'],
            ['System', 'CPU/memory usage per service, queue depth, Redis memory, DB connection pool utilization'],
          ],
        },
      },
      {
        heading: 'Aggregation intervals',
        content: '',
        type: 'table',
        tableData: {
          headers: ['Interval', 'Purpose'],
          rows: [
            ['Real-time', 'Active jobs, queue depth, error rates (last 5 min)'],
            ['Hourly', 'Job throughput, average processing time'],
            ['Daily', 'User signups, total jobs, per-tool breakdown'],
            ['Weekly/Monthly', 'Growth trends, retention, revenue summaries'],
          ],
        },
      },
    ],
  },
  {
    slug: 'svc-cleanup',
    title: 'Cleanup Worker',
    description: 'Background worker for expired file and job cleanup.',
    category: 'services',
    sections: [
      {
        heading: 'Responsibility',
        content: 'Runs on a fixed schedule to clean up expired files and jobs. It is job-service\'s own cleanup binary (job-service/cmd/cleanup) shipped in the cleanup-worker container, reusing job-service\'s GORM models with no duplicated structs. Ensures object storage (the MinIO uploads and outputs buckets) is reclaimed and database records are kept manageable.',
        type: 'paragraph',
      },
      {
        heading: 'Schedule',
        content: 'The cleanup worker runs every 5 minutes. Each run scans for expired jobs and orphaned files.',
        type: 'paragraph',
      },
      {
        heading: 'Cleanup rules',
        content: '',
        type: 'table',
        tableData: {
          headers: ['Category', 'TTL', 'Description'],
          rows: [
            ['Guest job files', '2 hours', 'Files from unauthenticated users are short-lived'],
            ['Free-plan files', '24 hours', 'Standard retention for free accounts'],
            ['Pro-plan files', '7 days', 'Extended retention for paid accounts'],
            ['Failed jobs', 'Configurable', 'Cleaned up after a configurable retention period'],
            ['Orphaned files', 'Immediate', 'Files with no associated job record are removed on each run'],
          ],
        },
      },
      {
        heading: 'Cleanup query',
        content: 'SELECT * FROM processing_jobs\nWHERE expires_at < NOW()\n  AND cleanup_status = \'pending\';',
        type: 'code',
        language: 'SQL',
      },
      {
        heading: 'Cleanup process',
        content: '',
        type: 'steps',
        items: [
          'Query for all jobs where expires_at < NOW() and cleanup_status is pending',
          'For each expired job, remove the input object from the uploads bucket first (if it still exists)',
          'Remove the output object from the outputs bucket (if it still exists)',
          'Mark the database record with cleanup_status = "cleaned" and cleanup_at = NOW()',
          'Sweep stale upload sessions and abort stale multipart uploads in the uploads bucket',
          'Log a summary: number of jobs cleaned, storage reclaimed, errors encountered',
        ],
      },
      {
        content: 'The cleanup worker removes objects from storage first, then marks the DB record. This order ensures that if the worker crashes mid-cleanup, the next run will retry the object deletion rather than leaving orphaned objects.',
        type: 'tip',
      },
    ],
  },

  // ── Architecture ──────────────────────
  {
    slug: 'arch-redis',
    title: 'Redis Architecture',
    description: 'Redis data structures, caching patterns, and key namespaces.',
    category: 'architecture',
    sections: [
      {
        heading: 'Overview',
        content: 'Redis serves as the shared state layer across services. It is used for upload session management, rate limiting, token denylist, guest sessions, and job status caching. Each key namespace uses a consistent prefix pattern for easy monitoring and debugging.',
        type: 'paragraph',
      },
      {
        heading: 'All 7 key patterns',
        content: '',
        type: 'table',
        tableData: {
          headers: ['Key Pattern', 'Redis Type', 'TTL', 'Purpose'],
          rows: [
            ['upload:{uploadId}:meta', 'HASH', '30 min', 'Upload session metadata (filename, fileSize, totalChunks, uploadedChunks, toolType)'],
            ['upload:{uploadId}:chunks', 'SORTED SET', '30 min', 'Binary chunk data indexed by chunk number'],
            ['denylist:{jti}', 'SET', 'Remaining token lifetime', 'Denylisted JWT token IDs (logout/rotation)'],
            ['guest:{guestId}', 'STRING', '2 hours', 'Guest session data (auto-issued token)'],
            ['ratelimit:{ip}:{endpoint}:{window}', 'STRING (counter)', '1 min', 'Sliding window rate limit counter'],
            ['job:{jobId}:status', 'STRING', '60 sec', 'Cached job status JSON to reduce DB reads during polling'],
            ['session:{userId}:{sessionId}', 'HASH', '7 days', 'Active user session metadata'],
          ],
        },
      },
      {
        heading: 'Key format examples',
        content: '# Upload session\nHGETALL upload:upl_a1b2c3d4e5f6:meta\n# => filename: "document.docx"\n# => fileSize: "5242880"\n# => totalChunks: "5"\n# => uploadedChunks: "3"\n# => toolType: "word-to-pdf"\n# => userId: "01902a4b-5c6d-7e8f-9a0b-1c2d3e4f5a6b"\n\n# Token denylist\nSET denylist:jti_abc123 1 EX 840\n# => Sets denylist entry with TTL = remaining token lifetime (840 seconds)\n\n# Rate limiting\nINCR ratelimit:192.168.1.1:/auth/login:1700000000\nEXPIRE ratelimit:192.168.1.1:/auth/login:1700000000 60\n# => Increments counter for this IP + endpoint + minute window\n\n# Guest session\nSET guest:guest_x1y2z3 \'{"createdAt":"2025-01-15T10:30:00Z"}\' EX 7200\n\n# Job status cache\nSET job:job_m1n2o3p4q5r6:status \'{"status":"processing","progress":45}\' EX 60',
        type: 'code',
        language: 'Redis',
      },
      {
        heading: 'Token denylist details',
        content: 'When a user logs out, the access token\'s jti claim is added to Redis as SET denylist:{jti} with a TTL equal to the remaining lifetime of that token. This means denylisted keys automatically expire when the token would have expired anyway, keeping Redis memory usage bounded. The auth middleware checks EXISTS denylist:{jti} on every request.',
        type: 'paragraph',
      },
      {
        heading: 'Upload session details',
        content: 'Upload sessions use a HASH for metadata and a SORTED SET for chunk data. The Lua script for atomic assembly reads all members from the sorted set in order, concatenates them, and writes the result to disk. If any step fails, the Lua script returns an error and no partial file is written. Both keys share the same TTL and are cleaned up together.',
        type: 'paragraph',
      },
      {
        heading: 'Rate limiting details',
        content: 'Rate limiting uses a fixed-window approach. The key includes the IP, endpoint, and a truncated Unix timestamp (floored to the minute). INCR atomically creates or increments the counter. EXPIRE sets a 60-second TTL on first creation. The middleware checks if the counter exceeds the per-endpoint threshold before forwarding the request.',
        type: 'paragraph',
      },
    ],
  },
  {
    slug: 'arch-base-image',
    title: 'Base Image Setup',
    description: 'Docker base image configuration for processing services.',
    category: 'architecture',
    sections: [
      {
        heading: 'Overview',
        content: 'Processing services (convert-to-pdf, convert-from-pdf, organize-pdf, optimize-pdf) require system-level tools like LibreOffice, Ghostscript, Poppler, and Tesseract. These are bundled in a shared base Docker image to ensure consistent versions across all services and to reduce individual image build times.',
        type: 'paragraph',
      },
      {
        heading: 'Dockerfile base image installation',
        content: 'FROM golang:1.25-bookworm AS base\n\n# Install LibreOffice (headless, for office doc conversions)\nRUN apt-get update && apt-get install -y --no-install-recommends \\\n    libreoffice-core=4:7.5.* \\\n    libreoffice-writer=4:7.5.* \\\n    libreoffice-calc=4:7.5.* \\\n    libreoffice-impress=4:7.5.* \\\n  && rm -rf /var/lib/apt/lists/*\n\n# Install Ghostscript (for PDF compression and PDF/A)\nRUN apt-get update && apt-get install -y --no-install-recommends \\\n    ghostscript=10.0.* \\\n  && rm -rf /var/lib/apt/lists/*\n\n# Install Poppler utilities (pdftoppm, pdftohtml, pdftotext)\nRUN apt-get update && apt-get install -y --no-install-recommends \\\n    poppler-utils=22.12.* \\\n  && rm -rf /var/lib/apt/lists/*\n\n# Install Tesseract OCR with English language pack\nRUN apt-get update && apt-get install -y --no-install-recommends \\\n    tesseract-ocr=5.3.* \\\n    tesseract-ocr-eng \\\n  && rm -rf /var/lib/apt/lists/*\n\n# Additional language packs can be installed per deployment\n# RUN apt-get install -y tesseract-ocr-fra tesseract-ocr-deu tesseract-ocr-spa',
        type: 'code',
        language: 'Dockerfile',
      },
      {
        heading: 'Version pinning',
        content: 'All system dependencies use pinned major.minor versions (e.g., libreoffice-core=4:7.5.*, ghostscript=10.0.*) to ensure reproducible builds. Patch versions are allowed to float for security updates. When upgrading a dependency, update the pin in the base image Dockerfile and rebuild all processing service images.',
        type: 'paragraph',
      },
      {
        heading: 'Included tools',
        content: '',
        type: 'table',
        tableData: {
          headers: ['Tool', 'Version Pin', 'Used For'],
          rows: [
            ['LibreOffice', '7.5.x', 'Office document conversions (Word, Excel, PPT, HTML to/from PDF)'],
            ['Ghostscript', '10.0.x', 'PDF compression (quality presets), PDF/A conversion'],
            ['Poppler utils', '22.12.x', 'pdftoppm (PDF to image), pdftohtml, pdftotext'],
            ['Tesseract OCR', '5.3.x', 'Optical character recognition with configurable language packs'],
            ['pdfcpu', 'Go module', 'PDF manipulation (merge, split, rotate, etc.) — compiled into Go binary, not a system package'],
          ],
        },
      },
    ],
  },
  {
    slug: 'arch-db-practices',
    title: 'Database Best Practices',
    description: 'PostgreSQL design patterns and conventions.',
    category: 'architecture',
    sections: [
      {
        heading: 'Ownership model',
        content: 'Each service owns its own database schema. No cross-service DB access is permitted. Data is exchanged only via REST APIs or NATS events. This ensures services can evolve their schemas independently without breaking other services.',
        type: 'paragraph',
      },
      {
        heading: 'UUIDv7 primary keys',
        content: 'All tables use UUIDv7 as the primary key type. UUIDv7 is time-ordered (the first 48 bits encode a Unix millisecond timestamp), which provides better B-tree index locality compared to UUIDv4. This means INSERT operations are always appending to the end of the index, reducing page splits and improving write throughput.',
        type: 'paragraph',
      },
      {
        heading: 'Composite indexes',
        content: 'Key query patterns have composite indexes. For example, the processing_jobs table has a composite index on (user_id, status, created_at) which covers the "my recent jobs" query pattern. The column order matters: user_id first (equality filter), then status (equality filter), then created_at (range/sort). This allows the query planner to use a single index scan.',
        type: 'paragraph',
      },
      {
        heading: 'N+1 query elimination',
        content: 'GORM\'s Preload function is used to avoid N+1 queries. When loading jobs with their file metadata, use db.Preload("FileMetadata").Find(&jobs) instead of loading each job\'s files in a loop. This translates to 2 SQL queries (one for jobs, one for all related file_metadata) instead of N+1.',
        type: 'paragraph',
      },
      {
        heading: 'Connection pool configuration',
        content: 'db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})\nsqlDB, _ := db.DB()\n\nsqlDB.SetMaxIdleConns(5)           // keep 5 idle connections ready\nsqlDB.SetMaxOpenConns(25)          // max 25 concurrent connections per service\nsqlDB.SetConnMaxLifetime(5 * time.Minute) // recycle connections every 5 min',
        type: 'code',
        language: 'Go',
      },
      {
        heading: 'Connection pool rationale',
        content: '',
        type: 'table',
        tableData: {
          headers: ['Setting', 'Value', 'Rationale'],
          rows: [
            ['MaxIdleConns', '5', 'Keeps a small pool warm to avoid connection setup latency on moderate traffic'],
            ['MaxOpenConns', '25', 'Limits total connections per service. With 9 services, worst case is 225 total connections to PostgreSQL.'],
            ['ConnMaxLifetime', '5 min', 'Recycles connections to pick up DNS changes and prevent stale connections after PG restarts'],
          ],
        },
      },
      {
        heading: 'Additional conventions',
        content: '',
        type: 'list',
        items: [
          'JSONB for flexible metadata: The processing_jobs.metadata column uses JSONB to store tool-specific options and results without schema migrations',
          'GORM AutoMigrate in development: Each service calls AutoMigrate on startup to apply schema changes. In production, use versioned SQL migrations.',
          'Soft deletes via GORM: Tables use a deleted_at column. Queries automatically filter out soft-deleted rows. Use Unscoped() when you need to include them.',
          'Timestamps: All tables include created_at, updated_at (auto-managed by GORM), and deleted_at (for soft delete)',
        ],
      },
    ],
  },

  // ── Guides ────────────────────────────
  {
    slug: 'guide-hardening',
    title: 'Backend Hardening',
    description: 'Security hardening guidelines for production deployment.',
    category: 'guides',
    sections: [
      {
        heading: 'CORS configuration',
        content: 'In production, the CORS_ORIGINS environment variable must list exact origins (e.g., https://fyredocs.com,https://app.fyredocs.com). Never use a wildcard (*) in production. The API Gateway validates the Origin header against this list on every request. Misconfigured CORS is the most common source of "it works locally but not in production" issues.',
        type: 'paragraph',
      },
      {
        heading: 'JWT security',
        content: '',
        type: 'list',
        items: [
          'Algorithm: HS256 (HMAC-SHA256). Symmetric signing; the same secret is used for signing and verification.',
          'Secret: Minimum 32 characters. Use a cryptographically random string (e.g., openssl rand -base64 48).',
          'Rotation: Rotate the JWT secret quarterly. During rotation, the old secret must remain valid for the duration of the longest-lived token (7 days for refresh tokens).',
          'Claims: Always validate exp, iss, and aud claims. Check jti against the Redis denylist.',
        ],
      },
      {
        heading: 'Rate limits',
        content: '',
        type: 'table',
        tableData: {
          headers: ['Endpoint', 'Limit', 'Window'],
          rows: [
            ['/auth/signup', '10 requests', 'Per minute per IP'],
            ['/auth/login', '20 requests', 'Per minute per IP'],
            ['/api/upload/*', '100 requests', 'Per minute per IP'],
            ['/api/jobs', '50 requests', 'Per minute per user'],
          ],
        },
      },
      {
        heading: 'File validation',
        content: 'File uploads must be validated at two levels: (1) check the MIME type from the Content-Type header, and (2) read the first 512 bytes and check magic bytes to confirm the actual file type matches the declared type. Do not trust the file extension alone. This prevents users from uploading executable files disguised as documents.',
        type: 'paragraph',
      },
      {
        heading: 'Security headers',
        content: '',
        type: 'list',
        items: [
          'X-Content-Type-Options: nosniff (prevents MIME type sniffing)',
          'X-Frame-Options: DENY (prevents clickjacking)',
          'X-XSS-Protection: 1; mode=block (legacy XSS filter)',
          'Strict-Transport-Security: max-age=31536000; includeSubDomains (HSTS, HTTPS only)',
          'Content-Security-Policy: appropriate policy for the frontend origin',
        ],
      },
      {
        content: 'Never log JWT secrets, user passwords, or file contents. Use structured logging (slog) and ensure sensitive fields are redacted. Review log output regularly to catch accidental leaks.',
        type: 'warning',
      },
    ],
  },
  {
    slug: 'guide-deployment',
    title: 'Deployment Review',
    description: 'Pre-deployment checklist and review process.',
    category: 'guides',
    sections: [
      {
        heading: 'Pre-flight commands',
        content: '# Build all services\nfor dir in api-gateway auth-service job-service convert-to-pdf-service \\\n  convert-from-pdf-service organize-pdf-service optimize-pdf-service \\\n  analytics-service cleanup-worker; do\n  echo "Building $dir..." && cd "$dir" && go build ./... && cd ..\ndone\n\n# Run static analysis\nfor dir in api-gateway auth-service job-service convert-to-pdf-service \\\n  convert-from-pdf-service organize-pdf-service optimize-pdf-service \\\n  analytics-service cleanup-worker; do\n  echo "Vetting $dir..." && cd "$dir" && go vet ./... && cd ..\ndone\n\n# Run all tests\nfor dir in api-gateway auth-service job-service convert-to-pdf-service \\\n  convert-from-pdf-service organize-pdf-service optimize-pdf-service \\\n  analytics-service cleanup-worker; do\n  echo "Testing $dir..." && cd "$dir" && go test ./... && cd ..\ndone\n\n# Build Docker images\ndocker build -t fyredocs-base -f deployment/Dockerfile.base .\nfor svc in api-gateway auth-service job-service convert-to-pdf-service \\\n  convert-from-pdf-service organize-pdf-service optimize-pdf-service \\\n  analytics-service cleanup-worker; do\n  docker build -t "fyredocs-$svc" -f "$svc/Dockerfile" .\ndone',
        type: 'code',
        language: 'Bash',
      },
      {
        heading: 'Environment variable checklist',
        content: '',
        type: 'table',
        tableData: {
          headers: ['Variable', 'Required', 'Notes'],
          rows: [
            ['DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME', 'Yes', 'PostgreSQL connection. Each service can use a different DB_NAME for schema isolation.'],
            ['REDIS_HOST, REDIS_PORT, REDIS_PASSWORD', 'Yes', 'Shared Redis instance for all services.'],
            ['NATS_URL', 'Yes', 'NATS connection URL. Must have JetStream enabled.'],
            ['JWT_SECRET', 'Yes', 'Minimum 32 characters. Shared between API Gateway and Auth Service.'],
            ['JWT_ACCESS_EXPIRY', 'Yes', 'Recommended: 15m'],
            ['JWT_REFRESH_EXPIRY', 'Yes', 'Recommended: 168h (7 days)'],
            ['CORS_ORIGINS', 'Yes', 'Comma-separated exact origins. No wildcards in production.'],
            ['UPLOAD_DIR, OUTPUT_DIR', 'Yes', 'File storage paths. Must be writable by the service user.'],
            ['LOG_LEVEL', 'No', 'Default: info. Options: debug, info, warn, error.'],
            ['OTEL_EXPORTER_ENDPOINT', 'No', 'OpenTelemetry collector URL for distributed tracing.'],
          ],
        },
      },
      {
        heading: 'Health check verification',
        content: '# Verify liveness through the public edge (should return 200 immediately)\ncurl -f http://localhost/healthz\n\n# Readiness (/readyz) is not exposed through the edge — probe services on the\n# internal Docker network, e.g. from the host when ports are published:\nfor port in 8081 8082 8083 8084 8085 8086 8087; do\n  echo "Checking :$port..."\n  curl -sf "http://localhost:$port/healthz" && echo " OK" || echo " FAIL"\ndone',
        type: 'code',
        language: 'Bash',
      },
      {
        heading: 'Full checklist',
        content: '',
        type: 'steps',
        items: [
          'All tests pass: go test ./... for each service (zero failures)',
          'No lint errors: go vet ./... for each service',
          'Documentation updated: service docs, API docs, and architecture diagrams reflect current state',
          'Database migrations are safe: no data loss, backward compatible with the previous version',
          'Environment variables are documented and configured for the target environment',
          'Docker images build successfully with no warnings',
          'Health check endpoints (/healthz and /readyz) respond correctly on all services',
          'Monitoring and alerting configured: Prometheus scrape targets, Grafana dashboards, alert rules for error rates and latency',
          'Rollback plan documented: know how to revert to the previous version if deployment fails',
        ],
      },
    ],
  },

  // ── Frontend ─────────────────────────
  {
    slug: 'frontend-overview',
    title: 'Frontend Overview',
    description: 'Architecture, directory structure, and conventions for the React frontend.',
    category: 'frontend',
    sections: [
      {
        heading: 'Directory structure',
        content: 'fyredocs_frontend/src/\n  App.tsx                  # Root component: providers, routing, layout\n  auth/\n    authContext.tsx         # AuthProvider with login/logout/refresh state\n    authClient.ts          # API calls: login, signup, logout, refreshSession, getMe\n    authGuard.tsx           # ProtectedRoute, PublicOnlyRoute, RoleRoute components\n    useAuth.ts             # useContext(AuthContext) convenience hook\n  components/\n    common/                # PageSkeleton, ErrorBoundary, shared UI\n    tools/                 # Per-tool option components (SplitOptions, CompressOptions, etc.)\n    ui/                    # shadcn/ui primitives (Button, Dialog, Toaster, etc.)\n  config/\n    tools.ts               # TOOLS registry: every tool\'s constraints and metadata\n    toolCategories.ts      # Navigation grouping for the tools mega-menu\n    docs.ts                # User-facing feature documentation entries\n    developerDocs.ts       # This file — super-admin developer documentation\n  hooks/\n    useFileUpload.ts       # Chunked upload with pause/resume/retry\n    useJob.ts              # Single job creation, SSE, polling\n    useBatchJob.ts         # Batch processing (one job per file)\n  lib/\n    apiClient.ts           # fetch wrapper with auth, refresh, error parsing\n    toolApi.ts             # TOOL_API_CONFIG mapping + path builders\n    guestToken.ts          # Guest token helpers (now no-ops; cookie-based)\n  pages/\n    MergePage.tsx          # One page per tool, lazy-loaded\n    docs/                  # DocsIndexPage, DocsPage, DevDocsIndexPage, DevDocsPage\n    auth/                  # SignIn, SignUp\n    admin/                 # AdminDashboard, BusinessPage, GrowthPage, etc.\n  types/\n    index.ts               # Shared TypeScript types (ToolId, Job, FileUpload, etc.)',
        type: 'code',
        language: 'Directory',
      },
      {
        heading: 'Tech stack',
        content: '',
        type: 'table',
        tableData: {
          headers: ['Layer', 'Technology'],
          rows: [
            ['Framework', 'React 18 with TypeScript'],
            ['Build tool', 'Vite'],
            ['Styling', 'Tailwind CSS + shadcn/ui component library'],
            ['Routing', 'React Router v6 (BrowserRouter)'],
            ['Server state', 'TanStack Query (QueryClient)'],
            ['Auth state', 'React Context (AuthProvider)'],
            ['Animations', 'Framer Motion (AnimatePresence for route transitions)'],
            ['SEO', 'react-helmet-async (HelmetProvider)'],
            ['Theming', 'next-themes (ThemeProvider with system/light/dark)'],
            ['Notifications', 'Toaster (shadcn) + Sonner for toast messages'],
          ],
        },
      },
      {
        heading: 'Routing and lazy loading',
        content: 'Every page is loaded via lazyWithReload() (src/lib/lazyWithReload.ts, a React.lazy wrapper) and wrapped in a Suspense boundary that shows a PageSkeleton while the chunk loads. This keeps the initial bundle small — only the landing page code is loaded on first visit. Each deploy deletes the previous build\'s hashed chunks, so a tab opened before a deploy would fail on its next route; lazyWithReload reloads the page once (guarded by a sessionStorage flag) to pick up the new index.html, and rethrows to the ErrorBoundary if the chunk is still missing. Route transitions use Framer Motion AnimatePresence with a 200ms fade. The AnimatedRoutes component wraps all Routes in a motion.div keyed by location.pathname.',
        type: 'paragraph',
      },
      {
        heading: 'Route example from App.tsx',
        content: 'const MergePage = lazyWithReload(() => import("./pages/MergePage"));\nconst SplitPage = lazyWithReload(() => import("./pages/SplitPage"));\n// ... all pages are lazy-loaded\n\n<Suspense fallback={<PageSkeleton />}>\n  <AnimatedRoutes />\n</Suspense>',
        type: 'code',
        language: 'TypeScript',
      },
      {
        heading: 'Provider hierarchy',
        content: '',
        type: 'steps',
        items: [
          'HelmetProvider — wraps entire app for SEO meta tag management',
          'ThemeProvider (next-themes) — system/light/dark theme with class attribute strategy',
          'QueryClientProvider — TanStack Query client for server state caching',
          'TooltipProvider + Toaster + Sonner — UI feedback primitives',
          'BrowserRouter — React Router v6 history-based routing',
          'AuthProvider — manages user, isAuthenticated, isLoading, role, plan state',
          'ErrorBoundary — catches render errors and shows a fallback UI',
          'Suspense — shows PageSkeleton while lazy chunks load',
        ],
      },
      {
        heading: 'Route guards',
        content: '',
        type: 'table',
        tableData: {
          headers: ['Guard', 'Behavior', 'Used For'],
          rows: [
            ['ProtectedRoute', 'Waits for auth loading to finish, then renders children. Does NOT require authentication — all tool pages are freely accessible. Backend handles guest requests with auto-issued guest tokens.', 'All tool pages (/merge, /split, /compress, etc.)'],
            ['PublicOnlyRoute', 'If user is already authenticated, redirects to "/" (home). Otherwise renders children. Prevents logged-in users from seeing login/signup pages.', 'Auth pages (/signin, /signup)'],
            ['RoleRoute', 'Requires authentication AND a specific role. If not authenticated, redirects to /signin with location state (for return-to). If authenticated but wrong role, redirects to /. Takes allowedRoles: string[] prop.', 'Admin pages (/dev-docs, /admin/*) — restricted to super-admin role'],
          ],
        },
      },
      {
        heading: 'State management strategy',
        content: 'The frontend does not use a global state library like Redux or Zustand. Instead, state is managed at three levels: (1) AuthContext for authentication state (user, role, plan, tokens), (2) TanStack Query for server-fetched data with automatic caching and refetching, and (3) local component state (useState/useReducer) for tool-specific UI like file lists, options, and job progress. The useFileUpload and useJob hooks encapsulate complex stateful logic and expose clean interfaces to tool page components.',
        type: 'paragraph',
      },
    ],
  },
  {
    slug: 'frontend-auth',
    title: 'Authentication Flow',
    description: 'How auth state is managed in the React frontend via AuthContext.',
    category: 'frontend',
    sections: [
      {
        heading: 'AuthContext state',
        content: '',
        type: 'table',
        tableData: {
          headers: ['Field', 'Type', 'Description'],
          rows: [
            ['user', 'AuthUser | null', 'Current user object (id, email, name, role, planName) or null if not authenticated'],
            ['isAuthenticated', 'boolean', 'True when a valid session exists'],
            ['isLoading', 'boolean', 'True during initial session hydration and logout'],
            ['role', 'string | null', 'User role extracted from user object (user, admin, super-admin)'],
            ['plan', 'string', 'User plan: "guest" (no auth), "free" (default on login), or "pro"'],
          ],
        },
      },
      {
        heading: 'Login flow',
        content: '',
        type: 'steps',
        items: [
          'User submits email/password on the SignIn page',
          'handleLogin() calls the login() API function which POSTs to /auth/login with credentials: "include"',
          'Server returns user object + sets access_token as an HttpOnly cookie',
          'hydrateAuth() sets user, role, plan state and schedules token refresh',
          'The response includes accessExpiresAt timestamp used to schedule proactive refresh',
        ],
      },
      {
        heading: 'Token refresh mechanism',
        content: 'The AuthProvider schedules a token refresh 2 minutes before the access token expires. Since the access_token cookie is HttpOnly (not readable by JavaScript), the server provides an accessExpiresAt timestamp in login/signup/refresh responses. A setTimeout is set for (expiresAt - 2 minutes - now) milliseconds. When fired, it calls refreshSession() which POSTs to /auth/refresh. If successful, state is updated and a new refresh timer is scheduled. The timer reference is stored in a useRef to allow cleanup.',
        type: 'paragraph',
      },
      {
        heading: 'Refresh scheduling code pattern',
        content: 'const scheduleTokenRefresh = useCallback((expiresAtMs?: number | null) => {\n  clearRefreshTimer();\n  const expiryMs = expiresAtMs ?? accessExpiresAtRef.current;\n  if (!expiryMs) return;\n\n  const refreshAt = expiryMs - 2 * 60 * 1000; // 2 minutes before expiry\n  const delay = refreshAt - Date.now();\n  if (delay <= 0) return;\n\n  refreshTimerRef.current = setTimeout(async () => {\n    const result = await refreshSession();\n    if (result) {\n      hydrateAuth(result.user, result.accessExpiresAt);\n    }\n  }, delay);\n}, [clearRefreshTimer]);',
        type: 'code',
        language: 'TypeScript',
      },
      {
        heading: '401 handling',
        content: 'When apiClient receives a 401 response, it dispatches a custom DOM event: window.dispatchEvent(new CustomEvent("fyredocs:unauthorized")). The AuthProvider listens for this event and responds by calling clearAuth() (resets user/role/plan/isAuthenticated to defaults) and navigating to /signin with replace: true. This pattern decouples the HTTP layer from React state — the API client does not need to import React hooks.',
        type: 'paragraph',
      },
      {
        heading: 'Visibility change handling',
        content: 'When the browser tab becomes visible again (visibilitychange event), the AuthProvider checks if the token is expired or close to expiring. If the token expires within 1 minute, it triggers an immediate refresh. If still valid, it reschedules the refresh timer (which may have drifted while the tab was backgrounded). If no expiry is known, it calls syncUser() to re-check the session from scratch.',
        type: 'paragraph',
      },
      {
        heading: 'Guest token flow',
        content: 'Guest tokens are now handled entirely via HttpOnly cookies set by the backend. The frontend guestToken.ts module exports getGuestToken() and setGuestToken() as no-ops for backward compatibility. When the API Gateway receives a request with no auth credentials, it auto-issues a guest token cookie. The useJob hook stores the guest token from job creation responses via setGuestToken() (which is a no-op since the cookie is already set by the server).',
        type: 'paragraph',
      },
      {
        heading: 'Logout flow',
        content: '',
        type: 'steps',
        items: [
          'handleLogout() sets isLoading = true',
          'Calls logout() API function which POSTs to /auth/logout (server clears cookies and denylists the JWT)',
          'In the finally block, clearAuth() resets all state: user = null, role = null, plan = "guest", isAuthenticated = false',
          'clearRefreshTimer() cancels any pending refresh setTimeout',
          'isLoading is set back to false',
        ],
      },
    ],
  },
  {
    slug: 'frontend-uploads',
    title: 'File Upload System',
    description: 'Chunked file upload with pause, resume, retry, and progress tracking.',
    category: 'frontend',
    sections: [
      {
        heading: 'Overview',
        content: 'The useFileUpload hook manages the complete file upload lifecycle. An upload is initialized via POST /api/upload/init (through the gateway), then file parts are PUT directly to presigned MinIO URLs (/uploads/*?X-Amz-...) routed at the Caddy edge — the raw bytes never pass through the API Gateway — with up to 3 parallel part uploads. The hook handles validation, progress tracking, pause/resume, retry, and cleanup.',
        type: 'paragraph',
      },
      {
        heading: 'Configuration constants',
        content: '',
        type: 'table',
        tableData: {
          headers: ['Constant', 'Value', 'Purpose'],
          rows: [
            ['CHUNK_SIZE', '1,048,576 bytes (1 MB)', 'Size of each upload chunk'],
            ['MAX_PARALLEL_CHUNKS', '3', 'Maximum concurrent chunk uploads per file'],
          ],
        },
      },
      {
        heading: 'Upload state machine',
        content: '',
        type: 'table',
        tableData: {
          headers: ['State', 'Description', 'Transitions To'],
          rows: [
            ['idle', 'File added, not yet uploading. Auto-transitions to uploading via useEffect.', 'uploading'],
            ['uploading', 'Chunks being sent to server. Progress updates in real time.', 'completed, failed, paused'],
            ['paused', 'Upload aborted via AbortController. Chunk progress is preserved.', 'uploading (resume)'],
            ['completed', 'All chunks uploaded and /complete called. serverFileId is set.', '(terminal)'],
            ['failed', 'Upload error occurred. Error message stored on file object.', 'idle (retry)'],
          ],
        },
      },
      {
        heading: 'Upload protocol (3-phase)',
        content: '',
        type: 'steps',
        items: [
          'INIT: POST /api/upload/init with fileName, fileSize, totalChunks. Returns uploadId. Stored as serverFileId on the file object.',
          'CHUNKS: For each pending chunk, PUT /api/upload/{uploadId}/chunk?index={i} with the chunk blob as multipart/form-data. Up to 3 chunks upload concurrently using a worker pool pattern.',
          'COMPLETE: POST /api/upload/{uploadId}/complete. Server assembles chunks atomically. File state transitions to "completed".',
        ],
      },
      {
        heading: 'Concurrency model',
        content: 'Chunks are uploaded with limited concurrency using a worker pool pattern. An array of Math.min(MAX_PARALLEL_CHUNKS, pendingChunks.length) async workers is created. Each worker calls executeNext() which picks the next pending chunk from a shared index counter, uploads it, then recurses. Promise.all() waits for all workers to finish. This ensures at most 3 concurrent uploads without needing a semaphore library.',
        type: 'paragraph',
      },
      {
        heading: 'Pause and resume',
        content: 'Pausing calls AbortController.abort() on the active upload, which causes fetch to throw an AbortError. The catch handler detects AbortError and sets state to "paused" instead of "failed". Chunk upload progress is preserved — already-uploaded chunks are marked in the chunks array. Resuming calls startUpload() which checks the server for already-received chunks via GET /api/upload/{uploadId}/status, syncs the local chunk state, then resumes uploading only the pending chunks.',
        type: 'paragraph',
      },
      {
        heading: 'Validation',
        content: 'Before adding files, validateFiles() checks: (1) the plan and tool limits via checkSelection() in src/lib/uploadLimits.ts — file count ≤ min(plan maxFilesPerJob, tool.maxFiles), each file ≤ min(plan maxFileSizeMb, plan maxJobInputMb, tool.maxFileSize if set), and the total of existing + new files ≤ plan maxJobInputMb, (2) each file type matches tool.acceptedFileTypes (checks both extension and MIME type), (3) no duplicate files (same name + size). Validation errors are returned as an array of {field, message, code} objects with codes: MAX_FILES_EXCEEDED, FILE_TOO_LARGE, JOB_TOO_LARGE, INVALID_FILE_TYPE, DUPLICATE_FILE.',
        type: 'paragraph',
      },
      {
        heading: 'canProceed condition',
        content: 'The hook exposes a canProceed boolean that is true only when: files.length >= tool.minFiles AND files.length <= tool.maxFiles AND every file has state === "completed" AND every file has a truthy serverFileId. This gates the "Process" button in tool pages.',
        type: 'paragraph',
      },
      {
        heading: 'Usage pattern',
        content: 'const { files, addFiles, removeFile, clearFiles, canProceed, isUploading } =\n  useFileUpload({\n    tool: TOOLS[\'merge\'],\n    onValidationError: (errors) => toast.error(errors[0]),\n  });\n\n// Add files from a drop zone or file picker\nconst result = addFiles(droppedFiles);\nif (!result.isValid) {\n  // errors already dispatched to onValidationError\n}\n\n// Files auto-upload on add (useEffect triggers startUpload for idle files)\n// When canProceed === true, all files are uploaded and ready for processing',
        type: 'code',
        language: 'TypeScript',
      },
    ],
  },
  {
    slug: 'frontend-jobs',
    title: 'Job Tracking',
    description: 'How the frontend creates, monitors, and downloads processing jobs.',
    category: 'frontend',
    sections: [
      {
        heading: 'Overview',
        content: 'Two hooks handle job tracking: useJob for single-file operations and useBatchJob for multi-file batch processing. Both support SSE (Server-Sent Events) for real-time progress with automatic fallback to polling if SSE fails.',
        type: 'paragraph',
      },
      {
        heading: 'useJob configuration',
        content: '',
        type: 'table',
        tableData: {
          headers: ['Option', 'Default', 'Description'],
          rows: [
            ['pollingInterval', '2000 ms', 'Interval between status polls when SSE is unavailable'],
            ['maxPollingAttempts', '300', 'Maximum consecutive polling failures before giving up (= 10 min at 2s)'],
            ['onComplete', 'undefined', 'Callback fired when job reaches "completed" state'],
            ['onError', 'undefined', 'Callback fired when job fails or polling is exhausted'],
          ],
        },
      },
      {
        heading: 'Job creation flow',
        content: '',
        type: 'steps',
        items: [
          'createJob(toolId, fileIds, options) is called with uploaded file IDs and tool-specific options',
          'normalizeOptions() validates and transforms options per tool type (e.g., split mode/range, compress quality, OCR language)',
          'A pending Job object is set immediately for UI feedback',
          'POST request sent to the tool-specific endpoint (built by buildJobPath from toolApi.ts) with uploadId/uploadIds and normalized options',
          'If the response includes a guestToken, it is saved via setGuestToken() (no-op, cookie-based)',
          'The API response is mapped to a Job object via mapApiJob() which normalizes field casing (handles both camelCase and PascalCase from backend)',
          'SSE connection is opened via startSSE() to /api/jobs/{jobId}/events for real-time updates',
        ],
      },
      {
        heading: 'SSE strategy',
        content: 'The hook creates an EventSource to /api/jobs/{jobId}/events with withCredentials: true. It listens for "job-update" events containing {jobId, status, progress, toolType, fileSize}. Status values from SSE (JobCompleted, JobFailed, JobQueued) are mapped to internal states. On completion, a final GET request fetches the full job data (file size, name) since SSE only provides partial data. On SSE error, the connection is closed and the hook falls back to polling automatically. A "done" event from the server signals the stream is closed — the handler closes the EventSource to prevent reconnection.',
        type: 'paragraph',
      },
      {
        heading: 'Polling fallback',
        content: 'When SSE fails (onerror fires), the hook falls back to polling GET requests via startPolling(). Each poll calls apiRequest(buildJobPath(toolId, jobId)) and maps the response. The poll loop uses setTimeout (not setInterval) so each poll waits for the previous one to complete. On network errors, attemptsRef increments — after maxPollingAttempts consecutive failures, the job is marked as failed with POLLING_FAILED.',
        type: 'paragraph',
      },
      {
        heading: 'Monotonic progress',
        content: 'Both polling and SSE handlers enforce monotonic progress — the displayed percentage never decreases. A maxProgressRef tracks the highest seen percentage. If a new update has a lower percentage (possible due to backend recalculation), the previous maximum is used instead. This is reset on job failure or new job creation.',
        type: 'paragraph',
      },
      {
        heading: 'useBatchJob',
        content: 'The useBatchJob hook processes multiple files independently, each as a separate job. It creates a BatchJob[] array where each entry tracks: id, fileName, fileId, job (Job | null), status, and error. All files start processing simultaneously — each gets its own POST request and SSE connection. The hook tracks completedCount, failedCount, totalCount, and overallProgress (average percentage across all batch jobs). onAllComplete fires when every batch job reaches a terminal state.',
        type: 'paragraph',
      },
      {
        heading: 'BatchJob interface',
        content: 'interface BatchJob {\n  id: string;           // batch-{fileId}-{timestamp}\n  fileName: string;     // original file name\n  fileId: string;       // serverFileId from upload\n  job: Job | null;      // null until POST response\n  status: \'pending\' | \'processing\' | \'completed\' | \'failed\';\n  error?: string;\n}',
        type: 'code',
        language: 'TypeScript',
      },
      {
        heading: 'Download mechanism',
        content: 'On job completion, the Job object includes a result with downloadUrl, fileName, fileSize, and expiresAt. The downloadUrl is constructed as buildApiUrl(buildDownloadPath(toolId, jobId)) which resolves to /api/{service}/{tool}/{jobId}/download. The frontend typically opens this URL in a new tab or triggers a programmatic download. Download links expire based on the user plan (2h guest, 24h free, 7d pro).',
        type: 'paragraph',
      },
    ],
  },
  {
    slug: 'frontend-api-client',
    title: 'API Client Patterns',
    description: 'How the frontend communicates with the backend via apiClient.ts.',
    category: 'frontend',
    sections: [
      {
        heading: 'Overview',
        content: 'The apiClient module (src/lib/apiClient.ts) provides two main functions: apiRequest<T>() for general API calls and apiJson<T>() for JSON-body requests. Both handle authentication cookies, automatic token refresh on 401, and structured error parsing.',
        type: 'paragraph',
      },
      {
        heading: 'buildApiUrl(path)',
        content: 'Constructs a full API URL from a relative path. Reads VITE_API_BASE_URL from environment (import.meta.env). If the env var is empty or unset, it uses the current origin (empty string prefix, so paths are relative). If the path already starts with http:// or https://, it is returned as-is. This allows the frontend to work with both same-origin and cross-origin API servers.',
        type: 'paragraph',
      },
      {
        heading: 'buildApiUrl implementation',
        content: 'export const buildApiUrl = (path: string) => {\n  if (path.startsWith(\'http://\') || path.startsWith(\'https://\')) {\n    return path;\n  }\n  const normalizedPath = path.startsWith(\'/\') ? path : `/${path}`;\n  return `${normalizeBaseUrl(getBaseUrl())}${normalizedPath}`;\n};',
        type: 'code',
        language: 'TypeScript',
      },
      {
        heading: 'apiRequest<T>(path, options)',
        content: 'The core fetch wrapper. Always sends credentials: "include" so HttpOnly cookies (access_token, guest_token) are included. Handles response parsing based on Content-Type: JSON responses are parsed, 204s return undefined, text responses return as string.',
        type: 'paragraph',
      },
      {
        heading: 'Error response parsing',
        content: 'The parseError function (which also keeps error.code on ApiHttpError) handles three backend error formats: (1) { error: { details: "..." } } — uses error.details, (2) { error: { message: "..." } } or { error: "string" } — uses the error message/string, (3) { message: "..." } — uses the top-level message. For non-JSON responses, the raw text body is used. Fallback is the HTTP statusText.',
        type: 'paragraph',
      },
      {
        heading: '401 token refresh with shared lock',
        content: 'When a 401 is received (and skipRefresh is not set), the client attempts a token refresh. A module-level refreshPromise variable acts as a lock — if a refresh is already in-flight, subsequent 401 handlers await the same promise instead of making parallel refresh calls. The refresh POSTs to /auth/refresh with credentials: "include". If successful, the original request is retried with skipRefresh: true to prevent infinite loops. If refresh fails, a custom "fyredocs:unauthorized" event is dispatched to trigger logout.',
        type: 'paragraph',
      },
      {
        heading: 'Refresh lock pattern',
        content: '// Shared refresh lock — prevents multiple concurrent refresh calls\nlet refreshPromise: Promise<boolean> | null = null;\n\n// Inside apiRequest, on 401:\nif (!refreshPromise) {\n  refreshPromise = attemptRefresh().finally(() => { refreshPromise = null; });\n}\nconst refreshed = await refreshPromise;\nif (refreshed) {\n  return apiRequest<T>(path, { ...options, skipRefresh: true });\n}\n// If refresh failed:\nwindow.dispatchEvent(new CustomEvent(\'fyredocs:unauthorized\'));',
        type: 'code',
        language: 'TypeScript',
      },
      {
        heading: 'apiJson<T>(path, options)',
        content: 'A convenience wrapper around apiRequest that auto-sets the Content-Type: application/json header if not already present. Used for all POST/PUT requests that send JSON bodies. Merges caller-provided headers with the default Content-Type using a mergeHeaders utility.',
        type: 'paragraph',
      },
      {
        heading: '403 handling',
        content: 'A 403 Forbidden response (distinct from 401) also triggers the "fyredocs:unauthorized" event, which navigates the user to /signin. This handles cases where the user is authenticated but their permissions have been revoked server-side.',
        type: 'paragraph',
      },
    ],
  },
  {
    slug: 'frontend-activity',
    title: 'Activity Tracking SDK',
    description: 'The buffered client event SDK behind the user activity audit trail.',
    category: 'frontend',
    sections: [
      {
        heading: 'Overview',
        content: 'src/lib/activity.ts is a buffered, batched, fire-and-forget event SDK. track() queues an event; batches flush to POST /api/activity/events every 10 seconds, at 20 buffered events, or when the tab is hidden (via navigator.sendBeacon, the only transport that survives page teardown). Every entry point swallows its own errors — a tracking outage must never break a tool run.',
        type: 'paragraph',
      },
      {
        heading: 'Idempotency and identity',
        content: 'Every event carries a client-minted UUID (clientEventId); the server dedupes on it, so re-sending after an ambiguous network failure is safe. No user identity is attached client-side — the server derives it from the auth cookie, and anonymous visitors become guest rows. The per-tab session id lives in sessionStorage under fyredocs.activity.sessionId.',
        type: 'paragraph',
      },
      {
        heading: 'Event catalog',
        content: 'Event names are lowercase domain.action strings defined in src/lib/activityEvents.ts and validated server-side against a domain allowlist (analytics-service/internal/activity/catalog.go). A new event must stay inside an approved domain (auth, job, upload, share, settings, ...) or ingest rejects it.',
        type: 'paragraph',
      },
      {
        heading: 'Instrumented call sites',
        content: '',
        type: 'table',
        tableData: {
          headers: ['Site', 'Events'],
          rows: [
            ['useJob (all single-job tools)', 'job.started on create; job.completed / job.failed / job.cancelled on the terminal transition (SSE or polling, deduped by a per-job ref)'],
            ['useBatchJob (batch tools)', 'Same job.* events per server job, with metadata.batch = true'],
            ['authContext', 'auth.login, auth.signup (success and failed), auth.logout (flushed before the session cookie dies)'],
          ],
        },
      },
      {
        heading: 'Privacy rule',
        content: 'Metadata is whitelist-built at the call site: sizes, counts, durations, ids. Never filenames, document contents, or anything user-typed. The server additionally strips keys matching password/token/secret/content/text/prompt as defense in depth.',
        type: 'warning',
      },
      {
        heading: 'User-facing surface',
        content: 'The /activity route (src/pages/ActivityPage.tsx, behind RequireAuthRoute) renders GET /api/activity/me grouped by day with category filters. Guests are redirected to /signin — their events exist server-side but carry no user id.',
        type: 'paragraph',
      },
    ],
  },
  {
    slug: 'frontend-tools-config',
    title: 'Tool Configuration',
    description: 'How tools are defined, registered, and routed in the frontend.',
    category: 'frontend',
    sections: [
      {
        heading: 'ToolDefinition interface',
        content: '',
        type: 'table',
        tableData: {
          headers: ['Field', 'Type', 'Description'],
          rows: [
            ['id', 'ToolId', 'Unique identifier matching the backend tool type (e.g., "merge", "pdf-to-word")'],
            ['name', 'string', 'Human-readable display name (e.g., "Merge PDF")'],
            ['description', 'string', 'Short description shown in UI cards and tooltips'],
            ['category', 'ToolCategory', 'Category key: merge, split, compress, convert, organize, security, ocr, watermark, edit'],
            ['icon', 'string', 'Lucide icon name (e.g., "layers", "scissors")'],
            ['acceptedFileTypes', 'string[]', 'Array of MIME types and/or file extensions (e.g., [".pdf", "application/pdf"])'],
            ['maxFiles', 'number', 'Maximum number of files allowed (e.g., 20 for merge, 1 for split)'],
            ['minFiles', 'number', 'Minimum number of files required (e.g., 2 for merge, 1 for most tools)'],
            ['maxFileSize', 'number (optional)', 'Tool-specific per-file cap in bytes on top of the plan limit (e.g., 20 * MB for image tools). Omit for no tool cap.'],
            ['route', 'string', 'Frontend route path (e.g., "/merge", "/pdf-to-word")'],
          ],
        },
      },
      {
        heading: 'TOOLS registry',
        content: 'The TOOLS object in src/config/tools.ts is a Record<ToolId, ToolDefinition> containing every tool. Tools are grouped by comments: Organize PDF Tools, Optimize PDF Tools, Convert From PDF Tools, Convert To PDF Tools, Security Tools, Edit PDF Tools, and Legacy Tools. Helper functions are provided: getToolsByCategory(category), getAllTools(), and getToolById(id).',
        type: 'paragraph',
      },
      {
        heading: 'Example tool definition',
        content: 'merge: {\n  id: \'merge\',\n  name: \'Merge PDF\',\n  description: \'Combine multiple PDF files into one document\',\n  category: \'merge\',\n  icon: \'layers\',\n  acceptedFileTypes: [\'.pdf\', \'application/pdf\'],\n  maxFiles: 20,\n  minFiles: 2,\n  route: \'/merge\',\n},',
        type: 'code',
        language: 'TypeScript',
      },
      {
        heading: 'TOOL_API_CONFIG',
        content: 'The TOOL_API_CONFIG in src/lib/toolApi.ts maps each ToolId to a { basePath, tool } pair. The basePath is the API service prefix (e.g., "/api/organize-pdf") and tool is the backend tool name (e.g., "merge-pdf"). The buildJobPath(toolId, jobId?) function combines these to produce API paths like /api/organize-pdf/merge-pdf or /api/organize-pdf/merge-pdf/{jobId}. buildDownloadPath(toolId, jobId) appends /download.',
        type: 'paragraph',
      },
      {
        heading: 'API config examples',
        content: 'const TOOL_API_CONFIG: Record<ToolId, ToolApiConfig> = {\n  merge:         { basePath: \'/api/organize-pdf\', tool: \'merge-pdf\' },\n  split:         { basePath: \'/api/organize-pdf\', tool: \'split-pdf\' },\n  compress:      { basePath: \'/api/optimize-pdf\', tool: \'compress-pdf\' },\n  \'pdf-to-word\': { basePath: \'/api/convert-from-pdf\', tool: \'pdf-to-word\' },\n  \'word-to-pdf\': { basePath: \'/api/convert-to-pdf\', tool: \'word-to-pdf\' },\n  // ... all 30+ tools mapped\n};\n\n// Path builders\nbuildJobPath(\'merge\')           // => "/api/organize-pdf/merge-pdf"\nbuildJobPath(\'merge\', \'job123\') // => "/api/organize-pdf/merge-pdf/job123"\nbuildDownloadPath(\'merge\', \'job123\') // => "/api/organize-pdf/merge-pdf/job123/download"',
        type: 'code',
        language: 'TypeScript',
      },
      {
        heading: 'toolCategories.ts',
        content: 'The toolCategories.ts file defines the navigation structure for the tools mega-menu. It exports a toolCategories array of { title, color, tools: ToolItem[] } groups. Each ToolItem has name, href, icon, and optional comingSoon flag. It also exports convenience arrays convertToPdf and convertFromPdf for use in conversion-specific navigation. This is separate from the TOOLS registry because navigation grouping differs from the functional category used for tool logic.',
        type: 'paragraph',
      },
      {
        heading: 'Tool lookup patterns',
        content: '// Look up a tool by ID\nimport { getToolById } from \'@/config/tools\';\nconst tool = getToolById(\'merge\'); // ToolDefinition | undefined\n\n// Get all tools in a category\nimport { getToolsByCategory } from \'@/config/tools\';\nconst convertTools = getToolsByCategory(\'convert\'); // ToolDefinition[]\n\n// Get API path for a tool\nimport { buildJobPath } from \'@/lib/toolApi\';\nconst path = buildJobPath(\'merge\'); // "/api/organize-pdf/merge-pdf"',
        type: 'code',
        language: 'TypeScript',
      },
    ],
  },

  // ── How-To Guides ────────────────────
  {
    slug: 'howto-add-tool',
    title: 'Adding a New Tool',
    description: 'Step-by-step guide to adding a new PDF processing tool end-to-end.',
    category: 'howto',
    sections: [
      {
        heading: 'Overview',
        content: 'Adding a new tool requires changes in both the backend (routing, handler, validation) and the frontend (config, API mapping, page, route). This guide walks through every file you need to touch.',
        type: 'paragraph',
      },
      {
        heading: 'Step 1: Backend — Add to ToolServiceMap',
        content: 'In fyredocs_backend/job-service/internal/routing/routing.go, add the new tool to ToolServiceMap. The key is the tool type string, the value is the target service name. This determines which NATS subject the job is published to.',
        type: 'paragraph',
      },
      {
        heading: 'ToolServiceMap example',
        content: '// In job-service/internal/routing/routing.go\nvar ToolServiceMap = map[string]string{\n    // ... existing entries ...\n\n    // Add your new tool:\n    "flatten-pdf": "organize-pdf",\n    // This means jobs with toolType "flatten-pdf" will be published to\n    // the NATS subject "jobs.organize-pdf.flatten-pdf"\n}',
        type: 'code',
        language: 'Go',
      },
      {
        heading: 'Step 2: Backend — Create handler in target service',
        content: 'In the target service (e.g., organize-pdf/internal/organizer/), create a new Go file for the processing logic. Implement a function that takes the input file path, output directory, and options, then performs the conversion. Register it in the router.go file that maps tool types to handler functions.',
        type: 'paragraph',
      },
      {
        heading: 'Handler boilerplate',
        content: '// organize-pdf/internal/organizer/flatten.go\npackage organizer\n\nimport (\n    "context"\n    "fmt"\n    "os/exec"\n)\n\nfunc FlattenPDF(ctx context.Context, inputPath, outputDir string, options map[string]interface{}) (string, error) {\n    outputPath := filepath.Join(outputDir, "flattened.pdf")\n\n    // Use pdfcpu or another tool\n    cmd := exec.CommandContext(ctx, "pdfcpu", "flatten", inputPath, outputPath)\n    if err := cmd.Run(); err != nil {\n        return "", fmt.Errorf("flatten failed: %w", err)\n    }\n\n    return outputPath, nil\n}\n\n// In router.go, add to the switch:\n// case "flatten-pdf":\n//     return FlattenPDF(ctx, inputPath, outputDir, options)',
        type: 'code',
        language: 'Go',
      },
      {
        heading: 'Step 3: Backend — Add MIME validation',
        content: 'In the target service or job-service, add the accepted MIME types for the new tool to the validation logic. This ensures only valid file types are accepted before processing begins.',
        type: 'paragraph',
      },
      {
        heading: 'Step 4: Backend — Add tests',
        content: 'Create a test file (e.g., flatten_test.go) with table-driven tests covering: successful conversion, invalid input file, timeout, and unsupported options. Run go test ./... to verify.',
        type: 'paragraph',
      },
      {
        heading: 'Step 5: Frontend — Add to TOOLS registry',
        content: 'In fyredocs_frontend/src/config/tools.ts, add a new entry to the TOOLS object.',
        type: 'paragraph',
      },
      {
        heading: 'TOOLS entry example',
        content: '// In src/config/tools.ts\n\'flatten-pdf\': {\n  id: \'flatten-pdf\',\n  name: \'Flatten PDF\',\n  description: \'Flatten form fields and annotations into the page content\',\n  category: \'organize\',\n  icon: \'file-down\',\n  acceptedFileTypes: [\'.pdf\', \'application/pdf\'],\n  maxFiles: 10,\n  minFiles: 1,\n  route: \'/flatten-pdf\',\n},',
        type: 'code',
        language: 'TypeScript',
      },
      {
        heading: 'Step 6: Frontend — Add to TOOL_API_CONFIG',
        content: 'In fyredocs_frontend/src/lib/toolApi.ts, add the mapping from the ToolId to its API path.',
        type: 'paragraph',
      },
      {
        heading: 'TOOL_API_CONFIG entry',
        content: '// In src/lib/toolApi.ts\n\'flatten-pdf\': { basePath: \'/api/organize-pdf\', tool: \'flatten-pdf\' },',
        type: 'code',
        language: 'TypeScript',
      },
      {
        heading: 'Step 7: Frontend — Add to toolCategories.ts',
        content: 'In fyredocs_frontend/src/config/toolCategories.ts, add the tool to the appropriate category group for the navigation mega-menu.',
        type: 'paragraph',
      },
      {
        heading: 'toolCategories entry',
        content: '// In src/config/toolCategories.ts, inside the ORGANIZE PDF group:\n{ name: \'Flatten PDF\', href: \'/flatten-pdf\', icon: \'file-down\' },',
        type: 'code',
        language: 'TypeScript',
      },
      {
        heading: 'Step 8: Frontend — Create tool page',
        content: 'Create a new page component in fyredocs_frontend/src/pages/. Most tool pages follow the same pattern: use useFileUpload for uploads, useJob or useBatchJob for processing, and render a ToolLayout with the file drop zone and options panel.',
        type: 'paragraph',
      },
      {
        heading: 'Page component skeleton',
        content: '// src/pages/FlattenPdfPage.tsx\nimport { TOOLS } from \'@/config/tools\';\nimport { useFileUpload } from \'@/hooks/useFileUpload\';\nimport { useJob } from \'@/hooks/useJob\';\n\nconst FlattenPdfPage = () => {\n  const tool = TOOLS[\'flatten-pdf\'];\n  const upload = useFileUpload({ tool });\n  const { job, createJob, resetJob } = useJob();\n\n  const handleProcess = () => {\n    const fileIds = upload.files\n      .filter(f => f.serverFileId)\n      .map(f => f.serverFileId!);\n    createJob(\'flatten-pdf\', fileIds, {});\n  };\n\n  return (\n    // ToolLayout with file drop zone, options, process button, job progress\n  );\n};\n\nexport default FlattenPdfPage;',
        type: 'code',
        language: 'TypeScript',
      },
      {
        heading: 'Step 9: Frontend — Add route to App.tsx',
        content: 'In fyredocs_frontend/src/App.tsx, add a lazy import and a Route inside the ProtectedRoute group.',
        type: 'paragraph',
      },
      {
        heading: 'App.tsx route addition',
        content: '// At the top with other lazy imports:\nconst FlattenPdfPage = lazy(() => import("./pages/FlattenPdfPage"));\n\n// Inside <Route element={<ProtectedRoute />}>:\n<Route path="/flatten-pdf" element={<FlattenPdfPage />} />',
        type: 'code',
        language: 'TypeScript',
      },
      {
        heading: 'Step 10: Update ToolId type',
        content: 'If the ToolId union type in src/types/index.ts does not already include your new tool ID, add it. This is a string literal union that ensures type safety across the TOOLS registry, TOOL_API_CONFIG, and hook usage.',
        type: 'paragraph',
      },
      {
        heading: 'Step 11: Add feature documentation',
        content: 'Add an entry to src/config/docs.ts so the tool appears on the public /docs page. Include description, supported formats, file size limits, and processing notes.',
        type: 'paragraph',
      },
      {
        heading: 'Checklist summary',
        content: '',
        type: 'steps',
        items: [
          'Backend: Add tool to ToolServiceMap in job-service/internal/routing/routing.go',
          'Backend: Implement handler in the target service (e.g., organize-pdf/internal/organizer/)',
          'Backend: Add MIME type validation for accepted file types',
          'Backend: Write tests (table-driven, cover success + failure cases)',
          'Frontend: Add ToolDefinition to TOOLS in src/config/tools.ts',
          'Frontend: Add mapping to TOOL_API_CONFIG in src/lib/toolApi.ts',
          'Frontend: Add to toolCategories.ts for navigation',
          'Frontend: Add ToolId to the ToolId union type if needed',
          'Frontend: Create page component in src/pages/',
          'Frontend: Add lazy import + Route in src/App.tsx',
          'Frontend: Add feature docs entry in src/config/docs.ts',
          'Verify: Run go test ./... and npm test to confirm nothing is broken',
        ],
      },
    ],
  },
  {
    slug: 'howto-add-service',
    title: 'Adding a New Service',
    description: 'Step-by-step guide to creating a new backend microservice.',
    category: 'howto',
    sections: [
      {
        heading: 'Overview',
        content: 'Each backend service in Fyredocs is a fully independent Go application with its own database schema, configuration, Dockerfile, and API contract. This guide walks through creating a new service from scratch following the project conventions in CLAUDE.md.',
        type: 'paragraph',
      },
      {
        heading: 'Step 1: Create directory structure',
        content: 'new-service/\n  main.go                # Entry point\n  go.mod                 # Module definition\n  go.sum\n  Dockerfile             # Service-specific Docker build\n  internal/\n    config/\n      config.go          # Environment-based configuration\n    handler/\n      handler.go         # HTTP handlers or NATS message handlers\n      handler_test.go    # Tests\n    model/\n      model.go           # GORM models (service-owned)\n    repository/\n      repository.go      # Database access layer\n  .env.example           # Documented environment variables',
        type: 'code',
        language: 'Directory',
      },
      {
        heading: 'Step 2: main.go boilerplate',
        content: 'package main\n\nimport (\n    "log/slog"\n    "os"\n\n    "github.com/gin-gonic/gin"\n    "github.com/nats-io/nats.go"\n    "gorm.io/driver/postgres"\n    "gorm.io/gorm"\n\n    "new-service/internal/config"\n    "new-service/internal/handler"\n    "new-service/internal/model"\n)\n\nfunc main() {\n    cfg := config.Load()\n\n    // Logger\n    logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{\n        Level: cfg.LogLevel,\n    }))\n    slog.SetDefault(logger)\n\n    // Database\n    db, err := gorm.Open(postgres.Open(cfg.DatabaseDSN()), &gorm.Config{})\n    if err != nil {\n        slog.Error("failed to connect to database", "error", err)\n        os.Exit(1)\n    }\n    sqlDB, _ := db.DB()\n    sqlDB.SetMaxIdleConns(5)\n    sqlDB.SetMaxOpenConns(25)\n    db.AutoMigrate(&model.YourModel{})\n\n    // NATS (if this service consumes messages)\n    nc, err := nats.Connect(cfg.NatsURL)\n    if err != nil {\n        slog.Error("failed to connect to NATS", "error", err)\n        os.Exit(1)\n    }\n    defer nc.Close()\n\n    // HTTP server\n    r := gin.Default()\n    r.GET("/healthz", func(c *gin.Context) { c.JSON(200, gin.H{"status": "ok"}) })\n    r.GET("/readyz", handler.ReadinessCheck(db, nc))\n\n    // Register routes or start NATS consumers\n    handler.RegisterRoutes(r, db)\n\n    slog.Info("starting service", "port", cfg.Port)\n    if err := r.Run(":" + cfg.Port); err != nil {\n        slog.Error("server failed", "error", err)\n    }\n}',
        type: 'code',
        language: 'Go',
      },
      {
        heading: 'Step 3: Database setup',
        content: 'Define GORM models in internal/model/. Each service owns its tables exclusively — never reference models from another service. Use UUIDv7 primary keys, soft deletes (gorm.Model includes DeletedAt), and JSONB columns for flexible metadata. Call db.AutoMigrate() on startup for development; use versioned SQL migrations for production.',
        type: 'paragraph',
      },
      {
        heading: 'Model boilerplate',
        content: '// internal/model/model.go\npackage model\n\nimport (\n    "time"\n    "gorm.io/gorm"\n)\n\ntype YourModel struct {\n    ID        string         `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`\n    UserID    string         `gorm:"type:uuid;not null;index" json:"userId"`\n    Status    string         `gorm:"type:varchar(50);not null;default:\'pending\'" json:"status"`\n    Metadata  datatypes.JSON `gorm:"type:jsonb" json:"metadata"`\n    CreatedAt time.Time      `json:"createdAt"`\n    UpdatedAt time.Time      `json:"updatedAt"`\n    DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`\n}',
        type: 'code',
        language: 'Go',
      },
      {
        heading: 'Step 4: NATS consumer setup (for worker services)',
        content: 'If the service processes jobs asynchronously via NATS, subscribe to the appropriate JetStream subject. Use a durable consumer group so messages survive restarts. Set MaxDeliver to 3 and AckWait to an appropriate timeout for your processing.',
        type: 'paragraph',
      },
      {
        heading: 'NATS consumer example',
        content: '// Subscribe to JetStream subject with durable consumer\njs, _ := nc.JetStream()\nsub, err := js.QueueSubscribe(\n    "jobs.new-service.*",       // subject filter\n    "new-service-workers",      // consumer group (durable)\n    handler.HandleMessage(db),  // message handler function\n    nats.MaxDeliver(3),\n    nats.AckWait(5*time.Minute),\n    nats.ManualAck(),\n)',
        type: 'code',
        language: 'Go',
      },
      {
        heading: 'Step 5: Register in API Gateway',
        content: 'Add a new route prefix in the API Gateway that proxies to your service. In api-gateway/internal/proxy/, add the route mapping with the target host and port. The gateway handles CORS, auth, and rate limiting — your service only needs to handle business logic.',
        type: 'paragraph',
      },
      {
        heading: 'Step 6: Dockerfile',
        content: '# Multi-stage build for small final image\nFROM golang:1.25-bookworm AS builder\nWORKDIR /app\nCOPY go.mod go.sum ./\nRUN go mod download\nCOPY . .\nRUN CGO_ENABLED=0 go build -o /service main.go\n\n# If the service needs system tools (LibreOffice, Ghostscript, etc.),\n# use the fyredocs-base image instead of scratch/alpine:\n# FROM fyredocs-base AS runtime\nFROM gcr.io/distroless/static-debian12\nCOPY --from=builder /service /service\nEXPOSE 8088\nENTRYPOINT ["/service"]',
        type: 'code',
        language: 'Dockerfile',
      },
      {
        heading: 'Step 7: Documentation',
        content: 'After creating the service, update these documentation files: (1) Add service to fyredocs_backend/README.md service list, (2) Create fyredocs_backend/docs/developer/services/new-service.md with responsibility, routes, DB schema, and error flows, (3) Update Mermaid architecture diagrams in docs/developer/mermaid/, (4) Add to this developer docs file (developerDocs.ts) in the Services nav group and entries.',
        type: 'paragraph',
      },
      {
        heading: 'Standard response format reminder',
        content: 'Every HTTP handler must return the standard JSON envelope. This is enforced project-wide per CLAUDE.md.',
        type: 'paragraph',
      },
      {
        heading: 'Response format',
        content: '{\n  "success": true,\n  "message": "Operation completed",\n  "data": { ... },\n  "error": null\n}',
        type: 'code',
        language: 'JSON',
      },
      {
        heading: 'Checklist',
        content: '',
        type: 'steps',
        items: [
          'Create directory structure under fyredocs_backend/{service-name}/',
          'Implement main.go with Gin server, DB connection, NATS connection, health endpoints',
          'Define GORM models in internal/model/ (UUIDv7 PKs, soft deletes)',
          'Implement handlers in internal/handler/ with standard response format',
          'Set up NATS consumer if processing async jobs',
          'Register proxy route in API Gateway',
          'Create Dockerfile (multi-stage, distroless or fyredocs-base)',
          'Write tests for all handlers and business logic',
          'Update README.md, service docs, Mermaid diagrams, and developer docs',
          'Run go build ./..., go vet ./..., go test ./... to verify',
        ],
      },
    ],
  },
  {
    slug: 'howto-testing',
    title: 'Testing Patterns',
    description: 'Backend Go testing and frontend Vitest testing conventions.',
    category: 'howto',
    sections: [
      {
        heading: 'Backend: Go testing conventions',
        content: 'All backend services use Go\'s built-in testing package. Tests live alongside the code they test in *_test.go files. Every new handler, function, or method must have a corresponding test per CLAUDE.md rules.',
        type: 'paragraph',
      },
      {
        heading: 'Test file naming',
        content: '',
        type: 'table',
        tableData: {
          headers: ['Source File', 'Test File', 'Convention'],
          rows: [
            ['handler.go', 'handler_test.go', 'Same directory, _test.go suffix'],
            ['routing.go', 'routing_test.go', 'Same directory, _test.go suffix'],
            ['compress.go', 'compress_test.go', 'Same directory, _test.go suffix'],
          ],
        },
      },
      {
        heading: 'Table-driven tests',
        content: 'func TestServiceForTool(t *testing.T) {\n    tests := []struct {\n        name     string\n        toolType string\n        want     string\n    }{\n        {"word-to-pdf routes to convert-to-pdf", "word-to-pdf", "convert-to-pdf"},\n        {"pdf-to-word routes to convert-from-pdf", "pdf-to-word", "convert-from-pdf"},\n        {"merge-pdf routes to organize-pdf", "merge-pdf", "organize-pdf"},\n        {"compress-pdf routes to optimize-pdf", "compress-pdf", "optimize-pdf"},\n        {"unknown tool returns empty", "nonexistent", ""},\n    }\n\n    for _, tt := range tests {\n        t.Run(tt.name, func(t *testing.T) {\n            got := ServiceForTool(tt.toolType)\n            if got != tt.want {\n                t.Errorf("ServiceForTool(%q) = %q, want %q", tt.toolType, got, tt.want)\n            }\n        })\n    }\n}',
        type: 'code',
        language: 'Go',
      },
      {
        heading: 'HTTP handler testing with httptest',
        content: 'func TestHealthEndpoint(t *testing.T) {\n    router := gin.Default()\n    router.GET("/healthz", func(c *gin.Context) {\n        c.JSON(200, gin.H{"status": "ok"})\n    })\n\n    req := httptest.NewRequest("GET", "/healthz", nil)\n    w := httptest.NewRecorder()\n    router.ServeHTTP(w, req)\n\n    if w.Code != 200 {\n        t.Errorf("expected 200, got %d", w.Code)\n    }\n\n    var resp map[string]string\n    json.Unmarshal(w.Body.Bytes(), &resp)\n    if resp["status"] != "ok" {\n        t.Errorf("expected status ok, got %s", resp["status"])\n    }\n}',
        type: 'code',
        language: 'Go',
      },
      {
        heading: 'Running backend tests',
        content: '# Single service\ncd fyredocs_backend/job-service && go test ./...\n\n# With verbose output\ngo test -v ./...\n\n# With coverage\ngo test -cover ./...\n\n# All services\nfor dir in api-gateway auth-service job-service convert-to-pdf \\\n  convert-from-pdf organize-pdf optimize-pdf \\\n  analytics-service cleanup-worker; do\n  echo "Testing $dir..." && cd "fyredocs_backend/$dir" && go test ./... && cd ../..\ndone',
        type: 'code',
        language: 'Bash',
      },
      {
        heading: 'Frontend: Vitest + Testing Library',
        content: 'The frontend uses Vitest as the test runner (Vite-native, Jest-compatible API) and @testing-library/react for component testing. Test files use the .test.ts or .test.tsx extension and live alongside the source files.',
        type: 'paragraph',
      },
      {
        heading: 'Frontend test file naming',
        content: '',
        type: 'table',
        tableData: {
          headers: ['Source File', 'Test File', 'Convention'],
          rows: [
            ['useFileUpload.ts', 'useFileUpload.test.ts', 'Same directory, .test.ts suffix'],
            ['apiClient.ts', 'apiClient.test.ts', 'Same directory, .test.ts suffix'],
            ['MergePage.tsx', 'MergePage.test.tsx', 'Same directory, .test.tsx suffix'],
          ],
        },
      },
      {
        heading: 'Frontend hook test example',
        content: 'import { renderHook, act } from \'@testing-library/react\';\nimport { useFileUpload } from \'@/hooks/useFileUpload\';\nimport { TOOLS } from \'@/config/tools\';\n\ndescribe(\'useFileUpload\', () => {\n  it(\'validates file types against tool config\', () => {\n    const { result } = renderHook(() =>\n      useFileUpload({ tool: TOOLS.merge })\n    );\n\n    const invalidFile = new File([\'test\'], \'test.exe\', {\n      type: \'application/x-msdownload\',\n    });\n\n    act(() => {\n      const validation = result.current.addFiles([invalidFile]);\n      expect(validation.isValid).toBe(false);\n      expect(validation.errors[0].code).toBe(\'INVALID_FILE_TYPE\');\n    });\n  });\n});',
        type: 'code',
        language: 'TypeScript',
      },
      {
        heading: 'Running frontend tests',
        content: '# Run all tests\ncd fyredocs_frontend && npx vitest run\n\n# Watch mode (re-runs on file changes)\nnpx vitest\n\n# With coverage\nnpx vitest run --coverage\n\n# Single file\nnpx vitest run src/hooks/useFileUpload.test.ts',
        type: 'code',
        language: 'Bash',
      },
      {
        heading: 'Testing rules from CLAUDE.md',
        content: '',
        type: 'list',
        items: [
          'Every new function, handler, or method MUST have a corresponding test',
          'If a code change modifies existing behavior, related tests MUST be updated to match',
          'If no test file exists for the changed package, Claude MUST create one (*_test.go or *.test.ts)',
          'Deleted or renamed functions MUST have their old tests removed or updated',
          'Missing or broken tests are treated as an incomplete task',
        ],
      },
    ],
  },

  // ==========================================================================
  // SERVICE FLOWS — Visual architecture & sequence diagrams per service
  // ==========================================================================

  {
    slug: 'flow-overview',
    title: 'System Overview',
    description: 'High-level system topology, data flow, NATS streams, and authentication flow.',
    category: 'flows',
    sections: [
      {
        heading: 'About These Diagrams',
        content: 'These diagrams show how the Fyredocs platform is structured at the system level — the service topology, how data flows from upload to download, NATS JetStream stream architecture, and the authentication flow. Use these to orient yourself before diving into individual service flows.',
        type: 'paragraph',
      },

      // ── Service Topology ──────────────────────────────────────────────
      {
        heading: 'Why a Microservice Topology?',
        content: 'Fyredocs is decomposed into single-responsibility services so that each conversion format (PDF-to-X, X-to-PDF) can scale independently based on actual workload. The Caddy edge (:80/:443) is the only internet-facing service — it terminates TLS, serves the SPA, routes presigned object traffic directly to MinIO, and proxies API traffic to the internal API Gateway. Every other component, the gateway included, communicates over an internal Docker network. This means you can horizontally scale a hot path like Convert-to-PDF without touching Auth or Analytics.',
        type: 'paragraph',
      },
      getMermaidSections('architecture')[0],
      {
        heading: 'Topology Takeaways',
        content: 'Notice that Redis and PostgreSQL are shared infrastructure, not per-service databases. Redis handles ephemeral state — session denylist entries, rate-limit counters, job progress — while PostgreSQL owns durable data like user accounts and conversion history. NATS JetStream sits between the API Gateway and every worker service, decoupling request acceptance from actual processing. This is what lets the platform stay responsive under heavy load: the gateway enqueues and returns immediately.',
        type: 'paragraph',
      },

      // ── Data Flow Overview ────────────────────────────────────────────
      {
        heading: 'Following a File Through the System',
        content: 'Understanding the data flow end-to-end is the fastest way to debug production issues. A file upload touches at least four services before the user gets a download link, and each hop has its own failure mode. The diagram below traces that journey so you can pinpoint exactly where a stuck job or missing file went sideways.',
        type: 'paragraph',
      },
      getMermaidSections('architecture')[1],
      {
        heading: 'Data Flow Design Decisions',
        content: 'Files are written to object storage immediately on upload — the job payload only carries a storage key, never the raw bytes. This keeps NATS messages small (under 1 KB) and avoids re-uploading on retry. Workers pull the file from storage, process it, and write the result back under a new key. The original is never mutated, which gives us free rollback if a conversion fails mid-stream.',
        type: 'paragraph',
      },

      // ── NATS JetStream Streams ────────────────────────────────────────
      {
        heading: 'How Async Job Dispatch Works',
        content: 'NATS JetStream is the backbone of all asynchronous work in Fyredocs. Rather than point-to-point HTTP calls between services, the API Gateway publishes a message to a subject like JOBS.convert-to-pdf, and the corresponding worker picks it up via a durable consumer. This pattern means workers can crash and restart without losing jobs — JetStream handles redelivery automatically after an ack timeout.',
        type: 'paragraph',
      },
      getMermaidSections('architecture')[2],
      {
        heading: 'Stream Architecture Takeaways',
        content: 'Each conversion type has its own subject under a single JOBS stream, which keeps configuration simple while still allowing per-subject filtering. Consumers are pull-based and durable, so a worker only receives the next message when it explicitly asks for one — this provides natural backpressure. If you need to add a new conversion format, you just add a new subject and deploy a worker that subscribes to it; no changes to existing services required.',
        type: 'paragraph',
      },

      // ── Authentication Flow ───────────────────────────────────────────
      {
        heading: 'JWT Auth with Token Rotation',
        content: 'Fyredocs uses a dual-token JWT strategy: a short-lived access token (15 minutes) for API authorization and a longer-lived refresh token (7 days) for silent renewal. This limits the blast radius of a leaked access token while keeping the user experience seamless. The refresh token is stored in an httpOnly cookie so it is inaccessible to client-side JavaScript, mitigating XSS-based token theft.',
        type: 'paragraph',
      },
      getMermaidSections('architecture')[3],
      {
        heading: 'Auth Design Decisions',
        content: 'On logout or password change, the refresh token is added to a Redis denylist rather than invalidating all sessions server-wide. Redis is ideal here because denylist entries only need to live as long as the token\'s remaining TTL — after expiry, the entry self-evicts. This avoids the stale-session problem of pure stateless JWT while keeping the auth path fast: a single Redis EXISTS check per request is all it costs.',
        type: 'paragraph',
      },
    ],
  },
  {
    slug: 'flow-api-gateway',
    title: 'API Gateway Flow',
    description: 'Visual flow diagrams for the API Gateway — request routing, middleware chain, and auth verification.',
    category: 'flows',
    sections: [
      {
        heading: 'About This Service',
        content: 'The API Gateway is the internal entry point for all API traffic. Public requests arrive at the Caddy edge (:80/:443), which serves the SPA, sends presigned /uploads/* and /outputs/* object traffic directly to MinIO, and proxies /api/*, /auth/*, and /admin/* to the gateway. The gateway handles CORS, authentication verification, request routing via reverse proxy, rate limiting, and security headers. It does not contain business logic — it only orchestrates middleware and forwards requests to downstream services.',
        type: 'paragraph',
      },
      {
        heading: 'Where It Fits',
        content: mermaidDiagrams['architecture'][0].content,
        type: 'mermaid',
      },
      // ── Component Diagram ──────────────────────────────────────────
      {
        heading: 'Internal Structure',
        content: 'Before looking at runtime behavior, it helps to understand what the API Gateway is actually made of. The component diagram below breaks out the major internal pieces — the middleware stack, the reverse proxy, and the configuration layer. Notice that the gateway itself holds no domain logic; every component exists solely to inspect, enrich, or forward HTTP requests.',
        type: 'paragraph',
      },
      getMermaidSections('svc-api-gateway')[0],
      {
        heading: 'Why This Decomposition Matters',
        content: 'Separating middleware, proxy, and config into distinct components means each can be tested and replaced independently. The config layer is loaded once at startup and injected into middleware constructors, so there is no hidden global state. This also makes it straightforward to add new middleware — you write the handler, register it in the config, and the gateway picks it up without touching the proxy code.',
        type: 'paragraph',
      },

      // ── Middleware Execution Order ──────────────────────────────────
      {
        heading: 'The Middleware Pipeline',
        content: 'Order matters in a middleware chain. A rate limiter that runs after authentication would waste cycles verifying tokens for requests that should have been throttled. The diagram below shows the exact execution order the gateway uses, and understanding this sequence is essential for debugging request failures — if a request is rejected, the position in the chain tells you which middleware made the call.',
        type: 'paragraph',
      },
      getMermaidSections('svc-api-gateway')[1],
      {
        heading: 'Design Decisions in the Pipeline',
        content: 'CORS runs first because preflight requests must be answered immediately — no downstream processing needed. Rate limiting comes before auth so that brute-force attacks are blocked cheaply, without hitting Redis for session lookups. RequestID and Logger wrap the proxy call so every log line, including errors from downstream services, carries a correlation ID for tracing.',
        type: 'paragraph',
      },

      // ── Dependency Graph ────────────────────────────────────────────
      {
        heading: 'External Dependencies',
        content: 'The gateway is stateless by design, but it still needs external systems for rate-limit counters and session validation. The dependency graph below shows exactly what the gateway talks to and why. Understanding these connections helps you predict what breaks when a dependency goes down — for example, a Redis outage affects both rate limiting and auth verification simultaneously.',
        type: 'paragraph',
      },
      getMermaidSections('svc-api-gateway')[2],
      {
        heading: 'Failure Modes and Resilience',
        content: 'Because Redis backs both rate limiting and session storage, losing it degrades two capabilities at once. The gateway is configured to fail open on rate limiting (allowing traffic through) but fail closed on auth (rejecting requests) when Redis is unavailable. Downstream service failures are isolated — a 500 from job-service does not cascade into auth-service requests, because the reverse proxy routes each path independently.',
        type: 'paragraph',
      },

      // ── Authenticated Request Flow ──────────────────────────────────
      {
        heading: 'Authenticated Request Lifecycle',
        content: 'Most API traffic follows the authenticated path — a logged-in user hitting a protected endpoint. The diagram below traces a single request from the client through every middleware layer, across the network to the downstream service, and back. Pay attention to where the token is validated versus where it is merely forwarded; the gateway verifies the session but never decodes the JWT payload itself.',
        type: 'paragraph',
      },
      getMermaidSections('svc-api-gateway')[3],
      {
        heading: 'What the Authenticated Flow Reveals',
        content: 'The gateway adds the validated user ID as a header before proxying, so downstream services never need to call auth-service themselves. This is a deliberate trust boundary: services behind the gateway trust the X-User-ID header because only the gateway can set it. If a downstream service were exposed directly, this header could be spoofed — which is why all API traffic must enter through the gateway (via the Caddy edge).',
        type: 'paragraph',
      },

      // ── Guest (Unauthenticated) Request Flow ───────────────────────
      {
        heading: 'Guest and Unauthenticated Access',
        content: 'Not every endpoint requires a login. Public routes like documentation pages, health checks, and the login endpoint itself need to be accessible without a token. The flow below shows how the gateway distinguishes between protected and public routes, and what happens when a request arrives without credentials.',
        type: 'paragraph',
      },
      getMermaidSections('svc-api-gateway')[4],
      {
        heading: 'Guest Flow Takeaways',
        content: 'The gateway uses a route whitelist to decide which paths skip auth verification. This list is defined in the gateway config, not in the auth middleware itself, so adding a new public route is a configuration change rather than a code change. Guest requests still pass through rate limiting and CORS — being unauthenticated does not mean being unprotected.',
        type: 'paragraph',
      },

      // ── CORS Preflight Flow ─────────────────────────────────────────
      {
        heading: 'CORS Preflight Handling',
        content: 'Browsers send an OPTIONS preflight request before any cross-origin POST, PUT, or DELETE. These requests carry no auth token and expect a fast response with the right headers. The diagram below shows how the gateway short-circuits the middleware chain for preflight requests, returning the appropriate Access-Control headers without ever touching downstream services.',
        type: 'paragraph',
      },
      getMermaidSections('svc-api-gateway')[5],
      {
        heading: 'Why Preflight Is Handled First',
        content: 'CORS middleware sits at position zero in the chain specifically because preflight requests must never reach the auth layer. If they did, every cross-origin request would fail with a 401 before the browser even sent the real request. By handling OPTIONS immediately, the gateway keeps preflight latency under a millisecond and avoids unnecessary Redis lookups.',
        type: 'paragraph',
      },

      // ── Health Check Flow ───────────────────────────────────────────
      {
        heading: 'Health Check Endpoint',
        content: 'Load balancers, Kubernetes probes, and monitoring tools all need a lightweight way to ask "is this service alive?" The health check flow below is intentionally minimal — it bypasses the full middleware chain and returns a 200 with basic version and uptime metadata. This ensures that infrastructure tooling gets a reliable signal even when downstream services or Redis are experiencing issues.',
        type: 'paragraph',
      },
      getMermaidSections('svc-api-gateway')[6],
      {
        heading: 'Health Check Design',
        content: 'The /health endpoint is excluded from both auth and rate limiting, so it cannot be blocked by a misconfigured token or a burst of traffic. It reports only the gateway\'s own status, not the health of downstream services — that distinction is important because a healthy gateway with an unhealthy job-service should still accept and route traffic to other services. Deep health checks that cascade into dependencies are handled by a separate /health/deep endpoint used for diagnostics, not for load balancer routing.',
        type: 'paragraph',
      },
    ],
  },
  {
    slug: 'flow-auth',
    title: 'Auth Service Flow',
    description: 'Visual flow diagrams for the Auth Service — registration, login, logout, token lifecycle, and guest sessions.',
    category: 'flows',
    sections: [
      {
        heading: 'About This Service',
        content: 'The Auth Service handles user registration, login, logout, token refresh, and guest session management. It issues JWT access tokens (15min) and refresh tokens (7d) as HTTP-only cookies, with a Redis-backed denylist for instant revocation on logout.',
        type: 'paragraph',
      },
      {
        heading: 'Where It Fits',
        content: mermaidDiagrams['architecture'][0].content,
        type: 'mermaid',
      },
      // 1. Component Diagram
      {
        heading: 'Inside the Auth Service',
        content: 'Before diving into individual flows, it helps to see what the Auth Service is actually made of. The diagram below breaks it down into its internal building blocks — handlers, services, repositories, and the supporting infrastructure clients.',
        type: 'paragraph',
      },
      getMermaidSections('svc-auth')[0],
      {
        heading: 'Why This Decomposition Matters',
        content: 'Separating the JWT manager and password hasher into their own components means we can swap algorithms (e.g., moving from bcrypt to argon2) without touching any handler or service logic. The repository layer abstracts all direct database calls, so the service layer never knows whether users live in PostgreSQL, DynamoDB, or an in-memory store during tests.',
        type: 'paragraph',
      },

      // 2. Token Lifecycle
      {
        heading: 'Understanding Token Lifetimes',
        content: 'JWTs are stateless by design, but that creates a revocation problem — you cannot "delete" a token that has already been issued. Our solution is a two-token system with a Redis-backed denylist that bridges the gap between stateless speed and stateful control.',
        type: 'paragraph',
      },
      getMermaidSections('svc-auth')[1],
      {
        heading: 'Why 15 Minutes and 7 Days?',
        content: 'The short-lived access token (15 min) limits the blast radius if a token is leaked; an attacker gets at most 15 minutes of access. The longer refresh token (7 days) keeps users from having to log in every quarter-hour. On logout, both tokens are added to the Redis denylist with a TTL matching their remaining lifespan, so Redis automatically cleans up expired entries.',
        type: 'paragraph',
      },

      // 3. Password Security Flow
      {
        heading: 'How Passwords Are Protected',
        content: 'Storing passwords in plain text is a non-starter. The Auth Service never persists the raw password — it only ever stores a one-way bcrypt hash. The following diagram shows exactly when hashing and comparison happen relative to the rest of the flow.',
        type: 'paragraph',
      },
      getMermaidSections('svc-auth')[2],
      {
        heading: 'Design Notes on Hashing',
        content: 'bcrypt is intentionally slow, which makes brute-force attacks impractical. The cost factor is configurable via environment variables so it can be tuned as hardware gets faster. Because the hash includes its own salt, we never need a separate salt column in the database.',
        type: 'paragraph',
      },

      // 4. Dependency Graph
      {
        heading: 'External Dependencies',
        content: 'The Auth Service does not operate in isolation — it depends on two external data stores. Understanding these dependencies is critical for local development setup and for reasoning about what happens when one of them goes down.',
        type: 'paragraph',
      },
      getMermaidSections('svc-auth')[3],
      {
        heading: 'Failure Implications',
        content: 'If PostgreSQL is unreachable, signup and login both fail because user records cannot be read or written. If Redis goes down, logout becomes a no-op (tokens cannot be denylisted) and guest sessions stop working. In production we run both with replicas, but the service itself does not retry — it fails fast and lets the API gateway return a 503.',
        type: 'paragraph',
      },

      // 5. User Signup
      {
        heading: 'Walking Through Registration',
        content: 'Registration is the most write-heavy flow in the Auth Service. It touches validation, the database, the password hasher, and the token issuer in sequence. Every step is a potential failure point, and the diagram below shows the happy path from start to finish.',
        type: 'paragraph',
      },
      getMermaidSections('svc-auth')[4],
      {
        heading: 'Signup Design Decisions',
        content: 'We validate the request body before hitting the database to avoid unnecessary round-trips. The duplicate-email check and the insert happen inside a single database transaction to prevent race conditions where two users register with the same email simultaneously. Tokens are issued immediately after insertion so the user is logged in the moment they finish signing up — no extra login step required.',
        type: 'paragraph',
      },

      // 6. User Login
      {
        heading: 'Walking Through Login',
        content: 'Login is the mirror image of signup: instead of writing a new user, we look one up and verify their credentials. The flow is deliberately similar in shape to keep the codebase predictable.',
        type: 'paragraph',
      },
      getMermaidSections('svc-auth')[5],
      {
        heading: 'Login Design Decisions',
        content: 'The service returns a generic "invalid credentials" error whether the email is wrong or the password is wrong. This prevents user enumeration attacks — an attacker cannot probe for valid email addresses. Cookies are set with the HttpOnly, Secure, and SameSite=Strict flags to minimize XSS and CSRF exposure.',
        type: 'paragraph',
      },

      // 7. User Logout
      {
        heading: 'Walking Through Logout',
        content: 'Logout needs to do more than just clear cookies on the client. Because JWTs are self-contained, a stolen token would remain valid until expiry unless we actively revoke it. That is where the Redis denylist comes in.',
        type: 'paragraph',
      },
      getMermaidSections('svc-auth')[6],
      {
        heading: 'Logout Design Decisions',
        content: 'The service calculates the remaining TTL of each token and stores them in Redis with that exact TTL. This means Redis automatically evicts expired entries — no background cleanup job needed. Clearing cookies on the response is a courtesy to the browser; the real security boundary is the server-side denylist.',
        type: 'paragraph',
      },

      // 8. Get Current User (Me)
      {
        heading: 'The "Me" Endpoint',
        content: 'Most SPAs need a way to ask "who am I?" on page load. The /me endpoint decodes the access token, fetches the corresponding user record, and returns a sanitized profile. It is the most frequently called endpoint in the Auth Service.',
        type: 'paragraph',
      },
      getMermaidSections('svc-auth')[7],
      {
        heading: 'Performance Considerations',
        content: 'Because this endpoint is hit on every page load, it needs to be fast. Token verification is pure CPU work (no I/O), and the database query is a simple primary-key lookup. We intentionally do not cache the user profile in Redis here — the data changes infrequently enough that a single DB read per page load is acceptable, and it avoids cache-invalidation complexity.',
        type: 'paragraph',
      },

      // 9. Failed Login (Wrong Password)
      {
        heading: 'Error Path: Wrong Password',
        content: 'Happy paths are only half the story. Understanding how the service behaves when things go wrong is just as important for debugging and for writing integration tests.',
        type: 'paragraph',
      },
      getMermaidSections('svc-auth')[8],
      {
        heading: 'Why We Treat This Carefully',
        content: 'The error response is intentionally vague — "invalid credentials" rather than "wrong password" — to avoid leaking information about which accounts exist. Rate limiting at the API gateway layer provides additional protection against credential-stuffing attacks. The service itself remains stateless with respect to failed attempts; it does not track them.',
        type: 'paragraph',
      },

      // 10. Duplicate Signup
      {
        heading: 'Error Path: Duplicate Email',
        content: 'When a user tries to register with an email that is already taken, the service needs to reject the request without revealing too much. This diagram shows the exact point where the flow diverges from the happy path.',
        type: 'paragraph',
      },
      getMermaidSections('svc-auth')[9],
      {
        heading: 'Balancing UX and Security',
        content: 'Returning a specific "email already exists" error is a trade-off. It improves the user experience (they know to try logging in instead) but it also confirms to an attacker that an account exists. We have chosen to accept this trade-off because email enumeration can also be done via the password-reset flow, so hiding it here would only provide a false sense of security.',
        type: 'paragraph',
      },

      // 11. Guest Session Creation
      {
        heading: 'Guest Guest Sessions',
        content: 'Not every user wants to create an account just to try the product. Guest sessions let guest users access a limited feature set without signing up. The following diagram shows how these lightweight sessions are created and stored.',
        type: 'paragraph',
      },
      getMermaidSections('svc-auth')[10],
      {
        heading: 'Guest Session Constraints',
        content: 'Guest sessions are stored in Redis with a 24-hour TTL so they do not accumulate indefinitely. They carry a reduced permission set — no file uploads, no persistent storage. When a guest later signs up, the session is promoted to a full user account and linked to the same ID, preserving any in-progress work.',
        type: 'paragraph',
      },
    ],
  },
  {
    slug: 'flow-job',
    title: 'Job Service Flow',
    description: 'Visual flow diagrams for the Job Service — job creation, dispatch, status tracking, uploads, and SSE.',
    category: 'flows',
    sections: [
      {
        heading: 'About This Service',
        content: 'The Job Service is the central orchestrator. It handles file uploads (chunked and multipart), creates jobs, dispatches them to worker services via NATS JetStream, tracks job status, and streams real-time updates to clients via SSE. It also manages the upload-to-job lifecycle.',
        type: 'paragraph',
      },
      {
        heading: 'Where It Fits',
        content: mermaidDiagrams['architecture'][0].content,
        type: 'mermaid',
      },
      // --- Component & Architecture Diagrams ---
      {
        heading: 'Component Diagram',
        content: 'Before we trace any request flows, it helps to see the internal building blocks of the Job Service. The service is not a single monolith handler — it is composed of discrete components (HTTP handlers, a NATS dispatcher, an SSE hub, and an upload manager) that each own a specific responsibility.',
        type: 'paragraph',
      },
      getMermaidSections('svc-job')[0],
      {
        heading: '',
        content: 'Notice how the SSE hub and the NATS dispatcher are siblings, not parent-child. That separation is intentional: the dispatcher fires messages into the queue and forgets about them, while the SSE hub independently listens for status changes and pushes them to connected clients. This decoupling means a slow SSE consumer can never back-pressure the dispatch path.',
        type: 'paragraph',
      },
      {
        heading: 'Job Dispatch Flow',
        content: 'When a job is created, it does not get processed in-place. Instead, the Job Service publishes a message to a NATS JetStream subject that is keyed by the requested tool type. This is the fan-out mechanism that lets the platform scale each conversion tool independently.',
        type: 'paragraph',
      },
      getMermaidSections('svc-job')[1],
      {
        heading: '',
        content: 'The subject-based routing is what makes adding a new tool straightforward — you deploy a new consumer that subscribes to the right subject, and the Job Service does not need a code change. It also means you can horizontally scale a single tool (say, PDF merge) without affecting any other worker pool.',
        type: 'paragraph',
      },
      {
        heading: 'Tool-to-Service Routing Map',
        content: 'With subject-based dispatch in mind, the natural next question is: which tool lands on which service? This routing map makes the answer explicit. Each tool name resolves to exactly one downstream worker service.',
        type: 'paragraph',
      },
      getMermaidSections('svc-job')[2],
      {
        heading: '',
        content: 'If you are debugging a failed job, this map is your first stop. Find the tool, find the service, then check that service\'s logs. The one-to-one mapping keeps things predictable even as the number of tools grows.',
        type: 'paragraph',
      },
      {
        heading: 'Dependency Graph',
        content: 'The Job Service sits at a busy intersection of infrastructure. It talks to PostgreSQL for persistence, Redis for caching and rate limiting, NATS for async messaging, and a file storage backend for uploads and results. Understanding these dependencies is critical for operational readiness.',
        type: 'paragraph',
      },
      getMermaidSections('svc-job')[3],
      {
        heading: '',
        content: 'Every one of these dependencies has a health check wired into the service\'s readiness probe. If Redis goes down, the service stays in the load balancer but degrades gracefully — it skips the cache layer rather than returning errors. NATS and PostgreSQL, on the other hand, are hard dependencies: lose either one and the service marks itself not-ready.',
        type: 'paragraph',
      },

      // --- Job Lifecycle ---
      {
        heading: 'Job Lifecycle',
        content: 'Now that you understand the components and their dependencies, let us walk through the actual job lifecycle — from creation through completion and cleanup.',
        type: 'paragraph',
      },
      {
        heading: 'Create Job (JSON body with uploadId)',
        content: 'The most common job creation path starts after the client has already uploaded files. The client sends a JSON body that references an existing uploadId, so the service only needs to validate the reference, create the job record, and dispatch it.',
        type: 'paragraph',
      },
      getMermaidSections('svc-job')[4],
      {
        heading: '',
        content: 'Separating upload from job creation gives the client flexibility — a user can upload files, navigate away, come back, and still create the job without re-uploading. It also means the upload and the job can have independent retry semantics.',
        type: 'paragraph',
      },
      {
        heading: 'Create Job (Multipart upload)',
        content: 'Sometimes the client wants a simpler, one-shot flow: upload the files and create the job in a single HTTP request. This multipart path handles that by internally creating the upload record, persisting the files, and then dispatching the job — all within one request cycle.',
        type: 'paragraph',
      },
      getMermaidSections('svc-job')[5],
      {
        heading: '',
        content: 'The trade-off is that this path ties the upload lifetime to the HTTP request. If the connection drops mid-upload, the entire operation fails and must be retried from scratch. For large files, the chunked upload path is almost always the better choice.',
        type: 'paragraph',
      },
      {
        heading: 'Get Job Status',
        content: 'Clients that do not use SSE fall back to polling the status endpoint. The endpoint returns the current job state along with progress metadata so the UI can render a progress bar.',
        type: 'paragraph',
      },
      getMermaidSections('svc-job')[6],
      {
        heading: '',
        content: 'Status responses are served from a Redis cache with a short TTL, so even aggressive polling does not hit PostgreSQL on every request. The cache is invalidated whenever the job state changes, keeping the data fresh without sacrificing read performance.',
        type: 'paragraph',
      },
      {
        heading: 'Download Completed Job',
        content: 'Once a job reaches the "completed" state, the result file is available for download. The download endpoint validates that the job is owned by the requesting user, then streams the file from storage.',
        type: 'paragraph',
      },
      getMermaidSections('svc-job')[7],
      {
        heading: '',
        content: 'Downloads use a signed, time-limited URL rather than proxying the bytes through the Job Service. This keeps the service\'s memory footprint low and lets the storage backend handle range requests and caching headers natively.',
        type: 'paragraph',
      },
      {
        heading: 'Delete Job',
        content: 'Deleting a job is more than removing a database row. The service must also clean up associated files in storage and invalidate any cached state. This diagram shows the full teardown sequence.',
        type: 'paragraph',
      },
      getMermaidSections('svc-job')[8],
      {
        heading: '',
        content: 'File cleanup happens asynchronously after the database record is deleted. If storage deletion fails, a background reconciliation process will eventually catch orphaned files. This design ensures the user gets an immediate response while expensive I/O happens out of band.',
        type: 'paragraph',
      },
      {
        heading: 'Guest User Job Access',
        content: 'Guest users present a unique challenge: they have no persistent identity, so the service uses a short-lived token tied to the browser session. This diagram shows how guest access is granted and scoped.',
        type: 'paragraph',
      },
      getMermaidSections('svc-job')[9],
      {
        heading: '',
        content: 'Guest tokens are intentionally limited — they grant access only to the specific job that was created in that session, and they expire aggressively. This prevents abuse while still letting guest users try the product without signing up.',
        type: 'paragraph',
      },
      {
        heading: 'SSE Job Status Updates',
        content: 'For clients that want real-time feedback, the Job Service exposes a Server-Sent Events endpoint. Once a client subscribes, every status transition for that job is pushed immediately — no polling required.',
        type: 'paragraph',
      },
      getMermaidSections('svc-job')[10],
      {
        heading: '',
        content: 'The SSE connection is per-job, not per-user. This keeps the fan-out manageable and means the server only holds state for jobs that are actively being watched. When the job reaches a terminal state (completed or failed), the server closes the connection automatically.',
        type: 'paragraph',
      },

      // --- Upload Subsystem ---
      {
        heading: 'Upload Subsystem',
        content: 'The upload subsystem is a semi-autonomous part of the Job Service that manages file ingestion. It has its own component structure, state machine, and dependency graph because uploads have a fundamentally different lifecycle from jobs.',
        type: 'paragraph',
      },
      {
        heading: 'Upload Service Component Diagram',
        content: 'The upload manager is composed of a chunk receiver, a reassembly pipeline, and a storage writer. These components work together to turn a stream of chunks into a complete file that a job can reference.',
        type: 'paragraph',
      },
      getMermaidSections('svc-job')[11],
      {
        heading: '',
        content: 'Keeping the upload components separate from the job components means you can reason about upload bugs without thinking about job dispatch at all. The only shared surface is the storage layer and the uploadId foreign key.',
        type: 'paragraph',
      },
      {
        heading: 'Upload State Machine',
        content: 'Every upload moves through a strict set of states: initiated, uploading, complete, or failed. Transitions are enforced at the database level, so no application bug can skip a state or move backwards.',
        type: 'paragraph',
      },
      getMermaidSections('svc-job')[12],
      {
        heading: '',
        content: 'The "failed" state is a terminal state, but it does not trigger automatic cleanup. Failed uploads are retained for a configurable window so that support teams can investigate what went wrong before the data is purged.',
        type: 'paragraph',
      },
      {
        heading: 'Upload Service Dependency Graph',
        content: 'The upload subsystem has a narrower dependency footprint than the job side. It primarily needs file storage and PostgreSQL. Redis is used only for deduplication checks on chunk hashes.',
        type: 'paragraph',
      },
      getMermaidSections('svc-job')[13],
      {
        heading: '',
        content: 'Because the upload path does not depend on NATS, an outage in the messaging layer does not prevent users from uploading files. They just cannot create jobs until NATS recovers, which is a much better failure mode than losing an in-progress upload.',
        type: 'paragraph',
      },
      {
        heading: 'Chunked File Upload Flow',
        content: 'Large files are uploaded in chunks to avoid timeout and memory issues. The client splits the file, sends each chunk with an index, and the server reassembles them once all chunks have arrived.',
        type: 'paragraph',
      },
      getMermaidSections('svc-job')[14],
      {
        heading: '',
        content: 'Chunks can arrive out of order and even be retried individually without restarting the entire upload. The server tracks which chunks have been received and only triggers reassembly when the set is complete. This makes the upload resilient to flaky networks.',
        type: 'paragraph',
      },
      {
        heading: 'Job Creation from Upload',
        content: 'Once an upload reaches the "complete" state, the client can reference it by uploadId to create a job. This diagram shows the handoff from the upload subsystem to the job lifecycle.',
        type: 'paragraph',
      },
      getMermaidSections('svc-job')[15],
      {
        heading: '',
        content: 'The handoff is intentionally loose-coupled. The upload subsystem does not know or care what happens after completion — it simply marks the upload as complete and makes the files addressable. The job creation endpoint independently validates that the referenced upload exists and is in the right state.',
        type: 'paragraph',
      },
      {
        heading: 'Multipart Direct Upload with Job Creation',
        content: 'This is the convenience path that combines file upload and job creation into a single multipart HTTP request. It is the fastest way to go from file selection to a running job.',
        type: 'paragraph',
      },
      getMermaidSections('svc-job')[16],
      {
        heading: '',
        content: 'Under the hood, the service still creates an upload record and runs it through the same validation pipeline. The only difference is that the client never sees the uploadId — it is an internal implementation detail. This keeps the two paths consistent from a data integrity perspective.',
        type: 'paragraph',
      },
      {
        heading: 'Upload Service User Signup',
        content: 'When a brand-new user signs up, any uploads they created as a guest need to be migrated to their new account. This diagram walks through how that ownership transfer works.',
        type: 'paragraph',
      },
      getMermaidSections('svc-job')[17],
      {
        heading: '',
        content: 'The migration is atomic — either all guest uploads transfer to the new account or none do. This prevents a partial transfer from leaving orphaned files that neither the guest token nor the new account can access.',
        type: 'paragraph',
      },
    ],
  },
  {
    slug: 'flow-convert-to-pdf',
    title: 'Convert to PDF Flow',
    description: 'Visual flow diagrams for the Convert to PDF service — document and image to PDF conversion pipeline.',
    category: 'flows',
    sections: [
      {
        heading: 'About This Service',
        content: 'The Convert to PDF service is a NATS consumer that converts office documents (Word, Excel, PowerPoint, HTML) and images to PDF using LibreOffice headless and pdfcpu. It picks up jobs from the NATS JetStream dispatch queue and writes results back to the shared file storage.',
        type: 'paragraph',
      },
      {
        heading: 'Where It Fits',
        content: mermaidDiagrams['architecture'][0].content,
        type: 'mermaid',
      },
      // — 0. Component Diagram —
      {
        heading: 'Inside the Service',
        content: 'The Convert to PDF service is not a single monolithic converter — it is composed of several focused components that each own one responsibility. A NATS consumer pulls jobs off the queue, a tool router decides which converter handles the file type, and dedicated pools for LibreOffice and pdfcpu do the heavy lifting. This separation means we can scale or swap out individual pieces (for example, replacing LibreOffice with a commercial engine) without rewriting the entire service.',
        type: 'paragraph',
      },
      {
        heading: 'Component Diagram',
        content: mermaidDiagrams['svc-convert-to-pdf'][0].content,
        type: 'mermaid',
      },
      {
        heading: '',
        content: 'Notice that the LibreOffice pool is intentionally isolated behind its own wrapper. LibreOffice headless is not thread-safe, so the pool manages a fixed number of sequential workers and queues requests to them. This avoids the classic pitfall of spawning dozens of LibreOffice processes that fight over memory and crash under load.',
        type: 'paragraph',
      },

      // — 1. Allowed Tool Types —
      {
        heading: 'Supported Conversion Types',
        content: 'Not every conversion request should land in this service. The tool router acts as a gatekeeper, accepting only the conversion types that this service is explicitly built to handle: Word, Excel, PowerPoint, HTML, and image to PDF, plus PDF merging. Any unrecognized tool type is rejected immediately with a clear error rather than silently failing halfway through a pipeline.',
        type: 'paragraph',
      },
      {
        heading: 'Allowed Tool Types',
        content: mermaidDiagrams['svc-convert-to-pdf'][1].content,
        type: 'mermaid',
      },
      {
        heading: '',
        content: 'This allow-list approach was chosen over a deny-list because new tool types are added to the platform regularly. An allow-list guarantees that a new, untested type never accidentally runs through a converter that does not understand it. When you add a new conversion type, you must explicitly register it here — a small cost for a large safety gain.',
        type: 'paragraph',
      },

      // — 2. Dependency Graph —
      {
        heading: 'External Dependencies',
        content: 'Understanding the dependency graph is critical for debugging and deployment. The service depends on four external systems: LibreOffice for office-document conversion, pdfcpu for merge and page-manipulation operations, NATS JetStream for job delivery, and a shared file-storage volume for reading input files and writing output PDFs. If any one of these is unavailable at startup, the service will fail its health check and refuse to accept jobs.',
        type: 'paragraph',
      },
      {
        heading: 'Dependency Graph',
        content: mermaidDiagrams['svc-convert-to-pdf'][2].content,
        type: 'mermaid',
      },
      {
        heading: '',
        content: 'We chose pdfcpu over Ghostscript for merge operations because pdfcpu is a pure Go library — no CGO, no external binary, no extra attack surface. It is statically compiled into the service binary, which makes container images smaller and eliminates an entire class of "missing shared library" deployment issues.',
        type: 'paragraph',
      },

      // — 3. Job Processing (Happy Path) —
      {
        heading: 'The Happy Path',
        content: 'Most conversion jobs follow the same predictable pipeline: the service receives a job message from NATS, downloads the source file from shared storage, routes it to the correct converter, uploads the resulting PDF back to storage, and marks the job as complete. Each step is idempotent — if the service crashes mid-conversion, NATS will redeliver the message and the entire pipeline reruns from scratch without producing duplicates.',
        type: 'paragraph',
      },
      {
        heading: 'Job Processing (Happy Path)',
        content: mermaidDiagrams['svc-convert-to-pdf'][3].content,
        type: 'mermaid',
      },
      {
        heading: '',
        content: 'The "download first, convert locally" pattern deserves a callout. We deliberately copy the file to a local temp directory before handing it to LibreOffice. This avoids NFS or FUSE latency during the actual conversion, which can cause LibreOffice to time out on large files. The local copy is cleaned up after the result is uploaded, keeping disk usage bounded.',
        type: 'paragraph',
      },

      // — 4. Merge PDF Processing —
      {
        heading: 'The Merge Flow',
        content: 'PDF merging is a special case that bypasses the LibreOffice path entirely. Instead of converting a single file, the service downloads multiple source PDFs, passes them to pdfcpu in the correct page order, and produces a single combined output. This flow exists as a separate code path because the input shape is fundamentally different — one job references many files, not one.',
        type: 'paragraph',
      },
      {
        heading: 'Merge PDF Processing',
        content: mermaidDiagrams['svc-convert-to-pdf'][4].content,
        type: 'mermaid',
      },
      {
        heading: '',
        content: 'Order matters during a merge, and the job payload includes an explicit ordering array rather than relying on filename sorting. This was a deliberate design decision after early users reported that lexicographic ordering produced unexpected results when filenames contained mixed numeric prefixes.',
        type: 'paragraph',
      },

      // — 5. Image-to-PDF Conversion —
      {
        heading: 'Image Conversion Pipeline',
        content: 'Images require their own pipeline because they need pre-processing that office documents do not. Before conversion, the service validates the image format, checks dimensions, and optionally resizes oversized images so the resulting PDF stays within reasonable page bounds. Without this step, a 10,000-pixel-wide photograph would produce a PDF page the size of a billboard.',
        type: 'paragraph',
      },
      {
        heading: 'Image-to-PDF Conversion',
        content: mermaidDiagrams['svc-convert-to-pdf'][5].content,
        type: 'mermaid',
      },
      {
        heading: '',
        content: 'The resize threshold is configurable via environment variable, defaulting to 4096 pixels on the longest edge. We chose this default because it produces A4-compatible output at 300 DPI — high enough for print quality, small enough to keep file sizes under control. JPEG, PNG, TIFF, and WebP are all supported; unsupported formats are rejected at the validation step before any processing begins.',
        type: 'paragraph',
      },

      // — 6. Worker Lifecycle —
      {
        heading: 'Startup and Shutdown',
        content: 'The worker lifecycle is designed around graceful degradation. On startup, the service connects to NATS, initializes the LibreOffice pool, verifies that pdfcpu is available, and only then begins consuming messages. This "verify everything before accepting work" pattern prevents the service from pulling jobs it cannot actually process, which would cause unnecessary redeliveries and user-visible delays.',
        type: 'paragraph',
      },
      {
        heading: 'Worker Lifecycle',
        content: mermaidDiagrams['svc-convert-to-pdf'][6].content,
        type: 'mermaid',
      },
      {
        heading: '',
        content: 'During shutdown, the service stops accepting new messages, waits for in-flight conversions to finish (up to a configurable timeout), and then tears down the LibreOffice pool and NATS connection in reverse order. This two-phase shutdown ensures that a rolling deployment never drops a job mid-conversion — the orchestrator can safely kill the old pod once it reports healthy termination.',
        type: 'paragraph',
      },
    ],
  },
  {
    slug: 'flow-convert-from-pdf',
    title: 'Convert from PDF Flow',
    description: 'Visual flow diagrams for the Convert from PDF service — PDF to document format conversion pipeline.',
    category: 'flows',
    sections: [
      {
        heading: 'About This Service',
        content: 'The Convert from PDF service is a NATS consumer that converts PDFs to other formats (Word, Excel, PowerPoint, images, HTML, text, PDF/A) using LibreOffice, Poppler utilities (pdftoppm, pdftohtml, pdftotext), and Ghostscript.',
        type: 'paragraph',
      },
      {
        heading: 'Where It Fits',
        content: mermaidDiagrams['architecture'][0].content,
        type: 'mermaid',
      },
      // — 0. Component Diagram —
      {
        heading: 'Component Architecture',
        content: 'Unlike the Convert to PDF service which leans heavily on a single tool (LibreOffice), the Convert from PDF service must orchestrate three entirely different conversion backends. Each backend excels at a specific class of output format, so a routing layer inspects the requested tool type and dispatches work to the right adapter. This keeps each adapter small, testable, and independently upgradable.',
        type: 'paragraph',
      },
      {
        heading: 'Component Diagram',
        content: mermaidDiagrams['svc-convert-from-pdf'][0].content,
        type: 'mermaid',
      },
      {
        heading: '',
        content: 'LibreOffice handles document-format conversions (Word, Excel, PowerPoint) because it understands the rich layout information inside a PDF and can reconstruct it in Office XML. Poppler utilities handle lighter-weight extractions — images via pdftoppm, HTML via pdftohtml, and plain text via pdftotext — where raw content matters more than formatting fidelity. Ghostscript handles PDF/A conversion because it can re-linearize and embed fonts to meet archival compliance standards.',
        type: 'paragraph',
      },

      // — 1. Allowed Tool Types —
      {
        heading: 'Supported Conversion Types',
        content: 'The service exposes seven distinct conversion tool types, each mapped to a specific backend adapter. This explicit allowlist serves two purposes: it prevents callers from requesting unsupported conversions at the NATS message level, and it makes the mapping between tool type and backend transparent for debugging. Every new format added in the future only requires a new entry here and a corresponding adapter implementation.',
        type: 'paragraph',
      },
      {
        heading: 'Allowed Tool Types',
        content: mermaidDiagrams['svc-convert-from-pdf'][1].content,
        type: 'mermaid',
      },
      {
        heading: '',
        content: 'Notice that image extraction (pdf-to-image) goes through Poppler rather than LibreOffice. Poppler\'s pdftoppm renders each page at the pixel level, producing consistently sharp raster output. LibreOffice could technically export images, but its rendering pipeline is optimized for editable vector content, which often introduces subtle artifacts in bitmap output.',
        type: 'paragraph',
      },

      // — 2. Worker Retry Strategy —
      {
        heading: 'Why Exponential Backoff?',
        content: 'PDF conversion is inherently resource-intensive — LibreOffice can consume several hundred megabytes of RAM for a complex document, and Ghostscript may need significant CPU time for font embedding. When a conversion fails, immediately retrying would pile pressure onto an already strained worker. Exponential backoff gives the system breathing room to recover, whether the root cause is a transient OOM kill, a temporary disk-space shortage, or a slow upstream object store.',
        type: 'paragraph',
      },
      {
        heading: 'Worker Retry Strategy',
        content: mermaidDiagrams['svc-convert-from-pdf'][2].content,
        type: 'mermaid',
      },
      {
        heading: '',
        content: 'After all retries are exhausted the message is moved to a dead letter queue rather than silently dropped. This is critical for operational visibility: a growing dead letter queue signals a systemic issue (e.g., a corrupt LibreOffice installation) rather than one-off bad input. Operators can inspect, replay, or discard dead letters without affecting the main processing pipeline.',
        type: 'paragraph',
      },

      // — 3. Job Processing (Happy Path) —
      {
        heading: 'The Happy Path',
        content: 'In the common case, a conversion job flows through four sequential stages: receive the NATS message, download the source PDF from object storage, run the appropriate backend conversion, and upload the result. This linear pipeline is deliberately simple — there is no internal fan-out or parallelism within a single job. Keeping one job on one goroutine makes resource accounting predictable and prevents a single large PDF from starving other in-flight conversions.',
        type: 'paragraph',
      },
      {
        heading: 'Job Processing (Happy Path)',
        content: mermaidDiagrams['svc-convert-from-pdf'][3].content,
        type: 'mermaid',
      },
      {
        heading: '',
        content: 'The download and upload steps use streaming where possible so that the worker does not need to buffer the entire file in memory. For extremely large PDFs this is the difference between a successful conversion and an out-of-memory crash. The final "complete" step publishes a status update back through NATS so the Job Service can notify the client.',
        type: 'paragraph',
      },

      // — 4. Job Processing (Failure with Retry) —
      {
        heading: 'Handling Transient Failures',
        content: 'Not every failure is permanent. A conversion might fail because LibreOffice ran out of file descriptors, the object store returned a 503, or the worker was briefly CPU-throttled by the container runtime. When a failure occurs and retries remain, the service NAKs the NATS message with a calculated backoff delay. NATS will redeliver the message after that delay, and the next attempt may land on the same worker or a different one — either way the retry is transparent to the caller.',
        type: 'paragraph',
      },
      {
        heading: 'Job Processing (Failure with Retry)',
        content: mermaidDiagrams['svc-convert-from-pdf'][4].content,
        type: 'mermaid',
      },
      {
        heading: '',
        content: 'The retry count is tracked in the NATS message metadata, not in application state. This means a worker crash mid-retry does not lose the count — NATS itself is the source of truth. It also means the service can be redeployed between retries without resetting progress, which is important for zero-downtime rolling updates.',
        type: 'paragraph',
      },

      // — 5. Job Processing (Permanent Failure) —
      {
        heading: 'When All Retries Are Exhausted',
        content: 'If a job has failed through every retry attempt, it is considered a permanent failure. At this point the service marks the job as failed in the Job Service, so the end user sees a clear error instead of an endlessly spinning progress bar. The original NATS message is terminated so it leaves the consumer queue entirely, preventing it from blocking newer work.',
        type: 'paragraph',
      },
      {
        heading: 'Job Processing (Permanent Failure)',
        content: mermaidDiagrams['svc-convert-from-pdf'][5].content,
        type: 'mermaid',
      },
      {
        heading: '',
        content: 'Permanent failures are also logged with full context — the tool type, file size, retry count, and the last error message. This structured logging feeds into the analytics pipeline, letting the team spot patterns like "all pdf-to-excel jobs over 50 MB fail" and address them proactively rather than waiting for user complaints.',
        type: 'paragraph',
      },

      // — 6. Service Startup —
      {
        heading: 'Boot Sequence',
        content: 'The startup sequence is intentionally ordered to catch configuration problems as early as possible. The service connects to NATS first because every other operation depends on it — if NATS is unreachable, there is no point subscribing to subjects or starting a health check that would falsely report readiness. Only after subscriptions are confirmed does the health endpoint begin returning 200, which tells the orchestrator (Kubernetes, Docker Compose, etc.) that the service is ready to receive traffic.',
        type: 'paragraph',
      },
      {
        heading: 'Service Startup',
        content: mermaidDiagrams['svc-convert-from-pdf'][6].content,
        type: 'mermaid',
      },
      {
        heading: '',
        content: 'The health check is a lightweight HTTP endpoint rather than a NATS ping because container orchestrators already speak HTTP. Keeping the readiness probe on a separate port also means a flood of conversion traffic on the NATS connection cannot starve the health check, avoiding false-negative liveness failures that would trigger unnecessary restarts.',
        type: 'paragraph',
      },
    ],
  },
  {
    slug: 'flow-organize-pdf',
    title: 'Organize PDF Flow',
    description: 'Visual flow diagrams for the Organize PDF service — merge, split, rotate, watermark, sign, and edit.',
    category: 'flows',
    sections: [
      {
        heading: 'About This Service',
        content: 'The Organize PDF service handles all PDF manipulation operations using the pdfcpu Go library (no external binary dependency). It supports merge, split (4 modes), rotate, extract/remove/reorder pages, watermark, protect/unlock, visual signatures, text annotations, and page numbering.',
        type: 'paragraph',
      },
      {
        heading: 'Where It Fits',
        content: mermaidDiagrams['architecture'][0].content,
        type: 'mermaid',
      },
      // ── Component Diagram ──────────────────────────────────────────
      {
        heading: 'Inside the Organize PDF Service',
        content: 'Before diving into individual operations, it is worth understanding how the service is wired together internally. The component diagram below shows the three main pieces: a NATS consumer that receives job messages, a tool router that dispatches to the correct handler based on the requested operation, and a pdfcpu wrapper that does the actual PDF manipulation. This architecture means the service has no external binary dependencies — pdfcpu is a pure Go library compiled directly into the binary.',
        type: 'paragraph',
      },
      getMermaidSections('svc-organize-pdf')[0],
      {
        heading: 'Why a Tool Router Pattern',
        content: 'The tool router acts as a single entry point that maps a tool-type string to a handler function, keeping the NATS consumer completely unaware of which PDF operations exist. This means adding a new operation — say, a "flatten forms" tool — requires writing the handler and registering it in the router, with zero changes to the consumer or the message format. The pdfcpu wrapper is injected into each handler rather than imported directly, which makes unit testing straightforward since you can swap in a mock.',
        type: 'paragraph',
      },

      // ── Allowed Tool Types ────────────────────────────────────────────
      {
        heading: 'The Full Operation Catalog',
        content: 'The Organize PDF service is not a single-purpose worker — it handles twelve distinct PDF operations through that single tool router. The diagram below enumerates every supported tool type: merge, split, rotate, extract, remove, reorder, watermark, protect, unlock, sign, annotate, and page-numbers. Understanding this list matters because the API gateway validates the incoming tool type against exactly this set before dispatching the job.',
        type: 'paragraph',
      },
      getMermaidSections('svc-organize-pdf')[1],
      {
        heading: 'Scope Decisions and Boundaries',
        content: 'Notice that operations like OCR, compression, and repair are absent from this list — those belong to the Optimize PDF service. This boundary is deliberate: organize operations are structural (rearranging, combining, or annotating pages) while optimize operations transform content (re-encoding images, running text recognition). Keeping them in separate services means a CPU-heavy OCR job cannot starve a quick page-reorder, and each service can scale independently based on its own traffic profile.',
        type: 'paragraph',
      },

      // ── Worker Configuration ──────────────────────────────────────────
      {
        heading: 'Concurrency and Subscription Tuning',
        content: 'A NATS consumer that processes PDF files needs careful concurrency settings — too few workers and the queue backs up, too many and you exhaust memory manipulating large documents in parallel. The diagram below shows how the service configures its NATS subscription: the maximum number of concurrent handlers, the ack-wait timeout, and the redelivery policy for failed jobs.',
        type: 'paragraph',
      },
      getMermaidSections('svc-organize-pdf')[2],
      {
        heading: 'Balancing Throughput and Safety',
        content: 'The concurrency limit is set conservatively because pdfcpu loads entire pages into memory during manipulation. The ack-wait timeout is generous enough to handle a 200-page merge but short enough that a truly stuck worker gets its message redelivered within a reasonable window. These values are environment-configurable, so production and staging can run different profiles without a code change.',
        type: 'paragraph',
      },

      // ── Split PDF Processing ──────────────────────────────────────────
      {
        heading: 'Split: Four Modes, One Handler',
        content: 'Splitting a PDF sounds simple until you realize users want to split in very different ways. The diagram below walks through the four supported split modes: splitting by an explicit page range (e.g., pages 3-7 become a new file), splitting by count (every N pages becomes a separate file), splitting by target file size, and extracting every single page into its own document. Each mode shares the same download-process-upload skeleton but differs in how it determines page boundaries.',
        type: 'paragraph',
      },
      getMermaidSections('svc-organize-pdf')[3],
      {
        heading: 'Why Four Modes Instead of One',
        content: 'A generic "split at these page numbers" API could technically cover all cases, but it would push the boundary-calculation logic onto the client. By offering purpose-built modes, the frontend can present simple UIs — a slider for "split every N pages," a file-size target for email-friendly chunks — without reimplementing PDF page-counting logic in the browser. The handler picks the right pdfcpu call internally, and every mode produces a consistent output: a zip archive when multiple files result, or a single PDF when only one segment is generated.',
        type: 'paragraph',
      },

      // ── Rotate PDF Processing ─────────────────────────────────────────
      {
        heading: 'Rotate: Page Selection and Angle Application',
        content: 'Rotation is one of the simpler operations, but it has a subtlety that the diagram below highlights: users can rotate all pages by the same angle, or specify different angles for different page ranges. The handler first resolves the page selection (which can be "all," a comma-separated list, or a range expression), then applies the rotation in a single pdfcpu pass.',
        type: 'paragraph',
      },
      getMermaidSections('svc-organize-pdf')[4],
      {
        heading: 'Single-Pass Efficiency',
        content: 'Rather than loading the PDF, rotating one page, writing it out, and repeating, the handler collects all rotation instructions and applies them in one call. This matters for large documents because pdfcpu only needs to parse the page tree once. The rotation angles are normalized to multiples of 90 degrees on the server side, so even if the client sends 270, -90, or 450, the result is deterministic.',
        type: 'paragraph',
      },

      // ── Merge PDF Processing ──────────────────────────────────────────
      {
        heading: 'Merge: Multi-File Download and Ordered Assembly',
        content: 'Merging is the most I/O-intensive organize operation because it requires downloading multiple source files before any processing can begin. The diagram below traces the full lifecycle: downloading each input PDF from object storage in parallel, sorting them into the user-specified order, merging them with pdfcpu, and uploading the combined result. Pay attention to the parallel download step — it is the primary reason merge jobs take longer than other operations.',
        type: 'paragraph',
      },
      getMermaidSections('svc-organize-pdf')[5],
      {
        heading: 'Ordering Guarantees and Error Handling',
        content: 'The user specifies document order as an array of file IDs in the request, and the handler preserves that order exactly — even though downloads happen concurrently. If any single file fails to download (expired, deleted, corrupted), the entire merge is aborted rather than producing a partial result with missing pages. This fail-fast approach avoids a class of subtle bugs where a user gets a merged PDF and does not notice that one source document was silently dropped.',
        type: 'paragraph',
      },

      // ── Extract Pages Processing ──────────────────────────────────────
      {
        heading: 'Extract: Pulling Pages from a Source PDF',
        content: 'Page extraction is conceptually the inverse of merge — instead of combining multiple files, you are pulling a subset of pages out of a single file to create a new, smaller PDF. The diagram below shows how the handler interprets page range expressions (like "1-3,7,12-15"), validates them against the actual page count of the source document, and produces the output.',
        type: 'paragraph',
      },
      getMermaidSections('svc-organize-pdf')[6],
      {
        heading: 'Validation Before Processing',
        content: 'The handler validates that every requested page number actually exists in the source PDF before calling pdfcpu. This prevents cryptic library errors and gives the user a clear message like "page 25 requested but document only has 18 pages." The extraction preserves the original page dimensions and annotations — it is a structural copy, not a re-render, so there is zero quality loss and the operation completes in milliseconds even for large documents.',
        type: 'paragraph',
      },

      // ── Service Startup ───────────────────────────────────────────────
      {
        heading: 'Boot Sequence and NATS Connection',
        content: 'The final diagram covers what happens when the service starts up. Understanding the boot sequence matters for debugging deployment issues — if the service fails to connect to NATS, it will retry with exponential backoff rather than crashing immediately, and the health check endpoint will report "not ready" until the subscription is active. This is the sequence you will see in the logs when you deploy or restart the service.',
        type: 'paragraph',
      },
      getMermaidSections('svc-organize-pdf')[7],
      {
        heading: 'Startup Design Takeaways',
        content: 'The service validates its configuration (tool registry, pdfcpu availability, temp directory permissions) before attempting the NATS connection, so misconfiguration is caught immediately rather than on the first job. The NATS subscription uses a durable consumer name, which means restarting the service does not lose any queued messages — they will be redelivered to the new instance. The health endpoint only flips to "ready" after the subscription is confirmed, ensuring Kubernetes does not route traffic to a half-initialized pod.',
        type: 'paragraph',
      },
    ],
  },
  {
    slug: 'flow-optimize-pdf',
    title: 'Optimize PDF Flow',
    description: 'Visual flow diagrams for the Optimize PDF service — compression, OCR, and repair.',
    category: 'flows',
    sections: [
      {
        heading: 'About This Service',
        content: 'The Optimize PDF service handles PDF compression (Ghostscript), OCR (Tesseract via Poppler rendering), and PDF repair (Ghostscript and QPDF). It is a NATS consumer that processes jobs from the dispatch queue.',
        type: 'paragraph',
      },
      {
        heading: 'Where It Fits',
        content: mermaidDiagrams['architecture'][0].content,
        type: 'mermaid',
      },
      // ── 0. Component Diagram ──────────────────────────────────────────
      {
        heading: 'Inside the Optimize PDF Service',
        content:
          'Before diving into individual tool flows, it helps to see the big picture. The Optimize PDF service is a single NATS consumer that fans work out to three specialized adapters — Ghostscript for compression, Tesseract for OCR, and QPDF for repair. Understanding this internal wiring explains why each tool path looks different even though they share the same entry point.',
        type: 'paragraph',
      },
      getMermaidSections('svc-optimize-pdf')[0],
      {
        heading: 'Why This Layout Matters',
        content:
          'By routing through a single consumer into discrete adapters, the service avoids duplicating connection-management or retry logic. Each adapter owns exactly one responsibility, which makes it straightforward to swap out Ghostscript for another compressor — or add a fourth tool type — without touching the shared infrastructure. The diagram above is the map you will keep coming back to as we zoom into each path below.',
        type: 'paragraph',
      },

      // ── 1. Allowed Tool Types ──────────────────────────────────────────
      {
        heading: 'Which Tool Types Are Supported',
        content:
          'Not every request that reaches the optimize service is valid. The service enforces a strict allowlist of tool types — compress, ocr, and repair — at the router level, before any heavy processing begins. This means malformed or unsupported requests fail fast, saving CPU time and keeping logs clean.',
        type: 'paragraph',
      },
      getMermaidSections('svc-optimize-pdf')[1],
      {
        heading: 'Failing Fast on Unknown Tools',
        content:
          'If a request arrives with a tool type that is not in the allowlist, the router immediately returns an error to the caller without allocating any file-system resources. This guard is intentionally placed before file download so that a misconfigured client can never trigger unnecessary I/O. Think of it as the bouncer at the door — cheap to run, expensive problems avoided.',
        type: 'paragraph',
      },

      // ── 2. Service Architecture Pattern ────────────────────────────────
      {
        heading: 'The Shared Worker Pattern',
        content:
          'All three tool types share a common lifecycle: pull a message from NATS, download the source file, run a tool-specific binary, upload the result, and acknowledge the message. Rather than duplicating that lifecycle in three separate services, the optimize service uses a shared worker pattern where only the "run binary" step differs. This keeps deployment simple — one container, one health check, one set of resource limits.',
        type: 'paragraph',
      },
      getMermaidSections('svc-optimize-pdf')[2],
      {
        heading: 'Trade-offs of a Single Worker',
        content:
          'The obvious downside is that a misbehaving Ghostscript process can starve Tesseract jobs if they share the same concurrency pool. In practice, NATS consumer-level concurrency limits and per-tool timeouts mitigate this risk. If traffic patterns later demand isolation, splitting into separate consumers is a configuration change, not an architectural rewrite, precisely because the adapter boundaries are already clean.',
        type: 'paragraph',
      },

      // ── 3. Compress PDF Processing ─────────────────────────────────────
      {
        heading: 'How PDF Compression Works',
        content:
          'Compression is the most frequently used optimize tool. The service delegates to Ghostscript, which re-renders every page through a PostScript pipeline, stripping unused objects and down-sampling images according to the requested quality level. The quality parameter maps directly to Ghostscript PDFSETTINGS — "screen" for aggressive compression, "ebook" for balanced, and "printer" for near-lossless output.',
        type: 'paragraph',
      },
      getMermaidSections('svc-optimize-pdf')[3],
      {
        heading: 'Understanding Quality Levels',
        content:
          'Choosing the right quality level matters more than most users realize. A 50 MB scan-heavy PDF can shrink to 3 MB at "screen" quality, but text sharpness degrades noticeably. The "ebook" preset is the default because it strikes the best balance for the majority of documents. After Ghostscript finishes, the service performs a size comparison — if the output is somehow larger than the input (rare, but possible with already-optimized files), it returns the original and logs a warning rather than silently making things worse.',
        type: 'paragraph',
      },

      // ── 4. OCR PDF Processing ──────────────────────────────────────────
      {
        heading: 'How OCR Processing Works',
        content:
          'OCR is the most resource-intensive path. The service first uses Poppler to render each page into a high-DPI image, then feeds those images into Tesseract for text recognition, and finally reassembles the recognized text layer back into a searchable PDF. This three-stage pipeline exists because Tesseract cannot read PDF pages directly — it needs raster images as input.',
        type: 'paragraph',
      },
      getMermaidSections('svc-optimize-pdf')[4],
      {
        heading: 'Why Poppler Comes Before Tesseract',
        content:
          'You might wonder why we do not use a library that handles PDF-to-text in one step. The answer is control and quality. Poppler lets us choose the exact DPI for rendering (300 DPI by default), which directly affects OCR accuracy. Tesseract then operates on clean raster data without having to understand PDF internals. The final reconstruction step merges the original page geometry with the new text layer, preserving fonts and vector graphics while adding the invisible searchable text underneath.',
        type: 'paragraph',
      },

      // ── 5. Repair PDF Processing ───────────────────────────────────────
      {
        heading: 'How PDF Repair Works',
        content:
          'Corrupted PDFs are surprisingly common — truncated downloads, buggy export tools, and incompatible editors all produce files that viewers struggle with. The repair path uses a two-strategy approach: it first attempts a Ghostscript re-render (which rebuilds the cross-reference table and object stream), and if that fails, it falls back to QPDF linearization. Each strategy targets different classes of corruption.',
        type: 'paragraph',
      },
      getMermaidSections('svc-optimize-pdf')[5],
      {
        heading: 'Ghostscript vs. QPDF: When Each Wins',
        content:
          'Ghostscript excels at fixing structural corruption — broken xref tables, missing stream lengths, and mangled page trees — because it fully re-interprets the file. QPDF is better at fixing linearization issues and object-level damage because it operates at the PDF object graph level without re-rendering. By trying Ghostscript first (the heavier tool), the service handles the most common corruption patterns, then falls back to QPDF for the edge cases that Ghostscript cannot recover.',
        type: 'paragraph',
      },

      // ── 6. Failure and Retry Flow ──────────────────────────────────────
      {
        heading: 'What Happens When Things Go Wrong',
        content:
          'External binaries crash, disks fill up, and OOM kills happen. The optimize service uses exponential backoff with jitter to retry transient failures, capping at a configurable maximum number of attempts. This prevents a single corrupted file from flooding the system with rapid retries while still giving legitimate transient errors a fair chance to resolve.',
        type: 'paragraph',
      },
      getMermaidSections('svc-optimize-pdf')[6],
      {
        heading: 'The Dead Letter Safety Net',
        content:
          'After exhausting all retries, the message moves to a dead-letter subject where it can be inspected and replayed manually. This is critical for debugging — rather than silently dropping a failed job, the dead-letter queue preserves the full payload and error context. Operations teams can then determine whether the failure was caused by a genuinely corrupt input file or by a service bug that needs a code fix before replaying the batch.',
        type: 'paragraph',
      },
    ],
  },
  {
    slug: 'flow-analytics',
    title: 'Analytics Flow',
    description: 'Visual flow diagrams for the Analytics Service — event consumption and metrics tracking.',
    category: 'flows',
    sections: [
      {
        heading: 'About This Service',
        content: 'The Analytics Service is a NATS consumer that listens to analytics events published by other services (auth, job-service). It aggregates usage metrics, tracks conversion counts, and stores analytics data in PostgreSQL for admin dashboard reporting.',
        type: 'paragraph',
      },
      {
        heading: 'Where It Fits',
        content: mermaidDiagrams['architecture'][0].content,
        type: 'mermaid',
      },
      // ── Analytics Service Architecture ─────────────────────────────
      {
        heading: 'How the Analytics Consumer Works',
        content: 'The analytics service is not a typical HTTP server — it is a pure NATS consumer that never exposes a port. It subscribes to analytics event subjects published by auth-service and job-service, then processes those events asynchronously. This decoupled design means the services that generate events never wait for analytics to finish; they fire and forget, keeping latency low on the hot path.',
        type: 'paragraph',
      },
      getMermaidSections('svc-analytics')[0],
      {
        heading: 'Why a Dedicated Consumer',
        content: 'You might wonder why analytics is not just a library inside each service. The answer is operational independence. By isolating analytics into its own process, you can restart, scale, or redeploy it without touching auth or job-service. If the analytics consumer falls behind, NATS buffers the messages — no events are lost, and no upstream service is slowed down.',
        type: 'paragraph',
      },

      // ── Data Flow ─────────────────────────────────────────────────────
      {
        heading: 'From Raw Events to Stored Metrics',
        content: 'Once an event arrives, it does not go straight into the database. The consumer first validates and deserializes the message, then applies aggregation logic — grouping counts by time window, user type, and action. This pre-aggregation step is critical because writing one summarized row per interval is far cheaper than writing one row per event when traffic spikes.',
        type: 'paragraph',
      },
      getMermaidSections('svc-analytics')[1],
      {
        heading: 'PostgreSQL as the Analytics Store',
        content: 'The aggregated metrics land in PostgreSQL rather than a specialized time-series database. This was a deliberate trade-off: the admin dashboard already queries PostgreSQL for user and job data, so keeping analytics in the same database avoids introducing another infrastructure dependency. For the current scale, PostgreSQL handles the query patterns well, and the pre-aggregation keeps table sizes manageable.',
        type: 'paragraph',
      },
    ],
  },
  {
    slug: 'flow-cleanup',
    title: 'Cleanup Worker Flow',
    description: 'Visual flow diagrams for the Cleanup Worker — background cleanup of expired files, jobs, and stale uploads.',
    category: 'flows',
    sections: [
      {
        heading: 'About This Service',
        content: 'The Cleanup Worker is a ticker-based background process (not a NATS consumer) that runs on a configurable interval. It is job-service\'s own cleanup binary (job-service/cmd/cleanup) shipped in the cleanup-worker container, reusing job-service\'s models directly. It removes expired jobs and their objects from the MinIO uploads and outputs buckets, cleans up stale upload state from Redis, and aborts stale multipart uploads. It removes objects from storage first, then deletes the DB record, so crashes result in retried deletions rather than orphaned objects.',
        type: 'paragraph',
      },
      {
        heading: 'Where It Fits',
        content: mermaidDiagrams['architecture'][0].content,
        type: 'mermaid',
      },
      // ── Component Diagram ──────────────────────────────────────────
      {
        heading: 'Anatomy of the Cleanup Worker',
        content: 'Unlike the NATS-driven services in this system, the cleanup worker is ticker-based — it wakes up on a fixed interval, runs its tasks, and goes back to sleep. The component diagram below shows the major pieces: a scheduler loop, a set of cleanup task handlers, and the external systems they touch. Each task handler is independent, so a failure in one does not block the others from running.',
        type: 'paragraph',
      },
      getMermaidSections('svc-cleanup')[0],
      {
        heading: 'Why Ticker-Based Instead of Event-Driven',
        content: 'A cleanup worker does not need real-time responsiveness. Expired files and stale records can wait minutes or even hours before being removed. Using a simple ticker avoids the complexity of managing NATS subscriptions, retry logic, and exactly-once delivery for work that is inherently idempotent — running the same cleanup twice produces the same result.',
        type: 'paragraph',
      },

      // ── Cleanup Targets ───────────────────────────────────────────────
      {
        heading: 'What Gets Cleaned Up',
        content: 'The system accumulates three categories of waste over time: guest jobs that have passed their expiration window, upload state in Redis that was abandoned mid-flight, and files on disk that no longer have a corresponding database record. Each category has different detection criteria and different deletion strategies, which is why they are handled by separate task handlers.',
        type: 'paragraph',
      },
      getMermaidSections('svc-cleanup')[1],
      {
        heading: 'The Cost of Not Cleaning Up',
        content: 'Without the cleanup worker, object storage usage would grow unbounded as guest users convert files and never return to download them. Redis would accumulate keys for uploads that were started but never finished, and MinIO would hold half-finished multipart uploads. Over weeks, these orphaned resources add up — not just in storage costs, but in degraded performance as the buckets and Redis keyspace grow larger than necessary.',
        type: 'paragraph',
      },

      // ── Configuration ─────────────────────────────────────────────────
      {
        heading: 'Tuning the Cleanup Behavior',
        content: 'Every aspect of the cleanup worker is configurable: how often it runs, how long records must be idle before they qualify for deletion, and how many records to process in a single batch. These knobs exist because the right values depend on your deployment — a high-traffic instance needs shorter retention and larger batches, while a small self-hosted setup can afford to run cleanup less frequently.',
        type: 'paragraph',
      },
      getMermaidSections('svc-cleanup')[2],
      {
        heading: 'Sensible Defaults',
        content: 'The default configuration is tuned for a moderate workload: guest jobs expire after 24 hours, upload state is considered stale after 1 hour, and batches are capped at 100 records per cycle. These defaults keep the worker lightweight while preventing runaway resource consumption. If you are unsure what to change, start with the defaults and monitor disk usage trends.',
        type: 'paragraph',
      },

      // ── Main Loop ─────────────────────────────────────────────────────
      {
        heading: 'The Main Ticker Loop',
        content: 'The cleanup worker follows a straightforward loop: sleep for the configured interval, wake up, run every cleanup task in sequence, then go back to sleep. There is no task queue or priority system — simplicity is the point. The diagram below shows this loop and the order in which tasks execute.',
        type: 'paragraph',
      },
      getMermaidSections('svc-cleanup')[3],
      {
        heading: 'Graceful Shutdown',
        content: 'When the process receives a shutdown signal, it finishes the current task before exiting rather than terminating mid-deletion. This matters because partially deleted data — a file removed from disk but not from the database — would create inconsistencies that the next run would need to reconcile. Letting the current task complete avoids that edge case entirely.',
        type: 'paragraph',
      },

      // ── Cleanup Expired Guest Jobs ────────────────────────────────────
      {
        heading: 'Removing Expired Guest Jobs',
        content: 'Guest users do not have accounts, so their converted files have a limited shelf life. When a job passes its retention window, the cleanup worker needs to remove both the objects in the MinIO uploads and outputs buckets and the job record in the database. The order of these operations is not arbitrary — it is the most important design decision in this task.',
        type: 'paragraph',
      },
      getMermaidSections('svc-cleanup')[4],
      {
        heading: 'Delete Files First, Then Records',
        content: 'The worker removes the object from storage before removing the database record. If the process crashes between these two steps, the database still references an object that no longer exists — and the next cleanup run will simply try to remove the object again, see that it is already gone, and proceed to remove the database record. The alternative — deleting the record first — would leave an orphaned object in the bucket with no way to find it. This crash-safe ordering is a pattern worth remembering.',
        type: 'paragraph',
      },

      // ── Cleanup Stale Upload State ────────────────────────────────────
      {
        heading: 'Clearing Abandoned Upload State',
        content: 'When a user starts an upload, the system tracks its progress in Redis. If the user closes their browser or loses connectivity, that upload state lingers indefinitely. The cleanup worker identifies these abandoned entries by checking how long they have been idle and removes them, freeing Redis memory and preventing the upload tracker from growing without bound.',
        type: 'paragraph',
      },
      getMermaidSections('svc-cleanup')[5],
      {
        heading: 'Redis Key Expiry as a Safety Net',
        content: 'In addition to active cleanup, upload state keys in Redis are created with a TTL as a defense-in-depth measure. Even if the cleanup worker is down for an extended period, Redis will eventually evict the stale keys on its own. The cleanup worker handles the normal case; the TTL handles the edge case where the worker itself is unavailable.',
        type: 'paragraph',
      },

      // ── Cleanup Decision Flow ─────────────────────────────────────────
      {
        heading: 'How the Worker Decides What to Delete',
        content: 'Not every old record qualifies for cleanup. The decision tree below shows the criteria the worker evaluates for each candidate: Is it a guest job or an authenticated user job? Has it exceeded the retention period? Is there still an active download in progress? These checks prevent the worker from deleting something a user is actively waiting for.',
        type: 'paragraph',
      },
      getMermaidSections('svc-cleanup')[6],
      {
        heading: 'Erring on the Side of Caution',
        content: 'When in doubt, the cleanup worker skips the record and re-evaluates it on the next cycle. A file that lingers for one extra interval costs almost nothing, but a premature deletion means a user gets a broken download link. This conservative approach means the worker occasionally leaves a few extra records around, but it never destroys data that someone still needs.',
        type: 'paragraph',
      },
    ],
  },
];

// ============================================================================
// HELPERS
// ============================================================================

export const getDevDocBySlug = (slug: string): DevDocEntry | undefined => {
  return developerDocs.find((doc) => doc.slug === slug);
};
