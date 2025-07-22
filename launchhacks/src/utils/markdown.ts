import Showdown from "showdown";

// Configure Showdown converter with sensible defaults
const converter = new Showdown.Converter({
    tables: true,
    strikethrough: true,
    emoji: true,
    underline: true,
    simplifiedAutoLink: true,
    excludeTrailingPunctuationFromURLs: true,
    openLinksInNewWindow: true,
    backslashEscapesHTMLTags: true,
    ghCodeBlocks: true,
    tasklists: true,
    // Showdown supports _text_ for italics by default
    // literalMidWordUnderscores: false, // (default)
});

export function renderMarkdown(text: string): string {
    if (!text) return "";
    return converter.makeHtml(text);
}

export function stripMarkdown(text: string): string {
    if (!text) return "";
    return text
        .replace(/[#*`~_]/g, "")
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
        .replace(/\n+/g, " ")
        .trim();
}
