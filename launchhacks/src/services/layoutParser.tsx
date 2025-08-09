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
 * - Markdown text rendering
 * - Consistent styling and animations
 *
 * DRAGGABLE CORE ELEMENT CLASSES:
 * - .draggable-header-block: Title + description/textbar combinations
 * - .draggable-image-block: Single image with optional caption
 * - .draggable-image-grid: Collection of multiple images
 * - .draggable-text-block: Standalone text content/paragraphs
 * - .draggable-point-item: Individual bullet point or educational point
 * - .draggable-diagram-block: Mermaid diagrams and charts
 * - .draggable-video-block: Video player with controls
 * - .draggable-code-block: Code snippets with syntax highlighting
 * - .draggable-timeline-item: Individual timeline events
 * - .draggable-card-item: Individual cards in grid layouts
 * - .draggable-section-block: Complete sections in alternating layouts
 */

import {
    fetchImage,
    fetchVideo,
    getYouTubeEmbedUrl,
    mermaidToSvg,
} from "./mediaQuery";
import { renderMarkdown } from "../utils/markdown";

export interface ParsedLayoutContent {
    html: string;
}

/**
 * Helper function to fetch image with consistent error handling
 */
async function fetchImageWithErrorHandling(
    imagePrompt: string,
    altText: string = "Educational image",
    errorMessage: string = "Image unavailable"
): Promise<{ success: boolean; html: string }> {
    try {
        const url = await fetchImage(imagePrompt);
        return {
            success: true,
            html: `<img class="layout-image" src="${url}" alt="${altText}" loading="lazy" />`,
        };
    } catch (error) {
        console.warn("Image fetch failed:", error);
        return {
            success: false,
            html: `<div class="image-error">
                <div class="error-icon">⚠️</div>
                <span class="error-message">${errorMessage}</span>
            </div>`,
        };
    }
}

/**
 * Helper function to validate content array structure
 */
function validateContentArray(
    content: any[],
    expectedLength: number,
    layoutNumber: number
): boolean {
    if (!Array.isArray(content)) {
        console.warn(`Layout ${layoutNumber}: Content is not an array`);
        return false;
    }

    if (content.length < expectedLength) {
        console.warn(
            `Layout ${layoutNumber}: Content array has ${content.length} items, expected at least ${expectedLength}`
        );
        return false;
    }

    return true;
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

    // Validate input parameters
    if (!Array.isArray(content) || content.length === 0) {
        console.warn(`Layout ${layoutNumber}: Empty or invalid content array`);
        return {
            html: `<div class="layout-error">
                <div class="error-icon">⚠️</div>
                <div class="error-message">No content available</div>
            </div>`,
        };
    }

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
            case 17:
                html = await parseLayout17(content, nodeId);
                break;
            case 18:
                html = await parseLayout18(content, nodeId);
                break;
            default:
                console.warn(
                    `Layout ${layoutNumber} not implemented, falling back to layout 1`
                );
                html = await parseLayout1(content, nodeId);
        }

        // Validate output
        if (!html || html.trim().length === 0) {
            throw new Error("Layout parser returned empty HTML");
        }
    } catch (error) {
        console.error(`Error parsing layout ${layoutNumber}:`, error);
        html = `
            <div class="layout-error">
                <div class="error-icon">⚠️</div>
                <div class="error-message">
                    <strong>Layout Error</strong><br>
                    Unable to render content for layout ${layoutNumber}
                </div>
                <div class="error-details">
                    ${
                        error instanceof Error
                            ? error.message
                            : "Unknown error occurred"
                    }
                </div>
            </div>
        `;
    }

    return { html };
};

// Layout 1: Enhanced title, textbar, images with better organization
async function parseLayout1(content: any[], _nodeId: string): Promise<string> {
    const [title, textbar, imagePrompts] = content;

    let html = `
        <div class="layout-1">
            <div class="layout-header draggable-header-block">
                <h2 class="layout-title">${renderMarkdown(
                    title || "Educational Topic"
                )}</h2>
                <div class="layout-textbar">${renderMarkdown(
                    textbar || "Content description"
                )}</div>
            </div>
    `;

    if (Array.isArray(imagePrompts) && imagePrompts.length > 0) {
        html += `<div class="layout-images draggable-image-grid">`;

        // Fetch all images concurrently
        const imageUrls = await Promise.all(
            imagePrompts.map((prompt) => fetchImage(prompt).catch(() => null))
        );

        imageUrls.forEach((url, index) => {
            if (url) {
                html += `
                    <div class="layout-image-wrapper draggable-image-block">
                        <img class="layout-small-image" src="${url}" alt="Illustration ${
                    index + 1
                }" loading="lazy" />
                    </div>
                `;
            } else {
                html += `
                    <div class="layout-image-wrapper draggable-image-block">
                        <div class="image-error">
                            <span class="error-icon">⚠️</span>
                            <span>Image ${index + 1} unavailable</span>
                        </div>
                    </div>
                `;
            }
        });

        html += `</div>`;
    }

    html += `
        </div>
    `;

    return html;
}

