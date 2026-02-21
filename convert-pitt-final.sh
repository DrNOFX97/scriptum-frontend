#!/bin/bash

# THE PITT: Converter MKV → MP4 + Extrair PT-PT
# Versão funcional testada

SOURCE="/Volumes/D VIEIRA 7F/The Pitt"
OUTPUT="/Volumes/D VIEIRA 7F/The Pitt/MP4"

mkdir -p "$OUTPUT"

echo ""
echo "═══════════════════════════════════════════"
echo "  🎬 THE PITT - MKV → MP4 + PT SUBS"
echo "═══════════════════════════════════════════"
echo ""

# Contar ficheiros
total=$(find "$SOURCE" -name "*.mkv" -type f -not -name "._*" 2>/dev/null | wc -l | tr -d ' ')
echo "📊 Total: $total ficheiros"
echo "📁 Destino: $OUTPUT"
echo ""

current=0

find "$SOURCE" -name "*.mkv" -type f -not -name "._*" 2>/dev/null | sort | while IFS= read -r mkv; do
    current=$((current + 1))
    filename=$(basename "$mkv")
    name="${filename%.*}"

    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "[$current/$total] $filename"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    mp4="$OUTPUT/${name}.mp4"
    srt="$OUTPUT/${name}.srt"

    # 1. EXTRAIR LEGENDA PT-PT
    echo "📝 A procurar legendas PT..."

    # Encontrar stream PT
    por_stream=$(ffmpeg -i "$mkv" 2>&1 | grep "Stream.*Subtitle.*por" | head -1 | sed 's/.*Stream #0:\([0-9]*\).*/\1/')

    if [ -n "$por_stream" ]; then
        echo "   ✅ Encontrada no stream #0:$por_stream"
        ffmpeg -i "$mkv" -map "0:$por_stream" -c:s srt "$srt" -y >/dev/null 2>&1

        if [ -f "$srt" ] && [ -s "$srt" ]; then
            srt_size=$(du -h "$srt" | cut -f1)
            echo "   💾 Extraída: $srt_size"
        else
            echo "   ⚠️  Falha na extração"
            rm -f "$srt" 2>/dev/null
        fi
    else
        echo "   ⚠️  Legenda PT não encontrada"
    fi

    # 2. CONVERTER VÍDEO
    echo "🎬 A converter para MP4..."

    # Detectar codec de vídeo
    if ffmpeg -i "$mkv" 2>&1 | grep -q "Video: h264"; then
        echo "   ℹ️  Vídeo H.264 → copy (rápido)"
        vcodec="-c:v copy"
    else
        echo "   ℹ️  Vídeo HEVC → re-encode H.264"
        vcodec="-c:v libx264 -preset fast -crf 23"
    fi

    # Detectar codec áudio
    if ffmpeg -i "$mkv" 2>&1 | grep -q "Audio: aac"; then
        echo "   ℹ️  Áudio AAC → copy (rápido)"
        acodec="-c:a copy"
    else
        echo "   ℹ️  Áudio → AAC 192k"
        acodec="-c:a aac -b:a 192k"
    fi

    echo "   ⏳ A processar..."

    # Converter (só vídeo + áudio, sem legendas embutidas)
    ffmpeg -i "$mkv" \
        -map 0:v:0 -map 0:a:0 \
        $vcodec \
        $acodec \
        -movflags +faststart \
        "$mp4" \
        -y 2>&1 | grep -E "time=|speed=" | tail -1

    # Verificar resultado
    if [ -f "$mp4" ] && [ -s "$mp4" ]; then
        mkv_size=$(du -h "$mkv" | cut -f1)
        mp4_size=$(du -h "$mp4" | cut -f1)

        echo ""
        echo "   ✅ SUCESSO!"
        echo "   📦 Original: $mkv_size"
        echo "   📦 MP4:      $mp4_size"

        if [ -f "$srt" ]; then
            echo "   📝 SRT:      $(du -h "$srt" | cut -f1)"
        fi
    else
        echo "   ❌ ERRO na conversão!"
        rm -f "$mp4" 2>/dev/null
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

# Mostrar resultados
num_mp4=$(find "$OUTPUT" -name "*.mp4" -type f | wc -l | tr -d ' ')
num_srt=$(find "$OUTPUT" -name "*.srt" -type f | wc -l | tr -d ' ')

echo "📊 Resultado:"
echo "   • $num_mp4 ficheiros MP4"
echo "   • $num_srt ficheiros SRT (legendas PT)"
echo ""

# Listar primeiros 10
if [ "$num_mp4" -gt 0 ]; then
    echo "📂 Ficheiros MP4:"
    find "$OUTPUT" -name "*.mp4" -type f -exec basename {} \; | sort | head -10
    echo ""
fi

if [ "$num_srt" -gt 0 ]; then
    echo "📝 Ficheiros SRT:"
    find "$OUTPUT" -name "*.srt" -type f -exec basename {} \; | sort | head -10
    echo ""
fi

echo "✅ Pronto para copiar para TV LG!"
echo ""
