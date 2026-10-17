import { describe, expect, it } from 'vitest';
import { cmsModules } from './cms-schema';
import { cmsJsonExample, cmsJsonExamples, cmsJsonInstruction } from './cms-json-guidance';

describe('CMS JSON guidance',()=>{
  for(const config of Object.values(cmsModules)){
    for(const field of config.fields.filter(f=>f.type==='json'&&!f.readonly)){
      it(`${config.key}.${field.key} has a valid example and instruction`,()=>{
        expect(cmsJsonExamples).toHaveProperty(field.key);
        expect(JSON.parse(cmsJsonExample(field.key))).toEqual(cmsJsonExamples[field.key]);
        expect(cmsJsonInstruction(field.key).length).toBeGreaterThan(40);
      });
    }
  }
});
