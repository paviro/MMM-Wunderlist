"use strict";

/* Magic Mirror
 * Module: MMM-Wunderlist
 *
 * By Paul-Vincent Roll http://paulvincentroll.com
 * MIT Licensed.
 */

const NodeHelper = require("node_helper");
const Fetcher = require("./fetcher.js");

var WunderlistSDK = require("wunderlist");

module.exports = NodeHelper.create({
	start: function() {
		this.instances = [];
		this.startedInstances = 0;
		this.allModulesLoaded = false;
		this.lists = [];
		this.config = [];
		this.fetchers = {};
		this.started = false;
		this.accounts = {};
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
				var result = lists.map(function(list) {
					var o = Object.assign({}, list);
					list.options = options;
					return list;
				});
				self.addLists(result);
				self.notifyCallingInstance(result);
				callback(result);
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
	notifyCallingInstance: function(lists){
		if (lists[0] != undefined) {
			var callerID = lists[0].options.id
			var shownLists = []
			lists.forEach(function(newList){
				if (newList.options.lists.includes(newList.title)){
					shownLists.push(newList.id)
				}
			})
			this.sendSocketNotification("SHOW_LISTS", {callerID, shownLists});
		}
	},

	addLists: function(newLists) {
		var self = this;
		newLists.forEach(function(newList) {
			var exists = self.lists.some(function(element) {
				return element.id == newList.id;
			});
			if (!exists) {
				if (newList.options.lists.includes(newList.title)) {
					self.lists.push(newList);
				}
			}
		});
	},

	createFetcher: function(list) {
		var fetcher;

		if (typeof this.fetchers[list.id] === "undefined") {
			var self = this;

			console.log(
				"Create new todo fetcher for list: " +
					list.title +
					" - Interval: " +
					list.options.interval
			);
			fetcher = new Fetcher(
				list.id,
				list.options.interval,
				list.options.accessToken,
				list.options.clientID,
				list.options.language,
				list.options.deadlineFormat
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
				name: list.id,
				instance: fetcher
			};
		} else {
			console.log("Use exsisting todo fetcher for list: " + list);
			fetcher = this.fetchers[list.id].instance;
			fetcher.setReloadInterval(list.options.interval);
			fetcher.broadcastItems();
		}

		fetcher.startFetch();
	},

	broadcastTodos: function() {
		var todos = {};
		for (var f in this.fetchers) {
			todos[this.fetchers[f].name] = this.fetchers[f].instance.items();
		}
		this.sendSocketNotification("TASKS", todos);
	},

	determineFullyStarted() {
		const self = this;
		if (
			this.allModulesLoaded &&
			this.startedInstances == this.instances.length
		) { 	this.lists.forEach(function(currentValue) {
				self.createFetcher(currentValue);
			});
		}
	},

	// Subclass socketNotificationReceived received.
	socketNotificationReceived: function(notification, payload) {
		const self = this;

		if (notification === "REGISTER_INSTANCE") {
			var instance = {};
			instance = payload.config;
			instance.id = payload.id;
			this.getLists(payload.config, function(data) {
				self.startedInstances++;
				self.determineFullyStarted();
			});

			this.instances.push(instance);
		}

		if (notification === "CONNECT" && this.started == false) {
			this.config = payload.config;
			this.WunderlistAPI = new WunderlistSDK({
				accessToken: self.config.accessToken,
				clientID: self.config.clientID
			});

			this.getLists(function(data) {
				self.lists = data;
				self.sendSocketNotification("RETRIEVED_LISTS");
			});
			self.started = true;
		}
		if (notification === "CONFIG") {
			this.instances[payload.id] = payload.config;
		} else if (notification === "addLists") {
			this.lists.forEach(function(currentValue) {
				if (self.lists.indexOf(currentValue) >= 0) {
					self.createFetcher(
						currentValue.id,
						currentValue.title,
						self.config.interval * 1000
					);
				}
			});
		} else if (notification === "CONNECTED") {
			this.broadcastTodos();
		} else if (notification === "ALL_MODULES_STARTED") {
			this.allModulesLoaded = true;
		} else if (notification === "getUsers") {
			this.getUsers(function(data) {
				self.sendSocketNotification("users", data);
			});
		}
	}
});
