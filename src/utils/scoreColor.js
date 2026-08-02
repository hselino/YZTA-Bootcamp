import { colors } from '../theme/colors';

// 0-100 arası bir skoru anlamlı bir renge çevirir — kullanıcı sayıyı okumadan
// önce bile iyi/orta/zayıf ayrımını görsün diye tüm skor kartlarında kullanılır.
export const scoreColor = (value) => {
  if (value >= 75) return colors.success;
  if (value >= 50) return colors.warning;
  return colors.error;
};
