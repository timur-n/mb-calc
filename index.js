import { app, BrowserWindow, ipcMain, clipboard } from 'electron';
import path from 'path';
import express from 'express';
import { fileURLToPath } from 'url';
import packageJson from './package.json' with { type: 'json' };

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// We can't get the clipboard object in preload script, so it will be handled by ipcRenderer.invoke()
ipcMain.handle('copy-text', (_, text) => {
    clipboard.writeText(text)
})

app.on('ready', () => {
    const browser = new BrowserWindow({
        width: app.isPackaged ? 350 : 1200,
        height: app.isPackaged ? 500 : 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.cjs')
        }
    });
    browser.setMenu(null);
    browser.setAlwaysOnTop(true, "floating");
    browser.setVisibleOnAllWorkspaces(true);
    browser.setFullScreenable(false);
    browser.loadFile('index.html');
    if (!app.isPackaged) {
        browser.webContents.openDevTools();
    }

    const server = express();
    server.use(express.json());

    // Allow other apps to send HTTP requests from browser (CORS)
    server.use((req, res, next) => {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        if (req.method === 'OPTIONS') {
            res.sendStatus(200);
        } else {
            next();
        }
    });

    // Handle requests to set the new odds
    server.post('/data', (req, res) => {
        if (!browser.isDestroyed()) {
            browser.webContents.send('post-data', req.body);
            if (browser?.isMinimized()) {
                browser.restore();
            }
            browser.focus();
        }
        res.json({ status: 'ok' });
    });

    server.listen(4567, '127.0.0.1', () => {
        console.log('Server listening on http://127.0.0.1:4567');
        browser.setTitle(`mb-calc v${packageJson.version} : 4567`);
    });
});

app.on('window-all-closed', () => {
    app.quit();
});