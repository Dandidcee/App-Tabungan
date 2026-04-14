import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

export const connectDB = async () => {
  try {
    // 1. Mencoba menyambung ke MongoDB lokal selama 2 detik
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 2000
    });
    console.log(`✅ MongoDB Asli Terhubung: ${conn.connection.host}`);
  } catch (error) {
    console.log(`⚠️ Gagal terhubung ke MongoDB asli (karena belum di-install).`);
    console.log(`🔄 Sistem mengalihkan otomatis ke Embedded MongoDB (Memory Server)...`);
    
    try {
      // 2. Jika gagal/tidak terinstall, langsung buat Database Embedded sementara
      const mongoServer = await MongoMemoryServer.create();
      const uri = mongoServer.getUri();
      
      await mongoose.connect(uri);
      console.log(`✅ Embedded MongoDB berjalan di alamat virtual: ${uri}`);
      console.log(`( ! ) MOHON DIPERHATIKAN: Karena Anda menggunakan 'Memory Server' (tidak menginstall/setting MongoDB beneran), maka SEMUA DATA TABUNGAN AKAN HILANG setiap kali Anda mematikan backend terminal. Untuk simpan permanen, pastikan install MongoDB kelak.`);
    } catch (embeddedErr) {
      console.error(`Gagal membuat Embedded MongoDB: ${embeddedErr.message}`);
      process.exit(1);
    }
  }
};
