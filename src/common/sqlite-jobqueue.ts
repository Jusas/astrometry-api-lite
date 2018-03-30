import * as sqlite from "sqlite";
import { JobProcessingError } from "./models/error";
import { JobQueueEntry, JobCalibrationResultData, JobFileInfo } from "./models/job";
import { JobParams } from "./models/job";
const datetime = require("node-datetime");

export class SqliteJobQueue {

    private dbFile: string;
    private db: sqlite.Database;

    constructor(dbFile: string) {
        this.dbFile = dbFile;        
    }

    private async ensureOpen(): Promise<void> {
        if(!this.db) {
            this.db = await sqlite.open(this.dbFile);
            await this.db.run("PRAGMA journal_mode = DEL;");
            this.db.on("close", () => {
                this.db = null;
            });
        }
    }

    public async release(): Promise<void> {
        if(this.db) {
            await this.db.close();
            this.db = null;
        }
    }

    private async waitSecs(secs: number) {
        return new Promise<void>( (resolve, reject) => {
            setTimeout( () => {
                resolve();
            }, 1000 * secs);
        });        
    }

    private async resilientDbOp(op: () => Promise<any>, maxRetries: number = -1, transaction: boolean = false): Promise<any> {
        await this.ensureOpen();
        
        let tries = 0;
        let keepTrying = true;
        let error = null;
        const waitSec = 0.1;
        let result = null;

        while(keepTrying) {
            try {
                tries += 1;
                if(transaction) {
                    await this.db.run("begin immediate");
                }
                result = await op();
                if(transaction) {
                    await this.db.run("commit");
                }
                keepTrying = false;
            }
            catch(err) {
                
                if(transaction) {
                    try {
                        await this.db.run("commit");
                    }
                    catch {}
                }
                
                if(maxRetries >= 0 && tries > maxRetries) {
                    keepTrying = false;
                    error = err;
                }
                if(keepTrying) {
                    await this.waitSecs(waitSec * 1.5);
                }
            }
        }

        if(error) {
            console.error("Error with db operation: ", error);
            await this.db.close();
            throw new JobProcessingError(`Resilient db op failed after ${tries} tries`, []);
        }

        // if(result == null && tries > maxRetries) {
        //     throw new JobProcessingError(`Resilient db op failed after ${tries} tries`, []);
        // }

        return result;
    }

    public async countUnprocessed(maxRetries: number = -1): Promise<number> {
        
        const result = await this.resilientDbOp( async () => {
            return await this.db.get("select count(*) as count from JobQueue where processing_state = 0");
        }, maxRetries).catch( (err) => console.log("Unable to get queue count"));
        if(result) {
            return result.count;
        }
        return -1;     
    }

    public async countUnprocessedAndProcessing(maxRetries: number = -1): Promise<number> {
        
        const result = await this.resilientDbOp( async () => {
            return await this.db.get("select count(*) as count from JobQueue where processing_state <= 1");
        }, maxRetries).catch( (err) => console.log("Unable to get queue count"));
        if(result) {
            return result.count;
        }
        return -1;
    }

    public async createWorkItem(params: JobParams, fileInfo: JobFileInfo, maxRetries: number = -1) : Promise<number> {

        const result = await this.resilientDbOp( async () => {
            let insert = "insert into JobQueue (created, processing_state, filename, original_filename, url";
            let s = [];

            if(params.center_dec) s.push({k: "p_center_dec", v: params.center_dec});
            if(params.center_ra) s.push({k: "p_center_ra", v: params.center_ra});
            if(params.crpix_center) s.push({k: "p_crpix_center", v: params.crpix_center});
            if(params.downsample_factor) s.push({k: "p_downsample_factor", v: params.downsample_factor});
            if(params.parity) s.push({k: "p_parity", v: params.parity});
            if(params.positional_error) s.push({k: "p_positional_error", v: params.positional_error});
            if(params.radius) s.push({k: "p_radius", v: params.radius});
            if(params.scale_err) s.push({k: "p_scale_err", v: params.scale_err});
            if(params.scale_est) s.push({k: "p_scale_est", v: params.scale_est});
            if(params.scale_lower) s.push({k: "p_scale_lower", v: params.scale_lower});
            if(params.scale_type) s.push({k: "p_scale_type", v: params.scale_type});
            if(params.scale_units) s.push({k: "p_scale_units", v: params.scale_units});
            if(params.scale_upper) s.push({k: "p_scale_upper", v: params.scale_upper});
            if(params.tweak_order) s.push({k: "p_tweak_order", v: params.tweak_order});
        
            if(s.length > 0) {
                s.map((parm) => insert += `,${parm.k}`);			
            }
        
            insert += `) VALUES (?, ?, ?, ?, ?`;
            s.forEach(() => insert += `,?`);
        
            let values = [datetime.create().now(), 0, fileInfo.filename || null, fileInfo.original_filename || null, fileInfo.url || null];
            s.map((parm) => values.push(parm.v));
        
            insert += "); SELECT last_insert_rowid()";

            const stmt = await this.db.prepare(insert);
            const res = await stmt.run(values);
            await res.finalize();
            
            return res.lastID;
        }, maxRetries, true).catch( (err) => {
            console.log("Unable to create an item in the queue", err);
        });
        return result || -1;
    }

