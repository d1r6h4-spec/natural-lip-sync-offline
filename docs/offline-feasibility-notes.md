# Offline Wav2Lip Feasibility Notes

The official Wav2Lip repository describes the open-source inference path as Python-based and requires a pretrained Wav2Lip checkpoint plus a separate S3FD face-detection checkpoint. The project also states that the open-source model is restricted to research/academic/personal use and is not for commercial use.

The ONNX Runtime React Native documentation confirms that `onnxruntime-react-native` can execute ONNX models in a native React Native application. The ONNX mobile deployment guide requires a model in ONNX format and emphasizes that the model must fit device storage and memory. Mobile deployment also requires native package integration and performance measurement.

A community `wav2lip-onnx` project demonstrates conversion of Wav2Lip checkpoints to ONNX and CPU inference, but it is not an official React Native bridge and still depends on media preprocessing and face detection assets. Therefore, the current Expo project does not yet contain a bundled Wav2Lip ONNX model, native inference bridge, or local video compositor. A truthful v2.0 implementation needs these assets and native dependencies; a UI-only replacement would not produce real Wav2Lip lip deformation.

Sources:
- https://github.com/Rudrabha/Wav2Lip
- https://github.com/instant-high/wav2lip-onnx
- https://onnxruntime.ai/docs/get-started/with-javascript/react-native.html
- https://onnxruntime.ai/docs/tutorials/mobile/

Additional implementation finding: `onnxruntime-react-native` is a native module and requires a custom Android build rather than Expo Go. The ML Kit Expo wrapper is available as `@infinitered/react-native-mlkit-face-detection`, but it also requires native build integration. FFmpeg Kit for React Native is retired/upstream-maintenance-sensitive, so using it would require a custom native build and validation. A Wav2Lip ONNX checkpoint found on Hugging Face is approximately 145 MB before the separate face detector and runtime assets. These constraints affect APK size and build reliability; they do not justify replacing true model inference with a fake cloud or UI-only result.

Additional sources:
- https://www.npmjs.com/package/@infinitered/react-native-mlkit-face-detection
- https://docs.infinite.red/react-native-mlkit/
- https://onnxruntime.ai/docs/get-started/with-javascript/react-native.html
- https://huggingface.co/bluefoxcreation/Wav2lip-Onnx/blob/main/wav2lip.onnx
- https://github.com/arthenica/ffmpeg-kit/issues/1144

## Native media findings

- `ffmpeg-kit-react-native@6.0.2` exposes FFmpeg/FFprobe commands and Android API 24 support, but its npm package is deprecated and no longer supported. Source checked: https://www.npmjs.com/package/ffmpeg-kit-react-native
- `@infinitered/react-native-mlkit-face-detection@5.0.0` exposes `RNMLKitFaceDetector.detectFaces(imageUri)` and returns faces with `frame.origin` and `frame.size`; it requires a native Android build and is not available on web. Sources checked: https://www.npmjs.com/package/@infinitered/react-native-mlkit-face-detection and https://docs.infinite.red/react-native-mlkit/face-detection
- `ffmpeg-expo` is a newer alternative but currently documents requirements of Expo SDK >=56 and React Native >=0.85, while this project uses Expo SDK 54 / React Native 0.81; it is not a compatible drop-in for this project. Source checked: https://github.com/kingjnr4/ffmpeg-expo
- The bundled Wav2Lip ONNX model was inspected locally: inputs are `mel [batch,1,80,16]` and `vid [batch,6,96,96]`; output is `gen [batch,3,96,96]`. A float16-converted model is used for the Android asset at `assets/models/wav2lip-fp16.onnx`; it passed ONNX graph validation and CPU dummy inference with the same input/output shapes, is approximately 70 MB, and has SHA-256 `151f0a311131cff3631d0172711caea562daf0cf3d489b8befd35f9325bf42d2`.

- Runtime model loader currently uses `Asset.fromModule(MODEL_ASSET)` and passes one local ONNX file path directly to ONNX Runtime. Splitting the model into chunks would require a native-safe binary concatenation path, so the checkpoint-size fix should prefer a single validated model asset or File Storage rather than silently shipping a non-loadable split model.
