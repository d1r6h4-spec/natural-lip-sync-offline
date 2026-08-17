from pathlib import Path

import numpy as np
import onnx
import onnxruntime as ort

models = [Path("assets/models/wav2lip-fp16.onnx")]
for path in models:
    model = onnx.load(str(path))
    onnx.checker.check_model(model)
    session = ort.InferenceSession(str(path), providers=["CPUExecutionProvider"])
    inputs = session.get_inputs()
    outputs = session.get_outputs()
    assert [item.name for item in inputs] == ["mel", "vid"], [item.name for item in inputs]
    assert [item.name for item in outputs] == ["gen"], [item.name for item in outputs]
    result = session.run(None, {
        "mel": np.zeros((1, 1, 80, 16), dtype=np.float32),
        "vid": np.zeros((1, 6, 96, 96), dtype=np.float32),
    })
    assert result[0].shape == (1, 3, 96, 96), result[0].shape
    print(path, "ok", path.stat().st_size, result[0].dtype)
