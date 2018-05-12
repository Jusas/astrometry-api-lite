

export interface CreatedJobEntry {
  id: number,
  hash: string
}

export enum ProcessingState {
  Queued,
  Processing,
  Succeeded,
  Failed
}

export interface JobStatus {
  id: number,
  processing_started: number,
  processing_finished: number,
  processing_state: ProcessingState
}


export enum JobStatusResponseStatus {
  none = "none",
  success = "success",
  solving = "solving",
  failure = "failure"
}

export interface JobStatusResponse {
  status: JobStatusResponseStatus
}

export interface JobCalibrationResponse {
  parity: number,
  orientation: number,
  pixscale: number,
  radius: number,
  ra: number,
  dec: number
}

export interface JobInfoResponse extends JobStatusResponse {
  calibration: JobCalibrationResponse,
  machine_tags: Array<string>,
  tags: Array<string>,
  original_filename: string,
  objects_in_field: Array<string>
}
