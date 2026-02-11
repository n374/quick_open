const path = require('path');

module.exports = {
    entry: {
        options: './src/options.js',
        service_worker: './src/service_worker.js'
    },
    output: {
        filename: '[name].bundle.js', // 输出的打包文件名
        path: path.resolve(__dirname, 'src/dist'), // 输出目录
    },
    mode: 'development', // 开发模式
    watch: true, // 监听文件变动，自动重新打包
    devtool: 'cheap-module-source-map', // 替换 'eval-source-map' 或类似选项
};