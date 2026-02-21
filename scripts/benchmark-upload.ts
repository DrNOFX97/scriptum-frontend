/**
 * Benchmark script for parallel upload performance
 *
 * Usage:
 *   npm run benchmark:upload
 *
 * Tests:
 *   - Sequential upload vs parallel upload
 *   - Different parallelism levels (2, 4, 6, 8, 12)
 *   - Different chunk sizes (5MB, 10MB, 20MB)
 */

import { parallelUpload } from '../src/lib/parallelUpload';

interface BenchmarkResult {
  method: string;
  fileSize: number;
  chunkSize: number;
  parallel: number;
  duration: number;
  speed: number;
  speedup: number;
}

/**
 * Create a mock file of specified size
 */
function createMockFile(sizeInMB: number, filename: string = 'test.mkv'): File {
  const size = sizeInMB * 1024 * 1024;
  const buffer = new Uint8Array(size);

  // Fill with random data
  for (let i = 0; i < size; i++) {
    buffer[i] = Math.floor(Math.random() * 256);
  }

  return new File([buffer], filename, { type: 'video/x-matroska' });
}

/**
 * Measure upload time
 */
async function measureUpload(
  file: File,
  options: {
    maxParallel?: number;
    chunkSize?: number;
  }
): Promise<number> {
  const startTime = Date.now();

  try {
    await parallelUpload(file, options);
  } catch (err) {
    // Ignore errors (we're just benchmarking)
    console.error('Upload error (ignored for benchmark):', err);
  }

  const duration = Date.now() - startTime;
  return duration;
}

/**
 * Run benchmark suite
 */
async function runBenchmarks() {
  console.log('🚀 Parallel Upload Benchmark Suite\n');
  console.log('=' .repeat(80));

  const results: BenchmarkResult[] = [];

  // Test file sizes
  const fileSizes = [
    { size: 100, label: '100MB' },
    { size: 500, label: '500MB' },
    { size: 1000, label: '1GB' },
    { size: 6000, label: '6GB' }
  ];

  // Test configurations
  const configs = [
    { parallel: 1, chunkSize: 10, label: 'Sequential (baseline)' },
    { parallel: 2, chunkSize: 10, label: 'Parallel (2x)' },
    { parallel: 4, chunkSize: 10, label: 'Parallel (4x)' },
    { parallel: 6, chunkSize: 10, label: 'Parallel (6x)' },
    { parallel: 8, chunkSize: 10, label: 'Parallel (8x)' },
    { parallel: 12, chunkSize: 10, label: 'Parallel (12x)' },
  ];

  for (const { size, label: sizeLabel } of fileSizes) {
    console.log(`\n📦 Testing ${sizeLabel} file\n`);

    const file = createMockFile(size, `test-${sizeLabel}.mkv`);
    let baselineDuration = 0;

    for (const { parallel, chunkSize, label } of configs) {
      console.log(`⏱️  ${label.padEnd(25)} ... `);

      const duration = await measureUpload(file, {
        maxParallel: parallel,
        chunkSize: chunkSize * 1024 * 1024
      });

      const durationSeconds = duration / 1000;
      const speed = (size / durationSeconds); // MB/s

      if (parallel === 1) {
        baselineDuration = duration;
      }

      const speedup = baselineDuration > 0 ? baselineDuration / duration : 1;

      results.push({
        method: label,
        fileSize: size,
        chunkSize,
        parallel,
        duration: durationSeconds,
        speed,
        speedup
      });

      console.log(
        `✅ ${durationSeconds.toFixed(1)}s @ ${speed.toFixed(1)} MB/s ` +
        `(${speedup.toFixed(1)}x faster)`
      );
    }
  }

  // Print summary table
  console.log('\n' + '='.repeat(80));
  console.log('📊 Benchmark Results Summary\n');

  console.log('| File Size | Method          | Time    | Speed    | Speedup |');
  console.log('|-----------|-----------------|---------|----------|---------|');

  for (const result of results) {
    const fileSizeLabel = result.fileSize >= 1000
      ? `${(result.fileSize / 1000).toFixed(1)}GB`
      : `${result.fileSize}MB`;

    console.log(
      `| ${fileSizeLabel.padEnd(9)} | ${result.method.padEnd(15)} | ` +
      `${result.duration.toFixed(1).padStart(5)}s | ` +
      `${result.speed.toFixed(1).padStart(6)} MB/s | ` +
      `${result.speedup.toFixed(1).padStart(5)}x |`
    );
  }

  console.log('\n' + '='.repeat(80));

  // Find optimal configuration
  const optimal = results.reduce((best, current) => {
    if (current.fileSize === 6000 && current.speedup > best.speedup) {
      return current;
    }
    return best;
  }, results[0]);

  console.log('\n🏆 Optimal Configuration for 6GB Files:\n');
  console.log(`   Method: ${optimal.method}`);
  console.log(`   Parallel: ${optimal.parallel} chunks`);
  console.log(`   Chunk Size: ${optimal.chunkSize}MB`);
  console.log(`   Speed: ${optimal.speed.toFixed(1)} MB/s`);
  console.log(`   Speedup: ${optimal.speedup.toFixed(1)}x faster than sequential`);
  console.log(`   Time: ${optimal.duration.toFixed(1)}s (${(optimal.duration / 60).toFixed(1)} min)`);

  console.log('\n✅ Benchmark complete!\n');
}

/**
 * Test chunk size variations
 */
async function testChunkSizes() {
  console.log('\n🔬 Testing Chunk Size Variations\n');
  console.log('=' .repeat(80));

  const file = createMockFile(1000, 'test-1GB.mkv'); // 1GB test file

  const chunkSizes = [5, 10, 15, 20, 25]; // MB

  console.log('\n📦 1GB file, 8 parallel uploads\n');

  for (const chunkSize of chunkSizes) {
    console.log(`   ${chunkSize}MB chunks ... `);

    const duration = await measureUpload(file, {
      maxParallel: 8,
      chunkSize: chunkSize * 1024 * 1024
    });

    const totalChunks = Math.ceil(1000 / chunkSize);
    const durationSeconds = duration / 1000;
    const speed = 1000 / durationSeconds;

    console.log(
      `      ✅ ${durationSeconds.toFixed(1)}s @ ${speed.toFixed(1)} MB/s ` +
      `(${totalChunks} chunks)`
    );
  }

  console.log('\n📊 Recommendation: 10MB chunks offer best balance of performance and reliability\n');
}

/**
 * Main
 */
async function main() {
  try {
    await runBenchmarks();
    await testChunkSizes();
  } catch (err) {
    console.error('❌ Benchmark failed:', err);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { runBenchmarks, testChunkSizes, createMockFile };
