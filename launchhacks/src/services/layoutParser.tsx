/**
 * Layout Parser Service
 *
 * Converts AI-generated content arrays into rich HTML layouts for educational nodes.
 * Supports 16+ different layout types including text, images, videos, diagrams, and interactive content.
 *
 * Each layout follows a specific schema and renders responsive, accessible HTML with:
 * - Optimized image loading and error handling
 * - Mermaid diagram rendering
 * - Video embedding support
 * - Timeline and card layouts
 * - Consistent styling and animations
 */

import {
    fetchImage,
    fetchGif,
    fetchVideo,
    getYouTubeEmbedUrl,
    mermaidToSvg,
} from "./mediaQuery";

export interface ParsedLayoutContent {
    html: string;
}

/**
 * Parses AI-generated content based on layout schema and returns fully loaded HTML
 */
export const parseLayoutContent = async (
    layoutNumber: number,
    content: any[],
    nodeId: string
): Promise<ParsedLayoutContent> => {
    let html = "";

    try {
        switch (layoutNumber) {
            case 1:
                html = await parseLayout1(content, nodeId);
                break;
            case 2:
                html = await parseLayout2(content, nodeId);
                break;
            case 3:
                html = await parseLayout3(content, nodeId);
                break;
            case 4:
                html = await parseLayout4(content, nodeId);
                break;
            case 5:
                html = await parseLayout5(content, nodeId);
                break;
            case 6:
                html = await parseLayout6(content, nodeId);
                break;
            case 7:
                html = await parseLayout7(content, nodeId);
                break;
            case 8:
                html = await parseLayout8(content, nodeId);
                break;
            case 9:
                html = await parseLayout9(content, nodeId);
                break;
            case 12:
                html = await parseLayout12(content, nodeId);
                break;
            case 13:
                html = await parseLayout13(content, nodeId);
                break;
            case 14:
                html = await parseLayout14(content, nodeId);
                break;
            case 15:
                html = await parseLayout15(content, nodeId);
                break;
            case 16:
                html = await parseLayout16(content, nodeId);
                break;
            default:
                html = await parseLayout1(content, nodeId);
        }
    } catch (error) {
        console.error("Error parsing layout content:", error);
        html = `<div class="error-content">Error loading content</div>`;
    }

    return { html };
};

// Layout 1: Title, textbar, images
async function parseLayout1(content: any[], _nodeId: string): Promise<string> {
    const [title, textbar, imagePrompts] = content;

    let html = `
        <div class="layout-1">
            <h2 class="layout-title">${title || "Title"}</h2>
            <div class="layout-textbar">${textbar || "Content"}</div>
            <div class="layout-images">
    `;

    if (Array.isArray(imagePrompts)) {
        // Fetch all images concurrently
        const imageUrls = await Promise.all(
            imagePrompts.map((prompt) => fetchImage(prompt).catch(() => null))
        );

        imageUrls.forEach((url, index) => {
            if (url) {
                html += `<img class="layout-small-image" src="${url}" alt="Image ${
                    index + 1
                }" />`;
            } else {
                html += `<div class="image-error">Error loading image ${
                    index + 1
                }</div>`;
            }
        });
    }

    html += `
            </div>
        </div>
    `;

    return html;
}

