var Wunderlist = require("./wunderlist-api");
require("request-promise").debug = true;

const accessToken = "";
const clientID = "";

function retrieveTodos(wunderlist, listID) {
	wunderlist
		.retrieveTodos(listID)
		.then(function(resp) {
			console.log(JSON.stringify(resp));
		})
		.catch(function(err) {
			console.log(err);
		});
}

function retrieveUsers(wunderlist) {
	wunderlist
		.retrieveUsers()
		.then(function(resp) {
			console.log(JSON.stringify(resp));
		})
		.catch(function(err) {
			console.log(err);
		});
}

function retrieveList(wunderlist, listID) {
	wunderlist
		.retrieveList(listID)
		.then(function(resp) {
			console.log(JSON.stringify(resp));
		})
		.catch(function(err) {
			console.log(err);
		});
}

function retrieveLists(wunderlist) {
	return new Promise(function(resolve, reject) {
		wunderlist
			.retrieveLists()
			.then(function(resp) {
				console.log(JSON.stringify(resp));
				resolve(resp);
			})
			.catch(function(err) {
				console.log(err);
				reject();
			});
	});
}

var wunderlist = new Wunderlist(clientID, accessToken);
retrieveLists(wunderlist)
	.then(function(lists) {
		retrieveTodos(wunderlist, lists[0].id);
		retrieveList(wunderlist, lists[0].id);

	})
	.catch();
retrieveUsers(wunderlist);
