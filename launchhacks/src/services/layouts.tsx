export const LAYOUT_TYPES = {
    "1": "A title on the very top, a large textbar under it and a list of small images on the bottom",
    "2": "A row of images, each with a small text caption below",
    "3": "A mermaid flowchart with a text description at the bottom",
    "4": "A mermaid mindmap with a text description at the bottom",
    "5": "A mermaid piechart with a text description at the bottom",
    "6": "A mermaid quadrant chart with a text description at the bottom",
    "7": "A large image on the left, a title on the top-right and a text description on the bottom-right",
    "8": "A large image on the right, a title on the top-left and a list of small images on the bottom-left",
    "9": "A video player at the top, a text caption below",
    "12": "A single GIF on the left, a bulleted list on the right",
    "13": "A large video on the right, a title and a text on the left",
};

export const LAYOUT_SCHEMA = {
    "1": "[title, textbar, [image1_prompt, image2_prompt, ...]]",
    "2": "[[image1_prompt, caption1], [image2_prompt, caption2], ...]",
    "3": "[mermaid_flowchart, description]",
    "4": "[mermaid_mindmap, description]",
    "5": "[mermaid_piechart, description]",
    "6": "[mermaid_quadrant_chart, description]",
    "7": "[image_left_prompt, title, description]",
    "8": "[image_right_prompt, title, [image1_prompt, image2_prompt, ...]]",
    "9": "[video_prompt, caption]",
    "12": "[gif_prompt, [bullet1, bullet2, ...]]",
    "13": "[title, text, video_prompt]",
};
