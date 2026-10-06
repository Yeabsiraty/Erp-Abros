import { api } from "../lib/api.js";
import { t } from "../lib/i18n.js";
import { MONTHS, WEEKDAYS, dstr, todayEth } from "../lib/ethiopian.js";
import { fmt, fmt0 } from "../lib/format.js";
import { useResource, useSettings, useToast } from "../lib/hooks.jsx";
import { useSubmit } from "../lib/forms.js";
import { BarChart, Legend, LineChart } from "../components/Charts.jsx";
import { Button, Card, Empty, ErrorNote, Loading, PageHeader, StatusPill } from "../components/ui.jsx";

const Kpi = ({ label, value, note, tone, unit = t("ብር") }) => (
  <div className={`card kpi ${tone || ""}`}>
    <span className="k-label">{label}</span>
    <span className="k-value">{fmt(value)}<small>{unit}</small></span>
    {note && <span className="k-note">{note}</span>}
  </div>
);

function Ranked({ rows, valueKey, unitKey }) {
  if (!rows.length) return <p className="muted">{t("ገና መረጃ የለም።")}</p>;
  const max = Math.max(...rows.map((r) => Number(r[valueKey]) || 0), 1);
  return (
    <div className="bar-list">
      {rows.map((r) => (
        <div className="bar-row" key={r.name}>
          <div className="top"><span>{r.name}</span><b>{valueKey === "profit" ? fmt(r[valueKey]) : `${fmt0(r[valueKey])} ${r[unitKey] || ""}`}</b></div>
          <div className="track"><i style={{ width: `${(Number(r[valueKey]) / max) * 100}%` }} /></div>
        </div>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const { settings } = useSettings();
  const toast = useToast();
  const { data, loading, error, reload } = useResource("/dashboard/");
  const [busy, run] = useSubmit();
  const now = todayEth();
  const head = (
    <PageHeader title={settings?.name || t("ዳሽቦርድ")} subtitle={`${WEEKDAYS[new Date().getDay()]}, ${dstr(now)}`}>
      <Button variant="ghost" icon="sales" onClick={() => { window.location.hash = "/sales"; }}>{t("ሽያጭ መዝግብ")}</Button>
    </PageHeader>
  );
  if (loading && !data) return <>{head}<Loading /></>;
  if (error && !data) return <>{head}<ErrorNote error={error} retry={reload} /></>;
  const k = data.kpis;
  const labels = data.months.map((m) => MONTHS[m.m - 1].slice(0, 3));
  const names = data.months.map((m) => MONTHS[m.m - 1]);
  const net = k.month_net;
  return (
    <>
      {head}
      <div className="stack">
        {data.is_empty && (
          <Card>
            <Empty action={
              <div className="page-actions">
                <Button icon="plus" onClick={() => { window.location.hash = "/stock"; }}>{t("ዕቃ ጨምር")}</Button>
                <Button variant="ghost" disabled={busy} onClick={async () => { if (await run(() => api.post("/demo/load/"), t("የናሙና መረጃ ተጭኗል"))) reload(); }}>{t("የናሙና መረጃ ጫን")}</Button>
              </div>}>
              {t("ደብተሩ ባዶ ነው። ዕቃ በመጨመር ይጀምሩ ወይም ናሙና ይጫኑ።")}
            </Empty>
          </Card>
        )}
        <div className="kpis">
          <Kpi label={t("የዛሬ ሽያጭ")} value={k.day_sales} />
          <Kpi label={t("የ{month} ሽያጭ", { month: MONTHS[data.period.m - 1] })} value={k.month_sales} note={t("ጠቅላላ ትርፍ {v}", { v: fmt(k.month_gross) })} />
          <Kpi label={t("የወሩ የተጣራ ትርፍ")} value={net} tone={net < 0 ? "neg" : net > 0 ? "pos" : ""} note={t("ወጪ {v}", { v: fmt(k.month_expenses) })} />
          <Kpi label={t("የዓመቱ የተጣራ ትርፍ")} value={k.year_net} tone={k.year_net < 0 ? "neg" : "pos"} note={t("ሽያጭ {v}", { v: fmt(k.year_sales) })} />
        </div>
        <div className="kpis">
          <Kpi label={t("የክምችት ዋጋ")} value={k.stock_value} />
          <Kpi label={t("ጠቅላላ ዕዳ")} value={k.debt_total} tone={k.debt_total > 0 ? "neg" : ""} note={t("{n} ተበዳሪዎች", { n: k.debtors })} />
          <Kpi label={t("ሊያልቁ የተቃረቡ")} value={k.low_count} unit={t("ዕቃ")} tone={k.low_count ? "neg" : ""} />
        </div>
        <Card title={t("ወርሃዊ ሽያጭ · {y}", { y: data.period.y })} aside={<Legend series={[{ name: t("ሽያጭ"), color: "var(--c1)" }, { name: t("የዕቃ ዋጋ"), color: "var(--c2)" }]} />}>
          <BarChart labels={labels} names={names} series={[
            { name: t("ሽያጭ"), color: "var(--c1)", values: data.months.map((m) => Number(m.sales)) },
            { name: t("የዕቃ ዋጋ"), color: "var(--c2)", values: data.months.map((m) => Number(m.cost)) },
          ]} />
        </Card>
        <Card title={t("የተጣራ ትርፍ በወር")} aside={<Legend series={[{ name: t("ትርፍ"), color: "var(--c1)" }, { name: t("ወጪ"), color: "var(--c3)" }]} />}>
          <LineChart labels={labels} names={names} series={[
            { name: t("ትርፍ"), color: "var(--c1)", values: data.months.map((m) => Number(m.net)) },
            { name: t("ወጪ"), color: "var(--c3)", values: data.months.map((m) => Number(m.expenses)) },
          ]} />
        </Card>
        <div className="grid g3">
          <Card title={t("ብዙ የተሸጡ")}><Ranked rows={data.top_qty} valueKey="sold" unitKey="unit" /></Card>
          <Card title={t("ብዙ ትርፍ ያመጡ")}><Ranked rows={data.top_profit} valueKey="profit" /></Card>
          <Card title={t("ክምችት ማስጠንቀቂያ")}>
            {data.low_stock.length === 0 ? <p className="muted">{t("ሁሉም ዕቃ በቂ ነው።")}</p> : (
              <div className="bar-list">
                {data.low_stock.map((r) => (
                  <div className="top" key={r.name} style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                    <span>{r.name} <span className="muted">· {fmt0(r.left)} {r.unit}</span></span>
                    <StatusPill status={r.status} />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
