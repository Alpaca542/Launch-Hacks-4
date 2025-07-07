const parseTextblock = text => {
    // Parse markdown-style formatting: **bold**, (text)[url]
    return text
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\((.*?)\)\[(.*?)\]/g, '<a href="$2" target="_blank">$1</a>')
}

const parseSchemaArray = schemaArray => {
    const parsedContent = schemaArray
        .map(item => {
            const key = Object.keys(item)[0]
            const value = item[key]

            switch (key) {
                case "large_header":
                    return `<h1 class="parsed-large-header">${value}</h1>`

                case "small_header":
                    return `<h2 class="parsed-small-header">${value}</h2>`

                case "ul":
                    const ulItems = value.map(item => `<li>${item}</li>`).join("")
                    return `<ul class="parsed-ul">${ulItems}</ul>`

                case "ol":
                    const olItems = value.map(item => `<li>${item}</li>`).join("")
                    return `<ol class="parsed-ol">${olItems}</ol>`

                case "quiz":
                    const quizData = value
                    const quizId = `quiz-${Math.random()
                        .toString(36)
                        .substr(2, 9)}`

                    const answerButtons = quizData.answers
                        .map((answer, index) => {
                            const answerText = Object.keys(answer)[0]
                            const hint = answer[answerText]
                            const isCorrect = index === quizData.correctAnswer

                            const clickHandler = `
                                const quiz = document.getElementById('${quizId}');
                                const hintDiv = document.getElementById('${quizId}-hint');
                                const resultDiv = document.getElementById('${quizId}-result');
                                const buttons = quiz.querySelectorAll('.quiz-answer');
                                const selectedButton = this;
                                
                                if (${isCorrect}) {
                                    // Correct answer
                                    hintDiv.style.display = 'none';
                                    resultDiv.style.display = 'block';
                                    buttons.forEach(btn => btn.disabled = true);
                                    selectedButton.classList.add('correct');
                                } else {
                                    // Wrong answer - show hint
                                    hintDiv.textContent = '${hint.replace(/'/g, "\\'")}';
                                    hintDiv.style.display = 'block';
                                    hintDiv.className = 'quiz-hint show';
                                    selectedButton.classList.add('incorrect');
                                    selectedButton.disabled = true;
                                }
                            `

                            return `<button class="quiz-answer" onclick="${clickHandler}">${answerText}</button>`
                        })
                        .join("")

                    const retryHandler = `
                        const quiz = document.getElementById('${quizId}');
                        const hintDiv = document.getElementById('${quizId}-hint');
                        const resultDiv = document.getElementById('${quizId}-result');
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
                    `

                    return `
                        <div class="parsed-quiz" id="${quizId}">
                            <div class="quiz-question">${quizData.question}</div>
                            <div class="quiz-answers">
                                ${answerButtons}
                            </div>
                            <div class="quiz-hint" id="${quizId}-hint"></div>
                            <div class="quiz-result" id="${quizId}-result" style="display: none;">
                                <p>🎉 You win! 🎉</p>
                                <button class="quiz-retry" onclick="${retryHandler}">Retry?</button>
                            </div>
                        </div>
                    `

                case "img":
                    const [imgSrc, imgDesc] = value
                    return `<figure class="parsed-img"><img src="${imgSrc}" alt="${imgDesc}" /><figcaption>${imgDesc}</figcaption></figure>`

                case "vid":
                    const [vidSrc, vidDesc] = value
                    return `<figure class="parsed-vid"><video controls src="${vidSrc}"></video><figcaption>${vidDesc}</figcaption></figure>`

                case "gif":
                    const [gifSrc, gifDesc] = value
                    return `<figure class="parsed-gif"><img src="${gifSrc}" alt="${gifDesc}" /><figcaption>${gifDesc}</figcaption></figure>`

                case "textblock":
                    return `<div class="parsed-textblock">${parseTextblock(value)}</div>`

                case "codeblock":
                    return `<pre class="parsed-codeblock"><code>${value}</code></pre>`

                case "quote":
                    return `<blockquote class="parsed-quote">${value}</blockquote>`

                case "link":
                    return `<a href="${value}" class="parsed-link" target="_blank">${value}</a>`

                case "table":
                    const tableData = value
                    const headerRow = tableData[0]
                    const bodyRows = tableData.slice(1)

                    const headerHtml = `<thead><tr>${headerRow
                        .map(cell => `<th>${cell}</th>`)
                        .join("")}</tr></thead>`
                    const bodyHtml = `<tbody>${bodyRows
                        .map(
                            row => `<tr>${row.map(cell => `<td>${cell}</td>`).join("")}</tr>`
                        )
                        .join("")}</tbody>`

                    return `<table class="parsed-table">${headerHtml}${bodyHtml}</table>`

                case "purehtml":
                    return `<div class="parsed-purehtml">${value}</div>`

                case "sidecontainer":
                    return `<aside class="parsed-sidecontainer">${value}</aside>`

                case "diagram":
                    // Leave blank div for complex diagram implementation (like mermaid)
                    return `<div class="parsed-diagram" data-diagram="${value}"></div>`

                case "note":
                    return `<div class="parsed-note parsed-callout"><div class="callout-icon">📝</div><div class="callout-content">${value}</div></div>`

                case "warning":
                    return `<div class="parsed-warning parsed-callout"><div class="callout-icon">⚠️</div><div class="callout-content">${value}</div></div>`

                case "tip":
                    return `<div class="parsed-tip parsed-callout"><div class="callout-icon">💡</div><div class="callout-content">${value}</div></div>`

                case "htmlCanvas":
                    // Leave blank div for complex canvas implementation
                    return `<div class="parsed-html-canvas" data-canvas-code="${encodeURIComponent(
                        value
                    )}"></div>`

                default:
                    return `<div class="parsed-unknown">${JSON.stringify(item)}</div>`
            }
        })
        .join("\n")

    return parsedContent
}

export const parseJsonToHtml = parseSchemaArray
