"use strict";

/* Magic Mirror
 * Fetcher
 *
 * By Michael Teeuw http://michaelteeuw.nl edited for Wunderlist by Marcin Bielecki
 * MIT Licensed.
 */

var Wunderlist = require("./wunderlist-api");
var moment = require("moment");

/* Fetcher
 * Responsible for requesting an update on the set interval and broadcasting the data.
 *
 * attribute listID string - ID of the Wunderlist list.
 * attribute reloadInterval number - Reload interval in milliseconds.
 */

var Fetcher = function(
	listID,
	reloadInterval,
	accessToken,
	clientID,
	language,
	format
) {
	moment.locale(language);

	var self = this;
	if (reloadInterval < 1000) {
		reloadInterval = 1000;
	}

	var reloadTimer = null;
	var items = [];
	var revision = 0;
	var wunderlist = new Wunderlist(clientID, accessToken);

	var fetchFailedCallback = function() {};
	var itemsReceivedCallback = function() {};

	/* private methods */

	/* fetchTodos()
   * Request the new items.
   */

	var fetchTodos = function(wunderlist) {
		clearTimeout(reloadTimer);
		reloadTimer = null;

		fetchList(wunderlist, listID)
			.then(function(list) {
				if (list.revision > revision || revision == 0) {
					wunderlist
						.retrieveTodos(listID)
						.then(function(tasks) {
							items = localizeTasks(tasks);
							self.broadcastItems();
							scheduleTimer();
						})
						.catch(function(err) {
							// Wunderlist is known to occasionally have interal server-errors
							if (isWunderlistAPIError(err) && revision != 0) {
								console.log("Wunderlist returned an internal server-error. Recovering.")
								scheduleTimer();
							} else {
								console.error(
									"Failed to retrieve list: " +
										listID +
										" - accessToken: " +
										accessToken +
										" - clientID: " +
										clientID +
										"Reason: " +
										err.stack
								);
							}
						});
				} else {
					scheduleTimer();
				}

				revision = list.revision;
			})
			.catch(function(err) {
				// Wunderlist is known to occasionally have interal server-errors
				if (isWunderlistAPIError(err) && revision != 0) {
					console.log("Wunderlist returned an internal server-error. Recovering.")
					scheduleTimer();
				} else {
					console.error(
						"Failed to retrieve status for list: " +
							listID +
							" - accessToken: " +
							accessToken +
							" - clientID: " +
							clientID +
							"Reason: " +
							err.stack
					);
				}
			});
	};

	var isWunderlistAPIError = function(err) {
		return err.statusCode == 500;
	};

	var fetchList = function(wunderlist, listID) {
		return new Promise(function(resolve, reject) {
			wunderlist
				.retrieveList(listID)
				.then(function(list) {
					resolve(list);
				})
				.catch(function(err) {
					reject(err);
				});
		});
	};

	/* localizeTasks(tasks)
   * Localize the given array of tasks
   */

	var localizeTasks = function(tasks) {
		tasks.forEach(function(task) {
			task.due_date = moment(task.due_date).format(format);
			task.created_at = moment(task.created_at).format(format);
		});
		return tasks;
	};

	/* scheduleTimer()
   * Schedule the timer for the next update.
   */

	var scheduleTimer = function() {
		clearTimeout(reloadTimer);
		reloadTimer = setTimeout(function() {
			fetchTodos(wunderlist);
		}, reloadInterval);
	};

	/* public methods */

	/* setReloadInterval()
   * Update the reload interval, but only if we need to increase the speed.
   *
   * attribute interval number - Interval for the update in milliseconds.
   */
	this.setReloadInterval = function(interval) {
		if (interval > 1000 && interval < reloadInterval) {
			reloadInterval = interval;
		}
	};

	/* startFetch()
   * Initiate fetchTodos();
   */
	this.startFetch = function() {
		fetchTodos(wunderlist);
	};

	/* broadcastItems()
   * Broadcast the exsisting items.
   */
	this.broadcastItems = function() {

		itemsReceivedCallback(self);
	};

	this.onReceive = function(callback) {
		itemsReceivedCallback = callback;
	};

	this.onError = function(callback) {
		fetchFailedCallback = callback;
	};

	this.id = function() {
		return listID;
	};

	this.items = function() {
		return items;
	};
};

module.exports = Fetcher;
