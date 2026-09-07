import {loadingStatus} from './startup-ui.js';

const transfers = new Map();
let active = 0;
const waiting = [];
async function acquire() {
  if (active >= 3) await new Promise(resolve => waiting.push(resolve));
  active++;
}
function release() { active--; waiting.shift()?.(); }
function progress() {
  const rows = [...transfers.values()];
  const bytes = rows.reduce((sum, row) => sum + row.bytes, 0);
  const done = rows.filter(row => row.done).length;
  const current = rows.find(row => row.active);
  loadingStatus(`正在下载街区资源 · ${done} / ${rows.length}`,
    `已下载 ${(bytes / 1048576).toFixed(1)} MB${current ? ` · ${current.label}${current.attempt > 1 ? '（重新连接）' : ''}` : ''}`);
}

export async function downloadAsset(path, label = path.split('/').pop(), options = {}) {
  const {idleTimeout = 25000, totalTimeout = 180000, attempts = 2} = options;
  const row = {bytes: 0, done: false, active: false, label, attempt: 0};
  transfers.set(path, row);
  await acquire();
  row.active = true;
  try {
    for (let attempt = 1; attempt <= attempts; attempt++) {
      row.attempt = attempt; row.bytes = 0; progress();
      const controller = new AbortController();
      let idle;
      const touch = () => { clearTimeout(idle); idle = setTimeout(() => controller.abort(), idleTimeout); };
      const total = setTimeout(() => controller.abort(), totalTimeout);
      touch();
      try {
        const response = await fetch(`${import.meta.env.BASE_URL}${path}`, {signal: controller.signal});
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const reader = response.body.getReader();
        const chunks = [];
        while (true) {
          const {done, value} = await reader.read();
          if (done) break;
          chunks.push(value); row.bytes += value.byteLength; touch(); progress();
        }
        const result = new Uint8Array(row.bytes);
        let offset = 0;
        for (const chunk of chunks) { result.set(chunk, offset); offset += chunk.byteLength; }
        row.done = true; row.active = false; progress();
        return result.buffer;
      } catch (error) {
        if (attempt === attempts) throw new Error(`${label}下载中断，请点击重新连接。(${error.name === 'AbortError' ? '连接超时' : error.message})`);
      } finally { clearTimeout(idle); clearTimeout(total); }
    }
  } finally { row.active = false; release(); }
}
