/**
 * Project Dashboard - Application Logic
 * Handles API communication, rendering, and user interactions
 */

/**
 * Fetch all projects from the API
 */
async function fetchProjects() {
  const res = await fetch('/api/projects');
  const data = await res.json();
  return data.projects || [];
}

/**
 * Post an action (start, stop, tunnel-start, tunnel-stop) for a project
 */
async function postAction(id, action) {
  await fetch(`/api/projects/${id}/${action}`, { method: 'POST' });
  await render();
}

/**
 * Fetch and display logs for a project
 */
async function viewLog(id, type) {
  const res = await fetch(`/api/projects/${id}/logs?type=${type}`);
  const data = await res.json();
  document.getElementById('logTitle').textContent = `${id} · ${type} log`;
  document.getElementById('logBody').textContent = data.logs || '(no log yet)';
  document.getElementById('logModal').classList.add('active');
}

/**
 * Close the log modal
 */
function closeModal(evt) {
  if (!evt || evt.target.id === 'logModal') {
    document.getElementById('logModal').classList.remove('active');
  }
}

/**
 * Render a single project card
 */
function renderCard(project) {
  const running = project.running;
  const tunnel = project.tunnelRunning;
  const tunnelUrl = project.tunnelUrl || '—';

  return `
    <div class="card">
      <div class="row">
        <div>
          <div style="font-size:18px; font-weight:600;">${project.name}</div>
          <div class="muted">Port ${project.port}</div>
        </div>
        <span class="pill ${running ? 'on' : 'off'}">${running ? 'RUNNING' : 'STOPPED'}</span>
      </div>
      <div class="stack">
        <div class="controls">
          <button class="primary" data-action="start" data-project-id="${project.id}">Start</button>
          <button class="danger" data-action="stop" data-project-id="${project.id}">Stop</button>
          <button data-action="view-log" data-project-id="${project.id}" data-log-type="app">App Log</button>
        </div>
        <div class="row">
          <span class="pill ${tunnel ? 'on' : 'off'}">${tunnel ? 'TUNNEL ON' : 'TUNNEL OFF'}</span>
          <div class="controls">
            <button class="primary" data-action="tunnel-start" data-project-id="${project.id}">Tunnel Start</button>
            <button class="danger" data-action="tunnel-stop" data-project-id="${project.id}">Tunnel Stop</button>
            <button data-action="view-log" data-project-id="${project.id}" data-log-type="tunnel">Tunnel Log</button>
          </div>
        </div>
        <div>
          <div class="muted">trycloudflare link</div>
          ${project.tunnelUrl ? `<a class="link" href="${project.tunnelUrl}" target="_blank">${project.tunnelUrl}</a>` : '<span class="muted">—</span>'}
        </div>
      </div>
    </div>
  `;
}

/**
 * Render all projects to the grid
 */
async function render() {
  const projects = await fetchProjects();
  const grid = document.getElementById('grid');
  grid.innerHTML = projects.map(renderCard).join('');
  attachEventListeners();
}

/**
 * Attach event listeners to dynamically created buttons
 */
function attachEventListeners() {
  // Handle action buttons
  document.querySelectorAll('button[data-action]').forEach(btn => {
    btn.addEventListener('click', function() {
      const action = this.dataset.action;
      const projectId = this.dataset.projectId;
      const logType = this.dataset.logType;

      if (action === 'view-log') {
        viewLog(projectId, logType);
      } else {
        postAction(projectId, action);
      }
    });
  });

  // Handle modal close button
  const closeBtn = document.querySelector('[data-action="close-modal"]');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeModal);
  }

  // Handle modal click-outside-to-close
  const modal = document.getElementById('logModal');
  if (modal) {
    modal.addEventListener('click', closeModal);
  }
}

/**
 * Initialize the dashboard
 */
async function init() {
  // Render projects on page load
  await render();

  // Auto-refresh every 10 seconds
  setInterval(render, 10000);
}

// Start the app when DOM is ready
document.addEventListener('DOMContentLoaded', init);
