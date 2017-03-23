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
    this.config = [];
    this.fetchers = {};
    this.started = false;
  },

  getLists: function (callback) {
    this.WunderlistAPI.http.lists.all()
      .done(function (lists) {
        callback(lists)
      })
      .fail(function (resp, code) {
        console.error('there was a Wunderlist problem', resp, code);
      });
  },

  createFetcher: function (listID, list, reloadInterval) {

    var fetcher;

    if (typeof this.fetchers[listID] === "undefined") {

      var self = this;

      console.log("Create new todo fetcher for list: " + list + " - Interval: " + reloadInterval);
      fetcher = new Fetcher(listID, reloadInterval, this.config.accessToken, this.config.clientID);

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
    if (notification === "CONFIG" && this.started == false) {
      const self = this
      this.config.interval = payload.interval
      this.config.lists = payload.lists
      this.config.accessToken = payload.accessToken
      this.config.clientID = payload.clientID

      this.WunderlistAPI = new WunderlistSDK({
        accessToken: payload.accessToken,
        clientID: payload.clientID
      })

      this.getLists(function (data) {
        self.lists = data
        self.sendSocketNotification("STARTED")
      });
      self.started = true
    }
    else if (notification === "addLists") {
      const self = this
      this.lists.forEach(function (currentValue) {
        if (self.config.lists.indexOf(currentValue.title) >= 0) {
          self.createFetcher(currentValue.id, currentValue.title, self.config.interval * 1000);
        }
      })
    }
    else if (notification === "CONNECTED") {
      this.broadcastTodos()
    }
  }

});
