import { useState, useEffect, useRef, useCallback } from "react";
import { SpeedInsights } from "@vercel/speed-insights/react";

// ─── AdSense config ──────────────────────────────────────────────────────────
const ADSENSE = {
  client: "ca-pub-XXXXXXXXXXXXXXXX",
  enabled: false,
  slots: {
    topLeaderboard: "0000000001",
    inContent: "0000000002",
    sidebar: "0000000003",
    bottomAnchor: "0000000004",
  },
};

// ─── i18n ────────────────────────────────────────────────────────────────────
const T = {
  en: {
    siteTagline: "Essential Arabic text utilities — free, fast, no signup.",
    nav: ["Tashkeel", "Font Previewer", "Word Counter", "Number Converter", "RTL Fixer", "Hijri Date"],
    heroTitle: "Arabic Text Tools",
    tools: {
      wordCounter: {
        title: "Word Counter",
        desc: "Count words, characters, and sentences in Arabic text.",
        placeholder: "Paste or type Arabic text here…",
        words: "Words",
        chars: "Chars",
        charsAll: "Chars (incl. spaces)",
        sentences: "Sentences",
        unique: "Unique Words",
        clear: "Clear",
        copyStats: "Copy Stats",
        copied: "Copied!",
      },
      tashkeel: {
        title: "Tashkeel Tool",
        desc: "Remove and count tashkeel (diacritics) in Arabic text.",
        placeholder: "أَدْخِلْ نَصًّا عَرَبِيًّا هُنَا…",
        remove: "Remove Tashkeel", clear: "Clear",
        result: "Result", copied: "Copied!", copy: "Copy",
        removedCount: n => `Removed ${n} diacritic${n === 1 ? "" : "s"}`,
      },
      numbers: {
        title: "Number Converter",
        desc: "Convert between Arabic-Indic (١٢٣) and Western (123) numerals.",
        toWestern: "→ Western (123)", toArabic: "→ Arabic-Indic (١٢٣)",
        input: "Input", output: "Output",
        placeholder: "Type numbers here…", copy: "Copy", copied: "Copied!",
      },
      rtl: {
        title: "RTL Text Fixer",
        desc: "Fix mixed Arabic/English direction line-by-line and copy text that keeps the right direction when pasted.",
        placeholder: "Paste mixed Arabic/English text…",
        copy: "Copy fixed text", copied: "Copied!",
        preview: "Preview",
      },
      font: {
        title: "Arabic Font Previewer",
        desc: "Preview your Arabic text in different typefaces.",
        placeholder: "اكتب نصًا عربيًا للمعاينة…",
        size: "Size", fonts: "Font",
      },
      hijri: {
        title: "Hijri Date Converter",
        desc: "Convert Gregorian dates to the Hijri (Umm al-Qura) calendar.",
        gregorian: "Gregorian Date",
      },
    },
    adLabel: "Advertisement",
  },
  ar: {
    siteTagline: "أدوات نصية عربية مجانية وسريعة — بدون تسجيل.",
    nav: ["التشكيل", "معاينة الخطوط", "عداد الكلمات", "تحويل الأرقام", "إصلاح الاتجاه", "التاريخ الهجري"],
    heroTitle: "أدوات النص العربي",
    tools: {
      wordCounter: {
        title: "عداد الكلمات",
        desc: "احسب الكلمات والأحرف والجمل في النص العربي.",
        placeholder: "الصق أو اكتب نصًا عربيًا هنا…",
        words: "كلمات",
        chars: "أحرف",
        charsAll: "أحرف (مع مسافات)",
        sentences: "جمل",
        unique: "كلمات فريدة",
        clear: "مسح",
        copyStats: "نسخ الإحصاء",
        copied: "تم النسخ!",
      },
      tashkeel: {
        title: "أداة التشكيل",
        desc: "إزالة التشكيل من النص العربي وحساب عدده.",
        placeholder: "أَدْخِلْ نَصًّا عَرَبِيًّا هُنَا…",
        remove: "إزالة التشكيل", clear: "مسح",
        result: "النتيجة", copied: "تم النسخ!", copy: "نسخ",
        removedCount: n => `تمت إزالة ${n} علامة تشكيل`,
      },
      numbers: {
        title: "محول الأرقام",
        desc: "تحويل بين الأرقام العربية (١٢٣) والغربية (123).",
        toWestern: "→ غربي (123)", toArabic: "→ عربي (١٢٣)",
        input: "المدخل", output: "المخرج",
        placeholder: "اكتب أرقامًا هنا…", copy: "نسخ", copied: "تم النسخ!",
      },
      rtl: {
        title: "إصلاح اتجاه النص",
        desc: "إصلاح اتجاه النص المختلط سطرًا بسطر، ونسخ نص يحافظ على الاتجاه الصحيح عند اللصق.",
        placeholder: "الصق نصًا مختلطًا عربيًا/إنجليزيًا…",
        copy: "نسخ النص المُصحَّح", copied: "تم النسخ!",
        preview: "معاينة",
      },
      font: {
        title: "معاين الخطوط العربية",
        desc: "معاينة النص العربي بخطوط مختلفة.",
        placeholder: "اكتب نصًا عربيًا للمعاينة…",
        size: "الحجم", fonts: "الخط",
      },
      hijri: {
        title: "محول التاريخ الهجري",
        desc: "تحويل التاريخ الميلادي إلى التقويم الهجري (أم القرى).",
        gregorian: "التاريخ الميلادي",
      },
    },
    adLabel: "إعلان",
  },
};