// Layout 2: Enhanced flexible image-caption pairs with better organization
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

    if (imageCaptionPairs.length === 0) {
        html += `
            <div class="layout-error">
                <div class="error-icon">⚠️</div>
                <div class="error-message">No image-caption pairs found</div>
            </div>
        `;
        html += `</div>`;
        return html;
    }

    // Fetch all images concurrently
    const imagePromises = imageCaptionPairs.map(
        async ([imagePrompt, caption]) => {
            try {
                const url = await fetchImage(imagePrompt);
                return { url, caption, error: null };
            } catch (error) {
                return {
                    url: null,
                    caption,
                    error:
                        error instanceof Error
                            ? error.message
                            : "Unknown error",
                };
            }
        }
    );

    const imageResults = await Promise.all(imagePromises);

    imageResults.forEach(({ url, caption, error }, index) => {
        html += `
            <div class="layout-image-caption draggable-image-block">
        `;

        if (url) {
            html += `
                <div class="layout-image-wrapper">
                    <img class="layout-image" src="${url}" alt="Educational image ${
                index + 1
            }" loading="lazy" />
                </div>
            `;
        } else {
            html += `
                <div class="layout-image-wrapper">
                    <div class="image-error">
                        <div class="error-icon">⚠️</div>
                        <span class="error-message">Image ${
                            index + 1
                        } unavailable</span>
                        ${
                            error
                                ? `<span class="error-details">${error}</span>`
                                : ""
                        }
                    </div>
                </div>
            `;
        }

        html += `
                <div class="layout-caption-wrapper draggable-text-block">
                    <p class="layout-caption draggable-text-block">${renderMarkdown(
                        caption
                    )}</p>
                </div>
            </div>
        `;
    });

    html += `</div>`;
    return html;
}

// Layout 3: Enhanced Mermaid flowchart with improved visual hierarchy
async function parseLayout3(content: any[], nodeId: string): Promise<string> {
    const [mermaidCode, description] = content;
    const diagramId = `mermaid-${nodeId}`;

    let html = `
        <div class="layout-3">
            <div class="layout-diagram-section draggable-diagram-block">
                <div class="diagram-container">
                    <div id="${diagramId}" class="layout-mermaid-enhanced">Loading diagram...</div>
                </div>
            </div>
            <div class="layout-analysis-section draggable-text-block">
                <div class="analysis-header">
                    <div class="analysis-icon">🔄</div>
                    <h3 class="analysis-title">Process Analysis</h3>
                </div>
                <div class="layout-description-content">
                    ${renderMarkdown(description || "")}
                </div>
            </div>
        </div>
    `;

    try {
        const svg = await mermaidToSvg(mermaidCode);
        // Enhance the SVG with better styling
        const enhancedSvg = svg.outerHTML.replace(
            "<svg",
            '<svg class="flowchart-svg"'
        );
        html = html.replace("Loading diagram...", enhancedSvg);
    } catch (error) {
        html = html.replace(
            "Loading diagram...",
            `<div class="mermaid-error">
                <div class="error-icon">⚠️</div>
                <div class="error-text">Unable to render process diagram</div>
                <div class="error-details">Please try refreshing or contact support</div>
            </div>`
        );
    }

    return html;
}

// Layout 4: Enhanced Mermaid mindmap with larger, more prominent display
async function parseLayout4(content: any[], nodeId: string): Promise<string> {
    const [mermaidCode, description] = content;
    const diagramId = `mermaid-${nodeId}`;

    let html = `
        <div class="layout-4">
            <div class="layout-mindmap-hero draggable-diagram-block">
                <div class="mindmap-container">
                    <div id="${diagramId}" class="layout-mermaid-large">Loading mindmap...</div>
                </div>
            </div>
            <div class="layout-concept-analysis draggable-text-block">
                <div class="concept-header">
                    <div class="concept-icon">🧠</div>
                    <h3 class="concept-title">Concept Breakdown</h3>
                </div>
                <div class="concept-description">
                    ${renderMarkdown(description || "")}
                </div>
                <div class="concept-callout">
                    <div class="callout-icon">💡</div>
                    <span class="callout-text">Explore the connections between different concepts in the mindmap above</span>
                </div>
            </div>
        </div>
    `;

    try {
        const svg = await mermaidToSvg(mermaidCode);
        // Enhance the SVG with larger dimensions and better styling
        const enhancedSvg = svg.outerHTML
            .replace("<svg", '<svg class="mindmap-svg"')
            .replace(/width="[^"]*"/, 'width="100%"')
            .replace(/height="[^"]*"/, 'height="auto"');
        html = html.replace("Loading mindmap...", enhancedSvg);
    } catch (error) {
        html = html.replace(
            "Loading mindmap...",
            `<div class="mermaid-error">
                <div class="error-icon">🧠</div>
                <div class="error-text">Unable to render mindmap</div>
                <div class="error-details">Mindmap visualization temporarily unavailable</div>
            </div>`
        );
    }

    return html;
}

