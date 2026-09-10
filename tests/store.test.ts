import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGameStore, SAVE_KEY } from '../src/store.ts';
import { registerGameTools, type ModelContext } from '../src/webmcp.ts';
import { TRAVEL_MS } from '../src/game.ts';
function memory(raw?: string) {
  let value = raw;
  return {
    getItem: () => value ?? null,
    setItem: (_key: string, next: string) => {
      value = next;
    },
    value: () => value,
  };
}
void test('storage resumes a pending journey and cannot pay twice after reload', () => {
  const disk = memory(),
    s = createGameStore();
  s.initialize(disk);
  s.apply({
    type: 'launch',
    mission: 'forest',
    team: ['fern', 'bram'],
    strategy: 'careful',
    now: 0,
  });
  const resumed = createGameStore();
  resumed.initialize(disk);
  assert.equal(resumed.getSnapshot().game.phase, 'outbound');
  resumed.apply({ type: 'advance', now: TRAVEL_MS });
  resumed.apply({ type: 'choose', choice: 'trail', now: TRAVEL_MS });
  resumed.apply({ type: 'advance', now: TRAVEL_MS * 2 });
  resumed.apply({ type: 'claim' });
  const again = createGameStore();
  again.initialize(disk);
  assert.throws(() => again.apply({ type: 'claim' }));
  assert.equal(again.getSnapshot().game.history.length, 1);
});
void test('corrupt saved data is preserved until explicit restart', () => {
  const disk = memory('{bad'),
    s = createGameStore();
  s.initialize(disk);
  s.apply({ type: 'rest' });
  assert.equal(disk.value(), '{bad');
  assert.ok(s.getSnapshot().storageIssue);
  s.restart(9);
  assert.equal(s.getSnapshot().storageIssue, '');
  assert.equal(JSON.parse(disk.value()!).seed, 9);
});
void test('unavailable storage never breaks play, subscription cleans up', () => {
  const s = createGameStore();
  let calls = 0;
  const stop = s.subscribe(() => calls++);
  s.initialize({
    getItem: () => null,
    setItem: () => {
      throw Error('quota');
    },
  });
  s.apply({ type: 'rest' });
  assert.ok(s.getSnapshot().storageIssue);
  assert.equal(s.getSnapshot().game.day, 2);
  stop();
  s.apply({ type: 'rest' });
  assert.equal(calls, 2);
  assert.equal(SAVE_KEY, 'guildwake.save.v1');
});
void test('WebMCP contract uses the same state, guards invalid input and aborts', () => {
  const tools = new Map<string, Parameters<ModelContext['registerTool']>[0]>();
  let signal: AbortSignal | undefined;
  const s = createGameStore();
  s.initialize(memory());
  let plan = '';
  const cleanup = registerGameTools(
    {
      registerTool: (tool, options) => {
        tools.set(tool.name, tool);
        signal = options?.signal;
      },
    },
    s,
    (m) => {
      plan = m;
    },
  );
  assert.equal(tools.size, 4);
  assert.equal(tools.get('get_guild_state')!.annotations.readOnlyHint, true);
  assert.throws(() =>
    tools
      .get('launch_expedition')!
      .execute({
        mission: 'constructor',
        team: ['fern', 'bram'],
        strategy: 'balanced',
      }),
  );
  assert.equal(s.getSnapshot().game.supplies, 5);
  tools
    .get('launch_expedition')!
    .execute({
      mission: 'forest',
      team: ['fern', 'bram'],
      strategy: 'careful',
    });
  assert.equal(plan, 'forest');
  assert.equal(s.getSnapshot().game.supplies, 4);
  assert.throws(() => tools.get('claim_expedition_rewards')!.execute({}));
  cleanup();
  assert.equal(signal?.aborted, true);
});
