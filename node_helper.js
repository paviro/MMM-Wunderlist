"use strict";

/* Magic Mirror
 * Module: MMM-Wunderlist
 *
 * By Paul-Vincent Roll http://paulvincentroll.com
 * MIT Licensed.
 */

var NodeHelper = require("node_helper");
const Fetcher = require("./fetcher.js");

var WunderlistSDK = require("wunderlist");

module.exports = NodeHelper.create({
	start: function() {
		this.instances = [];
		this.startedInstances = 0;
		this.allModulesLoaded = false;
		this.lists = [];
		this.fetchers = {};
		this.configs = [];
	},
	getLists: function(options, callback) {
		var self = this;
		var wunderlist = new WunderlistSDK({
			accessToken: options.accessToken,
			clientID: options.clientID
		});

		wunderlist.http.lists
			.all()
			.done(function(lists) {
				callback(lists);
			})
			.fail(function(resp, code) {
				console.error("there was a Wunderlist problem", code);
			});
	},

	getUsers: function(callback) {
		this.WunderlistAPI.http.users
			.all()
			.done(function(users) {
				var ret = {};
				users.forEach(function(user) {
					ret[user.id] = user.name[0];
				});
				callback(ret);
			})
			.fail(function(resp, code) {
				console.error("there was a Wunderlist problem", code);
			});
	},

	getDisplayedListIDs: function(lists, config) {
		var listIDs = [];
		lists.forEach(function(list) {
			if (config.lists.includes(list.title)) {
				listIDs.push(list.id);
			}
		});
		return listIDs;
	},

	addLists: function(lists, config) {
		var self = this;
		lists.forEach(function(list) {
			var exists = self.lists.some(function(element) {
				return element.id == list.id;
			});
			if (!exists && config.lists.includes(list.title)) {
				self.lists.push(list);
				self.configs[list.id] = config;
			}
		});
	},

	createFetcher: function(list, config) {
		var fetcher;
		if (typeof this.fetchers[list.id] === "undefined") {
			var self = this;

			console.log(
				"Create new todo fetcher for list: " +
					list.title +
					" - Interval: " +
					config.interval * 1000
			);
			fetcher = new Fetcher(
				list.id,
				config.interval * 1000,
				config.accessToken,
				config.clientID,
				config.language,
				config.deadlineFormat
			);

			fetcher.onReceive(function(fetcher) {
				self.broadcastTodos();
			});

			fetcher.onError(function(fetcher, error) {
				self.sendSocketNotification("FETCH_ERROR", {
					url: fetcher.id(),
					error: error
				});
			});

			this.fetchers[list.id] = {
				listID: list.id,
				instance: fetcher
			};
		} else {
			console.log("Use exsisting todo fetcher for list: " + list);
			fetcher = this.fetchers[list.id].instance;
			fetcher.setReloadInterval(config.interval);
			fetcher.broadcastItems();
		}

		fetcher.startFetch();
	},

	broadcastTodos: function() {
		var todos = {};
		for (var f in this.fetchers) {
			todos[this.fetchers[f].listID] = this.fetchers[f].instance.items();
		}
		this.sendSocketNotification("RETRIEVED_TODOS", todos);
	},

	allInstancesStarted: function() {
		return (
			this.allModulesLoaded && this.startedInstances == this.instances.length
		);
	},

	createFetchers: function() {
		const self = this;
		this.lists.forEach(function(list) {
			self.createFetcher(list, self.configs[list.id]);
		});
	},

	registerInstance: function(id, config) {
		const self = this;
		this.instances.push(id);
		this.getLists(config, function(lists) {
			self.addLists(lists, config);
			var displayedListIDs = self.getDisplayedListIDs(lists, config);
			self.sendSocketNotification("RETRIEVED_LIST_IDS", {
				id,
				displayedListIDs
			});
			self.startedInstances++;
			if (self.allInstancesStarted()) {
				self.createFetchers();
			}
		});
	},

	// Subclass socketNotificationReceived received.
	socketNotificationReceived: function(notification, payload) {
		const self = this;
		if (notification === "REGISTER_INSTANCE") {
			this.registerInstance(payload.id, payload.config);
		} else if (notification === "ALL_MODULES_STARTED") {
			this.allModulesLoaded = true;
		} else if (notification === "getUsers") {
			this.getUsers(function(data) {
				self.sendSocketNotification("users", data);
			});
		}
	}
});
