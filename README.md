# Project Dashboard

Single-page dashboard to start/stop local projects and trycloudflare tunnels.

## Run

```bash
cd /home/ryan/.openclaw/workspace/projects/dashboard
npm start
```

Open: http://127.0.0.1:8787

## Config

Edit `dashboard.config.json` to add/remove projects.

## Cloudflare (custom domain)

To serve the dashboard at `dashboard.ryanhchan.info`, create a Cloudflare tunnel that points to the local dashboard server.

Example (once per machine):

```bash
cloudflared tunnel login
cloudflared tunnel create dashboard
cloudflared tunnel route dns dashboard dashboard.ryanhchan.info
```

Then create a config file (example path):

```yaml
# /home/ryan/.openclaw/workspace/projects/dashboard/cloudflared-dashboard.yml
url: http://127.0.0.1:8787

# Replace with your tunnel UUID from ~/.cloudflared
# credentials-file: /home/ryan/.cloudflared/<UUID>.json

tunnel: <UUID>
credentials-file: /home/ryan/.cloudflared/<UUID>.json

ingress:
  - hostname: dashboard.ryanhchan.info
    service: http://127.0.0.1:8787
  - service: http_status:404
```

Run:

```bash
cloudflared tunnel run --config /home/ryan/.openclaw/workspace/projects/dashboard/cloudflared-dashboard.yml dashboard
```
