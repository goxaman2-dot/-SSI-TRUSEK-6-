FROM mcr.microsoft.com/devcontainers/javascript-node:22-bullseye

# Install additional tools if needed
RUN su vscode -c "cd /workspaces/${DEV_CONTAINER_WORKSPACE_FOLDER || 'workspace'} && npm install -g npm@latest"

WORKDIR /workspaces/${DEV_CONTAINER_WORKSPACE_FOLDER || 'workspace'}
