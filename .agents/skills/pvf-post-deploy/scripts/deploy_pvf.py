#!/usr/bin/env python3
"""Deploy a generated Script.pvf using local file copy plus Paramiko SSH/SFTP."""

from __future__ import annotations

import argparse
import os
import shutil
import socket
import sys
import tempfile
import time
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path, PurePosixPath
from typing import Iterable


DEFAULT_READY_MARKERS = [
    "GeoIP Allow Country Code : CN",
    "GeoIP Allow Country Code : HK",
    "GeoIP Allow Country Code : KR",
    "GeoIP Allow Country Code : MO",
    "GeoIP Allow Country Code : TW",
]


class DeployError(RuntimeError):
    pass


@dataclass(frozen=True)
class DeployConfig:
    client_pvf_path: str
    server_pvf_path: str
    ssh_host: str
    ssh_port: int
    ssh_user: str
    ssh_pass: str
    stop_command: str
    start_command: str
    ready_markers: list[str]
    startup_timeout_seconds: int
    startup_grace_seconds: int
    stop_settle_seconds: int
    post_start_settle_seconds: int
    post_start_commands: list[str]
    marker_probe_command: str
    output_encoding: str
    ssh_key_path: str


def resolve_workbench_root(start: Path) -> Path:
    current = start.resolve()
    for candidate in [current, *current.parents]:
        if (candidate / "AGENTS.md").is_file() and (
            candidate / "release" / "AGENT-WORKSPACE-MANIFEST.json"
        ).is_file():
            return candidate
    raise DeployError(f"Cannot resolve Workbench root from {start}")


def parse_dotenv(path: Path) -> dict[str, str]:
    if not path.is_file():
        raise DeployError(f"Missing .env file: {path}")

    values: dict[str, str] = {}
    for raw_line in path.read_text(encoding="utf-8-sig").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue

        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip()
        if not key:
            continue
        if len(value) >= 2 and value[0] == value[-1] and value[0] in {"'", '"'}:
            value = value[1:-1]
        values[key] = value
    return values


def env_value(values: dict[str, str], name: str, *, required: bool = False, default: str = "") -> str:
    value = values.get(name, "").strip()
    if value:
        return value
    if required:
        raise DeployError(f"Missing required .env value: {name}")
    return default


def split_markers(value: str) -> list[str]:
    return [part.strip() for part in value.split("|") if part.strip()]


def split_commands(value: str) -> list[str]:
    return [part.strip() for part in value.split("|") if part.strip()]


def build_config(values: dict[str, str], args: argparse.Namespace) -> DeployConfig:
    ready_markers = split_markers(args.ready_markers or env_value(values, "PVF_DEPLOY_READY_MARKERS"))
    ready_text = args.ready_text or env_value(values, "PVF_DEPLOY_READY_TEXT")
    if not ready_markers and ready_text:
        ready_markers = [ready_text]
    if not ready_markers:
        ready_markers = list(DEFAULT_READY_MARKERS)

    timeout = args.startup_timeout_seconds
    if timeout is None:
        timeout = int(env_value(values, "PVF_DEPLOY_STARTUP_TIMEOUT_SECONDS", default="420"))

    grace = args.startup_grace_seconds
    if grace is None:
        grace = int(env_value(values, "PVF_DEPLOY_STARTUP_GRACE_SECONDS", default="10"))

    stop_settle = int(env_value(values, "PVF_DEPLOY_STOP_SETTLE_SECONDS", default="0"))
    post_start_settle = int(env_value(values, "PVF_DEPLOY_POST_START_SETTLE_SECONDS", default="0"))

    post_start_commands: list[str] = []
    post_start_commands.extend(split_commands(env_value(values, "CHANNEL_CFG_RESTART")))
    post_start_commands.extend(split_commands(env_value(values, "AUCTION_CFG_RESTART")))
    post_start_commands.extend(split_commands(env_value(values, "PVF_DEPLOY_POST_START_COMMANDS")))

    return DeployConfig(
        client_pvf_path=env_value(values, "CLIENT_PVF_PATH", required=True),
        server_pvf_path=env_value(values, "SERVER_PVF_PATH", required=True),
        ssh_host=env_value(values, "SSH_HOST", required=True),
        ssh_port=int(env_value(values, "SSH_PORT", default="22")),
        ssh_user=env_value(values, "SSH_USER", required=True),
        ssh_pass=env_value(values, "SSH_PASS"),
        stop_command=env_value(values, "STOP_COMMAND", required=True),
        start_command=env_value(values, "START_COMMAND", required=True),
        ready_markers=ready_markers,
        startup_timeout_seconds=timeout,
        startup_grace_seconds=grace,
        stop_settle_seconds=stop_settle,
        post_start_settle_seconds=post_start_settle,
        post_start_commands=post_start_commands,
        marker_probe_command=env_value(values, "PVF_DEPLOY_MARKER_PROBE_COMMAND")
        or env_value(values, "PVF_DEPLOY_MARKER_LOG_COMMAND")
        or env_value(values, "PVF_DEPLOY_READY_MARKER_LOG_COMMAND"),
        output_encoding=env_value(values, "PVF_DEPLOY_OUTPUT_ENCODING", default="utf-8"),
        ssh_key_path=env_value(values, "SSH_KEY_PATH"),
    )


