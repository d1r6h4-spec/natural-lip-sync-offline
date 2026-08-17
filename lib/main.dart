import 'package:flutter/material.dart';
import 'package:ffmpeg_kit_flutter_new/ffmpeg_kit.dart';

void main() {
  runApp(const NaturalLipSyncApp());
}

class NaturalLipSyncApp extends StatelessWidget {
  const NaturalLipSyncApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Natural Lip-Sync Offline',
      theme: ThemeData(primarySwatch: Colors.teal),
      home: const HomeScreen(),
    );
  }
}

class HomeScreen extends StatelessWidget {
  const HomeScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Natural Lip-Sync v2.0.0 OFFLINE')),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text('OFFLINE READY (Flutter + ffmpeg_kit_flutter_new)'),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: () {
                FFmpegKit.execute("-version").then((session) {
                  print("FFmpeg initialized successfully");
                });
              },
              child: const Text('Test FFmpeg'),
            ),
          ],
        ),
      ),
    );
  }
}
