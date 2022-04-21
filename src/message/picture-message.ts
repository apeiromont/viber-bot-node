import Message from './message';

const REQUIRED_ARGUMENTS = ["url"];

export default class PictureMessage extends Message {
	url: any;
	text: any;
	thumbnail: any;
	constructor(url, optionalText, optionalThumbnail, optionalKeyboard, optionalTrackingData, timestamp, token, minApiVersion?) {
		super(REQUIRED_ARGUMENTS, optionalKeyboard, optionalTrackingData, timestamp, token, minApiVersion);
		this.url = url;
		this.text = optionalText || null;
		this.thumbnail = optionalThumbnail || null;
	}
	toJson() {
		return {
			"type": PictureMessage.getType(),
			"text": this.text,
			"media": this.url,
			"thumbnail": this.thumbnail
		};
	}
	static fromJson(jsonMessage, timestamp, token) {
		return new PictureMessage(jsonMessage.media, jsonMessage.text, jsonMessage.thumbnail, null, jsonMessage.tracking_data, timestamp, token);
	}
	static getType() {
		return "picture";
	}
}