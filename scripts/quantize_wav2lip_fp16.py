from pathlib import Path

import onnx
from onnxconverter_common import float16

source = Path("assets/models/wav2lip.onnx")
target = Path("assets/models/wav2lip-fp16.onnx")
model = onnx.load(str(source))
converted = float16.convert_float_to_float16(model, keep_io_types=True)
onnx.save(converted, str(target))
print(target)
print(target.stat().st_size)
