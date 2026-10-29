#!/bin/sh
# out/<lang>/ → public/media/<lang>/ and out/<lang>/light/ → public/media/<lang>/light/:
# .webp screenshots, .mp4 recordings. A missing light set is skipped.
set -e
cd "$(dirname "$0")"
for L in en de; do
  for T in "" /light; do
    S=out/$L$T; M=../../public/media/$L$T
    [ -d "$S" ] || continue
    mkdir -p "$M"
    for v in hero-dashboard hero-board hero-issue; do
      read -r s d < "$S/$v.cut" || true   # .cut has no trailing newline
      ffmpeg -loglevel error -y -ss "$s" -i "$S/$v.webm" -t "$d" -an -c:v libx264 -preset slow -crf 24 \
        -pix_fmt yuv420p -vf "scale=1600:1000,fps=30" -movflags +faststart "$M/$v.mp4"
    done
    for n in board list dashboard views issue palette phone overview hero-dashboard-poster hero-board-poster hero-issue-poster; do
      ffmpeg -loglevel error -y -i "$S/$n.png" -c:v libwebp -quality 82 -compression_level 6 "$M/$n.webp"
    done
  done
done
