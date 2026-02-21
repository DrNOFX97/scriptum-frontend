#!/bin/bash

# THE PITT - Conversão MKV → MP4 com GPU (VideoToolbox)
# Processa 3 ficheiros em simultâneo usando aceleração GPU

SOURCE="/Volumes/D VIEIRA 7F/The Pitt"
OUTPUT="/Volumes/D VIEIRA 7F/The Pitt/MP4"
MAX_JOBS=3  # 3 conversões simultâneas (GPU)

mkdir -p "$OUTPUT"

echo ""
echo "═══════════════════════════════════════════"
echo "  🎬 THE PITT - GPU ACCELERATED"
echo "═══════════════════════════════════════════"
echo "⚡ VideoToolbox (Apple Silicon GPU)"
echo "🔄 $MAX_JOBS conversões simultâneas"
echo ""

# Função para converter um ficheiro
convert_one() {
    mkv="$1"
    num="$2"
    total="$3"

    filename=$(basename "$mkv")
    name="${filename%.*}"

    mp4="$OUTPUT/${name}.mp4"
    srt="$OUTPUT/${name}.srt"
    log="$OUTPUT/.${name}.log"

    # Skip se já existe
    if [ -f "$mp4" ] && [ -s "$mp4" ]; then
        echo "[$num/$total] ⏭️  $filename (já existe)"
        return 0
    fi

    (
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "[$num/$total] $filename"
        echo "$(date '+%H:%M:%S') Iniciado"
        echo ""

        # 1. Extrair legenda PT
        por_stream=$(ffmpeg -i "$mkv" 2>&1 | grep -i "Stream.*Subtitle.*\(por\|pt\)" | head -1 | sed 's/.*Stream #0:\([0-9]*\).*/\1/')

        if [ -n "$por_stream" ]; then
            echo "📝 Extraindo PT stream #0:$por_stream..."
            ffmpeg -i "$mkv" -map "0:$por_stream" -c:s srt "$srt" -y >/dev/null 2>&1

            if [ -f "$srt" ] && [ -s "$srt" ]; then
                echo "✅ Legenda PT: $(du -h "$srt" | cut -f1)"
            else
                rm -f "$srt" 2>/dev/null
            fi
        fi

        # 2. Detectar codecs
        video_info=$(ffmpeg -i "$mkv" 2>&1 | grep "Stream.*Video")
        audio_info=$(ffmpeg -i "$mkv" 2>&1 | grep "Stream.*Audio" | head -1)

        if echo "$video_info" | grep -q "h264"; then
            echo "🎬 Vídeo: H.264 → copy"
            vcodec="-c:v copy"
        else
            echo "🎬 Vídeo: HEVC → H.264 (VideoToolbox GPU)"
            vcodec="-c:v h264_videotoolbox -b:v 5M -allow_sw 1"
        fi

        if echo "$audio_info" | grep -q "aac"; then
            echo "🔊 Áudio: AAC → copy"
            acodec="-c:a copy"
        else
            echo "🔊 Áudio: → AAC 192k"
            acodec="-c:a aac -b:a 192k"
        fi

        # 3. Converter
        echo ""
        echo "⏳ A converter..."
        ffmpeg -i "$mkv" \
            -map 0:v:0 -map 0:a:0 \
            $vcodec \
            $acodec \
            -movflags +faststart \
            -y "$mp4" 2>&1 | grep -E "(time=|error)" | tail -5

        # 4. Verificar
        echo ""
        if [ -f "$mp4" ] && [ -s "$mp4" ]; then
            size=$(du -h "$mp4" | cut -f1)
            echo "✅ SUCESSO: $size"
            echo "$(date '+%H:%M:%S') Concluído"
        else
            echo "❌ ERRO"
            rm -f "$mp4" 2>/dev/null
        fi

    ) > "$log" 2>&1

    # Feedback no terminal
    if [ -f "$mp4" ] && [ -s "$mp4" ]; then
        size=$(du -h "$mp4" | cut -f1)
        echo "[$num/$total] ✅ $filename → $size"
    else
        echo "[$num/$total] ❌ $filename (ver $log)"
    fi
}

export -f convert_one
export SOURCE OUTPUT

# Contar ficheiros reais (sem ._ metadata)
total=$(find "$SOURCE" -name "*.mkv" -type f -not -name "._*" 2>/dev/null | wc -l | tr -d ' ')

echo "📊 Total: $total ficheiros MKV"
echo "📁 Output: $OUTPUT"
echo ""
echo "🚀 A iniciar conversões..."
echo ""

# Processar em paralelo usando GNU parallel ou xargs
if command -v parallel >/dev/null 2>&1; then
    # Usar GNU parallel se disponível (melhor)
    find "$SOURCE" -name "*.mkv" -type f -not -name "._*" 2>/dev/null | \
        sort | \
        cat -n | \
        parallel --colsep '\t' -j $MAX_JOBS convert_one {2} {1} $total
else
    # Fallback para xargs
    find "$SOURCE" -name "*.mkv" -type f -not -name "._*" 2>/dev/null | \
        sort | \
        awk '{print NR, "'$total'", $0}' | \
        xargs -n 3 -P $MAX_JOBS sh -c 'convert_one "$3" "$1" "$2"' _
fi

echo ""
echo "═══════════════════════════════════════════"
echo "✅ CONCLUÍDO!"
echo "═══════════════════════════════════════════"
echo ""

# Estatísticas
num_mp4=$(find "$OUTPUT" -name "*.mp4" -type f -size +1M 2>/dev/null | wc -l | tr -d ' ')
num_srt=$(find "$OUTPUT" -name "*.srt" -type f -size +100 2>/dev/null | wc -l | tr -d ' ')
total_size=$(du -sh "$OUTPUT" 2>/dev/null | cut -f1)

echo "📊 Resultado:"
echo "   • $num_mp4 de $total ficheiros MP4"
echo "   • $num_srt legendas PT"
echo "   • $total_size total"
echo ""

if [ "$num_mp4" -lt "$total" ]; then
    failed=$((total - num_mp4))
    echo "⚠️  $failed ficheiros falharam"
    echo "   Ver logs: ls -lh \"$OUTPUT\"/.*.log"
    echo ""
fi

echo "📂 Ficheiros em: $OUTPUT"
echo ""
echo "✅ Pronto para TV LG!"
echo ""
