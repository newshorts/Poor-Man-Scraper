/**
 * @copyright 2017 Michael Newell All rights reserved.
 * @author mike@iwearshorts.com
 *
 * Allow the user to specify a date to collect transactions on.
 */

'use strict';

var postMessage = null;
listenForUserSelection();
var connectedToContentScript = listenForConnection();
connectedToContentScript.then(communicateWithContentScript);

function listenForUserSelection() {
	$( "#datepicker" ).datepicker({
		onSelect: function(dateText, inst) { // when the user has selected a date from the date picker
			if(postMessage) {
				postMessage({msg: 'get_transactions_for_day', dayString: dateText});
			}
		}
	});
}

function listenForConnection() {
	return new Promise(function(resolve, reject) {
		chrome.runtime.onConnect.addListener(function(p) {
			console.assert(p.name == "mint_data_collector");

			if(p.name === "mint_data_collector") {
				resolve(p);
			}
		});
	});
}

function communicateWithContentScript(port) {
	postMessage = port.postMessage.bind(port);
	port.onMessage.addListener(function(req) {
		if(req.msg === 'set_copy_paste') {
			setCopyPaste(req.info);
		}
	});
}

function setCopyPaste(data) {
	var infoElem = document.querySelector('.transaction-info');
	//var totalElem = document.querySelector('.transaction-total');
	infoElem.innerHTML = data.info + '&#9;' + data.total; // NOTE: must be pasted with cmd + optn + shft + v
	//totalElem.textContent = data.total;
}

chrome.tabs.executeScript(null, { file: "js/page.js" }); // inject the script
