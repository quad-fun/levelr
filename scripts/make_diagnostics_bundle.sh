#!/bin/sh
# Create diagnostics folder with ONE output per source file.
# Each begins with a header showing the original path.
# Usage (from repo root):
#   sh scripts/make_diagnostics_by_file.sh
# Output:
#   diagnostics/**/<file>.diag.txt
#   diagnostics/INDEX.md

set -eu

# Ensure repo root (needs src/ present)
if [ ! -d "src" ]; then
  printf '%s\n' "Error: run this from the repository root (directory containing src/)." >&2
  exit 1
fi

OUT_DIR="diagnostics"
rm -rf "$OUT_DIR"
mkdir -p "$OUT_DIR"

timestamp="$(date -u '+%Y-%m-%dT%H:%M:%SZ')"

# ---- Curated file list ----
FILES=$(cat <<'EOF'
src/lib/analysis/csi-analyzer.ts
src/lib/analysis/market-analyzer.ts
src/lib/analysis/risk-analyzer.ts
src/lib/document-processor.ts
src/lib/claude.ts
src/lib/claude-client.ts
src/lib/rfp/rfp-generator.ts
src/lib/analysis/export-generator.ts
src/components/analysis/ExportTools.tsx
src/components/rfp/RFPExportTools.tsx
src/app/analyze/page.tsx
src/app/page.tsx
src/app/docs/page.tsx
src/components/analysis/DocumentUpload.tsx
src/components/analysis/AnalysisResults.tsx
src/components/analysis/BidLeveling.tsx
src/components/analysis/AnalysisHistory.tsx
src/components/rfp/RFPBuilder.tsx
src/components/rfp/ScopeBuilder.tsx
src/components/rfp/ScopeFrameworkBuilder.tsx
src/components/rfp/CommercialTermsBuilder.tsx
src/components/rfp/ProjectSetupWizard.tsx
src/components/rfp/RFPPreview.tsx
src/app/api/claude/route.ts
src/app/api/rfp/generate/route.ts
src/app/api/blob/upload/route.ts
src/app/api/blob/delete/route.ts
EOF
)

# Build an INDEX.md
INDEX="$OUT_DIR/INDEX.md"
{
  printf '%s\n' '# Diagnostics Bundle'
  printf '%s\n' ""
  printf '%s\n' "- Generated: $timestamp (UTC)"
  printf '%s\n' "- Each file mirrors its source, with a header indicating the original path."
  printf '%s\n' ""
  printf '%s\n' '## Files'
  printf '%s\n' ""
} > "$INDEX"

# For each file, write <name>.diag.txt into diagnostics/
echo "$FILES" | while IFS= read -r src; do
  [ -z "$src" ] && continue

  out_path="$OUT_DIR/${src}.diag.txt"
  out_dir="$(dirname "$out_path")"
  mkdir -p "$out_dir"

  if [ -f "$src" ]; then
    {
      printf '%s\n' '=============================='
      printf '%s\n' ' DIAGNOSTICS FILE'
      printf '%s\n' " Generated: $timestamp"
      printf '%s\n' '=============================='
      printf '%s\n' ""
      printf '%s\n' "ORIGINAL PATH: $src"
      printf '%s\n' ""
      printf '%s\n' '================================================================'
      printf '%s\n' "BEGIN CONTENT: $src"
      printf '%s\n' '================================================================'
      printf '%s'   ""  # no newline—next 'cat' provides content
      cat "$src"
      printf '\n%s\n' '================================================================'
      printf '%s\n' "END CONTENT: $src"
      printf '%s\n' '================================================================'
    } > "$out_path"

    rel="${src}.diag.txt"
    # Use %s format so the leading '-' in Markdown is not parsed as an option
    printf '%s\n' "- [$src]($rel)" >> "$INDEX"
  else
    {
      printf '%s\n' '=============================='
      printf '%s\n' ' DIAGNOSTICS FILE (MISSING SOURCE)'
      printf '%s\n' " Generated: $timestamp"
      printf '%s\n' '=============================='
      printf '%s\n' ""
      printf '%s\n' "ORIGINAL PATH: $src"
      printf '%s\n' ""
      printf '%s\n' '*** WARNING: Source file not found at build time. ***'
    } > "$out_path"

    printf '%s\n' "- $src (**missing**, placeholder at ${src}.diag.txt)" >> "$INDEX"
    printf '%s\n' "Warning: $src not found; placeholder written to $out_path" >&2
  fi
done

printf '%s\n' "Diagnostics written to: $OUT_DIR"
printf '%s\n' "See $INDEX for a clickable list."