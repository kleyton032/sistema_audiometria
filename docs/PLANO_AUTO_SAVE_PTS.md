# Plano de Implementação — Rascunho Local (localStorage) para PTS Novo

## Contexto: por que somente PTS novo?

Quando `paciente.id_pts` existe, o backend já é a fonte de verdade e o dado é recuperado via
`getPTSById`. O problema real acontece quando o usuário **começa a preencher um PTS novo**
(sem `id_pts`), navega para outra tela, volta, e tudo se perdeu. Essa estratégia resolve
exatamente isso — sem nenhuma chamada extra ao backend.

---

## 1. Chave de identificação no localStorage

```
pts_rascunho_pac{cd_paciente}_at{cd_atendimento}
```

**Exemplo:** `pts_rascunho_pac1042_at8831`

Isso garante que:
- Cada combinação paciente + atendimento tem seu próprio rascunho isolado
- Dois usuários em máquinas diferentes não se afetam (localStorage é por navegador/máquina)
- É possível ter rascunhos de pacientes diferentes simultaneamente sem colisão

> Se `cd_paciente` ou `cd_atendimento` for nulo (cenário improvável mas possível),
> o auto-save é simplesmente desabilitado sem erro.

---

## 2. Estrutura do snapshot (o que salvar)

O ponto central do plano: o snapshot usa **exatamente o mesmo formato** que a função
`popularFormulario` já sabe ler. Assim, a restauração é trivial — zero nova lógica de parsing.

```typescript
// Montado dentro de PTSPage, idêntico ao payload já preparado em handleSave
const snapshot = {
  // ── Campos escalares (Ant Design Form) ──────────────────────────────────
  ...form.getFieldsValue(),

  // ── Listas gerenciadas por estado separado ───────────────────────────────
  diagnosticos_principais:   diagPrincipais.map(r => r.diagnostico).filter(Boolean),
  diagnosticos_terapeuticos: diagTerapeuticos.map(r => r.diagnostico).filter(Boolean),
  cer_terapias:              extTerapias.map(r => r.diagnostico).filter(Boolean),
  conduta_avaliacao_medica:  conductaRows.map(r => r.diagnostico).filter(Boolean),
  conduta_multidisciplinar:  multidisciplinarRows.map(r => r.diagnostico).filter(Boolean),

  instrumentos: instrumentoRows
    .filter(r => r.diagnostico)
    .map(r => ({ ds_instrumento: r.diagnostico!, ds_calculo: r.calculo ?? null })),

  terapias_indicadas: terapias,         // TerapiaRow[] — já tem a estrutura certa

  // ── Registros por área ──────────────────────────────────────────────────
  diagnosticos_area: diagnosticosArea,  // Record<Area, string | undefined>
  grau_area:         grauArea,          // Record<Area, string | undefined>

  // ── Objetivos ───────────────────────────────────────────────────────────
  objetivos,                            // ObjetivosState
  objetivosNaoSeAplica,                 // Record<string, boolean>

  // ── Metadado do rascunho ────────────────────────────────────────────────
  _salvo_em: new Date().toISOString(),  // para TTL e exibição ao usuário
}
```

**Por que esse formato?** A função `popularFormulario(d)` já existe e já trata cada campo acima.
A restauração será literalmente:

```typescript
popularFormulario(snapshot)
setObjetivosNaoSeAplica(snapshot.objetivosNaoSeAplica ?? {})
```

---

## 3. O que NÃO salvar

| Estado | Motivo |
|---|---|
| `usuarioMe` | Vem da API `/users/me` a cada mount |
| `opcoesDiagPrincipais`, `opcoesDiagArea`, etc. | Listas de opções da API — não são dados do paciente |
| `condutaStatus` | Consultado da API do MV sempre de novo |
| `idPtsSalvo` | Se é null, não existe no banco; se existe, usa o backend |
| `ptsFinalizado` | Só muda via ação explícita no backend |
| `salvandoPTS`, `finalizandoPTS`, etc. | Estado de UI transitório |
| `errosObjetivos` | Estado de validação, recalculado no momento do save |
| `modalResultado`, `modalCancelamento` | Estado de UI transitório |

---

## 4. Quando disparar o save (triggers)

Qualquer mudança no formulário deve acionar o debounce. As fontes de mudança são:

