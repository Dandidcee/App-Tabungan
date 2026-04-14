/**
 * Menambahkan pesan validasi kustom bahasa Indonesia ke elemen input.
 * Gunakan pada onInvalid dan onInput.
 */
export const setIndonesianValidity = (e) => {
  if (e.type === 'invalid') {
    e.target.setCustomValidity('Bidang ini wajib diisi');
  } else {
    e.target.setCustomValidity('');
  }
};
