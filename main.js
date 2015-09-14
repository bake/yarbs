var ipc     = require('ipc');
var shell   = require('shell');
var menubar = require('menubar');
var notify  = require('node-notifier');
var rbtv    = require('./rbtv');
var config  = require('./config');

var mb = menubar(config.menubar);

// https://github.com/atom/electron/blob/master/docs/api/frameless-window.md#limitations
// http://peter.sh/experiments/chromium-command-line-switches/#enable-transparent-visuals
mb.app.commandLine.appendSwitch('disable-gpu');
mb.app.commandLine.appendSwitch('enable-transparent-visuals');

mb.on('ready', function() {
	mb.tray.setToolTip('YARBS');

	mb.window.on('blur', function() {
		mb.hideWindow();
	});
});

ipc.on('schedule', function(event) {
	rbtv.get('schedule', function(json) {
		event.sender.send('schedule', json);
	}, function(error) {
		event.sender.send('error', error);
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
