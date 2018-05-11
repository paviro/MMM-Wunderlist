"use strict";

/* Magic Mirror
 * Module: MMM-Wunderlist
 *
 * By Paul-Vincent Roll http://paulvincentroll.com
 * MIT Licensed.
 */

const NodeHelper = require("node_helper");
const Fetcher = require("./fetcher.js");

var WunderlistSDK = require('wunderlist');

module.exports = NodeHelper.create({
  start: function () {
    this.instances = {};
    this.config = [];
    this.fetchers = {};
    this.started = false;
  },

  getLists: function (callback) {
    this.WunderlistAPI.http.lists.all()
      .done(function (lists) {
        callback(lists);
      })
      .fail(function (resp, code) {
        console.error('there was a Wunderlist problem', code);
      });
  },

  getUsers: function (callback) {
    this.WunderlistAPI.http.users.all()
      .done(function (users) {
        var ret = {};
        users.forEach(function (user) {
          ret[user.id] = user.name[0]
        });
        callback(ret);
      })
      .fail(function (resp, code) {
        console.error('there was a Wunderlist problem', code);
      })
  },

  createFetcher: function (listID, list, reloadInterval) {

    var fetcher;

    if (typeof this.fetchers[listID] === "undefined") {
        
      var self = this;

      console.log("Create new todo fetcher for list: " + list + " - Interval: " + reloadInterval);
      fetcher = new Fetcher(listID, reloadInterval, this.config.accessToken, this.config.clientID, this.config.language, this.config.deadlineFormat);

      fetcher.onReceive(function (fetcher) {
        self.broadcastTodos();
      });

      fetcher.onError(function (fetcher, error) {
        self.sendSocketNotification("FETCH_ERROR", {
          url: fetcher.id(),
          error: error
        });
      });

      this.fetchers[listID] = {
        "name": list,
        "instance": fetcher
      };
    }
    else {
      console.log("Use exsisting todo fetcher for list: " + list);
      fetcher = this.fetchers[listID].instance;
      fetcher.setReloadInterval(reloadInterval);
      fetcher.broadcastItems();
    }

    fetcher.startFetch();
  },

  broadcastTodos: function () {
    var todos = {};
    for (var f in this.fetchers) {
      todos[this.fetchers[f].name] = this.fetchers[f].instance.items();
    }
    this.sendSocketNotification("TASKS", todos);
  },

  // Subclass socketNotificationReceived received.
  socketNotificationReceived: function (notification, payload) {
    const self = this

    if(notification === "CONNECT" && this.started == false){
      this.config = payload.config;
      this.WunderlistAPI = new WunderlistSDK({
        accessToken: self.config.accessToken,
        clientID: self.config.clientID
      })

      this.getLists(function (data) {
        self.lists = data;
        self.sendSocketNotification("RETRIEVED_LISTS");
      });
      self.started = true; 

    }
    if (notification === "CONFIG") {
      this.instances[payload.id] = payload.config;
        }
    else if (notification === "addLists") {
      this.lists.forEach(function (currentValue) {
        if(self.lists.indexOf(currentValue) >= 0)
          self.createFetcher(currentValue.id, currentValue.title, self.config.interval * 1000);
        
      })
    }
    else if (notification === "CONNECTED") {
      this.broadcastTodos()
    }
    else if (notification === 'getUsers') {
      this.getUsers(function (data) {
        self.sendSocketNotification("users", data)
      });
    }
  }

});
