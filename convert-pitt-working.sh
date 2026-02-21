#!/bin/bash

# THE PITT - Conversão MKV → MP4 com VideoToolbox
# Versão FUNCIONAL que lida com espaços nos caminhos

SOURCE="/Volumes/D VIEIRA 7F/The Pitt"
OUTPUT="/Volumes/D VIEIRA 7F/The Pitt/MP4"
MAX_JOBS=3  # Conversões simultâneas

mkdir -p "$OUTPUT"

echo ""
echo "═══════════════════════════════════════════"
echo "  🎬 THE PITT - CONVERSÃO GPU"
echo "═══════════════════════════════════════════"
echo "⚡ VideoToolbox (Apple Silicon GPU)"
echo "🔄 $MAX_JOBS conversões simultâneas"
echo ""

# Ficheiro temporário para lista de conversões
tmplist="/tmp/pitt-convert-$$"
trap "rm -f $tmplist" EXIT

# Criar lista de ficheiros a processar
find "$SOURCE" -name "*.mkv" -type f -not -name "._*" 2>/dev/null | sort > "$tmplist"

total=$(wc -l < "$tmplist" | tr -d ' ')

echo "📊 Total: $total ficheiros MKV"
echo "📁 Output: $OUTPUT"
echo ""
echo "🚀 A iniciar conversões..."
echo ""

# Função para processar um ficheiro
process_file() {
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
        echo "[$num/$total] ⏭️  $filename"
        return 0
    fi

    {
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "[$num/$total] $filename"
        echo "$(date '+%H:%M:%S') Iniciado"
        echo ""

        # Extrair legenda PT
        por_stream=$(ffmpeg -i "$mkv" 2>&1 | grep -iE "Stream.*Subtitle.*(por|pt-PT|pt)" | head -1 | sed 's/.*Stream #0:\([0-9]*\).*/\1/')

        if [ -n "$por_stream" ]; then
            echo "📝 Extraindo PT stream #0:$por_stream..."
            if ffmpeg -i "$mkv" -map "0:$por_stream" -c:s srt "$srt" -y >/dev/null 2>&1; then
                if [ -f "$srt" ] && [ -s "$srt" ]; then
                    echo "✅ Legenda: $(du -h "$srt" | cut -f1)"
                else
                    rm -f "$srt" 2>/dev/null
                fi
            fi
        fi

        # Detectar codec de vídeo
        if ffmpeg -i "$mkv" 2>&1 | grep -q "Video: h264"; then
            echo "🎬 H.264 → copy"
            vcodec="-c:v copy"
        else
            echo "🎬 HEVC → H.264 (GPU)"
            # VideoToolbox com fallback para software
            vcodec="-c:v h264_videotoolbox -b:v 5M -allow_sw 1"
        fi

        # Detectar codec de áudio
        if ffmpeg -i "$mkv" 2>&1 | grep -q "Audio: aac"; then
            echo "🔊 AAC → copy"
            acodec="-c:a copy"
        else
            echo "🔊 → AAC 192k"
            acodec="-c:a aac -b:a 192k"
        fi

        # Converter
        echo ""
        echo "⏳ Convertendo..."
        if ffmpeg -i "$mkv" \
            -map 0:v:0 -map 0:a:0 \
            $vcodec \
            $acodec \
            -movflags +faststart \
            -y "$mp4" 2>&1 | tee -a /tmp/ffmpeg-debug.log | grep -E "time=|speed=" | tail -5; then

            if [ -f "$mp4" ] && [ -s "$mp4" ]; then
                size=$(du -h "$mp4" | cut -f1)
                echo ""
                echo "✅ SUCESSO: $size"
                echo "$(date '+%H:%M:%S') Concluído"
            else
                echo ""
                echo "❌ ERRO: ficheiro vazio"
                rm -f "$mp4" 2>/dev/null
            fi
        else
            echo ""
            echo "❌ ERRO: ffmpeg falhou"
            rm -f "$mp4" 2>/dev/null
        fi

    } > "$log" 2>&1

    # Feedback
    if [ -f "$mp4" ] && [ -s "$mp4" ]; then
        size=$(du -h "$mp4" | cut -f1)
        echo "[$num/$total] ✅ $filename → $size"
    else
        echo "[$num/$total] ❌ $filename"
    fi
}

export -f process_file
export SOURCE OUTPUT

# Processar com controlo de jobs paralelos
current=0
running_jobs=0

while IFS= read -r mkv; do
    current=$((current + 1))

    # Iniciar processo em background
    process_file "$mkv" "$current" "$total" &
    running_jobs=$((running_jobs + 1))

    # Aguardar se atingiu o máximo de jobs
    if [ $running_jobs -ge $MAX_JOBS ]; then
        wait -n  # Aguarda que um job termine
        running_jobs=$((running_jobs - 1))
    fi

done < "$tmplist"

# Aguardar todos os jobs restantes
wait

echo ""
echo "═══════════════════════════════════════════"
echo "✅ CONVERSÕES CONCLUÍDAS!"
echo "═══════════════════════════════════════════"
echo ""

# Estatísticas finais
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
    echo ""
    echo "📝 Logs de erro:"
    find "$OUTPUT" -name ".*.log" -type f -exec sh -c '
        if ! grep -q "SUCESSO" "$1"; then
            echo "   $(basename "$1")"
        fi
    ' _ {} \; | head -10
    echo ""
fi

echo "📂 Ficheiros em: $OUTPUT"
echo ""
echo "✅ Pronto para TV LG!"
echo ""
