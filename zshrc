# Node Version Manager
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"

# Aliases
[[ -f ~/.aliases ]] && source ~/.aliases

# Load Starship
[[ -f /opt/homebrew/bin/starship ]] && eval "$(starship init zsh)"
