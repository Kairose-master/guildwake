/** Pure, deterministic game rules. No money, chain calls or model calls. */
export type AgentId = 'fern' | 'bram' | 'orin' | 'lune';
export type MissionId = 'forest' | 'mine' | 'tower';
export type Strategy = 'careful' | 'balanced' | 'bold';
export type Phase = 'camp' | 'outbound' | 'event' | 'returning' | 'report';
export type Skills = { scout: number; craft: number; guard: number };
export type Agent = { id: AgentId; xp: number; fatigue: number };
export const AGENTS: Record<
  AgentId,
  {
    name: string;
    role: string;
    trait: string;
    color: string;
    skills: Skills;
    line: string;
  }
> = {
  fern: {
    name: '펀',
    role: '길잡이',
    trait: '숲을 읽는 눈',
    color: '#79b691',
    skills: { scout: 5, craft: 1, guard: 2 },
    line: '가장 빠른 길보다, 돌아올 수 있는 길을 찾을게요.',
  },
  bram: {
    name: '브램',
    role: '제작자',
    trait: '고집 센 장인',
    color: '#db805f',
    skills: { scout: 1, craft: 5, guard: 2 },
    line: '낡았다고 버리진 마. 아직 쓸 데가 있어.',
  },
  orin: {
    name: '오린',
    role: '수호자',
    trait: '마지막까지 함께',
    color: '#79a5d4',
    skills: { scout: 2, craft: 1, guard: 5 },
    line: '내 뒤에 있어. 이번에도 모두 함께 돌아간다.',
  },
  lune: {
    name: '룬',
    role: '기록가',
    trait: '잊힌 문자의 독자',
    color: '#bc99d6',
    skills: { scout: 3, craft: 3, guard: 3 },
    line: '이 섬에는 아직 읽지 못한 이야기가 많아요.',
  },
};
export type Choice = {
  id: string;
  label: string;
  detail: string;
  skill: keyof Skills;
  modifier: number;
  goldCost: number;
  supplyCost: number;
  rep: number;
  fatigue: number;
  narrative: string;
};
export type Mission = {
  id: MissionId;
  name: string;
  subtitle: string;
  biome: string;
  difficulty: number;
  gold: number;
  materials: number;
  rep: number;
  skill: keyof Skills;
  color: string;
  position: [number, number, number];
  event: {
    title: string;
    description: string;
    speaker: AgentId;
    choices: Choice[];
  };
};
export const MISSIONS: Record<MissionId, Mission> = {
  forest: {
    id: 'forest',
    name: '속삭이는 숲',
    subtitle: '숲길을 열고 목재를 확보하세요.',
    biome: 'WOODLAND',
    difficulty: 43,
    gold: 24,
    materials: 3,
    rep: 5,
    skill: 'scout',
    color: '#8ab997',
    position: [-4.4, 0.5, 3.6],
    event: {
      title: '무너진 다리 너머',
      description:
        '폭풍에 다리가 끊어졌습니다. 강 건너에는 목재 수레와 길을 잃은 여행자가 보입니다.',
      speaker: 'fern',
      choices: [
        {
          id: 'trail',
          label: '상류의 얕은 여울을 찾는다',
          detail: '정찰 능력 · 지치지만 안전한 우회',
          skill: 'scout',
          modifier: 12,
          goldCost: 0,
          supplyCost: 0,
          rep: 0,
          fatigue: 1,
          narrative:
            '강을 따라 걸어 작은 여울을 찾았습니다. 젖은 발로도 웃으며 돌아오는 길입니다.',
        },
        {
          id: 'bridge',
          label: '임시 다리를 놓고 여행자를 돕는다',
          detail: '제작 능력 · 보급 1 · 명성 +2',
          skill: 'craft',
          modifier: 17,
          goldCost: 0,
          supplyCost: 1,
          rep: 2,
          fatigue: 0,
          narrative:
            '새 다리를 건넌 여행자가 길드의 이름을 물었습니다. 작은 친절이 섬에 퍼집니다.',
        },
        {
          id: 'rope',
          label: '밧줄로 수레를 끌어올린다',
          detail: '수호 능력 · 빠르지만 위험',
          skill: 'guard',
          modifier: -3,
          goldCost: 0,
          supplyCost: 0,
          rep: 1,
          fatigue: 0,
          narrative: '밧줄이 팽팽해지고 대원들의 구령이 강물 위로 울렸습니다.',
        },
      ],
    },
  },
  mine: {
    id: 'mine',
    name: '달빛 폐광',
    subtitle: '오래된 갱도에서 월석을 회수하세요.',
    biome: 'MOONSTONE MINE',
    difficulty: 59,
    gold: 38,
    materials: 5,
    rep: 7,
    skill: 'craft',
    color: '#80c9c4',
    position: [-5, 0.5, -1.8],
    event: {
      title: '마지막 지지대',
      description:
        '푸른 광맥 앞에서 천장이 낮게 울립니다. 오래된 지지대를 보강하거나 좁은 옆굴로 들어가야 합니다.',
      speaker: 'bram',
      choices: [
        {
          id: 'brace',
          label: '지지대를 보강한다',
          detail: '제작 능력 · 보급 1 · 안전 확보',
          skill: 'craft',
          modifier: 18,
          goldCost: 0,
          supplyCost: 1,
          rep: 1,
          fatigue: 0,
          narrative:
            '대원들의 망치 소리가 멎자 천장도 조용해졌습니다. 새 지지대에 길드의 문장을 새겼습니다.',
        },
        {
          id: 'tunnel',
          label: '좁은 옆굴을 탐색한다',
          detail: '정찰 능력 · 피로 +1',
          skill: 'scout',
          modifier: 8,
          goldCost: 0,
          supplyCost: 0,
          rep: 0,
          fatigue: 1,
          narrative: '먼지 사이로 들어온 달빛이 숨겨진 출구를 비췄습니다.',
        },
        {
          id: 'haul',
          label: '입구 근처의 광석만 운반한다',
          detail: '수호 능력 · 신중한 회수',
          skill: 'guard',
          modifier: 4,
          goldCost: 0,
          supplyCost: 0,
          rep: 0,
          fatigue: 0,
          narrative:
            '더 깊은 광맥은 다음을 위해 남겼습니다. 오늘의 목표는 무사 귀환입니다.',
        },
      ],
    },
  },
  tower: {
    id: 'tower',
    name: '잊힌 파수탑',
    subtitle: '꺼진 봉화를 되살리고 항로를 여세요.',
    biome: 'THE OLD WATCH',
    difficulty: 72,
    gold: 52,
    materials: 4,
    rep: 10,
    skill: 'guard',
    color: '#d7b777',
    position: [5, 0.5, -1.8],
    event: {
      title: '안개 속의 신호',
      description:
        '파수탑 아래에서 구조 신호가 들립니다. 봉화로 가는 계단은 무너지고, 바다에서는 폭풍이 밀려옵니다.',
      speaker: 'orin',
      choices: [
        {
          id: 'rescue',
          label: '먼저 고립된 수비대를 구한다',
          detail: '수호 능력 · 보급 1 · 명성 +3',
          skill: 'guard',
          modifier: 17,
          goldCost: 0,
          supplyCost: 1,
          rep: 3,
          fatigue: 0,
          narrative:
            '대원들이 마지막 수비대를 끌어올렸습니다. 다시 켜진 불빛이 안개를 가릅니다.',
        },
        {
          id: 'signal',
          label: '반사경으로 해안에 신호를 보낸다',
          detail: '제작 능력 · 장비 비용 8골드',
          skill: 'craft',
          modifier: 22,
          goldCost: 8,
          supplyCost: 0,
          rep: 2,
          fatigue: 0,
          narrative:
            '빛의 패턴을 읽은 배들이 닻을 내렸습니다. 잊힌 신호가 다시 쓰입니다.',
        },
        {
          id: 'climb',
          label: '절벽의 옛 계단을 찾는다',
          detail: '정찰 능력 · 피로 +1',
          skill: 'scout',
          modifier: 5,
          goldCost: 0,
          supplyCost: 0,
          rep: 0,
          fatigue: 1,
          narrative:
            '바닷바람을 맞으며 오래된 계단을 올랐습니다. 정상에서 길드 하우스의 지붕이 보입니다.',
        },
      ],
    },
  },
};
export type Report = {
  id: number;
  mission: MissionId;
  team: AgentId[];
  success: boolean;
  chance: number;
  roll: number;
  gold: number;
  materials: number;
  rep: number;
  text: string;
  day: number;
};
export type Run = {
  id: number;
  mission: MissionId;
  team: AgentId[];
  strategy: Strategy;
  startedAt: number;
  choice?: string;
  report?: Report;
};
export type Game = {
  version: 1;
  day: number;
  gold: number;
  supplies: number;
  materials: number;
  reputation: number;
  hall: number;
  agents: Agent[];
  phase: Phase;
  run: Run | null;
  history: Report[];
  seed: number;
  completed: boolean;
  nextId: number;
};
export const TRAVEL_MS = 8000;
export const STRATEGIES: Record<
  Strategy,
  { name: string; detail: string; chance: number; reward: number }
