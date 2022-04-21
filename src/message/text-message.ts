import Message from './message';

const REQUIRED_ARGUMENTS = ["text"];

export default class TextMessage extends Message {
	text: any;

	constructor(text, optionalKeyboard?, optionalTrackingData?, timestamp?, token?, minApiVersion?) {
		super(REQUIRED_ARGUMENTS, optionalKeyboard, optionalTrackingData, timestamp, token, minApiVersion);
		this.text = text;
	}

	static fromJson(jsonMessage, timestamp, token) {
		return new TextMessage(jsonMessage.text, null, jsonMessage.tracking_data, timestamp, token);
	};

	static getType() {
		return "text";
	};

	toJson() {
		return {
			"type": TextMessage.getType(),
			"text": this.text
		};
	};
}
