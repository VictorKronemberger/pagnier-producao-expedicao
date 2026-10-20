"use client";

import { useEffect, useRef } from "react";
import { RefreshCw } from "lucide-react";
import styles from "./nomus-capture.module.css";

const help = "Horário de Brasília da última etapa concluída. A consulta é feita por páginas; atualizar antecipa a próxima etapa da consulta.";
const compactTime = new Intl.DateTimeFormat("pt-BR", {timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit"});
type Props = {
  lastChecked?: string | null;
  configured?: boolean;
  partial?: boolean;
  busy: boolean;
  disabled: boolean;
  error: string;
  notice: string;
  onRefresh: () => void;
};

export default function NomusCapture({lastChecked, configured, partial, busy, disabled, error, notice, onRefresh}: Props) {
  const details = useRef<HTMLDetailsElement>(null);
  const fullDate = lastChecked ? new Date(lastChecked).toLocaleString("pt-BR", {timeZone: "America/Sao_Paulo"}) + " (Brasília)" : "Nenhuma captura confirmada";
  const status = error ? "Consulta indisponível" : configured === false ? "Nomus não conectado" : partial ? "Base parcial" : configured ? "Nomus conectado" : "Verificando conexão";
  useEffect(() => {
    const close = (event: PointerEvent) => { if (!details.current?.contains(event.target as Node)) details.current?.removeAttribute("open"); };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);
  return (
    <div className={styles.capture + " nomus-capture"} aria-label="Captura dos dados do Nomus">
      <details ref={details} className={styles.details} onKeyDown={event => {
        if (event.key === "Escape") { details.current?.removeAttribute("open"); details.current?.querySelector("summary")?.focus(); }
      }}>
        <summary className={styles.summary} title={status + " · Última captura: " + fullDate + ". Clique para detalhes."} aria-label={status + ". Última captura: " + fullDate + ". Ver detalhes."}>
          <span aria-hidden="true" className={styles.dot + " " + (error || partial ? styles.warning : configured === false ? styles.offline : "")} />
          {lastChecked ? <time dateTime={lastChecked}>{compactTime.format(new Date(lastChecked))}</time> : <span>—</span>}
        </summary>
        <div className={styles.popover}>
          <strong>Última captura do Nomus</strong>
          <p>{fullDate}</p>
          <small>{status}. {help}</small>
          {(error || notice) && <p className={"nomus-capture-notice " + (error ? "is-error " + styles.error : "")}>{error ? error + " A última captura confirmada foi preservada." : notice}</p>}
        </div>
      </details>
      <button type="button" className={"nomus-refresh " + styles.refresh} disabled={disabled || busy || configured === false} aria-label="Atualizar dados do Nomus" aria-busy={busy} title={busy ? "Capturando dados do Nomus…" : "Atualizar dados do Nomus"} onClick={onRefresh}>
        <RefreshCw size={13} className={busy ? "spin" : undefined} aria-hidden="true" />
      </button>
      <span className={styles.srOnly} role="status" aria-live="polite">{error ? status + ". " + error + " A última captura confirmada foi preservada." : notice}</span>
    </div>
  );
}
