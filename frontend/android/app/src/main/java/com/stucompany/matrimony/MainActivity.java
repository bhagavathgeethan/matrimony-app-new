package com.stucompany.matrimony;

import android.graphics.Color;
import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup.MarginLayoutParams;
import androidx.activity.OnBackPressedCallback;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Android 15+ draws apps edge to edge: without this the status bar sits on top of the app and the
        // keyboard covers bottom sheets and the chat box. Keep the web view clear of the system bars and,
        // while it is open, the keyboard.
        getWindow().getDecorView().setBackgroundColor(Color.parseColor("#FBF7F1"));
        WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView()).setAppearanceLightStatusBars(true);
        View webView = getBridge().getWebView();
        // Wine behind the page while it loads, matching the splash, instead of a white flash
        webView.setBackgroundColor(Color.parseColor("#3A0B18"));
        ViewCompat.setOnApplyWindowInsetsListener(webView, (v, windowInsets) -> {
            Insets bars = windowInsets.getInsets(WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout());
            Insets ime = windowInsets.getInsets(WindowInsetsCompat.Type.ime());
            MarginLayoutParams mlp = (MarginLayoutParams) v.getLayoutParams();
            mlp.leftMargin = bars.left;
            mlp.topMargin = bars.top;
            mlp.rightMargin = bars.right;
            mlp.bottomMargin = Math.max(bars.bottom, ime.bottom);
            v.setLayoutParams(mlp);
            return WindowInsetsCompat.CONSUMED;
        });

        // Back closes the open sheet or goes to the previous screen (see src/services/backButton.js);
        // when the app has nowhere to go back to, it moves to the background instead of closing.
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                getBridge().getWebView().evaluateJavascript(
                    "(window.__sangamBack && window.__sangamBack()) ? 'handled' : 'none'",
                    (result) -> {
                        if (!"\"handled\"".equals(result)) moveTaskToBack(true);
                    }
                );
            }
        });
    }
}
