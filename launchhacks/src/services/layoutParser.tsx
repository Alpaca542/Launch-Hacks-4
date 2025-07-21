import {
    fetchImage,
    fetchGif,
    fetchVideo,
    getYouTubeEmbedUrl,
    mermaidToSvg,
} from "./mediaQuery";

export interface ParsedLayoutContent {
    html: string;
    mediaPromises: Promise<void>[];
}

/**
 * Parses AI-generated content based on layout schema and returns HTML + media promises
 */
export const parseLayoutContent = async (
    layoutNumber: number,
    content: any[],
    nodeId: string
): Promise<ParsedLayoutContent> => {
    const mediaPromises: Promise<void>[] = [];
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
            default:
                html = await parseLayout1(content, nodeId);
        }
    } catch (error) {
        console.error("Error parsing layout content:", error);
        html = `<div class="error-content">Error loading content</div>`;
    }

    return { html, mediaPromises };
};

// Layout 1: Title, textbar, images
async function parseLayout1(content: any[], nodeId: string): Promise<string> {
    const [title, textbar, imagePrompts] = content;
    
    let html = `
        <div class="layout-1">
            <h2 class="layout-title">${title || 'Title'}</h2>
            <div class="layout-textbar">${textbar || 'Content'}</div>
            <div class="layout-images">
    `;

    if (Array.isArray(imagePrompts)) {
        // Fetch all images concurrently
        const imageUrls = await Promise.all(
            imagePrompts.map(prompt => fetchImage(prompt))
        );
        
        imageUrls.forEach((url, index) => {
            html += `<img class="layout-small-image" src="${url}" alt="Image ${index + 1}" />`;
        });
    }

    html += `
            </div>
        </div>
    `;

    return html;
}

// Layout 2: Row of images with captions
async function parseLayout2(
    content: any[],
    nodeId: string,
    mediaPromises: Promise<void>[]
): Promise<string> {
    let html = `<div class="layout-2">`;

    content.forEach((item, index) => {
        if (Array.isArray(item) && item.length >= 2) {
            const [imagePrompt, caption] = item;
            const imageId = `img-${nodeId}-${index}`;

            html += `
                <div class="layout-image-caption">
                    <img id="${imageId}" class="layout-image" src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjEwMCIgeT0iNzUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTkiPkxvYWRpbmcuLi48L3RleHQ+PC9zdmc+" alt="Loading..." />
                    <p class="layout-caption">${caption}</p>
                </div>
            `;

            mediaPromises.push(
                fetchImage(imagePrompt).then((url) => {
                    const imgElement = document.getElementById(imageId);
                    if (imgElement) imgElement.setAttribute("src", url);
                })
            );
        }
    });

    html += `</div>`;
    return html;
}

// Layout 3: Mermaid flowchart with description
async function parseLayout3(
    content: any[],
    nodeId: string,
    mediaPromises: Promise<void>[]
): Promise<string> {
    const [mermaidCode, description] = content;
    const diagramId = `mermaid-${nodeId}`;

    let html = `
        <div class="layout-3">
            <div id="${diagramId}" class="layout-mermaid">Loading diagram...</div>
            <p class="layout-description">${description || ""}</p>
        </div>
    `;

    mediaPromises.push(
        mermaidToSvg(mermaidCode)
            .then((svg) => {
                const diagramElement = document.getElementById(diagramId);
                if (diagramElement) {
                    diagramElement.innerHTML = "";
                    diagramElement.appendChild(svg);
                }
            })
            .catch(() => {
                const diagramElement = document.getElementById(diagramId);
                if (diagramElement) {
                    diagramElement.innerHTML =
                        '<div class="mermaid-error">Error loading diagram</div>';
                }
            })
    );

    return html;
}

