const { app, BrowserWindow, Tray, Menu, MenuItem } = require('electron');
const path = require('path');

// Handle creating/removing shortcuts wheb installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

let mainWindow;
let appIcon;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1350,
    height: 745,
    backgroundColor: '#45c6bc',
    icon: path.join(__dirname, 'assets/doughnut.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });


  const handleSelectSerialPort = (event, portList, webContents, callback) => {
    console.log('select-serial-port FIRED WITH', portList);
    console.log('portlist:', portList);

    event.preventDefault();
    const arduino = portList.find(
      (port) =>
        port.displayName && port.displayName.toLowerCase().includes('arduino')
    );
    if (arduino) {
      callback(arduino.portId);
    } else {
      callback(''); //Could not find any matching devices
    }
  };

  mainWindow.webContents.session.on(
    'select-serial-port',
    handleSelectSerialPort
  );

  mainWindow.on('close', () => {
    mainWindow.webContents.session.removeListener(
      'select-serial-port',
      handleSelectSerialPort
    );
  });


  // mainWindow.loadFile(path.join(__dirname, './public/index.html'));
  mainWindow.loadURL('http://localhost:8443'); // load electron from backend

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {

  //submenu -> array -> each array can have array of submenus with label objects
  //click: listen to click event on submenu
  //type seperator: add horizontal line between the labels
  //
  const appIcon = new Tray('/assets/doughnut.png');
  console.log(appIcon);
  app.dock.setIcon(appIcon);

  const menuTemplate = [
    {
      label: app.name,
      submenu: [
        {
          role: 'Close',
        },
        { type: 'separator' },
        { role: 'Quit' },
      ],
    },
    {
      label: 'File',
      submenu: [
        {
          label: 'New Window',
          click: createWindow,
        },
        { label: 'Close Window', role: 'Close' },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'pasteAndMatchStyle' },
        { role: 'delete' },
        { role: 'selectAll' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { type: 'separator' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);

  //create Context Menu/(right click menu):
  const contextMenuTemplate = [
    { role: 'cut' },
    { role: 'copy' },
    { role: 'paste' },
    { role: 'selectAll' },
  ];

  const contextMenu = Menu.buildFromTemplate(contextMenuTemplate);

  createWindow();

  mainWindow.webContents.on('context-menu', (event, params) => {
    contextMenu.popup(mainWindow, params.x, params.y); //coordinates of where the mouse was right clicked
  });
  //need to attach this to the webcontext property of the browser window

 
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
