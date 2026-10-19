"use client";

import { Clock3, RefreshCw } from "lucide-react";
import styles from "./nomus-capture.module.css";

const help = "Horário de Brasília da última etapa concluída. A consulta é feita por páginas; atualizar antecipa a próxima etapa.";
const compactDate = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit",
  hour: "2-digit", minute: "2-digit", second: "2-digit",
});

type Props = {
  lastChecked?: string | null;
  configured?: boolean;
  busy: boolean;
  disabled: boolean;
  error: string;
  notice: string;
  quietNotice: boolean;
  onRefresh: () => void;
};

export default function NomusCapture({lastChecked, configured, busy, disabled, error, notice, quietNotice, onRefresh}: Props) {
  const fullDate = lastChecked ? new Date(lastChecked).toLocaleString("pt-BR", {timeZone: "America/Sao_Paulo"}) + " (Brasília)" : "";
  return (
    <section className={styles.capture + " nomus-capture"} aria-label="Captura dos dados do Nomus">
      <div className={styles.info} title={help} aria-describedby="nomus-capture-help">
        <Clock3 size={14} aria-hidden="true" />
        <span>Última captura</span>
        {lastChecked ? <time className={styles.time} dateTime={lastChecked} title={fullDate} aria-label={fullDate}>{compactDate.format(new Date(lastChecked)).replace(", ", " · ")}</time>
          : <span className={styles.time}>{configured === false ? "Não conectado" : configured === undefined ? "Consultando…" : "Ainda não realizada"}</span>}
      </div>
      <button type="button" className={"button nomus-refresh " + styles.refresh} disabled={disabled || busy || configured === false} aria-label="Atualizar dados do Nomus" aria-busy={busy} aria-describedby="nomus-capture-help" title={busy ? "Capturando dados do Nomus…" : "Atualizar dados do Nomus"} onClick={onRefresh}>
        <RefreshCw size={14} className={busy ? "spin" : undefined} aria-hidden="true" />
        <span>Atualizar</span>
      </button>
      <span id="nomus-capture-help" className={styles.srOnly}>{help}</span>
      {(error || notice) && <p className={"nomus-capture-notice " + (error ? "is-error " + styles.error : quietNotice ? styles.srOnly : styles.notice)} role="status" aria-live="polite">{error ? error + " A última captura confirmada foi preservada." : notice}</p>}
    </section>
  );
}
