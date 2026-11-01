// Match short, recent speech hypotheses near the current reading position.
// This module has no microphone or DOM dependencies, so matching can be tested alone.
export function tokenize(text) {
    return Array.from(text.matchAll(/[a-z0-9]+(?:['\u2019][a-z0-9]+)*/gi), match => ({
        word: match[0].toLowerCase().replace(/['\u2019]/g, ''),
        start: match.index,
        end: match.index + match[0].length
    }));
}

function wordCost(a, b) {
    if (a === b) return 0;
    // Allow a single letter error in longer words, including simple plural endings.
    if (Math.min(a.length, b.length) < 5 || Math.abs(a.length - b.length) > 1) return 1;
    let previous = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i++) {
        const row = [i];
        for (let j = 1; j <= b.length; j++) {
            row[j] = Math.min(row[j - 1] + 1, previous[j] + 1,
                previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
        }
        previous = row;
    }
    return previous[b.length] <= 1 ? 0.35 : 1;
}

export class VoiceMatcher {
    constructor(text) {
        this.tokens = tokenize(text);
        this.seek(0);
    }

    seek(index) {
        this.position = Math.max(0, Math.min(this.tokens.length - 1, index));
        this.lastHypothesis = '';
    }

    match(transcript) {
        const spoken = tokenize(transcript).map(token => token.word).slice(-16);
        const hypothesis = spoken.join(' ');
        if (spoken.length < 3 || hypothesis === this.lastHypothesis) return null;
        this.lastHypothesis = hypothesis;

        const windowStart = Math.max(0, this.position - 18);
        const words = this.tokens.slice(windowStart, this.position + 61).map(token => token.word);
        const lengths = [...new Set([Math.min(16, spoken.length), 12, 8, 6, 4])]
            .filter(length => length <= spoken.length);
        let best = null;

        for (const length of lengths) {
            const phrase = spoken.slice(-length);
            // Semi-global word alignment: a phrase may start anywhere in the nearby script.
            const costs = Array.from({ length: length + 1 }, () => Array(words.length + 1).fill(0));
            for (let i = 1; i <= length; i++) {
                costs[i][0] = i;
                for (let j = 1; j <= words.length; j++) {
                    costs[i][j] = Math.min(
                        costs[i - 1][j - 1] + wordCost(phrase[i - 1], words[j - 1]),
                        costs[i - 1][j] + 1,
                        costs[i][j - 1] + 1
                    );
                }
            }

            for (let end = 1; end <= words.length; end++) {
                const index = windowStart + end - 1;
                const cost = costs[length][end];
                if (index < this.position || cost / length > 0.25) continue;
                // Do not move on an unrelated trailing word or a tiny fragment far ahead.
                if (wordCost(phrase[length - 1], words[end - 1]) >= 1) continue;
                let i = length;
                let j = end;
                let matches = 0;
                while (i > 0 && j > 0) {
                    const substitution = wordCost(phrase[i - 1], words[j - 1]);
                    if (Math.abs(costs[i][j] - costs[i - 1][j - 1] - substitution) < 0.001) {
                        if (substitution < 1) matches++;
                        i--;
                        j--;
                    } else if (costs[i][j] === costs[i - 1][j] + 1) {
                        i--;
                    } else {
                        j--;
                    }
                }
                if (matches < 3 || (index - this.position > 12 && matches < 5)) continue;
                const score = matches * 3 - cost * 2 - (index - this.position) * 0.04;
                if (!best || score > best.score) {
                    best = { index, score, confidence: 1 - cost / length };
                }
            }
        }

        if (!best) return null;
        this.position = best.index;
        return best;
    }
}
