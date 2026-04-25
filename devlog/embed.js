/**
 * Hans's Build Notes — inline embed for project pages.
 * 
 * Usage: Add at bottom of any project page:
 *   <div id="hans-notes" data-slug="calculator"></div>
 *   <script src="/devlog/embed.js"></script>
 */
(function() {
    const container = document.getElementById('hans-notes');
    if (!container) return;

    const slug = container.dataset.slug;
    if (!slug) return;

    const style = document.createElement('style');
    style.textContent = `
        .hn-wrap {
            max-width: 700px;
            margin: 3rem auto;
            padding: 0 1.5rem;
            font-family: 'Inter', -apple-system, sans-serif;
        }
        .hn-toggle {
            display: flex; align-items: center; gap: 0.75rem;
            background: none; border: 1px solid rgba(255,255,255,0.1);
            border-radius: 12px; padding: 0.9rem 1.25rem;
            color: #e8e8f0; font-family: inherit;
            font-size: 0.95rem; font-weight: 600;
            cursor: pointer; width: 100%;
            transition: all 0.2s;
        }
        .hn-toggle:hover {
            border-color: rgba(102, 126, 234, 0.5);
            background: rgba(102, 126, 234, 0.05);
        }
        .hn-toggle .hn-arrow {
            transition: transform 0.3s;
            font-size: 0.8rem;
        }
        .hn-toggle.open .hn-arrow { transform: rotate(90deg); }
        .hn-body {
            overflow: hidden; max-height: 0;
            transition: max-height 0.4s ease-out;
        }
        .hn-body.open { max-height: 2000px; }
        .hn-inner {
            padding: 1.5rem 0 0;
        }
        .hn-section { margin-bottom: 1.25rem; }
        .hn-label {
            font-size: 0.7rem; font-weight: 700;
            text-transform: uppercase; letter-spacing: 1.5px;
            margin-bottom: 0.35rem;
        }
        .hn-label-built { color: #667eea; }
        .hn-label-tricky { color: #ffc107; }
        .hn-label-facts { color: #27ca40; }
        .hn-text {
            color: #7777aa; font-size: 0.9rem; line-height: 1.7;
        }
        .hn-facts {
            list-style: none; padding: 0; margin: 0;
            display: flex; flex-direction: column; gap: 0.3rem;
        }
        .hn-facts li {
            font-size: 0.85rem; color: #7777aa;
            padding: 0.35rem 0.75rem;
            background: rgba(39, 202, 64, 0.05);
            border-radius: 8px;
            border-left: 3px solid rgba(39, 202, 64, 0.3);
        }
        .hn-footer {
            margin-top: 1rem; padding-top: 0.75rem;
            border-top: 1px solid rgba(255,255,255,0.04);
            font-size: 0.8rem;
        }
        .hn-footer a {
            color: #667eea; text-decoration: none; font-weight: 600;
        }
        .hn-footer a:hover { color: #ff6b9d; }
    `;
    document.head.appendChild(style);

    fetch('/devlog/notes/' + slug + '.json')
        .then(r => r.ok ? r.json() : null)
        .then(note => {
            if (!note) return;

            container.innerHTML = `
                <div class="hn-wrap">
                    <button class="hn-toggle" id="hnToggle">
                        <span>🤖</span>
                        <span>Hans's Build Notes</span>
                        <span class="hn-arrow" style="margin-left: auto;">▶</span>
                    </button>
                    <div class="hn-body" id="hnBody">
                        <div class="hn-inner">
                            <div class="hn-section">
                                <div class="hn-label hn-label-built">What I Built</div>
                                <div class="hn-text">${esc(note.what_i_built)}</div>
                            </div>
                            <div class="hn-section">
                                <div class="hn-label hn-label-tricky">What Was Tricky</div>
                                <div class="hn-text">${esc(note.what_was_tricky)}</div>
                            </div>
                            ${note.fun_facts && note.fun_facts.length ? `
                            <div class="hn-section">
                                <div class="hn-label hn-label-facts">Fun Facts</div>
                                <ul class="hn-facts">
                                    ${note.fun_facts.map(f => '<li>' + esc(f) + '</li>').join('')}
                                </ul>
                            </div>` : ''}
                            <div class="hn-footer">
                                <a href="/devlog/#${esc(note.slug)}">Read all build notes →</a>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            document.getElementById('hnToggle').addEventListener('click', function() {
                this.classList.toggle('open');
                document.getElementById('hnBody').classList.toggle('open');
            });
        })
        .catch(() => {});

    function esc(str) {
        if (!str) return '';
        const d = document.createElement('div');
        d.textContent = String(str);
        return d.innerHTML;
    }
})();
