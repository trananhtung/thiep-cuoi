'use strict';
/* Nạp một file UMD của frontend trong Node test.
 * Cần thiết vì frontend/package.json có "type":"module" — require() trực tiếp sẽ bị
 * Node nạp như ESM và UMD wrapper (dựa vào `module`/`this`) vỡ. Chạy qua vm với
 * ngữ cảnh CommonJS tối thiểu để test đúng file production, không cần bản sao. */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

module.exports = function loadUmd(relPath) {
  const file = path.join(__dirname, relPath);
  const code = fs.readFileSync(file, 'utf8');
  const mod = { exports: {} };
  const context = { module: mod, exports: mod.exports, TextEncoder, Buffer, console };
  vm.runInNewContext(code, context, { filename: file });
  return mod.exports;
};
