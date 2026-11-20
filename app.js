// Markdown を変換する前に数式部分を退避し、変換後に MathJax 用の区切りで戻す
function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function render(md) {
  md = md.replace(/<!--[\s\S]*?-->/g, '');
  const math = [];
  const keep = (tex, display) => {
    math.push(display ? '\\[' + tex + '\\]' : '\\(' + tex + '\\)');
    return '@@MATH' + (math.length - 1) + '@@';
  };
  md = md
    .replace(/\$\$([\s\S]+?)\$\$/g, (_, t) => keep(t, true))
    .replace(/\\\[([\s\S]+?)\\\]/g, (_, t) => keep(t, true))
    .replace(/\\\(([\s\S]+?)\\\)/g, (_, t) => keep(t, false))
    .replace(/(^|[^\\])\$([^$\n]+?)\$/g, (_, pre, t) => pre + keep(t, false))
    .replace(/\\\$/g, '$');
  let html = marked.parse(md);
  html = html.replace(/@@MATH(\d+)@@/g, (_, i) => escapeHtml(math[+i]));
  return html;
}

window.addEventListener('DOMContentLoaded', async () => {
  const el = document.getElementById('content');
  try {
    const res = await fetch(document.body.dataset.md, { cache: 'no-cache' });
    if (!res.ok) throw new Error(res.status);
    el.innerHTML = render(await res.text());
    // 横に長い表はスマホで横スクロールできるようにする
    el.querySelectorAll('table').forEach(t => {
      if (t.closest('.table-wrap, .ans')) return;
      const w = document.createElement('div');
      w.className = 'table-wrap';
      t.replaceWith(w);
      w.appendChild(t);
    });
    await MathJax.startup.promise;
    await MathJax.typesetPromise([el]);
  } catch (e) {
    el.innerHTML = '<p class="status">訂正情報を読み込めませんでした。時間をおいて再読み込みしてください。</p>';
  }
});
