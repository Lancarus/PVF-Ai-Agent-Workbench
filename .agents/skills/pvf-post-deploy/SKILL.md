---
name: pvf-post-deploy
description: Deploys an authorized output Script.pvf after a PVF change by reading the Workbench .env, overwriting the configured client PVF, uploading to the configured server PVF path, restarting game services, waiting for GeoIP country readiness markers, and showing a desktop popup. Use after controlled PVF output/readback when the user has opted into post-change deployment, or when the user asks to deploy, sync, upload, restart, or validate a modified PVF.
---

# PVF Post Deploy

This skill is a post-change deployment helper. It does not edit PVF content and does not weaken the Workbench safety rules.

## Preconditions

- Use this only after the PVF change was produced through the controlled Workbench write path, with explicit output, backup, manifest or change summary, and readback.
- Deploy the generated output PVF, not the source PVF, unless the user explicitly names that file as the deployment artifact.
- Do not deploy when readback failed, output text/path encoding looks wrong, or the user has not explicitly authorized client overwrite and server restart.
- Treat `.env` as local secret configuration. Read variable names as needed, but do not print passwords or private paths back to the conversation.

## Execution Boundary

- When sub-agent tools are available, delegate actual live deployment execution to a sub-agent so the main agent context does not absorb `.env` contents, server logs, or secrets.
- Instruct the sub-agent to run the Python deploy script, avoid printing secrets or raw `.env` values, and return only a sanitized summary, final status, local log path, and any missing readiness markers.
- If sub-agent tools are unavailable, stop before deployment and ask the user whether to proceed in the main context.

## Configuration

The Python script reads `<workbench>/.env` by default.

Required variables:

- `CLIENT_PVF_PATH`: local client `Script.pvf` path to overwrite.
- `SERVER_PVF_PATH`: remote server `Script.pvf` path to overwrite.
- `SSH_HOST`, `SSH_PORT`, `SSH_USER`: SSH server connection.
- `SSH_PASS`: password used by Paramiko SSH/SFTP. Leave empty when using key auth.
- `STOP_COMMAND`: remote command that stops the game service.
- `START_COMMAND`: remote command that starts the game service.

Optional variables:

- `PVF_DEPLOY_READY_MARKERS`: readiness markers separated by `|`. Defaults to the five GeoIP allow country lines for `CN`, `HK`, `KR`, `MO`, and `TW`.
- `PVF_DEPLOY_READY_TEXT`: backward-compatible single readiness marker. Used only when `PVF_DEPLOY_READY_MARKERS` is not set.
- `PVF_DEPLOY_STARTUP_TIMEOUT_SECONDS`: startup wait limit. Defaults to `420`.
- `PVF_DEPLOY_STARTUP_GRACE_SECONDS`: seconds to keep reading after all readiness markers appear. Defaults to `10`.
- `PVF_DEPLOY_STOP_SETTLE_SECONDS`: optional local wait after `STOP_COMMAND` completes before `START_COMMAND` runs. Defaults to `0`.
- `PVF_DEPLOY_POST_START_SETTLE_SECONDS`: optional remote wait after start and post-start commands before marker polling. Defaults to `0`.
- `CHANNEL_CFG_RESTART`: optional post-start remote command. Use only when the deployment environment requires a channel/config refresh after the main start wrapper.
- `AUCTION_CFG_RESTART`: optional post-start remote command. Use only when the deployment environment requires auction/config recovery after the main start wrapper.
- `PVF_DEPLOY_POST_START_COMMANDS`: optional post-start remote commands separated by `|`. Commands run after `START_COMMAND`, before readiness polling.
- `PVF_DEPLOY_MARKER_PROBE_COMMAND`: optional remote command run during readiness polling. It should print or append readiness marker text to the deployment start log without exposing secrets. Backward-compatible aliases: `PVF_DEPLOY_MARKER_LOG_COMMAND`, `PVF_DEPLOY_READY_MARKER_LOG_COMMAND`.
- `PVF_DEPLOY_OUTPUT_ENCODING`: remote output encoding. Defaults to `utf-8`; use `gbk` if the readiness markers are garbled.
- `SSH_KEY_PATH`: optional private key path for Paramiko key auth.

## Run

From the Workbench root:

```powershell
python ".agents\skills\pvf-post-deploy\scripts\deploy_pvf.py" --pvf "<output Script.pvf>" --confirm-deploy
```

The compatibility PowerShell wrapper still works:

```powershell
powershell -ExecutionPolicy Bypass -File ".agents\skills\pvf-post-deploy\scripts\deploy-pvf.ps1" -PvfPath "<output Script.pvf>" -ConfirmDeploy
```

The `--confirm-deploy` / `-ConfirmDeploy` flag is required because this overwrites the configured client PVF, uploads over the configured server PVF, and restarts the game service.

## Tooling

- Python handles local copy with `shutil.copy2`.
- Python handles SSH/SFTP with `paramiko`; install `paramiko` and its SSH crypto dependency set (`cryptography`, `bcrypt`, `PyNaCl`, `cffi`, `pycparser`, `six`).
- The start command is wrapped with a remote temporary log under `/tmp` so backgrounded game processes have a durable stdout/stderr target while the script waits for readiness markers.
- Optional post-start commands are inert unless configured in `.env`; do not hard-code machine-specific recovery commands into the Skill.
- `PyMySQL` is not used by this deployment script.
- To install the pinned dependency set, run `python -m pip install -r ".agents\skills\pvf-post-deploy\requirements.txt"`.
- The script writes temporary deployment logs under the local temp directory, not into the Workbench source tree.

## Success Criteria

Report success only when:

1. The local client PVF copy completed.
2. The remote PVF upload completed.
3. The stop command completed successfully.
4. The start command output contained all five default GeoIP markers:
   `GeoIP Allow Country Code : CN`, `GeoIP Allow Country Code : HK`, `GeoIP Allow Country Code : KR`, `GeoIP Allow Country Code : MO`, and `GeoIP Allow Country Code : TW`.
5. The script showed or attempted the desktop completion popup.

If any step fails, report the failing step and the local log path. Do not retry destructive deployment steps automatically unless the user authorizes a retry.

## Failure Triage

- If upload and stop complete, `START_COMMAND` begins, and all five GeoIP markers are still missing, treat this as service/application readiness failure rather than a successful deploy.
- The script already wraps `START_COMMAND` with a remote `/tmp` readiness log for start wrappers that background services or keep foreground processes attached.
- Use `PVF_DEPLOY_POST_START_COMMANDS`, `CHANNEL_CFG_RESTART`, or `AUCTION_CFG_RESTART` only when the operator has supplied known-good recovery commands in `.env`.
- If auction/config recovery is needed but no recovery command exists, stop after one bounded attempt and ask the user to fix the remote service/config or add an approved recovery command. Do not invent remote repair commands.
- If marker text is known to be written outside the start wrapper output, configure `PVF_DEPLOY_MARKER_PROBE_COMMAND` to append or print the marker source during readiness polling.
