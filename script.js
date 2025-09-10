const form = document.getElementById('repo-form');
const repoUrlInput = document.getElementById('repo-url');
const analyzeBtn = document.getElementById('analyze-btn');
const loadingDiv = document.getElementById('loading');
const welcomeMessageDiv = document.getElementById('welcome-message');
const issuesContainer = document.getElementById('issues-container');
const errorContainer = document.getElementById('error-container');
const toggleSettingsBtn = document.getElementById('toggle-settings-btn');
const settingsSection = document.getElementById('settings-section');
const userContextInput = document.getElementById('user-context');
const todoToggle = document.getElementById('todo-toggle');

// ----------------------
// 1) DEFAULT TODO = ON
//    and remember choice
// ----------------------
document.addEventListener('DOMContentLoaded', () => {
    const saved = localStorage.getItem('lb_scan_todos');
    if (saved === null) {
        // First visit: default to ON
        todoToggle.checked = true;
    } else {
        todoToggle.checked = (saved === 'true');
    }
    todoToggle.addEventListener('change', () => {
        localStorage.setItem('lb_scan_todos', String(todoToggle.checked));
    });
});

// This script expects GEMINI_API_KEY to be defined in config.js
if (typeof GEMINI_API_KEY === 'undefined') {
    displayError("API Key not found. Please make sure config.js is loaded and contains your GEMINI_API_KEY.");
}
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${GEMINI_API_KEY}`;

toggleSettingsBtn.addEventListener('click', () => {
    settingsSection.classList.toggle('hidden');
});

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const repoUrl = repoUrlInput.value;
    const userContext = userContextInput.value;
    const scanTodos = todoToggle.checked;
    if (!repoUrl) return;

    // Start loading state
    welcomeMessageDiv.classList.add('hidden');
    issuesContainer.classList.add('hidden');
    errorContainer.classList.add('hidden');
    issuesContainer.innerHTML = '';
    errorContainer.innerHTML = '';
    loadingDiv.classList.remove('hidden');
    analyzeBtn.disabled = true;
    analyzeBtn.classList.add('opacity-50', 'cursor-not-allowed');

    try {
        const issues = await getAiSuggestions(repoUrl, userContext, scanTodos);
        displayIssues(repoUrl, issues);
    } catch (error) {
        console.error("Error fetching AI suggestions:", error);
        displayError("Failed to get suggestions. Please check the repository URL and try again. The AI may be unable to access the repository or the content is too large.");
    } finally {
        // End loading state
        loadingDiv.classList.add('hidden');
        analyzeBtn.disabled = false;
        analyzeBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    }
});

async function getAiSuggestions(repoUrl, userContext, scanTodos) {
    const systemPrompt = `You are an expert software developer creating a public bounty for an open-source project. Your tone should be professional, clear, and encouraging to attract contributors. 
        Your task is to analyze a public GitHub repository and identify potential areas for improvement that can be turned into actionable tasks.`;
    
    let userQuery = `Analyze the GitHub repository at this URL: ${repoUrl}. 
        Based on the repository's README, file structure, and overall purpose, generate up to 5 concrete suggestions for improvement.`;

    if (scanTodos) {
        userQuery += `\n\nAdditionally, scan the codebase for comments like "// TODO:" or "// FIXME:" and convert them into formal issues. Prioritize these TODO-based issues in the list.`;
    }

    if (userContext) {
        userQuery += `\n\nPay special attention to the following user goal: "${userContext}". The suggestions should be tailored to help achieve this goal.`;
    }
    
    userQuery += `\n\nFor each suggestion, provide a clear title and a detailed description. The description must be in Markdown and formatted exactly like this:
        
        ### Problem
        A clear and concise explanation of the problem or the area for improvement.
        
        ### Proposed Solution
        A detailed, step-by-step guide on how to implement the solution. Be specific.
        
        ### Required Technologies
        A list of any specific libraries, frameworks, or technologies a developer might need to complete this task. If none, state "None".

        Finally, provide a 'type' ('improvement', 'vulnerability', 'feature', 'todo') and an array of 2-3 relevant 'tags' (e.g., 'Refactor', 'Frontend', 'Security').`;

    const payload = {
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ parts: [{ text: userQuery }] }],
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
                type: "ARRAY",
                items: {
                    type: "OBJECT",
                    properties: {
                        "title": { "type": "STRING" },
                        "description": { "type": "STRING" },
                        "tags": { "type": "ARRAY", "items": { "type": "STRING" } },
                        "type": { "type": "STRING", "enum": ["improvement", "vulnerability", "feature", "todo"] }
                    },
                    required: ["title", "description", "tags", "type"]
                }
            }
        }
    };

    const response = await fetch(GEMINI_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errorBody = await response.json();
        console.error("API Error:", errorBody);
        throw new Error(`API request failed with status ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.candidates || !result.candidates[0].content || !result.candidates[0].content.parts[0].text) {
        console.error("Unexpected API response structure:", result);
        throw new Error("Could not parse AI suggestions from the API response.");
    }
    
    const jsonText = result.candidates[0].content.parts[0].text;
    return JSON.parse(jsonText);
}

function displayError(message) {
    errorContainer.innerHTML = `<div class="error-message"><p><strong>Error:</strong> ${message}</p></div>`;
    errorContainer.classList.remove('hidden');
}

function getTagColor(tag) {
    const lowerTag = tag.toLowerCase();
    if (lowerTag.includes('priority') || lowerTag.includes('security')) return 'bg-red-100 text-red-800';
    if (lowerTag.includes('refactor') || lowerTag.includes('backend')) return 'bg-blue-100 text-blue-800';
    if (lowerTag.includes('ui/ux') || lowerTag.includes('frontend')) return 'bg-green-100 text-green-800';
    if (lowerTag.includes('testing')) return 'bg-yellow-100 text-yellow-800';
    if (lowerTag.includes('todo')) return 'bg-amber-100 text-amber-800';
    return 'bg-slate-100 text-slate-800';
}

function getIcon(type) {
     if (type === 'vulnerability') {
        return `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 text-red-500">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.249-8.25-3.286Zm0 13.036h.008v.008H12v-.008Z" />
                </svg>`;
     }
     if (type === 'feature') {
        return `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 text-purple-500">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
                </svg>`;
     }
    if (type === 'todo') {
        return `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 text-amber-500">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>`;
    }
     return `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 text-blue-500">
                <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
            </svg>`;
}

