import Showdown from "showdown";

const disableHTML = () => [
    {
        type: "lang",
        regex: /</g,
        replace: "&lt;",
    },
    {
        type: "lang",
        regex: />/g,
        replace: "&gt;",
    },
];

// Configure Showdown converter with sensible defaults
const converter = new Showdown.Converter({
    tables: true,
    strikethrough: true,
    emoji: true,
    underline: true,
    simplifiedAutoLink: true,
    excludeTrailingPunctuationFromURLs: true,
    openLinksInNewWindow: true,
    ghCodeBlocks: true,
    tasklists: true,
    extensions: [disableHTML],
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
