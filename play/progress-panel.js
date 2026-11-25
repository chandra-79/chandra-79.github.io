// Your progress, in Settings (2.7): one backup file for every game, and sync codes for another device.
// It used to sit at the bottom of the home page; now it is in Settings on every page. Loaded only when Settings opens.
import { loadProgress, writeProgress, importBackup } from './progress.js';
import { backupMarkup, attachBackupControls } from './backup.js';

const Z = () => globalThis.Ziggle;
// Home (and any page) re-reads progress when this fires.
const changed = () => document.dispatchEvent(new CustomEvent('ziggle:settings', { detail: { key: 'progress' } }));

export function mountProgress(root) {
  root.innerHTML = `<div id="account-slot"></div>${backupMarkup()}
    <section class="sync-panel" data-online aria-labelledby="sync-heading">
      <h3 id="sync-heading">Or use a sync code</h3>
      <p>No email needed: get a private sync code, then enter it on your other phone or computer. Anyone with the code can load your progress, so keep it to yourself.</p>
      <p class="sync-code" id="sync-code-display" hidden></p>
      <div class="backup-actions"><button class="secondary-button" id="sync-create" type="button">Get a sync code</button><button class="secondary-button" id="sync-now" type="button" hidden>Sync now</button></div>
      <form class="inline-form" id="sync-join"><label for="sync-input">Have a code?</label><input id="sync-input" placeholder="ABCD-EFGH-JKLM-NPQR" autocomplete="off" autocapitalize="characters" maxlength="19"><button class="secondary-button" type="submit">Join</button></form>
      <p class="panel-status" id="sync-status" role="status" aria-live="polite"></p>
    </section>`;
  const account=root.querySelector('#account-slot');
  let accountAttempt=0;
  const loadAccount=()=>{account.textContent='Loading accounts…';import('./account.js'+(accountAttempt++?'?retry='+accountAttempt:'')).then(module=>module.mountAccount(account)).catch(()=>{account.textContent='Accounts could not load. Backup and sync tools are still available below. ';const retry=document.createElement('button');retry.type='button';retry.className='secondary-button';retry.textContent='Try accounts again';retry.onclick=loadAccount;account.append(retry);});};
  loadAccount();
  const $ = id => root.querySelector(`#${id}`);
  const status = (text, failed = false) => { const el = $('sync-status'); el.textContent = text; el.classList.toggle('error', failed); };
  let pendingSave = null;
  attachBackupControls({ root, getSaved: () => loadProgress(), setSaved: value => { pendingSave = value; }, save: () => writeProgress(pendingSave), onRestore: changed });

  const showCode = () => {
    const code = Z().profile().syncCode;
    $('sync-code-display').hidden = !code;
    $('sync-code-display').textContent = code ? `Your sync code: ${code}` : '';
    $('sync-now').hidden = !code;
    $('sync-create').hidden = Boolean(code);
  };
  const payload = () => JSON.parse(Z().exportAll(loadProgress()));
  async function syncNow() {
    const code = Z().profile().syncCode;
    if (!code) return;
    status('Syncing…');
    const remote = await Z().api(`/api/sync/${code}`);
    if (!remote.ok) { status(remote.message, true); return; }
    // Merge: achievements only ever grow, on both sides.
    const text = JSON.stringify(remote.payload);
    try { writeProgress(importBackup(text, loadProgress())); Z().restoreExtras(text); } catch (error) { status(error.message, true); return; }
    const pushed = await Z().api(`/api/sync/${code}`, { method: 'PUT', body: { payload: payload() } });
    status(pushed.ok ? 'Synced. This device and your code now hold the same progress.' : pushed.message, !pushed.ok);
    changed();
  }
  $('sync-create').addEventListener('click', async () => {
    status('Creating your code…');
    const result = await Z().api('/api/sync', { method: 'POST', body: { payload: payload() } });
    if (!result.ok) { status(result.message, true); return; }
    const profile = Z().profile(); profile.syncCode = result.code; Z().saveProfile(profile);
    showCode();
    status('Write this code down or save it in your password manager. Enter it on another device to play there.');
  });
  $('sync-now').addEventListener('click', syncNow);
  $('sync-join').addEventListener('submit', async event => {
    event.preventDefault();
    const code = $('sync-input').value.trim().toUpperCase().replace(/\s+/g, '');
    if (!/^[A-HJ-NP-Z2-9]{4}(?:-[A-HJ-NP-Z2-9]{4}){3}$/.test(code)) { status('Sync codes look like ABCD-EFGH-JKLM-NPQR.', true); return; }
    const profile = Z().profile(); profile.syncCode = code; Z().saveProfile(profile);
    $('sync-input').value = '';
    showCode();
    await syncNow();
  });
  showCode();
}
