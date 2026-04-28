"""Gera laudo em PDF para exame de imitanciometria usando matplotlib + WeasyPrint."""
from __future__ import annotations

import base64
import io
import math
from datetime import datetime
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.db.models import Exame


# ── Timpanograma ──────────────────────────────────────────────────────────────

def _timpanograma_base64(resultado) -> str:
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    import numpy as np

    fig, ax = plt.subplots(figsize=(9, 4))
    pressures = np.linspace(-400, 200, 300)

    def gaussian_curve(peak_pressure, peak_compliance, width=80):
        if peak_pressure is None or peak_compliance is None:
            return None
        return float(peak_compliance) * np.exp(
            -((pressures - float(peak_pressure)) ** 2) / (2 * float(width) ** 2)
        )

    od_peak_p = resultado.od_pressao
    od_peak_c = resultado.od_pico
    oe_peak_p = resultado.oe_pressao
    oe_peak_c = resultado.oe_pico

    od_curve = gaussian_curve(od_peak_p, od_peak_c)
    oe_curve = gaussian_curve(oe_peak_p, oe_peak_c)

    if od_curve is not None:
        ax.plot(pressures, od_curve, color="#e74c3c", linewidth=2, label="OD — Orelha Direita")
        ax.axvline(float(od_peak_p), color="#e74c3c", linestyle=":", linewidth=0.8, alpha=0.6)

    if oe_curve is not None:
        ax.plot(pressures, oe_curve, color="#2980b9", linewidth=2, label="OE — Orelha Esquerda")
        ax.axvline(float(oe_peak_p), color="#2980b9", linestyle=":", linewidth=0.8, alpha=0.6)

    if od_curve is None and oe_curve is None:
        ax.text(
            0.5, 0.5, "Sem dados de timpanograma",
            transform=ax.transAxes, ha="center", va="center", color="#aaa", fontsize=11,
        )

    ax.set_xlabel("Pressão (daPa)", fontsize=9)
    ax.set_ylabel("Complacência (ml)", fontsize=9)
    ax.set_title("Timpanograma", fontsize=11, fontweight="bold", pad=10)
    ax.set_xlim(-400, 200)
    ax.set_ylim(bottom=0)
    ax.axvline(0, color="#888", linestyle="--", linewidth=0.6, alpha=0.5)
    ax.grid(True, alpha=0.2)
    if od_curve is not None or oe_curve is not None:
        ax.legend(fontsize=8, loc="upper right")

    buf = io.BytesIO()
    fig.savefig(buf, format="png", dpi=130, bbox_inches="tight")
    plt.close(fig)
    buf.seek(0)
    return base64.b64encode(buf.read()).decode()


# ── Helpers ───────────────────────────────────────────────────────────────────

def _fmt(v) -> str:
    if v is None:
        return "—"
    fv = float(v)
    return str(int(fv)) if fv == int(fv) else f"{fv:.1f}"


def _reflex_cell(value) -> str:
    if value is None:
        return "NP"
    return _fmt(value)


# ── Template HTML ─────────────────────────────────────────────────────────────

