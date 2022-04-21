import _ from 'underscore';
import * as EventEmitter from 'events';

const JSONBig = require('json-bigint')({ "storeAsString": true });

import NoopLogger from './noop-logger';

import EventConsts from './event-consts';
import ViberClient from './viber-client';
import Middleware from './middleware';
import RegexMatcherRouter from './regex-matcher-router';

import MessageFactory from './message/message-factory';
import MessageValidator from './message/message-validator';
import Message from './message/message';
import TextMessage from './message/text-message';

import UserProfile from './user-profile';
import Response from './response';

const REQUEST_TYPE = {
	SEND_MESSAGE: "send_message",
	POST_TO_PUBLIC_CHAT: "post_to_public_chat",
}

const REQUIRED_CONFIGURATION_FIELDS = ["authToken", "name", "avatar"];
const SUBSCRIBED_EVENTS = ["subscribed", "unsubscribed", "conversation_started", "message", "delivered", "seen"];
const API_URL = "https://chatapi.viber.com/pa";

export default class ViberBot extends EventEmitter {
	authToken: any;
	name: any;
	avatar: any;
	_logger: any;
	_client: any;
	private readonly _middleware: Middleware;
	private readonly _messageFactory: MessageFactory;
	_regexMatcherRouter: any;
	_callbacks: { [x: string]: any[]; };

	constructor(loggerOrConfiguration, configuration?) {
		super();
		// backward compatibility: we are still allowing ctor as (logger, configuration);
		// newer should use (configuration) with logger property in it.
		let logger;
		if (!configuration) {
			// no logger, treat loggerOrConfiguration as configuration
			configuration = loggerOrConfiguration;
			logger = configuration.logger || NoopLogger;
		}
		else {
			logger = loggerOrConfiguration || NoopLogger;
		}

		if (!configuration) {
			throw new Error(`Invalid configuration`);
		}

		const missingFields = this._getMissingFieldsInConfiguration(configuration);
		if (!_.isEmpty(missingFields)) {
			throw new Error(`Invalid configuration ${configuration}. Missing fields: ${missingFields}`);
		}

		this.authToken = configuration.authToken;
		this.name = configuration.name;
		this.avatar = configuration.avatar;

		this._logger = logger;
		this._client = new ViberClient(this._logger, this, API_URL, configuration.registerToEvents || SUBSCRIBED_EVENTS);
		this._middleware = new Middleware(this._logger, new MessageValidator(this._logger, this.authToken));
		this._messageFactory = new MessageFactory(this._logger);
		this._regexMatcherRouter = new RegexMatcherRouter(this._logger);
		this._callbacks = { [EventConsts.CONVERSATION_STARTED]: [] };

		this._registerStreamAndHandleEvents(this._middleware.stream);
		this._setupTextMessageReceivedHandler();
		this._setupConversationStartedHandler();
	}

	getBotProfile() {
		return this._client.getAccountInfo();
	};

	getUserDetails(userProfile) {
		return this._client.getUserDetails(userProfile.id).then(response => Promise.resolve(response.user));
	};

	getOnlineStatus(viberUserIds) {
		return this._client.getOnlineStatus(viberUserIds);
	};

	setWebhook(url, isInline) {
		return this._client.setWebhook(url, isInline);
	};

	sendMessage(optionalUserProfile, messages, optionalTrackingData, optionalChatId) {
		return this._sendMessages(optionalUserProfile, messages, REQUEST_TYPE.SEND_MESSAGE, optionalTrackingData, optionalChatId);
	};

	postToPublicChat(senderProfile, messages) {
		return this._sendMessages(senderProfile, messages, REQUEST_TYPE.POST_TO_PUBLIC_CHAT);
	};

	_sendMessages(userProfile, messages, requestType, optionalTrackingData?, optionalChatId?) {
		if (messages == null) return Promise.resolve();
		messages = _.isArray(messages) ? messages : [messages];

		const self = this;
		const lastMessage = messages.pop();
		const tokens = [];

		const resolveCallback = (response, message, resolve, reject) => {
			if (response.status != 0) return reject(response);
			tokens.push(response.message_token);
			self.emit(EventConsts.MESSAGE_SENT, message, userProfile);
			resolve();
		};

		let promise = Promise.resolve();
		_.each(messages, message => {
			promise = promise.then(() => new Promise((resolve, reject) => {
				try {
					message.verifyMessage();
					return resolve();
				}
				catch (err) {
					return reject(err);
				}
			}));

			promise = promise.then(() => new Promise((resolve, reject) => {
				if (requestType == REQUEST_TYPE.SEND_MESSAGE) return self._sendMessageFromClient(userProfile, message, null, null, optionalChatId, message.minApiVersion).then(response => resolveCallback(response, message, resolve, reject), error => reject(error));
				if (requestType == REQUEST_TYPE.POST_TO_PUBLIC_CHAT) return self._sendMessageToPublicChat(userProfile, message);
				return reject(`internal error: unknown RequestType=${requestType}`);
			}));
		});

		return promise.then(() => new Promise((resolve, reject) => {
			if (requestType == REQUEST_TYPE.SEND_MESSAGE) {
				return self._sendMessageFromClient(userProfile, lastMessage, optionalTrackingData, lastMessage.keyboard, optionalChatId, lastMessage.minApiVersion)
					.then(response => resolveCallback(response, lastMessage, resolve, reject), error => reject(error));
			}
			else if (requestType == REQUEST_TYPE.POST_TO_PUBLIC_CHAT) {
				return self._sendMessageToPublicChat(userProfile, lastMessage, lastMessage.minApiVersion)
					.then(response => resolveCallback(response, lastMessage, resolve, reject), error => reject(error));
			}
			return reject(`internal error: unknown RequestType=${requestType}`);
		})).then(() => Promise.resolve(tokens));
	};

