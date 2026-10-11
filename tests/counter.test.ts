import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { POST } from "../app/api/views/route";
const originalFetch = globalThis.fetch;
const originalUrl = process.env.TURSO_DATABASE_URL;
const originalToken = process.env.TURSO_AUTH_TOKEN;
afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalUrl === undefined) delete process.env.TURSO_DATABASE_URL;
  else process.env.TURSO_DATABASE_URL = originalUrl;
  if (originalToken === undefined) delete process.env.TURSO_AUTH_TOKEN;
  else process.env.TURSO_AUTH_TOKEN = originalToken;
});
const request = (origin = "https://tracewallet.vercel.app") => new Request("https://tracewallet.vercel.app/api/views", {method: "POST", headers: {origin}});
function config() { process.env.TURSO_DATABASE_URL = "libsql://example.turso.io"; process.env.TURSO_AUTH_TOKEN = "test-only"; }
test("rejects foreign origins before contacting storage", async () => {
  globalThis.fetch = () => { throw new Error("Must not fetch"); };
  assert.equal((await POST(request("https://another.example"))).status, 403);
});
test("missing storage returns unavailable without inventing a count", async () => {
  delete process.env.TURSO_DATABASE_URL; delete process.env.TURSO_AUTH_TOKEN;
  assert.equal((await POST(request())).status, 503);
});
test("returns stored total from atomic increment without caching", async () => {
  config();
  globalThis.fetch = async (url, init) => {
    assert.equal(String(url), "https://example.turso.io/v2/pipeline");
    const payload = JSON.parse(String(init?.body));
    assert.match(payload.requests[1].stmt.sql, /total = total \+ 1 RETURNING total/);
    return Response.json({results: [{type: "ok"}, {type: "ok", response: {result: {rows: [[{value: "1042"}]]}}}]});
  };
  const result = await POST(request());
  assert.equal(result.status, 200);
  assert.equal(result.headers.get("Cache-Control"), "no-store");
  assert.deepEqual(await result.json(), {total: 1042});
});
test("database errors stay unavailable and reveal no token", async () => {
  config();
  globalThis.fetch = async () => Response.json({results: [{type: "error"}]});
  const result = await POST(request());
  assert.equal(result.status, 503);
  assert.equal((await result.text()).includes("test-only"), false);
});
test("invalid counts are rejected", async () => {
  config();
  globalThis.fetch = async () => Response.json({results: [{type: "ok"}, {response: {result: {rows: [[{value: "not-a-number"}]]}}}]});
  assert.equal((await POST(request())).status, 503);
});
