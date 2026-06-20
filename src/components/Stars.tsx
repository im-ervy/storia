'use client';

// Réplica do app-rating-stars: estrelas douradas (filtro original sobre
// fullStar/emptyStar.svg); cinza quando não há nota; opcionalmente interativas
// (tela de avaliação) e em tamanho mini (14px) ou padrão (25px).
import { useState } from 'react';

const GOLD =
  'invert(83%) sepia(72%) saturate(493%) hue-rotate(341deg) brightness(93%) contrast(97%)';
const GRAY =
  'invert(85%) sepia(8%) saturate(509%) hue-rotate(147deg) brightness(95%) contrast(88%)';

interface Props {
  score: number | null;
  size?: number;
  onSelect?: (value: number) => void;
}

export function Stars({ score, size = 14, onSelect }: Props) {
  const [hover, setHover] = useState(0);
  const value = hover || score || 0;
  const interactive = !!onSelect;

  return (
    <span
      style={{ display: 'inline-flex', alignItems: 'center' }}
      aria-label={`${score ?? 0} de 5`}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <img
          key={i}
          src={i <= value ? '/icons/fullStar.svg' : '/icons/emptyStar.svg'}
          alt=""
          onClick={interactive ? () => onSelect!(i) : undefined}
          onMouseEnter={interactive ? () => setHover(i) : undefined}
          onMouseLeave={interactive ? () => setHover(0) : undefined}
          style={{
            width: size,
            height: size,
            margin: '0 3px 3px',
            filter: score || hover ? GOLD : GRAY,
            cursor: interactive ? 'pointer' : undefined,
          }}
        />
      ))}
    </span>
  );
}
