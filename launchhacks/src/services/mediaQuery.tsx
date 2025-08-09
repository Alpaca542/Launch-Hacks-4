/**
 * Media Query Services
 *
 * A collection of utilities for fetching media from various APIs.
 */

// Google Custom Search API configuration
const GOOGLE_API_KEY = "AIzaSyD2LVnTgBbk-5Wo1V2sCmY9ebcmIPdS1ng";
const GOOGLE_CX = "93fe2cec9d77f4202";
const GOOGLE_SEARCH_API_URL = "https://www.googleapis.com/customsearch/v1";

// Tenor API configuration
const TENOR_API_KEY = "";
const TENOR_API_URL = "https://g.tenor.com/v1/search";

// YouTube Data API configuration
const YOUTUBE_API_KEY = "AIzaSyDxTJKoi1S8YjJZD12QTa4F9hV8fN8pNqo";
const YOUTUBE_API_URL = "https://www.googleapis.com/youtube/v3/search";

/**
 * Interface for Google Custom Search API response
 */
interface GoogleSearchResponse {
    items: Array<{
        link: string;
        title: string;
        snippet: string;
        pagemap?: {
            cse_image?: Array<{
                src: string;
            }>;
            cse_thumbnail?: Array<{
                src: string;
                width: string;
                height: string;
            }>;
        };
    }>;
    searchInformation: {
        totalResults: string;
    };
}

/**
 * Interface for Tenor API response
 */
interface TenorResponse {
    results: Array<{
        id: string;
        title: string;
        media: Array<{
            gif?: {
                url: string;
                dims: [number, number];
                size: number;
            };
            tinygif?: {
                url: string;
                dims: [number, number];
                size: number;
            };
            mediumgif?: {
                url: string;
                dims: [number, number];
                size: number;
            };
            mp4?: {
                url: string;
                dims: [number, number];
                size: number;
            };
        }>;
        tags: string[];
        itemurl: string;
        hasaudio: boolean;
        created: number;
    }>;
    next: string;
}

/**
 * Interface for YouTube API response
 */
interface YouTubeResponse {
    kind: string;
    etag: string;
    nextPageToken?: string;
    prevPageToken?: string;
    pageInfo: {
        totalResults: number;
        resultsPerPage: number;
    };
    items: Array<{
        kind: string;
        etag: string;
        id: {
            kind: string;
            videoId: string;
        };
        snippet: {
            publishedAt: string;
            channelId: string;
            title: string;
            description: string;
            thumbnails: {
                default: { url: string; width: number; height: number };
                medium: { url: string; width: number; height: number };
                high: { url: string; width: number; height: number };
            };
            channelTitle: string;
            liveBroadcastContent: string;
            publishTime: string;
        };
    }>;
}

// Caches to avoid repeated API calls
const googleImageCache = new Map<string, string>();
const tenorCache = new Map<string, string>();
const youtubeCache = new Map<string, string>();

/**
 * Fetches an image from Google Custom Search API
 *
 * @param searchTerm - The term to search for
 * @returns Promise with the URL of the found image or a fallback
 */
export const fetchImage = async (searchTerm: string): Promise<string> => {
    // Check cache first
    if (googleImageCache.has(searchTerm)) {
        return googleImageCache.get(searchTerm)!;
    }

    try {
        const encodedTerm = encodeURIComponent(searchTerm);
        const url = `${GOOGLE_SEARCH_API_URL}?key=${GOOGLE_API_KEY}&cx=${GOOGLE_CX}&q=${encodedTerm}&searchType=image&num=1&safe=active`;

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: GoogleSearchResponse = await response.json();

        if (data.items && data.items.length > 0) {
            const item = data.items[0];
            const imageUrl = item.link || item.pagemap?.cse_image?.[0]?.src;

            if (imageUrl) {
                googleImageCache.set(searchTerm, imageUrl);
                return imageUrl;
            }
        }

        // Fallback to a placeholder if no images found
        const fallbackUrl = `https://via.placeholder.com/640x360/e5e7eb/6b7280?text=${encodedTerm}`;
        googleImageCache.set(searchTerm, fallbackUrl);
        return fallbackUrl;
    } catch (error) {
        console.error("Error fetching Google image:", error);
        // Return a placeholder image in case of error
        const fallbackUrl = `https://via.placeholder.com/640x360/ef4444/ffffff?text=Image+Error`;
        googleImageCache.set(searchTerm, fallbackUrl);
        return fallbackUrl;
    }
};

/**
 * Fetches a GIF from Tenor API
 *
 * @param searchTerm - The term to search for
 * @returns Promise with the URL of the found GIF or a fallback
 */
