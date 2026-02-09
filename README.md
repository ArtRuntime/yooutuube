# URL Shortener with Analytics & Rich Previews

A premium URL shortener built with Next.js 14, TypeScript, Tailwind CSS, and MongoDB.

## Features

-   🔗 **URL Shortening**: Generate unique, short links for any URL.
-   🖼️ **Rich Previews**: Preserves Open Graph tags (Title, Description, Image) so your links look great on social media (Discord, WhatsApp, etc.).
-   📊 **Advanced Analytics**: Tracks clicks, IP addresses, User Agents, and Locations.
-   🌍 **Geolocation**: Captures city/country from IP and requests precise GPS coordinates from users.
-   ✨ **Premium UI**: Modern dark-mode interface with glassmorphism and smooth animations.

## Tech Stack

-   **Framework**: Next.js 14 (App Router)
-   **Language**: TypeScript
-   **Styling**: Tailwind CSS
-   **Database**: MongoDB (Mongoose)
-   **Utilities**: `nanoid` (ID generation), `open-graph-scraper` (Metadata), `geoip-lite` (IP Geolocation)

## Getting Started

### Prerequisites

-   Node.js 18+
-   MongoDB (Local or Docker)

### Installation

1.  **Clone the repository** (if applicable) or navigate to the project directory.

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Start MongoDB**:
    If you don't have a local instance, you can run one via Docker:
    ```bash
    docker run -d -p 27017:27017 --name mongodb mongo:latest
    ```

4.  **Environment Variables**:
    The project comes with a `.env.local` pre-configured for local development:
    ```env
    MONGODB_URI=mongodb://localhost:27017/yooutuube
    BASE_URL=http://localhost:3000
    ```

5.  **Run the development server**:
    ```bash
    npm run dev
    ```

6.  **Open the app**:
    Visit [http://localhost:3000](http://localhost:3000)

## Project Structure

-   `src/app/api/shorten`: API to create short links.
-   `src/app/api/track`: API to log analytics.
-   `src/app/[shortCode]`: Dynamic route that handles redirection and preview rendering.
-   `src/models`: Mongoose schemas for `Url` and `Analytics`.
-   `src/components`: UI components (`UrlForm`, etc.).

## Analytics

Analytics data is stored in the `analytics` collection in MongoDB. Each entry includes:
-   `shortCode`
-   `ip`
-   `city`, `country`
-   `userAgent`
-   `latitude`, `longitude` (if permission granted)
-   `timestamp`

## License

MIT
