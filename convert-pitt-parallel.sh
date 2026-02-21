#!/bin/bash

# THE PITT - Conversão PARALELA MKV → MP4
# Processa 4 ficheiros em simultâneo para acelerar

SOURCE="/Volumes/D VIEIRA 7F/The Pitt"
OUTPUT="/Volumes/D VIEIRA 7F/The Pitt/MP4"
MAX_PARALLEL=4  # Número de conversões simultâneas

mkdir -p "$OUTPUT"

echo ""
echo "═══════════════════════════════════════════"
echo "  🎬 THE PITT - CONVERSÃO PARALELA"
echo "═══════════════════════════════════════════"
echo "⚡ $MAX_PARALLEL conversões simultâneas"
echo ""

# Função para converter um ficheiro
convert_file() {
    local mkv="$1"
    local current="$2"
    local total="$3"

    filename=$(basename "$mkv")
    name="${filename%.*}"

    mp4="$OUTPUT/${name}.mp4"
    srt="$OUTPUT/${name}.srt"

    # Log file para este processo
    log="$OUTPUT/.${name}.log"

    {
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "[$current/$total] $filename"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "$(date '+%H:%M:%S') Iniciado"

        # Extrair legenda PT
        por_stream=$(ffmpeg -i "$mkv" 2>&1 | grep "Stream.*Subtitle.*por" | head -1 | sed 's/.*Stream #0:\([0-9]*\).*/\1/')

        if [ -n "$por_stream" ]; then
            echo "📝 Extraindo PT do stream #0:$por_stream..."
            ffmpeg -i "$mkv" -map "0:$por_stream" -c:s srt "$srt" -y >/dev/null 2>&1

            if [ -f "$srt" ] && [ -s "$srt" ]; then
                echo "✅ Legenda: $(du -h "$srt" | cut -f1)"
            else
                rm -f "$srt" 2>/dev/null
            fi
        fi

        # Detectar codecs
        if ffmpeg -i "$mkv" 2>&1 | grep -q "Video: h264"; then
            echo "🎬 H.264 → copy"
            vcodec="-c:v copy"
        else
            echo "🎬 HEVC → H.264"
            vcodec="-c:v libx264 -preset fast -crf 23"
        fi

        if ffmpeg -i "$mkv" 2>&1 | grep -q "Audio: aac"; then
            acodec="-c:a copy"
        else
            acodec="-c:a aac -b:a 192k"
        fi

        # Converter
        echo "⏳ A converter..."
        ffmpeg -i "$mkv" \
            -map 0:v:0 -map 0:a:0 \
            $vcodec \
            $acodec \
            -movflags +faststart \
            "$mp4" \
            -y 2>&1 | grep "time=" | tail -1

        # Verificar
        if [ -f "$mp4" ] && [ -s "$mp4" ]; then
            mp4_size=$(du -h "$mp4" | cut -f1)
            echo "✅ SUCESSO: $mp4_size"
            echo "$(date '+%H:%M:%S') Concluído"
        else
            echo "❌ ERRO"
            rm -f "$mp4" 2>/dev/null
        fi

    } > "$log" 2>&1

    # Mostrar progresso no terminal principal
    if [ -f "$mp4" ] && [ -s "$mp4" ]; then
        echo "[$current/$total] ✅ $filename → $(du -h "$mp4" | cut -f1)"
    else
        echo "[$current/$total] ❌ $filename"
    fi
}

export -f convert_file
export SOURCE OUTPUT

# Listar todos os ficheiros e contar
total=$(find "$SOURCE" -name "*.mkv" -type f -not -name "._*" 2>/dev/null | wc -l | tr -d ' ')

echo "📊 Total: $total ficheiros"
echo "📁 Output: $OUTPUT"
echo ""
echo "🚀 A iniciar conversões em paralelo..."
echo ""

# Processar em paralelo usando xargs diretamente
find "$SOURCE" -name "*.mkv" -type f -not -name "._*" 2>/dev/null | \
    sort | \
    nl | \
    awk -v tot="$total" '{print $1, tot, $2}' | \
    xargs -n 3 -P $MAX_PARALLEL bash -c 'convert_file "$2" "$0" "$1"'

echo ""
echo "═══════════════════════════════════════════"
echo "✅ CONVERSÕES CONCLUÍDAS!"
echo "═══════════════════════════════════════════"
echo ""

# Resumo
num_mp4=$(find "$OUTPUT" -name "*.mp4" -type f -size +1M 2>/dev/null | wc -l | tr -d ' ')
num_srt=$(find "$OUTPUT" -name "*.srt" -type f -size +1k 2>/dev/null | wc -l | tr -d ' ')
total_size=$(du -sh "$OUTPUT" 2>/dev/null | cut -f1)

echo "📊 Resultado:"
echo "   • $num_mp4 de $total ficheiros MP4 convertidos"
echo "   • $num_srt legendas PT extraídas"
echo "   • $total_size total"
echo ""

if [ "$num_mp4" -lt "$total" ]; then
    echo "⚠️  Alguns ficheiros falharam (ver logs em $OUTPUT/.*.log)"
    echo ""
fi

echo "📂 Ficheiros em: $OUTPUT"
echo ""

# Mostrar logs de erros se houver
if ls "$OUTPUT"/.*.log >/dev/null 2>&1; then
    echo "📝 Logs detalhados em: $OUTPUT/.*.log"
    echo "   (use: cat \"$OUTPUT\"/.Nome-Ficheiro.log para ver detalhes)"
    echo ""
fi

echo "✅ Pronto para TV LG!"
echo ""

# Cleanup logs antigos (opcional)
# find "$OUTPUT" -name ".*.log" -mtime +7 -delete 2>/dev/null
