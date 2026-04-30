const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  togglePinWindow: () => ipcRenderer.send('toggle-pin-window'),
  hidePinWindow: () => ipcRenderer.send('hide-pin-window'),
  minimizeWindow: () => ipcRenderer.send('minimize-window'),
  
  // 跨視窗通訊 API：用來廣播與接收 React Query 的更新需求
  broadcastQueryInvalidation: (queryKey) => ipcRenderer.send('broadcast-query-invalidation', queryKey),
  onQueryInvalidation: (callback) => ipcRenderer.on('query-invalidation', (_event, queryKey) => callback(queryKey)),

  openCardDetail: (boardId, cardId) => ipcRenderer.send('open-card-detail', { boardId, cardId }),

  broadcastSettings: (settings) => ipcRenderer.send('broadcast-settings', settings),
  onSettings: (callback) => ipcRenderer.on('settings', (_event, settings) => callback(settings)),

  isElectron: true,

  onUpdateAvailable: (callback) => ipcRenderer.on('updater:available', (_e, info) => callback(info)),
  onUpdateProgress: (callback) => ipcRenderer.on('updater:progress', (_e, data) => callback(data)),
  onUpdateDownloaded: (callback) => ipcRenderer.on('updater:downloaded', () => callback()),
  onUpdateError: (callback) => ipcRenderer.on('updater:error', (_e, data) => callback(data)),
  startUpdateDownload: () => ipcRenderer.send('updater:start-download'),
  installUpdate: () => ipcRenderer.send('updater:install'),
  removeUpdateListeners: () => {
    ipcRenderer.removeAllListeners('updater:available')
    ipcRenderer.removeAllListeners('updater:progress')
    ipcRenderer.removeAllListeners('updater:downloaded')
    ipcRenderer.removeAllListeners('updater:error')
  },
})
