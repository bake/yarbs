var ipc     = require('ipc');
var shell   = require('shell');
var menubar = require('menubar');
var notify  = require('node-notifier');
var rbtv    = require('./rbtv');
var config  = require('./config');

var mb = menubar(config.menubar);

ipc.on('schedule', function(event) {
  rbtv.get('schedule', function(json) {
  	event.sender.send('schedule', json);
  });
});

ipc.on('notify', function(event, item) {
  notify.notify({
    title: item.title,
    message: item.show,
    sound: true
  });
});

ipc.on('icon', function(event, icon) {
  mb.tray.setImage(config.icons[icon]);
});
