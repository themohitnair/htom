document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const htmlInput = document.getElementById('htmlInput');
    const markdownOutput = document.getElementById('markdownOutput');
    const convertBtn = document.getElementById('convertBtn');
    const clearBtn = document.getElementById('clearBtn');
    const status = document.getElementById('status');
    const themeToggle = document.getElementById('themeToggle');
    const pasteBtn = document.getElementById('pasteBtn');
    const copyBtn = document.getElementById('copyBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const charCount = document.getElementById('charCount');
    const wordCount = document.getElementById('wordCount');

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

    // Character and word counting
    function updateCounts() {
        const htmlText = htmlInput.value;
        const markdownText = markdownOutput.value;

        charCount.textContent = htmlText.length.toLocaleString();

        const words = markdownText.trim() ? markdownText.trim().split(/\s+/).length : 0;
        wordCount.textContent = words.toLocaleString();
    }

    htmlInput.addEventListener('input', updateCounts);

    // Conversion functionality
    convertBtn.addEventListener('click', async function() {
        console.log('Convert button clicked'); // Debug log

        const htmlContent = htmlInput.value.trim();

        if (!htmlContent) {
            showStatus('Please enter some HTML content', 'error');
            return;
        }

        setLoadingState(true);
        showStatus('Converting your HTML to Markdown...', 'loading');

        try {
            const response = await fetch('/convert', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    html: htmlContent
                })
            });

            const data = await response.json();
            console.log('Response:', data); // Debug log

            if (response.ok && data.success === 'ok') {
                markdownOutput.value = data.markdown;
                showStatus('✨ Conversion successful! Your Markdown is ready.', 'success');
                updateCounts();

                // Pulse animation for output
                document.querySelector('.output-panel').classList.add('pulse');
                setTimeout(() => {
                    document.querySelector('.output-panel').classList.remove('pulse');
                }, 300);
            } else {
                showStatus('❌ Conversion failed. Please check your HTML syntax.', 'error');
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
        htmlInput.value = '';
        markdownOutput.value = '';
        hideStatus();
        updateCounts();
        htmlInput.focus();
    });

    // Paste from clipboard
    pasteBtn.addEventListener('click', async function() {
        try {
            const text = await navigator.clipboard.readText();
            htmlInput.value = text;
            updateCounts();
            showStatus('📋 Content pasted from clipboard', 'success');
            htmlInput.focus();
        } catch (err) {
            showStatus('❌ Could not access clipboard', 'error');
        }
    });

    // Copy to clipboard
    copyBtn.addEventListener('click', async function() {
        if (!markdownOutput.value) {
            showStatus('❌ No markdown to copy', 'error');
            return;
        }

        try {
            await navigator.clipboard.writeText(markdownOutput.value);
            showStatus('📋 Markdown copied to clipboard!', 'success');

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
        if (!markdownOutput.value) {
            showStatus('❌ No markdown to download', 'error');
            return;
        }

        const blob = new Blob([markdownOutput.value], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'converted.md';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showStatus('📁 Markdown file downloaded!', 'success');
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

        // Ctrl+D to download (when markdown exists)
        if (e.ctrlKey && e.key === 'd' && markdownOutput.value) {
            e.preventDefault();
            downloadBtn.click();
        }

        // Ctrl+K to clear
        if (e.ctrlKey && e.key === 'k') {
            e.preventDefault();
            clearBtn.click();
        }
    });

    // Initialize
    initTheme();
    updateCounts();
    htmlInput.focus();
});
