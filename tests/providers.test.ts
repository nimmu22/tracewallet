import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { getEvmStats } from '../services/evm';
import { fetchJSON } from '../services/http';
import { networkById } from '../services/types';
const originalFetch = globalThis.fetch;
const envNames = ['BLOCKSCOUT_API_KEY', 'ETHERSCAN_API_KEY', 'ROUTESCAN_API_KEY'] as const;
const saved = Object.fromEntries(envNames.map(name => [name, process.env[name]]));
afterEach(() => {
  globalThis.fetch = originalFetch;
  for (const name of envNames) {
    if (saved[name] === undefined) delete process.env[name];
    else process.env[name] = saved[name];
  }
});
function config() { for (const name of envNames) delete process.env[name]; }
const address = (i: number) => '0x' + i.toString(16).padStart(40, '0');
const row = (from: string) => ({ hash: '0x' + 'a'.repeat(64), timeStamp: '1700000000', from, to: address(99), value: '1000000000000000000', gasUsed: '21000', gasPrice: '1000000000', isError: '0' });
test('Base 403 falls back to configured Etherscan, without inventing missing L1 fees', async () => {
  config(); process.env.ETHERSCAN_API_KEY = 'fixture-only';
  const calls: string[] = [];
  globalThis.fetch = async input => {
    const url = String(input); calls.push(url);
    if (url.includes('base.blockscout.com')) return new Response('', { status: 403 });
    assert.equal(new URL(url).searchParams.get('chainid'), '8453');
    return Response.json({ status: '1', message: 'OK', result: [row(address(1))] });
  };
  const stats = await getEvmStats(networkById('base')!, address(1));
  assert.equal(calls.length, 2); assert.equal(stats.provider, 'Etherscan V2');
  assert.equal(stats.transactionCount, 1); assert.equal(stats.firstActivity, '2023-11-14T22:13:20.000Z');
  assert.equal(stats.gasSpentNative, null);
});
test('Avalanche loads actual indexed history without Etherscan credentials', async () => {
  config();
  globalThis.fetch = async input => {
    assert.match(String(input), /routescan\.io.*43114/);
    return Response.json({ status: '1', message: 'OK', result: [row(address(2)), {...row(address(99)), hash: '0x' + 'b'.repeat(64)}] });
  };
  const stats = await getEvmStats(networkById('avalanche')!, address(2));
  assert.equal(stats.provider, 'Routescan'); assert.equal(stats.transactionCount, 2);
  assert.equal(stats.feeTransactionCount, 1); assert.equal(stats.gasSpentNative, .000021);
});
test('Blockscout PRO uses authenticated API endpoint and actual fee data', async () => {
  config(); process.env.BLOCKSCOUT_API_KEY = 'fixture-pro';
  globalThis.fetch = async input => {
    const url = new URL(String(input));
    assert.equal(url.hostname, 'api.blockscout.com'); assert.match(url.pathname, /^\/42161\/api\/v2/);
    assert.equal(url.searchParams.get('apikey'), 'fixture-pro');
    return Response.json({items: [{hash: row(address(3)).hash, timestamp: '2023-11-14T22:13:20.000Z', from: {hash: address(3)}, to: {hash: address(99)}, value: '0', fee: {type: 'actual', value: '1000000000000000'}, gas_used: '21000', status: 'ok'}], next_page_params: null});
  };
  const stats = await getEvmStats(networkById('arbitrum')!, address(3));
  assert.equal(stats.provider, 'Blockscout PRO'); assert.equal(stats.gasSpentNative, .001);
});
test('verified empty history is zero, whereas provider error with an empty array remains unavailable', async () => {
  config(); process.env.ETHERSCAN_API_KEY = 'fixture-only';
  globalThis.fetch = async () => Response.json({status: '0', message: 'No transactions found', result: []});
  const empty = await getEvmStats(networkById('bnb')!, address(4));
  assert.equal(empty.transactionCount, 0); assert.equal(empty.complete, true); assert.equal(empty.gasSpentNative, 0);
  globalThis.fetch = async () => Response.json({status: '0', message: 'NOTOK', result: []});
  await assert.rejects(getEvmStats(networkById('bnb')!, address(5)), /temporarily unavailable/);
});
test('missing BNB configuration is explicit, and a failed lookup can be retried after setup', async () => {
  config(); let calls = 0;
  globalThis.fetch = async () => { calls++; return Response.json({status: '1', message: 'OK', result: []}); };
  await assert.rejects(getEvmStats(networkById('bnb')!, address(6)), /ETHERSCAN_API_KEY/);
  assert.equal(calls, 0);
  process.env.ETHERSCAN_API_KEY = 'fixture-only';
  assert.equal((await getEvmStats(networkById('bnb')!, address(6))).transactionCount, 0);
  assert.equal(calls, 1);
});
test('malformed successful history never becomes a zero count', async () => {
  config(); process.env.ETHERSCAN_API_KEY = 'fixture-only';
  globalThis.fetch = async () => Response.json({status: '1', message: 'OK', result: [{hash: 'broken'}]});
  await assert.rejects(getEvmStats(networkById('bnb')!, address(7)), /temporarily unavailable/);
});
test('temporary HTTP failure retries once; forbidden requests do not retry the same source', async () => {
  let calls = 0;
  globalThis.fetch = async () => ++calls === 1 ? new Response('', {status: 503}) : Response.json({ok: true});
  assert.deepEqual(await fetchJSON('https://fixture.example'), {ok: true}); assert.equal(calls, 2);
  calls = 0;
  globalThis.fetch = async () => {calls++; return new Response('', {status: 403});};
  await assert.rejects(fetchJSON('https://fixture.example'), /403/); assert.equal(calls, 1);
});
test('pagination interruption retains loaded transactions and does not invent first activity', async () => {
  config(); let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    if (calls > 1) return new Response('', {status: 403});
    return Response.json({items: [{hash: row(address(8)).hash, timestamp: '2023-11-14T22:13:20.000Z', from: {hash: address(8)}, value: '0', fee: {type: 'actual', value: '1000000000000000'}, status: 'ok'}], next_page_params: {index: '50'}});
  };
  const stats = await getEvmStats(networkById('polygon')!, address(8));
  assert.equal(stats.transactionCount, 1); assert.equal(stats.complete, false); assert.equal(stats.firstActivity, null);
  assert.match(stats.note, /interrupted pagination/);
});

test('HTTP 200 rate-limit payload retries instead of treating it as empty history', async () => {
  config(); process.env.ETHERSCAN_API_KEY = 'fixture-only'; let calls = 0;
  globalThis.fetch = async () => ++calls === 1
    ? Response.json({status: '0', message: 'NOTOK', result: 'Max rate limit reached'})
    : Response.json({status: '1', message: 'OK', result: [row(address(9))]});
  assert.equal((await getEvmStats(networkById('bnb')!, address(9))).transactionCount, 1);
  assert.equal(calls, 2);
});

test('malformed Blockscout items cannot mark a network as unused', async () => {
  config();
  globalThis.fetch = async () => Response.json({items: [{hash: 'broken'}], next_page_params: null});
  await assert.rejects(getEvmStats(networkById('polygon')!, address(10)), /configured data source/);
});
