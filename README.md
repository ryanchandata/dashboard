# Project Dashboard

Single-page dashboard to start/stop local projects and manage Cloudflare tunnels from a centralized interface.

## Features

- 🚀 Start/stop local projects with a single click
- 🌐 Manage Cloudflare trycloudflare tunnels
- 📊 Real-time project status monitoring
- 🔧 Configurable project setup
- 📝 Built-in logging and state management
- 🧪 Comprehensive test suite with coverage reporting

## Architecture

The dashboard is built with a modular architecture:

```
dashboard/
├── src/
│   ├── app.js                 # Express application setup
│   ├── server.js              # Server entry point
│   ├── config/                # Configuration management
│   ├── middleware/            # Express middleware
│   ├── routes/                # API endpoints
│   ├── services/              # Business logic
│   │   ├── projectLifecycle.js  # Project start/stop
│   │   ├── tunnelLifecycle.js   # Tunnel management
│   │   ├── stateService.js      # State persistence
│   │   ├── configService.js     # Config loading
│   │   └── logService.js        # Logging
│   ├── utils/                 # Utility functions
│   └── __tests__/             # Test suite
│       ├── fixtures/          # Test data and mocks
│       └── utils/             # Test utilities
├── public/                    # Static frontend files
├── dashboard.config.json      # Project configuration
└── state.json                 # Runtime state (auto-generated)
```

## Setup

### Prerequisites

- Node.js 20+ (v22.22.0 recommended)
- npm 10+
- Cloudflare account (for tunnel features)

### Installation

1. Clone or navigate to the project:
```bash
cd /home/ryan/.openclaw/workspace/projects/dashboard
```

2. Install dependencies:
```bash
npm install
```

3. Configure your projects (see Configuration section below)

## Configuration

### Project Configuration (dashboard.config.json)

Edit `dashboard.config.json` to add/remove projects:

```json
{
  "port": 8787,
  "projects": [
    {
      "id": "project-id",
      "name": "Display Name",
      "dir": "../relative/path/to/project",
      "start": "npm start",
      "stop": "npm stop",
      "port": 3000
    }
  ]
}
```

**Configuration Options:**
- `port`: Dashboard server port (default: 8787)
- `projects[].id`: Unique project identifier (required)
- `projects[].name`: Display name in dashboard (required)
- `projects[].dir`: Relative or absolute path to project directory (required)
- `projects[].start`: Command to start the project (required)
- `projects[].stop`: Command to stop the project (optional, auto-kill if not provided)
- `projects[].port`: Project's local port (optional, for reference)

### Environment Variables

Create a `.env` file (or set environment variables) to override defaults:

```bash
# Server configuration
NODE_ENV=production        # development, test, or production
PORT=8787                  # Dashboard server port
LOG_DIR=./logs            # Directory for log files
STATE_FILE=./state.json   # State persistence file
```

Example `.env` file:
```
NODE_ENV=development
PORT=8787
LOG_DIR=./logs
STATE_FILE=./state.json
```

## Running the Dashboard

### Development

Run with hot-reload using nodemon:

```bash
npm run dev
```

The dashboard will restart automatically when you change server code.

### Production

Run the optimized production server:

```bash
npm start
```

The dashboard will be available at:
- **Local**: http://127.0.0.1:8787
- **Network**: http://<YOUR_IP>:8787

## Testing

Run the comprehensive test suite:

```bash
# Run all tests once
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch
```

### Test Coverage

Tests include:
- Unit tests for configuration, middleware, and services
- Integration tests for API endpoints
- Process lifecycle management tests
- State persistence tests
- Mock utilities for file I/O and process spawning

Test output includes:
- Test results (passed/failed)
- Coverage reports (lines, functions, branches)
- Coverage report HTML: `coverage/lcov-report/index.html`

## API Endpoints

### Projects

**GET /api/projects**
- Get list of all projects with current status
- Response: `{ projects: [{ id, name, isRunning, pid }] }`

**POST /api/projects/:id/start**
- Start a project
- Response: `{ success: true, pid: <process_id> }`

**POST /api/projects/:id/stop**
- Stop a running project
- Response: `{ success: true }`

**GET /api/projects/:id/status**
- Get status of a specific project
- Response: `{ isRunning: boolean, pid: number|null }`

### Configuration

**GET /api/config**
- Get current dashboard configuration
- Response: `{ port, env, projects: [...] }`

## File Structure

### State File (state.json)

The dashboard automatically creates and manages `state.json` to track running processes:

```json
{
  "projects": {
    "project-id": {
      "isRunning": true,
      "pid": 12345,
      "lastStarted": 1675000000000,
      "lastStopped": null
    }
  },
  "tunnels": {
    "tunnel-id": {
      "isRunning": false,
      "pid": null,
      "url": null
    }
  }
}
```

### Log Directory

Logs are stored in the `logs/` directory by default:
- `logs/combined.log` - All log entries
- `logs/error.log` - Error entries only

Logs are useful for debugging project startup issues.