// Layout 4: Mermaid mindmap with description
async function parseLayout4(
    content: any[],
    nodeId: string,
    mediaPromises: Promise<void>[]
): Promise<string> {
    const [mermaidCode, description] = content;
    const diagramId = `mermaid-${nodeId}`;

    let html = `
        <div class="layout-4">
            <div id="${diagramId}" class="layout-mermaid">Loading mindmap...</div>
            <p class="layout-description">${description || ""}</p>
        </div>
    `;

    mediaPromises.push(
        mermaidToSvg(mermaidCode)
            .then((svg) => {
                const diagramElement = document.getElementById(diagramId);
                if (diagramElement) {
                    diagramElement.innerHTML = "";
                    diagramElement.appendChild(svg);
                }
            })
            .catch(() => {
                const diagramElement = document.getElementById(diagramId);
                if (diagramElement) {
                    diagramElement.innerHTML =
                        '<div class="mermaid-error">Error loading mindmap</div>';
                }
            })
    );

    return html;
}

// Layout 5: Mermaid piechart with description
async function parseLayout5(
    content: any[],
    nodeId: string,
    mediaPromises: Promise<void>[]
): Promise<string> {
    const [mermaidCode, description] = content;
    const diagramId = `mermaid-${nodeId}`;

    let html = `
        <div class="layout-5">
            <div id="${diagramId}" class="layout-mermaid">Loading piechart...</div>
            <p class="layout-description">${description || ""}</p>
        </div>
    `;

    mediaPromises.push(
        mermaidToSvg(mermaidCode)
            .then((svg) => {
                const diagramElement = document.getElementById(diagramId);
                if (diagramElement) {
                    diagramElement.innerHTML = "";
                    diagramElement.appendChild(svg);
                }
            })
            .catch(() => {
                const diagramElement = document.getElementById(diagramId);
                if (diagramElement) {
                    diagramElement.innerHTML =
                        '<div class="mermaid-error">Error loading piechart</div>';
                }
            })
    );

    return html;
}

// Layout 6: Mermaid quadrant chart with description
async function parseLayout6(
    content: any[],
    nodeId: string,
    mediaPromises: Promise<void>[]
): Promise<string> {
    const [mermaidCode, description] = content;
    const diagramId = `mermaid-${nodeId}`;

    let html = `
        <div class="layout-6">
            <div id="${diagramId}" class="layout-mermaid">Loading quadrant chart...</div>
            <p class="layout-description">${description || ""}</p>
        </div>
    `;

    mediaPromises.push(
        mermaidToSvg(mermaidCode)
            .then((svg) => {
                const diagramElement = document.getElementById(diagramId);
                if (diagramElement) {
                    diagramElement.innerHTML = "";
                    diagramElement.appendChild(svg);
                }
            })
            .catch(() => {
                const diagramElement = document.getElementById(diagramId);
                if (diagramElement) {
                    diagramElement.innerHTML =
                        '<div class="mermaid-error">Error loading quadrant chart</div>';
                }
            })
    );

    return html;
}

// Layout 7: Large image left, title and description right
async function parseLayout7(
    content: any[],
    nodeId: string,
    mediaPromises: Promise<void>[]
): Promise<string> {
    const [imagePrompt, title, description] = content;
    const imageId = `img-${nodeId}`;

    let html = `
        <div class="layout-7">
            <div class="layout-left">
                <img id="${imageId}" class="layout-large-image" src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjE1MCIgeT0iMTAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjOTk5Ij5Mb2FkaW5nLi4uPC90ZXh0Pjwvc3ZnPg==" alt="Loading..." />
            </div>
            <div class="layout-right">
                <h2 class="layout-title">${title || "Title"}</h2>
                <p class="layout-description">${description || ""}</p>
            </div>
        </div>
    `;

    mediaPromises.push(
        fetchImage(imagePrompt).then((url) => {
            const imgElement = document.getElementById(imageId);
            if (imgElement) imgElement.setAttribute("src", url);
        })
    );

    return html;
}