export const fetchGif = async (searchTerm: string): Promise<string> => {
    // Check cache first
    if (tenorCache.has(searchTerm)) {
        return tenorCache.get(searchTerm)!;
    }

    try {
        const encodedTerm = encodeURIComponent("explained " + searchTerm);
        const url = `${TENOR_API_URL}?key=${TENOR_API_KEY}&q=${encodedTerm}&limit=1&media_filter=basic&contentfilter=medium`;

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: TenorResponse = await response.json();

        if (data.results && data.results.length > 0) {
            const result = data.results[0];
            // Prefer gif format, fallback to tinygif or mediumgif
            const gifUrl =
                result.media[0]?.gif?.url ||
                result.media[0]?.mediumgif?.url ||
                result.media[0]?.tinygif?.url;

            if (gifUrl) {
                tenorCache.set(searchTerm, gifUrl);
                return gifUrl;
            }
        }

        // Fallback to a placeholder if no GIFs found
        const fallbackUrl = `https://via.placeholder.com/300x200/9333ea/ffffff?text=${encodedTerm}+GIF`;
        tenorCache.set(searchTerm, fallbackUrl);
        return fallbackUrl;
    } catch (error) {
        console.error("Error fetching Tenor GIF:", error);
        // Return a placeholder GIF in case of error
        const fallbackUrl = `https://via.placeholder.com/300x200/ef4444/ffffff?text=GIF+Error`;
        tenorCache.set(searchTerm, fallbackUrl);
        return fallbackUrl;
    }
};

/**
 * Fetches a YouTube video ID
 *
 * @param searchTerm - The term to search for
 * @returns Promise with the ID of the found video or a fallback
 */
export const fetchVideo = async (searchTerm: string): Promise<string> => {
    // Check cache first
    if (youtubeCache.has(searchTerm)) {
        return youtubeCache.get(searchTerm)!;
    }

    try {
        const encodedTerm = encodeURIComponent(searchTerm);
        const url = `${YOUTUBE_API_URL}?key=${YOUTUBE_API_KEY}&q=${encodedTerm}&part=snippet&type=video&maxResults=1&videoEmbeddable=true&safeSearch=strict`;

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: YouTubeResponse = await response.json();

        if (data.items && data.items.length > 0) {
            const videoId = data.items[0].id.videoId;
            if (videoId) {
                youtubeCache.set(searchTerm, videoId);
                return videoId;
            }
        }

        // Fallback - return a placeholder video ID if no results found
        const fallbackVideoId = "dQw4w9WgXcQ"; // Rick Roll as fallback
        youtubeCache.set(searchTerm, fallbackVideoId);
        return fallbackVideoId;
    } catch (error) {
        console.error("Error fetching YouTube video:", error);
        // Return a fallback video ID in case of error
        const fallbackVideoId = "dQw4w9WgXcQ"; // Rick Roll as fallback
        youtubeCache.set(searchTerm, fallbackVideoId);
        return fallbackVideoId;
    }
};

/**
 * Helper to generate a YouTube embed URL from a video ID
 *
 * @param videoId - YouTube video ID
 * @returns Full YouTube embed URL
 */
export const getYouTubeEmbedUrl = (videoId: string): string => {
    return `https://www.youtube.com/embed/${videoId}`;
};

/**
 * Render Mermaid text to an <svg> element.
 *
 * @param diagram - The Mermaid definition, e.g. `"graph TD; A-->B"`.
 * @returns - A Promise that resolves to an SVGSVGElement ready to insert into the DOM.
 *
 * No globals, no timers, no side effects. If @mermaid-js/mermaid is already on
 * the page (window.mermaid) it is reused; otherwise the library is imported
 * dynamically. Initialization happens exactly once.
 */
export async function mermaidToSvg(diagram: string): Promise<SVGSVGElement> {
    // Load mermaid (ES module or the global one that a <script> tag might add)
    const mermaidModule = await import("mermaid");
    const mermaidAPI =
        mermaidModule.default ?? (window as any).mermaid?.mermaidAPI;

    // Initialise once
    if (!(window as any).___mermaidInitialised) {
        mermaidAPI.initialize({
            startOnLoad: false,
            theme: "default",
            securityLevel: "loose",
            fontFamily: "inherit",
        });
        (window as any).___mermaidInitialised = true;
    }

    // Ask mermaidAPI to render → svg string
    let svg: string;
    try {
        const renderResult = await mermaidAPI.render(
            "m_" + Math.random().toString(36).slice(2),
            diagram.trim()
        );
        svg = renderResult.svg;
    } catch (err) {
        throw err;
    }

    // Convert the SVG string to a live element
    const doc = new DOMParser().parseFromString(svg, "image/svg+xml");
    return doc.documentElement as unknown as SVGSVGElement;
}

/**
 * Media utility exports
 */
export const MediaService = {
    fetchImage,
    fetchGif,
    fetchVideo,
    getYouTubeEmbedUrl,
    mermaidToSvg,
};
