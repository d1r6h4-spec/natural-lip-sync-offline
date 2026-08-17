import 'dart:io';

import 'package:ffmpeg_kit_flutter_new/ffmpeg_kit.dart';
import 'package:ffmpeg_kit_flutter_new/return_code.dart';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:path_provider/path_provider.dart';
import 'package:video_player/video_player.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const NaturalLipSyncApp());
}

class NaturalLipSyncApp extends StatelessWidget {
  const NaturalLipSyncApp({super.key});

  @override
  Widget build(BuildContext context) {
    const brandColor = Color(0xFF0B86A2);

    return MaterialApp(
      title: 'Natural Lip-Sync Offline',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(seedColor: brandColor),
        scaffoldBackgroundColor: const Color(0xFFF7FAFC),
        appBarTheme: const AppBarTheme(
          backgroundColor: Colors.white,
          foregroundColor: Color(0xFF17212B),
          elevation: 0,
          centerTitle: false,
        ),
      ),
      home: const HomeScreen(),
    );
  }
}

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  String? _videoPath;
  String? _audioPath;
  String? _outputPath;
  String _status = 'Pilih video dan audio untuk mulai.';
  String? _error;
  bool _isProcessing = false;
  VideoPlayerController? _previewController;

  @override
  void dispose() {
    _previewController?.dispose();
    super.dispose();
  }

  Future<void> _pickVideo() async {
    final file = await FilePicker.pickFile(type: FileType.video);
    if (!mounted || file == null) return;

    final path = file.path;
    if (path == null || path.isEmpty) {
      _showError('File video tidak memiliki path lokal yang dapat dibaca.');
      return;
    }

    setState(() {
      _videoPath = path;
      _outputPath = null;
      _error = null;
      _status = 'Video siap. Pilih audio untuk melanjutkan.';
    });
  }

  Future<void> _pickAudio() async {
    final file = await FilePicker.pickFile(type: FileType.audio);
    if (!mounted || file == null) return;

    final path = file.path;
    if (path == null || path.isEmpty) {
      _showError('File audio tidak memiliki path lokal yang dapat dibaca.');
      return;
    }

    setState(() {
      _audioPath = path;
      _outputPath = null;
      _error = null;
      _status = 'Audio siap. Tekan START LIP-SYNC untuk render offline.';
    });
  }

  Future<void> _startLipSync() async {
    final videoPath = _videoPath;
    final audioPath = _audioPath;
    if (videoPath == null || audioPath == null || _isProcessing) return;

    setState(() {
      _isProcessing = true;
      _error = null;
      _outputPath = null;
      _status = 'Menyiapkan FFmpeg offline...';
    });
    await _previewController?.dispose();
    _previewController = null;

    try {
      final documentsDirectory = await getApplicationDocumentsDirectory();
      final outputPath = '${documentsDirectory.path}/natural_lipsync_'
          '${DateTime.now().millisecondsSinceEpoch}.mp4';
      final outputFile = File(outputPath);
      if (await outputFile.exists()) {
        await outputFile.delete();
      }

      final command = '-y '
          '-i ${_quotePath(videoPath)} '
          '-i ${_quotePath(audioPath)} '
          '-c:v copy '
          '-map 0:v:0 '
          '-map 1:a:0 '
          '-shortest '
          '${_quotePath(outputPath)}';

      if (mounted) {
        setState(() => _status = 'FFmpeg sedang menggabungkan video dan audio...');
      }

      final session = await FFmpegKit.execute(command);
      final returnCode = await session.getReturnCode();
      final outputLog = await session.getOutput();
      final succeeded = ReturnCode.isSuccess(returnCode) && await outputFile.exists();

      if (!succeeded) {
        final logs = await session.getLogs();
        final detail = logs
            .map((log) => log.getMessage())
            .where((message) => message.trim().isNotEmpty)
            .toList()
            .reversed
            .take(8)
            .toList()
            .reversed
            .join('\n');
        throw Exception(
          'FFmpeg gagal (return code $returnCode).\n'
          '${detail.isEmpty ? outputLog ?? 'Tidak ada detail log.' : detail}',
        );
      }

      if (mounted) {
        setState(() {
          _outputPath = outputPath;
          _status = 'Lip-sync selesai. Video hasil siap diputar offline.';
        });
      }
      await _loadPreview(outputPath);
    } catch (error) {
      if (mounted) {
        setState(() {
          _error = error.toString().replaceFirst('Exception: ', '');
          _status = 'Render gagal. Periksa file input dan coba lagi.';
        });
      }
    } finally {
      if (mounted) {
        setState(() => _isProcessing = false);
      }
    }
  }

  Future<void> _loadPreview(String path) async {
    final controller = VideoPlayerController.file(File(path));
    try {
      await controller.initialize();
      await controller.setLooping(true);
      if (!mounted) {
        await controller.dispose();
        return;
      }
      setState(() => _previewController = controller);
    } catch (error) {
      await controller.dispose();
      if (mounted) {
        setState(() {
          _error = 'Video selesai dibuat, tetapi preview gagal dibuka: $error';
        });
      }
    }
  }

  String _quotePath(String path) {
    return "'${path.replaceAll("'", r"'\''")}'";
  }

  void _showError(String message) {
    if (!mounted) return;
    setState(() => _error = message);
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
  }

  String _fileName(String? path) {
    if (path == null || path.isEmpty) return 'Belum dipilih';
    return path.split(Platform.pathSeparator).last;
  }

  @override
  Widget build(BuildContext context) {
    final preview = _previewController;
    final previewReady = preview != null && preview.value.isInitialized;

    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Natural Lip-Sync v2.0.0 OFFLINE',
          style: TextStyle(fontWeight: FontWeight.w700),
        ),
        actions: const [
          Padding(
            padding: EdgeInsets.only(right: 16),
            child: Icon(Icons.wifi_off_rounded, color: Color(0xFF1B9A63)),
          ),
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(20, 20, 20, 32),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              _offlineReadyBadge(),
              const SizedBox(height: 16),
              const Text(
                'Buat video lip-sync\nlangsung di perangkat.',
                style: TextStyle(
                  fontSize: 30,
                  height: 1.12,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFF17212B),
                ),
              ),
              const SizedBox(height: 10),
              Text(
                'Semua proses berjalan offline dengan FFmpeg. Tidak ada upload atau API cloud.',
                style: TextStyle(
                  color: Colors.blueGrey.shade600,
                  fontSize: 15,
                  height: 1.4,
                ),
              ),
              const SizedBox(height: 24),
              _mediaPickerCard(
                icon: Icons.videocam_rounded,
                title: 'Video sumber',
                fileName: _fileName(_videoPath),
                buttonLabel: 'Pilih Video',
                onPressed: _isProcessing ? null : _pickVideo,
                color: const Color(0xFF0B86A2),
              ),
              const SizedBox(height: 12),
              _mediaPickerCard(
                icon: Icons.audiotrack_rounded,
                title: 'Audio referensi',
                fileName: _fileName(_audioPath),
                buttonLabel: 'Pilih Audio',
                onPressed: _isProcessing ? null : _pickAudio,
                color: const Color(0xFF7B52AB),
              ),
              const SizedBox(height: 20),
              FilledButton.icon(
                onPressed: (_videoPath != null && _audioPath != null && !_isProcessing)
                    ? _startLipSync
                    : null,
                icon: _isProcessing
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Icon(Icons.auto_awesome_rounded),
                label: Text(_isProcessing ? 'MEMPROSES...' : 'START LIP-SYNC'),
                style: FilledButton.styleFrom(
                  minimumSize: const Size.fromHeight(58),
                  textStyle: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 0.4,
                  ),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                ),
              ),
              const SizedBox(height: 18),
              _statusCard(),
              if (_error != null) ...[
                const SizedBox(height: 12),
                _errorCard(),
              ],
              if (_outputPath != null) ...[
                const SizedBox(height: 22),
                const Text(
                  'Preview hasil',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800),
                ),
                const SizedBox(height: 10),
                if (previewReady)
                  _videoPreview(preview)
                else
                  const Card(
                    child: Padding(
                      padding: EdgeInsets.all(24),
                      child: Center(child: CircularProgressIndicator()),
                    ),
                  ),
                const SizedBox(height: 8),
                Text(
                  'Tersimpan offline di folder aplikasi.\n${_fileName(_outputPath)}',
                  style: TextStyle(color: Colors.blueGrey.shade600, fontSize: 12),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _offlineReadyBadge() {
    return Align(
      alignment: Alignment.centerLeft,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
        decoration: BoxDecoration(
          color: const Color(0xFFDDF5E9),
          borderRadius: BorderRadius.circular(99),
        ),
        child: const Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.circle, size: 9, color: Color(0xFF1B9A63)),
            SizedBox(width: 7),
            Text(
              'OFFLINE READY',
              style: TextStyle(
                color: Color(0xFF167A4E),
                fontSize: 12,
                fontWeight: FontWeight.w800,
                letterSpacing: 0.8,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _mediaPickerCard({
    required IconData icon,
    required String title,
    required String fileName,
    required String buttonLabel,
    required VoidCallback? onPressed,
    required Color color,
  }) {
    return Card(
      elevation: 0,
      color: Colors.white,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(18),
        side: BorderSide(color: Colors.blueGrey.shade100),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.11),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Icon(icon, color: color),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: const TextStyle(fontWeight: FontWeight.w800)),
                  const SizedBox(height: 3),
                  Text(
                    fileName,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(color: Colors.blueGrey.shade600, fontSize: 12),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            OutlinedButton(
              onPressed: onPressed,
              child: Text(buttonLabel),
            ),
          ],
        ),
      ),
    );
  }

  Widget _statusCard() {
    return Card(
      elevation: 0,
      color: const Color(0xFFEAF7FA),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Row(
              children: [
                Icon(Icons.memory_rounded, size: 20, color: Color(0xFF0B86A2)),
                SizedBox(width: 8),
                Text('Status proses FFmpeg', style: TextStyle(fontWeight: FontWeight.w800)),
              ],
            ),
            const SizedBox(height: 9),
            Text(_status, style: const TextStyle(height: 1.35)),
            if (_isProcessing) ...[
              const SizedBox(height: 12),
              const LinearProgressIndicator(minHeight: 6),
            ],
          ],
        ),
      ),
    );
  }

  Widget _errorCard() {
    return Card(
      elevation: 0,
      color: const Color(0xFFFFECEC),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Text(
          _error!,
          maxLines: 8,
          overflow: TextOverflow.ellipsis,
          style: const TextStyle(color: Color(0xFF9A2828), height: 1.3),
        ),
      ),
    );
  }

  Widget _videoPreview(VideoPlayerController controller) {
    return Card(
      clipBehavior: Clip.antiAlias,
      elevation: 0,
      child: Column(
        children: [
          AspectRatio(
            aspectRatio: controller.value.aspectRatio,
            child: VideoPlayer(controller),
          ),
          ListTile(
            leading: IconButton(
              onPressed: () {
                setState(() {
                  controller.value.isPlaying ? controller.pause() : controller.play();
                });
              },
              icon: Icon(
                controller.value.isPlaying ? Icons.pause_circle : Icons.play_circle,
                color: const Color(0xFF0B86A2),
                size: 34,
              ),
            ),
            title: const Text('Video hasil lip-sync'),
            subtitle: const Text('Diputar sepenuhnya di perangkat'),
          ),
        ],
      ),
    );
  }
}
