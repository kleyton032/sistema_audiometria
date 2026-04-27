# app/pdf/audiometria.py
"""Gera laudo em PDF para exame de audiometria usando matplotlib + WeasyPrint."""
from __future__ import annotations

import base64
import io
from datetime import datetime
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.db.models import Exame


# ── Audiograma ────────────────────────────────────────────────────────────────

def _audiograma_base64(resultado) -> str:
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    import matplotlib.ticker as ticker
    fig, ax = plt.subplots(figsize=(9, 5))

    freqs_va = [250, 500, 1000, 2000, 3000, 4000, 6000, 8000]
    freqs_vo = [500, 1000, 2000, 4000]
    x_va = list(range(len(freqs_va)))
    x_vo = [freqs_va.index(f) for f in freqs_vo]

    def _get(obj, field):
        v = getattr(obj, field, None)
        return float(v) if v is not None else None

    # --- Via aérea OD (círculo vermelho)
    od_va = [_get(resultado, f"od_va_{f}") for f in freqs_va]
    pts = [(x, y) for x, y in zip(x_va, od_va) if y is not None]
    if pts:
        xs, ys = zip(*pts)
        ax.plot(xs, ys, "o-", color="#e74c3c", label="OD — via aérea", markersize=7, linewidth=1.5)

    # --- Via aérea OE (× azul)
    oe_va = [_get(resultado, f"oe_va_{f}") for f in freqs_va]
    pts = [(x, y) for x, y in zip(x_va, oe_va) if y is not None]
    if pts:
        xs, ys = zip(*pts)
        ax.plot(xs, ys, "x-", color="#2980b9", label="OE — via aérea",
                markersize=8, markeredgewidth=2, linewidth=1.5)

    # --- Via óssea OD (< vermelho tracejado)
    od_vo = [_get(resultado, f"od_vo_{f}") for f in freqs_vo]
    pts = [(x, y) for x, y in zip(x_vo, od_vo) if y is not None]
    if pts:
        xs, ys = zip(*pts)
        ax.plot(xs, ys, "<--", color="#e74c3c", label="OD — via óssea",
                markersize=7, linewidth=1.2, linestyle="dashed")

    # --- Via óssea OE (> azul tracejado)
    oe_vo = [_get(resultado, f"oe_vo_{f}") for f in freqs_vo]
    pts = [(x, y) for x, y in zip(x_vo, oe_vo) if y is not None]
    if pts:
        xs, ys = zip(*pts)
        ax.plot(xs, ys, ">--", color="#2980b9", label="OE — via óssea",
                markersize=7, linewidth=1.2, linestyle="dashed")

    # Configuração dos eixos
    ax.set_xticks(x_va)
    ax.set_xticklabels(["250", "500", "1k", "2k", "3k", "4k", "6k", "8k"], fontsize=9)
    ax.set_ylim(125, -10)
    ax.set_yticks(range(-10, 130, 10))
    ax.yaxis.set_minor_locator(ticker.MultipleLocator(5))
    ax.set_ylabel("dB HL", fontsize=9)
    ax.set_xlabel("Frequência (Hz)", fontsize=9)
    ax.set_title("Audiograma Tonal", fontsize=11, fontweight="bold", pad=10)
    ax.axhline(25, color="#aaa", linestyle="--", linewidth=0.8, label="Limite normal (25 dBHL)")
    ax.grid(True, which="major", alpha=0.25)
    ax.legend(fontsize=7, loc="lower right")
    ax.set_xlim(-0.5, 7.5)

    buf = io.BytesIO()
    fig.savefig(buf, format="png", dpi=130, bbox_inches="tight")
    plt.close(fig)
    buf.seek(0)
    return base64.b64encode(buf.read()).decode()


# ── Template HTML ─────────────────────────────────────────────────────────────

def _fmt(v) -> str:
    if v is None:
        return "—"
    return str(int(float(v))) if float(v) == int(float(v)) else f"{float(v):.1f}"


