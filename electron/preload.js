const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  togglePinWindow: () => ipcRenderer.send('toggle-pin-window'),
  hidePinWindow: () => ipcRenderer.send('hide-pin-window'),
  isElectron: true,
})