// Layout 5: Enhanced Mermaid piechart with comprehensive analysis
async function parseLayout5(content: any[], nodeId: string): Promise<string> {
    const [mermaidCode, description] = content;
    const diagramId = `mermaid-${nodeId}`;

    let html = `
        <div class="layout-5">
            <div class="layout-chart-section draggable-diagram-block">
                <div class="chart-container">
                    <div id="${diagramId}" class="layout-mermaid-chart">Loading piechart...</div>
                </div>
            </div>
            <div class="layout-analysis-section draggable-text-block">
                <div class="analysis-header">
                    <div class="analysis-icon">📊</div>
                    <h3 class="analysis-title">Data Analysis</h3>
                </div>
                <div class="layout-description-content">
                    ${renderMarkdown(description || "")}
                </div>
            </div>
        </div>
    `;

    try {
        const svg = await mermaidToSvg(mermaidCode);
        // Enhance the SVG with better styling for charts
        const enhancedSvg = svg.outerHTML.replace(
            "<svg",
            '<svg class="piechart-svg"'
        );
        html = html.replace("Loading piechart...", enhancedSvg);
    } catch (error) {
        console.error("Layout 5 mermaid error:", error);
        html = html.replace(
            "Loading piechart...",
            `<div class="mermaid-error">
                <div class="error-icon">📊</div>
                <div class="error-text">Unable to render data visualization</div>
                <div class="error-details">Chart data temporarily unavailable</div>
            </div>`
        );
    }

    return html;
}

// Layout 6: Clean quadrant chart layout inspired by Layout 12's design
async function parseLayout6(content: any[], nodeId: string): Promise<string> {
    const [mermaidCode, description] = content;
    const diagramId = `mermaid-${nodeId}`;

    let html = `
        <div class="layout-6">
            <div class="layout-hero-section draggable-diagram-block">
                <div class="layout-central-visual">
                    <div id="${diagramId}" class="layout-mermaid">Loading quadrant chart...</div>
                </div>
            </div>
            <div class="layout-content-section">
                <div class="layout-educational-content draggable-text-block">
                    <header class="content-header">
                        <div class="layout-point-icon">🎯</div>
                        <h2 class="layout-title">Strategic Framework Analysis</h2>
                    </header>
    `;

    // Handle description - can be a string or array of strategic points
    if (typeof description === "string") {
        html += `
                    <div class="layout-text-content">
                        <p class="layout-description draggable-text-block">${renderMarkdown(
                            description
                        )}</p>
                    </div>
        `;
    } else if (Array.isArray(description)) {
        html += `<div class="layout-points-grid">`;

        description.forEach((point, index) => {
            // Extract icon hint if present or use strategic analysis icons
            const iconMatch = point.match(/^(\p{Emoji}|\p{Symbol})\s+(.+)$/u);
            const strategicIcons = ["📊", "🎯", "⚡", "🔍", "💡", "🚀"];
            const icon = iconMatch
                ? iconMatch[1]
                : strategicIcons[index % strategicIcons.length];
            const text = iconMatch ? iconMatch[2] : point;

            html += `
                <div class="layout-educational-point draggable-point-item">
                    <div class="layout-point-icon">${icon}</div>
                    <div class="layout-point-content">
                        <span class="layout-point-text">${renderMarkdown(
                            text
                        )}</span>
                    </div>
                </div>
            `;
        });

        html += `</div>`;
    }

    html += `
                </div>
            </div>
        </div>
    `;

    try {
        const svg = await mermaidToSvg(mermaidCode);
        // Enhance the SVG with better styling for quadrant charts
        const enhancedSvg = svg.outerHTML.replace(
            "<svg",
            '<svg class="quadrant-svg"'
        );
        html = html.replace("Loading quadrant chart...", enhancedSvg);
    } catch (error) {
        console.error("Layout 6 mermaid error:", error);
        html = html.replace(
            "Loading quadrant chart...",
            `<div class="mermaid-error">
                <div class="error-icon">🎯</div>
                <div class="error-text">Unable to render strategic framework</div>
                <div class="error-details">Quadrant analysis temporarily unavailable</div>
            </div>`
        );
    }

    return html;
}

// Layout 7: Enhanced featured concept - inspired by Layout 12's clean design
async function parseLayout7(content: any[], nodeId: string): Promise<string> {
    const [imagePrompt, title, paragraph1, paragraph2, paragraph3] = content;
    const imageId = `img-${nodeId}`;

    try {
        const imageUrl = await fetchImage(imagePrompt);

        let html = `
            <div class="layout-7">
                <div class="layout-hero-section draggable-image-block">
                    <div class="layout-central-visual">
                        <img id="${imageId}" class="layout-hero-image" src="${imageUrl}" alt="Featured Visual" />
                    </div>
                </div>
                <div class="layout-content-section">
                    <div class="layout-educational-content">
                        <header class="content-header draggable-header-block">
                            <h2 class="layout-title">${renderMarkdown(
                                title || "Educational Topic"
                            )}</h2>
                        </header>
                        <div class="layout-points-grid">
        `;

        // Create educational points for each paragraph
        const paragraphs = [paragraph1, paragraph2, paragraph3].filter(Boolean);
        const icons = ["📚", "🔍", "💡"];

        paragraphs.forEach((paragraph, index) => {
            if (paragraph) {
                html += `
                    <div class="layout-educational-point draggable-point-item">
                        <div class="layout-point-icon">${
                            icons[index] || "✨"
                        }</div>
                        <div class="layout-point-content">
                            <div class="layout-point-text">${renderMarkdown(
                                paragraph
                            )}</div>
                        </div>
                    </div>
                `;
            }
        });

        html += `
                        </div>
                    </div>
                </div>
            </div>
        `;

        return html;
    } catch (error) {
        let html = `
            <div class="layout-7">
                <div class="layout-hero-section draggable-image-block">
                    <div class="layout-central-visual">
                        <div class="image-error">
                            <div class="error-icon">⚠️</div>
                            <span>Featured image unavailable</span>
                        </div>
                    </div>
                </div>
                <div class="layout-content-section">
                    <div class="layout-educational-content">
                        <header class="content-header draggable-header-block">
                            <h2 class="layout-title">${renderMarkdown(
                                title || "Educational Topic"
                            )}</h2>
                        </header>
                        <div class="layout-points-grid">
        `;

        const paragraphs = [paragraph1, paragraph2, paragraph3].filter(Boolean);
        const icons = ["📚", "🔍", "💡"];

        paragraphs.forEach((paragraph, index) => {
            if (paragraph) {
                html += `
                    <div class="layout-educational-point draggable-point-item">
                        <div class="layout-point-icon">${
                            icons[index] || "✨"
                        }</div>
                        <div class="layout-point-content">
                            <div class="layout-point-text">${renderMarkdown(
                                paragraph
                            )}</div>
                        </div>
                    </div>
                `;
            }
        });

        html += `
                        </div>
                    </div>
                </div>
            </div>
        `;

        return html;
    }
}

