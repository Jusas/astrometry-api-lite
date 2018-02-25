import { JobParams } from "./job";

export enum Consent {
	yes = "y",
	no = "n"
}

export enum ConsentWithDefault {
	yes = "y",
	no = "n",
	default = "d"
}

export enum ConsentLicenseExpanded {
	yes = "y",
	no = "n",
	default = "d",
	sharealike = "sa"
}
	
export interface UploadRequestWrapper {
	"request-json": UploadRequest
}

export interface UrlUploadRequestWrapper {
	"request-json": UrlUploadRequest
}

export interface UploadRequest extends JobParams {
	session?: string,
	publicly_visible?: Consent,
	allow_modifications?: ConsentLicenseExpanded,
	allow_commercial_use?: ConsentWithDefault
}

export interface UrlUploadRequest extends JobParams {
	url: string
}

export enum UploadProcessingStatus {
	success = "success",
	error = "error"
}

export interface UploadResponse {
	status: UploadProcessingStatus,
	/** 
	 * @isInt
	*/
	subid: number,
	hash: string
}
