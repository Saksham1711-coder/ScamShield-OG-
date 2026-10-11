package com.example.scamshield;

import android.Manifest;
import android.app.Activity;
import android.content.pm.PackageManager;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.os.Bundle;
import android.net.Uri;
import android.view.View;
import android.view.WindowInsets;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.Collections;

/** Dependency-free wrapper. Only four explicitly allowed bundled assets are served. */
public final class MainActivity extends Activity {
    private static final String HOST = "appassets.androidplatform.net";
    private static final String START = "https://" + HOST + "/index.html";
    private WebView web;
    private PermissionRequest pendingCamera;

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        web = new WebView(this);
        web.setBackgroundColor(0xFFF4F6F2);
        setContentView(web);
        // Keep controls out of system bars on Android 15's enforced edge-to-edge window.
        web.setOnApplyWindowInsetsListener((view, insets) -> {
            if (android.os.Build.VERSION.SDK_INT >= 30) {
                android.graphics.Insets bars = insets.getInsets(WindowInsets.Type.systemBars() | WindowInsets.Type.displayCutout() | WindowInsets.Type.ime());
                view.setPadding(bars.left, bars.top, bars.right, bars.bottom);
            } else {
                view.setPadding(insets.getSystemWindowInsetLeft(), insets.getSystemWindowInsetTop(), insets.getSystemWindowInsetRight(), insets.getSystemWindowInsetBottom());
            }
            return insets;
        });
        web.requestApplyInsets();
        WebSettings settings = web.getSettings();
        settings.setJavaScriptEnabled(true); // Only packaged app scripts execute.
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);
        settings.setSupportMultipleWindows(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        web.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return !isLocal(request.getUrl());
            }
            @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if (!isLocal(uri)) return blocked();
                String path = uri.getPath();
                String asset;
                String mime;
                switch (path == null ? "" : path) {
                    case "/index.html": asset = "index.html"; mime = "text/html"; break;
                    case "/styles.css": asset = "styles.css"; mime = "text/css"; break;
                    case "/engine.js": asset = "engine.js"; mime = "application/javascript"; break;
                    case "/jsqr.js": asset = "jsqr.js"; mime = "application/javascript"; break;
                    case "/app.js": asset = "app.js"; mime = "application/javascript"; break;
                    default: return blocked();
                }
                try {
                    return new WebResourceResponse(mime, "UTF-8", 200, "OK", Collections.singletonMap("Cache-Control", "no-store"), getAssets().open("web/" + asset));
                } catch (IOException error) { return blocked(); }
            }
        });
        // Camera for QR scanning: only our own local origin, video only, after the user allows it.
        web.setWebChromeClient(new WebChromeClient() {
            @Override public void onPermissionRequest(PermissionRequest request) {
                boolean videoOnly = request.getResources().length == 1 && PermissionRequest.RESOURCE_VIDEO_CAPTURE.equals(request.getResources()[0]);
                if (!HOST.equals(request.getOrigin().getHost()) || !videoOnly) { request.deny(); return; }
                if (checkSelfPermission(Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED) request.grant(request.getResources());
                else { pendingCamera = request; requestPermissions(new String[]{Manifest.permission.CAMERA}, 7); }
            }
        });
        web.loadUrl(START);
    }
    @Override public void onRequestPermissionsResult(int code, String[] perms, int[] results) {
        if (pendingCamera != null) {
            if (results.length > 0 && results[0] == PackageManager.PERMISSION_GRANTED) pendingCamera.grant(pendingCamera.getResources()); else pendingCamera.deny();
            pendingCamera = null;
        }
    }
    private static boolean isLocal(Uri uri) {
        return "https".equals(uri.getScheme()) && HOST.equals(uri.getHost()) && uri.getPort() == -1;
    }
    private static WebResourceResponse blocked() {
        return new WebResourceResponse("text/plain", "UTF-8", 403, "Blocked", Collections.emptyMap(), new ByteArrayInputStream(new byte[0]));
    }
    @Override public void onBackPressed() {
        web.evaluateJavascript("(function(){var d=document.getElementById('modal');if(d&&d.open){d.close();return true;}return false;})()", result -> {
            if (!"true".equals(result)) { if (web.canGoBack()) web.goBack(); else finish(); }
        });
    }
    @Override protected void onDestroy() {
        if (web != null) { web.stopLoading(); web.destroy(); web = null; }
        super.onDestroy();
    }
}