// Layout 8: Polished asymmetric layout with enhanced visual presentation
async function parseLayout8(content: any[], nodeId: string): Promise<string> {
    const [imagePrompt, title, explanation, smallImagePrompts] = content;
    const mainImageId = `img-main-${nodeId}`;

    try {
        // Fetch main image
        const mainImageUrl = await fetchImage(imagePrompt);

        let html = `
            <div class="layout-8">
                <div class="layout-hero-section draggable-image-block">
                    <div class="layout-central-visual">
                        <img id="${mainImageId}" class="layout-hero-image" src="${mainImageUrl}" alt="Main Visual" loading="lazy" />
                    </div>
                </div>
                <div class="layout-content-section">
                    <div class="layout-educational-content">
                        <header class="content-header draggable-header-block">
                            <h2 class="layout-title">${renderMarkdown(
                                title || "Educational Topic"
                            )}</h2>
                        </header>
        `;

        // Main explanation as a text content block
        if (explanation) {
            html += `
                        <div class="layout-text-content draggable-text-block">
                            <div class="layout-description">${renderMarkdown(
                                explanation
                            )}</div>
                        </div>
            `;
        }

        // Fetch small images if they exist - display as supporting visuals
        if (Array.isArray(smallImagePrompts) && smallImagePrompts.length > 0) {
            html += `
                        <div class="layout-supporting-visuals draggable-image-grid">
                            <h4 class="visuals-title">Supporting Details</h4>
                            <div class="visuals-grid">`;

            const smallImageUrls = await Promise.all(
                smallImagePrompts.map((prompt) =>
                    fetchImage(prompt).catch(() => null)
                )
            );

            smallImageUrls.forEach((url, index) => {
                if (url) {
                    html += `
                                <div class="visual-card">
                                    <div class="visual-image-container">
                                        <img class="visual-image" src="${url}" alt="Supporting visual ${
                        index + 1
                    }" loading="lazy" />
                                        <div class="visual-overlay">
                                            <span class="visual-number">${
                                                index + 1
                                            }</span>
                                        </div>
                                    </div>
                                </div>
                    `;
                } else {
                    html += `
                                <div class="visual-card error-card">
                                    <div class="visual-error">
                                        <span class="error-icon">⚠️</span>
                                        <span class="error-text">Visual ${
                                            index + 1
                                        }</span>
                                    </div>
                                </div>
                    `;
                }
            });

            html += `
                            </div>
                        </div>`;
        }

        html += `
                    </div>
                </div>
            </div>
        `;

        return html;
    } catch (error) {
        console.error("Layout 8 error:", error);

        let html = `
            <div class="layout-8">
                <div class="layout-hero-section">
                    <div class="layout-central-visual">
                        <div class="image-error">
                            <div class="error-icon">⚠️</div>
                            <span>Main image unavailable</span>
                        </div>
                    </div>
                </div>
                <div class="layout-content-section">
                    <div class="layout-educational-content">
                        <header class="content-header">
                            <h2 class="layout-title">${renderMarkdown(
                                title || "Educational Topic"
                            )}</h2>
                        </header>
        `;

        if (explanation) {
            html += `
                        <div class="layout-text-content">
                            <p class="layout-description draggable-text-block">${renderMarkdown(
                                explanation
                            )}</p>
                        </div>
            `;
        }

        if (Array.isArray(smallImagePrompts) && smallImagePrompts.length > 0) {
            html += `
                <div class="layout-points-grid">
                    ${smallImagePrompts
                        .map(
                            (_, index) => `
                        <div class="layout-educational-point">
                            <div class="layout-point-icon">⚠️</div>
                            <div class="layout-point-content">
                                <div class="layout-point-text">Detail ${
                                    index + 1
                                } unavailable</div>
                            </div>
                        </div>
                    `
                        )
                        .join("")}
                </div>
            `;
        }

        html += `
                    </div>
                </div>
            </div>
        `;

        return html;
    }
}

