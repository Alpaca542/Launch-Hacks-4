interface QuizData {
    question: string;
    answers: Array<{ [key: string]: string }>;
    correctAnswer: number;
}

interface SchemaItem {
    large_header?: string;
    small_header?: string;
    ul?: string[];
    ol?: string[];
    quiz?: QuizData[];
    img?: [string, string]; // [src, description]
    vid?: [string, string]; // [src, description]
    gif?: [string, string]; // [src, description]
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
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\((.*?)\)\[(.*?)\]/g, '<a href="$2" target="_blank">$1</a>');
};

const parseSchemaArray = (schemaArray: SchemaItem[]): string => {
    const parsedContent = schemaArray
        .map((item) => {
            const key = Object.keys(item)[0];
            const value = item[key as keyof SchemaItem];

            switch (key) {
                case "large_header":
                    return `<h1 class="parsed-large-header">${value}</h1>`;

                case "small_header":
                    return `<h2 class="parsed-small-header">${value}</h2>`;

                case "ul":
                    const ulItems = (value as string[])
                        .map((item) => `<li>${item}</li>`)
                        .join("");
                    return `<ul class="parsed-ul">${ulItems}</ul>`;

                case "ol":
                    const olItems = (value as string[])
                        .map((item) => `<li>${item}</li>`)
                        .join("");
                    return `<ol class="parsed-ol">${olItems}</ol>`;

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
                                            hintDiv.style.display = 'none';
                                            resultDiv.style.display = 'block';
                                            if (nextBtn) nextBtn.style.display = 'block';
                                            buttons.forEach(btn => btn.disabled = true);
                                            selectedButton.classList.add('correct');
                                        } else {
                                            // Wrong answer - show hint
                                            hintDiv.textContent = '${hint.replace(
                                                /'/g,
                                                "\\'"
                                            )}';
                                            hintDiv.style.display = 'block';
                                            hintDiv.className = 'quiz-hint show';
                                            selectedButton.classList.add('incorrect');
                                            selectedButton.disabled = true;
                                        }
                                    `;

                                    return `<button class="quiz-answer" onclick="${clickHandler}">${answerText}</button>`;
                                })
                                .join("");

                            const retryHandler = `
                                const quiz = document.getElementById('${quizId}');
                                const hintDiv = document.getElementById('${quizId}-hint');
                                const resultDiv = document.getElementById('${quizId}-result');
                                const nextBtn = document.getElementById('${quizId}-next');
                                const buttons = quiz.querySelectorAll('.quiz-answer');
                                
                                // Reset all states
                                hintDiv.style.display = 'none';
                                hintDiv.textContent = '';
                                hintDiv.className = 'quiz-hint';
                                resultDiv.style.display = 'none';
                                if (nextBtn) nextBtn.style.display = 'none';
                                
                                buttons.forEach(btn => {
                                    btn.disabled = false;
                                    btn.classList.remove('correct', 'incorrect');
                                });
                            `;

                            const nextHandler =
                                quizIndex < quizArray.length - 1
                                    ? `
                                document.getElementById('${quizSetId}-q${quizIndex}').style.display = 'none';
                                document.getElementById('${quizSetId}-q${
                                          quizIndex + 1
                                      }').style.display = 'block';
                            `
                                    : `
                                document.getElementById('${quizSetId}-completion').style.display = 'block';
                                document.getElementById('${quizId}').style.display = 'none';
                            `;

                            const nextButton =
                                quizIndex < quizArray.length - 1
                                    ? `<button id="${quizId}-next" class="quiz-next" onclick="${nextHandler}" style="display: none;">Next Question</button>`
                                    : `<button id="${quizId}-next" class="quiz-finish" onclick="${nextHandler}" style="display: none;">Finish Quiz</button>`;

                            return `
                                <div class="parsed-quiz-question" id="${quizId}" style="${
                                quizIndex === 0
                                    ? "display: block;"
                                    : "display: none;"
                            }">
                                    <div class="quiz-progress">Question ${
                                        quizIndex + 1
                                    } of ${quizArray.length}</div>
                                    <div class="quiz-question">${
                                        quizData.question
                                    }</div>
                                    <div class="quiz-answers">
                                        ${answerButtons}
                                    </div>
                                    <div class="quiz-hint" id="${quizId}-hint"></div>
                                    <div class="quiz-result" id="${quizId}-result" style="display: none;">
                                        <p>🎉 Correct! 🎉</p>
                                        <button class="quiz-retry" onclick="${retryHandler}">Retry?</button>
                                        ${nextButton}
                                    </div>
                                </div>
                            `;
                        })
                        .join("");

                    const restartHandler = `
                        document.getElementById('${quizSetId}-completion').style.display = 'none';
                        document.getElementById('${quizSetId}-q0').style.display = 'block';
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
                                
                                hintDiv.style.display = 'none';
                                hintDiv.textContent = '';
                                hintDiv.className = 'quiz-hint';
                                resultDiv.style.display = 'none';
                                if (nextBtn) nextBtn.style.display = 'none';
                                
                                buttons.forEach(btn => {
                                    btn.disabled = false;
                                    btn.classList.remove('correct', 'incorrect');
                                });
                                
                                if (${index} > 0) quiz${index}.style.display = 'none';
                            }
                        `
                            )
                            .join("")}
                    `;

                    return `
                        <div class="parsed-quiz-set" id="${quizSetId}">
                            ${quizHtml}
                            <div class="quiz-completion" id="${quizSetId}-completion" style="display: none;">
                                <h3>🎉 Quiz Complete! 🎉</h3>
                                <p>You've finished all ${quizArray.length} questions!</p>
                                <button class="quiz-restart" onclick="${restartHandler}">Restart Quiz</button>
                            </div>
                        </div>
                    `;

                case "img":
                    const [imgSrc, imgDesc] = value as [string, string];
                    return `<figure class="parsed-img">
                        <img src="${imgSrc}" alt="${imgDesc}" 
                             onerror="this.onerror=null; this.src='https://picsum.photos/300/200?random=' + Math.floor(Math.random()*1000); this.alt='Fallback image (original failed to load)';" />
                        <figcaption>${imgDesc}</figcaption>
                    </figure>`;

                case "vid":
                    const [vidSrc, vidDesc] = value as [string, string];
                    return `<figure class="parsed-vid"><video controls src="${vidSrc}"></video><figcaption>${vidDesc}</figcaption></figure>`;

                case "gif":
                    const [gifSrc, gifDesc] = value as [string, string];
                    return `<figure class="parsed-gif">
                        <img src="${gifSrc}" alt="${gifDesc}" 
                             onerror="this.onerror=null; this.src='https://picsum.photos/300/200?random=' + Math.floor(Math.random()*1000); this.alt='Fallback image (original GIF failed to load)';" />
                        <figcaption>${gifDesc}</figcaption>
                    </figure>`;

                case "textblock":
                    return `<div class="parsed-textblock">${parseTextblock(
                        value as string
                    )}</div>`;

                case "codeblock":
                    return `<pre class="parsed-codeblock"><code>${value}</code></pre>`;

                case "quote":
                    return `<blockquote class="parsed-quote">${value}</blockquote>`;

                case "link":
                    return `<a href="${value}" class="parsed-link" target="_blank">${value}</a>`;

                case "table":
                    const tableData = value as string[][];
                    const headerRow = tableData[0];
                    const bodyRows = tableData.slice(1);

                    const headerHtml = `<thead><tr>${headerRow
                        .map((cell) => `<th>${cell}</th>`)
                        .join("")}</tr></thead>`;
                    const bodyHtml = `<tbody>${bodyRows
                        .map(
                            (row) =>
                                `<tr>${row
                                    .map((cell) => `<td>${cell}</td>`)
                                    .join("")}</tr>`
                        )
                        .join("")}</tbody>`;

                    return `<table class="parsed-table">${headerHtml}${bodyHtml}</table>`;

                case "purehtml":
                    return `<div class="parsed-purehtml">${value}</div>`;

                case "sidecontainer":
                    return `<aside class="parsed-sidecontainer">${value}</aside>`;

                case "diagram":
                    const diagramId = `diagram${Math.random()
                        .toString(36)
                        .substr(2, 9)}`;

                    // Store diagram code in a data attribute instead of inline JS
                    const diagramCode = (value as string)
                        .replace(/"/g, "&quot;")
                        .replace(/'/g, "&#39;");

                    return `
                        <div class="parsed-diagram" 
                             id="${diagramId}" 
                             data-diagram-code="${diagramCode}"
                             data-diagram-id="${diagramId}">
                            <div class="diagram-loading">Loading diagram...</div>
                            <button onclick="
                                const diagramDiv = this.parentElement;
                                const code = diagramDiv.getAttribute('data-diagram-code');
                                const id = diagramDiv.getAttribute('data-diagram-id');
                                
                                if (!window.mermaid) {
                                    const script = document.createElement('script');
                                    script.src = 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js';
                                    script.onload = function() {
                                        setTimeout(function() {
                                            if (!window.mermaidInitialized) {
                                                mermaid.initialize({ startOnLoad: false, theme: 'default', securityLevel: 'loose' });
                                                window.mermaidInitialized = true;
                                            }
                                            mermaid.render(id + 'svg', code).then(function(result) {
                                                diagramDiv.innerHTML = result.svg;
                                            }).catch(function(error) {
                                                diagramDiv.innerHTML = '<div style=&quot;color: red; padding: 10px;&quot;>Error: ' + error.message + '</div>';
                                            });
                                        }, 100);
                                    };
                                    document.head.appendChild(script);
                                } else {
                                    if (!window.mermaidInitialized) {
                                        mermaid.initialize({ startOnLoad: false, theme: 'default', securityLevel: 'loose' });
                                        window.mermaidInitialized = true;
                                    }
                                    mermaid.render(id + 'svg', code).then(function(result) {
                                        diagramDiv.innerHTML = result.svg;
                                    }).catch(function(error) {
                                        diagramDiv.innerHTML = '<div style=&quot;color: red; padding: 10px;&quot;>Error: ' + error.message + '</div>';
                                    });
                                }
                                this.style.display = 'none';
                            " style="display: none;">Render Diagram</button>
                            <button onclick="
                                const diagramDiv = this.parentElement;
                                const renderBtn = diagramDiv.querySelector('button');
                                renderBtn.click();
                                this.style.display = 'none';
                            " style="display: none;">Auto Render</button>
                        </div>
                    `;

                case "note":
                    return `<div class="parsed-note parsed-callout"><div class="callout-icon">📝</div><div class="callout-content">${value}</div></div>`;

                case "warning":
                    return `<div class="parsed-warning parsed-callout"><div class="callout-icon">⚠️</div><div class="callout-content">${value}</div></div>`;

                case "tip":
                    return `<div class="parsed-tip parsed-callout"><div class="callout-icon">💡</div><div class="callout-content">${value}</div></div>`;

                case "htmlCanvas":
                    const canvasId = `canvas${Math.random()
                        .toString(36)
                        .substr(2, 9)}`;

                    // Store canvas code in data attribute instead of inline JS
                    const canvasCode = (value as string)
                        .replace(/"/g, "&quot;")
                        .replace(/'/g, "&#39;");

                    return `
                        <div class="parsed-html-canvas" data-canvas-code="${canvasCode}" data-canvas-id="${canvasId}">
                            <canvas id="${canvasId}" width="400" height="300" style="border: 1px solid #ccc; max-width: 100%;"></canvas>
                            <div class="canvas-controls">
                                <button class="canvas-run" onclick="
                                    const canvasDiv = this.closest('.parsed-html-canvas');
                                    const code = canvasDiv.getAttribute('data-canvas-code');
                                    const id = canvasDiv.getAttribute('data-canvas-id');
                                    const canvas = document.getElementById(id);
                                    const ctx = canvas.getContext('2d');
                                    const errorDiv = document.getElementById(id + 'Error');
                                    
                                    errorDiv.style.display = 'none';
                                    errorDiv.textContent = '';
                                    
                                    try {
                                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                                        const canvasFunction = new Function('canvas', 'ctx', code);
                                        canvasFunction(canvas, ctx);
                                    } catch (error) {
                                        console.error('Canvas error:', error);
                                        errorDiv.textContent = 'Error: ' + error.message;
                                        errorDiv.style.display = 'block';
                                    }
                                ">▶ Run Code</button>
                                <button class="canvas-clear" onclick="
                                    const canvasDiv = this.closest('.parsed-html-canvas');
                                    const id = canvasDiv.getAttribute('data-canvas-id');
                                    const canvas = document.getElementById(id);
                                    const ctx = canvas.getContext('2d');
                                    const errorDiv = document.getElementById(id + 'Error');
                                    
                                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                                    errorDiv.style.display = 'none';
                                ">🗑️ Clear</button>
                                <button class="canvas-fullscreen" onclick="
                                    const canvasDiv = this.closest('.parsed-html-canvas');
                                    const id = canvasDiv.getAttribute('data-canvas-id');
                                    const canvas = document.getElementById(id);
                                    
                                    if (!document.fullscreenElement) {
                                        canvas.requestFullscreen().catch(err => {
                                            console.warn('Fullscreen failed:', err);
                                        });
                                    } else {
                                        document.exitFullscreen();
                                    }
                                ">⛶ Fullscreen</button>
                            </div>
                            <details class="canvas-code-viewer">
                                <summary>📝 View Code</summary>
                                <pre class="canvas-code"><code>${value}</code></pre>
                            </details>
                            <div class="canvas-error" id="${canvasId}Error" style="display: none; color: red; margin-top: 10px; padding: 10px; background: #ffe6e6; border: 1px solid #ff9999; border-radius: 4px;"></div>
                            <button onclick="
                                const canvasDiv = this.parentElement;
                                const runBtn = canvasDiv.querySelector('.canvas-run');
                                runBtn.click();
                                this.style.display = 'none';
                            " style="display: none;">Auto Run</button>
                        </div>
                    `;

                default:
                    return `<div class="parsed-unknown">${JSON.stringify(
                        item
                    )}</div>`;
            }
        })
        .join("\n");

    return parsedContent;
};

export const parseJsonToHtml = parseSchemaArray;
