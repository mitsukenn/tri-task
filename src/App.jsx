import { useState, useEffect, useCallback, useRef } from "react";

const RANKS = [
    { id: "SS", label: "SS", color: "#ff00ff", bg: "rgba(255,0,255,0.08)", border: "rgba(255,0,255,0.3)", textOnBg: "#fff", grad: "linear-gradient(135deg,#cc00cc,#ff00ff,#ff66dd)" },
    { id: "S++", label: "S++", color: "#c8b800", bg: "rgba(255,255,0,0.12)", border: "rgba(200,180,0,0.4)", textOnBg: "#333", grad: "linear-gradient(135deg,#b0a000,#d4c400,#f0e850)" },
    { id: "S+", label: "S+", color: "#00cc00", bg: "rgba(0,255,0,0.08)", border: "rgba(0,200,0,0.35)", textOnBg: "#fff", grad: "linear-gradient(135deg,#00aa00,#00dd00,#55ff55)" },
    { id: "S", label: "S", color: "#007a00", bg: "rgba(0,122,0,0.08)", border: "rgba(0,122,0,0.35)", textOnBg: "#fff", grad: "linear-gradient(135deg,#004d00,#007a00,#22aa44)" },
];

const TODAY = new Date();
const TODAY_KEY = `${TODAY.getFullYear()}-${String(TODAY.getMonth() + 1).padStart(2, "0")}-${String(TODAY.getDate()).padStart(2, "0")}`;
const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];
const STORAGE_PREFIX = "satisfy-";

function load() {
    try {
        const result = localStorage.getItem(`${STORAGE_PREFIX}${TODAY_KEY}`);
        return result ? JSON.parse(result) : null;
    } catch {
        return null;
    }
}

function save(d) {
    try {
        localStorage.setItem(`${STORAGE_PREFIX}${TODAY_KEY}`, JSON.stringify(d));
    } catch { }
}

function loadHistory() {
    try {
        const entries = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(STORAGE_PREFIX) && key !== `${STORAGE_PREFIX}${TODAY_KEY}`) {
                try {
                    const data = localStorage.getItem(key);
                    if (data) {
                        entries.push({
                            date: key.replace(STORAGE_PREFIX, ""),
                            ...JSON.parse(data)
                        });
                    }
                } catch { }
            }
        }
        return entries.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 14);
    } catch {
        return [];
    }
}

const MAX_TASKS = 7;

