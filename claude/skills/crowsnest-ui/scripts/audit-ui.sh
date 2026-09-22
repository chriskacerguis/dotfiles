#!/usr/bin/env bash
#
# Report how far an existing React frontend is from the house design system.
#
# Read-only: it changes nothing, it just tells you the size of the job. Run it
# before starting a migration, and again afterwards to see what is left.
#
#   ./audit-ui.sh [path-to-src]        # defaults to ./src, or ./frontend/src
#
set -uo pipefail

SRC="${1:-}"
if [ -z "$SRC" ]; then
  if   [ -d "frontend/src" ]; then SRC="frontend/src"
  elif [ -d "src" ];          then SRC="src"
  else echo "No src/ or frontend/src/ here. Pass the path explicitly." >&2; exit 1
  fi
fi

JSX=(--include=*.jsx --include=*.js)
RAW_PALETTE='(bg|text|border|ring|from|to|via)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-[0-9]{2,3}'

rule() { printf '\n\033[1m%s\033[0m\n' "$1"; }
count() { grep -rE "${JSX[@]}" -o "$1" "$SRC" 2>/dev/null | wc -l | tr -d ' '; }

echo "Auditing $SRC against the house design system"

rule "Setup"
for check in \
  "lib/utils.js:cn() helper" \
  "lib/variants.js:cva variant maps" \
  "lib/api.js:single API client" \
  "components/ui:copied-in primitives" \
  "components/StateViews.jsx:loading/error/empty states" \
  "contexts/ThemeContext.jsx:theme provider"
do
  path="${check%%:*}"; label="${check#*:}"
  if [ -e "$SRC/$path" ]; then printf '  \033[32m✓\033[0m %s\n' "$label"
  else printf '  \033[31m✗\033[0m %s \033[2m(%s)\033[0m\n' "$label" "$path"; fi
done

for f in tailwind.config.js tailwind.config.mjs frontend/tailwind.config.js; do
  [ -f "$f" ] || continue
  if grep -q 'hsl(var(--' "$f"; then printf '  \033[32m✓\033[0m semantic colour tokens in %s\n' "$f"
  else printf '  \033[31m✗\033[0m %s has no hsl(var(--…)) tokens\n' "$f"; fi
  if grep -q 'data-theme' "$f"; then printf '  \033[32m✓\033[0m data-theme dark mode\n'
  else printf '  \033[31m✗\033[0m no data-theme dark mode strategy\n'; fi
  if grep -A3 content "$f" | grep -qE "src/\*\*|lib/"; then
    printf '  \033[32m✓\033[0m content glob reaches lib/ (cva classes survive purging)\n'
  else
    printf '  \033[33m!\033[0m content glob may not cover lib/ — cva classes would be purged in production only\n'
  fi
  break
done

# Raw colours inside the variant maps are the system working as designed: that
# is where meaning-colours are supposed to live. Only count the ones elsewhere.
countOutsideVariants() {
  grep -rE "${JSX[@]}" -o "$1" "$SRC" 2>/dev/null | grep -v 'lib/variants' | wc -l | tr -d ' '
}

rule "Off-system styling"
printf '  %-6s raw palette colours outside lib/variants.js \033[2m(these want tokens)\033[0m\n' \
  "$(countOutsideVariants "$RAW_PALETTE")"
printf '  %-6s of those are neutrals \033[2m(mechanical to convert)\033[0m\n' \
  "$(countOutsideVariants '(bg|text|border)-(slate|gray|zinc|neutral|stone)-[0-9]{2,3}')"
printf '  %-6s meaning-colours inside lib/variants.js \033[2m(expected — this is where they belong)\033[0m\n' \
  "$(grep -rE "${JSX[@]}" -o "$RAW_PALETTE" "$SRC" 2>/dev/null | grep -c 'lib/variants' | tr -d ' ')"
printf '  %-6s class strings built with template literals instead of cn()\n' \
  "$(grep -rE "${JSX[@]}" -o 'className={`' "$SRC" 2>/dev/null | wc -l | tr -d ' ')"
printf '  %-6s dark: variants present\n' "$(count 'dark:')"

rule "Most common raw colours"
grep -rE "${JSX[@]}" -o "$RAW_PALETTE" "$SRC" 2>/dev/null | grep -v 'lib/variants' \
  | cut -d: -f2- | sort | uniq -c | sort -rn | head -12 | sed 's/^/  /'
[ "$(countOutsideVariants "$RAW_PALETTE")" = "0" ] && printf '  \033[32m✓\033[0m none outside the variant maps\n'

rule "Conventions"
printf '  %-6s direct fetch() calls outside lib/\n' \
  "$(grep -rE "${JSX[@]}" -l 'fetch(' "$SRC" 2>/dev/null | grep -v '/lib/' | wc -l | tr -d ' ')"
printf '  %-6s files using tabular-nums\n' "$(grep -rlE "${JSX[@]}" 'tabular-nums' "$SRC" 2>/dev/null | wc -l | tr -d ' ')"
printf '  %-6s icon-only buttons without an aria-label (approx)\n' \
  "$(grep -rE "${JSX[@]}" -c 'size="icon"' "$SRC" 2>/dev/null | awk -F: '{s+=$2} END {print s+0}')"

if [ -d "$SRC/pages" ]; then
  rule "Pages with no empty or error state \033[2m(check each — some legitimately need neither)\033[0m"
  missing=$(grep -rLE "${JSX[@]}" 'EmptyState|ErrorState' "$SRC/pages" 2>/dev/null || true)
  if [ -z "$missing" ]; then printf '  \033[32m✓\033[0m every page handles them\n'
  else echo "$missing" | sed 's|^|  |'; fi
fi

rule "Competing UI libraries"
found=0
for pkg in @mui/material @chakra-ui/react antd react-bootstrap semantic-ui-react styled-components @emotion/react; do
  if grep -rqE "${JSX[@]}" "from '$pkg" "$SRC" 2>/dev/null; then
    printf '  \033[33m!\033[0m %s is in use — this is a rewrite, not a migration. Confirm scope first.\n' "$pkg"
    found=1
  fi
done
[ "$found" -eq 0 ] && printf '  \033[32m✓\033[0m none found\n'

printf '\nNext: references/adoption.md has the ordered migration path.\n'
