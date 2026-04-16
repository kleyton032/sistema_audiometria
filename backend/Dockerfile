FROM python:3.11-slim-bookworm

# Evitar prompts interativos durante o apt-get
ENV DEBIAN_FRONTEND=noninteractive

# Instala ferramentas básicas e a dependência do Oracle (libaio1)
RUN apt-get update && apt-get install -y \
    wget \
    unzip \
    libaio1 \
    && rm -rf /var/lib/apt/lists/*

# Prepara e instala o Oracle Instant Client Basic Lite (Linux x64 - versão 19.22)
WORKDIR /opt/oracle
RUN wget https://download.oracle.com/otn_software/linux/instantclient/1922000/instantclient-basiclite-linux.x64-19.22.0.0.0dbru.zip \
    && unzip instantclient-basiclite-linux.x64-19.22.0.0.0dbru.zip \
    && rm instantclient-basiclite-linux.x64-19.22.0.0.0dbru.zip \
    && sh -c "echo /opt/oracle/instantclient_19_22 > /etc/ld.so.conf.d/oracle-instantclient.conf" \
    && ldconfig

# Verifica se o instantclient foi instalado corretamente
RUN ls -la /opt/oracle/

# Diretório de trabalho da aplicação
WORKDIR /app

# Instalação das dependências Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copia o código fonte para a imagem Docker
COPY . .

# Expõe a porta da API
EXPOSE 8000

# Comando para iniciar o servidor web
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
