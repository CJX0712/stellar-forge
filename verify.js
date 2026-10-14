// stellar-forge 验证入口（headless Node，零依赖）
// 提取 transformer-forge.html 中 ==LIB START== / ==LIB END== 之间的库代码并执行自检。
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, 'transformer-forge.html'), 'utf8');
const m = html.match(/\/\/ ==LIB START==([\s\S]*?)\/\/ ==LIB END==/);
if (!m) { console.error('未找到 LIB 标记'); process.exit(2); }

const code = m[1];
const moduleObj = { exports: {} };
const fn = new Function('module', 'require', 'document', code + '\n;return (typeof SF!=="undefined")?SF:module.exports;');
const SF = fn(moduleObj, { main: moduleObj }, undefined);

const { results, allPass, ms } = SF.runAllTests();
const passN = results.filter(r => r.pass).length;
console.log('\n汇总: ' + passN + '/' + results.length + ' 通过 · 耗时 ' + ms + 'ms');
process.exit(allPass ? 0 : 1);
