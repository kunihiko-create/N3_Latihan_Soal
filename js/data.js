// データ読み込みユーティリティ
// データは data/bundle.js（<script>で読み込み済み）から取得する。
// これにより file:// での直接オープンでも GitHub Pages でも fetch 不要で動作する。
const DataStore = {
  get bundle() {
    if (!window.JLPT_DATA) {
      throw new Error(
        "データ（bundle.js）が読み込まれていません。" +
          "データを更新した場合は python3 tools/build_bundle.py を実行してください。"
      );
    }
    return window.JLPT_DATA;
  },

  async loadIndex() {
    return this.bundle.index;
  },

  async loadFile(file) {
    const data = this.bundle.files[file];
    if (!data) throw new Error(file + " が bundle.js に見つかりません");
    return data;
  },
};

// 1つの試験データから「セクションごとの問題リスト」を取り出す。
// 返り値: [{ partName, instruction, passage, question }] のフラットな配列
function flattenSection(examData, sectionId) {
  const section = examData.sections.find((s) => s.id === sectionId);
  if (!section) return [];
  const items = [];
  for (const part of section.parts) {
    for (const q of part.questions) {
      items.push({
        partName: part.name,
        instruction: part.instruction,
        passage: part.passage || null,
        question: q,
      });
    }
  }
  return items;
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
