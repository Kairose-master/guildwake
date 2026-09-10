import {
  AGENTS,
  MISSIONS,
  STRATEGIES,
  type AgentId,
  type MissionId,
  type Strategy,
} from './game.ts';
import type { GameStore } from './store.ts';
type Tool = {
  name: string;
  title: string;
  description: string;
  inputSchema: object;
  annotations: { readOnlyHint: boolean; untrustedContentHint: boolean };
  execute: (input: unknown) => unknown;
};
export type ModelContext = {
  registerTool: (
    tool: Tool,
    options?: { signal?: AbortSignal },
  ) => void | Promise<void>;
};
export function registerGameTools(
  context: ModelContext,
  store: GameStore,
  onPlan: (m: MissionId, t: AgentId[], s: Strategy) => void,
) {
  const controller = new AbortController();
  const object = (input: unknown) => {
    if (!input || typeof input !== 'object' || Array.isArray(input))
      throw Error('Expected an object');
    return input as Record<string, unknown>;
  };
  const empty = { type: 'object', properties: {}, additionalProperties: false };
  const tools: Tool[] = [
    {
      name: 'get_guild_state',
      title: '길드 상태 조회',
      description:
        'Read this browser-local game. No real currency or on-chain state.',
      inputSchema: empty,
      annotations: { readOnlyHint: true, untrustedContentHint: false },
      execute: () => store.getSnapshot(),
    },
    {
      name: 'launch_expedition',
      title: '원정 출발',
      description:
        'Spend one in-game supply and launch two recruited agents. This starts the expedition, not completes it.',
      inputSchema: {
        type: 'object',
        properties: {
          mission: { type: 'string', enum: Object.keys(MISSIONS) },
          team: {
            type: 'array',
            items: { type: 'string', enum: Object.keys(AGENTS) },
            minItems: 2,
            maxItems: 2,
            uniqueItems: true,
          },
          strategy: { type: 'string', enum: Object.keys(STRATEGIES) },
        },
        required: ['mission', 'team', 'strategy'],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute: (input) => {
        const x = object(input);
        if (
          typeof x.mission !== 'string' ||
          !Object.hasOwn(MISSIONS, x.mission) ||
          typeof x.strategy !== 'string' ||
          !Object.hasOwn(STRATEGIES, x.strategy) ||
          !Array.isArray(x.team) ||
          x.team.length !== 2 ||
          x.team.some(
            (id) => typeof id !== 'string' || !Object.hasOwn(AGENTS, id),
          )
        )
          throw Error('Invalid expedition plan');
        const m = x.mission as MissionId,
          t = x.team as AgentId[],
          s = x.strategy as Strategy;
        const game = store.apply({
          type: 'launch',
          mission: m,
          team: t,
          strategy: s,
          now: Date.now(),
        });
        onPlan(m, t, s);
        return { phase: game.phase, run: game.run };
      },
    },
    {
      name: 'choose_encounter',
      title: '현장 판단',
      description:
        'Choose one available encounter option. Can spend in-game supplies or gold, then starts the return journey.',
      inputSchema: {
        type: 'object',
        properties: { choice: { type: 'string' } },
        required: ['choice'],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute: (input) => {
        const x = object(input);
        if (typeof x.choice !== 'string') throw Error('Expected choice string');
        const game = store.apply({
          type: 'choose',
          choice: x.choice,
          now: Date.now(),
        });
        return { phase: game.phase };
      },
    },
    {
      name: 'claim_expedition_rewards',
      title: '귀환 보상 수령',
      description:
        'Claim an arrived expedition report once and return to camp. Rewards are local game items only.',
      inputSchema: empty,
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute: () => {
        const game = store.apply({ type: 'claim' });
        return {
          phase: game.phase,
          gold: game.gold,
          reputation: game.reputation,
          last: game.history[0],
        };
      },
    },
  ];
  for (const tool of tools) {
    try {
      void Promise.resolve(
        context.registerTool(tool, { signal: controller.signal }),
      ).catch((error) =>
        console.warn('[Guildwake] Optional WebMCP registration failed', error),
      );
    } catch (error) {
      console.warn('[Guildwake] Optional WebMCP unavailable', error);
    }
  }
  return () => controller.abort();
}
