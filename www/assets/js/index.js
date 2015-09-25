var ipc      = require('ipc');
var shell    = require('shell');
var moment   = require('moment');
var mustache = require('mustache');

var timer;
var data       = {};
var dividers   = [];
var timePause  = 1;
var view       = 'schedule';
var title      = 'YARBS';
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
	var timeEnd = (moment(item.timeEnd).format('x') - moment().format('x'));

	clearTimeout(timer);

	timer = setTimeout(function() {
		var list = main.querySelector('.list');

		if(data.schedule.length > 0) {
			list.removeChild(list.querySelector('.item-pause, .item[data-id]'));
			data.schedule.splice(0, 1);
		}

		updateIcon();

		if(data.schedule.length > 0) {
			initTimer(data.schedule[0]);
			showPlay(list.querySelector('.item[data-id] .icon'));

			if(storage.filter('notifies', { id: data.schedule[0].id }).length > 0) {
				ipc.send('notify', data.schedule[0]);
				storage.deleteFilter('notifies', { id: data.schedule[0].id });
			}
		}
	}, timeEnd);
};

var updateTime = function() {
	var time;

	[].forEach.call(main.querySelectorAll('.item[data-id]'), function(item) {
		time = item.querySelector('time');

		time.innerHTML = moment(time.getAttribute('datetime')).fromNow();
	});
};

var updateIcon = function() {
	ipc.send('icon', (data.schedule.length > 0) ? data.schedule[0].icon : 'icon');
};

var updateProgress = function() {
	var item     = data.schedule[0];
	var node     = main.querySelector('.item-pause, .item[data-id]');
	var done     = (moment().format('X') - moment(item.timeStart).format('X'));
	var percent  = 100 / item.length * done;
	var progress = 'linear-gradient(to right, #f2f2f2 ' + percent + '%, transparent ' + percent + '%)';

	if(node) {
		node.style.background = progress;
	}
};

var updateNotifications = function() {
	var id;

	[].forEach.call(main.querySelectorAll('.item[data-id]'), function(node) {
		id = parseInt(node.getAttribute('data-id'));

		if(storage.filter('notifies', { id: id }).length > 0) {
			showNotification(node, id);
		}
	});
};

var updateDividers = function() {
	dividers = main.querySelectorAll('.item.item-divider');
};

var showNotification = function(node, id) {
	var icon = node.querySelector('.icon');

	icon.classList.add('ion-android-radio-button-on');
};

var hideNotification = function(node, id) {
	var icon = node.querySelector('.icon');

	icon.classList.remove('ion-android-radio-button-on');
};

var showPlay = function(icon) {
	icon.classList.remove('ion-android-radio-button-on');
	icon.classList.remove('ion-android-radio-button-off');
	icon.classList.add('ion-ios-play');
};

var showAbout = function() {
	if(view == 'about') return update(true);

	view = 'about';
	main.innerHTML = mustache.render(aboutTpl, {});

	initLinks();
};

var update = function(silent) {
	silent = silent || false;

	ipc.send('schedule');

	if(!silent) {
		main.innerHTML = mustache.render(loadingTpl, {});
	}
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

var quit = function() {
	ipc.send('quit');
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
		item.time     = moment(item.timeStart).format('H:mm') + ' - ' + moment(item.timeEnd).format('H:mm');
		item.relative = moment(item.timeStart).fromNow();
		item.live     = ~item.type.indexOf('live');
		item.premiere = ~item.type.indexOf('premiere');
		item.icon     = (item.live) ? 'live' : (item.premiere) ? 'premiere' : 'icon';
	});

	var temp = [];
	var timeEnd;

	data.schedule.forEach(function(item, i) {
		if(i > 0 && moment(item.timeStart).diff(timeEnd, 'minute') > timePause) {
			temp.push({
				id: 0,
				title: 'Pause',
				pause: true,
				length: moment(item.timeStart).diff(timeEnd, 'minute'),
				time: moment(timeEnd).format('H:mm') + ' - ' + moment(item.timeStart).format('H:mm'),
				timeStart: timeEnd,
				timeEnd: item.timeStart
			});
		}

		temp.push(item);

		timeEnd = item.timeEnd;
	});

	data.schedule = temp;

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
	showPlay(main.querySelector('.item[data-id] .icon'));

	initMenu(title);
	updateTime();
	updateIcon();
	updateProgress();
	updateDividers();
	updateHeadline();
	updateNotifications();
	initLinks();

	if(data.schedule.length > 0) {
		initTimer(data.schedule[0]);
	}
});

update();

setInterval(function() {
	if(data.schedule && data.schedule.length > 0) {
		updateTime();
		updateProgress();
	}
}, 30000);

setInterval(update, 300000);
