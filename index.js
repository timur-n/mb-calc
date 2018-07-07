const {
    app,
    BrowserWindow
} = require('electron');

try {
    require('electron-debug')();
} catch (e) {}

app.on('ready', () => {
    // Create the browser window.
    const win = new BrowserWindow({
        width: 350,
        height: 480
    });
    // and load the index.html of the app.
    win.setMenu(null);
    win.setAlwaysOnTop(true, "floating");
    win.setVisibleOnAllWorkspaces(true);
    win.setFullScreenable(false);
    win.loadFile('index.html');
});

app.on('window-all-closed', () => {
    app.quit();
});