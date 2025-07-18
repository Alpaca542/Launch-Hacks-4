interface QuizData {
    question: string;
    answers: Array<{ [key: string]: string }>;
    correctAnswer: number;
}
const VITE_PIXABAY_API_KEY = "51259393-3a562db01323edade9561b8f0";

const VITE_TENOR_API_KEY = "LIVDSRZULELA";

interface SchemaItem {
    large_header?: string;
    small_header?: string;
    ul?: string[];
    ol?: string[];
    quiz?: QuizData[];
    img?: [string, string]; // [req, description]
    vid?: [string, string]; // [req, description]
    gif?: [string, string]; // [req, description]
    textblock?: string;
    codeblock?: string;
    quote?: string;
    link?: string;
    table?: string[][];
    purehtml?: string;
    sidecontainer?: string;
    diagram?: string;
    note?: string;
    warning?: string;
    tip?: string;
    htmlCanvas?: string;
}

const parseTextblock = (text: string): string => {
    // Parse markdown-style formatting: **bold**, (text)[url]
    return text
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(
            /\*\*(.*?)\*\*/g,
            "<strong class='font-semibold text-gray-900 dark:text-gray-100'>$1</strong>"
        )
        .replace(
            /\((.*?)\)\[(.*?)\]/g,
            '<a href="$2" target="_blank" class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline transition-colors duration-200">$1</a>'
        );
};

