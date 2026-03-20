const { app, Tray, Menu, nativeImage, Notification, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let tray = null;
let settingsWindow = null;

// 配置
let intervalMinutes = 60;
let remainingSeconds = intervalMinutes * 60;
let isPaused = false;
let ticker = null;

app.dock.hide();

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function sendNotification() {
  const n = new Notification({
    title: '该起来活动了！',
    body: `你已经坐了 ${intervalMinutes} 分钟，站起来走动一下吧`,
    silent: false,
  });
  n.show();
}

function resetTimer() {
  remainingSeconds = intervalMinutes * 60;
  updateTray();
}

function startTicker() {
  if (ticker) clearInterval(ticker);
  ticker = setInterval(() => {
    if (isPaused) return;
    remainingSeconds--;
    if (remainingSeconds <= 0) {
      sendNotification();
      resetTimer();
    }
    updateTray();
  }, 1000);
}

function updateTray() {
  if (!tray) return;

  const timeStr = formatTime(remainingSeconds);
  const statusLabel = isPaused ? '⏸' : '🧘';
  tray.setTitle(` ${timeStr}`);

  const intervalOptions = [15, 30, 45, 60, 90, 120];

  const menu = Menu.buildFromTemplate([
    { label: `距下次提醒: ${timeStr}`, enabled: false },
    { type: 'separator' },
    {
      label: isPaused ? '▶ 恢复提醒' : '⏸ 暂停提醒',
      click: () => {
        isPaused = !isPaused;
        updateTray();
      },
    },
    {
      label: '🔄 立即重置',
      click: () => {
        resetTimer();
      },
    },
    { type: 'separator' },
    {
      label: '提醒间隔',
      submenu: intervalOptions.map((min) => ({
        label: min < 60 ? `${min} 分钟` : `${min / 60} 小时`,
        type: 'radio',
        checked: intervalMinutes === min,
        click: () => {
          intervalMinutes = min;
          resetTimer();
        },
      })),
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => {
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(menu);
}

function createTray() {
  // 使用一个小的 16x16 模板图标
  const iconPath = path.join(__dirname, 'iconTemplate.png');
  let icon;
  try {
    icon = nativeImage.createFromPath(iconPath);
    icon.setTemplateImage(true);
  } catch {
    // 如果没有图标文件，创建一个空的
    icon = nativeImage.createEmpty();
  }

  tray = new Tray(icon);
  tray.setToolTip('起身吧 (Arise)');
  updateTray();
  startTicker();
}

app.whenReady().then(() => {
  createTray();
});

app.on('window-all-closed', (e) => {
  e.preventDefault();
});
