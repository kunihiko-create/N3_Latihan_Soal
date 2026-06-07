// ===== JLPT N3 練習アプリ =====
const app = document.getElementById("app");
const homeBtn = document.getElementById("homeBtn");
const titleEl = document.getElementById("title");
const langSel = document.getElementById("langSel");

// 現在の画面を再描画するための関数（言語切替時に使用）
let currentScreen = renderHome;

homeBtn.addEventListener("click", renderHome);

// 言語セレクタ
if (langSel) {
  langSel.value = LANG;
  langSel.addEventListener("change", () => {
    setLang(langSel.value);
    currentScreen(); // 現在の画面を新しい言語で再描画
  });
}

function setHeader(title, showHome) {
  titleEl.textContent = title;
  homeBtn.hidden = !showHome;
  homeBtn.textContent = "≡ " + tt("home");
}

function el(html) {
  const t = document.createElement("template");
  t.innerHTML = html.trim();
  return t.content.firstChild;
}

function clear() {
  app.innerHTML = "";
}

// 問題文HTML（target があれば下線を付ける）
function questionTextHTML(q) {
  const text = escapeHtml(q.text);
  if (q.target) {
    const tgt = escapeHtml(q.target);
    const i = text.indexOf(tgt);
    if (i >= 0) {
      return (
        text.slice(0, i) +
        '<u class="target">' +
        tgt +
        "</u>" +
        text.slice(i + tgt.length)
      );
    }
  }
  return text;
}

// ---------- ホーム ----------
async function renderHome() {
  currentScreen = renderHome;
  setHeader(tt("appTitle"), false);
  clear();
  const wrap = el(`<div class="menu-grid"></div>`);

  const past = el(`<button class="big-btn">📚 ${tt("pastTitle")}
    <span class="sub">${tt("pastDesc")}</span></button>`);
  past.onclick = renderPastExamList;

  const similar = el(`<button class="big-btn">🔁 ${tt("similarTitle")}
    <span class="sub">${tt("similarDesc")}</span></button>`);
  similar.onclick = renderSimilarList;

  wrap.appendChild(past);
  wrap.appendChild(similar);
  app.appendChild(wrap);

  try {
    const idx = await DataStore.loadIndex();
    const info = el(
      `<div class="card" style="margin-top:8px"><div class="section-label">${tt(
        "recorded"
      )}</div>
       <div style="font-size:14px;color:var(--muted)">${recordedText(
         idx.past.length,
         idx.similar.length
       )}<br>${tt("listeningNote")}</div></div>`
    );
    app.appendChild(info);
  } catch (e) {
    showError(e);
  }
}

// ---------- 過去問: 回の選択 ----------
async function renderPastExamList() {
  currentScreen = renderPastExamList;
  setHeader(tt("pastTitle"), true);
  clear();
  const idx = await DataStore.loadIndex();
  app.appendChild(el(`<div class="section-label">${tt("chooseExam")}</div>`));
  for (const e of idx.past) {
    const b = el(
      `<button class="list-btn"><span>${escapeHtml(
        examLabel(e.label)
      )}</span><span class="arrow">›</span></button>`
    );
    b.onclick = () => renderSectionList(e);
    app.appendChild(b);
  }
}

// ---------- 過去問: セクション選択 ----------
async function renderSectionList(examEntry) {
  currentScreen = () => renderSectionList(examEntry);
  setHeader(examLabel(examEntry.label), true);
  clear();
  let data;
  try {
    data = await DataStore.loadFile(examEntry.file);
  } catch (e) {
    return showError(e);
  }
  app.appendChild(el(`<div class="section-label">${tt("chooseSection")}</div>`));
  for (const sec of data.sections) {
    const count = sec.parts.reduce((n, p) => n + p.questions.length, 0);
    const b = el(
      `<button class="list-btn">
        <span>${sectionEmoji(sec.id)} ${escapeHtml(
        sectionName(sec.id)
      )}<span class="tag">${countLabel(count)}</span></span>
        <span class="arrow">›</span></button>`
    );
    b.onclick = () => {
      const items = flattenSection(data, sec.id);
      startQuiz({
        titleFn: () => `${examLabel(examEntry.label)}・${sectionName(sec.id)}`,
        items,
        shuffleItems: false,
        onExit: () => renderSectionList(examEntry),
      });
    };
    app.appendChild(b);
  }
}

