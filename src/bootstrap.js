import './style.css';
import {loadingFailure, loadingStatus} from './startup-ui.js';

document.getElementById('loading-retry').onclick = () => location.reload();
loadingStatus('正在连接南巷…', '首次打开需要下载场景和角色，下载进度会显示在这里。');
// Do not hold document readiness behind every model download with top-level await.
import('./main.js').catch(loadingFailure);
