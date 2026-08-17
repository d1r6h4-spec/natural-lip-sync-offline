from pathlib import Path

from onnxruntime.quantization import CalibrationDataReader, QuantFormat, QuantType, quantize_static

source = Path("/tmp/wav2lip.onnx")
target = Path("assets/models/wav2lip-int8.onnx")

class Reader(CalibrationDataReader):
    def __init__(self):
        import numpy as np
        self.data = iter([{
            "mel": np.zeros((1, 1, 80, 16), dtype=np.float32),
            "vid": np.zeros((1, 6, 96, 96), dtype=np.float32),
        }])

    def get_next(self):
        return next(self.data, None)

quantize_static(
    str(source),
    str(target),
    Reader(),
    quant_format=QuantFormat.QDQ,
    activation_type=QuantType.QUInt8,
    weight_type=QuantType.QInt8,
    per_channel=True,
    reduce_range=True,
    op_types_to_quantize=["Conv", "MatMul", "Gemm"],
)
print(target)
print(target.stat().st_size)