// --------------
// Markdown utils
// --------------
function renderMarkdown(mdText) {
    // Configure marked + hljs
    marked.setOptions({
        gfm: true,
        breaks: false,
        headerIds: true,
        mangle: false,
        highlight(code, lang) {
            try {
                if (lang && hljs.getLanguage(lang)) {
                    return hljs.highlight(code, { language: lang }).value;
                }
            } catch {}
            try {
                return hljs.highlightAuto(code).value;
            } catch {}
            return code;
        }
    });
    const raw = marked.parse(mdText || '');
    const safe = DOMPurify.sanitize(raw, { USE_PROFILES: { html: true } });
    return `<div class="markdown-body">${safe}</div>`;
}

function displayIssues(repoUrl, issues) {
    // Add a title
    const repoName = new URL(repoUrl).pathname.substring(1);
    const titleHtml = `<h2 class="text-2xl font-bold text-slate-800 mb-5">Suggestions for <span class="text-indigo-600">${repoName}</span></h2>`;
    issuesContainer.innerHTML = titleHtml;

    if (!issues || issues.length === 0) {
         issuesContainer.innerHTML += `<p class="text-slate-500 text-center py-8">The AI couldn't find any specific suggestions for this repository.</p>`;
         issuesContainer.classList.remove('hidden');
         return;
    }

    // Create and append issue cards
    issues.forEach(issue => {
        // Add "TODO" tag if the issue type is 'todo' and it's not already present
        if (issue.type === 'todo' && !issue.tags.includes('TODO')) {
            issue.tags.unshift('TODO');
        }
        const tagsHtml = issue.tags.map(tag => `<span class="text-xs font-medium mr-2 px-2.5 py-1 rounded-full ${getTagColor(tag)}">${tag}</span>`).join('');

        // Construct the GitHub issue URL (use original markdown as body)
        const issueTitle = encodeURIComponent(issue.title);
        const issueBody = encodeURIComponent(issue.description);
        const newIssueUrl = `https://github.com/${repoName}/issues/new?title=${issueTitle}&body=${issueBody}`;
        
        // ✅ Pretty, safe markdown rendering
        const descriptionHtml = renderMarkdown(issue.description);

        const card = `
            <div class="bg-white rounded-lg shadow-md overflow-hidden transition-all hover:shadow-xl">
                <div class="p-6">
                    <div class="flex items-start space-x-4">
                        <div class="flex-shrink-0">${getIcon(issue.type)}</div>
                        <div class="flex-grow">
                            <h3 class="text-lg font-semibold text-slate-900">${issue.title}</h3>
                            <div class="mt-2 mb-4">
                                ${tagsHtml}
                            </div>
                            <div class="text-slate-700 text-sm leading-relaxed">${descriptionHtml}</div>
                        </div>
                    </div>
                    <div class="mt-6 flex justify-end">
                        <a href="${newIssueUrl}" target="_blank" rel="noopener noreferrer" class="bg-slate-800 text-white font-semibold py-2 px-4 rounded-md hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors flex items-center space-x-2">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="w-4 h-4">
                              <path fill-rule="evenodd" d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0ZM1.5 8a6.5 6.5 0 1 1 13 0 6.5 6.5 0 0 1-13 0Zm5-2.25a.75.75 0 0 1 .75.75v1.75h1.75a.75.75 0 0 1 0 1.5H7.25v1.75a.75.75 0 0 1-1.5 0V9.75H4a.75.75 0 0 1 0-1.5h1.75V6.5a.75.75 0 0 1 .75-.75Z" clip-rule="evenodd"></path>
                            </svg>
                            <span>Create GitHub Issue</span>
                        </a>
                    </div>
                </div>
            </div>
        `;
        issuesContainer.innerHTML += card;
    });

    issuesContainer.classList.remove('hidden');
}