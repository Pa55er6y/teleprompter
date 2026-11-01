import test from 'node:test';
import assert from 'node:assert/strict';
import { VoiceMatcher, tokenize } from '../voice-matcher.mjs';

const sample = 'Have you ever wondered how passwords are stored on the server? In this video, we will explore password storage mechanisms, from the simplest design to more secure approaches used in modern web systems. By the end, you will be able to explain how hashing, salts, slow password hashing, and peppers reduce the damage when a password database is leaked.';
const words = tokenize(sample).map(token => token.word);

test('follows every incremental hypothesis through the supplied paragraph', () => {
    const matcher = new VoiceMatcher(sample);
    for (let count = 3; count <= words.length; count++) {
        const match = matcher.match(words.slice(0, count).join(' '));
        assert.equal(match?.index, count - 1, `at ${words.slice(0, count).join(' ')}`);
    }
});

test('holds on short, repeated, and unrelated speech, then resumes', () => {
    const matcher = new VoiceMatcher(sample);
    assert.equal(matcher.match('Have you'), null);
    const opening = 'Have you ever wondered how passwords are stored on the server';
    assert.equal(matcher.match(opening).index, 10);
    assert.equal(matcher.match(opening), null);
    assert.equal(matcher.match(`${opening}. I am taking a quick break from the script.`), null);
    assert.equal(matcher.position, 10);
    assert.equal(matcher.match('I am taking a quick break from the script. In this video we will explore').index, 16);
});

test('accepts a recognition substitution or omitted word without jumping ahead', () => {
    const matcher = new VoiceMatcher(sample);
    assert.equal(matcher.match('Have you ever wondered how password are stored on the server').index, 10);
    assert.equal(matcher.match('In this video we explore password storage mechanisms').index, 19);
});

test('interim corrections and repeated reading cannot move the cursor backwards', () => {
    const matcher = new VoiceMatcher(sample);
    matcher.match(words.slice(0, 11).join(' '));
    matcher.match(words.slice(0, 10).join(' '));
    assert.equal(matcher.position, 10);
    matcher.match('have you ever wondered');
    assert.equal(matcher.position, 10);
});

test('can restart recognition at the current position without earlier transcript history', () => {
    const matcher = new VoiceMatcher(sample);
    matcher.match(words.slice(0, 20).join(' '));
    assert.equal(matcher.match(words.slice(20, 27).join(' ')).index, 26);
});

test('manual seek allows resuming in either direction', () => {
    const matcher = new VoiceMatcher(sample);
    matcher.seek(35);
    assert.equal(matcher.match(words.slice(35, 42).join(' ')).index, 41);
    matcher.seek(0);
    assert.equal(matcher.match(words.slice(0, 5).join(' ')).index, 4);
});

test('does not jump to a repeated phrase far down a long script', () => {
    const matcher = new VoiceMatcher(`${sample} ${'additional unrelated content '.repeat(60)} ${sample}`);
    assert.equal(matcher.match('have you ever wondered how passwords').index, 5);
    assert.ok(matcher.position < 12);
});

test('preserves punctuation offsets and normalises apostrophes and case', () => {
    const text = 'Don’t reuse PASSWORDS — ever.';
    const tokens = tokenize(text);
    assert.deepEqual(tokens.map(token => token.word), ['dont', 'reuse', 'passwords', 'ever']);
    assert.equal(text.slice(tokens[0].start, tokens[0].end), 'Don’t');
});

test('empty or punctuation-only scripts do not produce matches', () => {
    assert.equal(new VoiceMatcher('...').match('have you ever wondered'), null);
});