// Layout 2: Flexible image-caption pairs (handles both nested arrays and flat alternating arrays)
async function parseLayout2(content: any[], _nodeId: string): Promise<string> {
    let html = `<div class="layout-2">`;

    // Handle different content structures
    let imageCaptionPairs: Array<[string, string]> = [];

    // Check if content is nested arrays [[img, cap], [img, cap]] or flat [img, cap, img, cap]
    if (content.length > 0 && Array.isArray(content[0])) {
        // Nested array format: [[image1, caption1], [image2, caption2], ...]
        imageCaptionPairs = content.filter(
            (item) => Array.isArray(item) && item.length >= 2
        ) as Array<[string, string]>;
    } else {
        // Flat array format: [image1, caption1, image2, caption2, ...]
        for (let i = 0; i < content.length; i += 2) {
            if (i + 1 < content.length) {
                imageCaptionPairs.push([content[i], content[i + 1]]);
            }
        }
    }

    // Fetch all images concurrently
    const imagePromises = imageCaptionPairs.map(
        async ([imagePrompt, caption]) => {
            try {
                const url = await fetchImage(imagePrompt);
                return { url, caption };
            } catch {
                return { url: null, caption };
            }
        }
    );

    const imageResults = await Promise.all(imagePromises);

    imageResults.forEach(({ url, caption }, index) => {
        if (url) {
            html += `
                <div class="layout-image-caption">
                    <img class="layout-image" src="${url}" alt="Image ${
                index + 1
            }" />
                    <p class="layout-caption">${caption}</p>
                </div>
            `;
        } else {
            html += `
                <div class="layout-image-caption">
                    <div class="image-error">Error loading image ${
                        index + 1
                    }</div>
                    <p class="layout-caption">${caption}</p>
                </div>
            `;
        }
    });

    html += `</div>`;
    return html;
}

// Layout 3: Mermaid flowchart with description
async function parseLayout3(content: any[], nodeId: string): Promise<string> {
    const [mermaidCode, description] = content;
    const diagramId = `mermaid-${nodeId}`;

    let html = `
        <div class="layout-3">
            <div id="${diagramId}" class="layout-mermaid">Loading diagram...</div>
            <p class="layout-description">${description || ""}</p>
        </div>
    `;

    try {
        const svg = await mermaidToSvg(mermaidCode);
        // Replace the loading text with the actual SVG
        html = html.replace("Loading diagram...", svg.outerHTML);
    } catch (error) {
        html = html.replace(
            "Loading diagram...",
            '<div class="mermaid-error">Error loading diagram</div>'
        );
    }

    return html;
}

// Layout 4: Mermaid mindmap with description
async function parseLayout4(content: any[], nodeId: string): Promise<string> {
    const [mermaidCode, description] = content;
    const diagramId = `mermaid-${nodeId}`;

    let html = `
        <div class="layout-4">
            <div id="${diagramId}" class="layout-mermaid">Loading mindmap...</div>
            <p class="layout-description">${description || ""}</p>
        </div>
    `;

    try {
        const svg = await mermaidToSvg(mermaidCode);
        html = html.replace("Loading mindmap...", svg.outerHTML);
    } catch (error) {
        html = html.replace(
            "Loading mindmap...",
            '<div class="mermaid-error">Error loading mindmap</div>'
        );
    }

    return html;
}

// Layout 5: Mermaid piechart with description
async function parseLayout5(content: any[], nodeId: string): Promise<string> {
    const [mermaidCode, description] = content;
    const diagramId = `mermaid-${nodeId}`;

    let html = `
        <div class="layout-5">
            <div id="${diagramId}" class="layout-mermaid">Loading piechart...</div>
            <p class="layout-description">${description || ""}</p>
        </div>
    `;

    try {
        const svg = await mermaidToSvg(mermaidCode);
        html = html.replace("Loading piechart...", svg.outerHTML);
    } catch (error) {
        html = html.replace(
            "Loading piechart...",
            '<div class="mermaid-error">Error loading piechart</div>'
        );
    }

    return html;
}

// Layout 6: Mermaid quadrant chart with description
async function parseLayout6(content: any[], nodeId: string): Promise<string> {
    const [mermaidCode, description] = content;
    const diagramId = `mermaid-${nodeId}`;

    let html = `
        <div class="layout-6">
            <div id="${diagramId}" class="layout-mermaid">Loading quadrant chart...</div>
            <p class="layout-description">${description || ""}</p>
        </div>
    `;

    try {
        const svg = await mermaidToSvg(mermaidCode);
        html = html.replace("Loading quadrant chart...", svg.outerHTML);
    } catch (error) {
        html = html.replace(
            "Loading quadrant chart...",
            '<div class="mermaid-error">Error loading quadrant chart</div>'
        );
    }

    return html;
}

