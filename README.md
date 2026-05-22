# Plataforma de Apoio Assistencial e Clínico (CER IV)
*Anteriormente conhecido como Sistema de Audiometria*

Bem-vindo ao repositório oficial da Plataforma de Apoio Assistencial. Este sistema é uma aplicação web completa desenvolvida para preencher as lacunas operacionais do ERP principal da instituição, fornecendo ferramentas especializadas, flexíveis e modernas para as equipes multidisciplinares do centro de reabilitação.

---

## 📖 1. Contexto e Evolução do Projeto

**Como começou:**
O sistema foi concebido originalmente com um escopo delimitado: focar estritamente na realização e gerenciamento de **exames de audiometria**, atendendo demandas muito pontuais da área de audiologia que exigiam a plotagem de gráficos complexos (audiogramas) e a geração de laudos padronizados.

**O problema:**
À medida que o uso clínico avançou, ficou evidente que o ERP principal do hospital (MV) não comportava adequadamente outras necessidades operacionais críticas da instituição, especialmente no que tange ao acompanhamento contínuo de pacientes. Havia uma dificuldade enorme em integrar o fluxo multidisciplinar, gerar laudos consolidados e, acima de tudo, gerenciar eficientemente o **Projeto Terapêutico Singular (PTS)**.

**A Evolução:**
Diante disso, o projeto escalou. Transformamos a ferramenta de um "módulo isolado de audiometria" em uma verdadeira **Plataforma Multidisciplinar de Apoio Assistencial**. O sistema foi reestruturado para abrigar não só exames (audiometria e imitanciometria), mas também o controle completo e centralizado do fluxo terapêutico do paciente.

---

## 🎯 2. Objetivos e Público-Alvo

- **Objetivo Principal:** Fornecer autonomia, agilidade e integração no preenchimento de documentos clínicos, geração de laudos em PDF, acompanhamento de metas terapêuticas e gestão de agendas, sem depender das engessadas customizações do sistema legado.
- **Público-Alvo:** Fonoaudiólogos, Psicólogos, Terapeutas Ocupacionais, Fisioterapeutas, Médicos especialistas, Coordenadores clínicos e Operadores administrativos.

---

## 🛠️ 3. Estrutura Tecnológica

A escolha da stack foi motivada pela necessidade de **flexibilidade**, **alta performance** na geração de documentos e **desacoplamento**:

### Frontend
- **React (com Vite e TypeScript):** Interface altamente reativa e tipagem estática segura.
- **Ant Design & Radix UI:** Componentização profissional, acessível e responsiva, oferecendo uma experiência premium (UX/UI) com drawers, dropdowns e formulários complexos.
- **Context API & Axios:** Gestão de estado inteligente com proteção avançada de sessão (Soft-Login para evitar perda de dados).

### Backend
- **Python (FastAPI):** Escolhido pela facilidade na manipulação de dados científicos e excelente performance em APIs assíncronas.
- **WeasyPrint & Matplotlib:** Renderização de laudos em PDF com alta fidelidade (A4, cálculos de impressão otimizados) e geração matemática de gráficos audiológicos lado a lado com os dados clínicos.
- **Integração Oracle:** Conexão direta ao banco do ERP legado para consumo e sincronização de pacientes, agendas e prestadores.

---

## 🧩 4. Arquitetura e Módulos Principais

O sistema é construído de forma **modular**, permitindo que novas áreas do hospital sejam integradas no futuro:

### 📋 Módulo de Projeto Terapêutico Singular (PTS)
O coração multidisciplinar da aplicação. Permite criar metas, condutas, avaliações médicas e objetivos terapêuticos específicos por especialidade (Psicologia, TO, Fisio, etc). O módulo controla vigência, histórico e unifica a visão do paciente.

### 🎧 Módulo de Exames Audiológicos
- **Audiometria Tonal e Vocal:** Formulário de captação de limiares com plotagem automática de audiograma e geração do laudo compacto em PDF.
- **Imitanciometria:** Preenchimento de timpanometria e reflexos estapedianos.

### 📊 Dashboard e Gestão Administrativa
Telas destinadas a supervisores e coordenadores para visualizar indicadores, controlar permissões, acompanhar a fila de atendimentos e monitorar laudos aguardando assinatura.

### 🖨️ Módulo de Documentos (Impressão)
Motor central de PDF projetado para gerar relatórios profissionais, compactos e legíveis, garantindo que cabeçalhos e formatações institucionais permaneçam consistentes entre Audiometria e PTS.

### 🔐 Controle de Perfis e Permissões (RBAC)
O sistema conta com proteção de rotas e perfis de acesso bem definidos: `ADMIN`, `SUPERVISOR`, `COORDENADOR` e `OPERADOR`. Isso delimita quem pode cancelar documentos, alterar parâmetros institucionais ou apenas operar o formulário.

---

## 🛡️ 5. Auditoria, Segurança e Monitoramento

A aplicação foi desenhada considerando um ambiente clínico onde a **segurança de preenchimento** é inegociável:
- **Soft-Login In-Loco:** Se o token expirar ou a rede oscilar, o sistema congela a tela atual e solicita apenas a senha em um modal (sem recarregar a página), impedindo que o profissional perca um documento gigantesco não salvo.
- **Error Boundaries Globais:** Previne a famosa "tela branca" do React isolando exceções.
- **Auditoria e Logs:** *(Em implementação arquitetural)* Sistema orientado a eventos para extrair rastreabilidade total (Quem alterou? O que alterou? Que IP usou?) de forma desacoplada via RabbitMQ/ElasticStack.

---

## 🚀 6. Visão de Futuro e Escalabilidade

A arquitetura estabelecida não restringe o sistema ao CER IV. A estratégia de expansão mira:
1. **Novos Exames:** Acoplar laudos de oftalmologia, testes neuropsicológicos e outras avaliações padronizadas.
2. **Integração de Assinatura Digital:** Evoluir de PDFs para documentos com assinatura digital nativa.
3. **Escalabilidade Cloud:** Preparação dos containers (Backend e Frontend) para escalar horizontalmente caso o sistema seja adotado por outras unidades hospitalares ou clínicas externas.
