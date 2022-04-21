import Message from './message';

const REQUIRED_ARGUMENTS = ["url"];

export default class VideoMessage extends Message {
	url: any;
	size: any;
	text: any;
	thumbnail: any;
	duration: any;

	constructor(url, size, optionalText, optionalThumbnail, optionalDuration, optionalKeyboard, optionalTrackingData, timestamp, token, minApiVersion?) {
		super(REQUIRED_ARGUMENTS, optionalKeyboard, optionalTrackingData, timestamp, token, minApiVersion);
		this.url = url;
		this.size = size;
		this.text = optionalText || null;
		this.thumbnail = optionalThumbnail || null;
		this.duration = optionalDuration || null;
	}
	toJson() {
		return {
			"type": VideoMessage.getType(),
			"media": this.url,
			"text": this.text,
			"thumbnail": this.thumbnail,
			"size": this.size,
			"duration": this.duration
		};
	}
	static fromJson(jsonMessage, timestamp, token) {
		return new VideoMessage(jsonMessage.media, jsonMessage.size, jsonMessage.text, jsonMessage.thumbnail, jsonMessage.duration,
			null, jsonMessage.tracking_data, timestamp, token);
	}
	static getType() {
		return "video";
	}
}