// Layout 7: Featured concept - large visual with comprehensive educational content
async function parseLayout7(content: any[], nodeId: string): Promise<string> {
    const [imagePrompt, title, paragraph1, paragraph2, paragraph3] = content;
    const imageId = `img-${nodeId}`;

    try {
        const imageUrl = await fetchImage(imagePrompt);

        let html = `
            <div class="layout-7">
                <div class="layout-visual-section">
                    <img id="${imageId}" class="layout-featured-image" src="${imageUrl}" alt="Featured Visual" />
                </div>
                <div class="layout-content-section">
                    <h2 class="layout-title">${title || "Educational Topic"}</h2>
                    <div class="layout-educational-content">
                        ${paragraph1 ? `<p class="layout-paragraph">${paragraph1}</p>` : ""}
                        ${paragraph2 ? `<p class="layout-paragraph">${paragraph2}</p>` : ""}
                        ${paragraph3 ? `<p class="layout-paragraph">${paragraph3}</p>` : ""}
                    </div>
                </div>
            </div>
        `;

        return html;
    } catch (error) {
        let html = `
            <div class="layout-7">
                <div class="layout-visual-section">
                    <div class="image-error">Error loading featured image</div>
                </div>
                <div class="layout-content-section">
                    <h2 class="layout-title">${title || "Educational Topic"}</h2>
                    <div class="layout-educational-content">
                        ${paragraph1 ? `<p class="layout-paragraph">${paragraph1}</p>` : ""}
                        ${paragraph2 ? `<p class="layout-paragraph">${paragraph2}</p>` : ""}
                        ${paragraph3 ? `<p class="layout-paragraph">${paragraph3}</p>` : ""}
                    </div>
                </div>
            </div>
        `;

        return html;
    }
}

// Layout 8: Large image right, title and small images left
async function parseLayout8(content: any[], nodeId: string): Promise<string> {
    const [imagePrompt, title, smallImagePrompts] = content;
    const mainImageId = `img-main-${nodeId}`;

    try {
        // Fetch main image
        const mainImageUrl = await fetchImage(imagePrompt);

        let html = `
            <div class="layout-8">
                <div class="layout-left">
                    <h2 class="layout-title">${title || "Title"}</h2>
                    <div class="layout-small-images">
        `;

        // Fetch small images if they exist
        if (Array.isArray(smallImagePrompts)) {
            const smallImageUrls = await Promise.all(
                smallImagePrompts.map((prompt) =>
                    fetchImage(prompt).catch(() => null)
                )
            );

            smallImageUrls.forEach((url, index) => {
                if (url) {
                    html += `<img class="layout-small-image" src="${url}" alt="Small Image ${
                        index + 1
                    }" />`;
                } else {
                    html += `<div class="image-error">Error loading image ${
                        index + 1
                    }</div>`;
                }
            });
        }

        html += `
                    </div>
                </div>
                <div class="layout-right">
                    <img id="${mainImageId}" class="layout-large-image" src="${mainImageUrl}" alt="Main Image" />
                </div>
            </div>
        `;

        return html;
    } catch (error) {
        let html = `
            <div class="layout-8">
                <div class="layout-left">
                    <h2 class="layout-title">${title || "Title"}</h2>
                    <div class="layout-small-images">
                        <div class="image-error">Error loading images</div>
                    </div>
                </div>
                <div class="layout-right">
                    <div class="image-error">Error loading main image</div>
                </div>
            </div>
        `;

        return html;
    }
}

