import _ from 'underscore';

export default class Message {
	requiredArguments: any;
	keyboard: any;
	trackingData: any;
	token: any;
	timestamp: any;
	minApiVersion: any;

	constructor(requiredArguments, optionalKeyboard, optionalTrackingData, timestamp, token, minApiVersion) {
		this.timestamp = timestamp;
		this.token = token;
		this.trackingData = this._parseTrackingData(optionalTrackingData);
		this.keyboard = !optionalKeyboard ? null : optionalKeyboard;
		this.requiredArguments = requiredArguments;
		this.minApiVersion = minApiVersion;
	
		Object.freeze(this);
	}

	getType() {
		throw new Error("not implemented");
	};
	
	toJson(): Record<string, unknown> {
		throw new Error("not implemented");
	};
	
	static fromJson(jsonMessage, timestamp, token) {
		throw new Error("not implemented");
	};
	
	verifyMessage() {
		this.requiredArguments.forEach(argument => {
			if (!_.has(this, argument) || !_.result(this, argument, null)) {
				throw new Error(`Missing required argument ${argument}`);
			}
		});
	};

	_parseTrackingData(optionalTrackingData) {
		if (!optionalTrackingData) return {};
		if (_.isObject(optionalTrackingData)) return optionalTrackingData;

		let trackingData = null;
		try {
			trackingData = JSON.parse(optionalTrackingData);
		}
		catch (err) {
		}
		return !_.isObject(trackingData) ? {} : trackingData;
	};

	serializeObject(object) {
		if (object == null || _.isEmpty(object)) {
			// because of bug in production, we cannot send null, but we can send an empty string
			object = "";
		}
		return JSON.stringify(object);
	};
}