// ---------- 類似問題: セット選択 ----------
async function renderSimilarList() {
  currentScreen = renderSimilarList;
  setHeader(tt("similarTitle"), true);
  clear();
  const idx = await DataStore.loadIndex();
  if (!idx.similar.length) {
    app.appendChild(el(`<div class="card">${tt("noSimilar")}</div>`));
    return;
  }
  app.appendChild(el(`<div class="section-label">${tt("chooseSection")}</div>`));

  // すべての類似ファイルを読み、セクションごとにまとめる
  const datas = [];
  for (const s of idx.similar) {
    try {
      datas.push(await DataStore.loadFile(s.file));
    } catch (e) {
      /* skip */
    }
  }
  for (const secId of Object.keys(SECTION_NAMES)) {
    const items = [];
    for (const d of datas) items.push(...flattenSection(d, secId));
    if (!items.length) continue;
    const b = el(
      `<button class="list-btn">
        <span>${sectionEmoji(secId)} ${escapeHtml(
        sectionName(secId)
      )}<span class="tag">${countLabel(items.length)}</span></span>
        <span class="arrow">›</span></button>`
    );
    b.onclick = () =>
      startQuiz({
        titleFn: () => `${tt("similarTitle")}・${sectionName(secId)}`,
        items,
        shuffleItems: true,
        onExit: renderSimilarList,
      });
    app.appendChild(b);
  }
}

// ---------- クイズ ----------
let quiz = null;

function startQuiz({ titleFn, items, shuffleItems, onExit }) {
  if (!items.length) {
    app.innerHTML = "";
    app.appendChild(el(`<div class="card">${tt("noQuestions")}</div>`));
    return;
  }
  quiz = {
    titleFn,
    items: shuffleItems ? shuffle(items) : items,
    idx: 0,
    answers: [], // {item, chosen, correct}
    onExit,
    revealed: false, // 現在の問題が回答済みか
  };
  renderQuestion();
}

function renderQuestion() {
  currentScreen = renderQuestion;
  clear();
  const { items, idx } = quiz;
  const cur = items[idx];
  const q = cur.question;
  setHeader(quiz.titleFn(), true);

  // progress
  const pct = Math.round((idx / items.length) * 100);
  app.appendChild(
    el(`<div class="progress-wrap">
      <div class="progress-top"><span>${progressText(
        idx + 1,
        items.length
      )}</span>
      <span>${escapeHtml(cur.partName || "")}</span></div>
      <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
    </div>`)
  );

  const cardEl = el(`<div class="card"></div>`);
  if (cur.passage) {
    cardEl.appendChild(
      el(`<div class="passage">${escapeHtml(cur.passage)}</div>`)
    );
  }
  if (cur.instruction) {
    cardEl.appendChild(
      el(
        `<div class="instruction">${instructionHTML(
          cur.instruction,
          escapeHtml
        )}</div>`
      )
    );
  }
  cardEl.appendChild(el(`<div class="q-text">${questionTextHTML(q)}</div>`));

  const choicesEl = el(`<div class="choices"></div>`);
  q.choices.forEach((c, i) => {
    const btn = el(
      `<button class="choice"><span class="num">${
        i + 1
      }</span><span>${escapeHtml(c)}</span></button>`
    );
    btn.onclick = () => onAnswer(i, choicesEl, cardEl);
    choicesEl.appendChild(btn);
  });
  cardEl.appendChild(choicesEl);
  app.appendChild(cardEl);
}

