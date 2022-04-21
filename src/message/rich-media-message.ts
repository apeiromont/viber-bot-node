import Message from './message';

const REQUIRED_ARGUMENTS = ["richMedia"];

export default class RichMediaMessage extends Message {
	richMedia: any;
	altText: any;
	constructor(richMedia, optionalKeyboard?, optionalTrackingData?, timestamp?, token?, optionalAltText?, minApiVersion?) {
		super(REQUIRED_ARGUMENTS, optionalKeyboard, optionalTrackingData, timestamp, token, minApiVersion);
		this.richMedia = richMedia;
		this.altText = !optionalAltText ? null : optionalAltText;
	}

	toJson() {
		return {
			"type": RichMediaMessage.getType(),
			"rich_media": this.richMedia,
			"alt_text": this.altText || null,
			"min_api_version": this.minApiVersion || 2
		};
	}
	static fromJson(jsonMessage, timestamp, token) {
		return new RichMediaMessage(jsonMessage.rich_media, null, jsonMessage.tracking_data, timestamp, token, jsonMessage.alt_text);
	}
	static getType() {
		return "rich_media";
	}
}
