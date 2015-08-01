var ipc     = require('ipc');
var shell   = require('shell');
var menubar = require('menubar');
var notify  = require('node-notifier');
var rbtv    = require('./rbtv');
var config  = require('./config');

ipc.on('schedule', function(event) {
  rbtv.get('schedule', function(json) {
  	event.sender.send('schedule', json);
  });
});

ipc.on('notify', function(event, item) {
  notify.notify({
    title: item.title,
    message: item.show
  });
});

menubar(config.menubar).on('ready', function ready () {
  console.log('app is ready');
});

notify.on('click', function() {
  shell.openExternal(config.stream);
});
