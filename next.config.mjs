/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // O app lê data/content/{id}.json e os catálogos com caminhos dinâmicos; o
  // file-tracing do Next não os inclui sozinho. Forçamos só o que é lido em
  // runtime (não os fontes de produção em data/<lang>/) p/ a função ficar leve.
  outputFileTracingIncludes: {
    '/**': ['./data/content/**', './data/*.json'],
  },
};

export default nextConfig;