def validate_pvf(path: Path) -> Path:
    resolved = path.resolve()
    if not resolved.is_file():
        raise DeployError(f"Deployment artifact must be a file: {resolved}")
    if resolved.suffix.lower() != ".pvf":
        raise DeployError(f"Deployment artifact must be a .pvf file: {resolved}")
    if resolved.stat().st_size <= 0:
        raise DeployError(f"Deployment artifact is empty: {resolved}")
    return resolved


def copy_client_pvf(source: Path, destination: str) -> None:
    dest = Path(destination)
    if not dest.parent.is_dir():
        raise DeployError(f"Client PVF parent directory does not exist: {dest.parent}")
    shutil.copy2(source, dest)


def import_paramiko():
    try:
        import paramiko  # type: ignore
    except ImportError as exc:
        raise DeployError(
            "Python dependency 'paramiko' is not installed. Install the SSH dependency set "
            "(paramiko plus cryptography, bcrypt, PyNaCl, cffi, pycparser, six)."
        ) from exc
    return paramiko


def connect_ssh(config: DeployConfig):
    paramiko = import_paramiko()
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    kwargs = {
        "hostname": config.ssh_host,
        "port": config.ssh_port,
        "username": config.ssh_user,
        "timeout": 20,
        "banner_timeout": 20,
        "auth_timeout": 20,
        "look_for_keys": not bool(config.ssh_pass or config.ssh_key_path),
        "allow_agent": not bool(config.ssh_pass or config.ssh_key_path),
    }
    if config.ssh_pass:
        kwargs["password"] = config.ssh_pass
    if config.ssh_key_path:
        kwargs["key_filename"] = config.ssh_key_path

    try:
        client.connect(**kwargs)
    except Exception as exc:  # Paramiko exposes several auth/socket subclasses.
        client.close()
        raise DeployError(f"SSH connection failed: {exc}") from exc
    return client


def ensure_remote_parent(sftp, remote_path: str) -> None:
    parent = PurePosixPath(remote_path).parent.as_posix()
    try:
        sftp.stat(parent)
    except OSError as exc:
        raise DeployError(f"Remote PVF parent directory does not exist: {parent}") from exc


def upload_server_pvf(ssh_client, source: Path, remote_path: str) -> None:
    sftp = ssh_client.open_sftp()
    try:
        ensure_remote_parent(sftp, remote_path)
        sftp.put(str(source), remote_path)
    finally:
        sftp.close()


def append_log(log_path: Path, text: str) -> None:
    if text:
        with log_path.open("a", encoding="utf-8", newline="") as handle:
            handle.write(text)


def missing_markers(text: str, markers: Iterable[str]) -> list[str]:
    return [marker for marker in markers if marker not in text]


def shell_quote(value: str) -> str:
    return "'" + value.replace("'", "'\"'\"'") + "'"


