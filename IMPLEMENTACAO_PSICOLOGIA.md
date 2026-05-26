# Implementação do Módulo Psicologia - Guia de Execução

## 📦 Resumo da Implementação

O módulo **Psicologia** foi implementado com estrutura completa escalável para documentos psicológicos (Anamnese, Evolução, Avaliação) com suporte a versionamento e auditoria.

---

## 🚀 Passos de Implementação

### **Passo 1: Criar as Tabelas no Banco de Dados**

Execute o script SQL disponível em:
```
backend/psicologia_schema.sql
```

**Instruções:**
1. Conecte-se ao Oracle como usuário DBA/administrador
2. Execute o arquivo completo
3. Isso criará:
   - 5 tabelas principais
   - 5 sequências (SEQ_*)
   - Índices para performance
   - Constraints de integridade

**Exemplo no SQL Developer:**
```sql
-- Conectar como ADMIN/SYS
@C:\repos\sistema_audiometria\backend\psicologia_schema.sql
```

### **Passo 2: Verificar Modelos SQLAlchemy**

Os modelos foram adicionados em:
```
backend/app/db/models.py
```

Classes criadas:
- `PsicologiaDocumento` → Master de documentos
- `PsicologiaAnamnese` → Dados de anamnese
- `PsicologiaEvolucao` → Evoluções progressivas
- `PsicologiaAvaliacao` → Testes/avaliações
- `PsicologiaVersao` → Histórico de edições

**Verificação:**
```bash
cd backend
python -c "from app.db.models import PsicologiaDocumento; print('Modelos OK')"
```

### **Passo 3: Instalar Dependências Python**

Certifique-se de que `dayjs` está no frontend. Se não:
```bash
cd frontend
npm install dayjs
```

### **Passo 4: Iniciar Backend**

```bash
cd backend

# Criar/ativar ambiente virtual (se necessário)
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac

# Instalar dependências
pip install -r requirements.txt

# Iniciar servidor
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### **Passo 5: Iniciar Frontend**

```bash
cd frontend

# Instalar dependências (se necessário)
npm install

# Iniciar dev server
npm run dev
```

---

## 📋 Estrutura de Arquivos Criada

### Backend:
```
backend/
├── psicologia_schema.sql              # Script SQL para criar tabelas
├── app/
│   ├── api/v1/
│   │   ├── psicologia.py              # Rotas da API
│   │   └── router.py                  # (ATUALIZADO) Incluir psicologia
│   ├── db/
│   │   ├── models.py                  # (ATUALIZADO) 5 novas classes
│   │   └── repositories/
│   │       └── psicologia.py          # Queries ao banco
│   └── schemas/
│       └── psicologia.py              # Schemas Pydantic
```

### Frontend:
```
frontend/src/
├── pages/Psicologia/
│   ├── PsicologiaPage.tsx             # Container principal com tabs
│   ├── Anamnese/
│   │   ├── AnamnesePage.tsx           # Página de anamnese
│   │   └── index.ts
│   ├── Evolucao/
│   │   ├── EvolucaoPage.tsx           # Página de evolução
│   │   └── index.ts
│   ├── Avaliacao/
│   │   ├── AvaliacaoPage.tsx          # Página de avaliação
│   │   └── index.ts
│   └── index.ts
├── api/
│   ├── psicologiaService.ts           # Serviço de API
│   └── index.ts                       # (ATUALIZADO) Export psicologia
├── config/
│   └── menuConfig.tsx                 # (ATUALIZADO) Menu com Psicologia
├── components/
│   └── Layout.tsx                     # (ATUALIZADO) Route names
└── App.tsx                            # (ATUALIZADO) Nova rota /psicologia/*
```

---

## 🔌 Endpoints da API Disponíveis

### Documentos:
```
GET    /api/v1/psicologia/documentos/{cd_paciente}      → Listar documentos
GET    /api/v1/psicologia/documento/{id_psicologia_doc} → Obter documento
POST   /api/v1/psicologia/documentos                    → Criar documento
PATCH  /api/v1/psicologia/documento/{id}               → Atualizar documento
DELETE /api/v1/psicologia/documento/{id}               → Desativar documento
```

### Anamnese:
```
POST   /api/v1/psicologia/documento/{id}/anamnese       → Criar
GET    /api/v1/psicologia/documento/{id}/anamnese       → Obter
PATCH  /api/v1/psicologia/anamnese/{id}                → Atualizar
```

### Evolução:
```
POST   /api/v1/psicologia/documento/{id}/evolucao       → Criar
GET    /api/v1/psicologia/documento/{id}/evolucoes      → Listar
PATCH  /api/v1/psicologia/evolucao/{id}                → Atualizar
DELETE /api/v1/psicologia/evolucao/{id}                → Deletar
```

### Avaliação:
```
POST   /api/v1/psicologia/documento/{id}/avaliacao      → Criar
GET    /api/v1/psicologia/documento/{id}/avaliacao      → Obter
PATCH  /api/v1/psicologia/avaliacao/{id}               → Atualizar
POST   /api/v1/psicologia/avaliacao/{id}/finalizar      → Finalizar
POST   /api/v1/psicologia/avaliacao/{id}/assinar        → Assinar
```

### Auditoria:
```
GET    /api/v1/psicologia/documento/{id}/versoes        → Histórico
```

---

## 🎯 Fluxo de Uso

### Anamnese:
1. Buscar paciente por `cd_paciente`
2. Criar novo documento (tipo: ANAMNESE)
3. Preencher formulário de anamnese
4. Salvar e visualizar

### Evolução:
1. Buscar paciente
2. Selecionar documento de evolução
3. Adicionar múltiplas evolução (1 por atendimento)
4. Editar/deletar conforme necessário

### Avaliação:
1. Buscar paciente
2. Criar documento (tipo: AVALIACAO)
3. Preencher teste psicológico
4. Status: RASCUNHO → FINALIZADO → ASSINADO

---

## ✅ Verificação de Implementação

### Backend:
```bash
# 1. Verificar modelos
python -c "from app.db.models import PsicologiaDocumento, PsicologiaAnamnese, PsicologiaEvolucao, PsicologiaAvaliacao, PsicologiaVersao; print('✅ Modelos importados')"

