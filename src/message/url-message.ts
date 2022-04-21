import Message from './message';

const REQUIRED_ARGUMENTS = ["url"];

export default class UrlMessage extends Message {
	url: string;
	
	constructor(url, optionalKeyboard, optionalTrackingData, timestamp, token, minApiVersion?) {
		super(REQUIRED_ARGUMENTS, optionalKeyboard, optionalTrackingData, timestamp, token, minApiVersion);
		this.url = url ? encodeURI(url) : null;
	}

	toJson() {
		return {
			"type": UrlMessage.getType(),
			"media": this.url
		};

	}
	static fromJson(jsonMessage, timestamp, token) {
		return new UrlMessage(jsonMessage.media, null, jsonMessage.tracking_data, timestamp, token);
	}

	static getType() {
		return "url";
	}
}