## Cloudflare Tunnel Setup (Optional)

To expose your dashboard to the internet using a custom domain:

### 1. Install Cloudflare CLI

```bash
# macOS
brew install cloudflared

# Linux
curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared.deb

# Windows
# Download from https://github.com/cloudflare/cloudflared/releases
```

### 2. Create Tunnel (one-time)

```bash
cloudflared tunnel login
cloudflared tunnel create dashboard
cloudflared tunnel route dns dashboard dashboard.yourdomain.com
```

Get your tunnel UUID:
```bash
cloudflared tunnel list
```

### 3. Create Config File

Create `/home/ryan/.openclaw/workspace/projects/dashboard/cloudflared-dashboard.yml`:

```yaml
# Cloudflare tunnel configuration
url: http://127.0.0.1:8787

# Your tunnel UUID from cloudflared tunnel list
tunnel: <YOUR_TUNNEL_UUID>
credentials-file: /home/ryan/.cloudflared/<YOUR_UUID>.json

ingress:
  - hostname: dashboard.yourdomain.com
    service: http://127.0.0.1:8787
  - service: http_status:404
```

### 4. Run Tunnel

```bash
cloudflared tunnel run --config cloudflared-dashboard.yml dashboard
```

Access your dashboard at: https://dashboard.yourdomain.com

### Troubleshooting Tunnels

**"Connection refused" error:**
- Ensure the dashboard server is running on port 8787
- Check that no firewall is blocking localhost:8787

**"Tunnel authentication failed":**
- Run `cloudflared tunnel login` again
- Verify the credentials file exists at `~/.cloudflared/<UUID>.json`

**"DNS record not created":**
- Manually add a CNAME record in Cloudflare DNS pointing to your tunnel
- Example: `dashboard.yourdomain.com` → `<tunnel-id>.cfargotunnel.com`

## Troubleshooting

### Dashboard won't start

**Error: "Port 8787 already in use"**
- Change the port in `dashboard.config.json` or set `PORT=<new_port>`
- Or kill the existing process: `lsof -ti :8787 | xargs kill -9`

**Error: "Cannot find project directory"**
- Check the `dir` path in `dashboard.config.json`
- Paths are relative to the dashboard root directory
- Use absolute paths if relative paths don't work

### Projects won't start

**Error: "start command not found"**
- Verify the `start` command in `dashboard.config.json` is correct
- Test the command manually in the project directory:
  ```bash
  cd <project-dir>
  <start-command>
  ```

**Error: "Permission denied"**
- Ensure the script file has execute permissions:
  ```bash
  chmod +x <script-name>
  ```

**Projects stuck in "running" state**
- Check the process manually: `ps aux | grep <project-name>`
- Update state.json to set `"isRunning": false` for stuck processes
- Restart the dashboard

### Testing issues

**Tests fail with module not found**
- Ensure all dependencies are installed: `npm install`
- Clear Node cache: `rm -rf node_modules && npm install`

**Coverage report missing**
- Run: `npm test` (coverage report is generated automatically)
- View: `open coverage/lcov-report/index.html`

## Development Tips

### Adding a New Service

1. Create `src/services/myService.js`
2. Export functions that other modules can import
3. Add unit tests in `src/services/myService.test.js` or `src/__tests__/`
4. Update relevant API routes if needed

### Adding a New API Endpoint

1. Create or update a file in `src/routes/`
2. Define your route handler
3. Mount it in `src/app.js` with `app.use('/api/<route>', routerModule)`
4. Test with curl or a tool like Postman

### Debugging

Enable verbose logging:
```bash
NODE_ENV=development npm run dev
```

View logs:
```bash
# Live log output
tail -f logs/combined.log

# View error logs
cat logs/error.log
```

## Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Run production server |
| `npm run dev` | Run development server with hot-reload |
| `npm test` | Run full test suite with coverage |
| `npm run test:watch` | Run tests in watch mode |

## Performance Considerations

- **State file**: Keep `state.json` under 1MB for best performance
- **Log rotation**: Monitor `logs/` directory size, archive old logs if needed
- **Project count**: Dashboard works well with 5-20 projects
- **Memory**: Each spawned project process takes memory, monitor system resources

## Security Notes

- The dashboard should only be run on trusted networks or behind authentication
- Do not expose the dashboard to the public internet without Cloudflare protection
- Tunnel credentials (cloudflared config) should not be committed to version control
- Consider using environment variables for sensitive configuration

## Contributing

To contribute improvements:

1. Create a feature branch: `git checkout -b feature/my-feature`
2. Write tests for new functionality
3. Ensure all tests pass: `npm test`
4. Commit with descriptive messages: `git commit -m "Add feature X"`
5. Push and create a pull request

## License

Private project

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review logs in the `logs/` directory
3. Check process output for error messages

## Changelog

### v1.0.0 (Current)
- Initial release with project lifecycle management
- API endpoints for project control
- Cloudflare tunnel integration
- Comprehensive test suite
- Logging and state persistence
