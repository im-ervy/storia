# Comparativo: Coleção Mairo (inglês, 195 livros) × Sistema multi-idioma (graded-readers)

> Julgamento cruzado usando o `GUIA-PRODUCAO-GRADED-READERS.md` como rubrica.
> Lado A: a coleção profissional analisada neste repositório (inglês→PT-BR).
> Lado B: o sistema em `C:\Users\{user}\projetos\meus\graded-readers`
> (fr/es/zh/ru, histórias escritas por Claude, anotação via OpenAI;
> 128 readers prontos). Métricas medidas sobre os dois corpora; leitura
> integral de 14 livros do lado A e 13 do lado B.

---

## 1. Números lado a lado

| Métrica | Mairo (N1 → N7) | Multi-idioma (fr A1 → C1) |
|---|---|---|
| Livros prontos | 195 (30/nível) | 128 no total (4 idiomas; 6–10/nível) |
| Palavras por livro | 1.617 → 2.542 (**1,6×**) | 331 → 4.004 (**12×**) |
| Palavras únicas | 367 → 790 | 133 → 1.154 |
| TTR no nível inicial | **0,23** (4,5 ocorrências/palavra) | 0,38–0,50 (2,0–2,6 occ.) |
| Frase média | ~15 palavras em todos os níveis | 4,7 → 15,7 (graduada) |
| % parágrafos com diálogo | 50–69% | 21–61% (fraco nos níveis baixos) |
| Camadas de apoio | 3 (chunk contextual + tips + notas) | 1 (tradução palavra a palavra, 100% cobertura) |
| Notas pedagógicas | 38/livro (N1) → 2 (N7) | **0 em todo o corpus** |
| Adaptação ao par de línguas | — (só EN→PT) | pinyin (zh), acento+lema+gramática (ru), falso amigo (es) |
| Áudio narrado | sim, integral | não |
| Universo de coleção | elenco de nomes, moldura circular | detetives recorrentes + enredos-espelho entre 4 idiomas |

## 2. Vencedores por dimensão

| Dimensão | Vencedor | Evidência |
|---|---|---|
| **Qualidade narrativa (topo da escala)** | 🏆 **Multi-idioma** | FR C1 *L'Ombre du Quai Voltaire*, RU B2 *Staraya Fotografiya* e ES N5 *La Sombra del Riachuelo* são literatura genuína — twist, subtexto, ironia trágica, zero moral colada — igualam ou superam os melhores N6–N7 do Mairo |
| **Qualidade narrativa (níveis baixos)** | 🏆 **Mairo** | O N1 do Mairo é fábula completa de 1.600 palavras com arco, prova tripla e moral+twist; o A1 do outro sistema é vinheta de 300 palavras (boa, mas sem fôlego) e o ES N1 é prosa adulta difícil demais (*el-gato-feliz*, TTR 0,50) |
| **Engenharia de dificuldade no texto** | 🏆 **Mairo** (por goleada) | Repetição andaimada (TTR 0,23, estruturas 3×), glosa embutida sistemática, nomes falantes glosados, extensão quase constante (1,6×). O outro sistema gradua por comprimento (12×) e frases curtas — exatamente o que o guia identifica como anti-padrão |
| **Camadas de apoio pedagógico** | 🏆 **Mairo** | Tradução contextual por chunk + tips + 38→2 notas/livro com fade-out projetado. O outro sistema tem só dicionário inline (excelente cobertura, zero explicação de idiom/gramática/cultura) |
| **Suporte técnico por idioma** | 🏆 **Multi-idioma** | `py` no mandarim, `acc/lemma/gram` no russo (vai além do Mairo para línguas flexionadas), `fa` no espanhol. O Mairo nunca precisou resolver isso |
| **Voz e idiomaticidade** | 🤝 Empate | Ambos soam nativos. O multi-idioma não tem cheiro de IA nem de tradução (fr/es verificados em leitura integral) |
| **Identidade de coleção** | 🏆 **Multi-idioma** | Detetives espelhados (Mercier/Quiroga/沈先生), mesmo esqueleto de enredo recast em 4 culturas, molduras circulares. Mais ambicioso que o universo NY do Mairo |
| **Progressão de maturidade temática** | 🤝 Empate | Os dois acertam a escada emocional (caloroso → irônico → literário) |
| **Completude como produto** | 🏆 **Mairo** | 30 livros/nível (volume de leitura extensiva), áudio integral, gamificação. O outro tem 6–10/nível e sem áudio |

## 3. Veredito

**Não há um vencedor absoluto — há dois meios-campeões complementares:**

- O **multi-idioma vence como coleção de HISTÓRIAS**: escrita criativa superior
  no topo da escala, voz nativa, identidade multilíngue ambiciosa e suporte
  técnico adaptado a cada par de línguas.
- O **Mairo vence como coleção de GRADED READERS**: toda a engenharia que faz
  um iniciante de verdade atravessar o livro — repetição andaimada, glosa
  embutida, três camadas de apoio com fade-out, extensão calibrada, volume
  por nível e áudio.

O sistema multi-idioma é, hoje, **uma coleção de histórias excelentes ainda não
terminada como coleção de graded readers**: falta a metade pedagógica descrita
nos §2, §6 e na Etapa 2 do guia.

### Gradeds vencedores individuais (topo absoluto dos dois corpora)
1. 🥇 *L'Ombre du Quai Voltaire* (fr C1) — multi-idioma
2. 🥈 *Staraya Fotografiya* (ru B2) — multi-idioma
3. 🥉 *La Sombra del Riachuelo* (es N5) — multi-idioma
4. *Sanapia's Legacy* (Mairo N7) — não-ficção embutida, quebra da 4ª parede
5. *L'Affaire du Train de Nuit* (fr B1) — locked-room fair-play impecável

### Nos níveis iniciais, vence Mairo em todos os idiomas comparáveis
(A1/N1 do outro sistema não tem andaime de repetição nem fôlego narrativo.)

## 4. Prescrição: o sistema vencedor é o híbrido

Para a expansão multi-idioma, manter o que o sistema novo já faz melhor e
importar do Mairo o que falta:

1. **Manter**: o pipeline de escrita (Claude autor / IA só anota), as regras de
   voz, os detetives e enredos-espelho, e os campos por idioma (py/acc/fa).
2. **Importar do Mairo — prioridade máxima**:
   - **Camada de notas pedagógicas** (`explanation` por tip): cota de
     ~38/livro no nível 1 caindo a ~2 no topo, com a tipologia do guia §6.2;
   - **Andaime dos níveis baixos**: reescrever/alongar os A1/N1 para
     1.200–1.600 palavras com TTR ≤0,25–0,30, estruturas repetidas 3×,
     nomes falantes glosados e glosa embutida sistemática;
   - **Calibração de extensão**: razão topo/base ≤2× (alongar a base, conter
     o topo — o C1 de 4.000 palavras pode virar dois readers);
   - **Tradução contextual por chunk** (sintagma) além do hover por palavra,
     com chunks que crescem por nível (2–3 palavras → frase inteira);
   - **Volume**: meta de 30 readers por nível, e áudio narrado.
3. **Critério de aceite**: validar cada livro novo contra a tabela §3 do guia
   (scripts `analyze-*.mjs` deste repositório já fazem isso).

---

*Metodologia: métricas por `scripts/analyze-readers.mjs`, `analyze-grammar.mjs`,
`analyze-vocab.mjs` (corpus Mairo) e `analyze-other-system.mjs` (corpus
multi-idioma); leitura editorial integral de 27 livros pelos dois lados.*
