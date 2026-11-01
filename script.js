import { VoiceFollower } from './voice-follow.mjs';
import { initializeDisplayControls } from './display-controls.mjs';

let voiceFollower = null;

// State management
const state = {
    isLeftAlign: false,
    flipLR: false,
    flipUD: false,
    autoScrolling: false,
    scrollSpeed: 1,
    fontSize: 48,
    scrollPadding: 20,
    fontFamily: 'Verdana'
};

// DOM elements
const prompterText = document.getElementById('prompterText');
const prompterScroll = document.getElementById('prompterScroll');
const prompterPanel = document.getElementById('prompterPanel');
const toggleAlignBtn = document.getElementById('toggleAlignBtn');
const toggleFlipLRBtn = document.getElementById('toggleFlipLRBtn');
const toggleFlipUDBtn = document.getElementById('toggleFlipUDBtn');
const toggleFontBtn = document.getElementById('toggleFontBtn');
const autoScrollBtn = document.getElementById('autoScrollBtn');
const pauseScrollBtn = document.getElementById('pauseScrollBtn');
const resetBtn = document.getElementById('resetBtn');
const fontSizeSlider = document.getElementById('fontSizeSlider');
const fontSizeInput = document.getElementById('fontSizeInput');
const scrollSpeedSlider = document.getElementById('scrollSpeedSlider');
const scrollPaddingSlider = document.getElementById('scrollPaddingSlider');
const scrollPaddingInput = document.getElementById('scrollPaddingInput');
const scrollIndicator = document.getElementById('scrollIndicator');

// localStorage keys
const STORAGE_KEY = 'teleprompter_text';
const FONT_SIZE_KEY = 'teleprompter_font_size';
const LEFT_ALIGN_KEY = 'teleprompter_left_align';
const FLIP_LR_KEY = 'teleprompter_flip_lr';
const FLIP_UD_KEY = 'teleprompter_flip_ud';
const SCROLL_SPEED_KEY = 'teleprompter_scroll_speed';
const SCROLL_PADDING_KEY = 'teleprompter_scroll_padding';
const FONT_FAMILY_KEY = 'teleprompter_font_family';

const ALIGN_LEFT_ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="M3 7h12v2H3zm0-4h18v2H3zm0 8h18v2H3zm0 4h12v2H3zm0 4h18v2H3z"></path></svg>';
const ALIGN_CENTER_ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="M6 7h12v2H6zM3 3h18v2H3zm0 8h18v2H3zm3 4h12v2H6zm-3 4h18v2H3z"></path></svg>';

const DEFAULT_SCROLL_PADDING = 40;
const FONT_FAMILIES = ['Verdana', 'Georgia', 'Arial'];

// Initialize app
function init() {
    // Load from localStorage
    const savedText = localStorage.getItem(STORAGE_KEY) || '';
    const savedFontSize = localStorage.getItem(FONT_SIZE_KEY) || '48';
    const savedLeftAlign = localStorage.getItem(LEFT_ALIGN_KEY) === 'true';
    const savedFlipLR = localStorage.getItem(FLIP_LR_KEY) === 'true';
    const savedFlipUD = localStorage.getItem(FLIP_UD_KEY) === 'true';
    const savedScrollSpeed = localStorage.getItem(SCROLL_SPEED_KEY) || '1';
    const savedScrollPadding = localStorage.getItem(SCROLL_PADDING_KEY) || String(DEFAULT_SCROLL_PADDING);
    const savedFontFamily = localStorage.getItem(FONT_FAMILY_KEY) || 'Verdana';

    if (savedText) {
        prompterText.textContent = savedText;
    }
    state.fontSize = parseInt(savedFontSize);
    state.isLeftAlign = savedLeftAlign;
    state.flipLR = savedFlipLR;
    state.flipUD = savedFlipUD;
    state.scrollSpeed = parseFloat(savedScrollSpeed);
    const parsedScrollPadding = parseInt(savedScrollPadding, 10);
    state.scrollPadding = Number.isFinite(parsedScrollPadding) ? parsedScrollPadding : DEFAULT_SCROLL_PADDING;
    state.fontFamily = FONT_FAMILIES.includes(savedFontFamily) ? savedFontFamily : 'Verdana';

    // Update UI
    updateFontSize();
    updateAlignment();
    updateFlipLR();
    updateFlipUD();
    updateScrollSpeed();
    updateScrollPadding();
    updateFontFamily();

    // Attach event listeners
    prompterText.addEventListener('input', handleTextInput);
    prompterText.addEventListener('blur', handleTextInput);
    toggleAlignBtn.addEventListener('click', toggleAlignment);
    toggleFlipLRBtn.addEventListener('click', toggleFlipLR);
    toggleFlipUDBtn.addEventListener('click', toggleFlipUD);
    toggleFontBtn.addEventListener('click', toggleFontFamily);
    autoScrollBtn.addEventListener('click', startAutoScroll);
    pauseScrollBtn.addEventListener('click', stopPlayback);
    resetBtn.addEventListener('click', resetApp);
    fontSizeSlider.addEventListener('input', handleFontSizeChange);
    fontSizeInput.addEventListener('input', handleFontSizeChange);
    scrollSpeedSlider.addEventListener('input', handleScrollSpeedChange);
    scrollPaddingSlider.addEventListener('input', handleScrollPaddingChange);
    scrollPaddingInput.addEventListener('input', handleScrollPaddingChange);

    voiceFollower = new VoiceFollower({
        text: prompterText,
        scroller: prompterScroll,
        panel: prompterPanel,
        button: document.getElementById('followVoiceBtn'),
        status: document.getElementById('voiceStatus'),
        onStart: stopAutoScroll,
        onChange: updatePlaybackControls
    });
    initializeDisplayControls(() => voiceFollower.refreshLayout());

    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboard);
}

