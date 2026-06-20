// Metro config (Expo SDK 56). Os arquivos de conteúdo dos readers são JSON
// cru salvos como .txt em assets/content/ para serem tratados como ASSET
// (carregados sob demanda via expo-asset), e não inlinados no bundle JS.
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// 'txt' = conteúdo dos readers (JSON cru) carregado como asset.
if (!config.resolver.assetExts.includes('txt')) {
  config.resolver.assetExts.push('txt');
}

module.exports = config;
