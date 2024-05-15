const { app, BrowserWindow, desktopCapturer } = require('electron');
const path = require('path');

let win;

const createWindow = () => {
    win = new BrowserWindow({
        width: 1000,
        height: 840,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    })
    win.setFullScreen(true);
    
    win.loadFile('index.html')

    // win.webContents.send('SET_SOURCE')

}

app.whenReady().then(() => {
    createWindow()

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
      })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
})


// desktopCapturer.getSources({ types: ['window', 'screen'] }).then(async sources => {
//     for (const source of sources) {
//         if (source.name === 'Electron') {
//             return
//         }
//     }
// })



// (
//     () => {

//     }
// )()