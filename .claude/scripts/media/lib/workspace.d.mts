export interface StoredObject { provider: 'r2-private'; bucket: string; key: string; sha256: string; bytes: number }
export type CheckName = 'data'|'images'|'placement'|'intro'|'sources'|'links';
export type CheckState = 'unchecked'|'pass'|'issue'|'na';
export interface Review { priority: 'high'|'normal'|'low'; policy: string; checks: Record<CheckName,CheckState>; basis?: string; updatedAt?: string }
export interface VisualReview { status:'pass'|'needs-revision'; reason:string; original:boolean; mobile:boolean; data:boolean; reviewedAt?:string }
export interface Candidate { id:string; basis:string; storage:StoredObject; input:StoredObject; width:number; height:number; createdAt:string; review:VisualReview|null }
export interface ImageRecord { templateId:string; policy:string; revisions:Candidate[]; candidateId:string|null; approvedId:string|null }
export interface Quality { schemaVersion:1; reviews:Record<string,Review>; images:Record<string,ImageRecord> }
export interface Template { id:string; version:number; label:string; policy:string; profiles:{note:string;x:string;instagram:string}; renderer:string|null }
export interface Item { id:string;channel:string;key:string;title:string;category:string;status:string;url:string|null;publishedAt:string|null;bodyStore:string;bodySaved:boolean;basis:string }
export interface ItemView extends Item { review:Review;reviewState:string;stale:boolean;revision:string }
export interface InputFile { name:string;sha256:string;bytes:number }
export interface Original { provider:string;bucket?:string;key?:string;sha256?:string;bytes?:number;drivePath?:string|null }
export interface ImageView { id:string;owner:string;file:string;title:string;channel:string;category:string;original:Original|null;templateId:string;policy:string;basis:string;revision:string;record:ImageRecord|null;candidate:Candidate|null;candidateMatches:boolean;approved:boolean;kind?:'cover';coverUrl?:string|null;coverCandidateUrl?:string|null;coverManagement?:string;inputFiles:InputFile[];inventoryStatus:string;legacyUrl?:string|null;missingReason?:string|null }
export interface Store {get(key:string):Promise<Buffer|null>;put(key:string,bytes:Buffer):Promise<void>}
export const ROOT:string;
export const FILES:{quality:string;inventory:string;templates:string};
export const CHECKS:CheckName[];
export class WorkspaceError extends Error { status:number; constructor(message:string,status?:number) }
export function sha(value:unknown):string;
export function imageId(owner:string,name:string):string;
export function safeName(name:string):boolean;
export function readQuality(root?:string):Quality;
export function validateQuality(value:unknown):Quality;
export function readTemplates(root?:string):{schemaVersion:1;templates:Template[]};
export function defaultReview():Review;
export function sourceItems(root?:string):Item[];
export function workspaceItems(root?:string):ItemView[];
export function saveReview(root:string,id:string,expected:string,review:Review):void;
export function imageLibrary(root?:string):{images:ImageView[];templates:Template[];inventoryUpdatedAt:string|null};
export function imageById(root:string,id:string):ImageView;
export function saveImagePlan(root:string,id:string,expected:string,plan:{templateId:string;policy:string}):void;
export function registerCandidate(root:string,id:string,expected:string,candidate:Candidate):void;
export function reviewCandidate(root:string,id:string,expected:string,candidateId:string,review:VisualReview):void;
export function saveTemplate(root:string,id:string,expected:string,next:{policy:string;profiles:Template['profiles']}):void;
export function candidateKey(hash:string,extension:string):string;
export function inputKey(hash:string):string;
export function storeVerified(store:Store,key:string,bytes:Buffer):Promise<StoredObject>;
