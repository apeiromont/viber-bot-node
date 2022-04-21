import Message from './message';

const REQUIRED_ARGUMENTS = ["keyboard"];

export default class KeyboardMessage extends Message {
	constructor(keyboard, optionalTrackingData, timestamp, token, minApiVersion?) {
		super(REQUIRED_ARGUMENTS, keyboard, optionalTrackingData, timestamp, token, minApiVersion);
	}
	toJson() {
		return {};
	}
	static fromJson(jsonMessage, timestamp, token) {
		return new KeyboardMessage(jsonMessage.keyboard, jsonMessage.tracking_data, timestamp, token);
	}
	static getType() {
		return null;
	}
}
