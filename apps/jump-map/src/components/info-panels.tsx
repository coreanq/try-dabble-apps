import { Card } from "@/components/ui/card";
import type { MsgKey, Translate } from "@/lib/i18n";

const THEMES: { chip: string; name: MsgKey; desc: MsgKey }[] = [
  { chip: "pj-chip-under", name: "themeUnder", desc: "themeUnderDesc" },
  { chip: "pj-chip-ground", name: "themeGround", desc: "themeGroundDesc" },
  { chip: "pj-chip-sky", name: "themeSky", desc: "themeSkyDesc" },
  { chip: "pj-chip-space", name: "themeSpace", desc: "themeSpaceDesc" },
];

const HAZARDS: { chip: string; name: MsgKey; desc: MsgKey }[] = [
  { chip: "pj-chip-spike", name: "hazardSpike", desc: "hazardSpikeDesc" },
  { chip: "pj-chip-fake", name: "hazardFake", desc: "hazardFakeDesc" },
  { chip: "pj-chip-fall", name: "hazardFall", desc: "hazardFallDesc" },
];

/** The copy strip along the control deck: what the run is made of, and why
 *  nothing about it leaves the device. */
export function InfoPanels({ t }: { t: Translate }) {
  return (
    <>
      <div className="pj-panels">
        <Card className="pj-panel">
          <h2 className="pj-panel-title">{t("themesTitle")}</h2>
          <ul className="pj-list">
            {THEMES.map((item) => (
              <li key={item.name}>
                <span className={`pj-chip ${item.chip}`} aria-hidden="true" />
                <span>
                  <b>{t(item.name)}</b>
                  <p>{t(item.desc)}</p>
                </span>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="pj-panel">
          <h2 className="pj-panel-title">{t("hazardsTitle")}</h2>
          <ul className="pj-list">
            {HAZARDS.map((item) => (
              <li key={item.name}>
                <span className={`pj-chip ${item.chip}`} aria-hidden="true" />
                <span>
                  <b>{t(item.name)}</b>
                  <p>{t(item.desc)}</p>
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
      <div className="pj-panels">
        <Card className="pj-panel">
          <h2 className="pj-panel-title">{t("seoTitle")}</h2>
          <div className="pj-prose">
            <p>{t("seoBody")}</p>
          </div>
        </Card>
        <Card className="pj-panel">
          <h2 className="pj-panel-title">{t("installTitle")}</h2>
          <div className="pj-prose">
            <p>{t("installBody")}</p>
            <p>{t("howToMenu")}</p>
          </div>
        </Card>
      </div>
    </>
  );
}
