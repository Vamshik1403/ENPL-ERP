import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { BACKUP_DIR, DB_NAME, MAX_BACKUP_FILES_HARD_LIMIT } from './backup.constants';

function isSafeBackupFilename(name: string) {
  // prevents ../ path traversal
  return /^[a-zA-Z0-9._-]+\.backup$/.test(name);
}

function resolveBackupPath(filename: string) {
  if (!isSafeBackupFilename(filename)) throw new BadRequestException('Invalid filename');
  const full = path.resolve(BACKUP_DIR, filename);
  const dir = path.resolve(BACKUP_DIR);
  if (!full.startsWith(dir + path.sep)) throw new BadRequestException('Invalid path');
  return full;
}

function run(cmd: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'] });

    let err = '';
    p.stderr.on('data', (d) => (err += d.toString()));

    p.on('close', (code) => {
      if (code === 0) return resolve();
      reject(new Error(err || `Command failed: ${cmd} ${args.join(' ')} (code ${code})`));
    });
  });
}

@Injectable()
export class BackupService {
  private dbName = DB_NAME;

  ensureDir() {
    if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  async createBackupAndEnforceRetention(maxFiles: number) {
    this.ensureDir();

    if (!Number.isInteger(maxFiles) || maxFiles < 1) throw new BadRequestException('maxFiles must be >= 1');
    if (maxFiles > MAX_BACKUP_FILES_HARD_LIMIT) throw new BadRequestException(`maxFiles too large (>${MAX_BACKUP_FILES_HARD_LIMIT})`);

    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${this.dbName}_${stamp}.backup`;
    const outPath = path.join(BACKUP_DIR, filename);

    // sudo is allowed already (you configured sudoers)
    await run('sudo', ['-u', 'postgres', '/usr/bin/pg_dump', '-F', 'c', '-b', '-f', outPath, this.dbName]);

    await this.deleteOldBackupsKeepLatest(maxFiles);

    return { filename, path: outPath };
  }

  listBackups(params: { page: number; perPage: number; days?: number }) {
      console.log("BACKUP_DIR USED:", BACKUP_DIR);
      console.log("FILES IN DIR:", fs.readdirSync(BACKUP_DIR));


    this.ensureDir();

    const page = Math.max(1, Number(params.page || 1));
    const perPage = Math.min(50, Math.max(5, Number(params.perPage || 10)));
    const days = params.days ? Math.max(1, Math.min(365, Number(params.days))) : undefined;

    const now = Date.now();
    const cutoff = days ? now - days * 24 * 60 * 60 * 1000 : undefined;

    const all = fs
      .readdirSync(BACKUP_DIR)
      .filter((f) => f.endsWith('.backup'))
      .filter((f) => isSafeBackupFilename(f))
      .map((name) => {
        const full = path.join(BACKUP_DIR, name);
        const st = fs.statSync(full);
        return {
          name,
          size: st.size,
          modified: st.mtime.toISOString(),
          modifiedMs: st.mtime.getTime(),
        };
      })
      .filter((x) => (cutoff ? x.modifiedMs >= cutoff : true))
      .sort((a, b) => b.modifiedMs - a.modifiedMs);

    const total = all.length;
    const start = (page - 1) * perPage;
    const items = all.slice(start, start + perPage).map(({ modifiedMs, ...rest }) => rest);

    return { page, perPage, total, items };
  }

  async deleteOldBackupsKeepLatest(keep: number) {
    this.ensureDir();

    const keepN = Math.max(1, Math.min(MAX_BACKUP_FILES_HARD_LIMIT, Number(keep)));

    const files = fs
      .readdirSync(BACKUP_DIR)
      .filter((f) => f.endsWith('.backup'))
      .filter((f) => isSafeBackupFilename(f))
      .map((name) => {
        const full = path.join(BACKUP_DIR, name);
        const st = fs.statSync(full);
        return { name, full, mtime: st.mtime.getTime() };
      })
      .sort((a, b) => b.mtime - a.mtime);

    const toDelete = files.slice(keepN);
    for (const f of toDelete) fs.unlinkSync(f.full);

    return { deleted: toDelete.map((x) => x.name) };
  }

  async deleteBackupFile(filename: string) {
    this.ensureDir();
    const full = resolveBackupPath(filename);
    if (!fs.existsSync(full)) throw new BadRequestException('File not found');
    fs.unlinkSync(full);
    return { deleted: filename };
  }

  getDownloadStream(filename: string) {
    const full = resolveBackupPath(filename);
    if (!fs.existsSync(full)) throw new BadRequestException('File not found');
    return full;
  }

  async restoreFromFilename(filename: string) {
    const full = resolveBackupPath(filename);

    // restore overwrites objects; you can add --clean if you want drop+recreate objects
    try {
      await run('sudo', ['-u', 'postgres', '/usr/bin/pg_restore', '-d', this.dbName, full]);
      return { restored: filename };
    } catch (e: any) {
      throw new InternalServerErrorException(e?.message || 'Restore failed');
    }
  }
}
