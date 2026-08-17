from pathlib import Path

import onnx

model_path = Path(__file__).parents[1] / "assets" / "models" / "wav2lip.onnx"
model = onnx.load(model_path, load_external_data=False)
print("inputs")
for value in model.graph.input:
    dims = []
    for dim in value.type.tensor_type.shape.dim:
        dims.append(dim.dim_value if dim.dim_value else dim.dim_param)
    print(value.name, dims, value.type.tensor_type.elem_type)
print("outputs")
for value in model.graph.output:
    dims = []
    for dim in value.type.tensor_type.shape.dim:
        dims.append(dim.dim_value if dim.dim_value else dim.dim_param)
    print(value.name, dims, value.type.tensor_type.elem_type)
print("opsets", [(item.domain, item.version) for item in model.opset_import])