def build_remote_start_probe_command(
    command: str,
    *,
    remote_log_path: str,
    markers: list[str],
    timeout_seconds: int,
    grace_seconds: int,
    post_start_commands: list[str],
    post_start_settle_seconds: int,
    marker_probe_command: str,
) -> str:
    if not markers:
        return command

    remote_log = shell_quote(remote_log_path)
    marker_checks = " && ".join(
        f"grep -F -- {shell_quote(marker)} \"$__pvf_start_log\" >/dev/null 2>&1"
        for marker in markers
    )
    marker_reports = "\n".join(
        "if ! grep -F -- "
        + shell_quote(marker)
        + ' "$__pvf_start_log" >/dev/null 2>&1; then echo '
        + shell_quote(f"PVF_DEPLOY_MISSING_MARKER: {marker}")
        + "; fi"
        for marker in markers
    )
    post_start_block = "\n".join(
        f"echo {shell_quote(f'PVF_DEPLOY_POST_START_COMMAND_{index}=BEGIN')} >> \"$__pvf_start_log\"\n"
        + f"({post_start_command}) >> \"$__pvf_start_log\" 2>&1\n"
        + "__pvf_post_status=$?\n"
        + f"echo {shell_quote(f'PVF_DEPLOY_POST_START_COMMAND_{index}=STATUS:')}$__pvf_post_status >> \"$__pvf_start_log\""
        for index, post_start_command in enumerate(post_start_commands, start=1)
    )
    settle_block = ""
    if post_start_settle_seconds > 0:
        settle_block = f"sleep {int(post_start_settle_seconds)}"

    marker_probe_block = ""
    if marker_probe_command:
        marker_probe_block = f"""
  (
{marker_probe_command}
  ) >> "$__pvf_start_log" 2>&1
""".rstrip()

    # Run the start wrapper behind a durable remote log. Some environments return
    # immediately after backgrounding services; others keep a foreground process
    # attached. Polling the log while the start command runs covers both shapes.
    return f"""
__pvf_start_log={remote_log}
rm -f "$__pvf_start_log"
: > "$__pvf_start_log" || exit 125
(
{command}
echo "PVF_DEPLOY_REMOTE_START_STATUS=$?"
) >> "$__pvf_start_log" 2>&1 &
__pvf_start_pid=$!
{post_start_block}
{settle_block}
__pvf_deadline=$(( $(date +%s) + {int(timeout_seconds)} ))
__pvf_ready_seen=0
while [ "$(date +%s)" -le "$__pvf_deadline" ]; do
{marker_probe_block}
  if {marker_checks}; then
    if [ "$__pvf_ready_seen" -eq 0 ]; then
      __pvf_ready_seen=$(date +%s)
    fi
    if [ $(( $(date +%s) - $__pvf_ready_seen )) -ge {int(grace_seconds)} ]; then
      cat "$__pvf_start_log"
      exit 0
    fi
  else
    __pvf_ready_seen=0
  fi
  sleep 1
done
cat "$__pvf_start_log"
if kill -0 "$__pvf_start_pid" >/dev/null 2>&1; then
  echo "PVF_DEPLOY_REMOTE_START_PROCESS=still-running"
else
  echo "PVF_DEPLOY_REMOTE_START_PROCESS=exited"
fi
{marker_reports}
exit 124
""".strip()


def run_remote_command(
    ssh_client,
    command: str,
    log_path: Path,
    *,
    encoding: str,
    timeout_seconds: int | None = None,
    success_markers: list[str] | None = None,
    success_grace_seconds: int = 10,
) -> None:
    transport = ssh_client.get_transport()
    if transport is None or not transport.is_active():
        raise DeployError("SSH transport is not active.")

    channel = transport.open_session()
    channel.set_combine_stderr(True)
    channel.exec_command(command)

    started = time.monotonic()
    ready_seen_at: float | None = None
    buffer = ""
    success_markers = success_markers or []

    log_path.parent.mkdir(parents=True, exist_ok=True)
    log_path.write_text("", encoding="utf-8")

    while True:
        while channel.recv_ready():
            chunk = channel.recv(65535)
            decoded = chunk.decode(encoding, errors="replace")
            buffer += decoded
            append_log(log_path, decoded)

        if success_markers and not missing_markers(buffer, success_markers):
            if ready_seen_at is None:
                ready_seen_at = time.monotonic()
            if time.monotonic() - ready_seen_at >= success_grace_seconds:
                channel.close()
                return

        if channel.exit_status_ready():
            while channel.recv_ready():
                chunk = channel.recv(65535)
                decoded = chunk.decode(encoding, errors="replace")
                buffer += decoded
                append_log(log_path, decoded)
            break

        if timeout_seconds is not None and time.monotonic() - started > timeout_seconds:
            channel.close()
            raise DeployError(f"Command timed out after {timeout_seconds} seconds. Log: {log_path}")

        time.sleep(0.25)

    exit_status = channel.recv_exit_status()
    channel.close()

    if success_markers:
        missing = missing_markers(buffer, success_markers)
        if missing:
            raise DeployError(
                "Command completed but readiness marker(s) were not found: "
                + " | ".join(missing)
                + f". Log: {log_path}"
            )
    elif exit_status != 0:
        raise DeployError(f"Command failed with exit code {exit_status}. Log: {log_path}")


