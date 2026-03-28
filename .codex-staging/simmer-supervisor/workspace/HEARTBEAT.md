# HEARTBEAT.md

Current phase: agent layer only.

On heartbeat:
- confirm agent config is installed
- do not attempt market scans
- do not attempt paper trades
- report `HEARTBEAT_OK` unless specifically asked about config status
