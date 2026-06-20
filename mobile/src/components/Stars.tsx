// Avaliação por estrelas (réplica do Stars.tsx do web). Modo display (score
// fixo) ou interativo (onSelect).
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { brand } from '@/theme/colors';

interface Props {
  score: number | null;
  size?: number;
  color?: string;
  emptyColor?: string;
  onSelect?: (value: number) => void;
}

export function Stars({ score, size = 14, color = brand.gold, emptyColor = '#d6dee0', onSelect }: Props) {
  const value = score ?? 0;
  return (
    <View style={{ flexDirection: 'row' }}>
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = i <= value;
        const icon = (
          <Ionicons
            name={filled ? 'star' : 'star-outline'}
            size={size}
            color={filled ? color : emptyColor}
            style={{ marginRight: size * 0.18 }}
          />
        );
        if (!onSelect) return <View key={i}>{icon}</View>;
        return (
          <Pressable key={i} onPress={() => onSelect(i)} hitSlop={4}>
            {icon}
          </Pressable>
        );
      })}
    </View>
  );
}
