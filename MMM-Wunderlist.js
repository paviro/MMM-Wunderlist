"use strict"
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
  },

  // Override socket notification handler.
  socketNotificationReceived: function (notification, payload) {
    if (notification === "TASKS") {
      this.tasks = payload
      this.updateDom(3000);
    }
    else if (notification === "STARTED") {
      console.log(notification);
      this.sendSocketNotification("addLists", this.config.lists);
      if (this.config.showAssignee) {
        this.started = true;
        this.sendSocketNotification("getUsers");
      }
    }
    else if (notification === "users") {
      this.users = payload;
      if (this.tasks && this.tasks.length > 0) {
        this.updateDom(3000);
      }
    }
  },

  start: function () {
    this.tasks = [];
    this.sendSocketNotification("CONFIG", this.config);
    this.sendSocketNotification("CONNECTED");
    Log.info("Starting module: " + this.name);
  },

  getTodos: function () {
    var tasksShown = [];

    for (var i = 0; i < this.config.lists.length; i++) {
      if (typeof this.tasks[this.config.lists[i]] != "undefined") {
        var list = this.tasks[this.config.lists[i]];

        for (var todo in list) {
          if (this.config.order == "reversed") {
            tasksShown.push(list[todo]);
          }
          else {
            tasksShown.unshift(list[todo]);
          }
        }
      }
    }
    return tasksShown.slice(0, this.config.maximumEntries);
  },

  getScripts: function () {
    return [
      'String.format.js'
    ];
  },
  getStyles: function () {
    return [
      'https://maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css'
    ];
  },

  html: {
    table: '<thead>{0}</thead><tbody>{1}</tbody>',
    row: '<tr><td>{0}</td><td>{1}</td><td class="title bright">{2}</td><td>{3}</td></tr>',
    star: '<i class="fa fa-star" aria-hidden="true"></i>',
    //assignee: '<div style="border-radius: 50%; width: 36px; height: 36px; padding: 8px; background: #fff; color: #666; text-align: center; font: 32px Arial, sans-serif;">{0}</div>',
  },

  getDom: function () {
    if (this.config.showAssignee && this.started && !this.users) {
      this.sendSocketNotification("getUsers");
    }
    var self = this;
    var wrapper = document.createElement("table");
    wrapper.className = "normal small light";

    var todos = this.getTodos();

    var rows = []
    todos.forEach(function (todo, i) {
      rows[i] = self.html.row.format(
        self.config.showDeadline && todo.due_date ? todo.due_date : '',
        todo.starred ? self.html.star : '',
        todo.title,
        self.config.showAssignee && todo.assignee_id && self.users ? self.users[todo.assignee_id] : ''
      )

      // Create fade effect
      if (self.config.fade && self.config.fadePoint < 1) {
        if (self.config.fadePoint < 0) {
          self.config.fadePoint = 0;
        }
        var startingPoint = todos.length * self.config.fadePoint;
        if (i >= startingPoint) {
          wrapper.style.opacity = 1 - (1 / todos.length - startingPoint * (i - startingPoint));
        }
      }
    });

    wrapper.innerHTML = this.html.table.format(
      this.html.row.format('', '', '', ''),
      rows.join('')
    )

    return wrapper;
  },

});
