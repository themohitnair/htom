document.addEventListener('DOMContentLoaded', function() {
    const textInput = document.getElementById('textInput');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const statsGrid = document.getElementById('statsGrid');
    const status = document.getElementById('status');
    const themeToggle = document.getElementById('themeToggle');

    // Theme Management
    function initTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        updateThemeIcon(savedTheme);
    }

    function updateThemeIcon(theme) {
        if (themeToggle) {
            const icon = themeToggle.querySelector('i');
            icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }
    }

    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            updateThemeIcon(newTheme);
        });
    }

    // Analysis functionality
    analyzeBtn.addEventListener('click', async function() {
        const text = textInput.value.trim();
        
        if (!text) {
            showStatus('Please enter some text to analyze', 'error');
            return;
        }

        setLoadingState(true);
        showStatus('Analyzing your text...', 'loading');

        try {
            const response = await fetch('/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text: text })
            });

            const data = await response.json();

            if (response.ok && data.success === 'ok') {
                displayStats(data.stats);
                showStatus('✨ Analysis complete!', 'success');
            } else {
                showStatus('❌ Analysis failed. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            showStatus('🔌 Network error. Please try again.', 'error');
        } finally {
            setLoadingState(false);
        }
    });

    function displayStats(stats) {
        document.getElementById('wordCount').textContent = stats.word_count.toLocaleString();
        document.getElementById('sentenceCount').textContent = stats.sentence_count;
        document.getElementById('charCount').textContent = stats.character_count.toLocaleString();
        document.getElementById('paragraphCount').textContent = stats.paragraph_count;
        document.getElementById('readingEase').textContent = stats.reading_ease;
        document.getElementById('gradeLevel').textContent = `Grade ${stats.grade_level}`;
        document.getElementById('readingTime').textContent = `${stats.reading_time_minutes} min`;
        document.getElementById('difficultWords').textContent = stats.difficult_words;
        document.getElementById('syllableCount').textContent = stats.syllable_count.toLocaleString();
        document.getElementById('avgSentenceLength').textContent = `${stats.avg_sentence_length} words`;

        statsGrid.style.display = 'grid';
    }

    function setLoadingState(loading) {
        analyzeBtn.disabled = loading;
        analyzeBtn.classList.toggle('loading', loading);
    }

    function showStatus(message, type) {
        status.textContent = message;
        status.className = `status ${type} show`;
        
        if (type === 'success') {
            setTimeout(() => status.classList.remove('show'), 4000);
        }
    }

    // Initialize theme
    initTheme();
});
