import { getGhostCells, getPieceCells, getPiecePreview, VISIBLE_TOP, type GameState, type PieceKind } from "tetris-toolkit";

export function StackBoard({ state, active }: { state: GameState; active: boolean }) {
  const piece = active ? state.active : null;
  const cells = new Set(piece ? getPieceCells(piece.kind, piece.rotation, piece.x, piece.y).map(([x, y]) => `${x},${y}`) : []);
  const ghost = new Set(active ? getGhostCells(state).map(([x, y]) => `${x},${y}`) : []);
  const clearRows = state.phase.kind === "lineClearAnim" ? state.phase.rows : [];
  return (
    <div role="img" aria-label="Stos pamięci — plansza 10 na 20" className="stack-board">
      {state.board.slice(VISIBLE_TOP).flatMap((row, index) => row.map((locked, x) => {
        const y = index + VISIBLE_TOP;
        const falling = cells.has(`${x},${y}`);
        const kind = falling ? piece?.kind : locked;
        return <span key={`${x},${y}`} data-cell={`${x},${index}`} data-kind={kind ?? "empty"}
          className={`stack-cell ${kind ? `stack-piece stack-${kind}` : ghost.has(`${x},${y}`) ? "stack-ghost" : ""} ${clearRows.includes(y) ? "stack-clearing" : ""}`} />;
      }))}
    </div>
  );
}

export function NextPiece({ kind }: { kind?: PieceKind }) {
  const preview = kind ? getPiecePreview(kind) : null;
  const filled = new Set(preview?.cells.map(([x, y]) => `${x - preview.minX},${y - preview.minY}`));
  return <div role="img" aria-label={kind ? `Następny blok: ${kind}` : "Następny blok"} className="stack-preview">
    {Array.from({ length: 8 }, (_, index) => <span key={index} className={`stack-cell ${filled.has(`${index % 4},${Math.floor(index / 4)}`) ? `stack-piece stack-${kind}` : "stack-preview-empty"}`} />)}
  </div>;
}