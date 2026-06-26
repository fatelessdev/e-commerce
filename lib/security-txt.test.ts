import assert from "node:assert/strict";
import { test } from "node:test";
import { buildSecurityTxt, SECURITY_TXT_CONTENT_TYPE } from "./security-txt.ts";

test("security.txt advertises the public contact and canonical file", () => {
  const body = buildSecurityTxt("https://xilar.in");

  assert.match(body, /^Contact: mailto:contact@xilar\.in$/m);
  assert.match(body, /^Canonical: https:\/\/xilar\.in\/\.well-known\/security\.txt$/m);
  assert.match(body, /^Preferred-Languages: en, hi$/m);
  assert.ok(body.endsWith("\n"));
});

test("security.txt content type is plain text", () => {
  assert.equal(SECURITY_TXT_CONTENT_TYPE, "text/plain; charset=utf-8");
});
