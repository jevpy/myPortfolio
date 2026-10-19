import { safeId, safeTitle, safeTime, makeArticle, WINDOW_SECONDS } from '../src/data/hacker-news.mjs';
import { requestJsonUrl } from './news-http.mjs';
export const API_BASE='https://hn.algolia.com/api/v1';
export function requestJson(path,options){if(!path.startsWith('search_by_date?'))throw Error('Invalid pinned search path');return requestJsonUrl(`${API_BASE}/${path}`,options);}
export function articleFromHit(hit,clock){
 if(!hit||typeof hit!=='object')throw Error('Invalid search hit');if(hit.dead||hit.deleted)return null;
 if(typeof hit.objectID!=='string'||!/^\d+$/.test(hit.objectID)||!safeId(Number(hit.objectID))||!safeTime(hit.created_at_i)||!Number.isInteger(hit.created_at_i)||!safeTitle(hit.title))throw Error('Invalid search hit');
 if((hit.type&&hit.type!=='story')||(hit._tags&&(!Array.isArray(hit._tags)||!hit._tags.includes('story')))||hit.created_at_i>clock||hit.created_at_i<clock-WINDOW_SECONDS)return null;
 return makeArticle({source:'hn',sourceId:hit.objectID,title:hit.title,url:hit.url,eventAt:new Date(hit.created_at_i*1000).toISOString()},clock);
}
