const {
    app,
    BrowserWindow
} = require('electron');

require('electron-debug')();

function createWindow() {
    // Create the browser window.
    const win = new BrowserWindow({
        width: 400,
        height: 600
    });
    // and load the index.html of the app.
    win.setMenu(null);
    win.setAlwaysOnTop(true, "floating");
    win.setVisibleOnAllWorkspaces(true);
    win.setFullScreenable(false);
    win.loadFile('index.html');
}

app.on('ready', createWindow);