// Layout 9: Clean video presentation inspired by Layout 12
async function parseLayout9(content: any[], nodeId: string): Promise<string> {
    if (!validateContentArray(content, 2, 9)) {
        return `<div class="layout-error">
            <div class="error-icon">⚠️</div>
            <div class="error-message">Invalid content structure for video layout</div>
        </div>`;
    }

    const [videoPrompt, caption] = content;
    const videoId = `video-${nodeId}`;

    let html = `
        <div class="layout-9-infographic">
            <div class="video-infographic-header">
                <div class="video-header-accent"></div>
                <div class="video-title-section">
                    <div class="video-icon-large">�</div>
                    <h3 class="video-infographic-title">Educational Video</h3>
                </div>
                <div class="video-header-line"></div>
            </div>
            
            <div class="video-main-container">
                <div class="video-player-section draggable-video-block">
                    <div class="video-frame">
                        <div id="${videoId}" class="video-embed-container">
                            <div class="video-loading">
                                <div class="loading-spinner"></div>
                                <span class="loading-text">Loading video...</span>
                            </div>
                        </div>
                        <div class="video-frame-overlay"></div>
                    </div>
                </div>
                
                <div class="video-context-panel draggable-text-block">
                    <div class="context-panel-header">
                        <div class="context-icon">📝</div>
                        <h4 class="context-panel-title">Video Summary</h4>
                    </div>
                    
                    <div class="context-content-card">
                        <div class="context-accent-line"></div>
                        <div class="video-caption-content">
                            ${renderMarkdown(
                                caption || "Educational video content"
                            )}
                        </div>
                    </div>
                    
                    <div class="video-stats">
                        <div class="stat-item">
                            <div class="stat-icon">⏱️</div>
                            <span class="stat-label">Educational Content</span>
                        </div>
                        <div class="stat-item">
                            <div class="stat-icon">🎯</div>
                            <span class="stat-label">Interactive Learning</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="video-infographic-footer">
                <div class="footer-video-accent"></div>
            </div>
        </div>
    `;

    try {
        const videoIdResult = await fetchVideo(videoPrompt);
        const embedUrl = getYouTubeEmbedUrl(videoIdResult);

        const videoEmbed = `
            <div class="responsive-video-wrapper">
                <iframe class="video-player-iframe" 
                        src="${embedUrl}" 
                        frameborder="0" 
                        allowfullscreen
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        title="Educational Video">
                </iframe>
                <div class="video-play-overlay">
                    <div class="play-button">
                        <div class="play-icon">▶</div>
                    </div>
                </div>
            </div>
        `;

        html = html.replace(
            `<div class="video-loading">
                                <div class="loading-spinner"></div>
                                <span class="loading-text">Loading video...</span>
                            </div>`,
            videoEmbed
        );
    } catch (error) {
        console.error("Layout 9 video error:", error);
        const errorContent = `
            <div class="video-error-state">
                <div class="video-error-icon">🎥</div>
                <div class="video-error-content">
                    <h4 class="error-title">Video Temporarily Unavailable</h4>
                    <p class="error-description">Please check your connection and try again</p>
                    <div class="error-code">Error: Media not found</div>
                </div>
            </div>
        `;
        html = html.replace(
            `<div class="video-loading">
                                <div class="loading-spinner"></div>
                                <span class="loading-text">Loading video...</span>
                            </div>`,
            errorContent
        );
    }

    return html;
}

