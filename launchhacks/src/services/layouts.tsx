/**
 * Layout Configuration Module
 *
 * Defines 16 different layout types for educational content presentation.
 * Each layout has a specific purpose and schema for optimal learning experiences.
 *
 * Layout Types:
 * 1-2: Text and image combinations
 * 3-6: Interactive diagrams (flowcharts, mindmaps, charts)
 * 7-9: Media-focused layouts (images, videos)
 * 12-16: Advanced layouts (timelines, cards, comprehensive topics)
 */

export const LAYOUT_TYPES = {
    "1": "Hero visual with comprehensive explanation - large image with detailed educational content",
    "2": "Step-by-step visual guide - multiple images with substantial explanations for each step",
    "3": "Process diagram with detailed explanation - flowchart showing complex processes with educational context",
    "4": "Concept map with analysis - mind map with detailed explanations of relationships",
    "5": "Data visualization with analysis - pie chart with detailed statistical breakdown and interpretation",
    "6": "Strategic framework with detailed explanation - quadrant analysis with comprehensive guidelines",
    "7": "Featured concept layout - large visual with title and multiple paragraphs of educational content",
    "8": "Comparative analysis - main concept with supporting evidence and detailed explanations",
    "9": "Video learning with context - educational video with substantial background information",
    "12": "Illustrated guide with key insights - central visual with detailed bullet points and explanations",
    "13": "Media-rich educational content - video with comprehensive overview and context",
    "14": "Comprehensive topic exploration - alternating visuals and detailed explanations for thorough understanding",
    "15": "Historical timeline with detailed context - chronological progression with substantial descriptions",
    "16": "Multi-concept comparison - grid layout with detailed descriptions for comparing related topics",
    "17": "Code tutorial with visual examples - code snippets with explanations and visual diagrams",
    "18": "Technical documentation - code examples with comprehensive API documentation and use cases",
};

export const LAYOUT_SCHEMA = {
    "1": `["compelling_title", "comprehensive_educational_content", ["hero_image_prompt", "supporting_visual_1", "supporting_visual_2"]]`,
    "2": `[["step_image_1", "detailed_step_explanation_1"], ["step_image_2", "detailed_step_explanation_2"], ["step_image_3", "detailed_step_explanation_3"]]`,
    "3": [
        `flowchart TD
    A[starting_concept] -->|process_1| B(intermediate_result)
    B --> C{decision_point}
    C -->|outcome_a| D[final_result_1]
    C -->|outcome_b| E[final_result_2]
    C -->|outcome_c| F[fa:fa-star special_case]`,
        "comprehensive_process_explanation",
    ],
    "4": [
        `mindmap
  root((Central_Educational_Concept))
    Key_Aspect_1
      Supporting_Detail_A
      Supporting_Detail_B
    Key_Aspect_2
      Supporting_Detail_C
      Supporting_Detail_D`,
        "detailed_concept_analysis",
    ],
    "5": [
        `pie
    title Educational_Data_Analysis
    "Primary_Factor" : 45
    "Secondary_Factor" : 30
    "Additional_Factors" : 25`,
        "comprehensive_data_interpretation",
    ],
    "6": [
        `quadrantChart
    title Educational_Framework
    x-axis Low_Complexity --> High_Complexity
    y-axis Low_Impact --> High_Impact
    quadrant-1 Quick_Concepts
    quadrant-2 Advanced_Topics
    quadrant-3 Basic_Ideas
    quadrant-4 Fundamental_Principles
    "Concept_A": [0.3, 0.7]
    "Concept_B": [0.8, 0.4]
    "Concept_C": [0.2, 0.8]`,
        "detailed_framework_explanation",
    ],
    "7": "[featured_visual_prompt, educational_title, detailed_paragraph_1, detailed_paragraph_2, detailed_paragraph_3]",
    "8": "[main_concept_visual, educational_title, comprehensive_explanation, [evidence_visual_1, evidence_visual_2, evidence_visual_3]]",
    "9": "[educational_video_prompt, comprehensive_contextual_explanation]",
    "12": "[central_educational_visual, [detailed_insight_1, detailed_insight_2, detailed_insight_3, detailed_insight_4]]",
    "13": "[educational_section_title, comprehensive_overview_text, instructional_video_prompt]",
    "14": "[educational_visual_1, detailed_explanation_1, educational_visual_2, detailed_explanation_2, educational_visual_3, detailed_explanation_3]",
    "15": "[date_1, historical_visual_1, comprehensive_event_description_1, date_2, historical_visual_2, comprehensive_event_description_2]",
    "16": "[topic_title_1, topic_visual_1, detailed_description_1, topic_title_2, topic_visual_2, detailed_description_2]",
    "17": "[tutorial_title, code_example_1, code_explanation_1, architecture_diagram_prompt, implementation_explanation, code_example_2, code_explanation_2]",
    "18": "[api_title, code_snippet, comprehensive_documentation, usage_examples, visual_diagram_prompt, best_practices_explanation]",
};
