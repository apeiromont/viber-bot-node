export default class RegexMatcherRouter {
	private readonly _logger: any;
	private _textRegexpCallbacks: any[];

	constructor(logger) {
		this._logger = logger;
		this._textRegexpCallbacks = [];
	}

	newMatcher(regexp, callback) {
		this._textRegexpCallbacks.push({ regexp, callback });
	};

	tryGetCallback(text) {
		const self = this;
		const match = this._textRegexpCallbacks.find(reg => {
			self._logger.debug(`Matching ${text} with ${reg.regexp}`);
			const result = reg.regexp.exec(text);

			if (result) {
				self._logger.debug(`Matches ${text} = ${reg.regexp}`);
				return true;
			}
		});

		return match ? match.callback : null;
	};
}