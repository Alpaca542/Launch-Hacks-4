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
    quiz?: QuizData;
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
                    const quizData = value as QuizData;
                    const quizId = `quiz-${Math.random()
                        .toString(36)
                        .substr(2, 9)}`;

                    const answerButtons = quizData.answers
                        .map((answer, index) => {
                            const answerText = Object.keys(answer)[0];
                            const hint = answer[answerText];
                            return `<button class="quiz-answer" data-quiz-id="${quizId}" data-answer-index="${index}" data-hint="${hint}">${answerText}</button>`;
                        })
                        .join("");

                    return `
                        <script>
                            // Initialize global quiz functions and data immediately
                            window.quizData = window.quizData || {};
                            
                            if (!window.selectAnswer) {
                                window.selectAnswer = function(selectedIndex, quizId) {
                                    console.log('selectAnswer called with:', selectedIndex, quizId);
                                    const quiz = document.getElementById(quizId);
                                    const hintDiv = document.getElementById(quizId + '-hint');
                                    const resultDiv = document.getElementById(quizId + '-result');
                                    const buttons = quiz.querySelectorAll('.quiz-answer');
                                    const correctIndex = window.quizData[quizId].correctAnswer;
                                    
                                    console.log('Quiz data:', window.quizData[quizId]);
                                    
                                    // Get the hint for the selected answer
                                    const selectedButton = buttons[selectedIndex];
                                    const hint = selectedButton.getAttribute('data-hint');
                                    
                                    if (selectedIndex === correctIndex) {
                                        // Correct answer
                                        hintDiv.style.display = 'none';
                                        resultDiv.style.display = 'block';
                                        buttons.forEach(btn => btn.disabled = true);
                                        selectedButton.classList.add('correct');
                                    } else {
                                        // Wrong answer - show hint
                                        hintDiv.textContent = hint;
                                        hintDiv.style.display = 'block';
                                        hintDiv.className = 'quiz-hint show';
                                        selectedButton.classList.add('incorrect');
                                        selectedButton.disabled = true;
                                    }
                                };
                            }
                            
                            if (!window.retryQuiz) {
                                window.retryQuiz = function(quizId) {
                                    console.log('retryQuiz called with:', quizId);
                                    const quiz = document.getElementById(quizId);
                                    const hintDiv = document.getElementById(quizId + '-hint');
                                    const resultDiv = document.getElementById(quizId + '-result');
                                    const buttons = quiz.querySelectorAll('.quiz-answer');
                                    
                                    // Reset all states
                                    hintDiv.style.display = 'none';
                                    hintDiv.textContent = '';
                                    hintDiv.className = 'quiz-hint';
                                    resultDiv.style.display = 'none';
                                    
                                    buttons.forEach(btn => {
                                        btn.disabled = false;
                                        btn.classList.remove('correct', 'incorrect');
                                    });
                                };
                            }
                            
                            // Store quiz data for this specific quiz
                            window.quizData['${quizId}'] = ${JSON.stringify(
                        quizData
                    )};
                            console.log('Stored quiz data for ${quizId}:', window.quizData['${quizId}']);
                        </script>
                        <div class="parsed-quiz" id="${quizId}">
                            <div class="quiz-question">${
                                quizData.question
                            }</div>
                            <div class="quiz-answers">
                                ${answerButtons}
                            </div>
                            <div class="quiz-hint" id="${quizId}-hint"></div>
                            <div class="quiz-result" id="${quizId}-result" style="display: none;">
                                <p>🎉 You win! 🎉</p>
                                <button class="quiz-retry" onclick="retryQuiz('${quizId}')">Retry?</button>
                            </div>
                        </div>
                        <script>
                            // Add event listeners after the DOM elements are created
                            (function() {
                                const quizId = '${quizId}';
                                const buttons = document.querySelectorAll('[data-quiz-id="' + quizId + '"]');
                                
                                buttons.forEach(button => {
                                    button.addEventListener('click', function() {
                                        const answerIndex = parseInt(this.getAttribute('data-answer-index'));
                                        window.selectAnswer(answerIndex, quizId);
                                    });
                                });
                            })();
                        </script>
                    `;

                case "img":
                    const [imgSrc, imgDesc] = value as [string, string];
                    return `<figure class="parsed-img"><img src="${imgSrc}" alt="${imgDesc}" /><figcaption>${imgDesc}</figcaption></figure>`;

                case "vid":
                    const [vidSrc, vidDesc] = value as [string, string];
                    return `<figure class="parsed-vid"><video controls src="${vidSrc}"></video><figcaption>${vidDesc}</figcaption></figure>`;

                case "gif":
                    const [gifSrc, gifDesc] = value as [string, string];
                    return `<figure class="parsed-gif"><img src="${gifSrc}" alt="${gifDesc}" /><figcaption>${gifDesc}</figcaption></figure>`;

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
                    // Leave blank div for complex diagram implementation (like mermaid)
                    return `<div class="parsed-diagram" data-diagram="${value}"></div>`;

                case "note":
                    return `<div class="parsed-note parsed-callout"><div class="callout-icon">📝</div><div class="callout-content">${value}</div></div>`;

                case "warning":
                    return `<div class="parsed-warning parsed-callout"><div class="callout-icon">⚠️</div><div class="callout-content">${value}</div></div>`;

                case "tip":
                    return `<div class="parsed-tip parsed-callout"><div class="callout-icon">💡</div><div class="callout-content">${value}</div></div>`;

                case "htmlCanvas":
                    // Leave blank div for complex canvas implementation
                    return `<div class="parsed-html-canvas" data-canvas-code="${encodeURIComponent(
                        value as string
                    )}"></div>`;

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
