var ipc      = require('ipc');
var shell    = require('shell');
var moment   = require('moment');
var mustache = require('mustache');

var data;
var timer;
var style    = document.createElement('style');
var main     = document.querySelector('#main');
var viewIcon = document.querySelector('.icon-toggle-view');
var listTpl  = document.querySelector('#tpl-list').innerHTML;

document.head.appendChild(style);

var initLinks = function() {
	[].forEach.call(document.querySelectorAll('a[target=_blank]'), function(link) {
		link.onclick = function(event) {
			event.preventDefault();

			shell.openExternal(this.href);
		}
	});
};

var initTimer = function(item) {
	var timeEnd = (moment(item.timeEnd).format('X') - moment().format('X')) * 1000;

	clearTimeout(timer);

	timer = setTimeout(function() {
		var list = main.querySelector('.list');

		if(data.schedule.length > 0) {
			list.removeChild(list.querySelector('.item'));
			data.schedule.splice(0, 1);
		}

		if(data.schedule.length > 0) {
			initTimer(data.schedule[0]);
			ipc.send('icon', data.schedule[0].icon);

			if(storage.filter('notifies', { id: data.schedule[0].id }).length > 0) {
				ipc.send('notify', data.schedule[0]);
				storage.deleteFilter('notifies', { id: data.schedule[0].id });
				hideNotification(list.querySelector('.item'), data.schedule[0].id);
			}
		} else {
			ipc.send('icon', '');
		}
	}, timeEnd);
};

var updateTime = function() {
	var time;

	[].forEach.call(main.querySelectorAll('ul li'), function(item) {
		time = item.querySelector('time');

		time.innerHTML = moment(time.getAttribute('datetime')).fromNow();
	});
};

var updateProgress = function() {
	var item     = data.schedule[0];
	var done     = (moment().format('X') - moment(item.timeStart).format('X'));
	var percent  = 100 / item.length * done;
	var progress = '-webkit-gradient(linear, left top, right top, color-stop('
	             + percent + '%, rgba(0, 0, 0, .15)), color-stop(' + percent
							 + '%, transparent))';

	main.querySelector('ul li').style.background = progress;
};

var updateNotifications = function() {
	var id;

	[].forEach.call(main.querySelectorAll('ul li'), function(node) {
		id = parseInt(node.getAttribute('data-id'));

		if(storage.filter('notifies', { id: id }).length > 0) {
			showNotification(node, id);
		}
	});
};

var showNotification = function(node, id) {
	var icon = node.querySelector('.icon');

	icon.classList.add('ion-android-notifications');
};

var hideNotification = function(node, id) {
	var icon = node.querySelector('.icon');

	icon.classList.remove('ion-android-notifications');
};

var update = function() {
	ipc.send('schedule');
};

var toggleView = function() {
	storage.set('view', (storage.get('view') == 'simple') ? 'all' : 'simple');

	setView(storage.get('view'));
};

var setView = function(view) {
	if(storage.get('view') == 'simple') {
		showViewSimple();
	} else if(storage.get('view') == 'all') {
		showViewAll();
	}
};

var showViewAll = function() {
	if(style.sheet.rules.length > 0) {
		for(var i = style.sheet.rules.length - 1; i >= 0; i--) {
			style.sheet.deleteRule(i);
		}
	}

	viewIcon.classList.add('ion-ios-glasses');
	viewIcon.classList.remove('ion-ios-glasses-outline');
};

var showViewSimple = function() {
	style.sheet.insertRule('.item .show { height: 0!important; opacity: 0; }', 0);

	viewIcon.classList.add('ion-ios-glasses-outline');
	viewIcon.classList.remove('ion-ios-glasses');
};

var toggleNotification = function(node, id) {
	id = parseInt(id);

	if(storage.filter('notifies', { id: id }).length > 0) {
		hideNotification(node, id);
		storage.deleteFilter('notifies', { id: id });
	} else if(data.schedule[0].id != id) {
		showNotification(node, id);
		storage.add('notifies', getItem(id));
	}
};

var getItem = function(id) {
	return data.schedule.filter(function(item) {
		return item.id == id;
	})[0];
};

ipc.on('schedule', function(json) {
	data = JSON.parse(json);

	data.schedule.forEach(function(item) {
		item.time     = moment(item.timeStart).format('H:mm');
		item.relative = moment(item.timeStart).fromNow();
		item.live     = ~item.type.indexOf('live');
		item.premiere = ~item.type.indexOf('premiere');
		item.icon     = (item.live) ? 'live' : (item.premiere) ? 'premiere' : 'icon';
	});

	main.innerHTML = mustache.render(listTpl, data);

	updateTime();
	updateProgress();
	updateNotifications();
	initTimer(data.schedule[0]);
	setView(storage.get('view') || 'simple');

	ipc.send('icon', data.schedule[0].icon);
});

update();
initLinks();

setInterval(function() {
	if(data.schedule.length > 0) {
		updateTime();
		updateProgress();
	}
}, 30000);

setInterval(update, 300000);