def _html(exame: "Exame", nm_usuario: str, nr_conselho: str) -> str:
    r = exame.resultado_audio
    img_b64 = _audiograma_base64(r)
    dt = exame.dt_exame
    dt_str = dt.strftime("%d/%m/%Y às %H:%M") if isinstance(dt, datetime) else str(dt)

    queixa = exame.ds_queixa_principal or "Não informada"
    cae_od = "Obstruído" if exame.fl_cae_od_obstruido else "Livre"
    cae_oe = "Obstruído" if exame.fl_cae_oe_obstruido else "Livre"
    obs = exame.ds_observacoes or "—"

    conclusao = (r.ds_conclusao or "").replace("\n", "<br>")
    class_od = r.ds_class_od or "—"
    class_oe = r.ds_class_oe or "—"
    tipo_od = r.ds_tipo_od or "—"
    tipo_oe = r.ds_tipo_oe or "—"
    media_od = _fmt(r.nr_media_od)
    media_oe = _fmt(r.nr_media_oe)

    def row_va(label, *fields):
        cells = "".join(f"<td>{_fmt(getattr(r, f))}</td>" for f in fields)
        return f"<tr><th>{label}</th>{cells}</tr>"

    def row_vo(label, *fields):
        cells = "".join(f"<td>{_fmt(getattr(r, f))}</td>" for f in fields)
        return f"<tr><th>{label}</th><td>—</td>{cells}</tr>"

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
  .audiogram {{ text-align: center; margin: 10px 0; }}
  .audiogram img {{ max-width: 100%; height: auto; }}
  .conclusao {{ background: #fafafa; border: 1px solid #ddd; padding: 10px 14px; border-radius: 4px; line-height: 1.6; min-height: 50px; }}
  .assinatura {{ margin-top: 32px; text-align: center; }}
  .assinatura .linha {{ border-top: 1px solid #333; width: 250px; margin: 0 auto 4px; }}
  .tag {{ display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: bold; }}
  .tag-od {{ background: #fde8e8; color: #c0392b; }}
  .tag-oe {{ background: #e8f0fd; color: #1a5276; }}
  .badge-rascunho {{ color: #e67e22; font-weight: bold; }}
  .badge-finalizado {{ color: #27ae60; font-weight: bold; }}
</style>
</head>
<body>

<div class="header">
  <div>
    <h1>Laudo de Audiometria Tonal e Vocal</h1>
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
  <div class="info-item"><span>Queixa principal:</span> {queixa}</div>
  <div class="info-item"><span>Conselho:</span> {nr_conselho or "—"}</div>
  <div class="info-item"><span>CAE OD:</span> {cae_od}</div>
  <div class="info-item"><span>CAE OE:</span> {cae_oe}</div>
</div>

<h2>Audiograma Tonal</h2>
<div class="audiogram">
  <img src="data:image/png;base64,{img_b64}" alt="Audiograma">
</div>

<h2>Limiares Auditivos (dB HL)</h2>
<table>
  <thead>
    <tr class="freq-header">
      <th>Via</th>
      <th>250 Hz</th><th>500 Hz</th><th>1000 Hz</th><th>2000 Hz</th>
      <th>3000 Hz</th><th>4000 Hz</th><th>6000 Hz</th><th>8000 Hz</th>
    </tr>
  </thead>
  <tbody>
    <tr><td colspan="9" style="background:#fff3f3; font-weight:bold; text-align:left; padding-left:8px;">
      <span class="tag tag-od">OD — Orelha Direita</span></td></tr>
    {row_va("Aérea", "od_va_250","od_va_500","od_va_1000","od_va_2000","od_va_3000","od_va_4000","od_va_6000","od_va_8000")}
    {row_vo("Óssea", "od_vo_500","od_vo_1000","od_vo_2000","od_vo_4000")}
    <tr><td colspan="9" style="background:#f0f5ff; font-weight:bold; text-align:left; padding-left:8px;">
      <span class="tag tag-oe">OE — Orelha Esquerda</span></td></tr>
    {row_va("Aérea", "oe_va_250","oe_va_500","oe_va_1000","oe_va_2000","oe_va_3000","oe_va_4000","oe_va_6000","oe_va_8000")}
    {row_vo("Óssea", "oe_vo_500","oe_vo_1000","oe_vo_2000","oe_vo_4000")}
  </tbody>
</table>

<h2>Logoaudiometria</h2>
<table>
  <thead>
    <tr class="freq-header">
      <th>Orelha</th>
      <th>LRF (dBHL)</th>
      <th>IPRF (%)</th>
      <th>Intensidade IPRF (dBHL)</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th><span class="tag tag-od">OD</span></th>
      <td>{_fmt(r.od_lrf)}</td>
      <td>{_fmt(r.od_iprf_mon)}</td>
      <td>{_fmt(r.od_iprf_int)}</td>
    </tr>
    <tr>
      <th><span class="tag tag-oe">OE</span></th>
      <td>{_fmt(r.oe_lrf)}</td>
      <td>{_fmt(r.oe_iprf_mon)}</td>
      <td>{_fmt(r.oe_iprf_int)}</td>
    </tr>
  </tbody>
</table>

<h2>Classificação Audiológica</h2>
<table>
  <thead>
    <tr class="freq-header">
      <th>Orelha</th><th>PTA (dBHL)</th><th>Grau de Perda</th><th>Tipo de Perda</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th><span class="tag tag-od">OD</span></th>
      <td>{media_od}</td>
      <td>{class_od}</td>
      <td>{tipo_od}</td>
    </tr>
    <tr>
      <th><span class="tag tag-oe">OE</span></th>
      <td>{media_oe}</td>
      <td>{class_oe}</td>
      <td>{tipo_oe}</td>
    </tr>
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

def gerar_pdf_audiometria(exame: "Exame", nm_usuario: str, nr_conselho: str) -> bytes:
    from weasyprint import HTML
    html = _html(exame, nm_usuario, nr_conselho)
    return HTML(string=html).write_pdf()
