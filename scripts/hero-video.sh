#!/usr/bin/env bash
# Genera el video de fondo del hero a partir del video institucional:
# toma tramos sin gráficos, recorta la franja inferior de subtítulos (y > 1180 px)
# y los une con fundidos. Dos versiones: escritorio (panorámica) y móvil (vertical).
# Uso (desde WebSite_COH, con ffmpeg instalado): bash scripts/hero-video.sh
set -euo pipefail

SRC="_originales/img/video_inicio_final/General.mp4"
OUT="public/img/hero"
FF="${FFMPEG:-ffmpeg}"
FADE=0.8

# inicio  duración  x_movil(recorte vertical centrado en el sujeto)  descripción
SEGS=(
  "1.8   5.8  900   montaña con niebla"
  "84.3  3.5  640   productor con planta en el vivero"
  "26.8  4.7  980   saco SHG y laboratorio de catación"
  "57.6  5.8  900   granos tostados y tostadora"
  "68.1  5.8  820   detalle de tostadora y granos"
  "1.8   $FADE 900  cierre: inicio de la montaña (bucle sin salto)"
)

render () {  # $1 = nombre, $2 = filtro de recorte/escala (usa {X} para el x del recorte móvil), $3 = crf
  local name=$1 cropexpr=$2 crf=$3
  local inputs=() filters="" chain="" offset=0 prev="" i=0
  for seg in "${SEGS[@]}"; do
    read -r start dur xm _ <<<"$seg"
    inputs+=(-ss "$start" -t "$dur" -i "$SRC")
    local f=${cropexpr//\{X\}/$xm}
    filters+="[$i:v]$f,fps=30,format=yuv420p,setsar=1,setpts=PTS-STARTPTS[v$i];"
    if [ $i -eq 0 ]; then
      prev="v0"; offset=$dur
    else
      offset=$(awk "BEGIN{print $offset - $FADE}")
      chain+="[$prev][v$i]xfade=transition=fade:duration=$FADE:offset=$offset[x$i];"
      prev="x$i"; offset=$(awk "BEGIN{print $offset + $dur}")
    fi
    i=$((i+1))
  done
  "$FF" -v error -y "${inputs[@]}" -filter_complex "${filters}${chain%;}" -map "[$prev]" \
    -an -c:v libx264 -crf "$crf" -preset slow -profile:v high -pix_fmt yuv420p -movflags +faststart \
    "$OUT/$name.mp4"
  # portada (primer fotograma) para que el hero se vea al instante
  "$FF" -v error -y -i "$OUT/$name.mp4" -frames:v 1 -q:v 3 "$OUT/$name-portada.jpg"
  echo "$OUT/$name.mp4 listo"
}

render hero-escritorio "crop=2560:1180:0:0,scale=1600:-2" 31
render hero-movil      "crop=760:1180:{X}:0,scale=720:-2"  31
