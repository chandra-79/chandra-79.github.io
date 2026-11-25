export const SUDOKU_VARIANTS = [ "classic", "addoku", "diagonal", "mini", "even-odd" ];

export const SUDOKU_DIFFICULTIES = [ "easy", "medium", "hard", "expert" ];

const e = new WeakMap, o = new Map, t = e => {
    let o = 0;
    for (;e; e &= e - 1) o++;
    return o;
}, n = e => 32 - Math.clz32(e);

function r(e, o) {
    const t = [ ...e ];
    for (let e = t.length - 1; e > 0; e--) {
        const n = Math.floor(o() * (e + 1));
        [t[e], t[n]] = [ t[n], t[e] ];
    }
    return t;
}

function s(e, r, s) {
    const i = `${e}:${r}:${s}`;
    if (!o.has(i)) {
        const l = [];
        for (let o = 1; o < 1 << e; o++) {
            if (t(o) !== r) continue;
            let e = 0;
            for (let t = o; t; t &= t - 1) e += n(t & -t);
            e === s && l.push(o);
        }
        o.set(i, l);
    }
    return o.get(i);
}

function i(o) {
    if (e.has(o)) return e.get(o);
    const {size: t, boxRows: n, boxCols: r} = o;
    if (![ 6, 9 ].includes(t) || n * r !== t || t % n || t % r) throw new RangeError("Invalid Sudoku dimensions.");
    const i = [], l = Array.from({
        length: t * t
    }, () => []), a = e => {
        const o = i.length;
        i.push(e);
        for (const t of e) l[t].push(o);
        return o;
    };
    for (let e = 0; e < t; e++) a(Array.from({
        length: t
    }, (o, n) => e * t + n));
    for (let e = 0; e < t; e++) a(Array.from({
        length: t
    }, (o, n) => n * t + e));
    for (let e = 0; e < t; e += n) for (let o = 0; o < t; o += r) a(Array.from({
        length: t
    }, (n, s) => (e + Math.floor(s / r)) * t + o + s % r));
    "diagonal" === o.variant && (a(Array.from({
        length: t
    }, (e, o) => o * t + o)), a(Array.from({
        length: t
    }, (e, o) => o * t + t - o - 1)));
    const u = new Array(t * t).fill(-1), f = (o.cages || []).map((e, o) => {
        if (!Array.isArray(e.cells) || !e.cells.length || e.cells.length > t || !Number.isInteger(e.sum) || new Set(e.cells).size !== e.cells.length) throw new RangeError("Invalid Sudoku cage.");
        for (const n of e.cells) {
            if (!Number.isInteger(n) || n < 0 || n >= t * t || -1 !== u[n]) throw new RangeError("Invalid Sudoku cage cell.");
            u[n] = o;
        }
        return {
            ...e,
            group: a(e.cells),
            options: s(t, e.cells.length, e.sum)
        };
    }), c = (1 << t) - 1, g = Array.from({
        length: t * t
    }, (e, n) => {
        const r = o.parity?.[n];
        if (!r) return c;
        if (![ "odd", "even" ].includes(r)) throw new RangeError("Invalid parity marker.");
        let s = 0;
        for (let e = 1; e <= t; e++) e % 2 == 1 == ("odd" === r) && (s |= 1 << e - 1);
        return s;
    }), d = {
        size: t,
        fullMask: c,
        groups: i,
        cellGroups: l,
        cages: f,
        cellCages: u,
        parityMasks: g
    };
    return e.set(o, d), d;
}

function l(e, o) {
    return Array.isArray(o) && o.length === e.size * e.size && o.every(o => Number.isInteger(o) && o >= 0 && o <= e.size);
}

export function candidateMask(e, o, t) {
    const n = i(e);
    let r = n.parityMasks[t];
    for (const e of n.cellGroups[t]) for (const s of n.groups[e]) s !== t && o[s] && (r &= ~(1 << o[s] - 1));
    return r;
}

export function explainHint(e, o, t) {
    const n = i(e), {size: r, solution: s} = e, l = s[t], a = 1 << l - 1, u = o.map((o, t) => e.givens[t] || o === s[t] ? o : 0), f = `Row ${Math.floor(t / r) + 1}, column ${t % r + 1}`;
    if (candidateMask(e, u, t) === a) return {
        kind: "only",
        digit: l,
        text: `${f} can only be ${l}: every other digit is ruled out by its row, column, box or special rules.`
    };
    for (const o of n.cellGroups[t]) {
        const s = n.groups[o];
        if (s.length === r && s.every(o => o === t || u[o] || !(candidateMask(e, u, o) & a))) return {
            kind: "hidden",
            digit: l,
            text: `In this ${o < r ? "row" : o < 2 * r ? "column" : o < 3 * r ? "box" : "diagonal"}, ${l} has nowhere else to go, so ${f} is ${l}.`
        };
    }
    return {
        kind: "direct",
        digit: l,
        text: `${f} is ${l}. No simple pattern shows it, so try noting the possibilities nearby.`
    };
}

