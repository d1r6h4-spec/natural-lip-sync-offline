package com.example.natural_lip_sync_offline

import android.content.ContentValues
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel
import java.io.File

class MainActivity : FlutterActivity() {
    private val channelName = "natural_lip_sync/storage"

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, channelName)
            .setMethodCallHandler { call, result ->
                when (call.method) {
                    "copyToDownload" -> copyToDownload(call, result)
                    else -> result.notImplemented()
                }
            }
    }

    private fun copyToDownload(call: MethodChannel.MethodCall, result: MethodChannel.Result) {
        val sourcePath = call.argument<String>("sourcePath")
        val displayName = call.argument<String>("displayName") ?: "natural_lipsync_video.mp4"
        if (sourcePath.isNullOrBlank()) {
            result.error("INVALID_SOURCE", "Source video path is empty.", null)
            return
        }

        val sourceFile = File(sourcePath)
        if (!sourceFile.exists()) {
            result.error("SOURCE_NOT_FOUND", "Source video does not exist.", sourcePath)
            return
        }

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                val values = ContentValues().apply {
                    put(MediaStore.Downloads.DISPLAY_NAME, displayName)
                    put(MediaStore.Downloads.MIME_TYPE, "video/mp4")
                    put(MediaStore.Downloads.RELATIVE_PATH, "Download/NaturalLipSync")
                    put(MediaStore.Downloads.IS_PENDING, 1)
                }
                val resolver = contentResolver
                val uri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values)
                    ?: throw IllegalStateException("MediaStore tidak dapat membuat file Download.")

                try {
                    resolver.openOutputStream(uri)?.use { output ->
                        sourceFile.inputStream().use { input -> input.copyTo(output) }
                    } ?: throw IllegalStateException("Output stream MediaStore tidak tersedia.")

                    val completed = ContentValues().apply {
                        put(MediaStore.Downloads.IS_PENDING, 0)
                    }
                    resolver.update(uri, completed, null, null)
                    result.success(uri.toString())
                } catch (error: Exception) {
                    resolver.delete(uri, null, null)
                    throw error
                }
            } else {
                @Suppress("DEPRECATION")
                val downloads = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS)
                val targetDirectory = File(downloads, "NaturalLipSync")
                if (!targetDirectory.exists() && !targetDirectory.mkdirs()) {
                    throw IllegalStateException("Folder Download/NaturalLipSync tidak dapat dibuat.")
                }
                val target = File(targetDirectory, displayName)
                sourceFile.inputStream().use { input ->
                    target.outputStream().use { output -> input.copyTo(output) }
                }
                result.success(target.absolutePath)
            }
        } catch (error: Exception) {
            result.error("COPY_FAILED", error.message ?: "Gagal menyalin video ke Download.", null)
        }
    }
}
