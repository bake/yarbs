var updateHeadline = function() {
	var offset = main.getBoundingClientRect().top;

	for(var i = divider.length - 1; i >= 0; i--) {
		var clientRect = dividers[i].getBoundingClientRect();

		if(clientRect.top - offset <= 0) {
			var h1 = dividers[i].querySelector('h1').innerHTML;

			if(title != h1) {
				initMenu(h1);
			}

			return;
		}
	}
};

main.onscroll = updateHeadline;
