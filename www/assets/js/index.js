var ipc      = require('ipc');
var shell    = require('shell');
var moment   = require('moment');
var mustache = require('mustache');

var data;
var timer;
var view       = 'schedule';
var divider    = ['Heute', 'Morgen'];
var main       = document.querySelector('#main');
var menu       = document.querySelector('#menu');
var menuTpl    = document.querySelector('#tpl-menu').innerHTML;
var listTpl    = document.querySelector('#tpl-list').innerHTML;
var aboutTpl   = document.querySelector('#tpl-about').innerHTML;
var errorTpl   = document.querySelector('#tpl-error').innerHTML;
var loadingTpl = document.querySelector('#tpl-loading').innerHTML;

var initLinks = function() {
	[].forEach.call(document.querySelectorAll('a[target=_blank]'), function(link) {
		link.onclick = function(event) {
			event.preventDefault();

			shell.openExternal(this.href);
		}
	});
};

var initMenu = function(title) {
	menu.innerHTML = mustache.render(menuTpl, {
		title: title
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
			ipc.send('icon', 'icon');
		}
	}, timeEnd);
};

var updateTime = function() {
	var time;

	[].forEach.call(main.querySelectorAll('ul li[data-id]'), function(item) {
		time = item.querySelector('time');

		time.innerHTML = moment(time.getAttribute('datetime')).fromNow();
	});
};

var updateProgress = function() {
	var item     = data.schedule[0];
	var node     = main.querySelector('ul li[data-id]');
	var icon     = node.querySelector('.icon');
	var done     = (moment().format('X') - moment(item.timeStart).format('X'));
	var percent  = 100 / item.length * done;
	var progress = '-webkit-gradient(linear, left top, right top, color-stop('
	             + percent + '%, rgba(0, 0, 0, .05)), color-stop(' + percent
							 + '%, transparent))';

	icon.classList.add('ion-ios-play');
	node.style.background = progress;
};

var updateNotifications = function() {
	var id;

	[].forEach.call(main.querySelectorAll('ul li[data-id]'), function(node) {
		id = parseInt(node.getAttribute('data-id'));

		if(storage.filter('notifies', { id: id }).length > 0) {
			showNotification(node, id);
		}
	});
};

var showNotification = function(node, id) {
	var icon = node.querySelector('.icon');

	icon.classList.add('ion-android-radio-button-on');
};

var hideNotification = function(node, id) {
	var icon = node.querySelector('.icon');

	icon.classList.remove('ion-android-radio-button-on');
};

var showAbout = function() {
	if(view == 'about') return update();

	view = 'about';
	main.innerHTML = mustache.render(aboutTpl, {});

	initLinks();
};

var update = function() {
	ipc.send('schedule');
	main.innerHTML = mustache.render(loadingTpl, {});
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

ipc.on('error', function(error) {
	main.innerHTML = mustache.render(errorTpl, {
		title: 'Fehler: ' + error.errno,
		message: 'Fehler: ' + error.errno
	});
});

ipc.on('schedule', function(json) {
	data = JSON.parse(json);

	data.schedule.forEach(function(item) {
		item.time     = moment(item.timeStart).format('H:mm');
		item.relative = moment(item.timeStart).fromNow();
		item.live     = ~item.type.indexOf('live');
		item.premiere = ~item.type.indexOf('premiere');
		item.icon     = (item.live) ? 'live' : (item.premiere) ? 'premiere' : 'icon';
	});

	var days = [];

	data.schedule.forEach(function(item) {
		var delta = moment(item.timeStart).dayOfYear() - moment().dayOfYear();

		if(!(delta in days)) days[delta] = {
			delta: delta,
			date: (divider[delta]) ? divider[delta] : moment(item.timeStart).format('DD.MM.YYYY'),
			data: []
		};

		days[delta].data.push(item);
	});

	view = 'schedule';
	main.innerHTML = mustache.render(listTpl, days);

	initMenu('YARBS');
	initLinks();
	updateTime();
	updateProgress();
	updateNotifications();
	updateDividerPositions();

	if(data.schedule.length > 0) {
		initTimer(data.schedule[0]);
	}
});

update();

setInterval(function() {
	if(data.schedule.length > 0) {
		updateTime();
		updateProgress();
	}
}, 30000);

setInterval(update, 300000);