def show_popup(message: str, *, no_popup: bool) -> None:
    if no_popup or os.name != "nt":
        return

    try:
        import ctypes

        ctypes.windll.user32.MessageBoxW(None, message, "PVF deploy complete", 0x40)
    except Exception:
        print("Warning: desktop popup is unavailable on this host.", file=sys.stderr)


def build_arg_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Deploy a generated Script.pvf with Paramiko SSH/SFTP.")
    parser.add_argument("--pvf", required=True, help="Generated output Script.pvf to deploy.")
    parser.add_argument("--env", help="Path to .env. Defaults to <workbench>/.env.")
    parser.add_argument("--confirm-deploy", action="store_true", help="Required safety confirmation.")
    parser.add_argument("--skip-client-copy", action="store_true")
    parser.add_argument("--skip-server-upload", action="store_true")
    parser.add_argument("--no-popup", action="store_true")
    parser.add_argument("--startup-timeout-seconds", type=int)
    parser.add_argument("--startup-grace-seconds", type=int)
    parser.add_argument("--ready-markers", default="", help="Readiness markers separated by '|'.")
    parser.add_argument("--ready-text", default="", help="Backward-compatible single readiness marker.")
    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_arg_parser()
    args = parser.parse_args(argv)

    if not args.confirm_deploy:
        raise DeployError(
            "Refusing to deploy without --confirm-deploy. This action overwrites the configured "
            "client PVF, uploads to the configured server PVF, and restarts the game service."
        )

    script_dir = Path(__file__).resolve().parent
    workbench_root = resolve_workbench_root(script_dir)
    env_path = Path(args.env).resolve() if args.env else workbench_root / ".env"
    source_pvf = validate_pvf(Path(args.pvf))
    env_values = parse_dotenv(env_path)
    config = build_config(env_values, args)

    run_id = datetime.now().strftime("%Y%m%d-%H%M%S")
    log_dir = Path(tempfile.gettempdir()) / "pvf-post-deploy" / run_id
    log_dir.mkdir(parents=True, exist_ok=True)

    print(f"PVF deploy artifact: {source_pvf}")
    print(f"Deployment logs: {log_dir}")
    print("Readiness markers: " + " | ".join(config.ready_markers))

    if not args.skip_client_copy:
        copy_client_pvf(source_pvf, config.client_pvf_path)
        print("Client PVF overwritten.")

    if not args.skip_server_upload:
        ssh_client = connect_ssh(config)
        try:
            print("Uploading PVF with Paramiko SFTP.")
            upload_server_pvf(ssh_client, source_pvf, config.server_pvf_path)

            print("Stopping game service.")
            run_remote_command(
                ssh_client,
                config.stop_command,
                log_dir / "stop.log",
                encoding=config.output_encoding,
            )
            if config.stop_settle_seconds > 0:
                print(f"Waiting {config.stop_settle_seconds} second(s) after stop.")
                time.sleep(config.stop_settle_seconds)

            print("Starting game service and waiting for readiness markers.")
            remote_start_log = f"/tmp/pvf-post-deploy-start-{run_id}.log"
            start_command = build_remote_start_probe_command(
                config.start_command,
                remote_log_path=remote_start_log,
                markers=config.ready_markers,
                timeout_seconds=config.startup_timeout_seconds,
                grace_seconds=config.startup_grace_seconds,
                post_start_commands=config.post_start_commands,
                post_start_settle_seconds=config.post_start_settle_seconds,
                marker_probe_command=config.marker_probe_command,
            )
            run_remote_command(
                ssh_client,
                start_command,
                log_dir / "start.log",
                encoding=config.output_encoding,
                timeout_seconds=config.startup_timeout_seconds + config.startup_grace_seconds + 30,
                success_markers=config.ready_markers,
                success_grace_seconds=config.startup_grace_seconds,
            )
        finally:
            ssh_client.close()

    message = "PVF deploy complete. Server readiness markers detected: " + " | ".join(config.ready_markers)
    show_popup(message, no_popup=args.no_popup)
    print(message)
    print(f"Logs: {log_dir}")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (DeployError, ValueError, socket.error) as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        raise SystemExit(1)
