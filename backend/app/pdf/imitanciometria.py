"""Gera laudo em PDF para exame de imitanciometria usando matplotlib + WeasyPrint."""
from __future__ import annotations

import base64
import io
import math
import os
from datetime import datetime, date
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.db.models import Exame


# ── Logos institucionais (base64 inline para WeasyPrint) ─────────────────────

def _logo_b64(nome: str) -> str:
    """Lê uma logo da pasta assets/ (dentro do backend) e retorna base64."""
    path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "assets", nome)
    if not os.path.exists(path):
        return ""
    with open(path, "rb") as f:
        return base64.b64encode(f.read()).decode()


# ── Timpanograma ──────────────────────────────────────────────────────────────

def _timpanograma_base64(resultado) -> str:
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    import numpy as np

    fig, ax = plt.subplots(figsize=(7, 2.8))
    pressures = np.linspace(-600, 400, 500)

    def asym_profile(p, mu, sL, sR, betaL, betaR):
        d = abs(p - mu)
        if p <= mu:
            return math.exp(-((d / sL) ** betaL))
        return math.exp(-((d / sR) ** betaR))

    def generate_curve(tipo, pressao, complacencia, ecv):
        if not tipo:
            return None, None
            
        baseline = float(ecv) if ecv is not None else 0.2
        comp = float(complacencia) if complacencia is not None else 0.8
        pres = float(pressao) if pressao is not None else -20
        
        if tipo == 'A':
            amplitude = max(comp - baseline, 0.05)
            mu, sL, sR, betaL, betaR = pres, 125, 34, 1.55, 1.7
        elif tipo in ('As', 'Ar'):
            amplitude = max(comp - baseline, 0.05)
            mu, sL, sR, betaL, betaR = pres, 120, 34, 1.6, 1.75
        elif tipo == 'Ad':
            amplitude = max(comp - baseline, 1.0)
            mu, sL, sR, betaL, betaR = pres, 16, 12, 1.45, 1.6
        elif tipo == 'B':
            comp_b = float(complacencia) if complacencia is not None else 0.1
            amplitude = max(comp_b - baseline, 0.02)
            pres_b = float(pressao) if pressao is not None else 0
            mu, sL, sR, betaL, betaR = pres_b, 300, 300, 2.0, 2.0
        elif tipo == 'C':
            comp_c = float(complacencia) if complacencia is not None else 0.9
            amplitude = max(comp_c - baseline, 0.05)
            pres_c = float(pressao) if pressao is not None else -180
            mu, sL, sR, betaL, betaR = pres_c, 60, 110, 1.7, 1.45
        else:
            return None, None
            
        curve = [baseline + amplitude * asym_profile(p, mu, sL, sR, betaL, betaR) for p in pressures]
        curve_peak = baseline + amplitude
        return curve, curve_peak

    od_curve_data = generate_curve(resultado.od_tipo_curva, resultado.od_pressao, resultado.od_pico, resultado.od_ecv)
    oe_curve_data = generate_curve(resultado.oe_tipo_curva, resultado.oe_pressao, resultado.oe_pico, resultado.oe_ecv)

    od_curve = od_curve_data[0] if od_curve_data else None
    od_curve_peak = od_curve_data[1] if od_curve_data else None
    oe_curve = oe_curve_data[0] if oe_curve_data else None
    oe_curve_peak = oe_curve_data[1] if oe_curve_data else None

    def draw_peak_marker(tipo, peak_p, curve_peak_c, real_c, color: str, label: str, y_offset: float) -> None:
        if peak_p is None or curve_peak_c is None or tipo == 'B':
            return
        x = float(peak_p)
        y = float(curve_peak_c)
        label_y = float(real_c) if real_c is not None else y
        ax.scatter([x], [y], s=36, color=color, edgecolor="white", linewidth=1.0, zorder=6)
        ax.annotate(
            f"{label}: {x:.0f} daPa | {label_y:.2f} ml",
            xy=(x, y),
            xytext=(x + 12, y + y_offset),
            textcoords="data",
            fontsize=8,
            color=color,
            ha="left",
            va="bottom",
            arrowprops={"arrowstyle": "-", "color": color, "lw": 0.8, "alpha": 0.7},
        )

    all_values = []
    if od_curve is not None:
        ax.plot(pressures, od_curve, color="#e74c3c", linewidth=2, label="OD — Orelha Direita")
        if resultado.od_tipo_curva != 'B' and resultado.od_pressao is not None:
            ax.axvline(float(resultado.od_pressao), color="#e74c3c", linestyle=":", linewidth=0.8, alpha=0.6)
            draw_peak_marker(resultado.od_tipo_curva, resultado.od_pressao, od_curve_peak, resultado.od_pico, "#e74c3c", "OD", y_offset=0.06)
        all_values.extend(od_curve)

    if oe_curve is not None:
        ax.plot(pressures, oe_curve, color="#2980b9", linewidth=2, label="OE — Orelha Esquerda")
        if resultado.oe_tipo_curva != 'B' and resultado.oe_pressao is not None:
            ax.axvline(float(resultado.oe_pressao), color="#2980b9", linestyle=":", linewidth=0.8, alpha=0.6)
            draw_peak_marker(resultado.oe_tipo_curva, resultado.oe_pressao, oe_curve_peak, resultado.oe_pico, "#2980b9", "OE", y_offset=0.12)
        all_values.extend(oe_curve)

    if od_curve is None and oe_curve is None:
        ax.text(
            0.5, 0.5, "Sem dados de timpanograma",
            transform=ax.transAxes, ha="center", va="center", color="#aaa", fontsize=11,
        )

    y_min = 0.0
    if all_values:
        min_val = min(all_values)
        y_min = max(0.0, math.floor(min_val * 10) / 10.0 - 0.1)

    ax.set_xlabel("Pressão (daPa)", fontsize=9)
    ax.set_ylabel("Complacência (ml)", fontsize=9)
    ax.set_title("Timpanograma", fontsize=11, fontweight="bold", pad=10)
    ax.set_xlim(-600, 400)
    ax.set_ylim(bottom=y_min)
    ax.axvline(0, color="#888", linestyle="--", linewidth=0.6, alpha=0.5)
    ax.grid(True, alpha=0.2)

    buf = io.BytesIO()
    fig.savefig(buf, format="png", dpi=110, bbox_inches="tight")
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