// Layout 9: Video player with caption
async function parseLayout9(content: any[], nodeId: string): Promise<string> {
    const [videoPrompt, caption] = content;
    const videoId = `video-${nodeId}`;

    try {
        const videoIdResult = await fetchVideo(videoPrompt);
        const embedUrl = getYouTubeEmbedUrl(videoIdResult);

        let html = `
            <div class="layout-9">
                <div id="${videoId}" class="layout-video">
                    <iframe src="${embedUrl}" frameborder="0" allowfullscreen></iframe>
                </div>
                <p class="layout-caption">${caption || ""}</p>
            </div>
        `;

        return html;
    } catch (error) {
        let html = `
            <div class="layout-9">
                <div id="${videoId}" class="layout-video">
                    <div class="video-error">Error loading video</div>
                </div>
                <p class="layout-caption">${caption || ""}</p>
            </div>
        `;

        return html;
    }
}

// Layout 12: Central illustration with icon-driven key points
async function parseLayout12(content: any[], nodeId: string): Promise<string> {
    const [illustrationPrompt, iconPoints] = content;
    const illustrationId = `illustration-${nodeId}`;

    try {
        const illustrationUrl = await fetchImage(illustrationPrompt);

        let html = `
            <div class="layout-12">
                <div class="layout-central-visual">
                    <img id="${illustrationId}" class="layout-central-image" src="${illustrationUrl}" alt="Central Illustration" />
                </div>
                <div class="layout-icon-points">
        `;

        if (Array.isArray(iconPoints)) {
            iconPoints.forEach((point, index) => {
                // Extract icon hint if present (e.g., "🚀 Launch sequence initiated")
                const iconMatch = point.match(
                    /^(\p{Emoji}|\p{Symbol})\s+(.+)$/u
                );
                const icon = iconMatch ? iconMatch[1] : "●";
                const text = iconMatch ? iconMatch[2] : point;

                html += `
                    <div class="layout-icon-point">
                        <span class="layout-point-icon">${icon}</span>
                        <span class="layout-point-text">${text}</span>
                    </div>
                `;
            });
        }

        html += `
                </div>
            </div>
        `;

        return html;
    } catch (error) {
        let html = `
            <div class="layout-12">
                <div class="layout-central-visual">
                    <div class="image-error">Error loading illustration</div>
                </div>
                <div class="layout-icon-points">
        `;

        if (Array.isArray(iconPoints)) {
            iconPoints.forEach((point, index) => {
                const iconMatch = point.match(
                    /^(\p{Emoji}|\p{Symbol})\s+(.+)$/u
                );
                const icon = iconMatch ? iconMatch[1] : "●";
                const text = iconMatch ? iconMatch[2] : point;

                html += `
                    <div class="layout-icon-point">
                        <span class="layout-point-icon">${icon}</span>
                        <span class="layout-point-text">${text}</span>
                    </div>
                `;
            });
        }

        html += `
                </div>
            </div>
        `;

        return html;
    }
}

// Layout 13: Title and text left, large video right
async function parseLayout13(content: any[], nodeId: string): Promise<string> {
    const [title, text, videoPrompt] = content;
    const videoId = `video-${nodeId}`;

    try {
        const videoIdResult = await fetchVideo(videoPrompt);
        const embedUrl = getYouTubeEmbedUrl(videoIdResult);

        let html = `
            <div class="layout-13">
                <div class="layout-left">
                    <h2 class="layout-title">${title || "Title"}</h2>
                    <p class="layout-text">${text || ""}</p>
                </div>
                <div class="layout-right">
                    <div id="${videoId}" class="layout-video">
                        <iframe src="${embedUrl}" frameborder="0" allowfullscreen></iframe>
                    </div>
                </div>
            </div>
        `;

        return html;
    } catch (error) {
        let html = `
            <div class="layout-13">
                <div class="layout-left">
                    <h2 class="layout-title">${title || "Title"}</h2>
                    <p class="layout-text">${text || ""}</p>
                </div>
                <div class="layout-right">
                    <div id="${videoId}" class="layout-video">
                        <div class="video-error">Error loading video</div>
                    </div>
                </div>
            </div>
        `;

        return html;
    }
}