// Layout 12: Central illustration with icon-driven key points - Redesigned for better UX
async function parseLayout12(content: any[], nodeId: string): Promise<string> {
    const [illustrationPrompt, educationalContent] = content;
    const illustrationId = `illustration-${nodeId}`;

    try {
        const illustrationUrl = await fetchImage(illustrationPrompt);

        let html = `
            <div class="layout-12">
                <div class="layout-hero-section draggable-image-block">
                    <div class="layout-central-visual">
                        <img id="${illustrationId}" class="layout-hero-image" src="${illustrationUrl}" alt="Educational Illustration" />
                    </div>
                </div>
                <div class="layout-content-section">
                    <div class="layout-educational-content">
        `;

        // Handle educational content - can be a string or array of points
        if (typeof educationalContent === "string") {
            html += `
                <div class="layout-text-content draggable-text-block">
                    <p class="layout-description draggable-text-block">${renderMarkdown(
                        educationalContent
                    )}</p>
                </div>
            `;
        } else if (Array.isArray(educationalContent)) {
            html += `<div class="layout-points-grid">`;

            educationalContent.forEach((point, index) => {
                // Extract icon hint if present (e.g., "🚀 Launch sequence initiated")
                const iconMatch = point.match(
                    /^(\p{Emoji}|\p{Symbol})\s+(.+)$/u
                );
                const icon = iconMatch ? iconMatch[1] : getDefaultIcon(index);
                const text = iconMatch ? iconMatch[2] : point;

                html += `
                    <div class="layout-educational-point draggable-point-item">
                        <div class="layout-point-icon">${icon}</div>
                        <div class="layout-point-content">
                            <span class="layout-point-text">${renderMarkdown(
                                text
                            )}</span>
                        </div>
                    </div>
                `;
            });

            html += `</div>`;
        }

        html += `
                    </div>
                </div>
            </div>
        `;

        return html;
    } catch (error) {
        console.error("Layout 12 error:", error);
        let html = `
            <div class="layout-12">
                <div class="layout-hero-section draggable-image-block">
                    <div class="layout-central-visual">
                        <div class="image-error">
                            <div class="error-icon">⚠️</div>
                            <span>Unable to load illustration</span>
                        </div>
                    </div>
                </div>
                <div class="layout-content-section">
                    <div class="layout-educational-content">
        `;

        if (typeof educationalContent === "string") {
            html += `
                <div class="layout-text-content draggable-text-block">
                    <p class="layout-description draggable-text-block">${renderMarkdown(
                        educationalContent
                    )}</p>
                </div>
            `;
        } else if (Array.isArray(educationalContent)) {
            html += `<div class="layout-points-grid">`;

            educationalContent.forEach((point, index) => {
                const iconMatch = point.match(
                    /^(\p{Emoji}|\p{Symbol})\s+(.+)$/u
                );
                const icon = iconMatch ? iconMatch[1] : getDefaultIcon(index);
                const text = iconMatch ? iconMatch[2] : point;

                html += `
                    <div class="layout-educational-point draggable-point-item">
                        <div class="layout-point-icon">${icon}</div>
                        <div class="layout-point-content">
                            <span class="layout-point-text">${renderMarkdown(
                                text
                            )}</span>
                        </div>
                    </div>
                `;
            });

            html += `</div>`;
        }

        html += `
                    </div>
                </div>
            </div>
        `;

        return html;
    }
}

// Helper function to provide default icons for educational points
function getDefaultIcon(index: number): string {
    const defaultIcons = [
        "💡",
        "🔍",
        "⚡",
        "🎯",
        "🚀",
        "✨",
        "🎨",
        "🔧",
        "📊",
        "🌟",
    ];
    return defaultIcons[index % defaultIcons.length];
}

// Layout 13: Enhanced split content with animated video presentation
async function parseLayout13(content: any[], nodeId: string): Promise<string> {
    const [title, text, videoPrompt] = content;
    const videoId = `video-${nodeId}`;

    try {
        const videoIdResult = await fetchVideo(videoPrompt);
        const embedUrl = getYouTubeEmbedUrl(videoIdResult);

        let html = `
            <div class="layout-13">
                <div class="layout-split-container">
                    <div class="layout-content-section">
                        <div class="layout-educational-content draggable-text-block">
                            <header class="content-header-enhanced">
                                <div class="header-icon">📚</div>
                                <h2 class="layout-title">${renderMarkdown(
                                    title || "Educational Topic"
                                )}</h2>
                            </header>
                            <div class="layout-text-content enhanced">
                                <div class="content-wrapper">
                                    <div class="content-accent"></div>
                                    <div class="layout-description">${renderMarkdown(
                                        text || ""
                                    )}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="layout-video-section">
                        <div class="video-container-enhanced draggable-video-block">
                            <div class="video-header">
                                <div class="video-icon">🎬</div>
                                <span class="video-label">Watch & Learn</span>
                            </div>
                            <div id="${videoId}" class="layout-video-player enhanced">
                                <div class="responsive-video-wrapper">
                                    <iframe class="video-player-iframe" 
                                            src="${embedUrl}" 
                                            frameborder="0" 
                                            allowfullscreen
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            title="Educational Video">
                                    </iframe>
                                    <div class="video-play-indicator">
                                        <div class="play-pulse"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        return html;
    } catch (error) {
        let html = `
            <div class="layout-13">
                <div class="layout-split-container">
                    <div class="layout-content-section">
                        <div class="layout-educational-content draggable-text-block">
                            <header class="content-header-enhanced">
                                <div class="header-icon">📚</div>
                                <h2 class="layout-title">${renderMarkdown(
                                    title || "Educational Topic"
                                )}</h2>
                            </header>
                            <div class="layout-text-content enhanced">
                                <div class="content-wrapper">
                                    <div class="content-accent"></div>
                                    <div class="layout-description">${renderMarkdown(
                                        text || ""
                                    )}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="layout-video-section">
                        <div class="video-container-enhanced draggable-video-block">
                            <div class="video-header">
                                <div class="video-icon">🎬</div>
                                <span class="video-label">Watch & Learn</span>
                            </div>
                            <div id="${videoId}" class="layout-video-player enhanced">
                                <div class="video-error-state enhanced">
                                    <div class="video-error-icon">🎥</div>
                                    <div class="video-error-content">
                                        <h4 class="error-title">Video Unavailable</h4>
                                        <p class="error-description">Please try again later</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        return html;
    }
}

