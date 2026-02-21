#!/bin/bash

# Extrair legendas PT-PT de todos os ficheiros

SOURCE="/Volumes/D VIEIRA 7F/The Pitt"
OUTPUT="/Volumes/D VIEIRA 7F/The Pitt/MP4"

echo ""
echo "🔍 A procurar legendas PT-PT..."
echo ""

count=0

find "$SOURCE" -name "*.mkv" -type f -not -name "._*" 2>/dev/null | sort | while IFS= read -r mkv; do
    filename=$(basename "$mkv")
    name="${filename%.*}"
    srt="$OUTPUT/${name}.srt"

    # Skip se já existe
    if [ -f "$srt" ] && [ -s "$srt" ]; then
        echo "⏭️  $name (já existe)"
        continue
    fi

    # Procurar stream PT
    por_stream=$(ffmpeg -i "$mkv" 2>&1 | grep "Subtitle" | grep "por" | head -1 | sed 's/.*Stream #0:\([0-9]*\).*/\1/')

    if [ -n "$por_stream" ]; then
        echo "📝 Extraindo $name (stream #$por_stream)..."
        if ffmpeg -i "$mkv" -map "0:$por_stream" -c:s srt "$srt" -y >/dev/null 2>&1; then
            if [ -f "$srt" ] && [ -s "$srt" ]; then
                size=$(du -h "$srt" | cut -f1)
                echo "   ✅ $size"
                count=$((count + 1))
            else
                rm -f "$srt" 2>/dev/null
                echo "   ⚠️  Erro"
            fi
        else
            echo "   ⚠️  Falha ffmpeg"
        fi
    fi
done

echo ""
echo "✅ Pronto! Legendas extraídas."
echo ""
