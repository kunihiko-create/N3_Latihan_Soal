// 簡易パスワードゲート（クライアント側のみ）。
// 初回だけパスワードを入力し、同じブラウザ（デバイス）では以降不要にする。
// ※静的サイトのため強固なセキュリティではありません（ソースを見れば回避は可能）。
//   「身内だけにURLを知らせて、軽く入口を閉じる」程度の用途を想定しています。
(function () {
  "use strict";

  var STORAGE_KEY = "jlpt_gate_ok";
  // パスワードを base64 で持つ（平文を直接書かないための軽い難読化）。
  // atob("Z291a2FrdU4z") === "goukakuN3"
  var PASS_B64 = "Z291a2FrdU4z";

  // すでに解錠済みなら何もしない
  try {
    if (localStorage.getItem(STORAGE_KEY) === "1") return;
  } catch (e) {
    // localStorage が使えない環境では毎回入力になる（致命的ではない）
  }

  // 中身がちらっと見えないように、解錠までページ本体を隠す
  var hideStyle = document.createElement("style");
  hideStyle.id = "gate-hide-style";
  hideStyle.textContent =
    "body > header, body > main, body > footer { visibility: hidden !important; }" +
    "#gate-overlay { position: fixed; inset: 0; z-index: 99999; display: flex;" +
    "  align-items: center; justify-content: center; padding: 24px;" +
    "  background: #f3f4f6; font-family: system-ui, -apple-system, 'Segoe UI', sans-serif; }" +
    "#gate-overlay .gate-card { width: 100%; max-width: 360px; background: #fff;" +
    "  border-radius: 14px; box-shadow: 0 10px 30px rgba(0,0,0,.12); padding: 28px 24px; text-align: center; }" +
    "#gate-overlay h1 { font-size: 18px; margin: 0 0 4px; color: #1f2937; }" +
    "#gate-overlay p.sub { font-size: 13px; color: #6b7280; margin: 0 0 18px; line-height: 1.5; }" +
    "#gate-overlay input { width: 100%; box-sizing: border-box; padding: 12px 14px; font-size: 16px;" +
    "  border: 1px solid #d1d5db; border-radius: 10px; outline: none; }" +
    "#gate-overlay input:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,.15); }" +
    "#gate-overlay button { width: 100%; margin-top: 14px; padding: 12px 14px; font-size: 16px;" +
    "  font-weight: 700; color: #fff; background: #2563eb; border: none; border-radius: 10px; cursor: pointer; }" +
    "#gate-overlay button:hover { background: #1d4ed8; }" +
    "#gate-overlay .err { color: #dc2626; font-size: 13px; min-height: 18px; margin-top: 10px; }";
  (document.head || document.documentElement).appendChild(hideStyle);

  function mount() {
    var overlay = document.createElement("div");
    overlay.id = "gate-overlay";
    overlay.innerHTML =
      '<div class="gate-card">' +
      "<h1>🔒 パスワード / Kata Sandi</h1>" +
      '<p class="sub">このアプリを使うにはパスワードを入力してください。<br>' +
      "Masukkan kata sandi untuk menggunakan aplikasi ini.</p>" +
      '<input id="gate-input" type="password" autocomplete="current-password" ' +
      'inputmode="text" placeholder="パスワード / Kata sandi" aria-label="パスワード" />' +
      '<button id="gate-btn" type="button">入る / Masuk</button>' +
      '<div class="err" id="gate-err"></div>' +
      "</div>";
    document.body.appendChild(overlay);

    var input = overlay.querySelector("#gate-input");
    var btn = overlay.querySelector("#gate-btn");
    var err = overlay.querySelector("#gate-err");
    var expected;
    try {
      expected = atob(PASS_B64);
    } catch (e) {
      expected = "";
    }

    function tryUnlock() {
      if (input.value === expected) {
        try {
          localStorage.setItem(STORAGE_KEY, "1");
        } catch (e) {}
        var s = document.getElementById("gate-hide-style");
        if (s) s.parentNode.removeChild(s);
        overlay.parentNode.removeChild(overlay);
      } else {
        err.textContent = "パスワードが違います / Kata sandi salah";
        input.value = "";
        input.focus();
      }
    }

    btn.addEventListener("click", tryUnlock);
    input.addEventListener("keydown", function (ev) {
      if (ev.key === "Enter") tryUnlock();
    });
    input.focus();
  }

  if (document.body) {
    mount();
  } else {
    document.addEventListener("DOMContentLoaded", mount);
  }
})();