const parseSchemaArray = async (schemaArray: SchemaItem[]): Promise<string> => {
    const parsedContentPromises = schemaArray.map(async (item) => {
        const key = Object.keys(item)[0];
        const value = item[key as keyof SchemaItem];

        switch (key) {
            case "large_header":
                return `<h1 class="text-4xl lg:text-4xl font-bold my-8 text-gray-900 dark:text-gray-100 leading-tight border-b-4 border-blue-600 dark:border-blue-400 pb-2 transition-colors duration-200">${value}</h1>`;

            case "small_header":
                return `<h2 class="text-3xl lg:text-3xl font-semibold mt-6 mb-3 text-gray-800 dark:text-gray-200 leading-snug transition-colors duration-200">${value}</h2>`;

            case "ul":
                const ulItems = (value as string[])
                    .map(
                        (item) =>
                            `<li class="text-gray-700 dark:text-gray-300 transition-colors duration-200">${item}</li>`
                    )
                    .join("");
                return `<ul class="my-4 pl-6 space-y-2 list-disc list-inside text-gray-700 dark:text-gray-300 transition-colors duration-200">${ulItems}</ul>`;

            case "ol":
                const olItems = (value as string[])
                    .map(
                        (item) =>
                            `<li class="text-gray-700 dark:text-gray-300 transition-colors duration-200">${item}</li>`
                    )
                    .join("");
                return `<ol class="my-4 pl-6 space-y-2 list-decimal list-inside text-gray-700 dark:text-gray-300 transition-colors duration-200">${olItems}</ol>`;

            case "quiz":
                const quizArray = value as QuizData[];
                const quizSetId = `quiz-set-${Math.random()
                    .toString(36)
                    .substr(2, 9)}`;

                const quizHtml = quizArray
                    .map((quizData, quizIndex) => {
                        const quizId = `${quizSetId}-q${quizIndex}`;

                        const answerButtons = quizData.answers
                            .map((answer, index) => {
                                const answerText = Object.keys(answer)[0];
                                const hint = answer[answerText];
                                const isCorrect =
                                    index === quizData.correctAnswer;

                                const clickHandler = `
                                        const quiz = document.getElementById('${quizId}');
                                        const hintDiv = document.getElementById('${quizId}-hint');
                                        const resultDiv = document.getElementById('${quizId}-result');
                                        const nextBtn = document.getElementById('${quizId}-next');
                                        const buttons = quiz.querySelectorAll('.quiz-answer');
                                        const selectedButton = this;
                                        
                                        if (${isCorrect}) {
                                            // Correct answer
                                            hintDiv.classList.add('hidden');
                                            resultDiv.classList.remove('hidden');
                                            if (nextBtn) nextBtn.classList.remove('hidden');
                                            buttons.forEach(btn => btn.disabled = true);
                                            selectedButton.classList.add('quiz-correct');
                                            selectedButton.classList.remove('hover:bg-blue-50', 'dark:hover:bg-gray-700');
                                        } else {
                                            // Wrong answer - show hint
                                            hintDiv.textContent = '${hint.replace(
                                                /'/g,
                                                "\\'"
                                            )}';
                                            hintDiv.classList.remove('hidden');
                                            selectedButton.classList.add('quiz-incorrect');
                                            selectedButton.classList.remove('hover:bg-blue-50', 'dark:hover:bg-gray-700');
                                            selectedButton.disabled = true;
                                        }
                                    `;

                                return `<button class="quiz-answer w-full bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg p-4 text-left font-medium text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700 hover:border-blue-500 dark:hover:border-blue-400 transition-all duration-200 transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60" onclick="${clickHandler}">${answerText}</button>`;
                            })
                            .join("");

                        const retryHandler = `
                                const quiz = document.getElementById('${quizId}');
                                const hintDiv = document.getElementById('${quizId}-hint');
                                const resultDiv = document.getElementById('${quizId}-result');
                                const nextBtn = document.getElementById('${quizId}-next');
                                const buttons = quiz.querySelectorAll('.quiz-answer');
                                
                                // Reset all states
                                hintDiv.classList.add('hidden');
                                hintDiv.textContent = '';
                                resultDiv.classList.add('hidden');
                                if (nextBtn) nextBtn.classList.add('hidden');
                                
                                buttons.forEach(btn => {
                                    btn.disabled = false;
                                    btn.classList.remove('quiz-correct', 'quiz-incorrect');
                                    btn.classList.add('hover:bg-blue-50', 'dark:hover:bg-gray-700');
                                });
                            `;

                        const nextHandler =
                            quizIndex < quizArray.length - 1
                                ? `
                                document.getElementById('${quizSetId}-q${quizIndex}').classList.add('hidden');
                                document.getElementById('${quizSetId}-q${
                                      quizIndex + 1
                                  }').classList.remove('hidden');
                            `
                                : `
                                document.getElementById('${quizSetId}-completion').classList.remove('hidden');
                                document.getElementById('${quizId}').classList.add('hidden');
                            `;

                        const nextButton =
                            quizIndex < quizArray.length - 1
                                ? `<button id="${quizId}-next" class="hidden bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200" onclick="${nextHandler}">Next Question →</button>`
                                : `<button id="${quizId}-next" class="hidden bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200" onclick="${nextHandler}">Finish Quiz ✓</button>`;

                        return `
                                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-200 ${
                                    quizIndex === 0 ? "" : "hidden"
                                }" id="${quizId}">
                                    <div class="text-sm font-medium text-blue-600 dark:text-blue-400 mb-2 text-center">Question ${
                                        quizIndex + 1
                                    } of ${quizArray.length}</div>
                                    <div class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6 text-center leading-relaxed">${
                                        quizData.question
                                    }</div>
                                    <div class="space-y-3 mb-4">
                                        ${answerButtons}
                                    </div>
                                    <div id="${quizId}-hint" class="hidden bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 text-yellow-800 dark:text-yellow-200 text-sm italic animate-fade-in"></div>
                                    <div id="${quizId}-result" class="hidden bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg p-6 text-center">
                                        <p class="text-xl font-bold text-green-800 dark:text-green-200 mb-4">🎉 Excellent! 🎉</p>
                                        <div class="flex flex-col sm:flex-row gap-3 justify-center">
                                            <button class="bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200" onclick="${retryHandler}">↻ Try Again</button>
                                            ${nextButton}
                                        </div>
                                    </div>
                                </div>
                            `;
                    })
                    .join("");

                const restartHandler = `
                        document.getElementById('${quizSetId}-completion').classList.add('hidden');
                        document.getElementById('${quizSetId}-q0').classList.remove('hidden');
                        // Reset all questions
                        ${quizArray
                            .map(
                                (_, index) => `
                            const quiz${index} = document.getElementById('${quizSetId}-q${index}');
                            if (quiz${index}) {
                                const hintDiv = document.getElementById('${quizSetId}-q${index}-hint');
                                const resultDiv = document.getElementById('${quizSetId}-q${index}-result');
                                const nextBtn = document.getElementById('${quizSetId}-q${index}-next');
                                const buttons = quiz${index}.querySelectorAll('.quiz-answer');
                                
                                hintDiv.classList.add('hidden');
                                hintDiv.textContent = '';
                                resultDiv.classList.add('hidden');
                                if (nextBtn) nextBtn.classList.add('hidden');
                                
                                buttons.forEach(btn => {
                                    btn.disabled = false;
                                    btn.classList.remove('quiz-correct', 'quiz-incorrect');
                                    btn.classList.add('hover:bg-blue-50', 'dark:hover:bg-gray-700');
                                });
                                
                                if (${index} > 0) quiz${index}.classList.add('hidden');
                            }
                        `
                            )
                            .join("")}
                    `;

                return `
                        <div class="my-8" id="${quizSetId}">
                            ${quizHtml}
                            <div id="${quizSetId}-completion" class="hidden bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border-2 border-green-200 dark:border-green-700 rounded-xl p-8 text-center">
                                <div class="text-4xl mb-4">🎊</div>
                                <h3 class="text-2xl font-bold text-green-800 dark:text-green-200 mb-2">Quiz Completed!</h3>
                                <p class="text-green-700 dark:text-green-300 mb-6">Congratulations! You've successfully completed all ${quizArray.length} questions.</p>
                                <button class="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-8 py-3 rounded-lg font-semibold shadow-lg transform hover:scale-105 transition-all duration-200" onclick="${restartHandler}">🔄 Start Over</button>
                            </div>
                        </div>
                    `;

            case "img":
                const [imgReq, imgDesc] = value as [string, string];
                const imgSrc = await fetchPixabayImage(imgReq);
                return `<figure class="my-6 text-center">
                    <img src="${imgSrc}" alt="${imgDesc}" 
                         class="max-w-full h-auto rounded-lg shadow-lg mx-auto transition-transform duration-200 hover:scale-105"
                         onerror="this.onerror=null; this.src='https://via.placeholder.com/640x360/ef4444/ffffff?text=Image+Error'; this.alt='Fallback image (original failed to load)';" />
                    <figcaption class="mt-3 text-sm text-gray-600 dark:text-gray-400">${imgDesc}</figcaption>
                    <div class="mt-2 text-xs text-gray-500 dark:text-gray-500 opacity-75">
                        <span class="inline-block mr-2">🔍 ${imgReq}</span>
                        <a href="https://pixabay.com/" target="_blank" class="text-blue-500 dark:text-blue-400 hover:underline">Pixabay</a>
                    </div>
                    </figure>`;

            case "vid":
                const [vidReq, vidDesc] = value as [string, string];
                const videoId = await fetchYouTubeVideo(vidReq);
                return `<figure class="my-6 text-center">
                        <div class="relative w-full max-w-4xl mx-auto" style="padding-bottom: 56.25%; height: 0;">
                            <iframe 
                                src="https://www.youtube.com/embed/${videoId}" 
                                class="absolute top-0 left-0 w-full h-full rounded-lg shadow-lg"
                                frameborder="0" 
                                allowfullscreen>
                            </iframe>
                        </div>
                        <figcaption class="mt-2 text-sm italic text-gray-600 dark:text-gray-400">${vidDesc}</figcaption>
                        <div class="mt-1 text-xs text-gray-500 dark:text-gray-400">Search: "${vidReq}" • <a href="https://developers.google.com/youtube/v3" target="_blank" class="text-red-600 dark:text-red-400 hover:underline">Powered by YouTube Data API</a></div>
                    </figure>`;

            case "gif":
                const [gifReq, gifDesc] = value as [string, string];
                const gifSrc = await fetchTenorGif(gifReq);
                return `<figure class="my-6 text-center">
                        <img src="${gifSrc}" alt="${gifDesc}" 
                             class="max-w-full h-auto rounded-lg shadow-lg mx-auto transition-transform duration-200 hover:scale-105"
                             onerror="this.onerror=null; this.src='https://via.placeholder.com/300x200/ef4444/ffffff?text=GIF+Error'; this.alt='Fallback GIF (original failed to load)';" />
                        <figcaption class="mt-2 text-sm italic text-gray-600 dark:text-gray-400">${gifDesc}</figcaption>
                        <div class="mt-1 text-xs text-gray-500 dark:text-gray-400">Search: "${gifReq}" • <a href="https://tenor.com/" target="_blank" class="text-purple-600 dark:text-purple-400 hover:underline">Powered by Tenor</a></div>
                    </figure>`;

            case "textblock":
                return `<div class="my-4 leading-relaxed text-gray-700 dark:text-gray-300 transition-colors duration-200">${parseTextblock(
                    value as string
                )}</div>`;

            case "codeblock":
                return `<pre class="my-6 bg-gray-900 dark:bg-gray-800 text-gray-100 p-4 rounded-lg overflow-x-auto border-l-4 border-blue-500 shadow-lg"><code class="font-mono text-sm leading-relaxed">${value}</code></pre>`;

            case "quote":
                return `<blockquote class="my-6 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 dark:border-blue-400 p-4 rounded-r-lg relative">
                        <div class="text-blue-600 dark:text-blue-400 text-4xl absolute -top-2 -left-1 font-serif">"</div>
                        <div class="italic text-gray-700 dark:text-gray-300 pl-6">${value}</div>
                    </blockquote>`;

            case "link":
                return `<a href="${value}" class="inline-block my-2 px-4 py-2 text-blue-600 dark:text-blue-400 border-2 border-blue-600 dark:border-blue-400 rounded-lg hover:bg-blue-600 hover:text-white dark:hover:bg-blue-500 transition-all duration-200 font-medium" target="_blank">${value}</a>`;

            case "table":
                const tableData = value as string[][];
                const headerRow = tableData[0];
                const bodyRows = tableData.slice(1);

                const headerHtml = `<thead><tr>${headerRow
                    .map(
                        (cell) =>
                            `<th class="bg-blue-600 dark:bg-blue-700 text-white px-4 py-3 text-left font-semibold">${cell}</th>`
                    )
                    .join("")}</tr></thead>`;
                const bodyHtml = `<tbody>${bodyRows
                    .map(
                        (row, index) =>
                            `<tr class="${
                                index % 2 === 0
                                    ? "bg-gray-50 dark:bg-gray-800"
                                    : "bg-white dark:bg-gray-700"
                            } hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors duration-200">${row
                                .map(
                                    (cell) =>
                                        `<td class="px-4 py-3 border-b border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300">${cell}</td>`
                                )
                                .join("")}</tr>`
                    )
                    .join("")}</tbody>`;

                return `<div class="my-6 overflow-x-auto shadow-lg rounded-lg border border-gray-200 dark:border-gray-700">
                        <table class="w-full border-collapse">${headerHtml}${bodyHtml}</table>
                    </div>`;

            case "purehtml":
                return `<div class="my-4 p-2 rounded-md bg-gray-50 dark:bg-gray-800 transition-colors duration-200">${value}</div>`;

            case "sidecontainer":
                return `<aside class="float-right w-80 max-w-[40%] ml-4 mb-4 p-4 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm leading-relaxed text-gray-700 dark:text-gray-300 transition-colors duration-200 lg:block hidden">
                        ${value}
                    </aside>
                    <div class="lg:hidden my-4 p-4 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm leading-relaxed text-gray-700 dark:text-gray-300 transition-colors duration-200">
                        ${value}
                    </div>`;

            case "diagram":
                const diagramId = `diagram_${Math.random()
                    .toString(36)
                    .slice(2)}`; // Encode the diagram code properly for HTML data attribute
                const diagramCode = (value as string)
                    .replace(/"/g, "&quot;")
                    .replace(/'/g, "&#39;");
                // Only output the container, no inline script
                return `
                    <div class="my-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-4 text-center transition-colors duration-200"
                         id="${diagramId}"
                         data-diagram-code="${diagramCode}"
                         data-diagram-id="${diagramId}">
                        <div class="text-gray-600 dark:text-gray-400 italic loading-text">Rendering diagram...</div>
                    </div>
                `;

            case "note":
                return `<div class="my-4 flex items-start p-4 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 dark:border-blue-400 rounded-r-lg transition-colors duration-200">
                        <div class="text-blue-600 dark:text-blue-400 text-xl mr-3 flex-shrink-0 mt-0.5">📝</div>
                        <div class="text-blue-800 dark:text-blue-200 leading-relaxed">${value}</div>
                    </div>`;

            case "warning":
                return `<div class="my-4 flex items-start p-4 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 dark:border-yellow-400 rounded-r-lg transition-colors duration-200">
                        <div class="text-yellow-600 dark:text-yellow-400 text-xl mr-3 flex-shrink-0 mt-0.5">⚠️</div>
                        <div class="text-yellow-800 dark:text-yellow-200 leading-relaxed">${value}</div>
                    </div>`;

            case "tip":
                return `<div class="my-4 flex items-start p-4 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 dark:border-green-400 rounded-r-lg transition-colors duration-200">
                        <div class="text-green-600 dark:text-green-400 text-xl mr-3 flex-shrink-0 mt-0.5">💡</div>
                        <div class="text-green-800 dark:text-green-200 leading-relaxed">${value}</div>
                    </div>`;

            case "htmlCanvas":
                const canvasId = `canvas_${Math.random()
                    .toString(36)
                    .substr(2, 9)}_${Date.now()}`;

                // Store canvas code in data attribute instead of inline JS
                const canvasCode = (value as string)
                    .replace(/"/g, "&quot;")
                    .replace(/'/g, "&#39;");

                return `
                        <div class="my-6 bg-gray-50 dark:bg-gray-800 border-2 border-dashed border-blue-300 dark:border-blue-600 rounded-lg p-6 transition-colors duration-200" data-canvas-code="${canvasCode}" data-canvas-id="${canvasId}">
                            <canvas id="${canvasId}" width="400" height="300" class="border border-gray-300 dark:border-gray-600 rounded-lg max-w-full mx-auto block bg-white dark:bg-gray-900"></canvas>
                            <div class="flex flex-wrap gap-2 mt-4 justify-center">
                                <button class="bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2" onclick="
                                    (function() {
                                        const canvasDiv = this.closest('[data-canvas-code]');
                                        const code = canvasDiv.getAttribute('data-canvas-code');
                                        const canvasId = canvasDiv.getAttribute('data-canvas-id');
                                        const canvasElement = document.getElementById(canvasId);
                                        const canvasContext = canvasElement.getContext('2d');
                                        const errorDiv = document.getElementById(canvasId + 'Error');
                                        
                                        errorDiv.classList.add('hidden');
                                        errorDiv.textContent = '';
                                        
                                        try {
                                            canvasContext.clearRect(0, 0, canvasElement.width, canvasElement.height);
                                            const canvasFunction = new Function('canvas', 'ctx', code);
                                            canvasFunction(canvasElement, canvasContext);
                                        } catch (error) {
                                            console.error('Canvas error:', error);
                                            errorDiv.textContent = 'Error: ' + error.message;
                                            errorDiv.classList.remove('hidden');
                                        }
                                    }).call(this);
                                ">▶ Run Code</button>
                                <button class="bg-gray-600 hover:bg-gray-700 dark:bg-gray-500 dark:hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2" onclick="
                                    (function() {
                                        const canvasDiv = this.closest('[data-canvas-code]');
                                        const canvasId = canvasDiv.getAttribute('data-canvas-id');
                                        const canvasElement = document.getElementById(canvasId);
                                        const canvasContext = canvasElement.getContext('2d');
                                        const errorDiv = document.getElementById(canvasId + 'Error');
                                        
                                        canvasContext.clearRect(0, 0, canvasElement.width, canvasElement.height);
                                        errorDiv.classList.add('hidden');
                                    }).call(this);
                                ">🗑️ Clear</button>
                                <button class="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2" onclick="
                                    (function() {
                                        const canvasDiv = this.closest('[data-canvas-code]');
                                        const canvasId = canvasDiv.getAttribute('data-canvas-id');
                                        const canvasElement = document.getElementById(canvasId);
                                        
                                        if (!document.fullscreenElement) {
                                            canvasElement.requestFullscreen().catch(err => {
                                                console.warn('Fullscreen failed:', err);
                                            });
                                        } else {
                                            document.exitFullscreen();
                                        }
                                    }).call(this);
                                ">⛶ Fullscreen</button>
                            </div>
                            <details class="mt-4 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg transition-colors duration-200">
                                <summary class="p-3 font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-200">📝 View Code</summary>
                                <pre class="p-4 bg-gray-900 dark:bg-gray-800 text-gray-100 rounded-b-lg overflow-x-auto"><code class="font-mono text-sm">${value}</code></pre>
                            </details>
                            <div id="${canvasId}Error" class="hidden mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg text-red-800 dark:text-red-200"></div>
                        </div>
                    `;

            default:
                return `<div class="my-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg text-red-800 dark:text-red-200 font-mono text-sm">
                        <div class="font-semibold mb-2">Unknown content type:</div>
                        ${JSON.stringify(item)}
                    </div>`;
        }
    });

    const parsedContent = await Promise.all(parsedContentPromises);
    window.processAllMermaidDiagrams!();
    return parsedContent.join("\n");
};

// Pixabay API configuration
const PIXABAY_API_KEY = VITE_PIXABAY_API_KEY;
const PIXABAY_API_URL = "https://pixabay.com/api/";

interface PixabayResponse {
    total: number;
    totalHits: number;
    hits: Array<{
        id: number;
        pageURL: string;
        type: string;
        tags: string;
        previewURL: string;
        webformatURL: string;
        largeImageURL: string;
        fullHDURL?: string;
        imageURL?: string;
        views: number;
        downloads: number;
        likes: number;
        user: string;
        userImageURL: string;
    }>;
}

// Cache for Pixabay images to avoid repeated API calls
const pixabayCache = new Map<string, string>();

const fetchPixabayImage = async (searchTerm: string): Promise<string> => {
    // Check cache first
    if (pixabayCache.has(searchTerm)) {
        return pixabayCache.get(searchTerm)!;
    }

    try {
        const encodedTerm = encodeURIComponent(searchTerm);
        const url = `${PIXABAY_API_URL}?key=${PIXABAY_API_KEY}&q=${encodedTerm}&image_type=photo&per_page=3&safesearch=true&order=relevant`;

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: PixabayResponse = await response.json();

        if (data.hits && data.hits.length > 0) {
            // Use webformatURL for good quality images that are optimized for web
            const imageUrl = data.hits[0].webformatURL;
            pixabayCache.set(searchTerm, imageUrl);
            return imageUrl;
        } else {
            // Fallback to a placeholder if no images found
            const fallbackUrl = `https://via.placeholder.com/640x360/e5e7eb/6b7280?text=${encodedTerm}`;
            pixabayCache.set(searchTerm, fallbackUrl);
            return fallbackUrl;
        }
    } catch (error) {
        console.error("Error fetching Pixabay image:", error);
        // Return a placeholder image in case of error
        const fallbackUrl = `https://via.placeholder.com/640x360/ef4444/ffffff?text=Image+Error`;
        pixabayCache.set(searchTerm, fallbackUrl);
        return fallbackUrl;
    }
};

// Tenor API configuration
const TENOR_API_KEY = VITE_TENOR_API_KEY;
const TENOR_API_URL = "https://g.tenor.com/v1/search";

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

// Cache for Tenor GIFs to avoid repeated API calls
const tenorCache = new Map<string, string>();

const fetchTenorGif = async (searchTerm: string): Promise<string> => {
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

// YouTube Data API configuration
const YOUTUBE_API_KEY = "AIzaSyDxTJKoi1S8YjJZD12QTa4F9hV8fN8pNqo";
const YOUTUBE_API_URL = "https://www.googleapis.com/youtube/v3/search";

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

// Cache for YouTube videos to avoid repeated API calls
const youtubeCache = new Map<string, string>();

const fetchYouTubeVideo = async (searchTerm: string): Promise<string> => {
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

export const parseJsonToHtml = parseSchemaArray;

// TypeScript global window declarations for Mermaid
declare global {
    interface Window {
        mermaid?: {
            initialize: (config: any) => void;
            render: (id: string, code: string) => Promise<{ svg: string }>;
        };
        mermaidInitialized?: boolean;
        renderMermaidDiagram?: (diagramDiv: HTMLElement) => void;
        processAllMermaidDiagrams?: () => void;
    }
}

// At the end of the file, add the global diagram rendering logic
if (typeof window !== "undefined") {
    console.log("Rendering Mermaid diagram in:");
    window.renderMermaidDiagram = function (diagramDiv: HTMLElement) {
        console.log("Rendering Mermaid diagram in:", diagramDiv);
        if (!diagramDiv) return;
        console.log("Rendering Mermaid diagram in:", diagramDiv);
        const loadingText = diagramDiv.querySelector(
            ".loading-text"
        ) as HTMLElement | null;
        let code = diagramDiv.getAttribute("data-diagram-code") || "";
        if (!code) {
            diagramDiv.innerHTML =
                '<div class="text-red-600 dark:text-red-400 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg"><strong>Error:</strong> No diagram code provided</div>';
            return;
        }
        code = code.replace(/&quot;/g, '"').replace(/&#39;/g, "'");
        const id = diagramDiv.getAttribute("data-diagram-id") || "";
        function showError(message: string) {
            console.error("Mermaid Error:", message);
            diagramDiv.innerHTML =
                '<div class="text-red-600 dark:text-red-400 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg"><strong>Diagram Error:</strong> ' +
                message +
                "</div>";
        }
        function initializeMermaid() {
            if (window.mermaid) {
                try {
                    if (!window.mermaidInitialized) {
                        window.mermaid.initialize({
                            startOnLoad: false,
                            theme: "default",
                            securityLevel: "loose",
                            fontFamily: "inherit",
                            suppressErrorRendering: false,
                        });
                        window.mermaidInitialized = true;
                    }
                    return true;
                } catch (e) {
                    const errMsg =
                        typeof e === "object" && e && "message" in e
                            ? (e as any).message
                            : String(e);
                    showError("Failed to initialize Mermaid: " + errMsg);
                    return false;
                }
            }
            return false;
        }
        function renderDiagram() {
            console.log("Rendering Mermaid diagram in:", diagramDiv);
            if (!initializeMermaid()) {
                showError("Mermaid library not available");
                return;
            }
            try {
                if (!code.trim()) {
                    showError("Empty diagram code");
                    return;
                }
                const svgId = id;
                window
                    .mermaid!.render(svgId, code)
                    .then(function (result: { svg: string }) {
                        if (result && result.svg) {
                            diagramDiv.innerHTML = result.svg;
                        } else {
                            showError("Mermaid render returned no SVG");
                        }
                    })
                    .catch(function (error: any) {
                        const errMsg =
                            error && error.message
                                ? error.message
                                : String(error);
                        showError(errMsg || "Unknown render error");
                    });
            } catch (e) {
                const errMsg =
                    typeof e === "object" && e && "message" in e
                        ? (e as any).message
                        : String(e);
                showError(errMsg || "Unknown execution error");
            }
        }
        if (!window.mermaid) {
            if (loadingText)
                loadingText.textContent = "Loading Mermaid library...";
            const script = document.createElement("script");
            script.src =
                "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js";
            script.onload = function () {
                if (loadingText)
                    loadingText.textContent = "Rendering diagram...";
                setTimeout(renderDiagram, 500);
            };
            script.onerror = function () {
                showError("Failed to load Mermaid library from CDN");
            };
            document.head.appendChild(script);
        } else {
            renderDiagram();
        }
    };
    window.processAllMermaidDiagrams = function () {
        console.log("Processing all Mermaid diagrams");
        document
            .querySelectorAll("[data-diagram-code]")
            .forEach(function (diagramDiv) {
                window.renderMermaidDiagram!(diagramDiv as HTMLElement);
            });
    };
    window.processAllMermaidDiagrams();
}
