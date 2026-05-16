import React from 'react';
import { Typography, Row, Col } from 'antd';
import dayjs from 'dayjs';
import { AREA_LABEL, Area } from './data/listas';

const { Title, Text } = Typography;

// ── helper especialidade/conselho ────────────────────────────────────────────
function formatEspecialidadeConselho(user: any): string {
  const especialidade = user?.nm_tip_presta || user?.ds_especialidade
  if (!especialidade) return '—'
  const isPsicopedagogo = especialidade.toUpperCase().includes('PSICOPEDAGO')
  if (isPsicopedagogo) return especialidade
  const codigoConselho = user?.ds_codigo_conselho || user?.nr_conselho
  if (!codigoConselho) return especialidade
  const nomeConselho = user?.ds_conselho || 'Conselho'
  return `${especialidade} / ${nomeConselho}: ${codigoConselho}`
}

export interface PTSPrintData {
  paciente: any;
  formValues: any;
  diagPrincipais: any[];
  diagnosticosArea: Record<Area, string | undefined>;
  grauArea: Record<Area, string | undefined>;
  diagTerapeuticos: any[];
  extTerapias: any[];
  conductaRows: any[];
  multidisciplinarRows: any[];
  instrumentoRows: any[];
  terapias: any[];
  objetivos: any;
  usuarioMe: any;
  fl_finalizado?: number;
}

interface Props {
  data: PTSPrintData;
}

const MAP_TIPO: Record<string, string> = {
  '01': 'Individual',
  '02': 'Dupla',
  '03': 'Grupo 3',
  '04': 'Grupo 4',
  '05': 'Grupo 5',
  '06': 'Grupo 6',
  '07': 'Grupo 7',
  '08': 'Grupo 8',
  '09': 'Grupo 9',
  '10': 'Grupo 10',
}

const MAP_PERIODICIDADE: Record<string, string> = {
  '1': 'Semanal',
  '2': 'Quinzenal',
  '3': 'Mensal',
  '4': 'Bimestral',
  '5': 'Trimestral',
  '6': 'Semestral',
  '7': 'Anual',
}

