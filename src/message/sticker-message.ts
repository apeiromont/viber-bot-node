import Message from './message';

const REQUIRED_ARGUMENTS = ["stickerId"];

export default class StickerMessage extends Message {
	stickerId: any;
	constructor(stickerId, optionalKeyboard, optionalTrackingData, timestamp, token, minApiVersion?) {
		super(REQUIRED_ARGUMENTS, optionalKeyboard, optionalTrackingData, timestamp, token, minApiVersion);
		this.stickerId = stickerId;
	}
	toJson() {
		return {
			"type": StickerMessage.getType(),
			"sticker_id": this.stickerId
		};
	}
	static fromJson(jsonMessage, timestamp, token) {
		return new StickerMessage(jsonMessage.sticker_id, null, jsonMessage.tracking_data, timestamp, token);
	}
	static getType() {
		return "sticker";
	}
}
