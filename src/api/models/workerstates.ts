export interface WorkerState {
	pid: number,
	cpu: number
}

export interface WorkerSystemState {
	workerManagerRunning: boolean,
	activeWorkers: WorkerState[]
}