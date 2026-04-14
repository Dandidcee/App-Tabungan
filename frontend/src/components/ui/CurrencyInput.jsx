/**
 * CurrencyInput - Input field yang otomatis memformat angka dengan titik pemisah ribuan (format ID)
 * Contoh: 1500000 → "1.500.000"
 * Value yang dikembalikan ke onChange adalah string angka murni (tanpa titik) untuk kemudahan parsing
 */
import { setIndonesianValidity } from '../../utils/validation';

const CurrencyInput = ({ value, onChange, placeholder = '1.000.000', className = '', required = false, id }) => {
  // Format angka dengan titik ribuan
  const formatDisplay = (raw) => {
    const digits = String(raw).replace(/\D/g, '');
    if (!digits) return '';
    return Number(digits).toLocaleString('id-ID');
  };

  const handleChange = (e) => {
    const raw = e.target.value.replace(/\D/g, ''); // Hapus semua non-digit
    onChange(raw); // Kembalikan angka murni
  };

  return (
    <input
      id={id}
      type="text"
      inputMode="numeric"
      required={required}
      value={formatDisplay(value)}
      onChange={handleChange}
      onInvalid={setIndonesianValidity}
      onInput={setIndonesianValidity}
      className={className}
      placeholder={placeholder}
    />
  );
};

export default CurrencyInput;