    public async reserveWorkItem(worker: string, maxRetries: number = -1): Promise<JobQueueEntry> {

        const result = await this.resilientDbOp( async () => {
            const item = await this.db.get("select * from JobQueue where processing_state = 0 order by created");
            if(item) {
                const now = datetime.create().now();
                const stmt = await this.db.prepare(`update JobQueue set processing_state = 1, worker_id = ?, processing_started = ? where id = ${item.id}`);
                await stmt.run([worker, now]);
                await stmt.finalize();
                item.worker_id = worker;
                item.processing_state = 1;
                item.processing_started = now;                
            }
            return item;
        }, maxRetries, true).catch( (err) => {
            console.log("Unable to pop an item from queue", err);
        });
        return result || null;     
    }

    public async saveWorkItemResult(itemId: number, resultData: JobCalibrationResultData, maxRetries: number = -1) : Promise<void> {
        
        await this.resilientDbOp( async () => {
            
            const updateData = [
                datetime.create().now(),
                resultData.result_dec,
                resultData.result_orientation,
                resultData.result_parity,
                resultData.result_pixscale,
                resultData.result_ra,
                resultData.result_radius
            ];
            const stmt = await this.db.prepare(`update JobQueue set processing_state = 2, processing_finished = ?, result_dec = ?,
                result_orientation = ?, result_parity = ?, result_pixscale = ?, result_ra = ?, result_radius = ?
                where id = ${itemId}`);
            await stmt.run(updateData);
            await stmt.finalize();
        }, maxRetries, true).catch( (err) => {
            console.log("Unable to update work result", err);
            throw new JobProcessingError("Job result saving has failed for job " + itemId, []);
        });
    }

    public async trySetWorkItemFailed(itemId: number, errorText: string, maxRetries: number = -1) : Promise<void> {
        
        const updateData = [
            datetime.create().now(),
            errorText
        ];
        await this.resilientDbOp( async() => {
            const stmt = await this.db.prepare(`update JobQueue set processing_state = 3, 
                processing_finished = ?, error_text = ? where id = ${itemId}`);
            await stmt.run(updateData);
            await stmt.finalize();
        }, maxRetries, true).catch( (err) => {
            console.log("Unable to set work result as failure for job " + itemId);
            throw new JobProcessingError("Job result saving as failure has failed for job " + itemId, []);
        });
    }

    public async getWorkItem(id: number, maxRetries: number = -1): Promise<JobQueueEntry> {

        const result = await this.resilientDbOp( async() => {
            const stmt = await this.db.prepare(`select * from JobQueue where id = ?`);
            const item = await stmt.get(id);      
            await stmt.finalize();      
            return item;
        }, maxRetries, false).catch( (err) => {
            console.log("Could not get work item id " + id);
        });
        return result || null;
    }

    public async getLatestWorkItems(count: number, maxRetries: number = -1): Promise<JobQueueEntry[]> {
        const result = await this.resilientDbOp( async() => {
            const stmt = await this.db.prepare(`select * from JobQueue order by created desc limit ?`);
            const items = await stmt.all(count);
            await stmt.finalize();
            return items;
        }, maxRetries, false).catch( (err) => {
            console.log("Could not get latest work items");
        });
        return result || null;
    }
}