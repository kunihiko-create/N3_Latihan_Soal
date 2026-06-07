// ===== 多言語対応（日本語 / インドネシア語 / 両方併記）=====
// 言語モード: "ja"（日本語のみ） / "id"（インドネシア語のみ） / "both"（両方併記）
// 問題文・選択肢は学習対象なので翻訳しない（常に日本語）。

const LANG_KEY = "jlpt_lang";
const LANG_MODES = ["ja", "id", "both"];

let LANG = localStorage.getItem(LANG_KEY) || "ja";
if (!LANG_MODES.includes(LANG)) LANG = "ja";

function setLang(mode) {
  if (!LANG_MODES.includes(mode)) return;
  LANG = mode;
  localStorage.setItem(LANG_KEY, mode);
}

// UI文言テーブル（ja / id ペア）
const T = {
  appTitle: { ja: "JLPT N3 練習", id: "Latihan JLPT N3" },
  home: { ja: "ホーム", id: "Beranda" },

  pastTitle: { ja: "過去問練習", id: "Latihan Soal Ujian Asli" },
  pastDesc: {
    ja: "本番と同じ問題を、回・セクションごとに解きます",
    id: "Kerjakan soal ujian asli, per sesi dan per bagian",
  },
  similarTitle: { ja: "類似問題練習", id: "Latihan Soal Serupa" },
  similarDesc: {
    ja: "過去問をもとに作った類似問題で、ランダムに練習します",
    id: "Latihan acak dengan soal serupa berdasarkan soal ujian asli",
  },

  recorded: { ja: "収録", id: "Konten" },
  listeningNote: {
    ja: "聴解は現在ふくまれていません。",
    id: "Bagian menyimak (choukai) belum termasuk.",
  },

  chooseExam: { ja: "回を選んでください", id: "Pilih sesi ujian" },
  chooseSection: { ja: "セクションを選んでください", id: "Pilih bagian" },

  noQuestions: {
    ja: "この区分には問題がありません。",
    id: "Belum ada soal di bagian ini.",
  },
  noSimilar: { ja: "類似問題はまだありません。", id: "Belum ada soal serupa." },

  correct: { ja: "✅ 正解！", id: "✅ Benar!" },
  incorrect: { ja: "❌ 不正解", id: "❌ Salah" },
  next: { ja: "次の問題 ›", id: "Soal berikutnya ›" },
  viewResult: { ja: "結果を見る", id: "Lihat hasil" },

  retry: { ja: "もう一度", id: "Ulangi" },
  backToList: { ja: "一覧へ戻る", id: "Kembali ke daftar" },
  reviewHead: {
    ja: "見直し（間違えた問題）",
    id: "Tinjau (soal yang salah)",
  },
  correctLabel: { ja: "正解", id: "Jawaban benar" },
  yourLabel: { ja: "あなた", id: "Jawaban Anda" },

  errorHead: { ja: "読み込みエラー", id: "Gagal memuat data" },
};

// セクション名
const SECTION_NAMES = {
  "moji-goi": { emoji: "✏️", ja: "文字・語彙", id: "Kosakata & Tulisan" },
  bunpou: { emoji: "📝", ja: "文法", id: "Tata Bahasa" },
  dokkai: { emoji: "📖", ja: "読解", id: "Membaca" },
};

// 指示文の翻訳（日本語の完全一致 → インドネシア語）
const INSTRUCTION_ID = {
  "＿＿の言葉の読み方として最もよいものを、1・2・3・4から一つえらびなさい。":
    "Pilih cara baca yang paling tepat untuk kata bergaris bawah, dari pilihan 1·2·3·4.",
  "＿＿のことばを漢字で書くとき、最もよいものを、1・2・3・4から一つえらびなさい。":
    "Pilih kanji yang paling tepat untuk menulis kata bergaris bawah, dari pilihan 1·2·3·4.",
  "（　）に入れるのに最もよいものを、1・2・3・4から一つえらびなさい。":
    "Pilih kata yang paling tepat untuk mengisi (　), dari pilihan 1·2·3·4.",
  "＿＿に意味が最も近いものを、1・2・3・4から一つえらびなさい。":
    "Pilih kata yang maknanya paling dekat dengan kata bergaris bawah, dari pilihan 1·2·3·4.",
  "つぎのことばの使い方として最もよいものを、1・2・3・4から一つえらびなさい。":
    "Pilih kalimat yang penggunaan katanya paling tepat, dari pilihan 1·2·3·4.",
  "つぎの文の（　）に入れるのに最もよいものを、1・2・3・4から一つえらびなさい。":
    "Pilih kata yang paling tepat untuk mengisi (　) pada kalimat berikut, dari pilihan 1·2·3·4.",
  "つぎの文の　★　に入る最もよいものを、1・2・3・4から一つえらびなさい。":
    "Susun kalimat, lalu pilih kata yang masuk ke ★, dari pilihan 1·2·3·4.",
  "つぎの文章を読んで、文章全体の内容を考えて、（19）から（22）の中に入る最もよいものを、1・2・3・4から一つえらびなさい。":
    "Bacalah teks berikut, pikirkan isi keseluruhannya, lalu pilih kata yang paling tepat untuk mengisi (19) sampai (22), dari pilihan 1·2·3·4.",
  "つぎの文章を読んで、質問に答えなさい。答えは、1・2・3・4から最もよいものを一つえらびなさい。":
    "Bacalah teks berikut dan jawablah pertanyaannya. Pilih jawaban yang paling tepat dari pilihan 1·2·3·4.",
  "右のページは、ある大学のホームページに書かれた、食堂・カフェの案内である。これを読んで、下の質問に答えなさい。答えは、1・2・3・4から最もよいものを一つえらびなさい。":
    "Halaman berikut adalah informasi kantin/kafe dari situs web sebuah universitas. Bacalah, lalu jawablah pertanyaan di bawah. Pilih jawaban yang paling tepat dari pilihan 1·2·3·4.",
  "右のページは、秋の日帰りバス旅行の案内である。これを読んで、下の質問に答えなさい。答えは、1・2・3・4から最もよいものを一つえらびなさい。":
    "Halaman berikut adalah informasi tur bus sehari di musim gugur. Bacalah, lalu jawablah pertanyaan di bawah. Pilih jawaban yang paling tepat dari pilihan 1·2·3·4.",
  "右のページは、ある音楽教室の生徒募集の案内である。これを読んで、下の質問に答えなさい。答えは、1・2・3・4から最もよいものを一つえらびなさい。":
    "Halaman berikut adalah pengumuman penerimaan murid sebuah kelas musik. Bacalah, lalu jawablah pertanyaan di bawah. Pilih jawaban yang paling tepat dari pilihan 1·2·3·4.",
  "右のページのAとBは、ある図書館にはってある二つのお知らせである。これを読んで、下の質問に答えなさい。答えは、1・2・3・4から最もよいものを一つえらびなさい。":
    "A dan B di halaman berikut adalah dua pengumuman yang ditempel di sebuah perpustakaan. Bacalah, lalu jawablah pertanyaan di bawah. Pilih jawaban yang paling tepat dari pilihan 1·2·3·4.",
};