> = {
  careful: {
    name: '신중하게',
    detail: '성공률 +12 · 보상 85%',
    chance: 12,
    reward: 0.85,
  },
  balanced: {
    name: '균형 있게',
    detail: '성공률·보상 균형',
    chance: 0,
    reward: 1,
  },
  bold: {
    name: '과감하게',
    detail: '성공률 −10 · 보상 130%',
    chance: -10,
    reward: 1.3,
  },
};
export function newGame(seed = 4217): Game {
  return {
    version: 1,
    day: 1,
    gold: 48,
    supplies: 5,
    materials: 0,
    reputation: 0,
    hall: 1,
    agents: [
      { id: 'fern', xp: 0, fatigue: 0 },
      { id: 'bram', xp: 0, fatigue: 0 },
      { id: 'orin', xp: 0, fatigue: 0 },
    ],
    phase: 'camp',
    run: null,
    history: [],
    seed,
    completed: false,
    nextId: 1,
  };
}
export function level(a: Agent) {
  return 1 + Math.floor(a.xp / 3);
}
export function skill(g: Game, team: AgentId[], kind: keyof Skills) {
  return team.reduce((sum, id) => {
    const a = g.agents.find((x) => x.id === id);
    return (
      sum +
      (a ? Math.max(0, AGENTS[id].skills[kind] + level(a) - 1 - a.fatigue) : 0)
    );
  }, 0);
}
export function chance(
  g: Game,
  mission: MissionId,
  team: AgentId[],
  strategy: Strategy,
  choice?: Choice,
) {
  const m = MISSIONS[mission];
  return Math.max(
    15,
    Math.min(
      96,
      Math.round(
        84 -
          m.difficulty +
          skill(g, team, m.skill) * 4 +
          g.hall * 3 +
          STRATEGIES[strategy].chance +
          (choice ? choice.modifier + skill(g, team, choice.skill) * 1.4 : 0),
      ),
    ),
  );
}
export function unlocked(g: Game, id: MissionId) {
  return (
    id === 'forest' || (id === 'mine' ? g.reputation >= 5 : g.reputation >= 14)
  );
}
export function upgradeCost(g: Game) {
  return { gold: g.hall === 1 ? 55 : 90, materials: g.hall === 1 ? 5 : 10 };
}
export function canLaunch(g: Game, mission: MissionId, team: AgentId[]) {
  if (g.phase !== 'camp') return '원정 중에는 새 원정을 시작할 수 없습니다.';
  if (!unlocked(g, mission)) return '명성을 더 쌓으면 열리는 지역입니다.';
  if (
    team.length !== 2 ||
    new Set(team).size !== 2 ||
    team.some((id) => !g.agents.some((a) => a.id === id))
  )
    return '서로 다른 대원 두 명을 선택하세요.';
  if (g.supplies < 1) return '출발하려면 보급이 1개 필요합니다.';
  return null;
}
export type Action =
  | {
      type: 'launch';
      mission: MissionId;
      team: AgentId[];
      strategy: Strategy;
      now: number;
    }
  | { type: 'advance'; now: number }
  | { type: 'choose'; choice: string; now: number }
  | { type: 'claim' }
  | { type: 'rest' }
  | { type: 'supply' }
  | { type: 'upgrade' }
  | { type: 'recruit' };