| Fonte de mudança | Como observar |
|---|---|
| Campos escalares do Form (textos, checkboxes, selects) | Prop `onValuesChange` no `<Form>` do Ant Design |
| `diagPrincipais` | `useEffect([diagPrincipais])` |
| `diagTerapeuticos` | `useEffect([diagTerapeuticos])` |
| `extTerapias` | `useEffect([extTerapias])` |
| `conductaRows` | `useEffect([conductaRows])` |
| `multidisciplinarRows` | `useEffect([multidisciplinarRows])` |
| `instrumentoRows` | `useEffect([instrumentoRows])` |
| `terapias` | `useEffect([terapias])` |
| `diagnosticosArea` | `useEffect([diagnosticosArea])` |
| `grauArea` | `useEffect([grauArea])` |
| `objetivos` | `useEffect([objetivos])` |
| `objetivosNaoSeAplica` | `useEffect([objetivosNaoSeAplica])` |

Na prática, isso será **um único `useEffect`** com todos na array de dependências +
a prop `onValuesChange` no `<Form>`, ambos chamando a mesma função `agendarSalvamento()`.

---

## 5. Debounce — estratégia sem re-render

Usar `useRef` para guardar o `setTimeout` — **não** `useState`, para não causar re-render
a cada keystroke:

```typescript
const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

function agendarSalvamento() {
  if (debounceRef.current) clearTimeout(debounceRef.current)
  debounceRef.current = setTimeout(() => {
    salvarRascunho()
  }, 1000) // 1 segundo após o último evento
}
```

**1 segundo** é o valor ideal: rápido o suficiente para capturar a mudança antes de
navegar para outra página, mas sem gravar a cada keystroke num campo de texto longo.

---

## 6. Guardas obrigatórias dentro de `salvarRascunho()`

O `salvarRascunho()` deve ser no-op em 3 situações:

```typescript
function salvarRascunho() {
  // 1. Não é PTS novo — backend já é a fonte de verdade
  if (idPtsSalvo !== null) return

  // 2. PTS já finalizado — formulário está em modo read-only
  if (ptsFinalizado) return

  // 3. Sem identificação do paciente — impossível montar chave única
  if (!paciente.cd_paciente || !paciente.cd_atendimento) return

  const chave = `pts_rascunho_pac${paciente.cd_paciente}_at${paciente.cd_atendimento}`
  const snapshot = montarSnapshot() // função que lê todos os estados e monta o objeto
  localStorage.setItem(chave, JSON.stringify(snapshot))
  setUltimoRascunhoSalvo(new Date()) // atualiza indicador visual
}
```

---

## 7. Restauração ao montar o componente

No `useEffect` de montagem que já existe no `PTSPage`, adicionar o branch de verificação:

```typescript
useEffect(() => {
  if (paciente.id_pts) {
    // Fluxo atual — carrega do backend (sem alteração)
    setCarregandoDados(true)
    getPTSById(paciente.id_pts)
      .then(popularFormulario)
      .catch(e => console.error('Erro ao carregar PTS:', e))
      .finally(() => setCarregandoDados(false))
    return
  }

  // ── NOVO: PTS novo — verifica rascunho local ─────────────────────────────
  if (paciente.cd_paciente && paciente.cd_atendimento) {
    const chave = `pts_rascunho_pac${paciente.cd_paciente}_at${paciente.cd_atendimento}`
    const raw = localStorage.getItem(chave)
    if (raw) {
      try {
        const rascunho = JSON.parse(raw)
        popularFormulario(rascunho)
        setObjetivosNaoSeAplica(rascunho.objetivosNaoSeAplica ?? {})
        message.info('Rascunho restaurado automaticamente.')
      } catch {
        localStorage.removeItem(chave) // JSON corrompido — descarta silenciosamente
      }
    }
  }
}, [])
```

---

## 8. Quando limpar o rascunho

| Evento | Ação |
|---|---|
| `handleSave` com sucesso (resposta do POST) | `localStorage.removeItem(chave)` — agora tem `id_pts`, backend é a fonte |
| `handleFinalizar` com sucesso | `localStorage.removeItem(chave)` |
| Usuário cancela o PTS com sucesso | `localStorage.removeItem(chave)` |

```typescript
// Exemplo no handleSave, após sucesso:
const resp = await savePTS(payload)
setIdPtsSalvo(resp.id_pts)
limparRascunho() // remove do localStorage
```

---

## 9. TTL — expirar rascunhos antigos (recomendado)

O campo `_salvo_em` no snapshot permite verificar a idade e evitar acúmulo de rascunhos
esquecidos no navegador:

```typescript
const RASCUNHO_TTL_DIAS = 7

function lerRascunho(chave: string) {
  const raw = localStorage.getItem(chave)
  if (!raw) return null

  try {
    const rascunho = JSON.parse(raw)
    const salvoEm = new Date(rascunho._salvo_em)
    const diasPassados = (Date.now() - salvoEm.getTime()) / (1000 * 60 * 60 * 24)

    if (diasPassados > RASCUNHO_TTL_DIAS) {
      localStorage.removeItem(chave) // expirado — descarta
      return null
    }
    return rascunho
  } catch {
    localStorage.removeItem(chave)
    return null
  }
}
```

