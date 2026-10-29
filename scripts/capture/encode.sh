#!/bin/sh
# out/<lang>/ → public/media/<lang>/: .webp screenshots, .mp4 recordings.
set -e
cd "$(dirname "$0")"
for L in en de; do
  M=../../public/media/$L; mkdir -p "$M"
  for v in hero-dashboard hero-board hero-issue; do
    read -r s d < "out/$L/$v.cut"
    ffmpeg -loglevel error -y -ss "$s" -i "out/$L/$v.webm" -t "$d" -an -c:v libx264 -preset slow -crf 24 \
      -pix_fmt yuv420p -vf "scale=1600:1000,fps=30" -movflags +faststart "$M/$v.mp4"
  done
  for n in board list dashboard views issue palette phone overview hero-dashboard-poster hero-board-poster hero-issue-poster; do
    ffmpeg -loglevel error -y -i "out/$L/$n.png" -c:v libwebp -quality 82 -compression_level 6 "$M/$n.webp"
  done
done
