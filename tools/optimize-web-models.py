"""Create web delivery copies; never change source VRM models or mesh data."""
import io
import json
import struct
import gzip
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1] / 'public' / 'models'
destination = root / 'web-v1'
destination.mkdir(exist_ok=True)
report = []
for source in sorted(root.glob('*.vrm')):
    data = source.read_bytes()
    json_length = struct.unpack_from('<I', data, 12)[0]
    gltf = json.loads(data[20:20 + json_length])
    original_binary = data[28 + json_length:]
    replacements = {}
    converted = set()
    normal_textures = {m['normalTexture']['index'] for m in gltf.get('materials', []) if 'normalTexture' in m}
    for material in gltf.get('extensions', {}).get('VRM', {}).get('materialProperties', []):
        normal = material.get('textureProperties', {}).get('_BumpMap')
        if normal is not None:
            normal_textures.add(normal)
    normal_images = {gltf['textures'][i].get('source') for i in normal_textures}
    for index, image in enumerate(gltf.get('images', [])):
        if 'bufferView' not in image:
            continue
        view_index = image['bufferView']
        view = gltf['bufferViews'][view_index]
        offset = view.get('byteOffset', 0)
        raw = original_binary[offset:offset + view['byteLength']]
        picture = Image.open(io.BytesIO(raw)).convert('RGBA')
        # Keep original resolution and lossless normal maps; preserve alpha exactly.
        output = io.BytesIO()
        picture.save(output, format='WEBP', lossless=index in normal_images, quality=92, method=6, exact=True)
        if len(output.getvalue()) < len(raw):
            replacements[view_index] = output.getvalue()
            image['mimeType'] = 'image/webp'
            converted.add(index)
    for texture in gltf.get('textures', []):
        if texture.get('source') in converted:
            texture.setdefault('extensions', {})['EXT_texture_webp'] = {'source': texture.pop('source')}
    if converted:
        for key in ['extensionsUsed', 'extensionsRequired']:
            gltf[key] = list(dict.fromkeys(gltf.get(key, []) + ['EXT_texture_webp']))
    binary = bytearray()
    for index, view in enumerate(gltf['bufferViews']):
        offset = view.get('byteOffset', 0)
        payload = replacements.get(index, original_binary[offset:offset + view['byteLength']])
        binary.extend(b'\0' * (-len(binary) % 4))
        view['byteOffset'] = len(binary)
        view['byteLength'] = len(payload)
        binary.extend(payload)
    gltf['buffers'][0]['byteLength'] = len(binary)
    binary.extend(b'\0' * (-len(binary) % 4))
    metadata = json.dumps(gltf, ensure_ascii=False, separators=(',', ':')).encode()
    metadata += b' ' * (-len(metadata) % 4)
    result = (struct.pack('<III', 0x46546c67, 2, 28 + len(metadata) + len(binary))
              + struct.pack('<II', len(metadata), 0x4e4f534a) + metadata
              + struct.pack('<II', len(binary), 0x004e4942) + binary)
    (destination / source.name).write_bytes(result)
    compressed = gzip.compress(result, compresslevel=9, mtime=0)
    (destination / (source.name + '.gz')).write_bytes(compressed)
    row = {'file': source.name, 'before': len(data), 'after': len(result), 'download': len(compressed)}
    report.append(row)
    print(row, flush=True)
(destination / 'sizes.json').write_text(json.dumps({r['file']: r['after'] for r in report}), encoding='utf-8')
print('TOTAL', sum(r['before'] for r in report), sum(r['after'] for r in report), 'DOWNLOAD', sum(r['download'] for r in report))
