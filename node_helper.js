"use strict";

/* Magic Mirror
 * Module: MMM-Wunderlist
 *
 * By Paul-Vincent Roll http://paulvincentroll.com
 * MIT Licensed.
 */

var Wunderlist = require("./wunderlist-api");
var NodeHelper = require("node_helper");
const Fetcher = require("./fetcher.js");

module.exports = NodeHelper.create({
	start: function() {
		this.instances = [];
		this.startedInstances = 0;
		this.allModulesLoaded = false;
		this.lists = [];
		this.users = {};
		this.fetchers = {};
		this.configs = {};
	},
	getLists: function(options, callback) {
		var self = this;
		var wunderlist = new Wunderlist(options.clientID, options.accessToken);
		wunderlist
			.retrieveLists()
			.then(function(lists) {
				callback(lists);
			})
			.catch(function(err) {
				console.error(
					"MMM-Wunderlist: Failed to retrieve lists for clientID:" +
						options.clientID +
						" - accessToken:  " +
						options.accessToken +
						"Reason: " +
						err.stack
				);
			});
	},

	determineAccounts: function(configs) {
		var accounts = [];
		Object.keys(configs).forEach(function(listID) {
			if (
				!accounts.some(account => account.clientID === configs[listID].clientID)
			) {
				accounts.push({
					clientID: configs[listID].clientID,
					accessToken: configs[listID].accessToken
				});
			}
		});
		return accounts;
	},
	addUsers: function(users) {
		var self = this;
		users.forEach(function(user) {
			self.users[user.id] = user.name[0];
		});
	},

	getUsers: function(accounts) {
		var self = this;
		var retrievedAccounts = 0;
		accounts.forEach(function(account) {
			var wunderlist = new Wunderlist(account.clientID, account.accessToken);
			wunderlist
				.retrieveUsers()
				.then(function(users) {
					retrievedAccounts++;
					self.addUsers(users);
					if (retrievedAccounts == accounts.length) {
						self.sendSocketNotification("users", self.users);
					}
				})
				.catch(function(err) {
					console.error(
						"MMM-Wunderlist: Failed to retrieve users for clientID:" +
							account.clientID +
							" - accessToken:  " +
							account.accessToken +
							"Reason: " +
							err.stack
					);
				});
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
				"MMM-Wunderlist: Create new todo fetcher for list: " +
					list.title +
					" - Account: " +
					config.clientID +
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
			console.log("MMM-Wunderlist: Use exsisting todo fetcher for list: " + list.id);
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
				self.getUsers(self.determineAccounts(self.configs));
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
		}
	}
});
