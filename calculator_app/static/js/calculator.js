// ── State ──────────────────────────────────────────────
const state = {
    display: '0',
    expression: '',
    operands: [],
    operator: null,
    awaitingSecond: false,
    justCalculated: false,
};

let currentMode = 'arithmetic';
let trigInput = '0';
let trigFn = 'sin';
let rootInput = '0';

// ── DOM refs ────────────────────────────────────────────
const resultEl    = document.getElementById('result');
const expressionEl = document.getElementById('expression');

// ── Display helpers ─────────────────────────────────────
function setResult(text, isError = false) {
    resultEl.textContent = text;
    resultEl.className = 'display-result';
    if (isError) { resultEl.classList.add('error'); return; }
    const len = String(text).length;
    if (len > 14) resultEl.classList.add('xsmall');
    else if (len > 9) resultEl.classList.add('small');
}

function setExpression(text) { expressionEl.textContent = text; }

function formatNum(n) {
    const s = String(n);
    if (s.length > 12) return parseFloat(n.toPrecision(8)).toString();
    return s;
}

// ── API call ────────────────────────────────────────────
async function api(body) {
    const res  = await fetch('/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    return res.json();
}

// ══════════════════════════════════════════════════════
//  ARITHMETIC MODE
// ══════════════════════════════════════════════════════
function arithHandleNum(digit) {
    if (state.justCalculated && digit !== '.') {
        state.display = digit === '.' ? '0.' : digit;
        state.justCalculated = false;
    } else if (state.awaitingSecond) {
        state.display = digit === '.' ? '0.' : digit;
        state.awaitingSecond = false;
    } else {
        if (digit === '.' && state.display.includes('.')) return;
        state.display = state.display === '0' && digit !== '.'
            ? digit
            : state.display + digit;
    }
    setResult(state.display);
}

function arithHandleOp(op) {
    const val = parseFloat(state.display);
    if (state.operator && !state.awaitingSecond && !state.justCalculated) {
        // chain: evaluate pending first
        arithEquals(true);
        state.operator = op;
        setExpression(formatNum(parseFloat(state.display)) + ' ' + opSymbol(op));
        state.awaitingSecond = true;
        return;
    }
    state.operands = [val];
    state.operator = op;
    state.awaitingSecond = true;
    state.justCalculated = false;
    setExpression(formatNum(val) + ' ' + opSymbol(op));
    highlightOp(op);
}

function opSymbol(op) {
    return { '+':'+', '-':'−', 'x':'×', '/':'÷' }[op] || op;
}

function highlightOp(op) {
    document.querySelectorAll('#mode-arithmetic .op').forEach(b => {
        b.classList.toggle('active-selected', b.dataset.op === op);
    });
}

async function arithEquals(chain = false) {
    if (!state.operator) return;
    const second = parseFloat(state.display);
    const first  = state.operands[0];
    const expr   = `${formatNum(first)} ${opSymbol(state.operator)} ${formatNum(second)} =`;
    if (!chain) setExpression(expr);

    const data = await api({ type: 'arithmetic', operator: state.operator, operands: [first, second] });
    if (data.error) { setResult(data.error, true); return; }

    const res = formatNum(data.result);
    setResult(res);
    state.display = String(data.result);
    state.operands = [data.result];
    if (!chain) {
        state.operator = null;
        state.justCalculated = true;
        document.querySelectorAll('#mode-arithmetic .op').forEach(b => b.classList.remove('active-selected'));
    }
}

async function arithPercent() {
    const val = parseFloat(state.display);
    const data = await api({ type: 'arithmetic', operator: '%', operands: [val] });
    if (data.error) { setResult(data.error, true); return; }
    state.display = String(data.result);
    setResult(formatNum(data.result));
}

function arithClear() {
    state.display = '0'; state.expression = ''; state.operands = [];
    state.operator = null; state.awaitingSecond = false; state.justCalculated = false;
    setResult('0'); setExpression('');
    document.querySelectorAll('#mode-arithmetic .op').forEach(b => b.classList.remove('active-selected'));
}

function arithToggleSign() {
    const val = parseFloat(state.display) * -1;
    state.display = String(val);
    setResult(formatNum(val));
}

// ── Arithmetic button listeners ──────────────────────────
document.querySelectorAll('#mode-arithmetic .num').forEach(btn => {
    btn.addEventListener('click', () => arithHandleNum(btn.dataset.num));
});
document.querySelectorAll('#mode-arithmetic .op').forEach(btn => {
    btn.addEventListener('click', () => arithHandleOp(btn.dataset.op));
});
document.querySelector('[data-action="equals"]').addEventListener('click', () => arithEquals());
document.querySelector('[data-action="clear"]').addEventListener('click', arithClear);
document.querySelector('[data-action="percent"]').addEventListener('click', arithPercent);
document.querySelector('[data-action="toggle-sign"]').addEventListener('click', arithToggleSign);

// ══════════════════════════════════════════════════════
//  TRIG MODE
// ══════════════════════════════════════════════════════
function trigSetDisplay(val) { trigInput = val; setResult(val === '' ? '0' : val); }

document.querySelectorAll('.trig-fn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.trig-fn').forEach(b => b.classList.remove('active-trig'));
        btn.classList.add('active-trig');
        trigFn = btn.dataset.fn;
    });
});

