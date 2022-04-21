import Message from './message';

const REQUIRED_ARGUMENTS = ["contactName", "contactPhoneNumber"];

export default class ContactMessage extends Message {
	contactName: any;
	contactPhoneNumber: any;
	contactAvatar: any;

	constructor(contactName, contactPhoneNumber, optionalAvatar, optionalKeyboard, optionalTrackingData, timestamp, token, minApiVersion?) {
		super(REQUIRED_ARGUMENTS, optionalKeyboard, optionalTrackingData, timestamp, token, minApiVersion);
		
		this.contactName = contactName;
		this.contactPhoneNumber = contactPhoneNumber;
		this.contactAvatar = optionalAvatar || null;
	}

	toJson() {
		return {
			"type": ContactMessage.getType(),
			"contact": {
				"name": this.contactName,
				"phone_number": this.contactPhoneNumber,
				"avatar": this.contactAvatar
			}
		};
	}

	static fromJson(jsonMessage, timestamp, token) {
		return new ContactMessage(
			jsonMessage.contact.name, jsonMessage.contact.phone_number,
			null, null, jsonMessage.tracking_data, timestamp, token);
	}
	static getType() {
		return "contact";
	}
}