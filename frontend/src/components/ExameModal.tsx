import { Modal } from 'antd'
import AudiometriaPage from '@/pages/Audiometria/AudiometriaPage'
import ImitanciometriaPage from '@/pages/Imitanciometria/ImitanciometriaPage'

export type TipoExame = 'audiometria' | 'imitanciometria'

interface ExameModalProps {
  open: boolean
  tipo: TipoExame | null
  nmPaciente: string | null
  cdPaciente: number | null
  cdAtendimento: number | null
  onClose: () => void
}

const TITULO: Record<TipoExame, string> = {
  audiometria: 'Audiometria Tonal e Vocal',
  imitanciometria: 'Imitanciometria',
}

export default function ExameModal({
  open,
  tipo,
  nmPaciente,
  cdPaciente,
  cdAtendimento,
  onClose,
}: ExameModalProps) {
  if (!tipo) return null

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      title={
        <span>
          {TITULO[tipo]}
          {nmPaciente && (
            <span style={{ fontWeight: 400, color: '#555', marginLeft: 12, fontSize: 14 }}>
              — {nmPaciente}
              {cdAtendimento && (
                <span style={{ color: '#888', marginLeft: 8 }}>
                  (Atend. {cdAtendimento})
                </span>
              )}
            </span>
          )}
        </span>
      }
      width="95vw"
      style={{ top: 20 }}
      styles={{ body: { maxHeight: 'calc(100vh - 120px)', overflowY: 'auto', padding: '16px 24px' } }}
      destroyOnClose
    >
      {tipo === 'audiometria' && (
        <AudiometriaPage cdPaciente={cdPaciente} cdAtendimento={cdAtendimento} />
      )}
      {tipo === 'imitanciometria' && <ImitanciometriaPage />}
    </Modal>
  )
}