// Layout 8: Large image right, title and small images left
async function parseLayout8(
    content: any[],
    nodeId: string,
    mediaPromises: Promise<void>[]
): Promise<string> {
    const [imagePrompt, title, smallImagePrompts] = content;
    const mainImageId = `img-main-${nodeId}`;

    let html = `
        <div class="layout-8">
            <div class="layout-left">
                <h2 class="layout-title">${title || "Title"}</h2>
                <div class="layout-small-images">
    `;

    if (Array.isArray(smallImagePrompts)) {
        smallImagePrompts.forEach((prompt, index) => {
            const imageId = `img-small-${nodeId}-${index}`;
            html += `<img id="${imageId}" class="layout-small-image" src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSI+TG9hZGluZy4uLjwvdGV4dD48L3N2Zz4=" alt="Loading..." />`;

            mediaPromises.push(
                fetchImage(prompt).then((url) => {
                    const imgElement = document.getElementById(imageId);
                    if (imgElement) imgElement.setAttribute("src", url);
                })
            );
        });
    }

    html += `
                </div>
            </div>
            <div class="layout-right">
                <img id="${mainImageId}" class="layout-large-image" src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjE1MCIgeT0iMTAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjOTk5Ij5Mb2FkaW5nLi4uPC90ZXh0Pjwvc3ZnPg==" alt="Loading..." />
            </div>
        </div>
    `;

    mediaPromises.push(
        fetchImage(imagePrompt).then((url) => {
            const imgElement = document.getElementById(mainImageId);
            if (imgElement) imgElement.setAttribute("src", url);
        })
    );

    return html;
}

// Layout 9: Video player with caption
async function parseLayout9(
    content: any[],
    nodeId: string,
    mediaPromises: Promise<void>[]
): Promise<string> {
    const [videoPrompt, caption] = content;
    const videoId = `video-${nodeId}`;

    let html = `
        <div class="layout-9">
            <div id="${videoId}" class="layout-video">Loading video...</div>
            <p class="layout-caption">${caption || ""}</p>
        </div>
    `;

    mediaPromises.push(
        fetchVideo(videoPrompt).then((videoIdResult) => {
            const videoElement = document.getElementById(videoId);
            if (videoElement) {
                const embedUrl = getYouTubeEmbedUrl(videoIdResult);
                videoElement.innerHTML = `<iframe src="${embedUrl}" frameborder="0" allowfullscreen></iframe>`;
            }
        })
    );

    return html;
}

// Layout 12: GIF left, bulleted list right
async function parseLayout12(
    content: any[],
    nodeId: string,
    mediaPromises: Promise<void>[]
): Promise<string> {
    const [gifPrompt, bulletPoints] = content;
    const gifId = `gif-${nodeId}`;

    let html = `
        <div class="layout-12">
            <div class="layout-left">
                <img id="${gifId}" class="layout-gif" src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjUwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjUwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjEyNSIgeT0iMTAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjOTk5Ij5Mb2FkaW5nIEdJRi4uLjwvdGV4dD48L3N2Zz4=" alt="Loading GIF..." />
            </div>
            <div class="layout-right">
                <ul class="layout-bullet-list">
    `;

    if (Array.isArray(bulletPoints)) {
        bulletPoints.forEach((point) => {
            html += `<li>${point}</li>`;
        });
    }

    html += `
                </ul>
            </div>
        </div>
    `;

    mediaPromises.push(
        fetchGif(gifPrompt).then((url) => {
            const gifElement = document.getElementById(gifId);
            if (gifElement) gifElement.setAttribute("src", url);
        })
    );

    return html;
}

// Layout 13: Title and text left, large video right
async function parseLayout13(
    content: any[],
    nodeId: string,
    mediaPromises: Promise<void>[]
): Promise<string> {
    const [title, text, videoPrompt] = content;
    const videoId = `video-${nodeId}`;

    let html = `
        <div class="layout-13">
            <div class="layout-left">
                <h2 class="layout-title">${title || "Title"}</h2>
                <p class="layout-text">${text || ""}</p>
            </div>
            <div class="layout-right">
                <div id="${videoId}" class="layout-video">Loading video...</div>
            </div>
        </div>
    `;

    mediaPromises.push(
        fetchVideo(videoPrompt).then((videoIdResult) => {
            const videoElement = document.getElementById(videoId);
            if (videoElement) {
                const embedUrl = getYouTubeEmbedUrl(videoIdResult);
                videoElement.innerHTML = `<iframe src="${embedUrl}" frameborder="0" allowfullscreen></iframe>`;
            }
        })
    );

    return html;
}