	_sendMessageToPublicChat(senderProfile, message, optionalMinApiVersion?) {
		const jsonMessage = message.toJson();
		return this._client.postToPublicChat(senderProfile, jsonMessage.type, jsonMessage, optionalMinApiVersion);
	};

	middleware() {
		return this._middleware.app;
	};

	onTextMessage(regex, callback) {
		this._regexMatcherRouter.newMatcher(regex, callback);
	};

	onError(callback) {
		this.on(EventConsts.ERROR, callback);
	};

	onConversationStarted(callback) {
		this._callbacks[EventConsts.CONVERSATION_STARTED].push(callback);
	};

	onSubscribe(callback) {
		this.on(EventConsts.SUBSCRIBED, callback);
	};

	onUnsubscribe(callback) {
		this.on(EventConsts.UNSUBSCRIBED, callback);
	};

	_setupTextMessageReceivedHandler() {
		const self = this;
		this.on(EventConsts.MESSAGE_RECEIVED, (message, response, silent, replyType, chatId) => {
			if (!(message instanceof TextMessage)) return;

			const callback = this._regexMatcherRouter.tryGetCallback(message.text);
			if (!callback) {
				return self._logger.debug(`Could not find regex matcher for ${message.text}`);
			}
			callback(message, response);
		});
	};

	_setupConversationStartedHandler() {
		const self = this;
		this.on(EventConsts.CONVERSATION_STARTED, (response, isSubscribed, context) => {
			_.each(self._callbacks[EventConsts.CONVERSATION_STARTED], callback => {
				callback(response.userProfile, isSubscribed, context, (responseMessage, optionalTrackingData) => {
					if (!responseMessage) return;
					if (!(responseMessage instanceof Message)) {
						throw new Error("Response from conversation started callback must be message or null");
					}

					const jsonMessage = responseMessage.toJson();
					if (responseMessage.keyboard) jsonMessage.keyboard = responseMessage.keyboard;
					if (responseMessage.trackingData) {
						jsonMessage["tracking_data"] = self._client._serializeTrackingData(optionalTrackingData || {});
					}

					self._logger.debug("Sending conversation started callback", jsonMessage);
					self._middleware.stream.write(JSON.stringify(jsonMessage));
				});
			});
		});
	};

	_getMissingFieldsInConfiguration(configuration) {
		return _.difference(REQUIRED_CONFIGURATION_FIELDS, Object.keys(configuration));
	};

	_sendMessageFromClient(optionalUserProfile, message, optionalTrackingData, optionalKeyboard, optionalChatId, optionalMinApiVersion) {
		const jsonMessage = message.toJson();
		let receiver = null;
		if (optionalUserProfile) {
			receiver = optionalUserProfile.id;
		}
		return this._client.sendMessage(receiver, jsonMessage.type, jsonMessage, optionalTrackingData, optionalKeyboard, optionalChatId, optionalMinApiVersion);
	};

	private _registerStreamAndHandleEvents(stream) {
		const self = this;
		stream.on("data", data => {
			try {
				const parsedData = JSONBig.parse(data.toString());
				self._handleEventReceived(parsedData);
			}
			catch (err) {
				self._logger.error(err);
				self.emit(EventConsts.ERROR, err);
			}
		});
	};

	private _handleEventReceived(data) {
		const userProfile = this._getUserProfile(data);
		switch (data.event) {
			case EventConsts.MESSAGE_RECEIVED: {
				const message = this._messageFactory.createMessageFromJson(data);
				const response = new Response(this, userProfile, data.silent, data.reply_type, data.chat_id);
				this.emit(data.event, message, response, data.silent, data.reply_type, data.chat_id);
				break;
			}
			case EventConsts.SUBSCRIBED: {
				const response = new Response(this, userProfile);
				this.emit(data.event, response);
				break;
			}
			case EventConsts.CONVERSATION_STARTED: {
				const response = new Response(this, userProfile);
				this.emit(data.event, response, data.subscribed, data.context);
				break;
			}
			case EventConsts.UNSUBSCRIBED: {
				this.emit(data.event, data.user_id);
				break;
			}
			case EventConsts.FAILED: {
				this.emit(EventConsts.ERROR, data);
				break;
			}
			default: {
				this.emit(data.event, data);
				break;
			}
		}
	};

	private _getUserProfile(data) {
		if (_.has(data, "sender")) return UserProfile.fromJson(data.sender);
		else if (_.has(data, "user")) return UserProfile.fromJson(data.user);
		return null;
	};
}