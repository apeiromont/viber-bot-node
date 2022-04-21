import Message from './message';

const REQUIRED_ARGUMENTS = ["latitude", "longitude"];

export default class LocationMessage extends Message {
	latitude: any;
	longitude: any;
	constructor(latitude, longitude, optionalKeyboard, optionalTrackingData, timestamp, token, minApiVersion?) {
		super(REQUIRED_ARGUMENTS, optionalKeyboard, optionalTrackingData, timestamp, token, minApiVersion);
		this.latitude = latitude;
		this.longitude = longitude;
	}
	toJson() {
		return {
			"type": LocationMessage.getType(),
			"location": {
				"lat": this.latitude,
				"lon": this.longitude
			}
		};
	}
	static fromJson(jsonMessage, timestamp, token) {
		return new LocationMessage(jsonMessage.location.lat, jsonMessage.location.lon,
			null, jsonMessage.tracking_data, timestamp, token);
	}
	static getType() {
		return "location";
	}
}