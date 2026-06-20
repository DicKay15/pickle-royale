import { useCallback, useEffect, useRef, useState } from "react";
import { api, setGroup, type Me } from "./api";
import Leaderboard from "./components/Leaderboard";
import LogMatch from "./components/LogMatch";
import History from "./components/History";
import Profile from "./components/Profile";
import AddPlayerSheet from "./components/AddPlayerSheet";
import Login from "./components/Login";
import GroupPicker from "./components/GroupPicker";
import AccountSheet from "./components/AccountSheet";
import ClaimSheet from "./components/ClaimSheet";

export type Tab = "board" | "log" | "history";

const TAGLINES = [
  "Rankings · Rumbles · Respect",
  "Where egos go to dink",
  "No mercy. Only dinks.",
  "Bragging rights, quantified",
  "Kitchen's closed. Get cooked.",
];

const SECRETS = [
  "🥒 Sir Dill says: keep your paddle up!",
  "🥒 Psst… the third-shot drop is mostly luck.",
  "🥒 You found Sir Dill's secret stash!",
  "🥒 Dink responsibly, champ.",
];

const reduceMotion =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const GROUP_KEY = "pr_group";

export default function App() {
  const [me, setMe] = useState<Me | null | undefined>(undefined);
  const [currentGroupId, setCurrentGroupId] = useState<number | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [claimOpen, setClaimOpen] = useState(false);

  const [tab, setTab] = useState<Tab>("board");
  const [profileId, setProfileId] = useState<number | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  const showToast = useCallback((msg: string) => setToast(msg), []);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  // load account on mount
  const loadMe = useCallback(async (): Promise<Me | null> => {
    const data = await api.me();
    setMe(data);
    if (data) {
      const stored = Number(localStorage.getItem(GROUP_KEY));
      const valid = data.groups.find((g) => g.id === stored);
      const pick = valid ? valid.id : (data.groups[0]?.id ?? null);
      setCurrentGroupId(pick);
    }
    return data;
  }, []);

  useEffect(() => {
    loadMe().catch(() => setMe(null));
  }, [loadMe]);

  // rotating tagline
  const [tagIdx, setTagIdx] = useState(() =>
    Math.floor(Math.random() * TAGLINES.length),
  );
  useEffect(() => {
    if (reduceMotion) return;
    const t = setInterval(
      () => setTagIdx((i) => (i + 1) % TAGLINES.length),
      5000,
    );
    return () => clearInterval(t);
  }, []);

  // easter egg
  const taps = useRef(0);
  const tapReset = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [wiggle, setWiggle] = useState(false);
  const onBadgeTap = () => {
    setWiggle(true);
    setTimeout(() => setWiggle(false), 560);
    taps.current += 1;
    if (tapReset.current) clearTimeout(tapReset.current);
    tapReset.current = setTimeout(() => (taps.current = 0), 1500);
    if (taps.current >= 5) {
      taps.current = 0;
      showToast(SECRETS[Math.floor(Math.random() * SECRETS.length)]);
    }
  };

  const openTab = (t: Tab) => {
    setProfileId(null);
    setTab(t);
  };

  const switchGroup = (id: number) => {
    setCurrentGroupId(id);
    localStorage.setItem(GROUP_KEY, String(id));
    setProfileId(null);
    setTab("board");
    refresh();
  };

  const onPickedGroup = async (gid: number) => {
    setPickerOpen(false);
    await loadMe();
    switchGroup(gid);
  };

  // ---- gates ----
  if (me === undefined) {
    return (
      <div className="boot">
        <img className="load-mascot" src="/mascot.svg" alt="" />
        <div className="load-line">Warming up the court…</div>
      </div>
    );
  }
  if (me === null) return <Login />;
  if (me.groups.length === 0) {
    return (
      <GroupPicker
        firstRun
        onPicked={(g) => onPickedGroup(g.id)}
        showToast={showToast}
      />
    );
  }

  const currentGroup =
    me.groups.find((g) => g.id === currentGroupId) ?? me.groups[0];
  setGroup(currentGroup.id);

  return (
    <div className="shell">
      <header className="masthead">
        <button
          className={`masthead-badge ${wiggle ? "wiggle" : ""}`}
          onClick={onBadgeTap}
          aria-label="Pickle Royale mascot"
        >
          <img src="/favicon.svg" alt="" />
        </button>
        <div className="masthead-text">
          <div className="masthead-stamp">Official Power Rankings</div>
          <h1>
            Pickle <em>Royale</em>
          </h1>
          <div className="tagline rotating" key={tagIdx}>
            {TAGLINES[tagIdx]}
          </div>
        </div>
      </header>

      <button className="group-bar" onClick={() => setAccountOpen(true)}>
        <span className="gb-name">👥 {currentGroup.name}</span>
        <span className="gb-code">#{currentGroup.code}</span>
        <span className="gb-caret">⌄</span>
      </button>

      <main>
        {profileId !== null ? (
          <Profile
            id={profileId}
            version={version}
            isAdmin={currentGroup.role === "admin"}
            onBack={() => setProfileId(null)}
            onChanged={() => {
              loadMe();
              refresh();
            }}
            showToast={showToast}
          />
        ) : tab === "board" ? (
          <Leaderboard
            version={version}
            meGroup={currentGroup}
            onSelect={setProfileId}
            onAdd={() => setAddOpen(true)}
            onLog={() => openTab("log")}
            onClaim={() => setClaimOpen(true)}
          />
        ) : tab === "log" ? (
          <LogMatch
            version={version}
            onLogged={refresh}
            onDone={() => openTab("board")}
            onAddPlayer={() => setAddOpen(true)}
            showToast={showToast}
          />
        ) : (
          <History version={version} onChanged={refresh} showToast={showToast} />
        )}
      </main>

      <nav className="tabbar" aria-label="Main">
        <div className="tabbar-inner">
          <button
            className={`tab-btn ${tab === "board" && profileId === null ? "active" : ""}`}
            onClick={() => openTab("board")}
            aria-label="Standings"
          >
            <span className="ico">🏆</span>
            Standings
          </button>
          <button
            className="tab-log"
            onClick={() => openTab("log")}
            aria-label="Log a match"
          >
            +
          </button>
          <button
            className={`tab-btn ${tab === "history" && profileId === null ? "active" : ""}`}
            onClick={() => openTab("history")}
            aria-label="Match history"
          >
            <span className="ico">📜</span>
            Rumbles
          </button>
        </div>
      </nav>

      {addOpen && (
        <AddPlayerSheet
          onClose={() => setAddOpen(false)}
          onAdded={(name) => {
            setAddOpen(false);
            refresh();
            showToast(`${name} has entered the Royale! 🏓`);
          }}
        />
      )}

      {accountOpen && (
        <AccountSheet
          me={me}
          currentGroupId={currentGroup.id}
          onSwitch={switchGroup}
          onAddGroup={() => {
            setAccountOpen(false);
            setPickerOpen(true);
          }}
          onRefresh={() => loadMe()}
          onClose={() => setAccountOpen(false)}
          showToast={showToast}
        />
      )}

      {pickerOpen && (
        <GroupPicker
          onPicked={(g) => onPickedGroup(g.id)}
          onClose={() => setPickerOpen(false)}
          showToast={showToast}
        />
      )}

      {claimOpen && (
        <ClaimSheet
          onClose={() => setClaimOpen(false)}
          onClaimed={() => {
            loadMe();
            refresh();
          }}
          showToast={showToast}
        />
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
