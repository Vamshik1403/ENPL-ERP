export const BACKUP_DIR = process.env.BACKUP_DIR || '/var/backups/postgres';
export const DB_NAME = process.env.BACKUP_DB || 'enplerp';
export const MAX_BACKUP_FILES_HARD_LIMIT = 500; // safety
export const MAX_UPLOAD_MB = 1024; // 1GB safety, change if needed
