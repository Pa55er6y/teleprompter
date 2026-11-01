import test from 'node:test';
import assert from 'node:assert/strict';
import { setImmediate } from 'node:timers/promises';
import { ScreenAwake } from '../display-controls.mjs';

class Sentinel extends EventTarget {
    released = false;
    release() {
        if (!this.released) {
            this.released = true;
            this.dispatchEvent(new Event('release'));
        }
        return Promise.resolve();
    }
}

function fixture({ visible = true, request, secure = true, supported = true } = {}) {
    const page = new EventTarget();
    page.visibilityState = visible ? 'visible' : 'hidden';
    const host = new EventTarget();
    const button = new EventTarget();
    const attributes = new Map();
    button.classList = { toggle() {} };
    button.setAttribute = (name, value) => attributes.set(name, value);
    button.getAttribute = name => attributes.get(name);
    const locks = [];
    const calls = [];
    const wakeLock = supported ? {
        request(type) {
            calls.push(type);
            if (request) return request();
            const lock = new Sentinel();
            locks.push(lock);
            return Promise.resolve(lock);
        }
    } : undefined;
    const controller = new ScreenAwake({ button, page, host, wakeLock, secure });
    const visibility = value => {
        page.visibilityState = value;
        page.dispatchEvent(new Event('visibilitychange'));
    };
    return { page, host, button, controller, locks, calls, visibility };
}

test('requests a screen lock automatically for the visible app', async () => {
    const app = fixture();
    await setImmediate();
    assert.deepEqual(app.calls, ['screen']);
    assert.equal(app.controller.lock, app.locks[0]);
    assert.equal(app.button.getAttribute('aria-pressed'), 'true');
});

test('does not request a lock until an initially hidden page becomes visible', async () => {
    const app = fixture({ visible: false });
    await setImmediate();
    assert.equal(app.calls.length, 0);
    app.visibility('visible');
    await setImmediate();
    assert.equal(app.calls.length, 1);
});

test('releases on tab switch and reacquires on return', async () => {
    const app = fixture();
    await setImmediate();
    app.visibility('hidden');
    assert.equal(app.locks[0].released, true);
    assert.equal(app.controller.lock, null);
    app.visibility('visible');
    await setImmediate();
    assert.equal(app.calls.length, 2);
    assert.equal(app.controller.lock, app.locks[1]);
});

test('releases a pending request that resolves after the page was hidden', async () => {
    let resolve;
    const app = fixture({ request: () => new Promise(done => { resolve = done; }) });
    app.visibility('hidden');
    const stale = new Sentinel();
    resolve(stale);
    await setImmediate();
    assert.equal(stale.released, true);
    assert.equal(app.controller.lock, null);
    assert.equal(app.calls.length, 1);
});

test('reacquires after a quick hide-and-return while a request is pending', async () => {
    let resolve;
    let count = 0;
    const fresh = new Sentinel();
    const app = fixture({ request: () => ++count === 1
        ? new Promise(done => { resolve = done; }) : Promise.resolve(fresh) });
    app.visibility('hidden');
    app.visibility('visible');
    const stale = new Sentinel();
    resolve(stale);
    await setImmediate();
    assert.equal(stale.released, true);
    assert.equal(app.controller.lock, fresh);
    assert.equal(app.calls.length, 2);
});

test('pagehide releases and pageshow restores after back/forward cache navigation', async () => {
    const app = fixture();
    await setImmediate();
    app.host.dispatchEvent(new Event('pagehide'));
    assert.equal(app.locks[0].released, true);
    await app.controller.acquire();
    assert.equal(app.calls.length, 1);
    app.host.dispatchEvent(new Event('pageshow'));
    await setImmediate();
    assert.equal(app.calls.length, 2);
});

test('respects manual opt-out across visibility changes', async () => {
    const app = fixture();
    await setImmediate();
    app.button.dispatchEvent(new Event('click'));
    assert.equal(app.locks[0].released, true);
    app.visibility('hidden');
    app.visibility('visible');
    await setImmediate();
    assert.equal(app.calls.length, 1);
    app.button.dispatchEvent(new Event('click'));
    await setImmediate();
    assert.equal(app.calls.length, 2);
});

test('a rejected request does not claim success or loop, and can be retried', async () => {
    let count = 0;
    const app = fixture({ request: () => ++count === 1
        ? Promise.reject(new Error('Power saving or permission denied')) : Promise.resolve(new Sentinel()) });
    await setImmediate();
    assert.equal(app.controller.lock, null);
    assert.equal(app.button.getAttribute('aria-pressed'), 'false');
    assert.equal(app.calls.length, 1);
    app.button.dispatchEvent(new Event('click'));
    await setImmediate();
    assert.equal(app.button.getAttribute('aria-pressed'), 'true');
});

test('system release updates state and waits for retry instead of looping', async () => {
    const app = fixture();
    await setImmediate();
    await app.locks[0].release();
    await setImmediate();
    assert.equal(app.controller.lock, null);
    assert.equal(app.button.getAttribute('aria-pressed'), 'false');
    assert.equal(app.calls.length, 1);
    app.button.dispatchEvent(new Event('click'));
    await setImmediate();
    assert.equal(app.calls.length, 2);
});

test('coalesces concurrent requests', async () => {
    const app = fixture();
    app.controller.acquire();
    app.controller.acquire();
    await setImmediate();
    assert.equal(app.calls.length, 1);
});

test('does not request wake locks in an insecure context', async () => {
    const app = fixture({ secure: false });
    await setImmediate();
    assert.equal(app.calls.length, 0);
    assert.equal(app.button.disabled, true);
});

test('does not break when wake locks are unsupported', async () => {
    // Pass null rather than undefined to prevent the browser default parameter.
    const page = new EventTarget();
    page.visibilityState = 'visible';
    const button = new EventTarget();
    button.classList = { toggle() {} };
    button.setAttribute = () => {};
    const controller = new ScreenAwake({ button, page, host: new EventTarget(), wakeLock: null, secure: true });
    await setImmediate();
    assert.equal(button.disabled, true);
    assert.equal(controller.lock, null);
});
