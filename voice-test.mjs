import { VoiceMatcher } from './voice-matcher.mjs';

const byId = id => document.getElementById(id);
const startBtn = byId('startBtn');
const stopBtn = byId('stopBtn');
const status = byId('status');
const heard = byId('heard');
const matched = byId('matched');
const scriptText = byId('scriptText');
const scriptScroll = byId('scriptScroll');
const scriptInput = byId('scriptInput');
const language = byId('language');
const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const supported = Boolean(Recognition && window.isSecureContext);
let matcher;
let wordElements = [];
let listening = false;
let recognition = null;
let generation = 0;
let retryTimer;
let startupTimer;
let restartAttempts = 0;
let animation;
let previousTranscript = '';

function setStatus(message, isError = false) {
    status.textContent = message;
    status.classList.toggle('error', isError);
}

function updateButtons() {
    startBtn.disabled = listening || !supported;
    stopBtn.disabled = !listening;
}

function cancelScroll() {
    cancelAnimationFrame(animation);
}

function showPosition(index, scroll = true) {
    for (let i = 0; i < wordElements.length; i++) {
        wordElements[i].classList.toggle('spoken', i < index);
        wordElements[i].classList.toggle('current', i === index);
        if (i === index) wordElements[i].setAttribute('aria-current', 'true');
        else wordElements[i].removeAttribute('aria-current');
    }
    cancelScroll();
    const word = wordElements[index];
    if (!scroll || !word) return;
    const pane = scriptScroll.getBoundingClientRect();
    const origin = scriptScroll.scrollTop;
    const delta = word.getBoundingClientRect().top - pane.top - pane.height * 0.35;
    const target = Math.max(0, Math.min(scriptScroll.scrollHeight - scriptScroll.clientHeight, origin + delta));
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        scriptScroll.scrollTop = target;
        return;
    }
    const started = performance.now();
    function frame(now) {
        const progress = Math.min(1, (now - started) / 380);
        scriptScroll.scrollTop = origin + (target - origin) * (1 - (1 - progress) ** 3);
        if (progress < 1) animation = requestAnimationFrame(frame);
    }
    animation = requestAnimationFrame(frame);
}

function loadScript() {
    const text = scriptInput.value;
    const nextMatcher = new VoiceMatcher(text);
    if (!nextMatcher.tokens.length) {
        setStatus('Enter a script with some words first.', true);
        return;
    }
    stopListening();
    matcher = nextMatcher;
    const fragment = document.createDocumentFragment();
    wordElements = [];
    let offset = 0;
    matcher.tokens.forEach((token, index) => {
        fragment.append(document.createTextNode(text.slice(offset, token.start)));
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'script-word';
        button.textContent = text.slice(token.start, token.end);
        button.dataset.index = String(index);
        button.setAttribute('aria-label', `Start reading at ${button.textContent}`);
        wordElements.push(button);
        fragment.append(button);
        offset = token.end;
    });
    fragment.append(document.createTextNode(text.slice(offset)));
    scriptText.replaceChildren(fragment);
    scriptScroll.scrollTop = 0;
    previousTranscript = '';
    heard.textContent = 'No speech received yet.';
    matched.textContent = 'No phrase matched yet.';
    showPosition(0, false);
    if (supported) setStatus('Ready. Tap Follow my voice, allow the microphone, then read aloud.');
}

function stopListening(message, isError = false) {
    listening = false;
    generation++;
    clearTimeout(retryTimer);
    clearTimeout(startupTimer);
    cancelScroll();
    const previous = recognition;
    recognition = null;
    if (previous) {
        // Invalidate callbacks before aborting; a late end event must never restart the mic.
        try { previous.abort(); } catch { /* Already stopped by the browser. */ }
    }
    updateButtons();
    if (message) setStatus(message, isError);
}

