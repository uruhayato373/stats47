import type {Store} from './workspace.mjs';
export function mediaStore():Store;
export function readVerified(reference:{bucket?:string;key?:string;sha256?:string;bytes?:number}):Promise<Buffer>;
export function archiveSnsImage(input:{platform:string;id:number;role:string;order:number;bytes:Buffer;mime:string;source?:string;drivePath?:string},store?:Store):Promise<{role:string;order:number;state:'archived';r2:{bucket:string;key:string};sha256:string;bytes:number;mime:string;source:string|null;drive_path?:string}>;
