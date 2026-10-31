import {describe,it,expect} from "vitest";
import {
  fromTotpBase32, generateTotpCode, generateTotpSecretBase32,
  matchTotpCounter, toTotpBase32,
} from "./totp";

const encoder=new TextEncoder();
const sha1=encoder.encode("12345678901234567890");
const sha256=encoder.encode("12345678901234567890123456789012");
const sha512=encoder.encode("1234567890123456789012345678901234567890123456789012345678901234");

describe("RFC 6238 compatibility — pure TOTP only, MFA remains disabled",()=>{
  it("reproduces all six published SHA-1 RFC 6238 8-digit vectors",async()=>{
    const samples:[number,string][]=[
      [59,"94287082"],
      [1111111109,"07081804"],
      [1111111111,"14050471"],
      [1234567890,"89005924"],
      [2000000000,"69279037"],
      [20000000000,"65353130"],
    ];
    for(const [epoch,code] of samples)
      expect(await generateTotpCode(sha1,epoch*1000,{hash:"SHA-1",digits:8})).toBe(code);
  });
  it("reproduces RFC 6238 SHA-256 / SHA-512 test vectors",async()=>{
    const samples:[number,string,string][]=[
      [59,"46119246","90693936"],
      [1111111109,"68084774","25091201"],
      [1111111111,"67062674","99943326"],
      [1234567890,"91819424","93441116"],
      [2000000000,"90698825","38618901"],
      [20000000000,"77737706","47863826"],
    ];
    for(const [epoch,sha256code,sha512code] of samples){
      expect(await generateTotpCode(sha256,epoch*1000,{hash:"SHA-256",digits:8})).toBe(sha256code);
      expect(await generateTotpCode(sha512,epoch*1000,{hash:"SHA-512",digits:8})).toBe(sha512code);
    }
  });
  it("pads six-digit codes with zeroes and validates exact format",async()=>{
    const code=await generateTotpCode(sha1,1111111109*1000,{digits:6});
    expect(code).toBe("081804");
    expect(await matchTotpCounter(sha1,code,1111111109*1000,{window:0})).toBe(Math.floor(1111111109/30));
    expect(await matchTotpCounter(sha1,"81804",1111111109*1000,{window:0})).toBeNull();
    expect(await matchTotpCounter(sha1,code+" ",1111111109*1000,{window:0})).toBeNull();
    expect(await matchTotpCounter(sha1,"abc123",1111111109*1000,{window:0})).toBeNull();
  });
  it("accepts defined ±1 clock drift but not wider values",async()=>{
    const center=300_000;
    const prev=await generateTotpCode(sha1,center-30_000);
    const next=await generateTotpCode(sha1,center+30_000);
    const far=await generateTotpCode(sha1,center+60_000);
    expect(await matchTotpCounter(sha1,prev,center)).toBe(9);
    expect(await matchTotpCounter(sha1,next,center)).toBe(11);
    expect(await matchTotpCounter(sha1,far,center)).toBeNull();
    expect(await matchTotpCounter(sha1,prev,center,{window:0})).toBeNull();
  });
  it("rejects an already accepted step; D1 still must enforce atomic replay guard",async()=>{
    const time=600_000;
    const code=await generateTotpCode(sha1,time);
    expect(await matchTotpCounter(sha1,code,time,{lastAcceptedCounter:19})).toBe(20);
    expect(await matchTotpCounter(sha1,code,time,{lastAcceptedCounter:20})).toBeNull();
    expect(await matchTotpCounter(sha1,code,time,{lastAcceptedCounter:21})).toBeNull();
  });
  it("roundtrips secure 160-bit base32 secrets, never accepts malformed/padded strings",()=>{
    const b32=toTotpBase32(sha1);
    expect(b32).toBe("GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ");
    expect([...fromTotpBase32(b32)]).toEqual([...sha1]);
    const fresh=generateTotpSecretBase32();
    expect(fresh).toMatch(/^[A-Z2-7]{32}$/);
    expect(fromTotpBase32(fresh)).toHaveLength(20);
    for(const secret of ["",b32+"=",b32.toLowerCase(),b32.replace("A","1"),"A".repeat(32)+"A","A".repeat(20)])
      expect(()=>fromTotpBase32(secret)).toThrow("INVALID_TOTP_BASE32");
  });
  it("rejects weak keys, invalid timestamps and unsafe settings",async()=>{
    await expect(generateTotpCode(new Uint8Array(8),0)).rejects.toThrow("INVALID_TOTP_KEY");
    await expect(generateTotpCode(sha1,-1)).rejects.toThrow("INVALID_TOTP_TIMESTAMP");
    await expect(generateTotpCode(sha1,Number.POSITIVE_INFINITY)).rejects.toThrow("INVALID_TOTP_TIMESTAMP");
    await expect(generateTotpCode(sha1,0,{digits:7 as 6})).rejects.toThrow("INVALID_TOTP_OPTIONS");
    await expect(matchTotpCounter(sha1,"123456",0,{window:3 as 1})).rejects.toThrow("INVALID_TOTP_WINDOW");
    await expect(matchTotpCounter(sha1,"123456",0,{lastAcceptedCounter:0.5})).rejects.toThrow("INVALID_TOTP_LAST_COUNTER");
  });
});
