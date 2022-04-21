import crypto from 'crypto';

export default class MessageValidator {
	_logger: any;
	_authToken: any;

	constructor(logger, authToken) {
		this._logger = logger;
		this._authToken = authToken;
	}

	validateMessage(serverSideSignature, message) {
		const calculatedHash = this._calculateHmacFromMessage(message);
		this._logger.debug("Validating signature '%s' == '%s'", serverSideSignature, calculatedHash);
		return serverSideSignature == calculatedHash;
	}
	_calculateHmacFromMessage(message) {
		return crypto.createHmac("sha256", this._authToken).update(message).digest("hex");
	}
}
