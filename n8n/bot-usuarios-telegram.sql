-- Tabla donde el bot registra a quien le manda /start
-- (n8n/03-bot-telegram-consultas.json, nodo "Registrar usuario").
-- Ejecútalo DESPUÉS de bot-lector.sql:
--   sudo -u postgres psql -d ecommerce_db -f n8n/bot-usuarios-telegram.sql
CREATE TABLE IF NOT EXISTS telegram_usuarios (
  chat_id       BIGINT PRIMARY KEY,
  username      VARCHAR(64),
  nombre        VARCHAR(128),
  apellido      VARCHAR(128),
  idioma        VARCHAR(16),
  registrado_en TIMESTAMP NOT NULL DEFAULT NOW(),
  ultimo_start  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- El bot sigue sin poder modificar la tienda: solo escribe en esta tabla.
GRANT SELECT, INSERT, UPDATE ON telegram_usuarios TO bot_lector;
