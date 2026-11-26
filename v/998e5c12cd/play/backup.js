import { exportBackup, importBackup } from './progress.js';

const MAX_BACKUP_BYTES = 1024 * 1024;

export function backupMarkup() {
  return `<section class="backup-panel" aria-labelledby="backup-heading">
    <h3 id="backup-heading">Keep your progress safe</h3>
    <p>Your progress saves in this browser. One backup file keeps every Ziggle game safe: word puzzles, Word Cloud, Letter Lock, arrows, Memory Mischief, Sudoku, your streak and trophies.</p>
    <div class="backup-actions"><button type="button" id="export-backup" class="secondary-button">Download backup</button><button type="button" id="protect-storage" class="secondary-button">Keep this save safe</button></div>
    <p class="backup-tip">Keep your backup on your computer, or move it to an iCloud Drive or OneDrive folder. Download a fresh copy after playing.</p>
    <label class="backup-file" for="restore-backup">Restore a backup<input id="restore-backup" type="file" accept=".json,application/json" aria-describedby="backup-status"></label>
    <p id="backup-status" class="backup-status" role="status" aria-live="polite">Browsers sometimes tidy away saved games. “Keep this save safe” asks yours not to. A backup file is still the safest copy.</p>
  </section>`;
}

// root (2.7): look for the controls inside one box (the Settings panel), so two copies on a page never mix.
export function attachBackupControls({ getSaved, setSaved, save, onRestore = () => {}, root = null }) {
  const find = id => (root ? root.querySelector(`#${id}`) : document.getElementById(id));
  const downloadButton = find('export-backup');
  const restoreInput = find('restore-backup');
  const protectButton = find('protect-storage');
  const status = find('backup-status');
  if (!downloadButton || !restoreInput || !protectButton || !status) return;

  const report = (message, failed = false) => {
    const currentStatus = find('backup-status') || status;
    currentStatus.textContent = message;
    currentStatus.classList.toggle('error', failed);
  };

  downloadButton.addEventListener('click', () => {
    let url;
    let link;
    try {
      // With the Ziggle hub loaded, the same file also carries the other games.
      const text = globalThis.Ziggle?.exportAll ? globalThis.Ziggle.exportAll(getSaved()) : exportBackup(getSaved());
      const blob = new Blob([text], { type: 'application/json' });
      url = URL.createObjectURL(blob);
      link = document.createElement('a');
      link.href = url;
      link.download = `ziggle-progress-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.append(link);
      link.click();
      report('Backup download started. Keep the file somewhere safe, and restore it here after a browser cleanup or on another computer.');
    } catch {
      report('The backup could not be downloaded. Please try again in a browser that allows file downloads.', true);
    } finally {
      link?.remove();
      // Leave the URL available long enough for the browser to begin the download.
      if (url) setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  });

  restoreInput.addEventListener('change', async () => {
    const file = restoreInput.files?.[0];
    if (!file) return;
    restoreInput.disabled = true;
    try {
      if (file.size > MAX_BACKUP_BYTES) throw new Error('This file is too large. Choose a Ziggle backup smaller than 1 MB.');
      const text = await file.text();
      if (restoreInput.isConnected === false) return;
      const restored = importBackup(text, getSaved());
      setSaved(restored);
      globalThis.Ziggle?.restoreExtras?.(text);
      const stored = save();
      await onRestore();
      report(stored === false
        ? 'Backup restored for this visit, but this browser could not save it. Keep your backup file and download a new copy after playing.'
        : 'Backup restored. Your existing progress and the backup have been combined.', stored === false);
    } catch (error) {
      report(error instanceof Error ? error.message : 'This backup could not be restored. Choose a valid Ziggle backup file.', true);
    } finally {
      restoreInput.value = '';
      restoreInput.disabled = false;
    }
  });

  protectButton.addEventListener('click', async () => {
    const storage = globalThis.navigator?.storage;
    if (!storage || typeof storage.persist !== 'function') {
      report('This browser does not offer storage protection. Download a backup to keep your progress outside the browser.');
      return;
    }
    protectButton.disabled = true;
    try {
      const protectedSave = await storage.persist();
      report(protectedSave
        ? 'Browser protection is on. Automatic storage cleanup should keep this save. Clearing site data still removes it, so keep a backup file too.'
        : 'This browser did not grant storage protection. Your progress still saves here; download a backup to protect it from cleanup.');
    } catch {
      report('Storage protection could not be enabled. Download a backup to keep a copy outside the browser.', true);
    } finally {
      protectButton.disabled = false;
    }
  });
}
