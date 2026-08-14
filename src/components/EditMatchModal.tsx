import { useState } from "react";
import Modal from "./Modal";
import Stepper from "./Stepper";
import { api, type MatchEntry } from "../api";

/**
 * Correct a logged match's score. Players and the "who carried?" split are
 * left untouched — the API treats omitted fields as unchanged — because a
 * mistyped score is the thing people actually need to fix.
 */
export default function EditMatchModal({
  match,
  onClose,
  onSaved,
  showToast,
}: {
  match: MatchEntry;
  onClose: () => void;
  onSaved: () => void;
  showToast: (msg: string) => void;
}) {
  const [scoreA, setScoreA] = useState(match.scoreA);
  const [scoreB, setScoreB] = useState(match.scoreB);
  const [busy, setBusy] = useState(false);

  const names = (side: MatchEntry["teamA"]) =>
    side.map((p) => p.name).join(" & ");

  // Same rules the server enforces, mirrored here for instant feedback.
  const error =
    scoreA === scoreB
      ? "No draws in pickleball — someone won!"
      : Math.max(scoreA, scoreB) < 11
        ? "Winning score must reach at least 11"
        : Math.abs(scoreA - scoreB) < 2
          ? "You have to win by 2!"
          : null;

  const unchanged = scoreA === match.scoreA && scoreB === match.scoreB;
  const flipped =
    !error && scoreA > scoreB !== match.scoreA > match.scoreB;

  const save = async () => {
    if (error || unchanged || busy) return;
    setBusy(true);
    try {
      await api.editMatch(match.id, { scoreA, scoreB });
      onSaved();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Couldn't save that");
      setBusy(false);
    }
  };

  return (
    <Modal title="Fix the score" onClose={onClose}>
      <div className="edit-match">
        <div className="edit-row">
          <div className="edit-team a">{names(match.teamA)}</div>
          <div className="score-big a" aria-live="polite">
            {scoreA}
          </div>
          <Stepper
            value={scoreA}
            onChange={setScoreA}
            label={`${names(match.teamA)} score`}
            presets={[5, 11]}
            hideVal
          />
        </div>

        <div className="edit-vs">vs</div>

        <div className="edit-row">
          <div className="edit-team b">{names(match.teamB)}</div>
          <div className="score-big b" aria-live="polite">
            {scoreB}
          </div>
          <Stepper
            value={scoreB}
            onChange={setScoreB}
            label={`${names(match.teamB)} score`}
            presets={[5, 11]}
            hideVal
          />
        </div>

        {error ? (
          <div className="form-error">{error}</div>
        ) : flipped ? (
          <div className="edit-note">
            Heads up: this flips who won. Everyone's rating from this match
            onwards gets recalculated.
          </div>
        ) : (
          <div className="edit-note">
            Ratings replay from here, so later matches stay correct.
          </div>
        )}
      </div>

      <div className="modal-actions">
        <button className="cta secondary" onClick={onClose} disabled={busy}>
          Cancel
        </button>
        <button
          className="cta"
          onClick={save}
          disabled={busy || !!error || unchanged}
        >
          {busy ? "…" : "Save fix"}
        </button>
      </div>
    </Modal>
  );
}
