-- Usuario de SOLO LECTURA para el bot de Telegram (n8n/03-bot-telegram-consultas.json).
-- Cambia la contraseña antes de ejecutarlo:
--   sudo -u postgres psql -d ecommerce_db -f n8n/bot-lector.sql
CREATE USER bot_lector WITH PASSWORD 'cambia-esta-contraseña';
GRANT CONNECT ON DATABASE ecommerce_db TO bot_lector;
GRANT USAGE ON SCHEMA public TO bot_lector;
GRANT SELECT ON pedidos, productos TO bot_lector;
