var storage = {
	get: function(collection) {
		var data = localStorage.getItem(collection);

		if(data === null)
			return [];

		return JSON.parse(data);
	},
	filter: function(collection, query) {
		var data  = this.get(collection);
		var index = 0;

		data = data.filter(function(item) {
			item['_index'] = index++;

			for(var key in query) {
				if(item[key] !== query[key]) {
					return false;
				}
			}

			return true;
		});

		return data;
	},
	add: function(collection, value) {
		var data = this.get(collection);

		data.push(value);
		this.set(collection, data);
	},
	set: function(collection, data) {
		localStorage.setItem(collection, JSON.stringify(data));
	},
	delete: function(collection, index) {
		var data = this.get(collection);

		data.splice(index, 1);
		this.set(collection, data);
	},
	deleteFilter: function(collection, query) {
		var data    = this.get(collection);
		var indexes = this.filter(collection, query).reverse();

		indexes.forEach(function(item) {
			data.splice(item['_index'], 1);
		});

		this.set(collection, data);
	}
};
