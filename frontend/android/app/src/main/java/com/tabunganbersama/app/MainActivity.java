package com.tabunganbersama.app;

import android.os.Build;
import android.os.Bundle;
import android.view.Window;
import android.view.WindowManager;

import androidx.core.view.WindowCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // ── Edge-to-edge fullscreen: set SEBELUM super.onCreate ──
        Window window = getWindow();

        // Hapus FLAG_TRANSLUCENT legacy
        window.clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS);
        window.clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_NAVIGATION);

        // Status bar & nav bar transparan total
        window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);

        // Transparan penuh (API 21+)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            window.setStatusBarColor(android.graphics.Color.TRANSPARENT);
            window.setNavigationBarColor(android.graphics.Color.TRANSPARENT);
        }

        super.onCreate(savedInstanceState);

        // WindowCompat: insets layout extend ke system bar (status & nav)
        WindowCompat.setDecorFitsSystemWindows(window, false);
    }
}
