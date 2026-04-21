const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  togglePinWindow: () => ipcRenderer.send('toggle-pin-window'),
  hidePinWindow: () => ipcRenderer.send('hide-pin-window'),
  
  // 跨視窗通訊 API：用來廣播與接收 React Query 的更新需求
  broadcastQueryInvalidation: (queryKey) => ipcRenderer.send('broadcast-query-invalidation', queryKey),
  onQueryInvalidation: (callback) => ipcRenderer.on('query-invalidation', (_event, queryKey) => callback(queryKey)),

  openCardDetail: (boardId, cardId) => ipcRenderer.send('open-card-detail', { boardId, cardId }),

  isElectron: true,
})
