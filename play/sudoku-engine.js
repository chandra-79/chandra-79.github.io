export const SUDOKU_VARIANTS = [ "classic", "addoku", "diagonal", "mini", "even-odd" ];

export const SUDOKU_DIFFICULTIES = [ "easy", "medium", "hard", "expert" ];

const e = new WeakMap, t = new Map, o = e => {
    let t = 0;
    for (;e; e &= e - 1) t++;
    return t;
}, n = e => 32 - Math.clz32(e);

function r(e, t) {
    const o = [ ...e ];
    for (let e = o.length - 1; e > 0; e--) {
        const n = Math.floor(t() * (e + 1));
        [o[e], o[n]] = [ o[n], o[e] ];
    }
    return o;
}

function s(e, r, s) {
    const l = `${e}:${r}:${s}`;
    if (!t.has(l)) {
        const i = [];
        for (let t = 1; t < 1 << e; t++) {
            if (o(t) !== r) continue;
            let e = 0;
            for (let o = t; o; o &= o - 1) e += n(o & -o);
            e === s && i.push(t);
        }
        t.set(l, i);
    }
    return t.get(l);
}

function l(t) {
    if (e.has(t)) return e.get(t);
    const {size: o, boxRows: n, boxCols: r} = t;
    if (![ 6, 9 ].includes(o) || n * r !== o || o % n || o % r) throw new RangeError("Invalid Sudoku dimensions.");
    const l = [], i = Array.from({
        length: o * o
    }, () => []), c = e => {
        const t = l.length;
        l.push(e);
        for (const o of e) i[o].push(t);
        return t;
    };
    for (let e = 0; e < o; e++) c(Array.from({
        length: o
    }, (t, n) => e * o + n));
    for (let e = 0; e < o; e++) c(Array.from({
        length: o
    }, (t, n) => n * o + e));
    for (let e = 0; e < o; e += n) for (let t = 0; t < o; t += r) c(Array.from({
        length: o
    }, (n, s) => (e + Math.floor(s / r)) * o + t + s % r));
    "diagonal" === t.variant && (c(Array.from({
        length: o
    }, (e, t) => t * o + t)), c(Array.from({
        length: o
    }, (e, t) => t * o + o - t - 1)));
    const u = new Array(o * o).fill(-1), f = (t.cages || []).map((e, t) => {
        if (!Array.isArray(e.cells) || !e.cells.length || e.cells.length > o || !Number.isInteger(e.sum) || new Set(e.cells).size !== e.cells.length) throw new RangeError("Invalid Sudoku cage.");
        for (const n of e.cells) {
            if (!Number.isInteger(n) || n < 0 || n >= o * o || -1 !== u[n]) throw new RangeError("Invalid Sudoku cage cell.");
            u[n] = t;
        }
        return {
            ...e,
            group: c(e.cells),
            options: s(o, e.cells.length, e.sum)
        };
    }), a = (1 << o) - 1, g = Array.from({
        length: o * o
    }, (e, n) => {
        const r = t.parity?.[n];
        if (!r) return a;
        if (![ "odd", "even" ].includes(r)) throw new RangeError("Invalid parity marker.");
        let s = 0;
        for (let e = 1; e <= o; e++) e % 2 == 1 == ("odd" === r) && (s |= 1 << e - 1);
        return s;
    }), d = {
        size: o,
        fullMask: a,
        groups: l,
        cellGroups: i,
        cages: f,
        cellCages: u,
        parityMasks: g
    };
    return e.set(t, d), d;
}

function i(e, t) {
    return Array.isArray(t) && t.length === e.size * e.size && t.every(t => Number.isInteger(t) && t >= 0 && t <= e.size);
}

export function candidateMask(e, t, o) {
    const n = l(e);
    let r = n.parityMasks[o];
    for (const e of n.cellGroups[o]) for (const s of n.groups[e]) s !== o && t[s] && (r &= ~(1 << t[s] - 1));
    return r;
}

