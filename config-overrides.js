const path = require('path');
module.exports = {
  paths: function(paths, env) {
    paths.appPublic = path.resolve(__dirname, 'web/public');
    paths.appHtml = path.resolve(__dirname, 'web/public/index.html');
    paths.appIndexJs = path.resolve(__dirname, 'web/src/index.js');
    paths.appSrc = path.resolve(__dirname, 'web/src');
    paths.appBuild = path.resolve(__dirname, 'web/gui');
    return paths;
  }
};