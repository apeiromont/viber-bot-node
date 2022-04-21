import _ from 'underscore';

import TextMessage from './text-message';
import UrlMessage from './url-message';
import ContactMessage from './contact-message';
import LocationMessage from './location-message';
import VideoMessage from './video-message';
import PictureMessage from './picture-message';
import StickerMessage from './sticker-message';
import FileMessage from './file-message';
import RichMediaMessage from './rich-media-message';

const SUPPORTED_MESSAGE_TYPES = [TextMessage, UrlMessage, ContactMessage,
	FileMessage, LocationMessage, PictureMessage, VideoMessage, StickerMessage,
	RichMediaMessage];

export default class MessageFactory {
	_logger: any;
	_mapping: {};
	constructor(logger) {
		const self = this;

		this._logger = logger;
		this._mapping = {};

		_.each(SUPPORTED_MESSAGE_TYPES, messageType => self._mapping[messageType.getType()] = messageType);
	}
	createMessageFromJson(json) {
		let messageType = json.message.type.toLowerCase();
		if (!_.has(this._mapping, messageType)) {
			this._logger.debug(`Could not build message from type ${messageType}. No mapping found`);
			return;
		}
		return this._mapping[messageType].fromJson(json.message, json.timestamp, json.message_token);
	}
}
