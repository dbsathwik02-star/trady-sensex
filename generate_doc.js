import fs from 'fs';
import path from 'path';

const filesToInclude = [
  { name: 'backend/server.js', path: './backend/server.js', lang: 'javascript' },
  { name: 'backend/simulator.js', path: './backend/simulator.js', lang: 'javascript' },
  { name: 'backend/indicators.js', path: './backend/indicators.js', lang: 'javascript' },
  { name: 'backend/database.js', path: './backend/database.js', lang: 'javascript' },
  { name: 'frontend/src/App.jsx', path: './frontend/src/App.jsx', lang: 'javascript' },
  { name: 'frontend/src/index.css', path: './frontend/src/index.css', lang: 'css' },
  { name: 'frontend/src/components/ChartSection.jsx', path: './frontend/src/components/ChartSection.jsx', lang: 'javascript' },
  { name: 'frontend/src/components/OrderForm.jsx', path: './frontend/src/components/OrderForm.jsx', lang: 'javascript' },
  { name: 'frontend/src/components/Portfolio.jsx', path: './frontend/src/components/Portfolio.jsx', lang: 'javascript' },
  { name: 'frontend/src/components/Watchlist.jsx', path: './frontend/src/components/Watchlist.jsx', lang: 'javascript' },
  { name: 'frontend/src/components/NewsFeed.jsx', path: './frontend/src/components/NewsFeed.jsx', lang: 'javascript' },
  { name: 'frontend/src/components/AuthModal.jsx', path: './frontend/src/components/AuthModal.jsx', lang: 'javascript' },
  { name: 'frontend/src/components/ProfileSection.jsx', path: './frontend/src/components/ProfileSection.jsx', lang: 'javascript' },
  { name: 'frontend/src/components/ChatBot.jsx', path: './frontend/src/components/ChatBot.jsx', lang: 'javascript' },
];

const escapeHtml = (text) => {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

let tabsHtml = '';
let contentHtml = '';

filesToInclude.forEach((f, idx) => {
  try {
    const content = fs.readFileSync(f.path, 'utf8');
    const escaped = escapeHtml(content);
    const showClass = idx === 0 ? 'block' : 'hidden';
    
    // Add Tab Button
    tabsHtml += `
      <button 
        onclick="switchTab(event, 'tab-${idx}')" 
        class="tab-btn w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800/20 border-l-2 border-transparent transition-all truncate ${idx === 0 ? 'border-blue-500 text-white bg-slate-800/40' : ''}"
      >
        ${f.name}
      </button>
    `;
    
    // Add Code Panel
    contentHtml += `
      <div id="tab-${idx}" class="tab-content ${showClass} p-4 bg-[#080c14] overflow-auto h-[73vh]">
        <pre><code class="language-${f.lang}">${escaped}</code></pre>
      </div>
    `;
  } catch (err) {
    console.error(`Failed to read file ${f.name}:`, err.message);
  }
});

const htmlTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>BSE SENSEX Live Trader - Code Documentation</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <!-- Prism.js for syntax highlighting -->
  <link href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css" rel="stylesheet" />
  <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-javascript.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-css.min.js"></script>
  <style>
    body {
      background-color: #070b13;
      font-family: 'Inter', sans-serif;
    }
    pre {
      margin: 0 !important;
      background: transparent !important;
    }
    code {
      font-family: 'Fira Code', Consolas, Monaco, monospace !important;
      font-size: 13px !important;
    }
    /* Custom Scrollbars */
    ::-webkit-scrollbar {
      width: 5px;
      height: 5px;
    }
    ::-webkit-scrollbar-track {
      background: rgba(15, 23, 42, 0.5);
    }
    ::-webkit-scrollbar-thumb {
      background: rgba(148, 163, 184, 0.2);
      border-radius: 4px;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: rgba(148, 163, 184, 0.4);
    }
  </style>
</head>
<body class="text-slate-200">
  <div class="max-w-7xl mx-auto px-6 py-8">
    <header class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-black text-white bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">BSE SENSEX Live Trader Code Document</h1>
        <p class="text-xs text-slate-500 font-bold mt-1 uppercase tracking-wider">All project files bundled into a single web document</p>
      </div>
      <span class="px-3 py-1 bg-slate-900 border border-slate-800 text-xs font-bold text-slate-400 rounded-lg">Version 1.2.0</span>
    </header>

    <div class="border border-slate-800 rounded-2xl overflow-hidden bg-[#0b0f19] shadow-2xl flex flex-col md:flex-row min-h-[80vh]">
      <!-- File Selector Sidebar -->
      <div class="md:w-64 border-r border-slate-800 bg-[#090d16] flex flex-col">
        <div class="p-4 border-b border-slate-800">
          <span class="text-xs font-bold text-slate-500 uppercase tracking-widest">Project Files</span>
        </div>
        <div id="tabs" class="flex-1 overflow-y-auto">
          ${tabsHtml}
        </div>
      </div>

      <!-- Code Content View -->
      <div class="flex-1 flex flex-col bg-[#080c14]">
        <div class="bg-slate-900/40 p-3 border-b border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <span id="active-file-title" class="font-semibold text-slate-300">backend/server.js</span>
          <span>Syntax Highlighting Active</span>
        </div>
        <div class="flex-1">
          ${contentHtml}
        </div>
      </div>
    </div>
  </div>

  <script>
    function switchTab(evt, tabId) {
      // Hide all contents
      const contents = document.getElementsByClassName("tab-content");
      for (let i = 0; i < contents.length; i++) {
        contents[i].classList.add("hidden");
      }

      // Deactivate all buttons
      const buttons = document.getElementsByClassName("tab-btn");
      for (let i = 0; i < buttons.length; i++) {
        buttons[i].classList.remove("border-blue-500", "text-white", "bg-slate-800/40");
      }

      // Show current tab
      document.getElementById(tabId).classList.remove("hidden");

      // Activate button
      evt.currentTarget.classList.add("border-blue-500", "text-white", "bg-slate-800/40");
      
      // Update header title
      document.getElementById("active-file-title").innerText = evt.currentTarget.innerText.trim();
    }
  </script>
</body>
</html>
`;

fs.writeFileSync('./code_documentation.html', htmlTemplate);
console.log('Successfully generated code_documentation.html!');