function onAnswer(chosen, choicesEl, cardEl) {
  const cur = quiz.items[quiz.idx];
  const q = cur.question;
  const correct = q.answer;
  const isOk = chosen === correct;

  // ボタン無効化＆色付け
  [...choicesEl.children].forEach((btn, i) => {
    btn.disabled = true;
    if (i === correct) btn.classList.add("correct");
    if (i === chosen && !isOk) btn.classList.add("wrong");
  });

  quiz.answers.push({ item: cur, chosen, correct, isOk });

  const explainHTML =
    q.explanation || q.explanation_id
      ? `<div class="explain">💡 ${tpairHTML(
          q.explanation || "",
          q.explanation_id || "",
          escapeHtml
        )}</div>`
      : "";

  const fb = el(
    `<div class="feedback ${isOk ? "ok" : "ng"}">
      ${isOk ? tt("correct") : tt("incorrect")}　${answerIsText(correct + 1)}
      ${explainHTML}
    </div>`
  );
  cardEl.appendChild(fb);

  const isLast = quiz.idx === quiz.items.length - 1;
  const row = el(`<div class="row-btns"></div>`);
  const next = el(
    `<button class="btn btn-primary">${
      isLast ? tt("viewResult") : tt("next")
    }</button>`
  );
  next.onclick = () => {
    if (isLast) {
      renderResult();
    } else {
      quiz.idx++;
      renderQuestion();
    }
  };
  row.appendChild(next);
  cardEl.appendChild(row);
  next.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function renderResult() {
  currentScreen = renderResult;
  clear();
  setHeader(quiz.titleFn(), true);
  const total = quiz.answers.length;
  const correctN = quiz.answers.filter((a) => a.isOk).length;
  const pct = Math.round((correctN / total) * 100);

  const card = el(`<div class="card"></div>`);
  card.appendChild(el(`<div class="score-big">${correctN} / ${total}</div>`));
  card.appendChild(el(`<div class="score-sub">${scoreSubText(pct)}</div>`));

  const row = el(`<div class="row-btns"></div>`);
  const retry = el(`<button class="btn btn-ghost">${tt("retry")}</button>`);
  retry.onclick = () =>
    startQuiz({
      titleFn: quiz.titleFn,
      items: quiz.items,
      shuffleItems: false,
      onExit: quiz.onExit,
    });
  const back = el(`<button class="btn btn-primary">${tt("backToList")}</button>`);
  back.onclick = quiz.onExit;
  row.appendChild(retry);
  row.appendChild(back);
  card.appendChild(row);
  app.appendChild(card);

  // 誤答の見直し
  const wrong = quiz.answers.filter((a) => !a.isOk);
  if (wrong.length) {
    const rc = el(`<div class="card"></div>`);
    rc.appendChild(
      el(`<div class="section-label">${tt("reviewHead")}</div>`)
    );
    wrong.forEach((a) => {
      const q = a.item.question;
      const explainHTML =
        q.explanation || q.explanation_id
          ? `<div class="explain">💡 ${tpairHTML(
              q.explanation || "",
              q.explanation_id || "",
              escapeHtml
            )}</div>`
          : "";
      rc.appendChild(
        el(`<div class="review-item">
          <div class="q">${questionTextHTML(q)}</div>
          <div class="ans">${tt("correctLabel")}: ${a.correct + 1}. ${escapeHtml(
          q.choices[a.correct]
        )}</div>
          <div class="your">${tt("yourLabel")}: ${a.chosen + 1}. ${escapeHtml(
          q.choices[a.chosen]
        )}</div>
          ${explainHTML}
        </div>`)
      );
    });
    app.appendChild(rc);
  }
}

// ---------- utils ----------
function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function showError(e) {
  app.appendChild(
    el(
      `<div class="card" style="border-color:var(--wrong)">
        <b>${tt("errorHead")}</b><div style="font-size:14px;margin-top:6px">${escapeHtml(
        e.message || e
      )}</div>
        <div style="font-size:13px;color:var(--muted);margin-top:8px">
        ※ データ（<code>data/bundle.js</code>）が読み込めていない可能性があります。
        JSON を更新した場合は <code>python3 tools/build_bundle.py</code> を実行してください。</div>
      </div>`
    )
  );
}

renderHome();
