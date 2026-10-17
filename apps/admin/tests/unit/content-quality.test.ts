import { describe,it,expect,vi } from 'vitest';
import { assertWorkspaceMutation,workspaceJson } from '@/lib/server/workspace-request';
import { POST } from '@/app/api/media-library/[id]/candidate/route';
vi.mock('@/lib/server/content-quality',()=>({importImage:vi.fn()}));
describe('content quality write boundaries',()=>{
 const request=(headers:Record<string,string>)=>new Request('http://127.0.0.1:4757/api/content-quality',{method:'PATCH',headers,body:'{}'});
 it('permits same-origin JSON and rejects remote/cross-site writers',()=>{
   expect(()=>assertWorkspaceMutation(request({origin:'http://127.0.0.1:4757',host:'127.0.0.1:4757','content-type':'application/json'}))).not.toThrow();
   expect(()=>assertWorkspaceMutation(request({origin:'https://example.com','content-type':'application/json'}))).toThrow();
   expect(()=>assertWorkspaceMutation(request({origin:'http://127.0.0.1:4757','sec-fetch-site':'cross-site','content-type':'application/json'}))).toThrow();
 });
 it('rejects oversized JSON before saving',async()=>{
   const req=new Request('http://localhost:4757/api/content-quality',{method:'PATCH',headers:{origin:'http://localhost:4757','content-type':'application/json'},body:'x'.repeat(31000)});
   await expect(workspaceJson(req)).rejects.toThrow('長すぎ');
 });
 it('rejects cross-origin file upload before parsing multipart',async()=>{
   const result=await POST(new Request('http://localhost:4757/api/media-library/a/candidate',{method:'POST',headers:{origin:'https://example.com'}}),{params:Promise.resolve({id:'a'})});
   expect(result.status).toBe(403);
 });
});
