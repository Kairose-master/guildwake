import { act, newGame, parseSave, type Action, type Game } from './game.ts';
export const SAVE_KEY = 'guildwake.save.v1';
export type Snapshot = {
  game: Game;
  loaded: boolean;
  storageIssue: string;
  notice: string;
};
type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;
export const SERVER_SNAPSHOT: Snapshot = {
  game: newGame(),
  loaded: false,
  storageIssue: '',
  notice: '',
};
/** One state machine shared by UI and WebMCP; no credentials or network calls. */
export function createGameStore() {
  let snapshot = SERVER_SNAPSHOT;
  let storage: StorageLike | undefined;
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach((listener) => listener());
  const persist = () => {
    if (!storage || snapshot.storageIssue) return;
    try {
      storage.setItem(SAVE_KEY, JSON.stringify(snapshot.game));
    } catch {
      snapshot = {
        ...snapshot,
        storageIssue:
          '진행을 저장하지 못했습니다. 저장 공간이나 브라우저 설정을 확인하세요.',
      };
    }
  };
  return {
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot: () => snapshot,
    initialize(target?: StorageLike) {
      if (snapshot.loaded) return;
      storage = target;
      let game = newGame(),
        storageIssue = '';
      try {
        const raw = storage?.getItem(SAVE_KEY);
        if (raw) {
          const restored = parseSave(raw);
          if (restored) game = restored;
          else
            storageIssue =
              '저장 파일을 읽을 수 없습니다. 기존 저장은 보존합니다. 새 길드를 시작하면 다시 저장됩니다.';
        }
        if (!storage)
          storageIssue =
            '저장을 사용할 수 없습니다. 창을 닫으면 진행이 사라집니다.';
      } catch {
        storageIssue =
          '저장을 사용할 수 없습니다. 창을 닫으면 진행이 사라집니다.';
      }
      snapshot = { game, loaded: true, storageIssue, notice: '' };
      emit();
    },
    apply(action: Action) {
      if (!snapshot.loaded) throw Error('저장을 불러오는 중입니다.');
      try {
        const game = act(snapshot.game, action);
        if (game === snapshot.game) return game;
        snapshot = { ...snapshot, game, notice: '' };
        persist();
        emit();
        return game;
      } catch (error) {
        snapshot = {
          ...snapshot,
          notice:
            error instanceof Error
              ? error.message
              : '작업을 완료하지 못했습니다.',
        };
        emit();
        throw error;
      }
    },
    restart(seed: number) {
      snapshot = {
        game: newGame(seed),
        loaded: true,
        storageIssue: '',
        notice: '',
      };
      persist();
      emit();
    },
  };
}
export type GameStore = ReturnType<typeof createGameStore>;
