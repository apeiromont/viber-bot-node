import _ from 'underscore';
import needle from 'needle';

const SUCCESSFUL_REQUEST_STATUS = 0;
const VIBER_AUTH_TOKEN_HEADER = "X-Viber-Auth-Token";
const MAX_GET_ONLINE_IDS = 100;
const API_ENDPOINTS = {
	"setWebhook": "/set_webhook",
	"getAccountInfo": "/get_account_info",
	"getUserDetails": "/get_user_details",
	"getOnlineStatus": "/get_online",
	"sendMessage": "/send_message",
	"post": "/post"
};

export class ViberClient {
	_logger: any;
	_bot: any;
	_url: any;
	_subscribedEvents: any;
	_userAgent: string;
	url: any;

	constructor(logger, bot, apiUrl, subscribedEvents) {
		this._logger = logger;
		this._bot = bot;
		this._url = apiUrl;
		this._subscribedEvents = subscribedEvents;
		this._userAgent = "ViberBot-Node";
	}

	setWebhook(url, isInline) {
		this._logger.info("Sending 'setWebhook' request for url: %s, isInline: %s", url, isInline);
		return this._sendRequest("setWebhook", {
			"url": url,
			"is_inline": isInline,
			"event_types": this._subscribedEvents
		});
	}

	sendMessage(optionalReceiver, messageType, messageData, optionalTrackingData, optionalKeyboard, optionalChatId, optionalMinApiVersion) {
		if (!optionalReceiver && !optionalChatId) {
			return Promise.reject(new Error(`Invalid arguments passed to sendMessage. 'optionalReceiver' and 'chatId' are Missing.`));
		}

		if (messageType && !messageData) {
			return Promise.reject(new Error(`Invalid arguments passed to sendMessage. 'MessageData' is Missing.`));
		}

		if (!messageType && !messageData && !optionalKeyboard) {
			return Promise.reject(new Error(`Invalid arguments passed to sendMessage. 'MessageData','messageType' are Missing and there's no keyboard.`));
		}

		const request = {
			"sender": {
				"name": this._bot.name,
				"avatar": this._bot.avatar
			},
			"tracking_data": this._serializeTrackingData(optionalTrackingData),
			"keyboard": optionalKeyboard,
			"chat_id": optionalChatId,
			"min_api_version": optionalMinApiVersion
		};

		if (optionalReceiver) {
			request["receiver"] = optionalReceiver;
		}

		this._logger.debug("Sending %s message to viber user '%s' with data", messageType, optionalReceiver, messageData);
		return this._sendRequest("sendMessage", Object.assign(request, messageData));
	}

	getAccountInfo() {
		return this._sendRequest("getAccountInfo", {});
	}
	getUserDetails(viberUserId) {
		if (!viberUserId)
			throw new Error(`Missing user id`);
		return this._sendRequest("getUserDetails", { "id": viberUserId });
	}
	getOnlineStatus(viberUserIds) {
		viberUserIds = _.isArray(viberUserIds) ? viberUserIds : [viberUserIds];

		if (_.isEmpty(viberUserIds))
			throw new Error(`Empty or no user ids passed to getOnlineStatus`);
		if (_.size(viberUserIds) > MAX_GET_ONLINE_IDS) {
			throw new Error(`Can only check up to ${MAX_GET_ONLINE_IDS} ids per request`);
		}

		return this._sendRequest("getOnlineStatus", { "ids": viberUserIds });
	}
	postToPublicChat(senderProfile, messageType, messageData, optionalMinApiVersion) {
		if (!senderProfile) {
			return Promise.reject(new Error(`Invalid arguments passed to postToPublicChat. 'senderProfile' is Missing.`));
		}

		if (!messageType || !messageData) {
			return Promise.reject(new Error(`Invalid arguments passed to postToPublicChat. 'MessageData' or 'messageType' are Missing.`));
		}

		const request = {
			"from": senderProfile.id,
			"sender": {
				"name": senderProfile.name,
				"avatar": senderProfile.avatar
			},
			"min_api_version": optionalMinApiVersion
		};

		this._logger.debug("Sending %s message to public chat as viber user '%s' with data", messageType, senderProfile.id, messageData);
		return this._sendRequest("post", Object.assign(request, messageData));
	}
	_sendRequest(endpoint, data) {
		if (!_.has(API_ENDPOINTS, endpoint)) {
			return Promise.reject(new Error(`could not find endpoint ${endpoint}`));
		}

		const self = this;
		const url = `${this.url}${API_ENDPOINTS[endpoint]}`;
		const dataWithAuthToken = Object.assign({ "auth_token": this._bot.authToken }, data);
		const options = {
			json: true, rejectUnauthorized: true, parse: true,
			user_agent: this._userAgent,
			headers: {
				[VIBER_AUTH_TOKEN_HEADER]: this._bot.authToken
			}
		};

		this._logger.debug("Opening request to url: '%s' with data", url, data);
		return new Promise((resolve, reject) => {
			try {
				needle.post(url, dataWithAuthToken, options)
					.on("data", data => self._readData(data, resolve, reject))
					.on("end", err => self._requestEnded(err, reject))
					.on("err", err => reject(err));
			}
			catch (err) {
				reject(err);
			}
		});
	}
	_readData(data, resolve, reject) {
		if (data.status != SUCCESSFUL_REQUEST_STATUS) {
			this._logger.error("Response error", data);
			return reject(data);
		}
		this._logger.debug("Response data", data);
		return resolve(data);
	}
	_requestEnded(err, reject) {
		if (err) {
			this._logger.error("Request ended with an error", err);
			return reject(err);
		}
		this._logger.debug("Request ended successfully");
	}
	_serializeTrackingData(optionalTrackingData) {
		if (optionalTrackingData == null || _.isEmpty(optionalTrackingData)) {
			// because of bug in production, we cannot send null, but we can send an empty string
			optionalTrackingData = "";
		}
		return JSON.stringify(optionalTrackingData);
	}
}










