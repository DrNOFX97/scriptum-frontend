#!/bin/bash

# Script para converter série The Pitt de MKV para MP4 + extrair legendas PT-PT

SOURCE_DIR="/Volumes/D VIEIRA 7F/The Pitt"
OUTPUT_DIR="/Volumes/D VIEIRA 7F/The Pitt/MP4"

# Criar directório de output
mkdir -p "$OUTPUT_DIR"

# Contar ficheiros (busca recursiva)
total=$(find "$SOURCE_DIR" -name "*.mkv" -type f | wc -l)
current=0

echo "🎬 Encontrados $total ficheiros MKV"
echo "📁 Output: $OUTPUT_DIR"
echo ""

# Processar cada ficheiro MKV (recursivo)
find "$SOURCE_DIR" -name "*.mkv" -type f | sort | while read mkv_file; do
    current=$((current + 1))
    filename=$(basename "$mkv_file")
    name="${filename%.*}"

    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "[$current/$total] 🎥 $filename"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    # Output paths
    mp4_output="$OUTPUT_DIR/${name}.mp4"
    srt_output="$OUTPUT_DIR/${name}.srt"

    # 1. Extrair legendas PT-PT (se existir)
    echo "📝 A procurar legendas PT-PT..."

    # Listar streams de legendas
    ffmpeg -i "$mkv_file" 2>&1 | grep "Subtitle" | grep -i "por\|pt-PT\|pt-BR\|portuguese" | head -1 | while read line; do
        # Extrair índice do stream (ex: Stream #0:3)
        stream_index=$(echo "$line" | grep -o "Stream #[0-9]:[0-9]*" | cut -d: -f2)

        if [ -n "$stream_index" ]; then
            echo "   ✅ Encontrada legenda PT no stream #0:$stream_index"
            echo "   💾 A extrair para: ${name}.srt"

            ffmpeg -i "$mkv_file" -map "0:$stream_index" -c:s srt "$srt_output" -y 2>&1 | grep -E "time=|error" | tail -1

            if [ -f "$srt_output" ]; then
                echo "   ✅ Legenda extraída com sucesso"
            else
                echo "   ⚠️  Falha ao extrair legenda"
            fi
        fi
    done

    # 2. Converter vídeo para MP4
    echo ""
    echo "🎬 A converter para MP4..."
    echo "   Codec: H.264 (copy se já for H.264)"
    echo "   Áudio: AAC (copy se já for AAC)"

    # Detectar codec de vídeo
    video_codec=$(ffmpeg -i "$mkv_file" 2>&1 | grep "Video:" | head -1)

    if echo "$video_codec" | grep -q "h264"; then
        echo "   ℹ️  Vídeo já é H.264 - usando stream copy (rápido)"
        vcodec="copy"
    else
        echo "   ℹ️  Vídeo precisa ser re-encodado"
        vcodec="libx264 -preset fast -crf 23"
    fi

    # Detectar codec de áudio
    audio_codec=$(ffmpeg -i "$mkv_file" 2>&1 | grep "Audio:" | head -1)

    if echo "$audio_codec" | grep -q "aac"; then
        echo "   ℹ️  Áudio já é AAC - usando stream copy (rápido)"
        acodec="copy"
    else
        echo "   ℹ️  Áudio precisa ser convertido para AAC"
        acodec="aac -b:a 192k"
    fi

    echo ""
    echo "   ⏳ A processar..."

    # Converter (sem legendas embutidas)
    ffmpeg -i "$mkv_file" \
        -map 0:v:0 -map 0:a:0 \
        -c:v $vcodec \
        -c:a $acodec \
        -movflags +faststart \
        "$mp4_output" \
        -y 2>&1 | grep -E "time=|speed=|error" | tail -3

    if [ -f "$mp4_output" ]; then
        # Mostrar tamanhos
        mkv_size=$(du -h "$mkv_file" | cut -f1)
        mp4_size=$(du -h "$mp4_output" | cut -f1)

        echo ""
        echo "   ✅ Conversão completa!"
        echo "   📦 MKV original: $mkv_size"
        echo "   📦 MP4 final:    $mp4_size"

        if [ -f "$srt_output" ]; then
            srt_size=$(du -h "$srt_output" | cut -f1)
            echo "   📝 SRT:          $srt_size"
        fi
    else
        echo "   ❌ ERRO na conversão!"
    fi

    echo ""
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ PROCESSO COMPLETO!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📁 Ficheiros convertidos em: $OUTPUT_DIR"
echo ""
echo "Para usar na TV LG:"
echo "  - Copie os ficheiros .mp4 e .srt para pendrive/disco"
echo "  - Na TV, navegue até aos ficheiros"
echo "  - Os .srt serão detectados automaticamente"
echo ""
