/**
 * HTML Parser Service
 *
 * Utilities for processing and enhancing generated HTML content
 * for better infographic presentation and accessibility.
 */

export interface ProcessedHTML {
    html: string;
    hasImages: boolean;
    hasVideos: boolean;
    textContent: string;
}

/**
 * Process raw HTML to enhance it for infographic presentation
 */
export const processLayoutHTML = (rawHTML: string): ProcessedHTML => {
    // Create a temporary DOM element to work with
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = rawHTML;

    // Add loading states for images
    const images = tempDiv.querySelectorAll("img");
    images.forEach((img, index) => {
        // Add loading placeholder
        img.setAttribute("loading", "lazy");
        img.setAttribute("decoding", "async");

        // Add error handling
        img.onerror = () => {
            img.style.display = "none";
            const errorDiv = document.createElement("div");
            errorDiv.className = "image-error";
            errorDiv.textContent = "Image unavailable";
            img.parentNode?.replaceChild(errorDiv, img);
        };

        // Add smooth loading animation
        img.style.opacity = "0";
        img.style.transition = "opacity 0.3s ease-in-out";
        img.onload = () => {
            img.style.opacity = "1";
        };

        // Add index for CSS targeting
        img.style.setProperty("--index", index.toString());
    });

    // Enhance video elements
    const videos = tempDiv.querySelectorAll("iframe");
    videos.forEach((video) => {
        video.setAttribute("loading", "lazy");
        // Ensure videos are responsive
        if (!video.style.width) {
            video.style.width = "100%";
        }
        if (!video.style.height) {
            video.style.height = "100%";
        }
    });

    // Add animation delays to text elements
    const textElements = tempDiv.querySelectorAll(
        ".layout-text, .layout-description, .layout-caption"
    );
    textElements.forEach((element, index) => {
        element.setAttribute(
            "style",
            `animation-delay: ${index * 0.1}s; --index: ${index};`
        );
    });

    // Add hover states to interactive elements
    const interactiveElements = tempDiv.querySelectorAll(
        ".layout-card, .layout-section, .layout-timeline-item"
    );
    interactiveElements.forEach((element, index) => {
        element.setAttribute(
            "style",
            `--index: ${index}; transform: translateZ(0);`
        );
    });

    const processedHTML = tempDiv.innerHTML;

    return {
        html: processedHTML,
        hasImages: images.length > 0,
        hasVideos: videos.length > 0,
        textContent: tempDiv.textContent || "",
    };
};

/**
 * Extract plain text from HTML for accessibility
 */
export const extractTextContent = (html: string): string => {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;
    return tempDiv.textContent || "";
};

/**
 * Optimize HTML for performance
 */
export const optimizeHTML = (html: string): string => {
    return (
        html
            // Remove excessive whitespace
            .replace(/\s+/g, " ")
            .replace(/>\s+</g, "><")
            // Ensure proper alt texts
            .replace(/<img(?![^>]*alt=)/g, '<img alt="Infographic element"')
            // Add semantic structure
            .replace(
                /<div class="layout-title">/g,
                '<h2 class="layout-title" role="heading" aria-level="2">'
            )
    );
};

/**
 * Add accessibility attributes to HTML
 */
export const enhanceAccessibility = (html: string): string => {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;

    // Add ARIA labels to interactive elements
    const cards = tempDiv.querySelectorAll(".layout-card");
    cards.forEach((card, index) => {
        card.setAttribute("role", "article");
        card.setAttribute("aria-label", `Content card ${index + 1}`);
    });

    // Add proper heading structure
    const titles = tempDiv.querySelectorAll(".layout-title");
    titles.forEach((title) => {
        title.setAttribute("role", "heading");
        title.setAttribute("aria-level", "2");
    });

    // Add figure/figcaption structure for images with captions
    const imageCaptions = tempDiv.querySelectorAll(".layout-image-caption");
    imageCaptions.forEach((container) => {
        const figure = document.createElement("figure");
        figure.className = container.className;

        const img = container.querySelector("img");
        const caption = container.querySelector(".layout-caption");

        if (img && caption) {
            figure.appendChild(img);
            const figcaption = document.createElement("figcaption");
            figcaption.className = caption.className;
            figcaption.textContent = caption.textContent;
            figure.appendChild(figcaption);

            container.parentNode?.replaceChild(figure, container);
        }
    });

    return tempDiv.innerHTML;
};