export function getConflicts(e, o) {
    const t = i(e), n = new Set;
    if (!Array.isArray(o) || o.length !== e.size * e.size) return Array.from({
        length: e.size * e.size
    }, (e, o) => o);
    o.forEach((o, r) => {
        (!Number.isInteger(o) || o < 0 || o > e.size) && n.add(r), e.givens?.[r] && o !== e.givens[r] && n.add(r),
        o > 0 && !(t.parityMasks[r] & 1 << o - 1) && n.add(r);
    });
    for (const e of t.groups) {
        const t = new Map;
        for (const r of e) {
            const e = o[r];
            e && (t.has(e) ? (n.add(r), n.add(t.get(e))) : t.set(e, r));
        }
    }
    for (const e of t.cages) {
        let t = 0;
        for (const n of e.cells) o[n] > 0 && (t |= 1 << o[n] - 1);
        if (!e.options.some(e => (e & t) === t)) for (const t of e.cells) o[t] && n.add(t);
    }
    return [ ...n ].sort((e, o) => e - o);
}

function a(e, o, s, a, u = !0) {
    if (!l(e, o)) return {
        count: 0,
        solution: null
    };
    const f = i(e), c = [ ...o ], g = new Array(f.groups.length).fill(0);
    for (let o = 0; o < c.length; o++) {
        const t = c[o];
        if (u && e.givens?.[o] && t !== e.givens[o]) return {
            count: 0,
            solution: null
        };
        if (!t) continue;
        const n = 1 << t - 1;
        if (!(f.parityMasks[o] & n)) return {
            count: 0,
            solution: null
        };
        for (const e of f.cellGroups[o]) {
            if (g[e] & n) return {
                count: 0,
                solution: null
            };
            g[e] |= n;
        }
    }
    let d = 0, h = null;
    return function e() {
        if (d >= s) return;
        const o = f.cages.map(e => {
            const o = g[e.group];
            let t = 0, n = !1;
            for (const r of e.options) (r & o) === o && (n = !0, t |= r & ~o);
            return n ? t : -1;
        });
        if (o.some(e => -1 === e)) return;
        let i = -1, l = 0, u = f.size + 1;
        for (let e = 0; e < c.length; e++) {
            if (c[e]) continue;
            let n = f.parityMasks[e];
            for (const o of f.cellGroups[e]) n &= ~g[o];
            const r = f.cellCages[e];
            -1 !== r && (n &= o[r]);
            const s = t(n);
            if (!s) return;
            if (s < u && (i = e, l = n, u = s, 1 === s)) break;
        }
        if (-1 === i) return d++, void (h || (h = [ ...c ]));
        let p = [];
        for (let e = l; e; e &= e - 1) p.push(e & -e);
        a && (p = r(p, a));
        for (const o of p) {
            c[i] = n(o);
            for (const e of f.cellGroups[i]) g[e] |= o;
            e();
            for (const e of f.cellGroups[i]) g[e] &= ~o;
            if (c[i] = 0, d >= s) break;
        }
    }(), {
        count: d,
        solution: h
    };
}

export function countSolutions(e, o = e.givens, t = 2) {
    if (!Number.isInteger(t) || t < 1 || t > 100) throw new RangeError("Solution limit must be between 1 and 100.");
    return a(e, o, t).count;
}

export function isSolved(e, o) {
    return l(e, o) && o.every(Boolean) && 0 === getConflicts(e, o).length;
}

export const SUDOKU_GEN2_DAY = 27;

export const SUDOKU_PRACTICE_V2 = 201e3;

export const SUDOKU_LADDER_V2 = 99e4;

export function sudokuGeneration(e) {
    if (e >= 99e4) return 2;
    if (e >= 201e3 && e < 202e3) return 2;
    const o = e >= 7e5 ? -1 : e >= 6e5 ? 6e5 : e >= 45e4 ? 45e4 : e >= 3e5 ? 3e5 : e >= 1e3 && e < 2e5 ? 1e3 : -1;
    return o >= 0 && e - o >= 27 ? 2 : 1;
}

