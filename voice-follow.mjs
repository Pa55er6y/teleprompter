import { VoiceMatcher, tokenize } from './voice-matcher.mjs';

// Main-page adapter for the same phrase matching used by the Voice test page.
export class VoiceFollower {
    constructor({ text, scroller, panel, button, status, onStart, onChange }) {
        Object.assign(this, { text, scroller, panel, button, status, onStart, onChange });
        this.Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.active = false;
        this.generation = 0;
        this.words = [];
        this.button.disabled = !this.Recognition || !window.isSecureContext;
        if (this.button.disabled) {
            this.button.title = 'Voice following needs HTTPS and a browser with speech recognition, such as Safari.';
        }
        button.addEventListener('click', () => this.active ? this.stop() : this.start());
        text.addEventListener('click', event => {
            const word = event.target.closest('.voice-word');
            if (!this.active || !word) return;
            this.matcher.seek(Number(word.dataset.index));
            this.showPosition(false);
            this.stop('Position set. Tap Follow my voice and read from that word.');
        });
        scroller.addEventListener('touchstart', () => this.cancelScroll(), { passive: true });
        scroller.addEventListener('wheel', () => this.cancelScroll(), { passive: true });
        window.addEventListener('resize', () => this.refreshLayout());
        window.addEventListener('pagehide', () => this.stop());
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.active) {
                this.stop('Listening stopped while the page was hidden. Tap Follow my voice to resume.');
            }
        });
    }

    setStatus(message, error = false) {
        this.status.textContent = message;
        this.status.hidden = !message;
        this.status.classList.toggle('error', error);
    }

    start() {
        if (this.active || this.button.disabled) return;
        this.text.blur();
        const source = this.text.innerText;
        if (!this.matcher || source !== this.source) {
            this.matcher = new VoiceMatcher(source);
            this.source = source;
        }
        if (!this.matcher.tokens.length || source.trim() === 'Tap to add your script text') {
            this.setStatus('Add your script before starting voice following.');
            return;
        }
        if (this.matcher.position === this.matcher.tokens.length - 1) this.matcher.seek(0);
        else this.matcher.seek(this.matcher.position);
        this.onStart();
        this.renderWords();
        this.active = true;
        this.restartAttempts = 0;
        this.button.textContent = 'Stop listening';
        this.button.classList.add('btn-primary');
        this.button.setAttribute('aria-pressed', 'true');
        this.onChange();
        this.setStatus('Starting voice following. Allow microphone and speech access if asked.');
        this.refreshLayout();
        // Start synchronously from the user's tap, as required by mobile browsers.
        this.beginRecognition();
    }

    renderWords() {
        // Retain the original nodes, including paragraph breaks and pasted formatting.
        // The editable document is restored exactly when voice following stops.
        this.originalNodes = document.createDocumentFragment();
        this.editable = this.text.getAttribute('contenteditable');
        this.text.contentEditable = 'false';
        this.originalNodes.append(...Array.from(this.text.childNodes));
        const fragment = document.createDocumentFragment();
        this.words = [];
        let offset = 0;
        this.matcher.tokens.forEach((token, index) => {
            fragment.append(document.createTextNode(this.source.slice(offset, token.start)));
            const word = document.createElement('button');
            word.type = 'button';
            word.className = 'voice-word';
            word.dataset.index = String(index);
            word.textContent = this.source.slice(token.start, token.end);
            word.setAttribute('aria-label', `Resume reading at ${word.textContent}`);
            this.words.push(word);
            fragment.append(word);
            offset = token.end;
        });
        fragment.append(document.createTextNode(this.source.slice(offset)));
        this.text.append(fragment);
        this.panel.classList.add('voice-following');
    }

    cancelScroll() {
        cancelAnimationFrame(this.animation);
    }

    reset() {
        this.stop('');
        this.matcher = null;
        this.source = null;
    }

    refreshLayout() {
        if (!this.active) return;
        // Symmetric spacing also supports the app's vertical mirror setting.
        this.text.style.setProperty('--voice-space', `${this.scroller.clientHeight * 0.65}px`);
        this.showPosition(false);
    }

    showPosition(animate = true) {
        const word = this.words[this.matcher.position];
        if (!word) return;
        this.currentWord?.classList.remove('voice-current');
        this.currentWord?.removeAttribute('aria-current');
        word.classList.add('voice-current');
        word.setAttribute('aria-current', 'true');
        this.currentWord = word;
        this.cancelScroll();
        const viewport = this.scroller.getBoundingClientRect();
        const origin = this.scroller.scrollTop;
        const delta = word.getBoundingClientRect().top - viewport.top - viewport.height * 0.35;
        const target = Math.max(0, Math.min(this.scroller.scrollHeight - this.scroller.clientHeight, origin + delta));
        if (!animate || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            this.scroller.scrollTop = target;
            return;
        }
        const started = performance.now();
        const frame = now => {
            const progress = Math.min(1, (now - started) / 380);
            this.scroller.scrollTop = origin + (target - origin) * (1 - (1 - progress) ** 3);
            if (progress < 1) this.animation = requestAnimationFrame(frame);
        };
        this.animation = requestAnimationFrame(frame);
    }

    stop(message = 'Voice following paused. Tap Follow my voice to resume.', error = false) {
        const wasActive = this.active;
        this.active = false;
        this.generation++;
        clearTimeout(this.retryTimer);
        clearTimeout(this.startupTimer);
        this.cancelScroll();
        const previous = this.recognition;
        this.recognition = null;
        if (previous) {
            try { previous.abort(); } catch { /* The service already stopped. */ }
        }
        if (this.originalNodes) {
            // Preserve the visible phrase across removal of the voice-mode padding.
            const index = this.matcher.position;
            this.text.replaceChildren(this.originalNodes);
            this.originalNodes = null;
            this.text.style.removeProperty('--voice-space');
            if (this.editable === null) this.text.removeAttribute('contenteditable');
            else this.text.setAttribute('contenteditable', this.editable);
            this.words = [];
            this.currentWord = null;
            this.panel.classList.remove('voice-following');
            this.restorePosition(index);
        }
        this.button.textContent = 'Follow my voice';
        this.button.classList.remove('btn-primary');
        this.button.setAttribute('aria-pressed', 'false');
        if (wasActive) {
            this.setStatus(message, error);
            this.onChange();
        }
    }

    restorePosition(index) {
        // Reading mode uses innerText (visible newlines); the editable DOM may contain
        // block elements. Find the same word in its text nodes without rewriting them.
        const walker = document.createTreeWalker(this.text, NodeFilter.SHOW_TEXT);
        let node;
        let wordIndex = 0;
        while ((node = walker.nextNode())) {
            const tokens = tokenize(node.textContent);
            if (wordIndex + tokens.length > index) {
                const token = tokens[index - wordIndex];
                const range = document.createRange();
                range.setStart(node, token.start);
                range.setEnd(node, token.end);
                const viewport = this.scroller.getBoundingClientRect();
                const delta = range.getBoundingClientRect().top - viewport.top - viewport.height * 0.35;
                this.scroller.scrollTo({ top: this.scroller.scrollTop + delta, behavior: 'instant' });
                return;
            }
            wordIndex += tokens.length;
        }
    }

    beginRecognition() {
        if (!this.active) return;
        const generation = ++this.generation;
        let service;
        try {
            service = new this.Recognition();
            this.recognition = service;
            service.lang = navigator.language?.startsWith('en') ? navigator.language : 'en-AU';
            service.continuous = true;
            service.interimResults = true;
            service.maxAlternatives = 1;
        } catch {
            this.stop('Speech recognition could not start. Try Safari with Siri enabled.', true);
            return;
        }
        const active = () => this.active && this.generation === generation;
        const createdAt = performance.now();
        let previousTranscript = '';
        this.matcher.lastHypothesis = '';

        service.onstart = () => {
            if (!active()) return;
            clearTimeout(this.startupTimer);
            this.setStatus('Listening. Read aloud; tap a word to set your place.');
        };
        service.onresult = event => {
            if (!active()) return;
            const parts = [];
            for (let i = 0; i < event.results.length; i++) parts.push(event.results[i][0].transcript);
            const transcript = parts.join(' ').trim();
            if (!transcript || transcript === previousTranscript) return;
            previousTranscript = transcript;
            this.restartAttempts = 0;
            const result = this.matcher.match(transcript);
            if (!result) {
                this.cancelScroll();
                this.setStatus('Listening; holding position until a phrase matches. Tap a word to set your place.');
                return;
            }
            this.showPosition();
            this.setStatus('Following your voice. Tap a word to set your place.');
            if (result.index === this.matcher.tokens.length - 1) {
                this.stop('End of script. Listening stopped. Tap Follow my voice to read again.');
            }
        };
        service.onerror = event => {
            if (!active()) return;
            clearTimeout(this.startupTimer);
            if (event.error === 'no-speech') {
                this.setStatus('No speech detected. Holding your place; waiting for speech.');
                return;
            }
            const messages = {
                'not-allowed': 'Microphone or speech access was denied. Allow access in Safari website settings and check Siri is enabled, then try again.',
                'service-not-allowed': 'Speech recognition is unavailable. Try Safari with Siri enabled and speech access allowed.',
                'audio-capture': 'No microphone is available. Check its connection and whether another app is using it.',
                'network': 'The speech service connection failed. Check your internet connection, then tap Follow my voice to retry.',
                'language-not-supported': 'English speech recognition is unavailable on this browser.',
                'aborted': 'Listening was interrupted. Tap Follow my voice to resume.'
            };
            this.stop(messages[event.error] || `Speech recognition stopped (${event.error}). Tap Follow my voice to retry.`, true);
        };
        service.onend = () => {
            if (!active()) return;
            clearTimeout(this.startupTimer);
            this.recognition = null;
            if (performance.now() - createdAt > 10000) this.restartAttempts = 0;
            if (++this.restartAttempts > 3) {
                this.stop('The speech service keeps stopping. Check microphone access and Siri, then tap Follow my voice to retry.', true);
                return;
            }
            this.setStatus('Reconnecting to speech recognition; holding your place.');
            this.retryTimer = setTimeout(() => this.beginRecognition(), 750);
        };
        this.startupTimer = setTimeout(() => {
            if (active()) this.stop('Speech recognition did not start. Check microphone permission and Siri, then retry.', true);
        }, 20000);
        try { service.start(); }
        catch { this.stop('The browser could not start listening. Wait a moment and try again.', true); }
    }
}
