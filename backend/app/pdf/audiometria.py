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

def _audiograma_base64(resultado, exame=None) -> str:
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    import matplotlib.ticker as ticker

    fig, (ax_od, ax_oe) = plt.subplots(1, 2, figsize=(13, 5))
    fig.suptitle("Audiograma Tonal", fontsize=11, fontweight="bold")

    freqs_va = [250, 500, 1000, 2000, 3000, 4000, 6000, 8000]
    freqs_vo = [500, 1000, 2000, 4000]
    x_va = list(range(len(freqs_va)))
    x_vo = [freqs_va.index(f) for f in freqs_vo]
    xlabels = ["250", "500", "1k", "2k", "3k", "4k", "6k", "8k"]

    def _get(obj, field):
        v = getattr(obj, field, None)
        return float(v) if v is not None else None

    r = resultado
    mask_od_va  = bool(getattr(r, "od_mask_va",  None))
    mask_oe_va  = bool(getattr(r, "oe_mask_va",  None))
    mask_od_vo  = bool(getattr(r, "od_mask_vo",  None))
    mask_oe_vo  = bool(getattr(r, "oe_mask_vo",  None))
    nr_od_va    = bool(getattr(r, "od_va_nr",    0))
    nr_oe_va    = bool(getattr(r, "oe_va_nr",    0))
    nr_od_vo    = bool(getattr(r, "od_vo_nr",    0))
    nr_oe_vo    = bool(getattr(r, "oe_vo_nr",    0))

    od_va_marker = "^"   if mask_od_va else "o"
    oe_va_marker = "s"   if mask_oe_va else "x"
    od_vo_marker = "$[$" if mask_od_vo else "<"
    oe_vo_marker = "$]$" if mask_oe_vo else ">"

    def _plot_line(ax, vals, xs, color, marker, label, connect=True):
        pts = [(x, y) for x, y in zip(xs, vals) if y is not None]
        if not pts:
            return
        xs_p, ys_p = zip(*pts)
        lw = 1.8 if connect else 0
        ax.plot(xs_p, ys_p, linestyle="-", color=color, label=label,
                marker=marker, markersize=8, markeredgewidth=2.2,
                linewidth=lw, markerfacecolor="white" if marker not in ("x", "<", ">") else color)

    def _plot_nr(ax, xs_all, nr_flag, color):
        if not nr_flag:
            return
        for x in xs_all:
            ax.annotate("", xy=(x, 118), xytext=(x, 108),
                        arrowprops=dict(arrowstyle="-|>", color=color, lw=2))

    def _configure_ax(ax, title, color, show_ylabel=True):
        ax.set_xticks(x_va)
        ax.set_xticklabels(xlabels, fontsize=8)
        ax.set_ylim(125, -10)
        ax.set_yticks(range(-10, 130, 10))
        ax.yaxis.set_minor_locator(ticker.MultipleLocator(5))
        ax.tick_params(axis="y", labelsize=8)
        if show_ylabel:
            ax.set_ylabel("dB HL", fontsize=9)
        ax.set_xlabel("Frequência (Hz)", fontsize=9)
        ax.set_title(title, fontsize=10, fontweight="bold", color=color, pad=8)
        ax.axhline(25, color="#aaa", linestyle="--", linewidth=0.8)
        ax.grid(True, which="major", alpha=0.25)
        ax.set_xlim(-0.5, 7.5)
        ax.legend(fontsize=7, loc="lower right")

    # ── Ouvido Direito (ax_od) ─────────────────────────────────────────────
    od_va = [_get(r, f"od_va_{f}") for f in freqs_va]
    _plot_line(ax_od, od_va, x_va, "#e74c3c", od_va_marker,
               f"VA {'(△ mascarado)' if mask_od_va else '(O)'}")
    _plot_nr(ax_od, x_va, nr_od_va, "#e74c3c")

    od_vo = [_get(r, f"od_vo_{f}") for f in freqs_vo]
    _plot_line(ax_od, od_vo, x_vo, "#e74c3c", od_vo_marker,
               f"VO {'([)' if mask_od_vo else '(<)'}",
               connect=False)
    _plot_nr(ax_od, x_vo, nr_od_vo, "#e74c3c")
    _configure_ax(ax_od, "Ouvido Direito", "#e74c3c", show_ylabel=True)

    # ── Ouvido Esquerdo (ax_oe) ────────────────────────────────────────────
    oe_va = [_get(r, f"oe_va_{f}") for f in freqs_va]
    _plot_line(ax_oe, oe_va, x_va, "#2980b9", oe_va_marker,
               f"VA {'(□ mascarado)' if mask_oe_va else '(X)'}")
    _plot_nr(ax_oe, x_va, nr_oe_va, "#2980b9")

    oe_vo = [_get(r, f"oe_vo_{f}") for f in freqs_vo]
    _plot_line(ax_oe, oe_vo, x_vo, "#2980b9", oe_vo_marker,
               f"VO {'(])' if mask_oe_vo else '(>)'}",
               connect=False)
    _plot_nr(ax_oe, x_vo, nr_oe_vo, "#2980b9")
    _configure_ax(ax_oe, "Ouvido Esquerdo", "#2980b9", show_ylabel=False)

    fig.tight_layout()
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
    img_b64 = _audiograma_base64(r, exame)
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
      <th rowspan="2">Orelha</th>
      <th rowspan="2">LRF (dBHL)</th>
      <th rowspan="2">SDT (dBHL)</th>
      <th colspan="2">IPRF MON</th>
      <th colspan="2">IPRF DIS</th>
      <th colspan="2">IPRF TRI</th>
    </tr>
    <tr class="freq-header">
      <th>%</th><th>dBHL</th>
      <th>%</th><th>dBHL</th>
      <th>%</th><th>dBHL</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th><span class="tag tag-od">OD</span></th>
      <td>{_fmt(r.od_lrf)}</td>
      <td>{_fmt(getattr(r,'od_sdt',None))}</td>
      <td>{_fmt(r.od_iprf_mon)}</td>
      <td>{_fmt(r.od_iprf_int)}</td>
      <td>{_fmt(getattr(r,'od_iprf_dis',None))}</td>
      <td>{_fmt(getattr(r,'od_iprf_dis_db',None))}</td>
      <td>{_fmt(getattr(r,'od_iprf_tri',None))}</td>
      <td>{_fmt(getattr(r,'od_iprf_tri_db',None))}</td>
    </tr>
    <tr>
      <th><span class="tag tag-oe">OE</span></th>
      <td>{_fmt(r.oe_lrf)}</td>
      <td>{_fmt(getattr(r,'oe_sdt',None))}</td>
      <td>{_fmt(r.oe_iprf_mon)}</td>
      <td>{_fmt(r.oe_iprf_int)}</td>
      <td>{_fmt(getattr(r,'oe_iprf_dis',None))}</td>
      <td>{_fmt(getattr(r,'oe_iprf_dis_db',None))}</td>
      <td>{_fmt(getattr(r,'oe_iprf_tri',None))}</td>
      <td>{_fmt(getattr(r,'oe_iprf_tri_db',None))}</td>
    </tr>
  </tbody>