document.querySelectorAll('[data-trig-num]').forEach(btn => {
    btn.addEventListener('click', () => {
        const d = btn.dataset.trigNum;
        if (d === '.' && trigInput.includes('.')) return;
        trigInput = (trigInput === '0' && d !== '.') ? d : trigInput + d;
        setResult(trigInput);
    });
});

document.querySelector('[data-action="trig-clear"]').addEventListener('click', () => {
    trigInput = '0'; setResult('0'); setExpression('');
});
document.querySelector('[data-action="trig-toggle-sign"]').addEventListener('click', () => {
    trigInput = String(parseFloat(trigInput) * -1);
    setResult(trigInput);
});
document.querySelector('[data-action="trig-calc"]').addEventListener('click', async () => {
    const angle = parseFloat(trigInput);
    setExpression(`${trigFn}(${angle}°) =`);
    const data = await api({ type: 'trig', func: trigFn, angle });
    if (data.error) { setResult(data.error, true); return; }
    setResult(formatNum(data.result));
    trigInput = String(data.result);
});

// ══════════════════════════════════════════════════════
//  ROOT MODE
// ══════════════════════════════════════════════════════
document.querySelectorAll('[data-root-num]').forEach(btn => {
    btn.addEventListener('click', () => {
        const d = btn.dataset.rootNum;
        if (d === '.' && rootInput.includes('.')) return;
        rootInput = (rootInput === '0' && d !== '.') ? d : rootInput + d;
        setResult(rootInput);
    });
});
document.querySelector('[data-action="root-clear"]').addEventListener('click', () => {
    rootInput = '0'; setResult('0'); setExpression('');
});
document.querySelector('[data-action="root-toggle-sign"]').addEventListener('click', () => {
    rootInput = String(parseFloat(rootInput) * -1);
    setResult(rootInput);
});
document.querySelector('[data-action="root-calc"]').addEventListener('click', async () => {
    const num = parseFloat(rootInput);
    setExpression(`√(${num}) =`);
    const data = await api({ type: 'root', number: num });
    if (data.error) { setResult(data.error, true); return; }
    setResult(formatNum(data.result));
    rootInput = String(data.result);
});

// ══════════════════════════════════════════════════════
//  MODE SWITCHING
// ══════════════════════════════════════════════════════
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentMode = tab.dataset.mode;

        document.querySelectorAll('.keypad').forEach(k => k.classList.add('hidden'));
        document.getElementById(`mode-${currentMode}`).classList.remove('hidden');

        // Reset display
        setResult('0'); setExpression('');
        if (currentMode === 'arithmetic') arithClear();
        if (currentMode === 'trig') { trigInput = '0'; }
        if (currentMode === 'root') { rootInput = '0'; }
    });
});

// ── Keyboard support ─────────────────────────────────────
document.addEventListener('keydown', e => {
    if (currentMode !== 'arithmetic') return;
    if ('0123456789.'.includes(e.key)) arithHandleNum(e.key);
    else if (['+','-','*','/'].includes(e.key)) arithHandleOp(e.key === '*' ? 'x' : e.key);
    else if (e.key === 'Enter' || e.key === '=') arithEquals();
    else if (e.key === 'Escape') arithClear();
    else if (e.key === 'Backspace') {
        state.display = state.display.length > 1 ? state.display.slice(0,-1) : '0';
        setResult(state.display);
    }
});
