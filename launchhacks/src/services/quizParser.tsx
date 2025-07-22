/**
 * Quiz Parser Service
 *
 * Utilities for processing and rendering interactive quiz components
 * with progress tracking, animations, and accessibility features.
 */

import React from 'react';

export interface QuizAnswer {
    [answerText: string]: string; // answer text -> hint text
}

export interface QuizData {
    question: string;
    answers: QuizAnswer[];
    correctAnswer: number;
}

export interface QuizParserProps {
    quizData: QuizData[];
    className?: string;
}

/**
 * Generate HTML string for interactive quiz from quiz data
 */
export const generateQuizHTML = (quizArray: QuizData[]): string => {
    const quizSetId = `quiz-set-${Math.random().toString(36).substr(2, 9)}`;

    /* ========== BUILD EACH QUESTION ========== */
    const quizHtml = quizArray
        .map((quizData, quizIndex) => {
            const quizId = `${quizSetId}-q${quizIndex}`;
            const progress = Math.round(((quizIndex + 1) / quizArray.length) * 100);

            /* ----- answers ----- */
            const answerButtons = quizData.answers
                .map((answer, idx) => {
                    const answerText = Object.keys(answer)[0];
                    const hint = answer[answerText];
                    const isCorrect = idx === quizData.correctAnswer;

                    const clickHandler = `
                        const quiz    = document.getElementById('${quizId}');
                        const hintDiv = document.getElementById('${quizId}-hint');
                        const result  = document.getElementById('${quizId}-result');
                        const nextBtn = document.getElementById('${quizId}-next');
                        const buttons = quiz.querySelectorAll('.quiz-answer');
                        const me      = this;

                        if (${isCorrect}) {
                            hintDiv.classList.add('hidden');
                            result.style.display = 'flex';
                            result.classList.remove('hidden');
                            if (nextBtn) {
                                nextBtn.style.display = 'inline-flex';
                                nextBtn.classList.remove('hidden');
                            }
                            buttons.forEach(b => b.disabled = true);

                            me.classList.add('bg-green-50','dark:bg-green-900/20',
                                             'border-green-500','text-green-800','dark:text-green-100',
                                             'shadow-inner');
                            me.classList.remove('hover:bg-slate-50','dark:hover:bg-slate-800');
                            me.classList.add('scale-105');
                        } else {
                            hintDiv.textContent = '${hint.replace(/'/g, "\\'")}';
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
            const nextHandler = quizIndex < quizArray.length - 1
                ? `
                    document.getElementById('${quizSetId}-q${quizIndex}').classList.add('hidden');
                    document.getElementById('${quizSetId}-q${quizIndex + 1}').classList.remove('hidden');
                    window.scrollTo({ top: document.getElementById('${quizSetId}-q${quizIndex + 1}').offsetTop - 20, behavior: 'smooth' });`
                : `
                    document.getElementById('${quizSetId}-completion').classList.remove('hidden');
                    document.getElementById('${quizId}').classList.add('hidden');
                    window.scrollTo({ top: document.getElementById('${quizSetId}-completion').offsetTop - 20, behavior: 'smooth' });`;

            const nextButton = quizIndex < quizArray.length - 1
                ? `<button id="${quizId}-next"
                           class="hidden items-center gap-2
                                  bg-blue-600 hover:bg-blue-700
                                  dark:bg-blue-500 dark:hover:bg-blue-600
                                  text-white px-6 py-2 rounded-lg font-semibold
                                  transition-colors duration-200 drop-shadow-md"
                           onclick="${nextHandler}"
                           style="display: none;">
                       Next <i class="fa-solid fa-arrow-right"></i>
                   </button>`
                : `<button id="${quizId}-next"
                           class="hidden items-center gap-2
                                  bg-green-600 hover:bg-green-700
                                  dark:bg-green-500 dark:hover:bg-green-600
                                  text-white px-6 py-2 rounded-lg font-semibold
                                  transition-colors duration-200 drop-shadow-md"
                           onclick="${nextHandler}"
                           style="display: none;">
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
                        Question ${quizIndex + 1} / ${quizArray.length}
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
                         class="hidden flex-col items-center gap-6 mb-4 animate-fade-in"
                         style="display: none;">

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
};

/**
 * React component for rendering interactive quizzes
 */
export const QuizParser: React.FC<QuizParserProps> = ({ quizData, className = "" }) => {
    const quizHTML = generateQuizHTML(quizData);

    return (
        <div 
            className={`quiz-container ${className}`}
            dangerouslySetInnerHTML={{ __html: quizHTML }}
            role="region"
            aria-label="Interactive Quiz"
        />
    );
};

/**
 * Extract quiz data from raw quiz content for validation
 */
export const validateQuizData = (quizData: QuizData[]): boolean => {
    return quizData.every(quiz => {
        return (
            quiz.question &&
            quiz.answers &&
            quiz.answers.length > 0 &&
            quiz.correctAnswer >= 0 &&
            quiz.correctAnswer < quiz.answers.length &&
            quiz.answers.every(answer => 
                Object.keys(answer).length === 1 && 
                Object.values(answer).every(hint => typeof hint === 'string')
            )
        );
    });
};

/**
 * Enhanced quiz parser with accessibility features
 */
export const processQuizHTML = (rawQuizData: QuizData[]): string => {
    if (!validateQuizData(rawQuizData)) {
        console.warn('Invalid quiz data provided');
        return '<div class="error">Invalid quiz data</div>';
    }

    return generateQuizHTML(rawQuizData);
};

export default QuizParser;
