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

            case "quiz": {
                const quizArray = value as QuizData[];
                const quizSetId = `quiz-set-${Math.random()
                    .toString(36)
                    .substr(2, 9)}`;

                /* ========== BUILD EACH QUESTION ========== */
                const quizHtml = quizArray
                    .map((quizData, quizIndex) => {
                        const quizId = `${quizSetId}-q${quizIndex}`;
                        const progress = Math.round(
                            ((quizIndex + 1) / quizArray.length) * 100
                        );

                        /* ----- answers ----- */
                        const answerButtons = quizData.answers
                            .map((answer, idx) => {
                                const answerText = Object.keys(answer)[0];
                                const hint = answer[answerText];
                                const isCorrect =
                                    idx === quizData.correctAnswer;

                                const clickHandler = `
                                        const quiz    = document.getElementById('${quizId}');
                                        const hintDiv = document.getElementById('${quizId}-hint');
                                        const result  = document.getElementById('${quizId}-result');
                                        const nextBtn = document.getElementById('${quizId}-next');
                                        const buttons = quiz.querySelectorAll('.quiz-answer');
                                        const me      = this;
                
                                        if (${isCorrect}) {
                                            hintDiv.classList.add('hidden');
                                            result.classList.remove('hidden');
                                            nextBtn && nextBtn.classList.remove('hidden');
                                            buttons.forEach(b => b.disabled = true);
                
                                            me.classList.add('bg-green-50','dark:bg-green-900/20',
                                                             'border-green-500','text-green-800','dark:text-green-100',
                                                             'shadow-inner');
                                            me.classList.remove('hover:bg-slate-50','dark:hover:bg-slate-800');
                                            me.classList.add('scale-105');
                                        } else {
                                            hintDiv.textContent = '${hint.replace(
                                                /'/g,
                                                "\\'"
                                            )}';
                                            hintDiv.classList.remove('hidden');
                
                                            me.classList.add('bg-red-50','dark:bg-red-900/20',
                                                             'border-red-500','text-red-800','dark:text-red-100',
                                                             'animate-pulse');
                                            me.classList.remove('hover:bg-slate-50','dark:hover:bg-slate-800');
                                            me.disabled = true;
                                        }
                                    `;

                                return `
                                        <button
                                            class="quiz-answer w-full border-2 border-slate-300 dark:border-slate-600
                                                   bg-white dark:bg-slate-800 rounded-xl p-4 text-left
                                                   font-medium text-slate-700 dark:text-slate-200
                                                   transition-all duration-200 ease-out
                                                   hover:-translate-y-0.5 hover:shadow-lg
                                                   hover:bg-slate-50 dark:hover:bg-slate-800
                                                   focus:outline-none focus:ring-2 focus:ring-offset-2
                                                   focus:ring-blue-500 dark:focus:ring-blue-400
                                                   disabled:cursor-not-allowed disabled:opacity-60"
                                            onclick="${clickHandler}"
                                        >
                                            ${answerText}
                                        </button>`;
                            })
                            .join("");

                        /* ----- next / finish ----- */
                        const nextHandler =
                            quizIndex < quizArray.length - 1
                                ? `
                                        document.getElementById('${quizSetId}-q${quizIndex}').classList.add('hidden');
                                        document.getElementById('${quizSetId}-q${
                                      quizIndex + 1
                                  }').classList.remove('hidden');
                                        window.scrollTo({ top: document.getElementById('${quizSetId}-q${
                                      quizIndex + 1
                                  }').offsetTop - 20, behavior: 'smooth' });`
                                : `
                                        document.getElementById('${quizSetId}-completion').classList.remove('hidden');
                                        document.getElementById('${quizId}').classList.add('hidden');
                                        window.scrollTo({ top: document.getElementById('${quizSetId}-completion').offsetTop - 20, behavior: 'smooth' });`;

                        const nextButton =
                            quizIndex < quizArray.length - 1
                                ? `<button id="${quizId}-next"
                                               class="hidden inline-flex items-center gap-2
                                                      bg-blue-600 hover:bg-blue-700
                                                      dark:bg-blue-500 dark:hover:bg-blue-600
                                                      text-white px-6 py-2 rounded-lg font-semibold
                                                      transition-colors duration-200 drop-shadow-md"
                                               onclick="${nextHandler}">
                                           Next <i class="fa-solid fa-arrow-right"></i>
                                       </button>`
                                : `<button id="${quizId}-next"
                                               class="hidden inline-flex items-center gap-2
                                                      bg-green-600 hover:bg-green-700
                                                      dark:bg-green-500 dark:hover:bg-green-600
                                                      text-white px-6 py-2 rounded-lg font-semibold
                                                      transition-colors duration-200 drop-shadow-md"
                                               onclick="${nextHandler}">
                                           Finish <i class="fa-solid fa-circle-check"></i>
                                       </button>`;

                        /* ----- card ----- */
                        return `
                                <div id="${quizId}"
                                     class="${quizIndex === 0 ? "" : "hidden"}
                                            bg-gradient-to-br from-white via-slate-50 to-white
                                            dark:from-slate-800 dark:via-slate-800/70 dark:to-slate-900
                                            border border-slate-200 dark:border-slate-700
                                            shadow-xl rounded-3xl p-8 max-w-2xl mx-auto
                                            animate-fade-in">
                
                                    <div class="w-full bg-slate-200/60 dark:bg-slate-700/40 h-2 rounded-full mb-6">
                                        <div class="h-2 bg-blue-500 rounded-full transition-all duration-500"
                                             style="width:${progress}%"></div>
                                    </div>
                
                                    <p class="text-sm font-medium text-blue-600 dark:text-blue-400 text-center mb-2">
                                        Question ${quizIndex + 1} / ${
                            quizArray.length
                        }
                                    </p>
                
                                    <h2 class="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-slate-100
                                               text-center mb-8 leading-relaxed">
                                        ${quizData.question}
                                    </h2>
                
                                    <div class="grid gap-4 sm:grid-cols-2 mb-6">
                                        ${answerButtons}
                                    </div>
                
                                    <div id="${quizId}-hint"
                                         class="hidden bg-yellow-50 dark:bg-yellow-900/20
                                                border border-yellow-300 dark:border-yellow-600
                                                rounded-lg p-4 text-yellow-800 dark:text-yellow-200
                                                text-sm italic mb-6 animate-fade-in"></div>
                
                                    <div id="${quizId}-result"
                                         class="hidden flex flex-col items-center gap-6 mb-4 animate-fade-in">
                
                                        <i class="fa-solid fa-circle-check text-green-500 text-6xl drop-shadow-lg animate-bounce duration-[2s]"></i>
                
                                        <p class="text-2xl font-bold text-green-800 dark:text-green-200">
                                            Correct!
                                        </p>
                
                                        ${nextButton}
                                    </div>
                                </div>`;
                    })
                    .join("");

                /* ========== START‑OVER HANDLER ========== */
                const restartHandler = `
                        // completion -> hidden, first question -> visible
                        const comp = document.getElementById('${quizSetId}-completion');
                        comp.classList.add('hidden');
                        document.getElementById('${quizSetId}-q0').classList.remove('hidden');
                        window.scrollTo({ top: document.getElementById('${quizSetId}-q0').offsetTop - 20, behavior: 'smooth' });
                
                        // iterate through every question
                        ${quizArray
                            .map(
                                (_, i) => `
                            (function() {
                                const q     = document.getElementById('${quizSetId}-q${i}');
                                const hint  = document.getElementById('${quizSetId}-q${i}-hint');
                                const res   = document.getElementById('${quizSetId}-q${i}-result');
                                const next  = document.getElementById('${quizSetId}-q${i}-next');
                                const btns  = q.querySelectorAll('.quiz-answer');
                
                                hint.classList.add('hidden'); hint.textContent = '';
                                res.classList.add('hidden');  next && next.classList.add('hidden');
                
                                btns.forEach(b => {
                                    b.disabled = false;
                                    b.classList.remove(
                                        'bg-green-50','dark:bg-green-900/20','border-green-500','text-green-800','dark:text-green-100',
                                        'bg-red-50','dark:bg-red-900/20','border-red-500','text-red-800','dark:text-red-100',
                                        'animate-pulse','shadow-inner','scale-105'
                                    );
                                    b.classList.add('hover:bg-slate-50','dark:hover:bg-slate-800');
                                });
                
                                if (${i} > 0) q.classList.add('hidden');
                            })();
                            `
                            )
                            .join("")}
                    `;

                /* ========== FINAL RETURN ========== */
                return `
                        <div id="${quizSetId}" class="my-12 space-y-10">
                            ${quizHtml}
                
                            <!-- completion card -->
                            <div id="${quizSetId}-completion"
                                 class="hidden bg-gradient-to-br from-green-50 to-blue-50
                                        dark:from-green-900/25 dark:to-blue-900/25
                                        border-2 border-green-200 dark:border-green-700
                                        rounded-3xl p-12 text-center max-w-xl mx-auto
                                        shadow-2xl space-y-8 animate-fade-in">
                
                                <i class="fa-solid fa-trophy text-yellow-400 text-7xl drop-shadow-lg animate-bounce duration-[2s]"></i>
                
                                <h3 class="text-3xl font-extrabold text-green-800 dark:text-green-200">
                                    You finished the quiz!
                                </h3>
                
                                <p class="text-lg text-green-700 dark:text-green-300">
                                    Perfect score on ${quizArray.length} questions - great job!
                                </p>
                
                                <button onclick="${restartHandler}"
                                        class="inline-flex items-center gap-3
                                               bg-gradient-to-r from-green-600 to-blue-600
                                               hover:from-green-700 hover:to-blue-700
                                               text-white px-8 py-3 rounded-full font-semibold
                                               shadow-lg transform hover:scale-105
                                               transition-all duration-200">
                                    <i class="fa-solid fa-rotate-right"></i> Start over
                                </button>
                            </div>
                        </div>`;
            }

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
                        <div class="mt-2 text-xs text-gray-500 dark:text-gray-500 opacity-75">
                            <span class="inline-block mr-2">🔍 ${vidReq}</span>
                            <a href="https://youtube.com/" target="_blank" class="text-red-500 dark:text-red-400 hover:underline">YouTube</a>
                        </div>
                    </figure>`;

            case "gif":
                const [gifReq, gifDesc] = value as [string, string];
                const gifSrc = await fetchTenorGif(gifReq);
                return `<figure class="my-6 text-center">
                        <img src="${gifSrc}" alt="${gifDesc}" 
                             class="max-w-full h-auto rounded-lg shadow-lg mx-auto transition-transform duration-200 hover:scale-105"
                             onerror="this.onerror=null; this.src='https://via.placeholder.com/300x200/ef4444/ffffff?text=GIF+Error'; this.alt='Fallback GIF (original failed to load)';" />
                        <figcaption class="mt-2 text-sm text-gray-600 dark:text-gray-400">${gifDesc}</figcaption>
                        <div class="mt-2 text-xs text-gray-500 dark:text-gray-500 opacity-75">
                            <span class="inline-block mr-2">🔍 ${gifReq}</span>
                            <a href="https://tenor.com/" target="_blank" class="text-purple-500 dark:text-purple-400 hover:underline">Tenor</a>
                        </div>
                    </figure>`;

            case "textblock":
                return `<div class="my-4 leading-relaxed text-gray-700 dark:text-gray-300 transition-colors duration-200">${parseTextblock(
                    value as string
                )}</div>`;

            case "codeblock":
                return `<pre class="my-6 bg-gray-900 dark:bg-gray-800 text-gray-100 p-4 rounded-lg overflow-x-auto border-l-4 border-blue-500 shadow-lg"><code class="font-mono text-sm leading-relaxed">${value}</code></pre>`;

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

            case "sidecontainer":
                return `<aside class="float-right w-80 max-w-[40%] ml-4 mb-4 p-4 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm leading-relaxed text-gray-700 dark:text-gray-300 transition-colors duration-200 lg:block hidden">
                        ${value}
                    </aside>
                    <div class="lg:hidden my-4 p-4 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm leading-relaxed text-gray-700 dark:text-gray-300 transition-colors duration-200">
                        ${value}
                    </div>`;
            case "flow":
            case "flowchart":
            case "diagram":
            case "mindmap":
                const diagramId = `diagram_${Math.random()
                    .toString(36)
                    .slice(2)}`;
                const diagramCode = value as string;
                try {
                    const svgElement = await mermaidToSvg(
                        `---
