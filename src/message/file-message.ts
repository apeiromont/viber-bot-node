import Message from './message';

const REQUIRED_ARGUMENTS = ["url", "sizeInBytes", "filename"];

export default class FileMessage extends Message {
	url: any;
	sizeInBytes: any;
	filename: any;

	constructor(url, sizeInBytes, filename, optionalKeyboard, optionalTrackingData, timestamp, token, minApiVersion?) {
		super(REQUIRED_ARGUMENTS, optionalKeyboard, optionalTrackingData, timestamp, token, minApiVersion);
		
		this.url = url;
		this.sizeInBytes = sizeInBytes;
		this.filename = filename;
	}

	toJson() {
		return {
			"type": FileMessage.getType(),
			"media": this.url,
			"size": this.sizeInBytes,
			"file_name": this.filename
		};
	}

	static fromJson(jsonMessage, timestamp, token) {
		return new FileMessage(jsonMessage.media, jsonMessage.size, jsonMessage.file_name,
			null, jsonMessage.tracking_data, timestamp, token);
	}

	static getType() {
		return "file";
	}
}
