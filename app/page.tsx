'use client';
import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  Backpack,
  Check,
  ChevronRight,
  Coins,
  Compass,
  Flag,
  Flame,
  HelpCircle,
  Leaf,
  Lock,
  Map,
  Pickaxe,
  Plus,
  RotateCcw,
  ScrollText,
  Shield,
  Star,
  Sun,
  Timer,
  Trophy,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { createGameStore, SERVER_SNAPSHOT } from '@/src/store';
import dynamic from 'next/dynamic';
import { registerGameTools, type ModelContext } from '@/src/webmcp';
const World = dynamic(() => import('@/components/world').then((m) => m.World), {
  ssr: false,
  loading: () => (
    <div className="world-stage">
      <p className="map-hint">지도를 준비하고 있습니다.</p>
    </div>
  ),
});
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import {
  AGENTS,
  canLaunch,
  chance,
  level,
  MISSIONS,
  STRATEGIES,
  TRAVEL_MS,
  unlocked,
  upgradeCost,
  type Action,
  type AgentId,
  type MissionId,
  type Strategy,
} from '@/src/game';
const SKILL_ICON = { scout: Leaf, craft: Pickaxe, guard: Shield };
export default function Home() {
  const [store] = useState(createGameStore);
  const { game, loaded, notice, storageIssue } = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    () => SERVER_SNAPSHOT,
  );
  const [selected, setSelected] = useState<MissionId>('forest'),
    [team, setTeam] = useState<AgentId[]>(['fern', 'bram']),
    [strategy, setStrategy] = useState<Strategy>('balanced'),
    [help, setHelp] = useState(false),
    [reset, setReset] = useState(false),
    [journal, setJournal] = useState(false),
    [now, setNow] = useState(0);
  useEffect(() => {
    try {
      store.initialize(window.localStorage);
    } catch {
      store.initialize();
    }
  }, [store]);
  const dispatch = useCallback(
    (action: Action) => {
      try {
        return store.apply(action);
      } catch {
        return store.getSnapshot().game;
      }
    },
    [store],
  );
  useEffect(() => {
    if (!loaded) return;
    const id = setInterval(() => {
      const t = Date.now();
      setNow(t);
      const g = store.getSnapshot().game;
      if (
        g.run &&
        ['outbound', 'returning'].includes(g.phase) &&
        t - g.run.startedAt >= TRAVEL_MS
      )
        dispatch({ type: 'advance', now: t });
    }, 250);
    return () => clearInterval(id);
  }, [dispatch, loaded, store]);
  useEffect(() => {
    if (!loaded) return;
    const context = (document as Document & { modelContext?: ModelContext })
      .modelContext;
    if (!context?.registerTool) return;
    return registerGameTools(context, store, (m, t, s) => {
      setSelected(m);
      setTeam(t);
      setStrategy(s);
    });
  }, [loaded, store]);
  const mission = MISSIONS[game.run?.mission ?? selected],
    running = game.phase !== 'camp',
    available = unlocked(game, selected),
    cost = upgradeCost(game),
    odds = chance(game, selected, team, strategy),
    error = canLaunch(game, selected, team),
    run = game.run,
    report = run?.report;
  const progress = run
    ? Math.max(0, Math.min(100, ((now - run.startedAt) / TRAVEL_MS) * 100))
    : 0;
  function chooseAgent(id: AgentId) {
    if (running) return;
    setTeam((t) =>
      t.includes(id)
        ? t.filter((x) => x !== id)
        : t.length < 2
          ? [...t, id]
          : [t[1], id],
    );
  }
  function selectMission(id: MissionId) {
    if (running) return;
    setSelected(id);
  }
  function restart() {
    store.restart(crypto.getRandomValues(new Uint32Array(1))[0]);
    setTeam(['fern', 'bram']);
    setSelected('forest');
    setReset(false);
  }
  return (
    <main className="game-shell">
      <header className="topbar">
        <Link href="/" className="wordmark" aria-label="Guildwake 홈">
          <span className="brand-mark">
            <Flame size={24} />
          </span>
          GUILDWAKE<span className="chapter-tag">CHAPTER I</span>
        </Link>
        <div className="resources" aria-label="길드 자원">
          <span title="게임 내 골드">
            <Coins size={17} />
            <b>{game.gold}</b>
            <small>골드</small>
          </span>
          <span title="증축 재료">
            <Pickaxe size={17} />
            <b>{game.materials}</b>
            <small>자재</small>
          </span>
          <span title="원정 보급품">
            <Backpack size={17} />
            <b>{game.supplies}</b>
            <small>보급</small>
          </span>
          <span title="길드 명성">
            <Star size={17} />
            <b>{game.reputation}</b>
            <small>명성</small>
          </span>
        </div>
        <button
          className="icon-button help-button"
          aria-label="플레이 방법"
          onClick={() => setHelp(true)}
        >
          <HelpCircle size={20} />
        </button>
      </header>
      <div className="game-layout">
        <aside className="guild-panel">
          <div className="eyebrow">
            <span className="tiny-dot" /> YOUR GUILD
          </div>
          <div className="guild-title">
            <h1>여명의 길드</h1>
            <span>Lv. {game.hall}</span>
          </div>
          <p className="guild-intro">꺼진 불빛을, 다시 밝힐 시간.</p>
          <div className="day-card">
            <Sun size={25} />
            <div>
              <b>{String(game.day).padStart(2, '0')}일째의 아침</b>
              <span>
                {running
                  ? '동료들이 섬을 탐험하고 있습니다.'
                  : '동료들이 다음 원정을 기다립니다.'}
              </span>
            </div>
          </div>
          <div className="section-label">
            <h2>원정 대원</h2>
            <span>
              {running
                ? `${run?.team.length}명 원정 중`
                : `${team.length} / 2 선택`}
            </span>
          </div>
          <div className="roster">
            {game.agents.map((a) => {
              const info = AGENTS[a.id],
                chosen = (run?.team ?? team).includes(a.id);
              return (
                <button
                  key={a.id}
                  className={`agent-card ${chosen ? 'chosen' : ''}`}
                  onClick={() => chooseAgent(a.id)}
                  disabled={running}
                  aria-pressed={chosen}
                >
                  <span
                    className="agent-avatar"
                    style={{ '--agent': info.color } as React.CSSProperties}
                  >
                    {a.id === 'fern' ? (
                      <Leaf />
                    ) : a.id === 'bram' ? (
                      <Pickaxe />
                    ) : a.id === 'orin' ? (
                      <Shield />
                    ) : (
                      <ScrollText />
                    )}
                  </span>
                  <span className="agent-main">
                    <span className="agent-heading">
                      <b>{info.name}</b>
                      <small>
                        {info.role} · Lv.{level(a)}
                      </small>
                    </span>
                    <span className="agent-trait">{info.trait}</span>
                    <span className="agent-skills">
                      {Object.entries(info.skills).map(([key, value]) => {
                        const Icon = SKILL_ICON[key as keyof typeof SKILL_ICON];
                        return (
                          <span
                            key={key}
                            title={`${key === 'scout' ? '정찰' : key === 'craft' ? '제작' : '수호'} ${Math.max(0, value + level(a) - 1 - a.fatigue)}`}
                          >
                            <Icon size={11} />
                            {Math.max(0, value + level(a) - 1 - a.fatigue)}
                          </span>
                        );
                      })}
                      <span className={`fatigue f${a.fatigue}`}>
                        {a.fatigue ? '피로 ' + a.fatigue : '좋은 컨디션'}
                      </span>
                    </span>
                  </span>
                  <span className="check-circle">
                    {chosen ? <Check size={12} /> : <Plus size={12} />}
                  </span>
                </button>
              );
            })}
          </div>
          {!game.agents.some((a) => a.id === 'lune') && (
            <button
              className="recruit-button"
              disabled={running || game.reputation < 10 || game.gold < 35}
              onClick={() => dispatch({ type: 'recruit' })}
            >
              <Users size={17} />
              <span>
                기록가 룬 영입<small>명성 10 필요 · 35골드</small>
              </span>
              <Plus size={16} />
            </button>
          )}
          <div className="guild-actions">
            <button
              disabled={running}
              onClick={() => dispatch({ type: 'rest' })}
            >
              <Sun size={15} /> 하루 휴식<small>피로 회복 · 보급 최소 2</small>
            </button>
            <button
              disabled={running || game.gold < 10}
              onClick={() => dispatch({ type: 'supply' })}
            >
              <Backpack size={15} /> 보급 +3<small>10골드</small>
            </button>
          </div>
          <div className="upgrade-card">
            <div className="section-label">
              <h2>
                <Flag size={15} /> 길드 하우스
              </h2>
              <span>{game.hall}/3</span>
            </div>
            <Progress
              value={(game.hall / 3) * 100}
              aria-label="길드 하우스 레벨"
            />
            <p>
              {game.hall === 1
                ? '작은 불씨가 모험가들의 쉼터가 됩니다.'
                : game.hall === 2
                  ? '더 멀리 떠날 준비가 되었습니다.'
                  : '섬에 길드의 깃발이 높이 올랐습니다.'}
            </p>
            <button
              disabled={
                running ||
                game.hall === 3 ||
                game.gold < cost.gold ||
                game.materials < cost.materials
              }
              onClick={() => dispatch({ type: 'upgrade' })}
            >
              {game.hall === 3 ? (
                '증축 완료'
              ) : (
                <>
                  <span>
                    길드 증축 <ArrowUpRight size={14} />
                  </span>
                  <small>
                    {cost.gold}골드 · 자재 {cost.materials}
                  </small>
                </>
              )}
            </button>
          </div>
          <button className="journal-link" onClick={() => setJournal(true)}>
            <ScrollText size={16} /> 길드 연대기
            <span>
              {game.history.length}
              <ChevronRight size={15} />
            </span>
          </button>
        </aside>
        <section className="main-play" aria-label="원정 지도와 계획">
          <div className="map-heading">
            <div>
              <span className="eyebrow">THE FIRST LIGHT</span>
              <h2>모험은 가까운 곳에서.</h2>
            </div>
            <span className="map-season">
              <span className="tiny-dot" /> 봄 · 맑음
            </span>
          </div>
          <World
            game={game}
            selected={run?.mission ?? selected}
            onSelect={selectMission}
          />
          <div className="quest-strip">
            <span className="quest-icon">
              <Flag size={20} />
            </span>
            <div>
              <span className="eyebrow">CHAPTER GOAL</span>
              <b>
                {game.completed
                  ? '여명의 길드가 다시 일어섰습니다.'
                  : '길드의 불빛을 되살리세요.'}
              </b>
              <p>길드 Lv.3 · 명성 30 · 원정 5회</p>
            </div>
            <div className="quest-checks">
              {[
                [game.hall >= 3, '길드'],
                [game.reputation >= 30, '명성'],
                [game.history.length >= 5, '원정'],
              ].map(([yes, label]) => (
                <span key={String(label)} className={yes ? 'done' : ''}>
                  {yes ? <Check size={12} /> : <span />}
                  {label}
                </span>
              ))}
            </div>
          </div>
          {game.completed && (
            <div className="victory-banner">
              <Trophy size={22} />
              <span>
                첫 장 완료! 이제 원하는 조합으로 섬의 남은 이야기를 탐험하세요.
              </span>
            </div>
          )}
          <div className="mission-area">
            <div className="section-label">
              <h2>원정 게시판</h2>
              <span>지역을 고르고 동료 두 명과 출발하세요</span>
            </div>
            <div className="mission-grid">
              {Object.values(MISSIONS).map((m, i) => {
                const open = unlocked(game, m.id);
                return (
                  <button
                    key={m.id}
                    className={`mission-card ${selected === m.id ? 'active' : ''}`}
                    style={{ '--mission': m.color } as React.CSSProperties}
                    onClick={() => selectMission(m.id)}
                    disabled={running}
                    aria-pressed={selected === m.id}
                  >
                    <div className="mission-top">
                      <span>
                        0{i + 1} / {m.biome}
                      </span>
                      {open ? <ArrowUpRight size={16} /> : <Lock size={14} />}
                    </div>
                    <h3>{m.name}</h3>
                    <p>{m.subtitle}</p>
                    <div className="mission-bottom">
                      <span>
                        <Coins size={13} />
                        {m.gold}
                        <Pickaxe size={13} />
                        {m.materials}
                      </span>
                      <small>
                        {open
                          ? ['낮은 위험', '보통 위험', '높은 위험'][i]
                          : `명성 ${i === 1 ? 5 : 14}에 개방`}
                      </small>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
        <aside className="expedition-panel" aria-label="원정 진행">
          <div className="eyebrow">
            {running ? 'EXPEDITION LOG' : 'NEXT EXPEDITION'}
          </div>
          <h2>{mission.name}</h2>
          <p className="expedition-intro">
            {running ? '작은 선택이 길드의 이야기가 됩니다.' : mission.subtitle}
          </p>
          {!running ? (
            <>
              <div className="route-summary">
                <span>
                  <span className="route-dot" />
                  길드 하우스
                </span>
                <div />
                <span>
                  <Map size={15} />
                  {mission.name}
                </span>
              </div>
              <div className="section-label">
                <h3>원정 방식</h3>
                <Compass size={16} />
              </div>
              <fieldset className="strategies" aria-label="원정 방식">
                {Object.entries(STRATEGIES).map(([id, s]) => (
                  <button
                    key={id}
                    className={strategy === id ? 'selected' : ''}
                    onClick={() => setStrategy(id as Strategy)}
                    aria-pressed={strategy === id}
                  >
                    <span>{s.name}</span>
                    <small>{s.detail}</small>
                  </button>
                ))}
              </fieldset>
              <div className="forecast">
                <div>
                  <span>출발 시 예상 성공률</span>
                  <b>{available ? `${odds}%` : '—'}</b>
                </div>
                <Progress
                  value={available ? odds : 0}
                  aria-label="출발 시 예상 성공률"
                />
                <p>
                  대원의 능력·피로·길드 레벨을 반영합니다. 사건 선택에 따라
                  달라집니다.
                </p>
              </div>
              <div className="reward-preview">
                <span>기본 보상</span>
                <b>
                  <Coins size={15} />
                  {Math.round(mission.gold * STRATEGIES[strategy].reward)}
                  <Pickaxe size={15} />
                  {mission.materials}
                  <Star size={15} />
                  {mission.rep}
                </b>
              </div>
              <button
                className="launch-button"
                disabled={!loaded || !!error}
                onClick={() =>
                  dispatch({
                    type: 'launch',
                    mission: selected,
                    team,
                    strategy,
                    now: Date.now(),
                  })
                }
              >
                <span>
                  원정 출발<small>보급 1 사용 · 대원 2명</small>
                </span>
                <ArrowRight size={22} />
              </button>
              {error && <p className="action-hint">{error}</p>}
              <div className="quote">
                <span>“</span>
                <p>{AGENTS[team[0] ?? 'fern'].line}</p>
                <small>— {AGENTS[team[0] ?? 'fern'].name}</small>
              </div>
            </>
          ) : (
            <>
              <ol className="journey-steps">
                {['출발', '현장 판단', '귀환'].map((s, i) => {
                  const step =
                    game.phase === 'outbound'
                      ? 0
                      : game.phase === 'event'
                        ? 1
                        : 2;
                  return (
                    <li key={s} className={i <= step ? 'reached' : ''}>
                      <span>{i < step ? <Check size={12} /> : i + 1}</span>
                      {s}
                    </li>
                  );
                })}
              </ol>
              {['outbound', 'returning'].includes(game.phase) && (
                <div className="travel-state">
                  <Compass size={42} className="travel-compass" />
                  <h3>
                    {game.phase === 'outbound'
                      ? '섬의 길을 따라'
                      : '길드로 돌아오는 길'}
                  </h3>
                  <p>
                    {run?.team.map((id) => AGENTS[id].name).join(' · ')}
                    {game.phase === 'outbound'
                      ? '이 주변을 살피며 이동합니다.'
                      : '이 오늘의 이야기를 가져옵니다.'}
                  </p>
                  <Progress value={progress} aria-label="이동 진행률" />
                  <span>
                    <Timer size={14} />
                    {Math.max(
                      0,
                      Math.ceil(
                        (TRAVEL_MS - (now - (run?.startedAt ?? 0))) / 1000,
                      ),
                    )}
                    초 뒤 도착
                  </span>
                </div>
              )}
              {game.phase === 'event' && (
                <div className="event-state">
                  <span className="event-tag">
                    <Flame size={13} /> 현장 판단이 필요합니다
                  </span>
                  <h3>{mission.event.title}</h3>
                  <p>{mission.event.description}</p>
                  <div className="event-choices">
                    {mission.event.choices.map((c) => (
                      <button
                        key={c.id}
                        disabled={
                          game.gold < c.goldCost || game.supplies < c.supplyCost
                        }
                        onClick={() =>
                          dispatch({
                            type: 'choose',
                            choice: c.id,
                            now: Date.now(),
                          })
                        }
                      >
                        <b>
                          {c.label}
                          <ArrowRight size={15} />
                        </b>
                        <small>{c.detail}</small>
                        <span>
                          예상 성공률{' '}
                          {chance(
                            game,
                            mission.id,
                            run!.team,
                            run!.strategy,
                            c,
                          )}
                          %
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {game.phase === 'report' && report && (
                <div className="report-state">
                  <div
                    className={`report-seal ${report.success ? '' : 'retreat'}`}
                  >
                    {report.success ? <Flag size={28} /> : <Shield size={28} />}
                  </div>
                  <span className="eyebrow">
                    {report.success ? 'MISSION COMPLETE' : 'SAFE RETURN'}
                  </span>
                  <h3>
                    {report.success
                      ? '원정에 성공했습니다.'
                      : '모두 무사히 돌아왔습니다.'}
                  </h3>
                  <p>{report.text}</p>
                  <div className="report-rewards">
                    <span>
                      <Coins />+{report.gold}
                      <small>골드</small>
                    </span>
                    <span>
                      <Pickaxe />+{report.materials}
                      <small>자재</small>
                    </span>
                    <span>
                      <Star />+{report.rep}
                      <small>명성</small>
                    </span>
                  </div>
                  <details className="result-proof">
                    <summary>판정 기록 보기</summary>
                    <p>
                      성공 기준: {report.chance} 이하
                      <br />
                      추첨값: {report.roll} / 100
                      <br />
                      원정 #{report.id} · 게임 내부 기록
                    </p>
                  </details>
                  <button
                    className="launch-button"
                    onClick={() => dispatch({ type: 'claim' })}
                  >
                    <span>보상 받고 길드로</span>
                    <ArrowRight size={20} />
                  </button>
                </div>
              )}
            </>
          )}
          {notice && (
            <p className="notice" role="alert">
              {notice}
            </p>
          )}
          <div className="chapter-note">
            <span>01</span>
            <p>
              길드를 세우는 건 건물이 아니라,
              <br />
              함께 돌아오는 사람들.
            </p>
          </div>
        </aside>
      </div>
      <footer className="game-footer">
        <span>
          <span className="tiny-dot" />
          {storageIssue
            ? '저장 안 됨'
            : loaded
              ? '이 브라우저에 자동 저장'
              : '저장 불러오는 중'}
        </span>
        <span>로컬 플레이 · 규칙 기반 대원 · 실제 자금 사용 없음</span>
        <button onClick={() => setReset(true)}>
          <RotateCcw size={12} /> 새 길드 시작
        </button>
      </footer>
      {storageIssue && (
        <div className="storage-warning" role="alert">
          {storageIssue}
        </div>
      )}
      <Dialog open={help} onOpenChange={setHelp}>
        <DialogContent className="game-dialog">
          <DialogTitle>여명의 길드에 오신 것을 환영합니다.</DialogTitle>
          <DialogDescription>
            첫 장의 목표는 길드 Lv.3, 명성 30, 원정 5회입니다.
          </DialogDescription>
          <ol className="help-list">
            <li>
              <b>함께 떠날 두 명을 고르세요.</b> 정찰은 숲, 제작은 폐광, 수호는
              파수탑에서 유리합니다.
            </li>
            <li>
              <b>원정 방식과 지역을 선택하세요.</b> 출발에는 보급이 1개
              필요합니다. 도착하면 현장 판단을 내려주세요.
            </li>
            <li>
              <b>돌아온 동료를 돌보세요.</b> 피로는 능력을 낮춥니다. 하루 휴식은
              무료이며 최소 보급 2개를 확보합니다.
            </li>
            <li>
              <b>길드를 다시 세우세요.</b> 골드와 자재로 증축하면 성공률도
              높아집니다. 명성 10에서 기록가 룬을 영입할 수 있습니다.
            </li>
          </ol>
          <p>
            이 첫 버전은 혼자 즐기는 로컬 게임입니다. 대원은 게임 규칙에 따라
            움직이며, 외부 AI 호출이나 블록체인 거래는 없습니다.
          </p>
          <button className="launch-button" onClick={() => setHelp(false)}>
            모험을 시작할게요 <ArrowRight size={18} />
          </button>
        </DialogContent>
      </Dialog>
      <Dialog open={reset} onOpenChange={setReset}>
        <DialogContent className="game-dialog">
          <DialogTitle>새 길드를 시작할까요?</DialogTitle>
          <DialogDescription>
            이 브라우저의 현재 길드, 원정과 연대기가 지워집니다.
          </DialogDescription>
          <button className="launch-button danger" onClick={restart}>
            현재 진행을 지우고 새로 시작
          </button>
          <button className="quiet-button" onClick={() => setReset(false)}>
            현재 길드로 돌아가기
          </button>
        </DialogContent>
      </Dialog>
      <Dialog open={journal} onOpenChange={setJournal}>
        <DialogContent className="game-dialog journal-dialog">
          <DialogTitle>길드 연대기</DialogTitle>
          <DialogDescription>
            동료들과 함께 돌아온 날의 기록. 최근 30회를 보관합니다.
          </DialogDescription>
          {!game.history.length ? (
            <div className="journal-empty">
              <ScrollText size={36} />
              <p>
                아직 쓰이지 않은 첫 페이지.
                <br />첫 원정에서 돌아오면 이야기가 시작됩니다.
              </p>
            </div>
          ) : (
            <div className="journal-list">
              {game.history.map((r) => (
                <article key={r.id}>
                  <span>
                    {r.day}일 · #{r.id}
                  </span>
                  <h3>
                    {MISSIONS[r.mission].name}
                    <small>{r.success ? '성공' : '철수'}</small>
                  </h3>
                  <p>{r.text}</p>
                  <footer>
                    {r.team.map((id) => AGENTS[id].name).join(' · ')}
                    <b>
                      +{r.gold}골드 · +{r.rep}명성
                    </b>
                  </footer>
                </article>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