// Layout 14: Horizontal alternating sections (comprehensive topic)
async function parseLayout14(content: any[], _nodeId: string): Promise<string> {
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
                    } draggable-section-block">
                        <div class="layout-section-image draggable-image-block">
                            <img class="layout-large-image" src="${imageUrl}" alt="Section ${
                    sectionIndex + 1
                }" />
                        </div>
                        <div class="layout-section-content draggable-text-block">
                            <div class="layout-text">${renderMarkdown(
                                text
                            )}</div>
                        </div>
                    </div>
                `;
            } catch (error) {
                html += `
                    <div class="layout-section ${
                        isEven
                            ? "layout-section-normal"
                            : "layout-section-reverse"
                    } draggable-section-block">
                        <div class="layout-section-image draggable-image-block">
                            <div class="image-error">
                                <div class="error-icon">⚠️</div>
                                <span>Section image unavailable</span>
                            </div>
                        </div>
                        <div class="layout-section-content draggable-text-block">
                            <div class="layout-text">${renderMarkdown(
                                text
                            )}</div>
                        </div>
                    </div>
                `;
            }
        }
    }

    html += `</div>`;
    return html;
}

// Layout 15: Horizontal Timeline layout with chronological image-text pairs
async function parseLayout15(content: any[], _nodeId: string): Promise<string> {
    let html = `<div class="layout-15"><div class="layout-15-container">`;

    // Handle flat alternating array: [date1, imagePrompt1, event1_description, date2, imagePrompt2, event2_description, ...]
    for (let i = 0; i < content.length; i += 3) {
        const date = content[i];
        const imagePrompt = content[i + 1];
        const eventDescription = content[i + 2];

        if (date && imagePrompt && eventDescription) {
            try {
                const imageUrl = await fetchImage(imagePrompt);
                html += `
                    <div class="layout-timeline-item draggable-timeline-item">
                        <div class="layout-timeline-date">${date}</div>
                        <img class="layout-timeline-image" src="${imageUrl}" alt="Timeline event" />
                        <div class="layout-timeline-content draggable-text-block">
                            <div class="layout-timeline-text">${renderMarkdown(
                                eventDescription
                            )}</div>
                        </div>
                    </div>
                `;
            } catch (error) {
                html += `
                    <div class="layout-timeline-item draggable-timeline-item">
                        <div class="layout-timeline-date">${date}</div>
                        <div class="image-error">
                            <div class="error-icon">⚠️</div>
                            <span>Timeline image unavailable</span>
                        </div>
                        <div class="layout-timeline-content draggable-text-block">
                            <div class="layout-timeline-text">${renderMarkdown(
                                eventDescription
                            )}</div>
                        </div>
                    </div>
                `;
            }
        }
    }

    html += `</div></div>`;
    return html;
}

// Layout 16: Card grid layout with multiple topic cards
async function parseLayout16(content: any[], _nodeId: string): Promise<string> {
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
                    <div class="layout-card draggable-card-item">
                        <h3 class="layout-card-title">${renderMarkdown(
                            cardTitle
                        )}</h3>
                        <img class="layout-card-image" src="${imageUrl}" alt="${cardTitle}" />
                        <p class="layout-card-description draggable-text-block">${renderMarkdown(
                            cardDescription
                        )}</p>
                    </div>
                `;
            } catch (error) {
                html += `
                    <div class="layout-card draggable-card-item">
                        <h3 class="layout-card-title">${renderMarkdown(
                            cardTitle
                        )}</h3>
                        <div class="image-error">Error loading image</div>
                        <p class="layout-card-description draggable-text-block">${renderMarkdown(
                            cardDescription
                        )}</p>
                    </div>
                `;
            }
        }
    }

    html += `</div>`;
    return html;
}

// Layout 17: Code tutorial with visual examples
async function parseLayout17(content: any[], _nodeId: string): Promise<string> {
    const [
        title,
        code1,
        explanation1,
        diagramPrompt,
        implementationExplanation,
        code2,
        explanation2,
    ] = content;

    try {
        const diagramUrl = await fetchImage(diagramPrompt);

        // Function to process code and detect language
        const processCode = (codeBlock: string | undefined | null) => {
            let lang = "javascript"; // Default language
            let cleanCode = (codeBlock || "").toString();

            if (cleanCode.startsWith("```")) {
                // Extract language from code block if specified
                const langMatch = cleanCode.match(
                    /```(\w+)?\n?([\s\S]*?)\n?```$/
                );
                if (langMatch) {
                    if (langMatch[1]) {
                        lang = langMatch[1];
                    }
                    cleanCode = langMatch[2] || "";
                } else {
                    // Remove code fences if no proper match
                    cleanCode = cleanCode
                        .replace(/^```\w*\n?/, "")
                        .replace(/\n?```$/, "");
                }
            } else {
                // Auto-detect language based on content
                if (
                    cleanCode.includes("def ") ||
                    cleanCode.includes("import ") ||
                    cleanCode.includes("print(")
                ) {
                    lang = "python";
                } else if (
                    cleanCode.includes("function ") ||
                    cleanCode.includes("const ") ||
                    cleanCode.includes("let ")
                ) {
                    lang = "javascript";
                } else if (
                    cleanCode.includes("public class ") ||
                    cleanCode.includes("System.out.println")
                ) {
                    lang = "java";
                } else if (
                    cleanCode.includes("#include") ||
                    cleanCode.includes("int main")
                ) {
                    lang = "cpp";
                } else if (
                    cleanCode.includes("SELECT ") ||
                    cleanCode.includes("FROM ")
                ) {
                    lang = "sql";
                }
            }

            // Ensure cleanCode is never null or undefined
            if (!cleanCode || cleanCode.trim() === "") {
                cleanCode = "// No code provided";
            }

            return { lang, cleanCode };
        };

        const { lang: lang1, cleanCode: cleanCode1 } = processCode(code1);
        const { lang: lang2, cleanCode: cleanCode2 } = processCode(code2);

        let html = `
            <div class="layout-17">
                <h2 class="layout-title draggable-header-block">${renderMarkdown(
                    title || "Code Tutorial"
                )}</h2>
                
                <div class="layout-code-section draggable-code-block">
                    <pre class="layout-code-block language-${lang1}"><code class="language-${lang1}">${cleanCode1}</code></pre>
                    <div class="layout-code-explanation draggable-text-block">${renderMarkdown(
                        explanation1 || ""
                    )}</div>
                </div>
                
                <div class="layout-diagram-section draggable-image-block">
                    <img class="layout-diagram-image" src="${diagramUrl}" alt="Architecture Diagram" />
                    <div class="layout-implementation-explanation draggable-text-block">${renderMarkdown(
                        implementationExplanation || ""
                    )}</div>
                </div>
                
                <div class="layout-code-section draggable-code-block">
                    <pre class="layout-code-block language-${lang2}"><code class="language-${lang2}">${cleanCode2}</code></pre>
                    <div class="layout-code-explanation draggable-text-block">${renderMarkdown(
                        explanation2 || ""
                    )}</div>
                </div>
            </div>
        `;

        return html;
    } catch (error) {
        return `<div class="layout-17"><div class="error-content">Error loading tutorial content</div></div>`;
    }
}

