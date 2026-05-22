# Arquitetura de Auditoria, Logs e Observabilidade

Este documento detalha a arquitetura proposta para a implementação de um sistema robusto de auditoria, rastreabilidade e monitoramento de nível corporativo para o Sistema de Audiometria. O objetivo principal desta arquitetura é **desacoplar** a geração de logs da transação principal, garantindo alta disponibilidade, performance e retenção segura.

---

## 1. Abordagem Arquitetural (Event-Driven Logging)

Para evitar que a API principal (FastAPI) sofra degradação de performance ao registrar logs em bancos pesados, a estratégia adotada é a **Arquitetura Orientada a Eventos** associada ao padrão de **Mensageria Assíncrona**.

### Fluxo de Funcionamento:
1. **API Principal:** Executa a regra de negócio normalmente (ex: criar ou cancelar um PTS, salvar laudo de audiometria).
2. **Disparo Assíncrono:** O backend gera o payload de auditoria/log e publica em uma Fila (Message Broker) de forma não-bloqueante (fire-and-forget), retornando a resposta para o usuário instantaneamente.
3. **Worker de Auditoria:** Um serviço independente (Consumer) lê a fila e grava os dados de forma otimizada no Banco de Auditoria.
4. **Agregador de Telemetria:** Logs brutos em texto e rastros de exceções (Tracebacks) são capturados via *stdout* por um agente (Fluent Bit / Logstash) e enviados para um repositório centralizado.

---

## 2. Tecnologias de Armazenamento Recomendadas

A arquitetura prevê a segregação do banco de dados relacional (Oracle) que processa as regras de negócio clínicas, destinando os logs para repositórios especializados:

### Elastic Stack / OpenSearch (Observabilidade e Rastreabilidade)
- **Função:** Armazenamento de logs de tráfego, acessos, requisições HTTP e exceções.
- **Vantagem:** Projetado especificamente para ingestão massiva e pesquisa *Full-Text* instantânea (ex: buscar "IP X que tentou login às 14h").
- **Visualização:** Dashboards no Kibana para monitorar saúde da aplicação e volume de erros.

### MongoDB (Auditoria de Tabelas - Histórico de Entidades)
- **Função:** Armazenamento do "Antes e Depois" (Diff) das tabelas relacionais em formato JSON flexível.
- **Vantagem:** Evita a criação de dezenas de tabelas de log relacionais (`LOG_PACIENTES`, `LOG_PTS`). O MongoDB armazena um documento de evento único de forma estruturada.
- **Exemplo de Uso:**
  ```json
  {
    "entidade": "FAV_TB_PTS",
    "id_registro": 191,
    "alteracao": { "fl_ativo": { "old": 1, "new": 0 } },
    "usuario": "testesoul"
  }
  ```

### Stack Híbrida Proposta:
1. **Fila/Broker:** `RabbitMQ` (alta performance e facilidade de manutenção para volumes hospitalares).
2. **Telemetria / Erros:** `Elasticsearch + Kibana`.
3. **Auditoria de Negócio (CDC/Diffs):** `MongoDB`.

---

## 3. Estratégias de Captura de Auditoria

A geração de eventos de log e alterações no banco será realizada utilizando **Application-Level Events** via Middlewares.

- **Middlewares na API (FastAPI):** Um interceptor monitorará rotas `POST`, `PUT` e `DELETE`, capturando:
  - Dados do Request (IP, `User-Agent`, tempo de resposta).
  - Identidade do Usuário (decodificada do Token JWT).
- **Triggers/Listeners do ORM (SQLAlchemy):** Escutam mudanças nos objetos e disparam os "Diffs" diretamente para a fila do RabbitMQ.

*Nota: Abordagens de CDC (Change Data Capture) como o Debezium direto no Oracle são poderosas para capturar alterações externas, porém perdem facilmente o contexto da aplicação (como qual IP e Token realizou a alteração).*

---

## 4. Estrutura de Log Estruturado (JSON)

Os logs não serão compostos por *strings* concatenadas. Todos os eventos seguirão um formato padronizado de **Log Estruturado em JSON**, permitindo agregações precisas:

```json
{
  "timestamp": "2026-05-22T14:40:00Z",
  "correlation_id": "req-1234-abcd", 
  "actor": {
    "usuario_id": 1,
    "nm_login": "testesoul",
    "ip": "192.168.1.100",
    "user_agent": "Mozilla/5.0 Chrome..."
  },
  "action": "UPDATE",
  "resource": "FAV_TB_PTS",
  "resource_id": "191",
  "diff": {
    "fl_ativo": {"old": 1, "new": 0}
  },
  "status": "SUCCESS"
}
```
*(O `correlation_id` é gerado na entrada do request e atachado a todos os processos secundários, permitindo rastrear desde a auditoria de banco até um erro fatal de exceção)*.

---

## 5. Monitoramento de Exceções (Bugs)

- O FastAPI será configurado com um `Exception Handler` global que interceptará todo Erro `500`. 
- Dados sensíveis (senhas) serão sanitizados do payload.
- As exceções serão atiradas na fila ou monitoradas por plataformas dedicadas como **Sentry** (recomendado) ou **Elastic APM**, agrupando *Tracebacks* idênticos para facilitar a correção por parte do time de desenvolvimento.

---

## 6. Ciclo de Vida dos Dados (Retenção)

- **MongoDB (TTL Indexes):** Configuração de expiração automática (`Time-To-Live`) se a política do hospital não exigir guarda eterna.
- **Elasticsearch (ILM):** *Index Lifecycle Management*. Logs mais recentes ficam em SSDs rápidos (Hot). Logs mais antigos (>90 dias) descem para discos lentos (Cold), e após 5 anos são descartados ou consolidados em Cloud Storage (S3).