</table>

<h2>Mascaramento (dB NB)</h2>
<table>
  <thead>
    <tr class="freq-header">
      <th>Via</th>
      <th>OD — até</th>
      <th>OE — até</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th>VA</th>
      <td>{_fmt(getattr(r,'od_mask_va',None))}</td>
      <td>{_fmt(getattr(r,'oe_mask_va',None))}</td>
    </tr>
    <tr>
      <th>VO</th>
      <td>{_fmt(getattr(r,'od_mask_vo',None))}</td>
      <td>{_fmt(getattr(r,'oe_mask_vo',None))}</td>
    </tr>
    <tr>
      <th>LRF</th>
      <td>{_fmt(getattr(r,'od_mask_lrf',None))}</td>
      <td>{_fmt(getattr(r,'oe_mask_lrf',None))}</td>
    </tr>
    <tr>
      <th>IPRF</th>
      <td>{_fmt(getattr(r,'od_mask_iprf',None))}</td>
      <td>{_fmt(getattr(r,'oe_mask_iprf',None))}</td>
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
<p style="font-size:9px; color:#666; margin-top:4px;">
  Referência: Classificação de acordo com a Organização Mundial de Saúde, 2021 — média quadritonal.
</p>

<h2>Conclusão Clínica</h2>
<div class="conclusao">{conclusao or "—"}</div>

{"<h2>Comentários / Observações</h2><div class='conclusao'>" + obs.replace(chr(10), '<br>') + "</div>" if obs != "—" else ""}

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
