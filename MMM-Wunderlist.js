"use strict";
/* global Module */

/* Magic Mirror
 * Module: MMM-Wunderlist
 *
 * By Paul-Vincent Roll http://paulvincentroll.com
 * MIT Licensed.
 */

Module.register("MMM-Wunderlist", {
	defaults: {
		maximumEntries: 10,
		order: "normal",
		lists: ["inbox"],
		interval: 60,
		fade: true,
		fadePoint: 0.25,
		showDeadline: false,
		showAssignee: false,
		deadlineFormat: "L"
	},

	notificationReceived: function(notification, payload, sender) {
		if (notification === "ALL_MODULES_STARTED") {
			this.sendSocketNotification("ALL_MODULES_STARTED");
		}
	},

	// Override socket notification handler.
	socketNotificationReceived: function(notification, payload) {
		if (notification === "RETRIEVED_TODOS") {
			this.lists = payload;
			this.updateDom(3000);
		} else if (
			notification === "RETRIEVED_LIST_IDS" &&
			payload.id == this.identifier
		) {
			this.listIDs = payload.displayedListIDs;
			this.started = true
		} else if (notification === "users") {
			this.users = payload;
			if (this.tasks && this.tasks.length > 0) {
				this.updateDom(3000);
			}
		}
	},

	start: function() {
		this.lists = [];
		this.listIDs = [];

		// Use global language per default
		if (this.config.language == null) {
			this.config.language = config.language;
		}

		var payload = {
			id: this.identifier,
			config: this.config
		};
		this.sendSocketNotification("REGISTER_INSTANCE", {
			id: this.identifier,
			config: this.config
		});
		Log.info("Starting module: " + this.name + this.identifier);
	},

	getTodos: function() {
		var tasksShown = [];
		for (var i = 0; i < this.listIDs.length; i++) {
			if (typeof this.lists[this.listIDs[i]] != "undefined") {
				var list = this.lists[this.listIDs[i]];
				for (var todo in list) {
					if (this.config.order == "reversed") {
						tasksShown.push(list[todo]);
					} else {
						tasksShown.unshift(list[todo]);
					}
				}
			}
		}
		return tasksShown.slice(0, this.config.maximumEntries);
	},

	getScripts: function() {
		return ["String.format.js"];
	},
	getStyles: function() {
		return ["font-awesome.css"];
	},

	html: {
		table: "<thead>{0}</thead><tbody>{1}</tbody>",
		row:
			'<tr><td>{0}</td><td>{1}</td><td class="title bright">{2}</td><td>{3}</td></tr>',
		star: '<i class="fa fa-star" aria-hidden="true"></i>',
		assignee:
			'<div style="display: inline-flex; align-items: center; justify-content: center; background-color: #aaa; color: #666; min-width: 1em; border-radius: 50%; vertical-align: middle; padding: 2px; text-transform: uppercase;">{0}</div>'
	},

	getDom: function() {
		var self = this;
		var wrapper = document.createElement("table");
		wrapper.className = "normal small light";

		var todos = this.getTodos();

		var rows = [];
		todos.forEach(function(todo, i) {
			rows[i] = self.html.row.format(
				self.config.showDeadline && todo.due_date ? todo.due_date : "",
				todo.starred ? self.html.star : "",
				todo.title,
				self.config.showAssignee && todo.assignee_id && self.users
					? self.html.assignee.format(self.users[todo.assignee_id])
					: ""
			);
			// Create fade effect
			if (self.config.fade && self.config.fadePoint < 1) {
				if (self.config.fadePoint < 0) {
					self.config.fadePoint = 0;
				}
				var startingPoint = todos.length * self.config.fadePoint;
				if (i >= startingPoint) {
					wrapper.style.opacity =
						1 - (1 / todos.length - startingPoint * (i - startingPoint));
				}
			}
		});

		wrapper.innerHTML = this.html.table.format(
			this.html.row.format("", "", "", ""),
			rows.join("")
		);

		return wrapper;
	}
});
