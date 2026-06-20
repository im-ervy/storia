// Tokens de cor extraídos do CSS do app web (globals.css + ReaderView.module.css)
// para manter a paridade visual com o desktop.

export const brand = {
  teal: '#37bdd2',
  tealDark: '#28a5c1',
  tealLight: '#38bfd3',
  greenA: '#72b923',
  greenB: '#9acb31',
  redA: '#d5242c',
  redB: '#e43742',
  ink: '#212529',
  muted: '#6c757d',
  line: '#dee2e6',
  bg: '#f4f7f8',
  card: '#ffffff',
  gold: '#ffc107',
  // tons usados no header/biblioteca do modo leitura
  titleTeal: '#124653',
  badgeRed: '#c8373f',
};

export type ThemeValue = 'white' | 'blackAndWhite' | 'sepia';

export interface ReadingTheme {
  value: ThemeValue;
  name: string;
  swatch: string; // cor do botão de tema
  bodyBg: string;
  pageBg: string;
  text: string;
  highlight: string; // realce do chunk ao tocar
  highlightText: string;
  tooltipBg: string;
  tooltipBorder: string;
  portText: string; // tradução principal no tooltip
  tipEnglish: string;
  tipPortuguese: string;
  tipExplanation: string;
  tipSeparator: string;
  rubyText: string; // cor do ruby (rt) — segue o texto com opacidade
  noteUnderline: string; // underline dos tokens com nota (toggle "Notas")
  levelLabelBg: string;
  levelLabelText: string;
  readerTitle: string;
  pageInfo: string;
  progress: string;
}

export const READING_THEMES: Record<ThemeValue, ReadingTheme> = {
  white: {
    value: 'white',
    name: 'BRANCO',
    swatch: '#ffffff',
    bodyBg: '#f3fafb',
    pageBg: '#ffffff',
    text: '#163b3e',
    highlight: '#8ddeed',
    highlightText: '#124653',
    tooltipBg: '#ffffff',
    tooltipBorder: '#dde9eb',
    portText: '#163b3e',
    tipEnglish: '#31b7d0',
    tipPortuguese: '#1b9bb4',
    tipExplanation: '#749199',
    tipSeparator: '#e1e9eb',
    rubyText: '#163b3e',
    noteUnderline: '#36c2dc',
    levelLabelBg: '#c8373f',
    levelLabelText: '#ffffff',
    readerTitle: '#124653',
    pageInfo: '#a6bfc6',
    progress: '#31b3ca',
  },
  blackAndWhite: {
    value: 'blackAndWhite',
    name: 'PRETO',
    swatch: '#000000',
    bodyBg: '#1c1c1c',
    pageBg: '#000000',
    text: '#cfcfcf',
    highlight: '#cecece',
    highlightText: '#000000',
    tooltipBg: '#141414',
    tooltipBorder: '#cccccc',
    portText: '#cfcfcf',
    tipEnglish: '#989898',
    tipPortuguese: '#989898',
    tipExplanation: '#8f8f8f',
    tipSeparator: '#333333',
    rubyText: '#cfcfcf',
    noteUnderline: '#8a8a8a',
    levelLabelBg: '#363636',
    levelLabelText: '#cfcfcf',
    readerTitle: '#cfcfcf',
    pageInfo: '#7a7a7a',
    progress: '#9b9b9b',
  },
  sepia: {
    value: 'sepia',
    name: 'SÉPIA',
    swatch: '#d2c4b5',
    bodyBg: '#f9f4e8',
    pageBg: '#f3e9d2',
    text: '#5c4930',
    highlight: '#5c4930',
    highlightText: '#f9f4e8',
    tooltipBg: '#f9f4e8',
    tooltipBorder: '#d9d0ba',
    portText: '#5c4930',
    tipEnglish: '#5c4930',
    tipPortuguese: '#5c4930',
    tipExplanation: '#aba191',
    tipSeparator: '#e9e3d5',
    rubyText: '#5c4930',
    noteUnderline: '#b08d57',
    levelLabelBg: '#5c4930',
    levelLabelText: '#ffffff',
    readerTitle: '#5c4930',
    pageInfo: '#8d7c63',
    progress: '#9b8a6f',
  },
};

export const READING_THEME_LIST = [
  READING_THEMES.white,
  READING_THEMES.blackAndWhite,
  READING_THEMES.sepia,
];
