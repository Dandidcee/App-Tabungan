import { LocalNotifications } from '@capacitor/local-notifications';

let notifIdCounter = 1;
let permissionGranted = false;
let channelCreated = false;

/**
 * Minta izin notifikasi dari user (perlu dipanggil sekali saat login)
 */
export const requestNotificationPermission = async () => {
  try {
    const { display } = await LocalNotifications.requestPermissions();
    permissionGranted = display === 'granted';
    
    // Buat channel notifikasi untuk Android (agar bisa melayang/heads-up)
    if (permissionGranted && !channelCreated) {
      try {
        await LocalNotifications.createChannel({
          id: 'tabungan_heads_up',
          name: 'Tabungan Alerts',
          description: 'Pemberitahuan transaksi secara real-time',
          importance: 5, // 5 = MAX (menjamin muncul heads-up / mengambang)
          visibility: 1, // 1 = PUBLIC (muncul di lockscreen)
          vibration: true,
        });
        channelCreated = true;
      } catch (err) {
        // Abaikan jika bukan platform native
      }
    }
    
    return permissionGranted;
  } catch (e) {
    // Bukan Android / Capacitor tidak tersedia di web
    return false;
  }
};

/**
 * Kirim notifikasi native ke notification center Android
 * @param {string} title - Judul notifikasi
 * @param {string} body  - Isi pesan notifikasi
 */
export const sendNativeNotification = async (title, body) => {
  try {
    if (!permissionGranted) {
      const granted = await requestNotificationPermission();
      if (!granted) return;
    }
    await LocalNotifications.schedule({
      notifications: [
        {
          id: notifIdCounter++,
          title,
          body,
          schedule: { at: new Date(Date.now() + 100) }, // langsung dalam 100ms
          sound: 'default',
          smallIcon: 'ic_launcher',
          iconColor: '#f43f5e',
          channelId: 'tabungan_heads_up', // Gunakan channel dengan importance MAX
        },
      ],
    });
  } catch (e) {
    // Silently fail di browser / web
  }
};
