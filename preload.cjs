// This creates electronAPI object on the browser's window object, to allow communication between nodejs and browser
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  copyText: (text) => ipcRenderer.invoke('copy-text', text),
  onPostData: (callback) => ipcRenderer.on('post-data', callback)
});