export function explainHint(e, t, o) {
    const n = l(e), {size: r, solution: s} = e, i = s[o], c = 1 << i - 1, u = t.map((t, o) => e.givens[o] || t === s[o] ? t : 0), f = `Row ${Math.floor(o / r) + 1}, column ${o % r + 1}`;
    if (candidateMask(e, u, o) === c) return {
        kind: "only",
        digit: i,
        text: `${f} can only be ${i}: every other digit is ruled out by its row, column, box or special rules.`
    };
    for (const t of n.cellGroups[o]) {
        const s = n.groups[t];
        if (s.length === r && s.every(t => t === o || u[t] || !(candidateMask(e, u, t) & c))) return {
            kind: "hidden",
            digit: i,
            text: `In this ${t < r ? "row" : t < 2 * r ? "column" : t < 3 * r ? "box" : "diagonal"}, ${i} has nowhere else to go, so ${f} is ${i}.`
        };
    }
    return {
        kind: "direct",
        digit: i,
        text: `${f} is ${i}. No simple pattern shows it, so try noting the possibilities nearby.`
    };
}

export function getConflicts(e, t) {
    const o = l(e), n = new Set;
    if (!Array.isArray(t) || t.length !== e.size * e.size) return Array.from({
        length: e.size * e.size
    }, (e, t) => t);
    t.forEach((t, r) => {
        (!Number.isInteger(t) || t < 0 || t > e.size) && n.add(r), e.givens?.[r] && t !== e.givens[r] && n.add(r),
        t > 0 && !(o.parityMasks[r] & 1 << t - 1) && n.add(r);
    });
    for (const e of o.groups) {
        const o = new Map;
        for (const r of e) {
            const e = t[r];
            e && (o.has(e) ? (n.add(r), n.add(o.get(e))) : o.set(e, r));
        }
    }
    for (const e of o.cages) {
        let o = 0;
        for (const n of e.cells) t[n] > 0 && (o |= 1 << t[n] - 1);
        if (!e.options.some(e => (e & o) === o)) for (const o of e.cells) t[o] && n.add(o);
    }
    return [ ...n ].sort((e, t) => e - t);
}