def _html(exame: "Exame", nm_usuario: str, nr_conselho: str) -> str:
    r = exame.resultado_imitan
    img_b64 = _timpanograma_base64(r)
    dt = exame.dt_exame
    dt_str = dt.strftime("%d/%m/%Y às %H:%M") if isinstance(dt, datetime) else str(dt)
    obs = exame.ds_observacoes or "—"
    conclusao = (r.ds_conclusao or "").replace("\n", "<br>")

    tipo_od = r.od_tipo_curva or "—"
    tipo_oe = r.oe_tipo_curva or "—"

    return f"""
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<style>
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  body {{ font-family: Arial, sans-serif; font-size: 11px; color: #222; padding: 24px 32px; }}
  h1 {{ font-size: 16px; color: #4c2c8a; }}
  h2 {{ font-size: 13px; color: #4c2c8a; margin: 16px 0 6px; border-bottom: 1px solid #ddd; padding-bottom: 3px; }}
  .header {{ display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }}
  .header-info {{ font-size: 10px; color: #555; text-align: right; }}
  .info-grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 4px 24px; margin-bottom: 8px; }}
  .info-item span:first-child {{ font-weight: bold; }}
  table {{ width: 100%; border-collapse: collapse; margin: 8px 0; font-size: 10px; }}
  th, td {{ border: 1px solid #ccc; padding: 4px 6px; text-align: center; }}
  th {{ background: #f0eaff; font-weight: bold; }}
  .freq-header th {{ background: #4c2c8a; color: white; }}
  .chart {{ text-align: center; margin: 10px 0; }}
  .chart img {{ max-width: 100%; height: auto; }}
  .conclusao {{ background: #fafafa; border: 1px solid #ddd; padding: 10px 14px; border-radius: 4px; line-height: 1.6; min-height: 50px; }}
  .assinatura {{ margin-top: 32px; text-align: center; }}
  .assinatura .linha {{ border-top: 1px solid #333; width: 250px; margin: 0 auto 4px; }}
  .tag {{ display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: bold; }}
  .tag-od {{ background: #fde8e8; color: #c0392b; }}
  .tag-oe {{ background: #e8f0fd; color: #1a5276; }}
  .np {{ color: #aaa; font-style: italic; }}
  .badge-rascunho {{ color: #e67e22; font-weight: bold; }}
  .badge-finalizado {{ color: #27ae60; font-weight: bold; }}
</style>
</head>
<body>

<div class="header">
  <div>
    <h1>Laudo de Imitanciometria</h1>
    <div style="font-size:10px; color:#555; margin-top:4px;">
      Exame #{exame.id_exame} &nbsp;|&nbsp;
      Status: <span class="{'badge-finalizado' if exame.ds_status == 'FINALIZADO' else 'badge-rascunho'}">{exame.ds_status}</span>
    </div>
  </div>
  <div class="header-info">
    Data: {dt_str}<br>
    {f"Atendimento: #{exame.id_atendimento}" if exame.id_atendimento else ""}
  </div>
</div>

<h2>Identificação</h2>
<div class="info-grid">
  <div class="info-item"><span>Paciente (cód.):</span> {exame.id_paciente}</div>
  <div class="info-item"><span>Profissional:</span> {nm_usuario}</div>
  <div class="info-item"><span>Conselho:</span> {nr_conselho or "—"}</div>
</div>

<h2>Timpanograma</h2>
<div class="chart">
  <img src="data:image/png;base64,{img_b64}" alt="Timpanograma">
</div>

<h2>Parâmetros do Timpanograma</h2>
<table>
  <thead>
    <tr class="freq-header">
      <th>Orelha</th>
      <th>Tipo de Curva</th>
      <th>ECV (ml)</th>
      <th>Pico / Compliância (ml)</th>
      <th>Pressão (daPa)</th>
      <th>Gradiente</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th><span class="tag tag-od">OD</span></th>
      <td>{tipo_od}</td>
      <td>{_fmt(r.od_ecv)}</td>
      <td>{_fmt(r.od_pico)}</td>
      <td>{_fmt(r.od_pressao)}</td>
      <td>{_fmt(r.od_gradiante)}</td>
    </tr>
    <tr>
      <th><span class="tag tag-oe">OE</span></th>
      <td>{tipo_oe}</td>
      <td>{_fmt(r.oe_ecv)}</td>
      <td>{_fmt(r.oe_pico)}</td>
      <td>{_fmt(r.oe_pressao)}</td>
      <td>{_fmt(r.oe_gradiante)}</td>
    </tr>
  </tbody>
</table>

<h2>Reflexos Estapedianos — Orelha Direita (sonda OD)</h2>
<table>
  <thead>
    <tr class="freq-header">
      <th>Modalidade</th>
      <th>500 Hz</th>
      <th>1000 Hz</th>
      <th>2000 Hz</th>
      <th>4000 Hz</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th>Ipsilateral (dB)</th>
      <td class="{'np' if r.od_ipsi_500 is None else ''}">{_reflex_cell(r.od_ipsi_500)}</td>
      <td class="{'np' if r.od_ipsi_1000 is None else ''}">{_reflex_cell(r.od_ipsi_1000)}</td>
      <td class="{'np' if r.od_ipsi_2000 is None else ''}">{_reflex_cell(r.od_ipsi_2000)}</td>
      <td class="{'np' if r.od_ipsi_4000 is None else ''}">{_reflex_cell(r.od_ipsi_4000)}</td>
    </tr>
    <tr>
      <th>Contralateral (dB)</th>
      <td class="{'np' if r.od_contra_500 is None else ''}">{_reflex_cell(r.od_contra_500)}</td>
      <td class="{'np' if r.od_contra_1000 is None else ''}">{_reflex_cell(r.od_contra_1000)}</td>
      <td class="{'np' if r.od_contra_2000 is None else ''}">{_reflex_cell(r.od_contra_2000)}</td>
      <td class="{'np' if r.od_contra_4000 is None else ''}">{_reflex_cell(r.od_contra_4000)}</td>
    </tr>
  </tbody>
</table>

<h2>Reflexos Estapedianos — Orelha Esquerda (sonda OE)</h2>
<table>
  <thead>
    <tr class="freq-header">
      <th>Modalidade</th>
      <th>500 Hz</th>
      <th>1000 Hz</th>
      <th>2000 Hz</th>
      <th>4000 Hz</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th>Ipsilateral (dB)</th>
      <td class="{'np' if r.oe_ipsi_500 is None else ''}">{_reflex_cell(r.oe_ipsi_500)}</td>
      <td class="{'np' if r.oe_ipsi_1000 is None else ''}">{_reflex_cell(r.oe_ipsi_1000)}</td>
      <td class="{'np' if r.oe_ipsi_2000 is None else ''}">{_reflex_cell(r.oe_ipsi_2000)}</td>
      <td class="{'np' if r.oe_ipsi_4000 is None else ''}">{_reflex_cell(r.oe_ipsi_4000)}</td>
    </tr>
    <tr>
      <th>Contralateral (dB)</th>
      <td class="{'np' if r.oe_contra_500 is None else ''}">{_reflex_cell(r.oe_contra_500)}</td>
      <td class="{'np' if r.oe_contra_1000 is None else ''}">{_reflex_cell(r.oe_contra_1000)}</td>
      <td class="{'np' if r.oe_contra_2000 is None else ''}">{_reflex_cell(r.oe_contra_2000)}</td>
      <td class="{'np' if r.oe_contra_4000 is None else ''}">{_reflex_cell(r.oe_contra_4000)}</td>
    </tr>
  </tbody>
</table>

<h2>Classificação dos Timpanogramas — Jerger, Jerger e Maudin (1972)</h2>
<table>
  <thead>
    <tr class="freq-header">
      <th>Tipo de Curva</th>
      <th>Pico / Complacência</th>
      <th>Pressão de Referência</th>
    </tr>
  </thead>
  <tbody>
    <tr><th>Tipo A</th><td>0,3 a 1,65 ml</td><td>0 a -100 daPa</td></tr>
    <tr><th>Tipo As ou Ar</th><td>&lt; 0,3 ml</td><td>0 a -100 daPa</td></tr>
    <tr><th>Tipo Ad</th><td>&gt; 1,65 ml</td><td>0 a -100 daPa</td></tr>
    <tr><th>Tipo B</th><td>Ausência de mobilidade</td><td>Não apresenta pico</td></tr>
    <tr><th>Tipo C</th><td>Pico deslocado para pressão negativa</td><td>&lt; -100 daPa</td></tr>
  </tbody>
</table>

<h2>Conclusão Clínica</h2>
<div class="conclusao">{conclusao or "—"}</div>

{"<p style='margin-top:8px; font-size:10px; color:#888;'><strong>Observações:</strong> " + obs + "</p>" if obs != "—" else ""}

<div class="assinatura">
  <div class="linha"></div>
  <div><strong>{nm_usuario}</strong></div>
  {f"<div style='font-size:10px; color:#555;'>{nr_conselho}</div>" if nr_conselho else ""}
  <div style="font-size:10px; color:#888;">Fonoaudiólogo(a) responsável</div>
</div>

</body>
</html>
"""


# ── Entrada pública ───────────────────────────────────────────────────────────

def gerar_pdf_imitanciometria(exame: "Exame", nm_usuario: str, nr_conselho: str) -> bytes:
    from weasyprint import HTML
    html = _html(exame, nm_usuario, nr_conselho)
    return HTML(string=html).write_pdf()
