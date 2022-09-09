# dotfiles

My dotfiles.

## Install

```shell
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
brew install dotbot
```

```shell
git clone https://github.com/chriskacerguis/dotfiles.git ~/.dotfiles
dotbot -d ~/.dotfiles -c ~/.dotfiles/install.conf.yaml 
```

### For NodeJS
```shell
asdf install nodejs latest
asdf global nodejs latest
```
