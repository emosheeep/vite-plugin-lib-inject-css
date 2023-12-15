// 配置可参考 https://prettier.io/en/configuration.html
module.exports = {
  // Windows 用户和 macOS/Linux 用户的换行符不同会导致保存时触发 diff，这里遵循官方建议使用 'lf'
  endOfLine: 'lf',

  // 单引号代替双引号
  singleQuote: true,

  // 对于 ES5 而言, 尾逗号不能用于函数参数，因此使用它们只能用于数组
  trailingComma: 'all',
};
