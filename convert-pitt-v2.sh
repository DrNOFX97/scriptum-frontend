#!/bin/bash

# Converter The Pitt MKV → MP4 + extrair PT-PT

SOURCE="/Volumes/D VIEIRA 7F/The Pitt"
OUTPUT="/Volumes/D VIEIRA 7F/The Pitt/MP4"

mkdir -p "$OUTPUT"

# Contar ficheiros reais (ignorar ._ do macOS)
total=$(find "$SOURCE" -name "*.mkv" -type f ! -name "._*" | wc -l | tr -d ' ')
current=0

echo "═══════════════════════════════════════════"
echo "  🎬 CONVERSÃO THE PITT MKV → MP4"
echo "═══════════════════════════════════════════"
echo "📊 Total: $total ficheiros"
echo "📁 Output: $OUTPUT"
echo ""

# Processar ficheiros
find "$SOURCE" -name "*.mkv" -type f ! -name "._*" | sort | while IFS= read -r mkv; do
    current=$((current + 1))
    filename=$(basename "$mkv")
    name="${filename%.*}"

    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "[$current/$total] 🎥 $filename"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    # 1. Extrair legendas PT-PT
    echo "📝 A extrair legendas PT-PT..."
    ffmpeg -i "$mkv" \
        -map 0:v:0 -map 0:a:0 -map 0:s:m:language:por \
        -c:v libx264 -preset fast -crf 23 \
        -c:a aac -b:a 192k \
        -c:s srt \
        -movflags +faststart \
        "$OUTPUT/${name}.mp4" \
        -map 0:s:m:language:por -c:s srt "$OUTPUT/${name}.srt" \
        -y 2>&1 | grep -E "time=|speed=|error|Output" | tail -5

    if [ -f "$OUTPUT/${name}.mp4" ]; then
        echo "✅ Conversão completa!"
        ls -lh "$OUTPUT/${name}".{mp4,srt} 2>/dev/null | awk '{print "   📦", $9, "-", $5}'
    else
        echo "❌ ERRO - tentando método alternativo..."

        # Método alternativo: sem mapear legendas automaticamente
        ffmpeg -i "$mkv" \
            -map 0:v:0 -map 0:a:0 \
            -c:v libx264 -preset fast -crf 23 \
            -c:a aac -b:a 192k \
            -movflags +faststart \
            "$OUTPUT/${name}.mp4" \
            -y 2>&1 | grep -E "time=|speed=" | tail -3

        # Extrair PT separadamente
        por_stream=$(ffmpeg -i "$mkv" 2>&1 | grep -i "subtitle.*por" | head -1 | grep -o "#0:[0-9]*" | cut -d: -f2)

        if [ -n "$por_stream" ]; then
            echo "   📝 Extraindo legenda PT do stream #0:$por_stream..."
            ffmpeg -i "$mkv" -map "0:$por_stream" -c:s srt "$OUTPUT/${name}.srt" -y 2>&1 >/dev/null
        fi

        if [ -f "$OUTPUT/${name}.mp4" ]; then
            echo "✅ Conversão alternativa completa!"
            ls -lh "$OUTPUT/${name}".{mp4,srt} 2>/dev/null | awk '{print "   📦", $9, "-", $5}'
        fi
    fi

    echo ""
done

echo ""
echo "═══════════════════════════════════════════"
echo "✅ CONCLUÍDO!"
echo "═══════════════════════════════════════════"
echo ""
echo "📁 Ficheiros em: $OUTPUT"
echo ""
ls -1 "$OUTPUT" | grep -E "\.mp4$|\.srt$" | head -20
echo ""
