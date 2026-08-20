import test from 'node:test';
import assert from 'node:assert/strict';
import { addProvider, addUser, blockUser, createFlowState, discover, moderateReport, providerRespond, publishExperience, relateReferral, reportContent } from '../lib/domain/roleFlows.mjs';

const anchor={class:'fire_station',name:'Community Fire Station',serviceAreaId:'area-1'};
const baseDraft={provider:{id:'provider-individual'},serviceMonth:'2026-06-01',comment:'Clear estimate and careful completed work.',serviceItem:'Repaired a damaged gate latch',rating:{quality:5,value:4,reliability:5,communication:5,recommend:5},anchor,costMinor:32000,currency:'USD'};

function seeded() {
  const state=createFlowState();
  addUser(state,{id:'sharer-1',role:'sharer',alias:'NeighborOne'}); addUser(state,{id:'searcher-1',role:'searcher',alias:'FinderOne'});
  addUser(state,{id:'provider-1',role:'individual_provider',alias:'FixerOne'}); addUser(state,{id:'company-1',role:'company_provider',alias:'CompanyAdmin'}); addUser(state,{id:'admin-1',role:'admin',alias:'Moderator'});
  addProvider(state,{id:'provider-individual',ownerId:'provider-1',kind:'individual',categoryIds:['handyman'],serviceAreaIds:['area-1']});
  addProvider(state,{id:'provider-company',ownerId:'company-1',kind:'company',categoryIds:['plumber'],serviceAreaIds:['area-1','area-2']});
  return state;
}

test('sharer publishes a completed experience under alias snapshot',()=>{const state=seeded();const result=publishExperience(state,'sharer-1',baseDraft);assert.equal(result.aliasSnapshot,'NeighborOne');assert.equal(result.status,'published');});
test('provider cannot impersonate a community sharer',()=>{const state=seeded();assert.throws(()=>publishExperience(state,'provider-1',baseDraft));});
test('searcher creates one helpful relationship and upgrades it',()=>{const state=seeded();const exp=publishExperience(state,'sharer-1',baseDraft);relateReferral(state,'searcher-1',exp.id,'helpful');relateReferral(state,'searcher-1',exp.id,'helpful');assert.equal(state.referrals.size,1);assert.equal(relateReferral(state,'searcher-1',exp.id,'verified').status,'verified');assert.equal(state.referrals.size,1);});
test('sharer cannot self-credit recommendation',()=>{const state=seeded();const exp=publishExperience(state,'sharer-1',baseDraft);assert.throws(()=>relateReferral(state,'sharer-1',exp.id,'helpful'));});
test('individual provider responds but cannot edit experience',()=>{const state=seeded();const exp=publishExperience(state,'sharer-1',baseDraft);assert.equal(providerRespond(state,'provider-1',exp.id,'Thank you for sharing.'),'Thank you for sharing.');assert.equal(state.experiences.get(exp.id).comment,baseDraft.comment);});
test('unrelated company cannot respond to another provider experience',()=>{const state=seeded();const exp=publishExperience(state,'sharer-1',baseDraft);assert.throws(()=>providerRespond(state,'company-1',exp.id,'Not ours.'));});
test('authenticated user reports content and admin moderates',()=>{const state=seeded();const report=reportContent(state,'searcher-1','exp-1','Possible private information.');assert.equal(moderateReport(state,'admin-1',report.id,'actioned').status,'actioned');assert.equal(state.audit.length,1);});
test('non-admin cannot decide reports',()=>{const state=seeded();const report=reportContent(state,'searcher-1','exp-1','Possible false information.');assert.throws(()=>moderateReport(state,'provider-1',report.id,'dismissed'));});
test('blocking is directional and self-block is rejected',()=>{const state=seeded();blockUser(state,'searcher-1','provider-1');assert.ok(state.blocks.has('searcher-1:provider-1'));assert.throws(()=>blockUser(state,'searcher-1','searcher-1'));});
test('sponsored and organic cards remain one entity card',()=>{const cards=discover([{providerId:'p1',branchId:'b1',placement:'organic',publicationStatus:'published'},{providerId:'p1',branchId:'b1',placement:'sponsored',publicationStatus:'published'}]);assert.equal(cards.length,1);assert.equal(cards[0].placement,'sponsored');});
test('1000 mixed actors preserve role boundaries',()=>{
  const state=seeded();
  for(let i=0;i<200;i++){addUser(state,{id:`s-${i}`,role:'sharer',alias:`Sharer${i}`});addUser(state,{id:`q-${i}`,role:'searcher',alias:`Searcher${i}`});addUser(state,{id:`p-${i}`,role:'individual_provider',alias:`Provider${i}`});addUser(state,{id:`c-${i}`,role:'company_provider',alias:`Company${i}`});addUser(state,{id:`admin-${i+10}`,role:'admin',alias:`Admin${i}`});}
  assert.equal(state.users.size,1005);
  for(let i=0;i<200;i++) assert.equal(state.users.get(`q-${i}`).role,'searcher');
});