// Layout 14: Comprehensive topic with alternating sections (like Mars example)
async function parseLayout14(content: any[], nodeId: string): Promise<string> {
    let html = `<div class="layout-14">`;

    // Handle flat alternating array: [imagePrompt, text, imagePrompt, text, ...]
    for (let i = 0; i < content.length; i += 2) {
        const imagePrompt = content[i];
        const text = content[i + 1];

        if (imagePrompt && text) {
            const sectionIndex = i / 2;
            const isEven = sectionIndex % 2 === 0;

            try {
                const imageUrl = await fetchImage(imagePrompt);
                html += `
                    <div class="layout-section ${
                        isEven
                            ? "layout-section-normal"
                            : "layout-section-reverse"
                    }">
                        <div class="layout-section-image">
                            <img class="layout-large-image" src="${imageUrl}" alt="Section ${
                    sectionIndex + 1
                }" />
                        </div>
                        <div class="layout-section-content">
                            <p class="layout-text">${text}</p>
                        </div>
                    </div>
                `;
            } catch (error) {
                html += `
                    <div class="layout-section ${
                        isEven
                            ? "layout-section-normal"
                            : "layout-section-reverse"
                    }">
                        <div class="layout-section-image">
                            <div class="image-error">Error loading image</div>
                        </div>
                        <div class="layout-section-content">
                            <p class="layout-text">${text}</p>
                        </div>
                    </div>
                `;
            }
        }
    }

    html += `</div>`;
    return html;
}

// Layout 15: Timeline layout with chronological image-text pairs
async function parseLayout15(content: any[], nodeId: string): Promise<string> {
    let html = `<div class="layout-15">`;

    // Handle flat alternating array: [date1, imagePrompt1, event1_description, date2, imagePrompt2, event2_description, ...]
    for (let i = 0; i < content.length; i += 3) {
        const date = content[i];
        const imagePrompt = content[i + 1];
        const eventDescription = content[i + 2];

        if (date && imagePrompt && eventDescription) {
            try {
                const imageUrl = await fetchImage(imagePrompt);
                html += `
                    <div class="layout-timeline-item">
                        <div class="layout-timeline-date">${date}</div>
                        <img class="layout-timeline-image" src="${imageUrl}" alt="Timeline event" />
                        <div class="layout-timeline-content">
                            <p class="layout-timeline-text">${eventDescription}</p>
                        </div>
                    </div>
                `;
            } catch (error) {
                html += `
                    <div class="layout-timeline-item">
                        <div class="layout-timeline-date">${date}</div>
                        <div class="image-error">Error loading image</div>
                        <div class="layout-timeline-content">
                            <p class="layout-timeline-text">${eventDescription}</p>
                        </div>
                    </div>
                `;
            }
        }
    }

    html += `</div>`;
    return html;
}

// Layout 16: Card grid layout with multiple topic cards
async function parseLayout16(content: any[], nodeId: string): Promise<string> {
    let html = `<div class="layout-16">`;

    // Handle flat alternating array: [card1_title, card1_imagePrompt, card1_description, card2_title, card2_imagePrompt, card2_description, ...]
    for (let i = 0; i < content.length; i += 3) {
        const cardTitle = content[i];
        const imagePrompt = content[i + 1];
        const cardDescription = content[i + 2];

        if (cardTitle && imagePrompt && cardDescription) {
            try {
                const imageUrl = await fetchImage(imagePrompt);
                html += `
                    <div class="layout-card">
                        <h3 class="layout-card-title">${cardTitle}</h3>
                        <img class="layout-card-image" src="${imageUrl}" alt="${cardTitle}" />
                        <p class="layout-card-description">${cardDescription}</p>
                    </div>
                `;
            } catch (error) {
                html += `
                    <div class="layout-card">
                        <h3 class="layout-card-title">${cardTitle}</h3>
                        <div class="image-error">Error loading image</div>
                        <p class="layout-card-description">${cardDescription}</p>
                    </div>
                `;
            }
        }
    }

    html += `</div>`;
    return html;
}
