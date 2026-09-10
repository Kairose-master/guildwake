import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  act,
  newGame,
  parseSave,
  chance,
  TRAVEL_MS,
  MISSIONS,
  STRATEGIES,
  type MissionId,
  type Strategy,
  type Game,
} from '../src/game.ts';
function complete(g: Game) {
  g = act(g, {
    type: 'launch',
    mission: 'forest',
    team: ['fern', 'bram'],
    strategy: 'careful',
    now: 100,
  });
  g = act(g, { type: 'advance', now: 100 + TRAVEL_MS });
  g = act(g, { type: 'choose', choice: 'trail', now: 100 + TRAVEL_MS });
  g = act(g, { type: 'advance', now: 100 + TRAVEL_MS * 2 });
  return g;
}
void test('full journey, reward once, XP and day progression', () => {
  const original = newGame(),
    report = complete(original);
  assert.equal(report.phase, 'report');
  const done = act(report, { type: 'claim' });
  assert.equal(done.phase, 'camp');
  assert.equal(done.day, 2);
  assert.equal(done.history.length, 1);
  assert.ok(done.agents[0].xp > 0);
  assert.throws(() => act(done, { type: 'claim' }));
  assert.equal(original.phase, 'camp');
  assert.equal(original.supplies, 5);
});
void test('travel cannot advance before deadline and invalid transitions fail', () => {
  const g = act(newGame(), {
    type: 'launch',
    mission: 'forest',
    team: ['fern', 'bram'],
    strategy: 'balanced',
    now: 10,
  });
  assert.equal(act(g, { type: 'advance', now: 11 }), g);
  assert.throws(() => act(g, { type: 'choose', choice: 'trail', now: 20 }));
  assert.throws(() =>
    act(g, {
      type: 'launch',
      mission: 'forest',
      team: ['fern', 'orin'],
      strategy: 'bold',
      now: 30,
    }),
  );
});
void test('team, unlock and provision checks', () => {
  assert.throws(() =>
    act(newGame(), {
      type: 'launch',
      mission: 'tower',
      team: ['fern', 'orin'],
      strategy: 'bold',
      now: 0,
    }),
  );
  assert.throws(() =>
    act(newGame(), {
      type: 'launch',
      mission: 'forest',
      team: ['fern', 'fern'],
      strategy: 'bold',
      now: 0,
    }),
  );
  assert.throws(() =>
    act(
      { ...newGame(), supplies: 0 },
      {
        type: 'launch',
        mission: 'forest',
        team: ['fern', 'orin'],
        strategy: 'bold',
        now: 0,
      },
    ),
  );
});
void test('fatigue matters and rest prevents a resource soft lock', () => {
  const g = newGame();
  const before = chance(g, 'forest', ['fern', 'bram'], 'balanced');
  g.agents[0].fatigue = 3;
  assert.ok(chance(g, 'forest', ['fern', 'bram'], 'balanced') < before);
  const rested = act({ ...g, gold: 0, supplies: 0 }, { type: 'rest' });
  assert.equal(rested.supplies, 2);
  assert.equal(rested.agents[0].fatigue, 0);
});
void test('same seed has reproducible results, choices charge once', () => {
  assert.deepEqual(complete(newGame()), complete(newGame()));
  let g = act(newGame(), {
    type: 'launch',
    mission: 'forest',
    team: ['fern', 'bram'],
    strategy: 'balanced',
    now: 0,
  });
  g = act(g, { type: 'advance', now: TRAVEL_MS });
  g = act(g, { type: 'choose', choice: 'bridge', now: TRAVEL_MS });
  assert.equal(g.supplies, 3);
  assert.throws(() =>
    act(g, { type: 'choose', choice: 'bridge', now: TRAVEL_MS }),
  );
});
void test('save round trip includes mid-expedition state; rejects corrupt saves', () => {
  for (const g of [newGame(), complete(newGame())])
    assert.deepEqual(parseSave(JSON.stringify(g)), g);
  for (const s of [
    'null',
    '{}',
    'garbage',
    JSON.stringify({ ...newGame(), gold: -3 }),
    JSON.stringify({ ...newGame(), phase: 'returning' }),
  ])
    assert.equal(parseSave(s), null);
});
void test('campaign can be completed without payment, recruitment is unique', () => {
  let g = newGame();
  for (let i = 0; i < 25 && !g.completed; i++) {
    g = act(g, { type: 'rest' });
    g = act(complete(g), { type: 'claim' });
    if (g.hall < 3) {
      try {
        g = act(g, { type: 'upgrade' });
      } catch {}
    }
  }
  assert.equal(g.completed, true);
  g = act({ ...g, gold: 100 }, { type: 'recruit' });
  assert.equal(g.agents.length, 4);
  assert.throws(() => act(g, { type: 'recruit' }));
});

void test('all region/strategy/encounter paths preserve valid nonnegative saves', () => {
  for (const mission of Object.keys(MISSIONS) as MissionId[]) {
    for (const strategy of Object.keys(STRATEGIES) as Strategy[]) {
      for (const choice of MISSIONS[mission].event.choices) {
        for (let seed = 1; seed <= 20; seed++) {
          let g = { ...newGame(seed), reputation: 30, gold: 100, supplies: 10 };
          g = act(g, {
            type: 'launch',
            mission,
            strategy,
            team: ['fern', 'bram'],
            now: 0,
          });
          g = act(g, { type: 'advance', now: TRAVEL_MS });
          g = act(g, { type: 'choose', choice: choice.id, now: TRAVEL_MS });
          g = act(g, { type: 'advance', now: TRAVEL_MS * 2 });
          g = act(g, { type: 'claim' });
          assert.ok(g.gold >= 0 && g.supplies >= 0);
          assert.deepEqual(parseSave(JSON.stringify(g)), g);
        }
      }
    }
  }
});