export function generatePuzzle({variant: o = "classic", difficulty: t = "easy", level: n = 1} = {}) {
    if (!SUDOKU_VARIANTS.includes(o)) throw new RangeError("Unknown Sudoku variant.");
    if (!SUDOKU_DIFFICULTIES.includes(t)) throw new RangeError("Unknown Sudoku difficulty.");
    if (!Number.isSafeInteger(n) || n < 1 || n > 1e6) throw new RangeError("Level must be an integer from 1 to 1000000.");
    const s = "mini" === o ? 6 : 9, i = {
        variant: o,
        difficulty: t,
        level: n,
        size: s,
        boxRows: 6 === s ? 2 : 3,
        boxCols: 3,
        givens: new Array(s * s).fill(0),
        solution: [],
        cages: [],
        parity: {}
    }, l = sudokuGeneration(n), u = function(e) {
        let o = 2166136261;
        for (const t of e) o = Math.imul(o ^ t.charCodeAt(0), 16777619);
        return () => {
            o += 1831565813;
            let e = o;
            return e = Math.imul(e ^ e >>> 15, 1 | e), e ^= e + Math.imul(e ^ e >>> 7, 61 | e),
            ((e ^ e >>> 14) >>> 0) / 4294967296;
        };
    }(2 === l ? `ziggle2:${o}:${t}:${n}` : `ziggle:${o}:${n}`), f = SUDOKU_DIFFICULTIES.indexOf(t);
    if (i.solution = "diagonal" === o || 2 === l ? a(i, i.givens, 1, u).solution : function(e, o) {
        const {size: t, boxRows: n, boxCols: s} = e, i = r(Array.from({
            length: t
        }, (e, o) => o + 1), o), l = r(Array.from({
            length: t / n
        }, (e, o) => o), o).flatMap(e => r(Array.from({
            length: n
        }, (o, t) => e * n + t), o)), a = r(Array.from({
            length: t / s
        }, (e, o) => o), o).flatMap(e => r(Array.from({
            length: s
        }, (o, t) => e * s + t), o));
        return l.flatMap(e => a.map(o => i[(e * s + Math.floor(e / n) + o) % t]));
    }(i, u), !i.solution) throw new Error("Could not create a solved grid.");
    if ("addoku" === o && (i.cages = function(e, o, t, n) {
        const s = new Set(r(Array.from({
            length: e.length
        }, (e, o) => o), n)), i = [ 2, 3, 4, 5 ][t], l = [];
        for (;s.size; ) {
            const t = s.values().next().value, r = [ t ], a = new Set([ e[t] ]);
            s.delete(t);
            const u = 2 + Math.floor(n() * (i - 1));
            for (;r.length < u; ) {
                const t = new Set;
                for (const n of r) {
                    const r = Math.floor(n / o), i = n % o;
                    for (const l of [ r > 0 ? n - o : -1, r < o - 1 ? n + o : -1, i > 0 ? n - 1 : -1, i < o - 1 ? n + 1 : -1 ]) s.has(l) && !a.has(e[l]) && t.add(l);
                }
                if (!t.size) break;
                const i = [ ...t ][Math.floor(n() * t.size)];
                r.push(i), a.add(e[i]), s.delete(i);
            }
            r.sort((e, o) => e - o), l.push({
                cells: r,
                sum: r.reduce((o, t) => o + e[t], 0)
            });
        }
        return l.sort((e, o) => e.cells[0] - o.cells[0]);
    }(i.solution, s, f, u)), "even-odd" === o) {
        const e = r(Array.from({
            length: s * s
        }, (e, o) => o), u).slice(0, [ 32, 26, 20, 14 ][f]);
        for (const o of e) i.parity[o] = i.solution[o] % 2 ? "odd" : "even";
    }
    e.delete(i), i.givens = [ ...i.solution ];
    const c = "mini" === o ? [ 22, 17, 13, 10 ][f] : "addoku" === o ? [ 30, 22, 14, 8 ][f] : "even-odd" === o ? [ 40, 32, 26, 22 ][f] : [ 44, 36, 29, 24 ][f];
    let g = i.givens.length;
    for (const e of r(Array.from({
        length: s * s
    }, (e, o) => o), u)) {
        if (g <= c) break;
        const o = i.givens[e];
        i.givens[e] = 0, 1 === a(i, i.givens, 2, void 0, !1).count ? g-- : i.givens[e] = o;
    }
    return i;
}