// Event handlers
function handleTextInput() {
    localStorage.setItem(STORAGE_KEY, prompterText.innerText);
}

function toggleAlignment() {
    state.isLeftAlign = !state.isLeftAlign;
    localStorage.setItem(LEFT_ALIGN_KEY, state.isLeftAlign);
    updateAlignment();
}

function updateAlignment() {
    if (state.isLeftAlign) {
        prompterText.classList.add('left-align');
        //toggleAlignBtn.classList.add('btn-primary');
        toggleAlignBtn.innerHTML = ALIGN_CENTER_ICON;
        toggleAlignBtn.title = 'Align center';
        toggleAlignBtn.setAttribute('aria-label', 'Align center');
    } else {
        prompterText.classList.remove('left-align');
        //toggleAlignBtn.classList.remove('btn-primary');
        toggleAlignBtn.innerHTML = ALIGN_LEFT_ICON;
        toggleAlignBtn.title = 'Align left';
        toggleAlignBtn.setAttribute('aria-label', 'Align left');
    }
    voiceFollower?.refreshLayout();
}

function toggleFlipLR() {
    state.flipLR = !state.flipLR;
    localStorage.setItem(FLIP_LR_KEY, state.flipLR);
    updateFlipLR();
}

function updateFlipLR() {
    if (state.flipLR) {
        prompterText.classList.add('flip-lr');
        toggleFlipLRBtn.classList.add('btn-primary');
    } else {
        prompterText.classList.remove('flip-lr');
        toggleFlipLRBtn.classList.remove('btn-primary');
    }
    voiceFollower?.refreshLayout();
}

function toggleFlipUD() {
    state.flipUD = !state.flipUD;
    localStorage.setItem(FLIP_UD_KEY, state.flipUD);
    updateFlipUD();
}

function updateFlipUD() {
    if (state.flipUD) {
        prompterText.classList.add('flip-ud');
        toggleFlipUDBtn.classList.add('btn-primary');
    } else {
        prompterText.classList.remove('flip-ud');
        toggleFlipUDBtn.classList.remove('btn-primary');
    }
    voiceFollower?.refreshLayout();
}

function handleFontSizeChange(e) {
    const newSize = parseInt(e.target.value);
    state.fontSize = newSize;
    fontSizeSlider.value = newSize;
    fontSizeInput.value = newSize;
    updateFontSize();
}

function updateFontSize() {
    prompterText.style.fontSize = state.fontSize + 'px';
    localStorage.setItem(FONT_SIZE_KEY, state.fontSize);
    voiceFollower?.refreshLayout();
}

function handleScrollSpeedChange(e) {
    state.scrollSpeed = parseFloat(e.target.value);
    localStorage.setItem(SCROLL_SPEED_KEY, state.scrollSpeed);
}

function updateScrollSpeed() {
    scrollSpeedSlider.value = state.scrollSpeed;
}

function handleScrollPaddingChange(e) {
    const newPadding = parseInt(e.target.value, 10);
    if (!Number.isFinite(newPadding)) {
        return;
    }
    state.scrollPadding = newPadding;
    scrollPaddingSlider.value = newPadding;
    scrollPaddingInput.value = newPadding;
    updateScrollPadding();
}

function updateScrollPadding() {
    const paddingValue = Number.isFinite(state.scrollPadding) ? state.scrollPadding : DEFAULT_SCROLL_PADDING;
    scrollPaddingSlider.value = paddingValue;
    scrollPaddingInput.value = paddingValue;
    prompterScroll.style.padding = `40px ${paddingValue}px`;
    localStorage.setItem(SCROLL_PADDING_KEY, String(paddingValue));
    voiceFollower?.refreshLayout();
}

function toggleFontFamily() {
    const currentIndex = FONT_FAMILIES.indexOf(state.fontFamily);
    const nextIndex = (currentIndex + 1) % FONT_FAMILIES.length;
    state.fontFamily = FONT_FAMILIES[nextIndex];
    updateFontFamily();
}

function updateFontFamily() {
    prompterText.style.fontFamily = state.fontFamily;
    toggleFontBtn.title = `Font: ${state.fontFamily}`;
    localStorage.setItem(FONT_FAMILY_KEY, state.fontFamily);
    voiceFollower?.refreshLayout();
}

