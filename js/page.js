/**
 * @copyright 2017 Michael Newell All rights reserved.
 * @author mike@iwearshorts.com
 */

'use strict';
var separator = ' | ';

var port = chrome.runtime.connect({name: "mint_data_collector"});

port.onMessage.addListener(function(request) {
	if (request.msg === "get_transactions_for_day") {
		var queryMintForData = getMintQuery(request.dayString);
		queryMintForData.then(handleData);
	}
});

function getMintQuery(dayStr) {
	return new Promise(function(rs, rj) {
		// real mint request
		var offset = 0;
		var filterType = 'cash';
		var now = Date.now();
		var sub = 'min' + '' + 't'; // so bots can't pick up our destination
		var root = 'int' + 'uit'; // so bots can't pick up our destination
		var request = 'getJsonData';
		var uri = 'https://'+sub+'.'+root+'.com/app/'+request+'.xevent?queryNew=&offset='+offset+'&filterType='+filterType+'&comparableType=8&task=transactions,txnfilters&rnd=' + now;
		var oReq = new XMLHttpRequest();
		oReq.addEventListener("load", function() {
			rs({response: JSON.parse(this.response), dayStr: dayStr});
		});
		oReq.open("GET", uri);
		oReq.send();
	});
}

function handleData(data) {
	var dataSet = data.response.set;
	var today = new Date(data.dayStr).toDateString();
	var transactions = getTransactions(dataSet);
	var debits = getDebits(transactions);
	var todaysTransactions = filterToday(debits, today);
	var info = totalTransactions(todaysTransactions);

	port.postMessage({msg: 'set_copy_paste', info: info});
}

function getTransactions(dataSet) {
	return dataSet.filter(function(item) {
		return (item.id === 'transactions');
	})[0].data;
}

function getDebits(transactions) {
	return transactions.filter(function(t) {
		return t.isDebit && t.isSpending && !t.isTransfer && t.merchant !== 'Meadows Web Pmts';
	});
}

function filterToday(transactions, today) {
	return transactions.filter(function(t) {
		var year = new Date().getFullYear();
		var dataDateString = t.date + ' ' + year;
		var dataDay = new Date(dataDateString).toDateString();

		return (today === dataDay);
	});
}

function totalTransactions(transactions) {
	var total = 0;
	var transactionInfo = "";
	transactions.forEach(function(t) {
		var num = parseFloat(t.amount.replace("$", ""));
		var text = '[' + t.category + '] ' + t.merchant + ' ('+ t.amount+')' + separator;
		transactionInfo += text;
		total += num;
	});
	return {total: total, info: transactionInfo.slice(0,-1 * separator.length)};
}

