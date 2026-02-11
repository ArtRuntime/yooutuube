# API Documentation

Base URL: `https://yooutuube.vercel.app` (or your local environment `http://localhost:3000`)

## 1. Shorten URL

Creates a new shortened URL with Open Graph metadata and analytics tracking enabled.

- **Endpoint**: `/api/shorten`
- **Method**: `POST`
- **Content-Type**: `application/json`

### Request Body

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `url` | `string` | Yes | The destination URL to shorten. Must be a valid URL. |

### Response (Success - 201 Created)

```json
{
  "shortCode": "AbCd1234",
  "originalUrl": "https://www.youtube.com/watch?v=example",
  "ogData": {
    "title": "Video Title",
    "description": "Video Description",
    "image": "https://i.ytimg.com/vi/example/maxresdefault.jpg",
    "siteName": "YouTube",
    "favicon": "https://www.youtube.com/favicon.ico"
  }
}
```

> **Note on Domains**: The `shortCode` returned is the unique identifier. You can construct the full short URL using any of your configured domains (e.g., `https://yooutuube.vercel.app/AbCd1234` or `https://youtube.opao.lol/AbCd1234`).

### Response (Error - 400/429/500)

```json
{
  "error": "URL is required" // or "Invalid URL format", "Rate limit exceeded..."
}
```

---

## 2. Track Visit (Analytics)

Logs a visit to a short link. This is typically called automatically by the client-side redirection page to capture precise geolocation and client hints.

- **Endpoint**: `/api/track`
- **Method**: `POST`
- **Content-Type**: `application/json`

### Request Body

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `shortCode` | `string` | Yes | The short code of the visited link. |
| `latitude` | `number` | No | Client geolocation latitude. |
| `longitude` | `number` | No | Client geolocation longitude. |

### Response (Success - 200 OK)

```json
{
  "success": true
}
```

---

## 3. Get Analytics

Retrieves the latest analytics data for a specific short code.

- **Endpoint**: `/api/analytics`
- **Method**: `GET`
- **Query Parameters**:
  - `code` (Required): The short code to retrieve analytics for.

### Example Request
`GET /api/analytics?code=AbCd1234`

### Response (Success - 200 OK)

Returns an array of access log objects (limit 100, newest first).

```json
[
  {
    "_id": "65c4a...", // or integer ID for SQL adapters
    "shortCode": "AbCd1234",
    "ip": "203.0.113.1",
    "city": "San Francisco",
    "country": "US",
    "userAgent": "Mozilla/5.0...",
    "timestamp": "2024-02-09T12:00:00.000Z",
    "latitude": 37.7749,
    "longitude": -122.4194
  },
  // ... more logs
]
```

### Response (Error - 400/500)

```json
{
  "error": "Code is required"
}
```

---

## 4. Redirect (Short Link)

The public-facing redirection route.

- **URL**: `/[shortCode]`
- **Method**: `GET`

### Behavior
1.  **Server-Side**: Fetches the URL metadata (OG tags, favicon) and renders a static HTML page with these tags for social media previews.
2.  **Client-Side**: The page executes JavaScript to:
    - Attempt to fetch the user's geolocation.
    - Send a tracking request to `/api/track`.
    - Redirect the browser to the `originalUrl`.