let autoScrollAnimationFrame;
let lastAutoScrollTimestamp = 0;
let autoScrollRemainder = 0;

function runAutoScroll(timestamp) {
    if (!state.autoScrolling) return;

    if (!lastAutoScrollTimestamp) {
        lastAutoScrollTimestamp = timestamp;
    }

    const elapsed = timestamp - lastAutoScrollTimestamp;
    lastAutoScrollTimestamp = timestamp;

    const speed = Number.isFinite(state.scrollSpeed) ? Math.max(0, state.scrollSpeed) : 0.5;
    const pixelsPerSecond = speed * 120;
    const maxScrollTop = prompterScroll.scrollHeight - prompterScroll.clientHeight;

    if (maxScrollTop <= 0 || prompterScroll.scrollTop >= maxScrollTop) {
        stopAutoScroll();
        return;
    }

    const desiredScroll = (elapsed * pixelsPerSecond / 1000) + autoScrollRemainder;
    const pixelsToScroll = Math.floor(desiredScroll);
    autoScrollRemainder = desiredScroll - pixelsToScroll;

    if (pixelsToScroll > 0) {
        prompterScroll.scrollTop = Math.min(maxScrollTop, prompterScroll.scrollTop + pixelsToScroll);
    }

    autoScrollAnimationFrame = requestAnimationFrame(runAutoScroll);
}

function startAutoScroll() {
    if (state.autoScrolling) return;
    voiceFollower?.stop('');
    prompterText.blur();
    state.autoScrolling = true;
    lastAutoScrollTimestamp = 0;
    autoScrollRemainder = 0;
    updatePlaybackControls();
    scrollIndicator.style.display = 'block';
    prompterScroll.parentElement.classList.add('auto-scrolling');

    autoScrollAnimationFrame = requestAnimationFrame(runAutoScroll);
}

function stopAutoScroll() {
    state.autoScrolling = false;
    cancelAnimationFrame(autoScrollAnimationFrame);
    lastAutoScrollTimestamp = 0;
    autoScrollRemainder = 0;
    updatePlaybackControls();
    scrollIndicator.style.display = 'none';
    prompterScroll.parentElement.classList.remove('auto-scrolling');
}

function updatePlaybackControls() {
    const playing = state.autoScrolling || voiceFollower?.active;
    autoScrollBtn.style.display = playing ? 'none' : 'block';
    pauseScrollBtn.style.display = playing ? 'block' : 'none';
}

function stopPlayback() {
    voiceFollower?.stop();
    stopAutoScroll();
}

function resetApp() {
    if (confirm('Reset all content and settings?')) {
        stopPlayback();
        voiceFollower?.reset();
        document.getElementById('voiceStatus').hidden = true;
        localStorage.clear();
        prompterText.textContent = 'Tap to add your script text';
        state.fontSize = 48;
        state.isLeftAlign = false;
        state.flipLR = false;
        state.flipUD = false;
        state.scrollSpeed = 1;
        state.scrollPadding = DEFAULT_SCROLL_PADDING;
        state.fontFamily = 'Verdana';
        state.autoScrolling = false;
        prompterScroll.scrollTop = 0;
        stopAutoScroll();
        updateFontSize();
        updateAlignment();
        updateFlipLR();
        updateFlipUD();
        updateScrollSpeed();
        updateScrollPadding();
        updateFontFamily();
    }
}

function handleKeyboard(e) {
    if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.target.closest('input, textarea, select, [contenteditable="true"]')) return;
    if (e.code === 'Escape') {
        stopPlayback();
        return;
    }
    // Spacebar to toggle auto-scroll
    if (e.code === 'Space' && !e.target.closest('button, a')) {
        e.preventDefault();
        if (state.autoScrolling || voiceFollower?.active) {
            stopPlayback();
        } else {
            startAutoScroll();
        }
    }
    // 'A' to toggle alignment
    if (e.key === 'a' || e.key === 'A') {
        toggleAlignment();
    }
    // 'H' to toggle horizontal flip
    if (e.key === 'h' || e.key === 'H') {
        toggleFlipLR();
    }
    // 'V' to toggle vertical flip
    if (e.key === 'v' || e.key === 'V') {
        toggleFlipUD();
    }
    // Arrow up/down to adjust scroll
    if (e.code === 'ArrowUp' && !prompterText.matches(':focus')) {
        e.preventDefault();
        prompterScroll.scrollTop = Math.max(0, prompterScroll.scrollTop - 50);
    }
    if (e.code === 'ArrowDown' && !prompterText.matches(':focus')) {
        e.preventDefault();
        prompterScroll.scrollTop += 50;
    }
}

// Initialize the app
init();

// Register service worker for offline support
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js')
        .then(registration => {
            console.log('Service Worker registered:', registration);
        })
        .catch(err => {
            console.log('Service Worker registration failed:', err);
        });
}
