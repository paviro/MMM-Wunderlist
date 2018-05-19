var rp = require("request-promise");
const endpoint = "https://a.wunderlist.com/api/v1/";

var Wunderlist = function (clientID, accessToken) {
	const defaults = {
		headers: {
			"X-Client-ID": clientID,
			"X-Access-Token": accessToken,
			"Content-Type": "application/json"
		}
	};

	this.retrieveTodos = function (listID) {
		return new Promise(function (resolve, reject) {
			var options = defaults;
			options.uri = endpoint + "tasks";
			options.qs = {
				list_id: listID
			};

			rp(options)
				.then(function (resp) {
					resolve(JSON.parse(resp));
				})
				.catch(function (err) {
					reject(err);
				});
		});
	};

	this.retrieveLists = function () {
		return new Promise(function (resolve, reject) {
			var options = defaults;
			options.uri = endpoint + "lists";

			rp(options)
				.then(function (resp) {
					resolve(JSON.parse(resp));
				})
				.catch(function (err) {
					reject(err);
				});
		});
	};

	this.retrieveList = function (listID) {
		return new Promise(function (resolve, reject) {
			var options = defaults;
			options.uri = endpoint + "lists/" + listID;

			rp(options)
				.then(function (resp) {
					resolve(JSON.parse(resp));
				})
				.catch(function (err) {
					reject(err);
				});
		});
	};

	this.retrieveUsers = function () {
		return new Promise(function (resolve, reject) {
			var options = defaults;
			options.uri = endpoint + "users";

			rp(options)
				.then(function (resp) {
					resolve(JSON.parse(resp));
				})
				.catch(function (err) {
					reject(err);
				});
		});
	};
};

module.exports = Wunderlist;