function c(e, t, s, c, u = !0) {
    if (!i(e, t)) return {
        count: 0,
        solution: null
    };
    const f = l(e), a = [ ...t ], g = new Array(f.groups.length).fill(0);
    for (let t = 0; t < a.length; t++) {
        const o = a[t];
        if (u && e.givens?.[t] && o !== e.givens[t]) return {
            count: 0,
            solution: null
        };
        if (!o) continue;
        const n = 1 << o - 1;
        if (!(f.parityMasks[t] & n)) return {
            count: 0,
            solution: null
        };
        for (const e of f.cellGroups[t]) {
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
        const t = f.cages.map(e => {
            const t = g[e.group];
            let o = 0, n = !1;
            for (const r of e.options) (r & t) === t && (n = !0, o |= r & ~t);
            return n ? o : -1;
        });
        if (t.some(e => -1 === e)) return;
        let l = -1, i = 0, u = f.size + 1;
        for (let e = 0; e < a.length; e++) {
            if (a[e]) continue;
            let n = f.parityMasks[e];
            for (const t of f.cellGroups[e]) n &= ~g[t];
            const r = f.cellCages[e];
            -1 !== r && (n &= t[r]);
            const s = o(n);
            if (!s) return;
            if (s < u && (l = e, i = n, u = s, 1 === s)) break;
        }
        if (-1 === l) return d++, void (h || (h = [ ...a ]));
        let p = [];
        for (let e = i; e; e &= e - 1) p.push(e & -e);
        c && (p = r(p, c));
        for (const t of p) {
            a[l] = n(t);
            for (const e of f.cellGroups[l]) g[e] |= t;
            e();
            for (const e of f.cellGroups[l]) g[e] &= ~t;
            if (a[l] = 0, d >= s) break;
        }
    }(), {
        count: d,
        solution: h
    };
}

export function countSolutions(e, t = e.givens, o = 2) {
    if (!Number.isInteger(o) || o < 1 || o > 100) throw new RangeError("Solution limit must be between 1 and 100.");
    return c(e, t, o).count;
}

export function isSolved(e, t) {
    return i(e, t) && t.every(Boolean) && 0 === getConflicts(e, t).length;
}

function u(e, t, o, n, s, l) {
    const i = new Map;
    for (const t of e) for (const e of t.cells) i.set(e, t);
    const c = r(e.filter(e => 1 === e.cells.length), l), u = new Set;
    let f = c.length - n;
    for (const e of c) {
        if (f <= 0) break;
        if (u.has(e) || 1 !== e.cells.length) continue;
        const n = e.cells[0], r = Math.floor(n / o), c = n % o, a = t[n];
        let g = [];
        for (const e of [ r > 0 ? n - o : -1, r < o - 1 ? n + o : -1, c > 0 ? n - 1 : -1, c < o - 1 ? n + 1 : -1 ]) {
            const o = i.get(e);
            !o || g.includes(o) || o.cells.length >= s || o.cells.some(e => t[e] === a) || (g.length && o.cells.length < g[0].cells.length && (g = []),
            g.length && o.cells.length !== g[0].cells.length || g.push(o));
        }
        if (!g.length) continue;
        const d = g[Math.floor(l() * g.length)];
        f -= 1 === d.cells.length ? 2 : 1, d.cells.push(n), d.cells.sort((e, t) => e - t),
        d.sum += a, i.set(n, d), u.add(e);
    }
    return e.filter(e => !u.has(e)).sort((e, t) => e.cells[0] - t.cells[0]);
}

function f(e) {
    const t = l(e), o = [ ...e.givens ], r = t.groups.filter(e => e.length === t.size);
    for (let s = !0; s; ) {
        s = !1;
        for (let t = 0; t < o.length; t++) {
            if (o[t]) continue;
            const r = candidateMask(e, o, t);
            !r || r & r - 1 || (o[t] = n(r), s = !0);
        }
        for (const l of r) for (let r = 1; r <= t.fullMask; r <<= 1) {
            let t = -1, i = 0;
            for (const s of l) {
                if (o[s] === n(r)) {
                    i = 2;
                    break;
                }
                !o[s] && candidateMask(e, o, s) & r && (t = s, i++);
            }
            1 === i && (o[t] = n(r), s = !0);
        }
    }
    return o.filter(e => !e).length;
}

function a(e, t, o) {
    e.givens = [ ...e.solution ];
    let n = e.givens.length;
    for (const s of r(Array.from({
        length: n
    }, (e, t) => t), o)) {
        if (n <= t) break;
        const o = e.givens[s];
        e.givens[s] = 0, 1 === c(e, e.givens, 2, void 0, !1).count ? n-- : e.givens[s] = o;
    }
    return n;
}

export const SUDOKU_GEN2_DAY = 27;

export const SUDOKU_PRACTICE_V2 = 201e3;

export const SUDOKU_LADDER_V2 = 99e4;

export const SUDOKU_TUNE_DAY = 28;

export const SUDOKU_PRACTICE_V3 = 202e3;

export const SUDOKU_LADDER_V3 = 21e4;

const g = e => e >= 7e5 ? -1 : e >= 6e5 ? 6e5 : e >= 45e4 ? 45e4 : e >= 3e5 ? 3e5 : e >= 1e3 && e < 2e5 ? 1e3 : -1;

export function sudokuTuned(e) {
    if (e >= 21e4 && e < 22e4) return !0;
    if (e >= 202e3 && e < 203e3) return !0;
    const t = g(e);
    return t >= 0 && e - t >= 28;
}

export const sudokuTunedStyle = (e, t) => "addoku" === e || "even-odd" === e || "mini" === e && "expert" === t;

export function sudokuGeneration(e) {
    if (e >= 99e4 || sudokuTuned(e)) return 2;
    if (e >= 201e3 && e < 202e3) return 2;
    const t = g(e);
    return t >= 0 && e - t >= 27 ? 2 : 1;
}

const d = [ 3, 2, 1, 1 ];

export function generatePuzzle({variant: t = "classic", difficulty: o = "easy", level: n = 1} = {}) {
    if (!SUDOKU_VARIANTS.includes(t)) throw new RangeError("Unknown Sudoku variant.");
    if (!SUDOKU_DIFFICULTIES.includes(o)) throw new RangeError("Unknown Sudoku difficulty.");
    if (!Number.isSafeInteger(n) || n < 1 || n > 1e6) throw new RangeError("Level must be an integer from 1 to 1000000.");
    const s = "mini" === t ? 6 : 9, l = {
        variant: t,
        difficulty: o,
        level: n,
        size: s,
        boxRows: 6 === s ? 2 : 3,
        boxCols: 3,
        givens: new Array(s * s).fill(0),
        solution: [],
        cages: [],
        parity: {}
    }, i = sudokuGeneration(n), g = sudokuTuned(n) && sudokuTunedStyle(t, o), h = function(e) {
        let t = 2166136261;
        for (const o of e) t = Math.imul(t ^ o.charCodeAt(0), 16777619);
        return () => {
            t += 1831565813;
            let e = t;
            return e = Math.imul(e ^ e >>> 15, 1 | e), e ^= e + Math.imul(e ^ e >>> 7, 61 | e),
            ((e ^ e >>> 14) >>> 0) / 4294967296;
        };
    }(2 === i ? `ziggle2:${t}:${o}:${n}` : `ziggle:${t}:${n}`), p = SUDOKU_DIFFICULTIES.indexOf(o);
    if (l.solution = "diagonal" === t || 2 === i ? c(l, l.givens, 1, h).solution : function(e, t) {
        const {size: o, boxRows: n, boxCols: s} = e, l = r(Array.from({
            length: o
        }, (e, t) => t + 1), t), i = r(Array.from({
            length: o / n
        }, (e, t) => t), t).flatMap(e => r(Array.from({
            length: n
        }, (t, o) => e * n + o), t)), c = r(Array.from({
            length: o / s
        }, (e, t) => t), t).flatMap(e => r(Array.from({
            length: s
        }, (t, o) => e * s + o), t));
        return i.flatMap(e => c.map(t => l[(e * s + Math.floor(e / n) + t) % o]));
    }(l, h), !l.solution) throw new Error("Could not create a solved grid.");
    if ("addoku" === t && (l.cages = function(e, t, o, n) {
        const s = new Set(r(Array.from({
            length: e.length
        }, (e, t) => t), n)), l = [ 2, 3, 4, 5 ][o], i = [];
        for (;s.size; ) {
            const o = s.values().next().value, r = [ o ], c = new Set([ e[o] ]);
            s.delete(o);
            const u = 2 + Math.floor(n() * (l - 1));
            for (;r.length < u; ) {
                const o = new Set;
                for (const n of r) {
                    const r = Math.floor(n / t), l = n % t;
                    for (const i of [ r > 0 ? n - t : -1, r < t - 1 ? n + t : -1, l > 0 ? n - 1 : -1, l < t - 1 ? n + 1 : -1 ]) s.has(i) && !c.has(e[i]) && o.add(i);
                }
                if (!o.size) break;
                const l = [ ...o ][Math.floor(n() * o.size)];
                r.push(l), c.add(e[l]), s.delete(l);
            }
            r.sort((e, t) => e - t), i.push({
                cells: r,
                sum: r.reduce((t, o) => t + e[o], 0)
            });
        }
        return i.sort((e, t) => e.cells[0] - t.cells[0]);
    }(l.solution, s, p, h), g)) for (const e of [ Math.min(5, p + 3), Math.min(7, p + 5) ]) l.cages = u(l.cages, l.solution, s, d[p], e, h);
    if ("even-odd" === t) {
        const e = r(Array.from({
            length: s * s
        }, (e, t) => t), h).slice(0, [ 32, 26, 20, 14 ][p]);
        for (const t of e) l.parity[t] = l.solution[t] % 2 ? "odd" : "even";
    }
    if (e.delete(l), g && "mini" === t) {
        let e = null;
        for (let t = 0; t < 120 && !(e?.left && e.clues <= 11); t++) {
            const o = {
                ...l,
                solution: t ? c({
                    ...l
                }, l.givens, 1, h).solution : l.solution
            }, n = a(o, 0, h), r = f(o);
            (!e || r > 0 > (e.left > 0) || r > 0 == e.left > 0 && n < e.clues) && (e = {
                trial: o,
                clues: n,
                left: r
            });
        }
        return e.trial;
    }
    if (a(l, "mini" === t ? [ 22, 17, 13, 10 ][p] : "addoku" === t ? (g ? [ 32, 26, 18, 12 ] : [ 30, 22, 14, 8 ])[p] : "even-odd" === t ? [ 40, 32, 26, 22 ][p] : [ 44, 36, 29, 24 ][p], h),
    g && "even-odd" === t) {
        const t = r(l.givens.map((e, t) => t).filter(e => !l.givens[e] && !l.parity[e]), h);
        for (const e of Object.keys(l.parity).map(Number).filter(e => l.givens[e]).sort((e, t) => e - t)) {
            delete l.parity[e];
            const o = t.pop();
            void 0 !== o && (l.parity[o] = l.solution[o] % 2 ? "odd" : "even");
        }
        e.delete(l);
    }
    return l;
}
