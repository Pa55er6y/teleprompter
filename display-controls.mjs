// Keep a wake lock only while the page is visible. Dependencies are injectable
// so backgrounding and pending-request races can be checked without real hardware.
export class ScreenAwake {
    constructor({ button, page = document, host = window, wakeLock = navigator.wakeLock, secure = window.isSecureContext }) {
        Object.assign(this, { button, page, host, wakeLock });
        this.supported = secure && typeof wakeLock?.request === 'function';
        this.enabled = true;
        this.generation = 0;
        this.suspended = false;
        this.pending = false;
        this.lock = null;
        this.failed = false;
        button.addEventListener('click', () => {
            if (this.pending || !this.supported) return;
            if (this.lock && !this.lock.released) {
                this.enabled = false;
                this.release();
            } else {
                this.enabled = true;
                this.acquire();
            }
        });
        page.addEventListener('visibilitychange', () => {
            if (page.visibilityState === 'visible') this.acquire();
            else this.release();
        });
        host.addEventListener('pagehide', () => {
            this.suspended = true;
            this.release();
        });
        host.addEventListener('pageshow', () => {
            this.suspended = false;
            this.acquire();
        });
        this.render();
        this.acquire();
    }

    render() {
        const held = Boolean(this.lock && !this.lock.released);
        this.button.disabled = !this.supported || this.pending;
        this.button.classList.toggle('btn-primary', held);
        this.button.setAttribute('aria-pressed', String(held));
        this.button.textContent = !this.supported ? 'Keep awake unavailable'
            : this.pending ? 'Keeping awake…'
            : held ? 'Screen awake'
            : this.failed ? 'Retry keep awake' : 'Keep awake';
        this.button.title = !this.supported ? 'Keeping the screen awake needs HTTPS and a browser with screen wake-lock support.'
            : held ? 'The screen is being kept awake. Tap to allow normal sleep.'
            : this.failed ? 'The screen may sleep. The device released or declined the request; tap to retry.'
            : 'Keep the screen awake while this page is visible.';
    }

    async acquire() {
        if (!this.supported || !this.enabled || this.suspended || this.pending
            || this.page.visibilityState !== 'visible' || (this.lock && !this.lock.released)) return;
        const generation = this.generation;
        this.pending = true;
        this.failed = false;
        this.render();
        try {
            const lock = await this.wakeLock.request('screen');
            // A request can resolve after the user switches tabs or navigates away.
            if (generation !== this.generation || !this.enabled || this.suspended
                || this.page.visibilityState !== 'visible') {
                await lock.release();
                return;
            }
            this.lock = lock;
            this.failed = lock.released;
            lock.addEventListener('release', () => {
                if (this.lock !== lock) return;
                this.lock = null;
                this.failed = this.enabled && !this.suspended && this.page.visibilityState === 'visible';
                this.render();
                // Do not retry immediately: low-power conditions can release it again.
            }, { once: true });
        } catch {
            this.failed = true;
        } finally {
            this.pending = false;
            this.render();
            // If the page became visible again while the old request was pending,
            // release that stale lock first, then request a fresh one.
            if (generation !== this.generation) this.acquire();
        }
    }

    release() {
        this.generation++;
        const lock = this.lock;
        this.lock = null;
        this.failed = false;
        if (lock && !lock.released) Promise.resolve(lock.release()).catch(() => {});
        this.render();
    }
}

export function initializeDisplayControls(onResize) {
    new ScreenAwake({ button: document.getElementById('keepAwakeBtn') });

    const root = document.documentElement;
    const button = document.getElementById('fullscreenBtn');
    const status = document.getElementById('displayStatus');
    const fullscreenElement = () => document.fullscreenElement || document.webkitFullscreenElement;
    const update = () => {
        const active = Boolean(fullscreenElement());
        button.textContent = active ? 'Exit full screen' : 'Full screen';
        button.setAttribute('aria-pressed', String(active));
        button.classList.toggle('btn-primary', active);
        requestAnimationFrame(onResize);
    };
    const showHelp = message => {
        status.hidden = false;
        status.textContent = message;
    };
    button.addEventListener('click', async () => {
        status.hidden = true;
        try {
            if (fullscreenElement()) {
                const exit = document.exitFullscreen || document.webkitExitFullscreen;
                if (!exit) throw new Error('Fullscreen exit unavailable');
                await exit.call(document);
            } else {
                const request = root.requestFullscreen || root.webkitRequestFullscreen;
                if (!request) {
                    showHelp('Full screen is unavailable in this browser. In Safari, use Share → Add to Home Screen and open the app from there to remove the browser bars.');
                    return;
                }
                // Preserve the user gesture: no asynchronous work before this call.
                await request.call(root);
            }
        } catch {
            showHelp('Safari could not change full-screen mode. Try the Full screen button again, or use Share → Add to Home Screen.');
        }
        update();
    });
    document.addEventListener('fullscreenchange', update);
    document.addEventListener('webkitfullscreenchange', update);
    window.visualViewport?.addEventListener('resize', () => requestAnimationFrame(onResize));
    update();
}
