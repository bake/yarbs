var ipc      = require('ipc');
var moment   = require('moment');
var mustache = require('mustache');

var data     = {};
var notifies = [];
var style    = document.createElement('style');
var main     = document.querySelector('#main div');
var tpls     = {
	list: document.querySelector('#tpl-list').innerHTML
};

document.head.appendChild(style);

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
	var progress = '-webkit-gradient(linear, left top, right top, color-stop(' + percent + '%, rgba(0, 0, 0, .15)), color-stop(' + percent + '%, transparent))';

	main.querySelector('ul li').style.background = progress;
};

var update = function() {
	ipc.send('schedule');
};

var toggleView = function() {
	if(style.sheet.rules.length > 0) {
		style.sheet.deleteRule(0);
	} else {
		style.sheet.insertRule('.show { display: none; }', 0);
	}
};

var toggleNotification = function(node, id) {
	var icon = node.querySelector('.icon');

	if(notifies[id] !== undefined) {
		deleteNotification(icon, id);
	} else {
		addNotification(icon, id);
	}
};

deleteNotification = function(icon, id) {
	notifies[id] = undefined;

	clearInterval(notifies[id]);

	icon.classList.remove('ion-android-notifications');
};

addNotification = function(icon, id) {
	var item  = getItem(id);
	var sleep = (moment(item.timeStart).format('X') - moment().format('X')) * 1000;

	if(sleep < 0) {
		return;
	}

	icon.classList.add('ion-android-notifications');

	notifies[id] = setTimeout(function() {
		ipc.send('notify', item);
		deleteNotification(icon, item.id);
	}, sleep, icon, item);
};

var getItem = function(id) {
	return data.schedule.filter(function(item) {
		return item.id == id;
	})[0];
};

ipc.on('schedule', function(json) {
	data = JSON.parse(json);

	data.schedule.forEach(function(item) {
		item.time = moment(item.timeStart).fromNow();
		item.live = ~item.type.indexOf('live');
		item.premiere = ~item.type.indexOf('premiere');
	});

	main.innerHTML = mustache.render(tpls.list, data);

	updateTime();
	updateProgress();
});

update();

setInterval(function() {
	updateTime();
	updateProgress();
}, 30000);

setInterval(update, 300000);