function random(seed: number) {
  const next = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return { seed: next, value: next / 4294967296 };
}
export function act(state: Game, action: Action): Game {
  const g = structuredClone(state);
  switch (action.type) {
    case 'launch': {
      if (
        !Object.hasOwn(MISSIONS, action.mission) ||
        !Object.hasOwn(STRATEGIES, action.strategy)
      )
        throw Error('알 수 없는 원정 계획입니다.');
      const error = canLaunch(g, action.mission, action.team);
      if (error) throw Error(error);
      g.supplies--;
      g.phase = 'outbound';
      g.run = {
        id: g.nextId++,
        mission: action.mission,
        team: [...action.team],
        strategy: action.strategy,
        startedAt: action.now,
      };
      break;
    }
    case 'advance': {
      if (!g.run || action.now - g.run.startedAt < TRAVEL_MS) return state;
      if (g.phase === 'outbound') g.phase = 'event';
      else if (g.phase === 'returning') g.phase = 'report';
      else return state;
      break;
    }
    case 'choose': {
      if (g.phase !== 'event' || !g.run)
        throw Error('지금은 사건을 선택할 수 없습니다.');
      const r = g.run,
        m = MISSIONS[r.mission],
        c = m.event.choices.find((x) => x.id === action.choice);
      if (!c) throw Error('알 수 없는 선택입니다.');
      if (g.gold < c.goldCost || g.supplies < c.supplyCost)
        throw Error('이 선택에 필요한 골드 또는 보급이 부족합니다.');
      const odds = chance(g, r.mission, r.team, r.strategy, c),
        rng = random(g.seed);
      g.seed = rng.seed;
      const roll = Math.floor(rng.value * 100) + 1,
        success = roll <= odds,
        mult = STRATEGIES[r.strategy].reward;
      r.choice = c.id;
      r.report = {
        id: r.id,
        mission: r.mission,
        team: r.team,
        success,
        chance: odds,
        roll,
        gold: success ? Math.round(m.gold * mult) : 8,
        materials: success ? m.materials : 1,
        rep: success ? m.rep + c.rep : 1,
        text: success
          ? c.narrative
          : '대원들은 위험을 더 감수하지 않고 철수했습니다. 적은 자원을 챙겼지만, 다음 원정을 위한 경험을 얻었습니다.',
        day: g.day,
      };
      g.gold -= c.goldCost;
      g.supplies -= c.supplyCost;
      g.phase = 'returning';
      r.startedAt = action.now;
      for (const a of g.agents)
        if (r.team.includes(a.id))
          a.fatigue = Math.min(3, a.fatigue + 1 + c.fatigue);
      break;
    }
    case 'claim': {
      if (g.phase !== 'report' || !g.run?.report)
        throw Error('수령할 원정 결과가 없습니다.');
      const r = g.run.report;
      if (g.history.some((x) => x.id === r.id))
        throw Error('이미 수령한 원정입니다.');
      g.gold += r.gold;
      g.materials += r.materials;
      g.reputation += r.rep;
      g.day++;
      for (const a of g.agents) {
        if (r.team.includes(a.id)) a.xp += r.success ? 2 : 1;
        else a.fatigue = Math.max(0, a.fatigue - 1);
      }
      g.history = [r, ...g.history].slice(0, 30);
      g.run = null;
      g.phase = 'camp';
      break;
    }
    case 'rest':
      if (g.phase !== 'camp') throw Error('원정이 끝난 뒤 휴식할 수 있습니다.');
      g.agents.forEach((a) => (a.fatigue = 0));
      g.supplies = Math.max(2, g.supplies);
      g.day++;
      break;
    case 'supply':
      if (g.phase !== 'camp' || g.gold < 10)
        throw Error('길드에서 10골드로 보급할 수 있습니다.');
      g.gold -= 10;
      g.supplies += 3;
      break;
    case 'upgrade': {
      const c = upgradeCost(g);
      if (
        g.phase !== 'camp' ||
        g.hall >= 3 ||
        g.gold < c.gold ||
        g.materials < c.materials
      )
        throw Error('길드 증축에 필요한 자원이 부족합니다.');
      g.gold -= c.gold;
      g.materials -= c.materials;
      g.hall++;
      break;
    }
    case 'recruit':
      if (
        g.phase !== 'camp' ||
        g.reputation < 10 ||
        g.gold < 35 ||
        g.agents.some((a) => a.id === 'lune')
      )
        throw Error('룬 영입에는 명성 10과 35골드가 필요합니다.');
      g.gold -= 35;
      g.agents.push({ id: 'lune', xp: 0, fatigue: 0 });
      break;
  }
  g.completed =
    g.completed ||
    (g.hall === 3 && g.reputation >= 30 && g.history.length >= 5);
  return g;
}
// Save data is untrusted local input. Reject malformed/unknown versions rather than crashing.
export function parseSave(raw: string): Game | null {
  try {
    const g = JSON.parse(raw) as Game;
    const integer = (n: unknown, max = 1e8) =>
      typeof n === 'number' && Number.isInteger(n) && n >= 0 && n <= max;
    if (
      !g ||
      g.version !== 1 ||
      !integer(g.day) ||
      g.day < 1 ||
      !integer(g.gold) ||
      !integer(g.supplies) ||
      !integer(g.materials) ||
      !integer(g.reputation) ||
      ![1, 2, 3].includes(g.hall) ||
      !integer(g.seed, 4294967295) ||
      !integer(g.nextId) ||
      typeof g.completed !== 'boolean'
    )
      return null;
    if (
      !Array.isArray(g.agents) ||
      g.agents.length < 3 ||
      g.agents.length > 4 ||
      new Set(g.agents.map((a) => a.id)).size !== g.agents.length ||
      g.agents.some(
        (a) =>
          !Object.hasOwn(AGENTS, a.id) ||
          !integer(a.xp) ||
          !integer(a.fatigue, 3),
      )
    )
      return null;
    if (
      !['camp', 'outbound', 'event', 'returning', 'report'].includes(g.phase) ||
      !Array.isArray(g.history) ||
      g.history.length > 30
    )
      return null;
    const reportOk = (r: Report) =>
      r &&
      integer(r.id) &&
      Object.hasOwn(MISSIONS, r.mission) &&
      Array.isArray(r.team) &&
      r.team.length === 2 &&
      r.team.every((id) => Object.hasOwn(AGENTS, id)) &&
      typeof r.success === 'boolean' &&
      integer(r.chance, 100) &&
      integer(r.roll, 100) &&
      integer(r.gold) &&
      integer(r.materials) &&
      integer(r.rep) &&
      typeof r.text === 'string' &&
      r.text.length < 3000 &&
      integer(r.day);
    if (g.history.some((r) => !reportOk(r))) return null;
    if (g.phase === 'camp') {
      if (g.run !== null) return null;
    } else {
      const r = g.run;
      if (
        !r ||
        !integer(r.id) ||
        !Object.hasOwn(MISSIONS, r.mission) ||
        !Object.hasOwn(STRATEGIES, r.strategy) ||
        !integer(r.startedAt, 1e15) ||
        !Array.isArray(r.team) ||
        r.team.length !== 2 ||
        new Set(r.team).size !== 2 ||
        r.team.some((id) => !g.agents.some((a) => a.id === id))
      )
        return null;
      if (
        ['returning', 'report'].includes(g.phase) &&
        (!r.report ||
          !reportOk(r.report) ||
          r.report.id !== r.id ||
          r.report.mission !== r.mission)
      )
        return null;
    }
    return g;
  } catch {
    return null;
  }
}