export default function App() {
    const [loaded, setLoaded] = useState(false);
    const [step, setStep] = useState(1);
    const [tasks, setTasks] = useState(["", "", ""]);
    const [selected, setSelected] = useState([]);
    const [rank, setRank] = useState(null);
    const [deepOpen, setDeepOpen] = useState({});
    const [firstSteps, setFirstSteps] = useState({});
    const [tricks, setTricks] = useState({});
    const [showHist, setShowHist] = useState(false);
    const [histEntries, setHistEntries] = useState([]);
    const [dragIdx, setDragIdx] = useState(null);
    const dragOverIdx = useRef(null);

    // 初期データ読み込み
    useEffect(() => {
        const data = load();
        if (data) {
            setStep(data.step || 1);
            setTasks(data.tasks || ["", "", ""]);
            setSelected(data.selected || []);
            setRank(data.rank || null);
            setDeepOpen(data.deepOpen || {});
            setFirstSteps(data.firstSteps || {});
            setTricks(data.tricks || {});
        }
        setLoaded(true);
    }, []);

    // データ保存
    const persist = useCallback(() => {
        if (!loaded) return;
        save({ step, tasks, selected, rank, deepOpen, firstSteps, tricks });
    }, [loaded, step, tasks, selected, rank, deepOpen, firstSteps, tricks]);

    useEffect(() => {
        persist();
    }, [persist]);

    // 履歴読み込み
    useEffect(() => {
        if (showHist) {
            setHistEntries(loadHistory());
        }
    }, [showHist]);

    const dateStr = `${TODAY.getFullYear()}年${TODAY.getMonth() + 1}月${TODAY.getDate()}日（${WEEKDAYS[TODAY.getDay()]}）`;
    const filled = tasks.map((t, i) => ({ t, i })).filter(x => x.t.trim());
    const filledN = filled.length;

    const addTask = () => { if (tasks.length < MAX_TASKS) setTasks([...tasks, ""]); };
    const rmTask = (i) => {
        if (tasks.length <= 1) return;
        setTasks(tasks.filter((_, idx) => idx !== i));
        setSelected(selected.filter(x => x !== i).map(x => x > i ? x - 1 : x));
    };
    const upTask = (i, v) => { const n = [...tasks]; n[i] = v; setTasks(n); };

    const moveTask = (from, to) => {
        if (to < 0 || to >= tasks.length) return;
        const n = [...tasks];
        const [item] = n.splice(from, 1);
        n.splice(to, 0, item);
        const newSel = selected.map(si => {
            if (si === from) return to;
            if (from < to && si > from && si <= to) return si - 1;
            if (from > to && si >= to && si < from) return si + 1;
            return si;
        });
        setTasks(n);
        setSelected(newSel);
    };

    const moveSelectedTask = (from, to) => {
        if (to < 0 || to >= selected.length) return;
        const n = [...selected];
        const [item] = n.splice(from, 1);
        n.splice(to, 0, item);
        setSelected(n);
    };

    const handleDragStart = (i) => { setDragIdx(i); };
    const handleDragOver = (e, i) => { e.preventDefault(); dragOverIdx.current = i; };
    const handleDrop = () => {
        if (dragIdx !== null && dragOverIdx.current !== null && dragIdx !== dragOverIdx.current) {
            if (step === 1) {
                moveTask(dragIdx, dragOverIdx.current);
            } else if (step >= 4) {
                moveSelectedTask(dragIdx, dragOverIdx.current);
            }
        }
        setDragIdx(null); dragOverIdx.current = null;
    };

    const toggleSel = (i) => {
        if (selected.includes(i)) setSelected(selected.filter(x => x !== i));
        else if (selected.length < 3) setSelected([...selected, i]);
    };

    const goNext = () => {
        if (filledN <= 3) { setSelected(filled.map(x => x.i)); setStep(3); }
        else { setSelected([]); setStep(2); }
    };

    const goBackToEdit = () => {
        setStep(1); setSelected([]); setRank(null);
        setDeepOpen({}); setFirstSteps({}); setTricks({});
    };

    const selRank = RANKS.find(r => r.id === rank);

    const titleGrad = { background: "linear-gradient(135deg,#b0a000,#d4c400,#f0e850)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" };

    if (!loaded) {
        return (
            <div style={Z.wrap}>
                <div style={Z.box}>
                    <div style={{ textAlign: "center", padding: "60px 20px", color: "#64748b" }}>
                        読み込み中...
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={Z.wrap}>
            <div style={Z.box}>
                <header style={Z.hdr}>
                    <div style={Z.hdrTop}>
                        <div>
                            <div style={Z.brand}>まちのAI屋さん・みつけん</div>
                            <h1 style={Z.ttl}>今日も<span style={titleGrad}>S++</span>ランク！</h1>
                        </div>
                        <button style={Z.hBtn} onClick={() => setShowHist(!showHist)}>
                            {showHist ? "✕" : "📋"}
                        </button>
                    </div>
                    <div style={Z.date}>{dateStr}</div>
                    {rank && step >= 4 && (
                        <div style={{
                            ...Z.badge,
                            background: selRank.grad,
                            color: selRank.textOnBg,
                        }}>
                            目標：{rank}ランク
                        </div>
                    )}
                </header>

                {showHist ? <Hist entries={histEntries} /> : <>
                    {step >= 1 && (
                        <section style={Z.sec}>
                            <Hd n="1" t="今日やりたいこと" />
                            <p style={Z.hint}>思いつくまま書き出そう</p>
                            <div style={Z.tList}>
                                {tasks.map((t, i) => (
                                    <div key={i}
                                        style={{
                                            ...Z.tRow,
                                            ...(step >= 2 && selected.includes(i) ? Z.tSel : {}),
                                            ...(step >= 2 && !selected.includes(i) ? Z.tDim : {}),
                                            cursor: step === 1 ? "grab" : "default",
                                            opacity: dragIdx === i ? 0.4 : 1,
                                            transition: "opacity 0.2s"
                                        }}>
                                        {step >= 2 && (
                                            <button style={{ ...Z.chk, ...(selected.includes(i) ? Z.chkOn : {}) }}
                                                onClick={() => step === 2 && toggleSel(i)}>
                                                {selected.includes(i) && "✓"}
                                            </button>
                                        )}
                                        <input style={{ ...Z.tIn, ...(step >= 2 && selected.includes(i) ? { fontWeight: 700 } : {}) }}
                                            value={t} onChange={e => upTask(i, e.target.value)}
                                            placeholder={`やりたいこと ${i + 1}`} readOnly={step > 2} />
                                        {step === 1 && tasks.length > 1 && (
                                            <button style={Z.rmBtn} onClick={() => rmTask(i)}>✕</button>
                                        )}
                                    </div>
                                ))}
                            </div>
                            {step === 1 && tasks.length < MAX_TASKS && (
                                <button style={Z.addBtn} onClick={addTask}>＋ 追加する</button>
                            )}
                            {step === 1 && (
                                <button style={{ ...Z.pri, ...(filledN < 1 ? Z.dis : {}) }} disabled={filledN < 1} onClick={goNext}>
                                    {filledN <= 3 ? "次へ → 満足度を決める" : "次へ → 3つ選ぶ"}
                                </button>
                            )}
                        </section>
                    )}

                    {step === 2 && (
                        <section style={Z.sec}>
                            <Hd n="2" t="今日やる3つを選ぶ" />
                            <p style={Z.hint}>上のリストから3つタップ（{selected.length}/3）</p>
                            <div style={Z.row}>
                                <button style={Z.back} onClick={() => { setStep(1); setSelected([]); }}>← 戻る</button>
                                <button style={{ ...Z.pri, flex: 1, ...(selected.length < 1 ? Z.dis : {}) }}
                                    disabled={selected.length < 1} onClick={() => setStep(3)}>
                                    次へ → 満足度を決める
                                </button>
                            </div>
                        </section>
                    )}

                    {step >= 3 && (
                        <section style={Z.sec}>
                            <Hd n={filledN <= 3 ? "2" : "3"} t={rank ? "今日の目標" : "達成したら満足度は？"} />
                            <div style={Z.rGrid}>
                                {RANKS.map(r => {
                                    const isSel = rank === r.id;
                                    return (
                                        <button key={r.id} style={{
                                            ...Z.rBtn,
                                            border: isSel ? "none" : `2px solid ${r.border}`,
                                            background: isSel ? r.grad : r.bg,
                                            color: isSel ? r.textOnBg : r.color,
                                            transform: isSel ? "scale(1.05)" : "scale(1)",
                                        }} onClick={() => { setRank(r.id); if (step === 3) setStep(4); }}>
                                            <span style={Z.rLbl}>{r.label}</span>
                                            <span style={Z.rSub}>ランク</span>
                                        </button>
                                    );
                                })}
                            </div>
                            {step === 3 && (
                                <button style={Z.back} onClick={() => setStep(filledN <= 3 ? 1 : 2)}>← 戻る</button>
                            )}
                        </section>
                    )}

                    {step >= 4 && rank && (
                        <section style={Z.sec}>
                            <div style={{ ...Z.card, borderColor: selRank.border }}>
                                <div style={Z.cardTtl}>🎯 今日のプラン</div>
                                <div style={Z.sList}>
                                    {selected.map((si, idx) => (
                                        <div key={si}
                                            draggable
                                            onDragStart={() => handleDragStart(idx)}
                                            onDragOver={(e) => handleDragOver(e, idx)}
                                            onDrop={handleDrop}
                                            onDragEnd={() => { setDragIdx(null); dragOverIdx.current = null; }}
                                            style={{
                                                cursor: "move",
                                                opacity: dragIdx === idx ? 0.4 : 1,
                                                transition: "opacity 0.2s"
                                            }}>
                                            <div style={Z.sItem}>
                                                <span style={{ ...Z.sNum, background: selRank.grad, color: selRank.textOnBg }}>{idx + 1}</span>
                                                <span style={Z.sTxt}>{tasks[si]}</span>
                                                <button style={{ ...Z.expBtn, ...(deepOpen[si] ? Z.expOn : {}) }}
                                                    onClick={() => setDeepOpen(p => ({ ...p, [si]: !p[si] }))}>
                                                    {deepOpen[si] ? "−" : "＋"}
                                                </button>
                                            </div>
                                            {deepOpen[si] && (
                                                <div style={Z.deep}>
                                                    <div style={Z.dFld}>
                                                        <label style={Z.dLbl}>⏱ 最初の1分でやること</label>
                                                        <input style={Z.dIn} value={firstSteps[si] || ""}
                                                            onChange={e => setFirstSteps(p => ({ ...p, [si]: e.target.value }))}
                                                            placeholder="例：ファイルを開く、件名だけ書く…" />
                                                    </div>
                                                    <div style={{ ...Z.dFld, marginBottom: 0 }}>
                                                        <label style={Z.dLbl}>💡 やるための工夫</label>
                                                        <input style={Z.dIn} value={tricks[si] || ""}
                                                            onChange={e => setTricks(p => ({ ...p, [si]: e.target.value }))}
                                                            placeholder="例：カフェで10時から、音楽かけて…" />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <div style={Z.cardBottom}>
                                    <span style={{ ...Z.cardBadge, background: selRank.grad, color: selRank.textOnBg }}>
                                        達成 → {rank}ランク ✨
                                    </span>
                                </div>
                            </div>
                            <button style={Z.editBtn} onClick={goBackToEdit}>
                                ✏️ やりたいこと更新
                            </button>
                        </section>
                    )}
                </>}
            </div>
        </div>
    );
}

function Hd({ n, t }) {
    return <div style={Z.shdr}><span style={Z.sBdg}>{n}</span><h2 style={Z.sTtl}>{t}</h2></div>;
}

function Hist({ entries }) {
    if (!entries.length) return <div style={{ ...Z.sec, textAlign: "center", padding: "40px 0" }}><p style={Z.hint}>まだ履歴がありません</p></div>;
    return (
        <div style={Z.sec}>
            <h2 style={{ ...Z.sTtl, marginBottom: 14 }}>📋 これまでの記録</h2>
            {entries.map(e => {
                const r = RANKS.find(r => r.id === e.rank);
                const d = e.date.split("-");
                return (
                    <div key={e.date} style={{ ...Z.hCard, borderLeftColor: r?.color || "#ccc" }}>
                        <div style={Z.hDate}>{d[1]}/{d[2]}</div>
                        <div style={{ ...Z.hRank, color: r?.color || "#999" }}>{e.rank || "−"}</div>
                        <div style={Z.hTasks}>
                            {(e.selected || []).map(si => <div key={si} style={Z.hTask}>• {e.tasks?.[si]}</div>)}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

const ac = "#38bdf8", acL = "#e0f2fe", cBg = "#fff", tM = "#1e293b", tS = "#64748b", bL = "#e2e8f0";

const Z = {
    wrap: { minHeight: "100vh", background: "linear-gradient(180deg,#f8fbff 0%,#eef6ff 100%)", fontFamily: "'Noto Sans JP','Hiragino Sans',-apple-system,sans-serif", display: "flex", justifyContent: "center" },
    box: { width: "100%", maxWidth: 480, padding: "0 16px 80px" },
    hdr: { paddingTop: 36, paddingBottom: 16, borderBottom: `1px solid ${bL}`, marginBottom: 4 },
    hdrTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
    brand: { fontSize: 12, fontWeight: 600, color: ac, letterSpacing: "0.04em", marginBottom: 2 },
    ttl: { fontSize: 24, fontWeight: 800, color: tM, margin: 0, lineHeight: 1.3 },
    hBtn: { background: acL, border: "none", borderRadius: 10, width: 38, height: 38, fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: tM },
    date: { fontSize: 13, color: tS, marginTop: 6, fontWeight: 500 },
    badge: { display: "inline-block", marginTop: 10, padding: "5px 16px", borderRadius: 20, fontSize: 13, fontWeight: 700, letterSpacing: "0.02em" },
    sec: { padding: "16px 0" },
    shdr: { display: "flex", alignItems: "center", gap: 10, marginBottom: 4 },
    sBdg: { width: 26, height: 26, borderRadius: "50%", background: ac, color: "#fff", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
    sTtl: { fontSize: 16, fontWeight: 700, color: tM, margin: 0 },
    hint: { fontSize: 12, color: tS, margin: "2px 0 12px", paddingLeft: 36 },
    tList: { display: "flex", flexDirection: "column", gap: 6 },
    tRow: { display: "flex", alignItems: "center", gap: 6, background: cBg, borderRadius: 12, padding: "3px 8px", border: `1.5px solid ${bL}`, transition: "all 0.2s" },
    tSel: { borderColor: ac, background: acL },
    tDim: { opacity: 0.4 },
    reorderBtns: { display: "flex", flexDirection: "column", gap: 0, flexShrink: 0 },
    arrowBtn: { background: "none", border: "none", color: tS, fontSize: 10, cursor: "pointer", padding: "1px 4px", lineHeight: 1 },
    chk: { width: 26, height: 26, borderRadius: 7, border: `2px solid ${bL}`, background: "#fff", color: ac, fontSize: 15, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.15s" },
    chkOn: { background: ac, borderColor: ac, color: "#fff" },
    tIn: { flex: 1, background: "transparent", border: "none", color: tM, fontSize: 15, padding: "10px 4px", outline: "none", fontFamily: "inherit" },
    rmBtn: { background: "none", border: "none", color: "#94a3b8", fontSize: 15, cursor: "pointer", padding: "4px 8px" },
    addBtn: { width: "100%", padding: "11px", marginTop: 6, background: "transparent", border: `1.5px dashed ${bL}`, borderRadius: 12, color: tS, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" },
    pri: { width: "100%", padding: "13px", marginTop: 14, background: ac, border: "none", borderRadius: 12, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s" },
    dis: { opacity: 0.35, cursor: "not-allowed" },
    back: { padding: "10px 18px", background: "#fff", border: `1px solid ${bL}`, borderRadius: 10, color: tS, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" },
    row: { display: "flex", gap: 10, marginTop: 8 },
    rGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, margin: "8px 0 12px" },
    rBtn: { padding: "16px 10px", borderRadius: 14, border: "2px solid", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 1, transition: "all 0.2s", fontFamily: "inherit" },
    rLbl: { fontSize: 22, fontWeight: 800 },
    rSub: { fontSize: 11, fontWeight: 600, opacity: 0.75 },
    card: { borderRadius: 16, border: "1.5px solid", padding: "18px 14px", marginBottom: 12, background: cBg },
    cardTtl: { fontSize: 15, fontWeight: 700, color: tM, marginBottom: 12 },
    sList: { display: "flex", flexDirection: "column", gap: 8 },
    sItem: { display: "flex", alignItems: "center", gap: 8 },
    sNum: { width: 24, height: 24, borderRadius: 7, fontSize: 12, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
    sTxt: { color: tM, fontSize: 14, fontWeight: 600, flex: 1 },
    expBtn: { width: 30, height: 30, borderRadius: 8, border: `1.5px solid ${bL}`, background: "#fff", color: tS, fontSize: 18, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.15s", lineHeight: 1 },
    expOn: { background: acL, borderColor: ac, color: ac },
    deep: { marginLeft: 32, marginTop: 6, marginBottom: 6, padding: "10px 12px", background: "#f1f8ff", borderRadius: 10, border: `1px solid ${acL}` },
    dFld: { marginBottom: 8 },
    dLbl: { display: "block", fontSize: 11, color: tS, fontWeight: 600, marginBottom: 4 },
    dIn: { width: "100%", padding: "8px 10px", background: "#fff", border: `1px solid ${bL}`, borderRadius: 8, color: tM, fontSize: 13, outline: "none", fontFamily: "inherit", boxSizing: "border-box" },
    cardBottom: { marginTop: 14, paddingTop: 12, borderTop: `1px solid ${bL}`, textAlign: "center" },
    cardBadge: { display: "inline-block", padding: "6px 20px", borderRadius: 20, fontSize: 14, fontWeight: 700 },
    editBtn: { width: "100%", padding: "13px", background: ac, border: "none", borderRadius: 12, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s" },
    hCard: { background: cBg, borderRadius: 10, padding: "10px 12px", marginBottom: 6, borderLeft: "3px solid", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", border: `1px solid ${bL}`, borderLeftWidth: 3 },
    hDate: { fontSize: 13, fontWeight: 700, color: tS, minWidth: 36 },
    hRank: { fontSize: 15, fontWeight: 800, minWidth: 36 },
    hTasks: { flex: 1, minWidth: 140 },
    hTask: { fontSize: 12, color: tS, lineHeight: 1.6 },
};
