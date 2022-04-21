export default class UserProfile {
	public readonly id: any;
	public readonly name: any;
	public readonly avatar: any;
	public readonly country: any;
	public readonly language: any;
	public readonly apiVersion: any;

	constructor(id: string, name?: string, avatar?: string, country?: string, language?: string, apiVersion?: string) {
		this.id = id;
		this.name = name;
		this.avatar = avatar || null;
		this.country = country || null;
		this.language = language || null;
		this.apiVersion = apiVersion || null;
	}

	static fromJson(jsonSender: Record<string, string>) {
		if (!jsonSender) throw new Error("Json data must be non-null");
		return new UserProfile(jsonSender.id, jsonSender.name, jsonSender.avatar, jsonSender.country, jsonSender.language, jsonSender.api_version);
	};
}