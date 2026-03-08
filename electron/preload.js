const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  togglePinWindow: () => ipcRenderer.send('toggle-pin-window'),
  isElectron: true,
})
