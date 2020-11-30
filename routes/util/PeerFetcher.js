'use strict';

const fetch = require('node-fetch');
const config = require('../../config/properties.json');
const { STATUS } = require('./HBStatus');

class PeerFetcher {
	static fetchPeerStatuses() {
		const responses = [];
		const promises = config.peers.map(peerURL => {
			const destinationURL = peerURL.includes('/checkup') ? peerURL : peerURL + '/checkup';
			console.log('INFO: Request out to: ' + destinationURL);
			return fetch(destinationURL)
				.then(res => res.json())
				.then(json => responses.push(json))
				.catch(e => {
					console.error(e);
					return {
						success: false,
						hostname: peerURL,
						status: STATUS.PEER_UNAVAILABLE
					}
				});
		});

		return Promise.all(promises).then(() => responses);
	}
}

module.exports = PeerFetcher;