const HIJRI_MONTHS = [
  "محرم","صفر","ربيع الأول","ربيع الثاني",
  "جمادى الأولى","جمادى الثانية","رجب","شعبان",
  "رمضان","شوال","ذو القعدة","ذو الحجة",
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
const ARABIC_INDIC = "٠١٢٣٤٥٦٧٨٩";
const tashkeelRegex = /[ؐ-ًؚ-ٰٟ]/g;
const removeTashkeel = s => s.replace(tashkeelRegex, "");
const countTashkeel  = s => (s.match(tashkeelRegex) || []).length;
// Unicode range /[٠-٩]/ is safer than a hardcoded string + indexOf
const toWesternNumerals = s => s.replace(/[٠-٩]/g, d => ARABIC_INDIC.indexOf(d).toString());
const toArabicNumerals  = s => s.replace(/[0-9]/g, d => ARABIC_INDIC[+d]);

function countWords(text) {
  if (!text.trim()) return { words: 0, chars: 0, charsAll: 0, sentences: 0, unique: 0 };
  const words = text.trim().split(/\s+/).filter(Boolean);
  const sentences = text.split(/[.!?؟\n]+/).filter(s => s.trim());
  // Strip tashkeel before uniqueness check so "كتب" and "كَتَبَ" count as one word
  const unique = new Set(words.map(w => removeTashkeel(w))).size;
  return {
    words: words.length,
    chars: text.replace(/\s/g, "").length,
    charsAll: text.length,
    sentences: sentences.length,
    unique,
  };
}

// Accurate Hijri conversion via browser's built-in Umm al-Qura calendar
function gregorianToHijri(dateStr) {
  const d = new Date(dateStr + "T12:00:00");
  if (isNaN(d.getTime())) return null;
  try {
    const parts = new Intl.DateTimeFormat("en-US-u-ca-islamic-umalqura", {
      day: "numeric", month: "numeric", year: "numeric",
    }).formatToParts(d);
    const get = type => parts.find(p => p.type === type)?.value;
    const month = parseInt(get("month"), 10);
    const day   = parseInt(get("day"), 10);
    const year  = parseInt(get("year"), 10);
    if (!month || !day || !year) return null;
    return { day, month, year, monthName: HIJRI_MONTHS[month - 1] };
  } catch {
    return null;
  }
}

// Detect dominant direction of a single line (returns true=RTL, false=LTR, null=neutral)
function lineIsRTL(line) {
  const letters = line.replace(/[\s\d.,!?@#%&*()_+\-=[\]{};:'"<>/\\|`~]/g, "");
  if (!letters.length) return null;
  const arabic = (letters.match(/[؀-ۿݐ-ݿ]/g) || []).length;
  return arabic >= letters.length / 2;
}

// ─── Reusable copy hook ──────────────────────────────────────────────────────
function useCopy() {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef(null);
  const copy = useCallback(text => {
    if (!text) return;
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopied(true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCopied(false), 2000);
  }, []);
  return [copied, copy];
}

// ─── Tools ───────────────────────────────────────────────────────────────────
function WordCounter({ t }) {
  const [text, setText] = useState("");
  const [copied, copy] = useCopy();
  const stats = countWords(text);

  const statsList = [
    ["words",    "#7c5cfc"],
    ["chars",    "#06b6d4"],
    ["charsAll", "#0ea5e9"],
    ["sentences","#34d399"],
    ["unique",   "#fbbf24"],
  ];

  const statsText = statsList
    .map(([k]) => `${t[k]}: ${stats[k]}`)
    .join("\n");

  return (
    <div className="tool-card">
      <h2>{t.title}</h2>
      <p className="tool-desc">{t.desc}</p>
      <textarea dir="rtl" placeholder={t.placeholder} value={text} onChange={e => setText(e.target.value)} rows={6} />
      <div className="stats-grid">
        {statsList.map(([k, c]) => (
          <div key={k} className="stat-box" style={{ borderTopColor: c }}>
            <span className="stat-num" style={{ color: c }}>{stats[k]}</span>
            <span className="stat-label">{t[k]}</span>
          </div>
        ))}
      </div>
      <div className="btn-row">
        <button className="btn-secondary" onClick={() => setText("")}>{t.clear}</button>
        {text && (
          <button className="btn-copy" onClick={() => copy(statsText)}>
            {copied ? t.copied : t.copyStats}
          </button>
        )}
      </div>
    </div>
  );
}

function TashkeelTool({ t }) {
  const [input, setInput] = useState("أَهْلًا وَسَهْلًا بِكَ فِي أَدَوَاتِ اللُّغَةِ الْعَرَبِيَّةِ");
  const [result, setResult] = useState(null);
  const [copied, copy] = useCopy();

  const handleRemove = () => setResult({ text: removeTashkeel(input), count: countTashkeel(input) });
  const handleClear  = () => { setInput(""); setResult(null); };

  return (
    <div className="tool-card">
      <h2>{t.title}</h2>
      <p className="tool-desc">{t.desc}</p>
      <textarea dir="rtl" placeholder={t.placeholder} value={input} onChange={e => setInput(e.target.value)} rows={4} />
      <div className="btn-row">
        <button className="btn-primary" onClick={handleRemove}>{t.remove}</button>
        <button className="btn-secondary" onClick={handleClear}>{t.clear}</button>
      </div>
      {result && (
        <div className="result-box">
          <div className="result-header">
            <span>{t.result} &middot; {t.removedCount(result.count)}</span>
            <button className="btn-copy" onClick={() => copy(result.text)}>{copied ? t.copied : t.copy}</button>
          </div>
          <p dir="rtl" style={{ fontSize: 18, lineHeight: 2 }}>{result.text || "—"}</p>
        </div>
      )}
    </div>
  );
}

function NumberConverter({ t }) {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState("toWestern");
  const [copied, copy] = useCopy();

  const output = !input ? "" : mode === "toWestern" ? toWesternNumerals(input) : toArabicNumerals(input);

  return (
    <div className="tool-card">
      <h2>{t.title}</h2>
      <p className="tool-desc">{t.desc}</p>
      <div className="two-col">
        <div>
          <label>{t.input}</label>
          <textarea dir="auto" placeholder={t.placeholder} value={input} onChange={e => setInput(e.target.value)} rows={4} />
        </div>
        <div>
          <label className="output-label">
            {t.output}
            {output && (
              <button className="btn-copy" onClick={() => copy(output)}>{copied ? t.copied : t.copy}</button>
            )}
          </label>
          <textarea dir="auto" value={output} readOnly rows={4} style={{ background: "var(--surface)" }} />
        </div>
      </div>
      <div className="btn-row">
        <button className={`btn-toggle${mode === "toWestern" ? " active" : ""}`} onClick={() => setMode("toWestern")}>{t.toWestern}</button>
        <button className={`btn-toggle${mode === "toArabic"  ? " active" : ""}`} onClick={() => setMode("toArabic")}>{t.toArabic}</button>
      </div>
    </div>
  );
}

function RTLFixer({ t }) {
  const [input, setInput] = useState("");
  const [copied, copy] = useCopy();

  const lines = input.split("\n").map(line => {
    const rtl = lineIsRTL(line);
    return { text: line, dir: rtl === null ? "ltr" : rtl ? "rtl" : "ltr", neutral: rtl === null };
  });

  // Prepend Unicode directional marks so the text pastes with correct direction
  const fixedText = lines
    .map(l => (l.neutral ? l.text : (l.dir === "rtl" ? "‏" : "‎") + l.text))
    .join("\n");

  return (
    <div className="tool-card">
      <h2>{t.title}</h2>
      <p className="tool-desc">{t.desc}</p>
      <textarea dir="auto" placeholder={t.placeholder} value={input} onChange={e => setInput(e.target.value)} rows={5} />
      {input && (
        <div className="result-box">
          <div className="result-header">
            <span>{t.preview}</span>
            <button className="btn-copy" onClick={() => copy(fixedText)}>{copied ? t.copied : t.copy}</button>
          </div>
          {lines.map((line, i) => (
            <p
              key={i}
              dir={line.dir}
              style={{
                margin: "4px 0", padding: "6px 10px", borderRadius: 6, fontSize: 15,
                background: line.neutral ? "var(--surface)" : line.dir === "rtl" ? "#7c5cfc18" : "#06b6d418",
              }}
            >
              {line.text || " "}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

const ARABIC_FONTS = [
  { name: "Amiri",            value: "'Amiri', serif" },
  { name: "Cairo",            value: "'Cairo', sans-serif" },
  { name: "Tajawal",          value: "'Tajawal', sans-serif" },
  { name: "Scheherazade New", value: "'Scheherazade New', serif" },
  { name: "Lateef",           value: "'Lateef', serif" },
];

function FontPreviewer({ t }) {
  const [text, setText] = useState("بِسْمِ اللهِ الرَّحْمَنِ الرَّحِيمِ");
  const [size, setSize] = useState(28);
  const [font, setFont] = useState(ARABIC_FONTS[1].value);
  return (
    <div className="tool-card">
      <h2>{t.title}</h2>
      <p className="tool-desc">{t.desc}</p>
      <textarea dir="rtl" value={text} onChange={e => setText(e.target.value)} rows={2} placeholder={t.placeholder} />
      <div className="controls-row">
        <div className="control-group">
          <label>{t.fonts}</label>
          <select value={font} onChange={e => setFont(e.target.value)}>
            {ARABIC_FONTS.map(f => <option key={f.value} value={f.value}>{f.name}</option>)}
          </select>
        </div>
        <div className="control-group">
          <label>{t.size}: {size}px</label>
          <input type="range" min={14} max={72} value={size} onChange={e => setSize(+e.target.value)} />
        </div>
      </div>
      <div className="font-preview" style={{ fontFamily: font, fontSize: size, lineHeight: 1.8 }}>
        {text || "…"}
      </div>
      <div className="font-swatches">
        {ARABIC_FONTS.map(f => (
          <div
            key={f.value}
            className={`font-swatch${font === f.value ? " active" : ""}`}
            onClick={() => setFont(f.value)}
            style={{ fontFamily: f.value }}
          >
            {f.name}
          </div>
        ))}
      </div>
    </div>
  );
}

function HijriConverter({ t }) {
  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(today);
  // Live — result updates as the date input changes, no button needed
  const result = gregorianToHijri(date);
  return (
    <div className="tool-card">
      <h2>{t.title}</h2>
      <p className="tool-desc">{t.desc}</p>
      <div className="date-row">
        <div className="control-group">
          <label>{t.gregorian}</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} />
        </div>
      </div>
      {result && (
        <div className="hijri-result">
          <div className="hijri-day">{result.day}</div>
          <div className="hijri-month">{result.monthName}</div>
          <div className="hijri-year">{result.year} هـ</div>
          <div className="hijri-full">{result.day} {result.monthName} {result.year} هـ</div>
        </div>
      )}
    </div>
  );
}

// ─── Ad slot ─────────────────────────────────────────────────────────────────
function AdSlot({ slot, label, size, format = "auto", responsive = true }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ADSENSE.enabled && typeof window !== "undefined") {
      try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) { /* noop */ }
    }
  }, []);

  if (ADSENSE.enabled) {
    return (
      <ins
        ref={ref}
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={ADSENSE.client}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive ? "true" : "false"}
      />
    );
  }
  return (
    <div className="ad-slot" role="complementary" aria-label="advertisement">
      <span className="ad-tag">{label}</span>
      <span className="ad-dim">{size}</span>
    </div>
  );
}

// ─── App ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [lang, setLang] = useState("ar");
  const [active, setActive] = useState(0);
  const [anchorClosed, setAnchorClosed] = useState(false);
  const t = T[lang];

  const tools = [
    <TashkeelTool    key="tk"  t={t.tools.tashkeel} />,
    <FontPreviewer   key="fp"  t={t.tools.font} />,
    <WordCounter     key="wc"  t={t.tools.wordCounter} />,
    <NumberConverter key="nc"  t={t.tools.numbers} />,
    <RTLFixer        key="rtl" t={t.tools.rtl} />,
    <HijriConverter  key="hj"  t={t.tools.hijri} />,
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Cairo:wght@400;600;700&family=Amiri:ital,wght@0,400;0,700;1,400&family=Tajawal:wght@400;500;700&family=Scheherazade+New:wght@400;700&family=Lateef&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --bg:#0f0f13; --surface:#17171d; --surface2:#1e1e27; --border:#2a2a35;
          --accent:#7c5cfc; --accent2:#c084fc; --text:#e8e8f0; --muted:#6b6b80; --radius:12px;
          --max-w:860px;
        }
        body { font-family:'Inter','Cairo',sans-serif; background:var(--bg); color:var(--text); min-height:100vh; }

        /* ── Header — inner wrapper aligns with the content layout ── */
        .header { background:var(--surface); border-bottom:1px solid var(--border); padding:0 16px; position:sticky; top:0; z-index:100; }
        .header-inner { max-width:var(--max-w); margin:0 auto; height:60px; display:flex; align-items:center; gap:16px; padding:0 8px; }
        .site-logo { font-family:'Cairo',sans-serif; font-size:20px; font-weight:700;
          background:linear-gradient(135deg,var(--accent),var(--accent2));
          -webkit-background-clip:text; -webkit-text-fill-color:transparent; flex-shrink:0; }
        .lang-toggle { margin-inline-start:auto; background:var(--surface2); border:1px solid var(--border);
          color:var(--text); border-radius:8px; padding:6px 14px; cursor:pointer; font-size:13px; transition:border-color .2s; }
        .lang-toggle:hover { border-color:var(--accent); }

        /* ── Hero — constrained to layout width ── */
        .hero { text-align:center; padding:40px 24px 20px; }
        .hero-inner { max-width:600px; margin:0 auto; }
        .hero h1 { font-family:'Cairo',sans-serif; font-size:clamp(22px,5vw,36px); font-weight:700; margin-bottom:8px; }
        .hero p { color:var(--muted); font-size:15px; }

        .tab-nav { display:flex; gap:4px; overflow-x:auto; padding:0; margin:0 0 16px; scrollbar-width:none; }
        .tab-nav::-webkit-scrollbar { display:none; }
        .tab-btn { white-space:nowrap; padding:8px 16px; border-radius:8px; border:1px solid transparent;
          background:transparent; color:var(--muted); cursor:pointer; font-size:13px; font-family:inherit; transition:all .15s; }
        .tab-btn:hover { color:var(--text); background:var(--surface2); }
        .tab-btn.active { background:var(--accent); color:#fff; border-color:var(--accent); }

        /* ── Layout: content is always centered; sidebar floats outside ── */
        .layout-outer { position:relative; padding:16px 16px 120px; }
        .content-col { max-width:860px; margin:0 auto; }
        .sidebar { display:none; width:300px; position:absolute; top:0; left:calc(50% + 430px + 24px); }
        @media(min-width:1220px){ .sidebar { display:block; position:sticky; top:76px; margin-top:16px; } }

        .tool-card { background:var(--surface); border:1px solid var(--border); border-radius:var(--radius); padding:24px; }
        .tool-card h2 { font-family:'Cairo',sans-serif; font-size:20px; font-weight:700; margin-bottom:4px; }
        .tool-desc { color:var(--muted); font-size:13px; margin-bottom:16px; line-height:1.6; }
        textarea, input[type="date"], select { width:100%; background:var(--surface2); border:1px solid var(--border);
          border-radius:8px; color:var(--text); font-size:16px; padding:10px 14px; font-family:'Cairo','Inter',sans-serif;
          resize:vertical; outline:none; transition:border-color .2s; }
        textarea:focus, input:focus, select:focus { border-color:var(--accent); }
        select { cursor:pointer; }
        input[type="range"] { padding:0; border:none; background:transparent; cursor:pointer; width:100%; accent-color:var(--accent); }
        .btn-primary { background:var(--accent); color:#fff; border:none; border-radius:8px; padding:9px 20px;
          cursor:pointer; font-size:14px; font-family:inherit; transition:opacity .15s; }
        .btn-primary:hover { opacity:.88; }
        .btn-secondary { background:var(--surface2); color:var(--text); border:1px solid var(--border); border-radius:8px;
          padding:9px 20px; cursor:pointer; font-size:14px; font-family:inherit; transition:border-color .2s; }
        .btn-secondary:hover { border-color:var(--accent); }
        .btn-toggle { background:var(--surface2); color:var(--muted); border:1px solid var(--border); border-radius:8px;
          padding:9px 20px; cursor:pointer; font-size:14px; font-family:inherit; transition:all .15s; }
        .btn-toggle:hover { border-color:var(--accent); color:var(--text); }
        .btn-toggle.active { background:var(--accent); color:#fff; border-color:var(--accent); }
        .btn-copy { background:transparent; color:var(--accent); border:1px solid var(--accent); border-radius:6px;
          padding:3px 12px; cursor:pointer; font-size:12px; font-family:inherit; transition:background .15s; }
        .btn-copy:hover { background:#7c5cfc15; }
        .btn-row { display:flex; gap:8px; margin:12px 0 0; flex-wrap:wrap; align-items:center; }

        /* 5-column stats grid */
        .stats-grid { display:grid; grid-template-columns:repeat(5,1fr); gap:10px; margin:16px 0; }
        @media(max-width:640px){ .stats-grid { grid-template-columns:repeat(3,1fr); } }
        @media(max-width:400px){ .stats-grid { grid-template-columns:repeat(2,1fr); } }
        .stat-box { background:var(--surface2); border:1px solid var(--border); border-radius:10px; padding:14px 10px;
          text-align:center; border-top:3px solid; }
        .stat-num { display:block; font-size:28px; font-weight:700; }
        .stat-label { font-size:11px; color:var(--muted); text-transform:uppercase; letter-spacing:1px; }

        .result-box { background:var(--surface2); border:1px solid var(--border); border-radius:10px; padding:16px; margin-top:14px; }
        .result-header { display:flex; justify-content:space-between; align-items:center; gap:12px; margin-bottom:10px;
          font-size:12px; color:var(--muted); text-transform:uppercase; letter-spacing:.5px; flex-wrap:wrap; }
        .two-col { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:12px; }
        @media(max-width:500px){ .two-col { grid-template-columns:1fr; } }
        label { display:block; font-size:12px; color:var(--muted); margin-bottom:6px; text-transform:uppercase; letter-spacing:.5px; }
        .output-label { display:flex; justify-content:space-between; align-items:center; }
        .controls-row { display:flex; gap:16px; margin:12px 0; flex-wrap:wrap; }
        .control-group { flex:1; min-width:160px; }
        .font-preview { background:var(--surface2); border:1px solid var(--border); border-radius:10px; padding:24px;
          text-align:center; margin:16px 0; direction:rtl; min-height:80px; word-break:break-word; }
        .font-swatches { display:flex; gap:8px; flex-wrap:wrap; }
        .font-swatch { padding:6px 14px; border-radius:8px; border:1px solid var(--border); cursor:pointer; font-size:14px;
          color:var(--muted); transition:all .15s; direction:rtl; }
        .font-swatch:hover { border-color:var(--accent); color:var(--text); }
        .font-swatch.active { border-color:var(--accent); color:var(--accent); background:#7c5cfc15; }
        .date-row { display:flex; gap:12px; align-items:flex-end; margin-bottom:16px; flex-wrap:wrap; }
        .date-row .control-group { flex:1; min-width:160px; }
        .hijri-result { text-align:center; padding:28px; background:linear-gradient(135deg,#7c5cfc15,#c084fc10);
          border:1px solid var(--accent); border-radius:var(--radius); direction:rtl; }
        .hijri-day { font-size:56px; font-weight:700; color:var(--accent); line-height:1; }
        .hijri-month { font-size:22px; font-family:'Cairo',serif; margin:4px 0; }
        .hijri-year { font-size:16px; color:var(--muted); }
        .hijri-full { margin-top:12px; font-size:13px; color:var(--muted); border-top:1px solid var(--border); padding-top:12px; }
        .ad-slot { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:4px;
          background:repeating-linear-gradient(45deg,#15151b,#15151b 10px,#1a1a22 10px,#1a1a22 20px);
          border:1px dashed #33333f; border-radius:10px; padding:18px; min-height:90px; margin:16px 0;
          color:#52526a; text-align:center; }
        .ad-tag { font-size:10px; letter-spacing:3px; text-transform:uppercase; }
        .ad-dim { font-size:13px; font-weight:600; color:#6b6b80; font-family:'Inter',monospace; }
        .sidebar .ad-slot { min-height:600px; margin:0; }
        .ad-anchor { position:fixed; bottom:0; left:0; right:0; z-index:200;
          background:var(--surface); border-top:1px solid var(--border);
          display:flex; align-items:center; justify-content:center; padding:6px 40px 6px 12px; }
        .ad-anchor .ad-slot { min-height:50px; margin:0; width:100%; max-width:728px; padding:8px; }
        .ad-anchor-close { position:absolute; top:50%; transform:translateY(-50%); inset-inline-end:10px;
          width:26px; height:26px; border-radius:50%; border:1px solid var(--border);
          background:var(--surface2); color:var(--muted); cursor:pointer; font-size:16px; line-height:1;
          display:flex; align-items:center; justify-content:center; transition:all .15s; }
        .ad-anchor-close:hover { border-color:var(--accent); color:var(--text); }
      `}</style>

      {/* Header — inner wrapper centers content with the layout below */}
      <header className="header">
        <div className="header-inner">
          <div className="site-logo">أدوات · Arabic Tools</div>
          <button className="lang-toggle" onClick={() => setLang(l => l === "ar" ? "en" : "ar")}>
            {lang === "ar" ? "English" : "عربي"}
          </button>
        </div>
      </header>

      <div className="hero">
        <div className="hero-inner">
          <h1>{t.heroTitle}</h1>
          <p>{t.siteTagline}</p>
        </div>
      </div>

      <div className="layout-outer">
        <div className="content-col">
          <div className="tab-nav" dir={lang === "ar" ? "rtl" : "ltr"}>
            {t.nav.map((name, i) => (
              <button
                key={i}
                className={`tab-btn${active === i ? " active" : ""}`}
                onClick={() => setActive(i)}
              >
                {name}
              </button>
            ))}
          </div>

          <main dir={lang === "ar" ? "rtl" : "ltr"}>
            <AdSlot slot={ADSENSE.slots.topLeaderboard} label={t.adLabel} size="728×90" />
            {tools[active]}
            <AdSlot slot={ADSENSE.slots.inContent} label={t.adLabel} size="336×280" />
          </main>

          <footer style={{
            textAlign: "center", padding: "32px 0 8px",
            color: "var(--muted)", fontSize: 12, letterSpacing: "0.5px",
          }}>
            Arabic Tools · v1.1.0
          </footer>
        </div>

        <aside className="sidebar">
          <AdSlot slot={ADSENSE.slots.sidebar} label={t.adLabel} size="300×600" />
        </aside>
      </div>

      {!anchorClosed && (
        <div className="ad-anchor">
          <button className="ad-anchor-close" onClick={() => setAnchorClosed(true)} aria-label="Close ad">×</button>
          <AdSlot slot={ADSENSE.slots.bottomAnchor} label={t.adLabel} size="320×50" />
        </div>
      )}
      <SpeedInsights />
    </>
  );
}
