type Bucket = { put: (key: string, value: ReadableStream, options?: { httpMetadata?: { contentType?: string } }) => Promise<unknown> };
export const onRequestPost = async ({ request, env }: { request: Request; env: { MEDIA_BUCKET: Bucket; PUBLIC_MEDIA_URL?: string } }) => {
  const form = await request.formData(); const file = form.get('file');
  if (!(file instanceof File)) return new Response('file is required',{status:400});
  if (!file.type.startsWith('image/')&&!file.type.startsWith('video/')) return new Response('Only image and video files are supported',{status:415});
  const key='uploads/'+new Date().toISOString().slice(0,10)+'/'+crypto.randomUUID()+'-'+file.name.replace(/[^a-zA-Z0-9._-]/g,'-');
  await env.MEDIA_BUCKET.put(key,file.stream(),{httpMetadata:{contentType:file.type}});
  const base=(env.PUBLIC_MEDIA_URL||new URL(request.url).origin).replace(/\/$/,'');
  return Response.json({url:base+'/'+key,key});
};