---

## 10. Indicador visual (UX)

No cabeçalho do formulário, mostrar discretamente o horário do último salvamento:

```
Rascunho salvo às 14:32
```

Implementado como um estado simples:

```typescript
const [ultimoRascunhoSalvo, setUltimoRascunhoSalvo] = useState<Date | null>(null)
```

Atualizado após cada `localStorage.setItem`. Não bloqueia a tela, não é um spinner,
apenas uma `<Text type="secondary">` pequena no canto do card de cabeçalho.

---

## 11. Arquitetura dos arquivos

### Arquivo novo: `frontend/src/hooks/usePTSDraft.ts`

Hook customizado com toda a lógica encapsulada. Mantém o `PTSPage` limpo.

```
Responsabilidades do hook:
  - Construir a chave do localStorage
  - Expor agendarSalvamento() — chamada nos triggers
  - Expor salvarRascunho() — executa de fato após debounce
  - Expor limparRascunho() — chamada após save/finalizar/cancelar
  - Expor lerRascunho() — chamada na montagem do componente
  - Controlar ultimoRascunhoSalvo (Date | null)
```

Interface pública do hook:

```typescript
function usePTSDraft(params: {
  cdPaciente:       number | null | undefined
  cdAtendimento:    number | null | undefined
  idPtsSalvo:       number | null
  ptsFinalizado:    boolean
  montarSnapshot:   () => object   // callback que lê os estados do PTSPage
}) {
  return {
    agendarSalvamento,       // () => void — conectar nos onChange
    limparRascunho,          // () => void — chamar após save/finalizar
    lerRascunhoSalvo,        // () => object | null — chamar na montagem
    ultimoRascunhoSalvo,     // Date | null — para o indicador visual
  }
}
```

### Arquivo modificado: `frontend/src/pages/PTS/PTSPage.tsx`

Alterações pontuais (~20 linhas):

1. Importar `usePTSDraft`
2. Adicionar estado `ultimoRascunhoSalvo`
3. Criar função `montarSnapshot()` (já é basicamente o `payload` do `handleSave`)
4. Conectar `agendarSalvamento` na prop `onValuesChange` do `<Form>`
5. Adicionar `useEffect` observando os estados de lista → chama `agendarSalvamento`
6. Chamar `limparRascunho` no `handleSave` e `handleFinalizar` após sucesso
7. Chamar `lerRascunhoSalvo` + `popularFormulario` no `useEffect` de montagem
8. Adicionar `<Text type="secondary">` com horário do último rascunho no cabeçalho

---

## 12. Resumo de impacto

| Critério | Avaliação |
|---|---|
| Chamadas ao backend | **Zero novas** — nenhuma API tocada |
| Re-renders causados | **Zero extras** — debounce usa `useRef`, não `useState` |
| Tamanho dos dados | **< 20 KB** por rascunho no localStorage |
| Risco de regressão | **Mínimo** — `popularFormulario` já existe; só adicionamos triggers |
| Compatibilidade | Funciona em qualquer navegador moderno sem dependência nova |
| Rollback | Basta remover o hook e as ~20 linhas de integração no `PTSPage` |

---

## 13. Checklist de implementação

- [ ] Criar `frontend/src/hooks/usePTSDraft.ts` com a lógica de debounce, TTL e chave
- [ ] Criar função `montarSnapshot()` dentro do `PTSPage` (extrai todos os estados)
- [ ] Conectar `agendarSalvamento` na prop `onValuesChange` do `<Form>`
- [ ] Adicionar `useEffect` único observando todos os estados de lista
- [ ] Modificar o `useEffect` de montagem para restaurar rascunho quando sem `id_pts`
- [ ] Chamar `limparRascunho()` após sucesso em `handleSave`
- [ ] Chamar `limparRascunho()` após sucesso em `handleFinalizar`
- [ ] Chamar `limparRascunho()` após sucesso em `handleCancelar`
- [ ] Adicionar indicador visual `"Rascunho salvo às HH:mm"` no cabeçalho
- [ ] Testar: preencher campos → navegar para `/pts/pacientes` → voltar → verificar restauração
- [ ] Testar: salvar explicitamente → verificar que rascunho foi removido do localStorage
- [ ] Testar: rascunho com mais de 7 dias → verificar que é descartado na leitura
