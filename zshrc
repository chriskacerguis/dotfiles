# Aliases
[[ -f ~/.aliases ]] && source ~/.aliases

# Load Starship
[[ -f /opt/homebrew/bin/starship ]] && eval "$(starship init zsh)"

# asdf
[[ -f /opt/homebrew/opt/asdf/libexec/asdf.sh ]] && source /opt/homebrew/opt/asdf/libexec/asdf.sh
