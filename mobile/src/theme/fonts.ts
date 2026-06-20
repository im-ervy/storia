// Famílias de fonte da porta mobile. As strings são EXATAMENTE os nomes que os
// pacotes @expo-google-fonts/* registram quando carregados via useFonts (cada
// constante exportada é tanto o módulo da fonte quanto o nome de família).
//
// Papéis (espelham o CSS do web):
//  - Open Sans  -> CORPO/leitura (parágrafos, tips, tradução do tooltip,
//                  textos do Congratulation, menu, labels comuns).
//  - Barlow Condensed -> logo, contadores do header, títulos (reader title,
//                  top bar), badges de nível, BOTÕES, números grandes/headings,
//                  labels uppercase.
//  - Barlow -> fallback de heading/UI geral.
export const fonts = {
  body: 'OpenSans_400Regular',
  bodySemibold: 'OpenSans_600SemiBold',
  bodyBold: 'OpenSans_700Bold',
  condensedLight: 'BarlowCondensed_300Light',
  condensed: 'BarlowCondensed_400Regular',
  condensedSemibold: 'BarlowCondensed_600SemiBold',
  condensedBold: 'BarlowCondensed_700Bold',
  barlow: 'Barlow_400Regular',
  barlowBold: 'Barlow_700Bold',
} as const;