export default function PTSPrintView({ data }: Props) {
  const {
    paciente,
    formValues,
    diagPrincipais,
    diagnosticosArea,
    grauArea,
    diagTerapeuticos,
    extTerapias,
    conductaRows,
    multidisciplinarRows,
    instrumentoRows,
    terapias,
    objetivos,
    usuarioMe,
    fl_finalizado,
  } = data || {};

  const validDiagPrincipais = (diagPrincipais || []).filter(d => d?.diagnostico);
  const validDiagTerapeuticos = (diagTerapeuticos || []).filter(d => d?.diagnostico);
  const validExtTerapias = (extTerapias || []).filter(d => d?.diagnostico);
  const validConductaRows = (conductaRows || []).filter(d => d?.diagnostico);
  const validMultiRows = (multidisciplinarRows || []).filter(d => d?.diagnostico);
  const validInstruRows = (instrumentoRows || []).filter(d => d?.diagnostico);
  const validTerapias = (terapias || []).filter(t => t?.terapia);

  // Helper para seções
  const Section = ({ title, children }: { title: string, children: React.ReactNode }) => {
    if (!children) return null;
    return (
      <div style={{ marginBottom: 16 }}>
        <Title level={5} style={{ background: '#f0f0f0', padding: '4px 8px', borderLeft: '4px solid #667eea', margin: '0 0 8px 0', fontSize: 14 }}>
          {title}
        </Title>
        <div style={{ paddingLeft: 8 }}>
          {children}
        </div>
      </div>
    );
  };

  const areasKeys = Object.keys(AREA_LABEL) as Area[];
  const hasDiagArea = areasKeys.some(a => diagnosticosArea[a]);
  const hasGrauArea = areasKeys.some(a => grauArea[a]);

  const condicoes = [
    { key: 'cond_nao_se_aplica', label: 'Não se aplica' },
    { key: 'cond_nao_escuta', label: 'Não escuta' },
    { key: 'cond_nao_fala', label: 'Não Fala' },
    { key: 'cond_nao_enxerga', label: 'Não enxerga' },
    { key: 'cond_agitacao', label: 'Agitação Psicomotora' },
    { key: 'cond_agressividade', label: 'Agressividade' },
    { key: 'cond_nao_anda', label: 'Não Anda' },
    { key: 'cond_nao_fica_sozinho', label: 'Não consegue ficar sozinho na sala' },
    { key: 'cond_sem_ctrl_cervical', label: 'Não tem controle cervical' },
    { key: 'cond_sem_ctrl_tronco', label: 'Não tem controle do tronco' },
  ].filter(c => formValues?.[c.key]);

  const opmes = [
    { key: 'opme_nao_se_aplica', label: 'Não se aplica' },
    { key: 'opme_cadeira', label: 'Faz uso de cadeira de rodas' },
    { key: 'opme_bengala', label: 'Utiliza Bengala' },
    { key: 'opme_muleta', label: 'Utiliza Muleta' },
    { key: 'opme_andador', label: 'Utiliza Andador' },
    { key: 'opme_protese', label: 'Utiliza Prótese' },
    { key: 'opme_com_alta', label: 'Recursos de Comunicação Alternativa (alta)' },
    { key: 'opme_com_baixa', label: 'Recursos de Comunicação Alternativa (baixa)' },
    { key: 'opme_orteses', label: 'Usa Órteses' },
  ].filter(o => formValues?.[o.key]);

  const deficiencias = [
    { key: 'def_associada_visual', label: 'Visual' },
    { key: 'def_associada_intelectual', label: 'Intelectual' },
    { key: 'def_associada_fisica', label: 'Física' },
    { key: 'def_associada_auditiva', label: 'Auditiva' },
  ].filter(d => formValues?.[d.key]);

  const programas = [
    { key: 'prog_nao_se_aplica', label: 'Não se Aplica' },
    { key: 'prog_glaucoma', label: 'Glaucoma Congênito' },
    { key: 'prog_catarata', label: 'Catarata Congênita' },
    { key: 'prog_alem_olhar', label: 'Além do Olhar' },
    { key: 'prog_zika', label: 'ZIKA' },
    { key: 'prog_apoio_familiar', label: 'Apoio Familiar' },
    { key: 'prog_tea', label: 'TEA' },
    { key: 'prog_intervencao_precoce', label: 'Intervenção Precoce' },
    { key: 'prog_rop', label: 'ROP' },
    { key: 'prog_pronas_tea', label: 'PRONAS TEA' },
    { key: 'prog_pronas_doencas_raras', label: 'PRONAS Doenças Raras' },
  ].filter(p => formValues?.[p.key]);

  // Função para renderizar os objetivos por área
  const renderObjetivos = () => {
    if (!objetivos) return null;
    let hasAnyObj = false;
    const areas = Object.keys(objetivos);
    const content = areas.map(area => {
      const objArea = objetivos[area];
      const validAtual = (objArea?.atual || []).filter((o: any) => o.objetivo);
      const validAnterior = (objArea?.anterior || []).filter((o: any) => o.objetivo);
      
      const items = [];
      if (validAtual.length > 0) {
        items.push(
          <div key="atual" style={{ marginBottom: 4 }}>
            <strong>Objetivos Atuais:</strong>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {validAtual.map((o: any, i: number) => <li key={i} style={{ textTransform: 'uppercase' }}>{o.objetivo}</li>)}
            </ul>
          </div>
        );
      }
      
      if (validAnterior.length > 0) {
        items.push(
          <div key="anterior" style={{ marginBottom: 4 }}>
            <strong>Objetivos Anteriores:</strong>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {validAnterior.map((o: any, i: number) => (
                <li key={i} style={{ textTransform: 'uppercase' }}>
                  {o.objetivo} 
                  {o.status && ` - Status: ${o.status}`}
                  {o.motivo && ` - Motivo: ${o.motivo}`}
                </li>
              ))}
            </ul>
          </div>
        );
      }
      
      if (items.length > 0) {
        hasAnyObj = true;
        return (
          <div key={area} style={{ marginBottom: 12 }}>
            <Text strong style={{ textTransform: 'capitalize', color: '#667eea' }}>{area}</Text>
            {items}
          </div>
        );
      }
      return null;
    });

    return hasAnyObj ? content : null;
  };

  const objetivosContent = renderObjetivos();

  return (
    <div style={{ padding: 20, background: '#fff', color: '#000', position: 'relative', overflow: 'hidden' }}>
      {/* Marca d'água de Rascunho */}
      {fl_finalizado !== 1 && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%) rotate(-45deg)',
          fontSize: '120px',
          color: 'rgba(255, 0, 0, 0.1)',
          fontWeight: 'bold',
          zIndex: 0,
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
          userSelect: 'none',
          textTransform: 'uppercase',
          border: '15px solid rgba(255, 0, 0, 0.1)',
          padding: '20px 40px',
          borderRadius: '20px',
        }}>
          Rascunho
        </div>
      )}

      {/* Cabeçalho com logos FAV e CER IV */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        marginBottom: 24, 
        paddingBottom: 16,
        borderBottom: '3px solid #1e5aa8',
        position: 'relative', 
        zIndex: 1,
        minHeight: 80
      }}>
        {/* Logo FAV - Esquerda */}
        <div style={{ flex: '0 0 140px', textAlign: 'center' }}>
          <img src="/logo-fav.png" alt="FAV - CER IV" style={{ height: 70, objectFit: 'contain' }} />
        </div>

        {/* Título Central */}
        <div style={{ flex: 1, textAlign: 'center' }}>
          <Title level={2} style={{ margin: '0 0 4px 0', color: '#1e5aa8' }}>
            Projeto Terapêutico Singular
          </Title>
          <Title level={3} style={{ margin: 0, color: '#1e5aa8' }}>
            (PTS)
          </Title>
        </div>

        {/* Logo CER IV - Direita */}
        <div style={{ flex: '0 0 160px', textAlign: 'center' }}>
          <img src="/logo-ceriv.png" alt="Menina dos Olhos - CER IV" style={{ height: 100, objectFit: 'contain' }} />
        </div>
      </div>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Text strong>Paciente:</Text> {paciente?.nm_paciente || 'N/A'}<br/>
          {paciente?.cd_paciente && <><Text strong>Cód. Paciente:</Text> {paciente.cd_paciente}<br/></>}
          {paciente?.cd_atendimento && <><Text strong>Cód. Atend.:</Text> {paciente.cd_atendimento}</>}
        </Col>
        <Col span={12} style={{ textAlign: 'right' }}>
          <Text strong>Data:</Text> {dayjs().format('DD/MM/YYYY HH:mm:ss')}<br/>
          <Text strong>Prestador:</Text> {usuarioMe?.nm_usuario || '—'}<br/>
          <Text strong>Especialidade/Conselho:</Text> {formatEspecialidadeConselho(usuarioMe)}
        </Col>
      </Row>

      {hasGrauArea && (
        <Section title="Classificação do Grau de Deficiência">
          <Row gutter={[16, 8]}>
            {areasKeys.map(a => grauArea[a] ? (
              <Col span={12} key={a}>
                <Text strong>{AREA_LABEL[a]}:</Text> {grauArea[a]}
              </Col>
            ) : null)}
          </Row>
        </Section>
      )}

      {formValues.queixa_principal && (
        <Section title="Queixas Principais e Histórico">
          <Text style={{ whiteSpace: 'pre-wrap' }}>{formValues.queixa_principal}</Text>
        </Section>
      )}

      {deficiencias.length > 0 && (
        <Section title="Deficiência(s) Associada(s)">
          {deficiencias.map(d => d.label).join(', ')}
        </Section>
      )}

      {(condicoes.length > 0 || formValues.cond_outra) && (
        <Section title="Condições Gerais do Paciente">
          {condicoes.length > 0 && <div>{condicoes.map(c => c.label).join(', ')}</div>}
          {formValues.cond_outra && <div><strong>Outra Condição:</strong> {formValues.cond_outra}</div>}
        </Section>
      )}

      {(opmes.length > 0 || formValues.opme_outros) && (
        <Section title="Uso de OPME">
          {opmes.length > 0 && <div>{opmes.map(o => o.label).join(', ')}</div>}
          {formValues.opme_outros && <div><strong>Outros OPME:</strong> {formValues.opme_outros}</div>}
        </Section>
      )}

      {(validExtTerapias.length > 0 || formValues.ext_nao_realiza) && (
        <Section title="Terapias Externas (Fisio, Fono, Psic, Outros)">
          {formValues.ext_nao_realiza ? (
            <Text>Não Realiza</Text>
          ) : (
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {validExtTerapias.map((d, i) => <li key={i}>{d.diagnostico}</li>)}
            </ul>
          )}
        </Section>
      )}

      {objetivosContent && (
        <Section title="Plano de Metas e Objetivos por Especialidade">
          {objetivosContent}
        </Section>
      )}

      {formValues.observacoes_gerais && (
        <Section title="Observações Complementares">
          <Text style={{ whiteSpace: 'pre-wrap' }}>{formValues.observacoes_gerais}</Text>
        </Section>
      )}

      {formValues.intervencao_descricao && (
        <Section title="Intervenção">
          <Text style={{ whiteSpace: 'pre-wrap' }}>{formValues.intervencao_descricao}</Text>
        </Section>
      )}

      {formValues.intervencao_prazo && (
        <Section title="Prazo Estimado">
          <div><strong>Prazo estimado:</strong> {formValues.intervencao_prazo}</div>
        </Section>
      )}

      {validInstruRows.length > 0 && (
        <Section title="Instrumentos e Escalas de Avaliação">
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {validInstruRows.map((d, i) => <li key={i}>{d.diagnostico}</li>)}
          </ul>
        </Section>
      )}

      {validTerapias.length > 0 && (
        <Section title="Prescrição de Terapias Indicadas">
          {validTerapias.map((t, i) => (
            <div key={i} style={{ 
              marginBottom: 12, 
              padding: '8px', 
              border: '1px solid #eee', 
              borderRadius: '4px',
              breakInside: 'avoid'
            }}>
              <div><strong>Item:</strong> {t.terapia}</div>
              {t.tipo_atendimento && (
                <div><strong>Tipo de atendimento:</strong> {MAP_TIPO[t.tipo_atendimento] || t.tipo_atendimento}</div>
              )}
              {t.periodicidade && (
                <div><strong>Periodicidade:</strong> {MAP_PERIODICIDADE[t.periodicidade] || t.periodicidade}</div>
              )}
              {t.qtde_sessoes && (
                <div><strong>Qtd. Sessões:</strong> {t.qtde_sessoes} sessão(ões)</div>
              )}
            </div>
          ))}
        </Section>
      )}

      {/* Seção de Assinatura do Prestador */}
      <div style={{ marginTop: 60, borderTop: '2px solid #1e5aa8', paddingTop: 32, pageBreakInside: 'avoid' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <Title level={4} style={{ margin: '0 0 20px 0', color: '#1e5aa8' }}>Informações do Prestador</Title>
          
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col span={24}>
              <div style={{ textAlign: 'left', borderLeft: '3px solid #1e5aa8', paddingLeft: 16 }}>
                <div style={{ marginBottom: 8 }}>
                  <Text strong>Prestador:</Text> {usuarioMe?.nm_usuario || '—'}
                </div>
                <div>
                  <Text strong>Especialidade/Conselho:</Text> {formatEspecialidadeConselho(usuarioMe)}
                </div>
              </div>
            </Col>
          </Row>

          <div style={{ marginTop: 40, minHeight: 80 }}>
            <div style={{ borderTop: '1px solid #333', width: '60%', margin: '0 auto 8px' }}></div>
            <Text strong style={{ fontSize: 12 }}>Assinatura do Prestador</Text>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 40, borderTop: '1px solid #ccc', paddingTop: 16, textAlign: 'center', fontSize: 12, color: '#666' }}>
        <strong>LGPD — Lei Geral de Proteção de Dados</strong><br />
        Documento com dados sensíveis coletados para fins de assistência médica e terapêutica.<br />
        Entregue e sob a guarda do paciente e/ou responsável legal. Em conformidade com a LGPD.
      </div>
    </div>
  );
}