function beginRecognition() {
    if (!listening) return;
    const session = ++generation;
    let service;
    try {
        service = new Recognition();
        recognition = service;
        service.lang = language.value;
        service.continuous = true;
        service.interimResults = true;
        service.maxAlternatives = 1;
    } catch {
        stopListening('Speech recognition could not start. Try Safari with Siri enabled.', true);
        return;
    }
    const active = () => listening && generation === session;
    const createdAt = performance.now();
    previousTranscript = '';

    service.onstart = () => {
        if (!active()) return;
        clearTimeout(startupTimer);
        setStatus('Listening. Read aloud; the green word marks your place.');
    };

    service.onresult = event => {
        if (!active()) return;
        // Rebuild from the current result list, since interim text can be revised.
        // Do not append interim results: that would count the same spoken words twice.
        const parts = [];
        for (let i = 0; i < event.results.length; i++) parts.push(event.results[i][0].transcript);
        const transcript = parts.join(' ').trim();
        if (!transcript || transcript === previousTranscript) return;
        previousTranscript = transcript;
        restartAttempts = 0;
        heard.textContent = transcript.slice(-600);
        const result = matcher.match(transcript);
        if (!result) {
            cancelScroll();
            setStatus('Listening; holding position until a phrase matches. You can stop and tap a word to set your place.');
            return;
        }
        showPosition(result.index);
        const phrase = matcher.tokens.slice(Math.max(0, result.index - 5), result.index + 1)
            .map(token => token.word).join(' ');
        matched.textContent = `Matched: “…${phrase}” · word ${result.index + 1} of ${matcher.tokens.length}`;
        setStatus('Following your voice. Pause whenever you need.');
        if (result.index === matcher.tokens.length - 1) {
            stopListening('End of script. Listening stopped. Tap Back to start to try again.');
            // Finish positioning the last phrase after releasing the microphone.
            showPosition(result.index);
        }
    };

    service.onerror = event => {
        if (!active()) return;
        clearTimeout(startupTimer);
        if (event.error === 'no-speech') {
            setStatus('No speech detected. Holding your place; waiting for speech.');
            return;
        }
        const messages = {
            'not-allowed': 'Microphone or speech access was denied. Allow it in Safari website settings, check Siri is enabled, then tap Follow my voice.',
            'service-not-allowed': 'Speech recognition is unavailable. Try Safari with Siri enabled and speech access allowed.',
            'audio-capture': 'No microphone is available. Check the microphone connection and whether another app is using it.',
            'network': 'The speech service connection failed. Check the internet connection, then tap Follow my voice to retry.',
            'language-not-supported': 'This English dialect is unavailable. Choose another English option and try again.',
            'aborted': 'Listening was interrupted. Tap Follow my voice to resume.'
        };
        stopListening(messages[event.error] || `Speech recognition stopped (${event.error}). Tap Follow my voice to retry.`, true);
    };

    service.onend = () => {
        if (!active()) return;
        clearTimeout(startupTimer);
        recognition = null;
        if (performance.now() - createdAt > 10000) restartAttempts = 0;
        if (++restartAttempts > 3) {
            stopListening('The speech service keeps stopping. Check microphone access and Siri, then tap Follow my voice to retry.', true);
            return;
        }
        setStatus('Reconnecting to speech recognition; holding your place.');
        retryTimer = setTimeout(beginRecognition, 750);
    };

    startupTimer = setTimeout(() => {
        if (active()) stopListening('Speech recognition did not start. Check the permission prompt, microphone access, and Siri, then retry.', true);
    }, 20000);
    try {
        service.start();
    } catch {
        stopListening('The browser could not start listening. Wait a moment and tap Follow my voice again.', true);
    }
}

startBtn.addEventListener('click', () => {
    if (!supported || listening) return;
    listening = true;
    restartAttempts = 0;
    // Keep an explicit tap as the only way to activate the microphone.
    matcher.lastHypothesis = '';
    updateButtons();
    setStatus('Starting speech recognition. Allow microphone and speech access if asked.');
    beginRecognition();
});
stopBtn.addEventListener('click', () => stopListening('Listening stopped. Your reading position is saved for this test.'));
byId('restartBtn').addEventListener('click', () => {
    stopListening('Back at the start. Tap Follow my voice to begin again.');
    matcher.seek(0);
    previousTranscript = '';
    heard.textContent = 'No speech received yet.';
    matched.textContent = 'No phrase matched yet.';
    scriptScroll.scrollTop = 0;
    showPosition(0, false);
});
scriptText.addEventListener('click', event => {
    const word = event.target.closest('.script-word');
    if (!word) return;
    stopListening('Position set. Tap Follow my voice and read from the green word.');
    const index = Number(word.dataset.index);
    matcher.seek(index);
    showPosition(index);
    matched.textContent = `Reading position: word ${index + 1} of ${matcher.tokens.length}`;
    heard.textContent = 'Waiting for speech from the new position.';
});
byId('scriptForm').addEventListener('submit', event => {
    event.preventDefault();
    loadScript();
});
byId('textSize').addEventListener('input', event => {
    scriptText.style.fontSize = `${event.target.value}px`;
    showPosition(matcher.position);
});
byId('mirrorBtn').addEventListener('click', event => {
    const mirrored = scriptText.classList.toggle('mirrored');
    event.currentTarget.setAttribute('aria-pressed', String(mirrored));
});
language.addEventListener('change', () => stopListening('English dialect changed. Tap Follow my voice to begin.'));
scriptScroll.addEventListener('touchstart', cancelScroll, { passive: true });
scriptScroll.addEventListener('wheel', cancelScroll, { passive: true });
document.addEventListener('visibilitychange', () => {
    if (document.hidden && listening) stopListening('Listening stopped while the page was hidden. Tap Follow my voice to resume.');
});
window.addEventListener('pagehide', () => stopListening());
window.addEventListener('resize', () => showPosition(matcher.position));

const preferred = navigator.language;
if (Array.from(language.options).some(option => option.value === preferred)) language.value = preferred;
loadScript();
updateButtons();
if (!window.isSecureContext) {
    setStatus('Open this page over HTTPS on your iPad. Microphone access is unavailable on an ordinary HTTP network address.', true);
} else if (!Recognition) {
    setStatus('This browser does not expose speech recognition. Try Safari on the iPad with Siri enabled.', true);
}
