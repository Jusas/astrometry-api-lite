// Doing this because Jimp typedef doesn't seem to be up-to-date :(
declare module Jimp {
	export interface Jimp {
		getBase64(mime: string, cb?: any): this;
	}
}