import * as express from 'express';
import * as bodyParser from 'body-parser';
import { Duplex } from 'stream';
import MessageValidator from 'message/message-validator';

export default class Middleware {
	public readonly stream: Duplex;
	public readonly app: express.Express;
	private _logger: any;
	private _buffer: string | null = null;
	
	constructor(logger, messageValidatorService: MessageValidator) {
		this._logger = logger;
		this.stream = this.createStream();
	
		this.app = express();
		this.app.use(bodyParser.text({ type: "*/*" }));
	
		this.validateMessageSignature(messageValidatorService);
		this.configureEndpoints();
	}

	private configureEndpoints() {
		this.app.get("/ping", (request, response) => {
			response.send("pong");
			response.end();
		});
	
		this.app.post("/", (request, response) => {
			this._logger.debug("Request data:", request.body);
			this.stream.push(request.body);
	
			if (this._buffer) {
				response.send(this._buffer);
			}
			response.end();
		});
	};
	
	private createStream() {
		const duplexStream = new Duplex();
	
		duplexStream._read = function noop() {};
		duplexStream._write = (chunk: any, _encoding: BufferEncoding, callback: (error?: Error | null) => void) => {
			this._buffer = chunk.toString();
			callback();
		};
		return duplexStream;
	};
	
	private validateMessageSignature(messageValidatorService: MessageValidator) {
		this.app.use((request, response, next) => {
			const serverSideSignature = request.headers.X_Viber_Content_Signature || request.query.sig;
			if (!messageValidatorService.validateMessage(serverSideSignature, request.body)) {
				this._logger.warn("Could not validate message signature", serverSideSignature);
				return;
			}
			next();
		});
	};
}