# 2. Verificar rotas
python -c "from app.api.v1.psicologia import router; print('✅ Rotas importadas')"

# 3. Testar conexão
python -c "from app.db.session import SessionLocal; db = SessionLocal(); print('✅ BD conectado'); db.close()"
```

### Frontend:
```bash
# 1. Verificar imports
cd frontend
npm run build  # Detecta erros de importação

# 2. Verificar componentes
grep -r "PsicologiaPage" src/  # Deve listar os arquivos

# 3. Acessar via navegador
# http://localhost:5173
# Menu: Psicologia → Anamnese/Evolução/Avaliação
```

---

## 🛠️ Permissões & Roles

Atualmente:
- **Todos os usuários** autenticados podem acessar Psicologia
- **Sem restrição de roles** específica

Para adicionar restrição (ex: apenas PSICOLOGO):
1. Editar `menuConfig.tsx` → Adicionar `roles: ['PSICOLOGO']`
2. Editar `App.tsx` → Adicionar `<PsicologoRoute>`
3. Estender tipo `MenuRole` na config

---

## 📊 Base de Dados - Relações

```
FAV_TB_SILA_USUARIOS (ID_USUARIO)
           ↓
FAV_TB_PSICOLOGIA_DOCUMENTOS (ID_PSICOLOGIA_DOC)
           ├→ FAV_TB_PSICOLOGIA_ANAMNESE (1:1)
           ├→ FAV_TB_PSICOLOGIA_EVOLUCAO (1:N)
           ├→ FAV_TB_PSICOLOGIA_AVALIACAO (1:1)
           └→ FAV_TB_PSICOLOGIA_VERSOES (1:N - auditoria)
```

---

## 🔄 Próximas Funcionalidades (Sugestões)

1. **Relatórios**: Gerar PDF com histórico completo
2. **Compartilhamento**: Múltiplos psicólogos colaborando em 1 documento
3. **Integração com PTS**: Vincular diagnósticos psicológicos ao PTS
4. **Alertas**: Notificar quando avaliação vencer
5. **Dashboard**: Resumo de documentos por psicólogo/período
6. **Custom Fields**: Permitir campos customizáveis por especialidade

---

## ❓ Troubleshooting

### Erro: "Tabelas não encontradas"
```sql
-- Verificar se tabelas existem
SELECT table_name FROM user_tables WHERE table_name LIKE 'FAV_TB_PSICOLOGIA%';
```

### Erro: "CORS erro ao chamar API"
- Verificar `app/config.py` se CORS está configurado
- Adicionar origem do frontend se necessário

### Erro: "Componentes não carregam"
- Verificar console do navegador (F12)
- Confirmar que o backend está rodando

### Erro: "Imports falhando"
- Executar `npm install` no frontend
- Fazer rebuild: `npm run build`

---

## 📝 Documentação Adicional

- **Diagrama ER**: Veja `psicologia_schema.sql` para relações
- **API Docs**: http://localhost:8000/docs (Swagger UI)
- **Modelos**: [backend/app/db/models.py](../app/db/models.py)
- **Serviços**: [frontend/src/api/psicologiaService.ts](../src/api/psicologiaService.ts)

---

## 🎉 Conclusão

O módulo Psicologia está **100% implementado e pronto para uso**! 

**Status:**
- ✅ Backend (API + BD)
- ✅ Frontend (UI + navegação)
- ✅ Integração com menu
- ✅ Auditoria & versionamento
- ✅ Validação de dados
- ✅ Tratamento de erros

**Próximo passo:** Execute após criar as tabelas e aproveite! 🚀
