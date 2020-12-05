(function (window) {
	'use strict';

	const reloadTable = () => {
		console.debug('Reloading host information');

		const tableRows = Array.from(window.document.querySelectorAll('table > tbody > tr'));
		if (tableRows.length === 0)
			return;

		requestPromise('/checkup-all', {}, request.METHODS.GET).then(response => {
			// if we're missing key bits of data, don't bother refreshing
			if (!response || !response.hostData || typeof response.hostData !== 'object')
				return;

			// for each bit of host data we get, grab the row that contains the host name and update it
			response.hostData.forEach(hostMeta => {
				const row = getHostRow(hostMeta.hostname);
				if (!row)
					return;

				// status
				row.children[1].setAttribute('class', hostMeta.status);

				// status string
				row.children[2].innerText = hostMeta.statusText;

				// current encode
				row.children[3].innerText = hostMeta.currentEncode;

				// start time
				row.children[4].innerText = hostMeta.startTime;

				// end time
				row.children[5].innerText = hostMeta.endTime;

				// eta
				row.children[6].innerText = hostMeta.eta;
			});
		}).catch(e => console.error(e));


		function getHostRow(host) {
			let foundRow = null;
			tableRows.forEach(row => {
				if (row.children[0].innerText.endsWith(host))
					foundRow = row;
			});

			return foundRow;
		}
	}

	// refresh the page every 10 seconds after loading the page
	setInterval(reloadTable, 10000)
})(window);
