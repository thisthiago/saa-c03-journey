/** Interface genérica dos laboratórios em grade: uma linha por caso, uma escolha por coluna e o veredito depois da verificação. */
import type { ReactNode } from "react";
import type { Evaluation } from "../../engine/types";
import { renderInline } from "../../ui/inline";
import c from "./compute.module.css";
import type { GridColumn, GridResponse, GridRow } from "./grid";
import sh from "./lab.module.css";

interface Props {
  columns: GridColumn[];
  rows: GridRow[];
  value: GridResponse;
  onChange: (v: GridResponse) => void;
  disabled: boolean;
  evaluation?: Evaluation | null;
  legend: ReactNode;
  intro?: ReactNode;
  simplifications: string[];
}

export function GridLab({
  columns,
  rows,
  value,
  onChange,
  disabled,
  evaluation,
  legend,
  intro,
  simplifications,
}: Props) {
  const set = (rowId: string, colId: string, v: string) =>
    onChange({
      answers: {
        ...value.answers,
        [rowId]: { ...value.answers?.[rowId], [colId]: v },
      },
    });
  return (
    <div className={sh.lab}>
      <p className={c.legend}>{legend}</p>
      {intro}
      <div className={sh.cards}>
        {rows.map((row) => {
          const fb = evaluation?.items.find((i) => i.id === row.id);
          return (
            <section
              key={row.id}
              className={sh.card}
              aria-label={row.label.replace(/[*`]/g, "")}
            >
              <h4 className={sh.title}>{renderInline(row.label)}</h4>
              {row.detail && (
                <p className={sh.desc}>{renderInline(row.detail)}</p>
              )}
              <div className={c.row}>
                {columns.map((col) => (
                  <label key={col.id} className={c.field}>
                    <span>{col.label}</span>
                    <select
                      className={c.select}
                      value={value.answers?.[row.id]?.[col.id] ?? ""}
                      disabled={disabled}
                      onChange={(e) => set(row.id, col.id, e.target.value)}
                    >
                      <option value="">Escolha…</option>
                      {col.options.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
              </div>
              {fb && (
                <div
                  className={sh.verdict}
                  data-status={fb.status}
                  aria-live="polite"
                >
                  <strong>
                    {fb.status === "correct"
                      ? "Certo"
                      : fb.status === "partial"
                        ? "Em parte"
                        : "Não"}
                  </strong>
                  <span>{renderInline(fb.message ?? "")}</span>
                </div>
              )}
            </section>
          );
        })}
      </div>
      <details className={sh.simp}>
        <summary>Simplificações deste simulador</summary>
        <ul>
          {simplifications.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </details>
    </div>
  );
}
