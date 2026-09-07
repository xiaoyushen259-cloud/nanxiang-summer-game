const get = id => document.getElementById(id);
let failed = false;
export function loadingStatus(message, detail = '') {
  if (failed) return;
  get('loading-text').textContent = message;
  get('loading-detail').textContent = detail;
}
export function loadingFailure(error) {
  console.error(error?.stack || error);
  get('loading').hidden = false;
  const phase = get('loading-text').textContent;
  loadingStatus('暂时没能进入南巷', `${phase}：${error?.message || '连接中断，请重试。'}`);
  failed = true;
  get('loading-retry').hidden = false;
}
