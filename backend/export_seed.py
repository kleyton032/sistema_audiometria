import os
import sys
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

def export_seed_data():
    load_dotenv('.env')

    user = os.getenv('ORACLE_USER')
    password = os.getenv('ORACLE_PASSWORD')
    dsn = os.getenv('ORACLE_DSN')

    if not all([user, password, dsn]):
        print("Credenciais do Oracle na .env não encontradas!")
        return

    # Use oracledb thick mode or thin mode depending on what the app uses.
    # The app likely uses oracledb.
    engine = create_engine(f"oracle+oracledb://{user}:{password}@{dsn}")

    tables_to_export = [
        "ESPECIALID",
        "TB_FAV_DIAGNOSTICO_CERIV",
        "ITEM_AGENDAMENTO",
        "FAV_ITEM_CER4",
        "FAV_INSTR_AVAL_CER4",
        "DBASGU.USUARIOS", # Assuming testesoul is here or similar
    ]

    os.makedirs("init-scripts", exist_ok=True)
    
    with open("init-scripts/01_schema_and_data.sql", "w", encoding="utf-8") as f:
        # Create Tables DDL (Simplified, just what PTS needs)
        f.write("-- DDL para tabelas base (Simplificado para testes)\\n")
        f.write("CREATE TABLE TB_FAV_DIAGNOSTICO_CERIV (id_especialidade NUMBER, ds_diagnostico VARCHAR2(255));\\n")
        f.write("CREATE TABLE ESPECIALID (cd_especialid NUMBER, ds_especialid VARCHAR2(255));\\n")
        f.write("CREATE TABLE ITEM_AGENDAMENTO (cd_item_agendamento NUMBER, ds_item_agendamento VARCHAR2(255));\\n")
        f.write("CREATE TABLE FAV_ITEM_CER4 (cd_item_agendamento NUMBER, ds_item_agendamento VARCHAR2(255), item_terapia VARCHAR2(1));\\n")
        f.write("CREATE TABLE FAV_INSTR_AVAL_CER4 (seq NUMBER, instrumento VARCHAR2(255));\\n")
        
        # O Oracle permite criar a tabela FAV_LISTA_ESPERA que as procedures vão usar
        f.write("CREATE TABLE FAV_LISTA_ESPERA (id_pts NUMBER, nm_usuario VARCHAR2(255), dt_insercao DATE, ds_status VARCHAR2(50));\\n")
        
        f.write("\\n-- Procedures Mockadas para os testes\\n")
        f.write("CREATE OR REPLACE PROCEDURE PRC_FAV_PTS_INSERE_FILA(p_id_pts IN NUMBER, p_nm_usuario IN VARCHAR2) AS\\n")
        f.write("BEGIN\\n")
        f.write("  INSERT INTO FAV_LISTA_ESPERA (id_pts, nm_usuario, dt_insercao, ds_status) VALUES (p_id_pts, p_nm_usuario, SYSDATE, 'AGUARDANDO');\\n")
        f.write("END;\\n/\\n")
        
        f.write("CREATE OR REPLACE PROCEDURE PRC_FAV_PTS_CANCELA_FILA(p_id_pts IN NUMBER, p_motivo IN VARCHAR2) AS\\n")
        f.write("BEGIN\\n")
        f.write("  UPDATE FAV_LISTA_ESPERA SET ds_status = 'CANCELADO' WHERE id_pts = p_id_pts;\\n")
        f.write("END;\\n/\\n")

        with engine.connect() as conn:
            for table in tables_to_export:
                print(f"Exportando {table}...")
                try:
                    # Get column names
                    if '.' in table:
                        schema, tname = table.split('.')
                        q_cols = text(f"SELECT column_name FROM all_tab_columns WHERE table_name = '{tname.upper()}' AND owner = '{schema.upper()}'")
                    else:
                        q_cols = text(f"SELECT column_name FROM user_tab_columns WHERE table_name = '{table.upper()}'")
                    
                    cols = [row[0] for row in conn.execute(q_cols).fetchall()]
                    if not cols:
                        print(f"Tabela {table} não encontrada ou sem acesso.")
                        continue
                        
                    # We might only need specific columns for the mocked tables above.
                    # Instead of full export which could be complex with datatypes, we just export the needed columns.
                    if table == "ESPECIALID":
                        rows = conn.execute(text("SELECT cd_especialid, ds_especialid FROM especialid")).fetchall()
                        for r in rows:
                            ds = str(r[1]).replace("'", "''") if r[1] else ''
                            f.write(f"INSERT INTO ESPECIALID (cd_especialid, ds_especialid) VALUES ({r[0]}, '{ds}');\\n")
                            
                    elif table == "TB_FAV_DIAGNOSTICO_CERIV":
                        rows = conn.execute(text("SELECT id_especialidade, ds_diagnostico FROM TB_FAV_DIAGNOSTICO_CERIV")).fetchall()
                        for r in rows:
                            ds = str(r[1]).replace("'", "''") if r[1] else ''
                            id_esp = r[0] if r[0] is not None else "NULL"
                            f.write(f"INSERT INTO TB_FAV_DIAGNOSTICO_CERIV (id_especialidade, ds_diagnostico) VALUES ({id_esp}, '{ds}');\\n")
                            
                    elif table == "ITEM_AGENDAMENTO":
                        rows = conn.execute(text("SELECT cd_item_agendamento, ds_item_agendamento FROM ITEM_AGENDAMENTO WHERE ROWNUM <= 100")).fetchall()
                        for r in rows:
                            ds = str(r[1]).replace("'", "''") if r[1] else ''
                            f.write(f"INSERT INTO ITEM_AGENDAMENTO (cd_item_agendamento, ds_item_agendamento) VALUES ({r[0]}, '{ds}');\\n")
                            
                    elif table == "FAV_ITEM_CER4":
                        rows = conn.execute(text("SELECT cd_item_agendamento, ds_item_agendamento, item_terapia FROM FAV_ITEM_CER4")).fetchall()
                        for r in rows:
                            ds = str(r[1]).replace("'", "''") if r[1] else ''
                            it = str(r[2]).replace("'", "''") if r[2] else ''
                            f.write(f"INSERT INTO FAV_ITEM_CER4 (cd_item_agendamento, ds_item_agendamento, item_terapia) VALUES ({r[0]}, '{ds}', '{it}');\\n")
                            
                    elif table == "FAV_INSTR_AVAL_CER4":
                        rows = conn.execute(text("SELECT seq, instrumento FROM FAV_INSTR_AVAL_CER4")).fetchall()
                        for r in rows:
                            ds = str(r[1]).replace("'", "''") if r[1] else ''
                            f.write(f"INSERT INTO FAV_INSTR_AVAL_CER4 (seq, instrumento) VALUES ({r[0]}, '{ds}');\\n")
                except Exception as e:
                    print(f"Erro ao exportar {table}: {e}")

        f.write("COMMIT;\\n")
        print("Exportação concluída! O script init-scripts/01_schema_and_data.sql foi gerado.")

if __name__ == "__main__":
    export_seed_data()