def _html(exame: "Exame", nm_usuario: str, nr_conselho: str, ds_especialidade: str = "") -> str:
    r = exame.resultado_imitan
    img_b64 = _timpanograma_base64(r)
    logo_fav   = _logo_b64("logo-fav.png")
    logo_ceriv = _logo_b64("logo-ceriv.png")
    dt = exame.dt_exame
    dt_data_str = dt.strftime("%d/%m/%Y") if isinstance(dt, datetime) else str(dt)[:10]
    dt_hora_str = dt.strftime("%H:%M") if isinstance(dt, datetime) else "—"

    dt_nasc_raw = getattr(exame, "dt_nascimento_paciente", None)
    if dt_nasc_raw is not None:
        dt_nasc_str = dt_nasc_raw.strftime("%d/%m/%Y") if hasattr(dt_nasc_raw, "strftime") else str(dt_nasc_raw)[:10]
        _ref = dt.date() if isinstance(dt, datetime) else date.today()
        _nasc = dt_nasc_raw.date() if hasattr(dt_nasc_raw, "date") else dt_nasc_raw
        _idade = _ref.year - _nasc.year - ((_ref.month, _ref.day) < (_nasc.month, _nasc.day))
        idade_str = f"{_idade} anos"
    else:
        dt_nasc_str = "—"
        idade_str = "—"

    obs = exame.ds_observacoes or "—"
    queixa = exame.ds_queixa_principal or ""
    conclusao = (r.ds_conclusao or "").replace("\n", "<br>")

    tipo_od = r.od_tipo_curva or "—"
    tipo_oe = r.oe_tipo_curva or "—"

    return f"""
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<style>
  @page {{ size: A4; margin: 12mm 14mm; }}
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  body {{ font-family: Arial, sans-serif; font-size: 9px; color: #222; }}
  h1 {{ font-size: 13px; color: #1e5aa8; text-transform: uppercase; margin: 0; }}
  h2 {{ font-size: 10px; color: #4c2c8a; margin: 6px 0 3px; border-bottom: 1px solid #ddd; padding-bottom: 2px; }}
  .inst-header {{ border: 1px solid #1e5aa8; border-radius: 6px; margin-bottom: 10px; }}
  .inst-header-top {{ display: flex; align-items: center; justify-content: space-between; padding: 6px 12px; border-bottom: 1px solid #1e5aa8; min-height: 48px; }}
  .inst-header-logo {{ flex: 0 0 95px; }}
  .inst-header-logo img {{ height: 32px; object-fit: contain; }}
  .inst-header-logo-right img {{ height: 40px; object-fit: contain; }}
  .inst-header-title {{ flex: 1; text-align: center; }}
  .inst-header-data {{ display: flex; gap: 16px; padding: 8px 12px; font-size: 9px; line-height: 1.55; }}
  .inst-header-data-left {{ flex: 3; display: flex; flex-direction: column; gap: 1px; }}
  .inst-header-data-right {{ flex: 2; display: flex; flex-direction: column; gap: 1px; text-align: left; }}
  .inst-header-data strong {{ font-weight: bold; }}
  .nm-paciente {{ font-size: 11px; font-weight: bold; color: #1e5aa8; text-transform: uppercase; margin-bottom: 2px; }}
  table {{ width: 100%; border-collapse: collapse; margin: 3px 0; font-size: 9px; }}
  th, td {{ border: 1px solid #ccc; padding: 2px 4px; text-align: center; }}
  th {{ background: #f0eaff; font-weight: bold; }}
  .freq-header th {{ background: #4c2c8a; color: white; }}
  .chart {{ text-align: center; margin: 4px 0; }}
  .chart img {{ max-width: 100%; height: auto; }}
  .reflexos-row {{ display: flex; gap: 8px; }}
  .reflexos-row > div {{ flex: 1; }}
  .conclusao {{ background: #fafafa; border: 1px solid #ddd; padding: 4px 8px; border-radius: 3px; line-height: 1.4; min-height: 28px; font-size: 9px; }}
  .assinatura {{ margin-top: 48px; text-align: center; }}
  .assinatura .linha {{ border-top: 1px solid #333; width: 200px; margin: 0 auto 3px; }}
  .tag {{ display: inline-block; padding: 1px 6px; border-radius: 8px; font-size: 9px; font-weight: bold; }}
  .tag-od {{ background: #fde8e8; color: #c0392b; }}
  .tag-oe {{ background: #e8f0fd; color: #1a5276; }}
  .np {{ color: #aaa; font-style: italic; }}
  .badge-rascunho {{ color: #e67e22; font-weight: bold; }}
  .badge-finalizado {{ color: #27ae60; font-weight: bold; }}
  .queixa-principal {{ margin-bottom: 12px; font-size: 9px; line-height: 1.4; padding: 6px 10px; background: #fff8e6; border: 1px solid #fae3b0; border-radius: 4px; }}
</style>
</head>
<body>

<!-- Cabeçalho institucional FAV / CER IV -->
<div class="inst-header">
  <div class="inst-header-top">
    <div class="inst-header-logo">
      {f'<img src="data:image/png;base64,{logo_fav}" alt="FAV - CER IV">' if logo_fav else '<span style="font-weight:bold;color:#1e5aa8;">FAV</span>'}
    </div>
    <div class="inst-header-title">
      <h1>Laudo de Imitanciometria</h1>
    </div>
    <div class="inst-header-logo inst-header-logo-right" style="text-align:right;">
      {f'<img src="data:image/png;base64,{logo_ceriv}" alt="Menina dos Olhos - CER IV">' if logo_ceriv else '<span style="font-weight:bold;color:#1e5aa8;">CER IV</span>'}
    </div>
  </div>
  <div class="inst-header-data">
    <div class="inst-header-data-left">
      <div class="nm-paciente">{getattr(exame, 'nm_paciente', None) or f'Cód. {exame.id_paciente}'}</div>
      <div><strong>Nascimento:</strong> {dt_nasc_str} &nbsp;|&nbsp; <strong>Idade:</strong> {idade_str}</div>
      <div><strong>Cód. Paciente:</strong> {exame.id_paciente}</div>
    </div>
    <div class="inst-header-data-right">
      <div><strong>Atendimento:</strong> {exame.id_atendimento or '—'}</div>
      <div><strong>Data:</strong> {dt_data_str}</div>
      <div><strong>Hora:</strong> {dt_hora_str}</div>
      <div><strong>Status:</strong> <span class="{'badge-finalizado' if exame.ds_status == 'FINALIZADO' else 'badge-rascunho'}">{exame.ds_status}</span></div>
    </div>
  </div>
  {f"<div style='padding: 4px 12px 8px; border-top: 1px dashed #ccc; font-size: 9px; line-height: 1.4; color: #444; margin: 0 4px;'><strong>Queixa Principal:</strong> {queixa.replace(chr(10), '<br>')}</div>" if queixa else ""}
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

<h2>Reflexos Estapedianos</h2>
<div class="reflexos-row">
  <div>
    <div style="font-weight:bold; color:#c0392b; margin-bottom:2px; font-size:9px;">OD — Orelha Direita (sonda OD)</div>
    <table>
      <thead>
        <tr class="freq-header"><th>Modalidade</th><th>500 Hz</th><th>1000 Hz</th><th>2000 Hz</th><th>4000 Hz</th></tr>
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
  </div>
  <div>
    <div style="font-weight:bold; color:#1a5276; margin-bottom:2px; font-size:9px;">OE — Orelha Esquerda (sonda OE)</div>
    <table>
      <thead>
        <tr class="freq-header"><th>Modalidade</th><th>500 Hz</th><th>1000 Hz</th><th>2000 Hz</th><th>4000 Hz</th></tr>
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
  </div>
</div>

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
  {f"<div style='font-size:10px; color:#888;'>{ds_especialidade}</div>" if ds_especialidade else "<div style='font-size:10px; color:#888;'>Responsável pelo exame</div>"}
</div>

</body>
</html>
"""


# ── Entrada pública ───────────────────────────────────────────────────────────

def gerar_pdf_imitanciometria(exame: "Exame", nm_usuario: str, nr_conselho: str, ds_especialidade: str = "") -> bytes:
    from weasyprint import HTML
    html = _html(exame, nm_usuario, nr_conselho, ds_especialidade)
    return HTML(string=html).write_pdf()
