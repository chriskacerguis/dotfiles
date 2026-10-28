# The following lines were added by Docker Desktop to add commands to your PATH.
export PATH="$PATH:/Users/chriskacerguis/.docker/bin"
# End of Docker Desktop section.

# Fix for Workbrew Installs
if [ -d "/opt/workbrew" ]; then
  autoload -U compinit && compinit -u
fi

# Homebrew
if [ -d "/opt/homebrew" ]; then
  eval "$(/opt/homebrew/bin/brew shellenv)"
elif [ -d "~/.linuxbrew" ]; then
  eval "$(~/.linuxbrew/bin/brew shellenv)"
elif [ -d "/home/linuxbrew" ]; then
  eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
fi
