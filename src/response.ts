const REPLY_TYPE = {
	MESSAGE: 'message',
	QUERY: 'query'	,
};

export default class Response {
	private readonly _bot: any;
	readonly userProfile: any;
	readonly silent: any;
	readonly replyType: any;
	readonly chatId: any;

	constructor(bot, userProfile, silent?, replyType?, chatId?) {
		this._bot = bot;
		this.userProfile = userProfile;
		this.silent = silent;
		this.replyType = replyType;
		this.chatId = chatId;
		Object.freeze(this);
	}
	
	send(messages, optionalTrackingData) {
		if (this.replyType == REPLY_TYPE.MESSAGE) return this._bot.sendMessage(null, messages, optionalTrackingData, this.chatId);
		if (this.replyType == REPLY_TYPE.QUERY) return this._bot.sendMessage(this.userProfile, messages, optionalTrackingData, this.chatId);
		return this._bot.sendMessage(this.userProfile, messages, optionalTrackingData);
	};
}