// ---- ヘルパー ----

// UIキー（T）をプレーンテキストで返す（タイトルなど）
function tt(key) {
  const p = T[key];
  if (!p) return key;
  if (LANG === "id") return p.id;
  if (LANG === "both") return p.ja + " / " + p.id;
  return p.ja;
}

// 任意の ja/id ペアをプレーンテキストで返す
function tpair(ja, id) {
  if (LANG === "id" && id) return id;
  if (LANG === "both" && id) return ja + " / " + id;
  return ja;
}

// 任意の ja/id ペアを HTML で返す（both は2行で併記）。escFn はエスケープ関数。
function tpairHTML(ja, id, escFn) {
  const esc = escFn || ((s) => s);
  const J = esc(ja || "");
  const I = esc(id || "");
  if (LANG === "id" && id) return `<span class="bi-id">${I}</span>`;
  if (LANG === "both" && id)
    return `<span class="bi-ja">${J}</span><span class="bi-id">${I}</span>`;
  return `<span>${J}</span>`;
}

// UIキー（T）を HTML で返す（both は併記）
function ttHTML(key, escFn) {
  const p = T[key] || { ja: key, id: key };
  return tpairHTML(p.ja, p.id, escFn);
}

// セクション名（プレーンテキスト）
function sectionName(id) {
  const m = SECTION_NAMES[id];
  if (!m) return id;
  return tpair(m.ja, m.id);
}
function sectionEmoji(id) {
  return (SECTION_NAMES[id] || {}).emoji || "•";
}

// 指示文の HTML（id訳があれば言語モードに従って併記/置換）
function instructionHTML(ja, escFn) {
  const id = INSTRUCTION_ID[ja] || null;
  return tpairHTML(ja, id, escFn);
}

// 試験ラベル "2023年7月" / "2023年7月ベース" をインドネシア語化
const ID_MONTHS = {
  1: "Januari", 2: "Februari", 3: "Maret", 4: "April", 5: "Mei", 6: "Juni",
  7: "Juli", 8: "Agustus", 9: "September", 10: "Oktober", 11: "November", 12: "Desember",
};
function examLabelID(label) {
  const m = label.match(/^(\d{4})年(\d{1,2})月(ベース)?$/);
  if (!m) return label;
  let s = `${ID_MONTHS[+m[2]]} ${m[1]}`;
  if (m[3]) s += " (dasar)"; // 〜ベース
  return s;
}
function examLabel(label) {
  if (LANG === "id") return examLabelID(label);
  if (LANG === "both") return label + " / " + examLabelID(label);
  return label;
}

// 「N問 / N soal」など数量表現
function countLabel(n) {
  if (LANG === "id") return `${n} soal`;
  if (LANG === "both") return `${n}問 / ${n} soal`;
  return `${n}問`;
}
function recordedText(pastN, simN) {
  const ja = `過去問 ${pastN} 回分・類似問題 ${simN} セット`;
  const id = `${pastN} sesi soal ujian · ${simN} set soal serupa`;
  return tpair(ja, id);
}
function progressText(a, b) {
  if (LANG === "id") return `Soal ${a} / ${b}`;
  if (LANG === "both") return `問題 ${a} / ${b}`; // 進捗は簡潔に（ja表記）
  return `問題 ${a} / ${b}`;
}
function answerIsText(n) {
  if (LANG === "id") return `Jawaban: nomor ${n}`;
  if (LANG === "both") return `正解は ${n} 番 / Jawaban: nomor ${n}`;
  return `正解は ${n} 番`;
}
function scoreSubText(p) {
  if (LANG === "id") return `Tingkat benar ${p}%`;
  if (LANG === "both") return `正答率 ${p}% / Benar ${p}%`;
  return `正答率 ${p}%`;
}