// Layout 18: Technical documentation with API examples
async function parseLayout18(content: any[], _nodeId: string): Promise<string> {
    const [
        title,
        codeSnippet,
        documentation,
        usageExamples,
        diagramPrompt,
        bestPractices,
    ] = content;

    try {
        const diagramUrl = await fetchImage(diagramPrompt);

        // Function to process code and detect language
        const processCode = (codeBlock: string | undefined | null) => {
            let lang = "javascript"; // Default language
            let cleanCode = (codeBlock || "").toString();

            if (cleanCode.startsWith("```")) {
                // Extract language from code block if specified
                const langMatch = cleanCode.match(
                    /```(\w+)?\n?([\s\S]*?)\n?```$/
                );
                if (langMatch) {
                    if (langMatch[1]) {
                        lang = langMatch[1];
                    }
                    cleanCode = langMatch[2] || "";
                } else {
                    // Remove code fences if no proper match
                    cleanCode = cleanCode
                        .replace(/^```\w*\n?/, "")
                        .replace(/\n?```$/, "");
                }
            } else {
                // Auto-detect language based on content
                if (
                    cleanCode.includes("def ") ||
                    cleanCode.includes("import ") ||
                    cleanCode.includes("print(")
                ) {
                    lang = "python";
                } else if (
                    cleanCode.includes("function ") ||
                    cleanCode.includes("const ") ||
                    cleanCode.includes("let ")
                ) {
                    lang = "javascript";
                } else if (
                    cleanCode.includes("public class ") ||
                    cleanCode.includes("System.out.println")
                ) {
                    lang = "java";
                } else if (
                    cleanCode.includes("#include") ||
                    cleanCode.includes("int main")
                ) {
                    lang = "cpp";
                } else if (
                    cleanCode.includes("SELECT ") ||
                    cleanCode.includes("FROM ")
                ) {
                    lang = "sql";
                } else if (
                    cleanCode.includes("curl ") ||
                    cleanCode.includes("GET ") ||
                    cleanCode.includes("POST ")
                ) {
                    lang = "bash";
                }
            }

            // Ensure cleanCode is never null or undefined
            if (!cleanCode || cleanCode.trim() === "") {
                cleanCode = "// No code provided";
            }

            return { lang, cleanCode };
        };

        const { lang, cleanCode } = processCode(codeSnippet);

        let html = `
            <div class="layout-18">
                <h2 class="layout-title draggable-header-block">${renderMarkdown(
                    title || "API Documentation"
                )}</h2>
                
                <div class="layout-api-section">
                    <div class="layout-code-container draggable-code-block">
                        <pre class="layout-code-block language-${lang}"><code class="language-${lang}">${cleanCode}</code></pre>
                    </div>
                    <div class="layout-documentation draggable-text-block">${renderMarkdown(
                        documentation || ""
                    )}</div>
                </div>
                
                <div class="layout-usage-section draggable-text-block">
                    <h3 class="layout-subtitle">Usage Examples</h3>
                    <div class="layout-usage-examples">${renderMarkdown(
                        usageExamples || ""
                    )}</div>
                </div>
                
                <div class="layout-diagram-section">
                    <img class="layout-api-diagram draggable-image-block" src="${diagramUrl}" alt="API Flow Diagram" />
                    <div class="layout-best-practices draggable-text-block">
                        <h3 class="layout-subtitle">Best Practices</h3>
                        ${renderMarkdown(bestPractices || "")}
                    </div>
                </div>
            </div>
        `;

        return html;
    } catch (error) {
        return `<div class="layout-18"><div class="error-content">Error loading documentation content</div></div>`;
    }
}
