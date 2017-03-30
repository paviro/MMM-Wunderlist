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
    fadePoint: 0.25
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

  html: {
    table: '<thead>{0}</thead><tbody>{1}</tbody>',
    row: '<tr><td>{0}</td><td>{1}</td></tr>'
  },

  getDom: function () {
    var self = this;
    var wrapper = document.createElement("table");
    wrapper.className = "normal small light";

    var todos = this.getTodos();

    var rows = []
    todos.forEach(function (todo, i) {
      rows[i] = self.html.row.format(todo.starred ? '*' : '', todo.title)

      // Create fade effect
      if (self.config.fade && self.config.fadePoint < 1) {
        if (self.config.fadePoint < 0) {
          self.config.fadePoint = 0;
        }
        var startingPoint = todos.length * self.config.fadePoint;
        if (i >= startingPoint) {
          titleWrapper.style.opacity = 1 - (1 / todos.length - startingPoint * (i - startingPoint));
        }
      }
    });

    /*
      completed:false
      created_at:"2017-03-14T07:43:37.172Z"
      created_by_id:24499672
      created_by_request_id:"16aab5bba3589ff71989:Tn5nR+oAAAA=:01d89465-74c4-4f22-8291-cdf54f9d472b:24499672:732"
      id:2609249400
      list_id:258688629
      revision:1
      starred:false
      title:"5S524X"
      type:"task"
    */

    wrapper.innerHTML = this.html.table.format(
      this.html.row.format('', ''),
      rows.join('')
    )

    return wrapper;
  }

});
