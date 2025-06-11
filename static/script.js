document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const inputText = document.getElementById('inputText');
    const outputText = document.getElementById('outputText');
    const convertBtn = document.getElementById('convertBtn');
    const clearBtn = document.getElementById('clearBtn');
    const status = document.getElementById('status');
    const themeToggle = document.getElementById('themeToggle');
    const pasteBtn = document.getElementById('pasteBtn');
    const copyBtn = document.getElementById('copyBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const charCount = document.getElementById('charCount');
    const wordCount = document.getElementById('wordCount');
    const modeToggle = document.getElementById('modeToggle');

    // UI Elements for dynamic content
    const pageTitle = document.getElementById('pageTitle');
    const pageSubtitle = document.getElementById('pageSubtitle');
    const inputLabel = document.getElementById('inputLabel');
    const outputLabel = document.getElementById('outputLabel');
    const inputIcon = document.getElementById('inputIcon');
    const outputIcon = document.getElementById('outputIcon');
    const convertBtnText = document.getElementById('convertBtnText');

    // Mode state
    let isHtmlToMarkdown = true; // true = HTML→MD, false = MD→HTML

    // Mode configurations
    const modes = {
        htmlToMd: {
            title: 'HTML to Markdown Converter',
            subtitle: 'Transform your HTML into clean, readable Markdown instantly',
            inputLabel: 'HTML Input',
            outputLabel: 'Markdown Output',
            inputIcon: 'fab fa-html5',
            outputIcon: 'fab fa-markdown',
            inputPlaceholder: 'Enter HTML here...',
            outputPlaceholder: 'Your converted Markdown will appear here...',
            convertText: 'Convert to Markdown',
            toggleText: 'Switch to Markdown → HTML',
            endpoint: '/convert',
            downloadExt: 'md',
            downloadType: 'text/markdown'
        },
        mdToHtml: {
            title: 'Markdown to HTML Converter',
            subtitle: 'Transform your Markdown into clean HTML code instantly',
            inputLabel: 'Markdown Input',
            outputLabel: 'HTML Output',
            inputIcon: 'fab fa-markdown',
            outputIcon: 'fab fa-html5',
            inputPlaceholder: 'Enter Markdown here...',
            outputPlaceholder: 'Your converted HTML will appear here...',
            convertText: 'Convert to HTML',
            toggleText: 'Switch to HTML → Markdown',
            endpoint: '/md-to-html',
            downloadExt: 'html',
            downloadType: 'text/html'
        }
    };

    // Theme Management
    function initTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        updateThemeIcon(savedTheme);
    }

    function updateThemeIcon(theme) {
        const icon = themeToggle.querySelector('i');
        icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }

    themeToggle.addEventListener('click', function() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
    });

    // Mode toggle functionality
    function updateUI() {
        const mode = isHtmlToMarkdown ? modes.htmlToMd : modes.mdToHtml;
        
        pageTitle.textContent = mode.title;
        pageSubtitle.textContent = mode.subtitle;
        inputLabel.textContent = mode.inputLabel;
        outputLabel.textContent = mode.outputLabel;
        inputIcon.className = mode.inputIcon;
        outputIcon.className = mode.outputIcon;
        inputText.placeholder = mode.inputPlaceholder;
        outputText.placeholder = mode.outputPlaceholder;
        convertBtnText.textContent = mode.convertText;
        modeToggle.innerHTML = `<i class="fas fa-exchange-alt"></i> ${mode.toggleText}`;
        
        // Clear content when switching modes
        inputText.value = '';
        outputText.value = '';
        updateCounts();
        hideStatus();
    }

    modeToggle.addEventListener('click', function() {
        isHtmlToMarkdown = !isHtmlToMarkdown;
        updateUI();
        inputText.focus();
    });

    // Character and word counting
    function updateCounts() {
        const inputValue = inputText.value;
        const outputValue = outputText.value;

        charCount.textContent = inputValue.length.toLocaleString();

        const words = outputValue.trim() ? outputValue.trim().split(/\s+/).length : 0;
        wordCount.textContent = words.toLocaleString();
    }

    inputText.addEventListener('input', updateCounts);

    // Conversion functionality
    convertBtn.addEventListener('click', async function() {
        const mode = isHtmlToMarkdown ? modes.htmlToMd : modes.mdToHtml;
        const content = inputText.value.trim();

        if (!content) {
            showStatus(`Please enter some ${isHtmlToMarkdown ? 'HTML' : 'Markdown'} content`, 'error');
            return;
        }

        setLoadingState(true);
        showStatus(`Converting your ${isHtmlToMarkdown ? 'HTML to Markdown' : 'Markdown to HTML'}...`, 'loading');

        try {
            const requestBody = isHtmlToMarkdown ? { html: content } : { markdown: content };
            
            const response = await fetch(mode.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            const data = await response.json();

            if (response.ok && data.success === 'ok') {
                const result = isHtmlToMarkdown ? data.markdown : data.html;
                outputText.value = result;
                showStatus('✨ Conversion successful!', 'success');
                updateCounts();

                // Pulse animation for output
                document.querySelector('.output-panel').classList.add('pulse');
                setTimeout(() => {
                    document.querySelector('.output-panel').classList.remove('pulse');
                }, 300);
            } else {
                showStatus(`❌ Conversion failed. Please check your ${isHtmlToMarkdown ? 'HTML' : 'Markdown'} syntax.`, 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            showStatus('🔌 Network error. Please check your connection and try again.', 'error');
        } finally {
            setLoadingState(false);
        }
    });

    function setLoadingState(loading) {
        convertBtn.disabled = loading;
        convertBtn.classList.toggle('loading', loading);
    }

    // Clear functionality
    clearBtn.addEventListener('click', function() {
        inputText.value = '';
        outputText.value = '';
        hideStatus();
        updateCounts();
        inputText.focus();
    });

    // Paste from clipboard
    pasteBtn.addEventListener('click', async function() {
        try {
            const text = await navigator.clipboard.readText();
            inputText.value = text;
            updateCounts();
            showStatus('📋 Content pasted from clipboard', 'success');
            inputText.focus();
        } catch (err) {
            showStatus('❌ Could not access clipboard', 'error');
        }
    });

    // Copy to clipboard
    copyBtn.addEventListener('click', async function() {
        if (!outputText.value) {
            showStatus(`❌ No ${isHtmlToMarkdown ? 'markdown' : 'HTML'} to copy`, 'error');
            return;
        }

        try {
            await navigator.clipboard.writeText(outputText.value);
            showStatus(`📋 ${isHtmlToMarkdown ? 'Markdown' : 'HTML'} copied to clipboard!`, 'success');

            // Temporarily change icon
            const icon = copyBtn.querySelector('i');
            const originalClass = icon.className;
            icon.className = 'fas fa-check';
            setTimeout(() => {
                icon.className = originalClass;
            }, 2000);
        } catch (err) {
            showStatus('❌ Could not copy to clipboard', 'error');
        }
    });

    // Download functionality
    downloadBtn.addEventListener('click', function() {
        const mode = isHtmlToMarkdown ? modes.htmlToMd : modes.mdToHtml;
        
        if (!outputText.value) {
            showStatus(`❌ No ${isHtmlToMarkdown ? 'markdown' : 'HTML'} to download`, 'error');
            return;
        }

        const blob = new Blob([outputText.value], { type: mode.downloadType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `converted.${mode.downloadExt}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showStatus(`📁 ${isHtmlToMarkdown ? 'Markdown' : 'HTML'} file downloaded!`, 'success');
    });

    // Status management
    function showStatus(message, type) {
        status.textContent = message;
        status.className = `status ${type} show`;

        if (type === 'success') {
            setTimeout(hideStatus, 4000);
        }
    }

    function hideStatus() {
        status.classList.remove('show');
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Ctrl+Enter to convert
        if (e.ctrlKey && e.key === 'Enter') {
            e.preventDefault();
            convertBtn.click();
        }

        // Ctrl+D to download (when output exists)
        if (e.ctrlKey && e.key === 'd' && outputText.value) {
            e.preventDefault();
            downloadBtn.click();
        }

        // Ctrl+K to clear
        if (e.ctrlKey && e.key === 'k') {
            e.preventDefault();
            clearBtn.click();
        }

        // Ctrl+M to toggle mode
        if (e.ctrlKey && e.key === 'm') {
            e.preventDefault();
            modeToggle.click();
        }
    });

    // Initialize
    initTheme();
    updateUI();
    updateCounts();
    inputText.focus();
});
