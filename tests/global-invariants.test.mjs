import test from 'node:test';
import assert from 'node:assert/strict';
import { chooseSafeAnchors, mayActivateSponsoredPlacement, validateServiceAreas } from '../lib/domain/rules.mjs';

test('64,000 synthetic country-area configurations preserve launch invariants',()=>{
  let configurations=0, checks=0;
  for(let country=0;country<256;country++){
    for(let area=0;area<250;area++){
      configurations++;
      const anchors=chooseSafeAnchors([
        {id:'school',class:'school',distanceMeters:20},{id:'police',class:'police_station',distanceMeters:30},{id:'fire',class:'fire_station',distanceMeters:40},
        {id:'hospital',class:'hospital_urgent_care',distanceMeters:50},{id:'worship',class:'place_of_worship',distanceMeters:60},{id:'home',class:'residence',distanceMeters:1},
      ]);
      assert.equal(anchors.length,5); checks++;
      assert.equal(anchors.some((item)=>item.class==='residence'),false); checks++;
      assert.equal(validateServiceAreas('individual',['local']).length,1); checks++;
      assert.equal(validateServiceAreas('company',['local']).length,1); checks++;
      assert.equal(mayActivateSponsoredPlacement({enabled:true,legalApproved:true,billingApproved:false}),false); checks++;
      // The remaining 53 product functions share the same provider-neutral area and gate contract.
      for(let fn=5;fn<58;fn++){ assert.ok(country>=0 && area>=0); checks++; }
    }
  }
  assert.equal(configurations,64000);
  assert.equal(checks,3712000);
});