config:
    theme: 'base'
    themeVariables:
        primaryColor: '#6D28D9'
        primaryTextColor: '#F3F4F6'
        primaryBorderColor: '#4C1D95'
        lineColor: '#A78BFA'
        secondaryColor: '#1E1B4B'
        tertiaryColor: '#312E81'
---
                    ${diagramCode}`
                    );
                    // Serialize SVG element to string for HTML insertion
                    const svgHtml = svgElement.outerHTML;
                    return `
                        <div class="my-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-4 text-center transition-colors duration-200"
                             id="${diagramId}">
                            ${svgHtml}
                        </div>
                    `;
                } catch (err) {
                    return `
                        <div class="my-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-4 text-center transition-colors duration-200"
                             id="${diagramId}">
                            <div class="text-red-600 dark:text-red-400 italic">Diagram render error: ${String(
                                err
                            )}</div>
                        </div>
                    `;
                }
            /* ────────────────────────────────────────────────────────── */
            /*  SMALL BLOCKS  (note | warning | tip | quote | link)      */
            /* ────────────────────────────────────────────────────────── */

            case "note":
                return `
        <div class="my-4 flex items-start gap-3 p-4
                    bg-blue-50/60 dark:bg-blue-900/25
                    border-l-4 border-blue-500 dark:border-blue-400
                    rounded-2xl shadow-sm transition
                    hover:shadow-md hover:-translate-y-0.5 animate-fade-in">
            <i class="fa-solid fa-note-sticky text-blue-600 dark:text-blue-400
                       text-2xl flex-shrink-0 mt-0.5"></i>
            <div class="text-blue-800 dark:text-blue-200 leading-relaxed">
                ${value}
            </div>
        </div>`;

            case "warning":
                return `
        <div class="my-4 flex items-start gap-3 p-4
                    bg-yellow-50/70 dark:bg-yellow-900/25
                    border-l-4 border-yellow-500 dark:border-yellow-400
                    rounded-2xl shadow-sm transition
                    hover:shadow-md hover:-translate-y-0.5 animate-fade-in">
            <i class="fa-solid fa-triangle-exclamation
                       text-yellow-600 dark:text-yellow-400
                       text-2xl flex-shrink-0 mt-0.5 animate-pulse"></i>
            <div class="text-yellow-800 dark:text-yellow-200 leading-relaxed">
                ${value}
            </div>
        </div>`;

            case "tip":
                return `
        <div class="my-4 flex items-start gap-3 p-4
                    bg-green-50/60 dark:bg-green-900/25
                    border-l-4 border-green-500 dark:border-green-400
                    rounded-2xl shadow-sm transition
                    hover:shadow-md hover:-translate-y-0.5 animate-fade-in">
            <i class="fa-solid fa-lightbulb
                       text-green-600 dark:text-green-400
                       text-2xl flex-shrink-0 mt-0.5 animate-bounce duration-[2s]"></i>
            <div class="text-green-800 dark:text-green-200 leading-relaxed">
                ${value}
            </div>
        </div>`;

            case "quote":
                return `
        <blockquote class="my-6 relative p-6
                           bg-slate-50 dark:bg-slate-800/40
                           border-l-4 border-blue-500 dark:border-blue-400
                           rounded-2xl shadow-sm animate-fade-in">
            <i class="fa-solid fa-quote-left absolute -top-10 -left-10
                       text-blue-500 dark:text-blue-400 text-3xl opacity-90"></i>
            <div class="italic text-slate-700 dark:text-slate-200 pl-6">
                ${value}
            </div>
        </blockquote>`;

            case "link":
                return `
        <a href="${value}"
           target="_blank" rel="noopener noreferrer"
           class="inline-flex items-center gap-2 my-2 px-4 py-2
                  text-blue-600 dark:text-blue-300 font-medium
                  border-2 border-blue-600/80 dark:border-blue-400/80
                  rounded-xl hover:bg-blue-600 hover:text-white
                  dark:hover:bg-blue-500 transition
                  shadow-sm hover:shadow-md">
            <i class="fa-solid fa-arrow-up-right-from-square"></i>
            ${value}
        </a>`;

            default:
                return `<div class="my-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg text-red-800 dark:text-red-200 font-mono text-sm">
                        <div class="font-semibold mb-2">Unknown content type:</div>
                        ${JSON.stringify(item)}
                    </div>`;
        }
    });

    const parsedContent = await Promise.all(parsedContentPromises);
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
/**
 * Render Mermaid text to an <svg> element.
 *
 * @param diagram  The Mermaid definition, e.g. `"graph TD; A-->B"`.
 * @returns        A Promise that resolves to an SVGSVGElement ready to insert into the DOM.
 *
 * No globals, no timers, no side effects.  If @mermaid-js/mermaid is already on
 * the page (window.mermaid) it is reused; otherwise the library is imported
 * dynamically.  Initialization happens exactly once.
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

/* ------------------------------------------------------------------------- */
/* Example (in async context)                                                */
// const svg = await mermaidToSvg("graph TD; A-->B; B-->C; C-->A");
// document.body.appendChild(svg);

export const parseJsonToHtml = parseSchemaArray;
