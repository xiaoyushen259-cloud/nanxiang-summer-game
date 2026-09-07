export async function decodeModelBuffer(bytes) {
  const header = new Uint8Array(bytes, 0, Math.min(bytes.byteLength, 4));
  // Some hosts set Content-Encoding: gzip, so fetch has already decompressed it.
  if (header[0] === 0x1f && header[1] === 0x8b) {
    bytes = await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
  }
  if (bytes.byteLength < 12 || new DataView(bytes).getUint32(0, true) !== 0x46546c67) {
    throw new Error('角色文件下载不完整，请重新连接。');
  }
  return bytes;
}
