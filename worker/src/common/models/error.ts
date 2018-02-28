export class JobProcessingError extends Error {
	output: string[];
	constructor(message?: string, output?: string[]) {
		super(message);
        this.output = output;
        
	}
}